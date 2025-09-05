# from label_studio_sdk import Client,LabelStudio
import json
import os 
import io
import pandas as pd
import requests
from collections import Counter
import shutil
import random
import glob

# Allow configuring Label Studio via env vars as defaults
LS_BASE_URL_DEFAULT = os.environ.get("LS_BASE_URL", "")
LS_API_TOKEN_DEFAULT = os.environ.get("LS_API_TOKEN", "")

# 提取label-studio中项目名称与id
def _build_auth_header(token: str) -> dict:
    if not token:
        return {}
    if not token.lower().startswith("token "):
        token = f"Token {token}"
    return {"Authorization": token}


def get_projects_name(base_url: str = None, token: str = None):
    """
    获取 Label Studio 项目名称与 ID 的映射。
    """
    base_url = base_url or LS_BASE_URL_DEFAULT
    token = token or LS_API_TOKEN_DEFAULT
    if not base_url:
        raise ValueError("Label Studio base_url 未配置")
    params = {"page_size": 10000000}
    response = requests.get(f'{base_url.rstrip("/")}/api/projects/', headers=_build_auth_header(token), params=params)
    response.raise_for_status()
    res_json = response.json()
    result = {}
    for project in res_json.get('results', []):
        result[project['title']] = project['id']
    return result

def export_project_to_yolo(project_id: int, save_dir: str, exportType: str = "CSV", class_names=None, download_images: bool = True, base_url: str = None, token: str = None) -> None:
    """
    将 Label Studio 项目导出为 YOLO 标注格式。

    生成的目录结构：
      save_dir/
        ├─ images/*.jpg
        ├─ labels/*.txt
        └─ classes.txt

    每个 labels/*.txt 行格式：
      <class_id> <cx> <cy> <w> <h>  (均为 0~1 归一化)

    说明：实现基于 Label Studio 的 CSV 导出（row['object'] 为字符串表达的列表），
    其中 x/y/width/height 字段为百分比（0~100）。
    """
    if exportType.upper() != "CSV":
        raise NotImplementedError("当前仅支持 CSV 导出为 YOLO 格式")

    # 拉取导出数据
    params = {"exportType": exportType.upper()}
    base_url = base_url or LS_BASE_URL_DEFAULT
    token = token or LS_API_TOKEN_DEFAULT
    if not base_url:
        raise ValueError("Label Studio base_url 未配置")
    response = requests.get(
        f'{base_url.rstrip("/")}/api/projects/{project_id}/export',
        headers=_build_auth_header(token),
        params=params
    )

    # 准备输出目录
    images_dir = os.path.join(save_dir, "images")
    labels_dir = os.path.join(save_dir, "labels")
    os.makedirs(images_dir, exist_ok=True)
    os.makedirs(labels_dir, exist_ok=True)

    # 读取 CSV
    data_text = response.text
    df = pd.read_csv(io.StringIO(data_text))

    # 类别名称及映射
    if class_names is None:
        label_list = []
        for _, row in df.iterrows():
            if pd.isna(row.get("object")):
                continue
            try:
                objects = eval(row["object"])  # 字符串 -> 列表
                for obj in objects:
                    label = obj.get("rectanglelabels", [None])[0]
                    if label and label not in label_list:
                        label_list.append(label)
            except Exception:
                continue
        class_names = label_list

    label_to_id = {name: idx for idx, name in enumerate(class_names)}

    # 写出 classes.txt
    classes_txt = os.path.join(save_dir, "classes.txt")
    with open(classes_txt, "w", encoding="utf-8") as f:
        for name in class_names:
            f.write(f"{name}\n")

    # 逐图写出 YOLO 标签
    for _, row in df.iterrows():
        if pd.isna(row.get("object")):
            continue
        try:
            objects = eval(row["object"])  # list[dict]
            if not objects:
                continue

            # 文件主名
            pre_name = eval(row['image'])[0].rsplit('/', 1)[-1].split('.')[0]

            # 下载图片
            if download_images:
                try:
                    url = json.loads(row['image'])[0]
                    img_ext = os.path.splitext(url)[1]
                    if not img_ext:
                        img_ext = ".jpg"
                    img_path = os.path.join(images_dir, f"{pre_name}{img_ext}")
                    with open(img_path, "wb") as f:
                        f.write(requests.get(url).content)
                except Exception:
                    pass  # 下载失败不影响标签导出

            original_width = int(objects[0].get('original_width'))
            original_height = int(objects[0].get('original_height'))

            label_fp = os.path.join(labels_dir, f"{pre_name}.txt")
            lines = []
            for obj in objects:
                label = obj.get('rectanglelabels', [None])[0]
                if label is None or label not in label_to_id:
                    continue
                cls_id = label_to_id[label]

                # 百分比 -> 绝对像素
                x = float(obj.get('x')) / 100.0 * original_width
                y = float(obj.get('y')) / 100.0 * original_height
                w = float(obj.get('width')) / 100.0 * original_width
                h = float(obj.get('height')) / 100.0 * original_height

                # 转为 YOLO 归一化中心点与宽高
                cx = (x + w / 2.0) / original_width
                cy = (y + h / 2.0) / original_height
                nw = w / original_width
                nh = h / original_height

                # 裁剪范围到 [0,1]
                cx = min(max(cx, 0.0), 1.0)
                cy = min(max(cy, 0.0), 1.0)
                nw = min(max(nw, 0.0), 1.0)
                nh = min(max(nh, 0.0), 1.0)

                lines.append(f"{cls_id} {cx:.6f} {cy:.6f} {nw:.6f} {nh:.6f}")

            if lines:
                with open(label_fp, "w", encoding="utf-8") as f:
                    f.write("\n".join(lines))
        except Exception as e:
            print(f"导出 {row.get('image')} 失败: {e}")


def build_yolo_dataset_from_label_studio(
    project_id: int,
    out_dir: str,
    exportType: str = "CSV",
    splits: tuple = (0.8, 0.2, 0.0),  # (train, val, test)
    seed: int = 42,
    download_images: bool = True,
    class_names=None,
    base_url: str = None,
    token: str = None,
) -> str:
    """
    从 Label Studio 项目导入数据并构建 YOLO 数据集（含划分与 dataset.yaml）。

    目录结构：
      out_dir/
        ├─ images/
        │   ├─ train/
        │   ├─ val/
        │   └─ test/ (可选)
        ├─ labels/
        │   ├─ train/
        │   ├─ val/
        │   └─ test/ (可选)
        └─ dataset.yaml

    返回：dataset.yaml 的完整路径。
    """
    os.makedirs(out_dir, exist_ok=True)

    # 第一步：导出到临时目录（原始 YOLO 标注：images/, labels/, classes.txt）
    staging_dir = os.path.join(out_dir, "_yolo_staging")
    os.makedirs(staging_dir, exist_ok=True)
    export_project_to_yolo(
        project_id=project_id,
        save_dir=staging_dir,
        exportType=exportType,
        class_names=class_names,
        download_images=download_images,
        base_url=base_url,
        token=token,
    )

    # 读取类别
    classes_txt = os.path.join(staging_dir, "classes.txt")
    if not os.path.exists(classes_txt):
        raise RuntimeError("未找到 classes.txt，导出可能失败")
    with open(classes_txt, "r", encoding="utf-8") as f:
        names = [line.strip() for line in f.readlines() if line.strip()]

    # 收集样本（以 label 文件为准）
    staging_images = os.path.join(staging_dir, "images")
    staging_labels = os.path.join(staging_dir, "labels")
    label_files = sorted(glob.glob(os.path.join(staging_labels, "*.txt")))

    samples = []  # (image_path, label_path)
    for lf in label_files:
        base = os.path.splitext(os.path.basename(lf))[0]
        # 匹配图片（尝试常见扩展名）
        candidates = []
        for ext in (".jpg", ".jpeg", ".png", ".bmp", ".webp"):
            p = os.path.join(staging_images, base + ext)
            if os.path.exists(p):
                candidates.append(p)
        img_path = candidates[0] if candidates else None
        if img_path is None:
            # 再尝试通配符
            found = glob.glob(os.path.join(staging_images, base + ".*"))
            img_path = found[0] if found else None
        if img_path is None:
            # 没有图片则跳过
            continue
        samples.append((img_path, lf))

    # 划分数据集
    train_r, val_r, test_r = splits
    total = len(samples)
    if not (0.0 <= train_r <= 1.0 and 0.0 <= val_r <= 1.0 and 0.0 <= test_r <= 1.0):
        raise ValueError("splits 中的比例必须在 [0,1]")
    if abs((train_r + val_r + test_r) - 1.0) > 1e-6:
        raise ValueError("splits 三者之和必须为 1.0")

    random.seed(seed)
    random.shuffle(samples)
    n_train = int(total * train_r)
    n_val = int(total * val_r)
    train_set = samples[:n_train]
    val_set = samples[n_train:n_train + n_val]
    test_set = samples[n_train + n_val:]

    # 准备目标目录
    def _ensure_dirs(base_dir: str):
        os.makedirs(os.path.join(base_dir, "images", "train"), exist_ok=True)
        os.makedirs(os.path.join(base_dir, "images", "val"), exist_ok=True)
        os.makedirs(os.path.join(base_dir, "labels", "train"), exist_ok=True)
        os.makedirs(os.path.join(base_dir, "labels", "val"), exist_ok=True)
        os.makedirs(os.path.join(base_dir, "images", "test"), exist_ok=True)
        os.makedirs(os.path.join(base_dir, "labels", "test"), exist_ok=True)

    _ensure_dirs(out_dir)

    def _copy_pairs(pairs, split_name: str):
        for ip, lp in pairs:
            base = os.path.basename(lp).replace('.txt', '')
            img_ext = os.path.splitext(ip)[1]
            shutil.copy2(ip, os.path.join(out_dir, "images", split_name, f"{base}{img_ext}"))
            shutil.copy2(lp, os.path.join(out_dir, "labels", split_name, f"{base}.txt"))

    _copy_pairs(train_set, "train")
    _copy_pairs(val_set, "val")
    if test_set:
        _copy_pairs(test_set, "test")

    # 写 dataset.yaml
    dataset_yaml = os.path.join(out_dir, "dataset.yaml")
    has_test = len(test_set) > 0
    content_lines = []
    content_lines.append(f"path: {out_dir}")
    content_lines.append(f"train: images/train")
    content_lines.append(f"val: images/val")
    if has_test:
        content_lines.append(f"test: images/test")
    content_lines.append("")
    content_lines.append(f"nc: {len(names)}")
    # 写 names 数组（简单一行形式）
    joined = ", ".join([f"'{n}'" for n in names])
    content_lines.append(f"names: [{joined}]")
    with open(dataset_yaml, "w", encoding="utf-8") as f:
        f.write("\n".join(content_lines) + "\n")

    return dataset_yaml


if __name__ == '__main__':
    # 示例 CLI 用法（需要设置环境变量 LS_BASE_URL 和 LS_API_TOKEN）
    p_names = get_projects_name()
    p_names_key = list(p_names.keys())
    print(p_names_key)

    # 构建可直接训练的 YOLO 数据集（含 train/val/test 划分 和 dataset.yaml）
    default_out_dir = os.path.join('test', 'datasets_3')
    yaml_path = build_yolo_dataset_from_label_studio(
        project_id=p_names[p_names_key[0]],
        out_dir=default_out_dir,
        exportType='CSV',
        splits=(0.8, 0.2, 0.0),  # 调整为你需要的比例
        seed=42,
        download_images=True,
        class_names=None,
        base_url=os.getenv("LS_BASE_URL"),
        token=os.getenv("LS_API_TOKEN"),
    )
    print(f"YOLO 数据集已生成，配置文件: {yaml_path}")