from flask import Blueprint, request
from tools.format_output import format_output
from config import get_dataset_path
import os
from glob import glob
import yaml
from pathlib import Path
import time
import shutil
import zipfile
import json
from IDataset.process_annotation_projects import (
    get_projects_name as ls_get_projects_name,
    build_yolo_dataset_from_label_studio,
)


IDataset_bp = Blueprint('IDataset', __name__)

def count_images_and_labels(root_path, image_dir, label_dir):
    """
    统计 YOLO 格式下的图片数量和标签数量（跨平台兼容）
    """
    root_path = Path(root_path)
    image_dir = root_path / image_dir
    label_dir = root_path / label_dir

    image_paths = list(image_dir.glob("*.jpg")) + \
                  list(image_dir.glob("*.png")) + \
                  list(image_dir.glob("*.jpeg")) + \
                  list(image_dir.glob("*.webp"))

    num_labels = 0
    for image_path in image_paths:
        label_path = label_dir / (image_path.stem + ".txt")
        if label_path.exists():
            with open(label_path, "r", encoding="utf-8") as f:
                lines = f.readlines()
                num_labels += len(lines)

    return len(image_paths), num_labels

def count_images(image_dir):
    return len(glob(os.path.join(image_dir, "*.jpg")) + glob(os.path.join(image_dir, "*.png")) + glob(os.path.join(image_dir, "*.jpeg")) + glob(os.path.join(image_dir, "*.webp")))

def count_annotations_in_coco(json_path):
    if not os.path.exists(json_path):
        return 0
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return len(data.get("annotations", []))

def load_dataset_yoloinfofile(dataset_path, yaml_path, dataset_type):
    """
    加载数据集的yaml文件，支持 YOLO 和 COCO
    """
    with open(yaml_path, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)

    root_path = str(data.get("path", Path(yaml_path).parent)) 
    train_path = str(data["train"])
    val_path = str(data["val"])
    test_path = str(data.get("test", ""))
    class_names = data.get("names", [])
    num_classes = data.get("nc", len(class_names))
    download_url_or_script = data.get("download", "")

    if dataset_type.upper() == "YOLO":
        train_img_count, train_label_count = count_images_and_labels(root_path, os.path.join(dataset_path, train_path), train_path.replace("/images", "/labels"))
    elif dataset_type.upper() == "COCO":
        train_img_count = count_images(os.path.join(dataset_path, train_path))
        ann_file = os.path.join(Path(train_path).parent.parent, "annotations", "instances_train.json")
        train_label_count = count_annotations_in_coco(ann_file)
    else:
        train_img_count, train_label_count = 0, 0

    return {
        "root_path": root_path,
        "train_path": train_path,
        "val_path": val_path,
        "test_path": test_path,
        "class_names": class_names,
        "num_classes": num_classes,
        "train_img_count": train_img_count,
        "train_label_count": train_label_count,
        "download_url_or_script": download_url_or_script
    }

def load_dataset_platforminfofile(info_file):
    """
    加载平台 info 文件
    """
    with open(info_file, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)
    
    return {
        "name": data.get("name", "Unknown"),
        "description": data.get("description", ""),
        "version": data.get("version", "Unknown"),
        "author": data.get("author", "Unknown"),
        "type": data.get("type", "YOLO"),
        "created_at": data.get("created_at", ""),
        "yaml_file_path": data.get("yaml_file_path", None)
    }
    
def extract_zip_flat(zip_path, extract_to):
    """
    将 zip 文件中的所有内容解压到指定目录，并移除 zip 包中的第一层目录
    """
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        members = zip_ref.namelist()

        for member in members:
            if member.endswith("/"):
                continue

            parts = Path(member).parts
            member_path = Path(*parts[1:])  # 移除第一层目录
            target_path = Path(extract_to) / member_path
            os.makedirs(target_path.parent, exist_ok=True)
            with zip_ref.open(member) as source, open(target_path, 'wb') as target:
                target.write(source.read())
        
@IDataset_bp.route('/getAllDatasets')
def get_all_datasets():
    """
    获取所有数据集，支持 YOLO / COCO 格式
    """
    dataset_path = get_dataset_path()

    datasets = []
    for item in os.listdir(dataset_path):
        item_path = os.path.join(dataset_path, item)
        
        if os.path.isdir(item_path):
            # 获取平台Info文件
            info_file = os.path.join(item_path, "yolo_training_visualization_info.yaml")
            
            if os.path.exists(info_file):
                info_file_data = load_dataset_platforminfofile(info_file)
                dataset_type = info_file_data.get("type", "YOLO")
                
                yolo_yaml_file = os.path.join(item_path, info_file_data["yaml_file_path"])
                if os.path.exists(yolo_yaml_file):
                    yaml_info = load_dataset_yoloinfofile(item_path, yolo_yaml_file, dataset_type)
                    dataset_info = {
                        "name": item,
                        "path": item_path,
                        "platform_info": info_file_data,
                        "yaml_info": yaml_info
                    }
                    datasets.append(dataset_info)
    
    return format_output(data={"datasets": datasets})

@IDataset_bp.route('/uploadDataset', methods=["POST"])
def upload_dataset():
    """
    创建新数据集
    """
    dataset_path = get_dataset_path()

    file = request.files.get("file")
    if not file:
        return format_output(code=400, msg="未上传文件")

    name = request.form.get("name", None)
    description = request.form.get("description", "")
    version = request.form.get("version", "v1.0.0")
    dataset_type = request.form.get("type", None)
    include_yaml = request.form.get("include_yaml", None)
    
    if name == None or dataset_type == None or include_yaml == None:
        return format_output(code=400, msg="缺少必要的参数")
    
    include_yaml = (include_yaml == "1")

    save_dir = os.path.join(dataset_path, f"{name}_{version}")
    print(save_dir)
    if os.path.exists(save_dir) and os.listdir(save_dir):
        return format_output(code=400, msg=f"名为 '{name}' 且版本为 '{version}' 的数据集已存在，请更换名称或版本。")

    os.makedirs(save_dir, exist_ok=True)

    # 保存压缩包
    zip_path = os.path.join(save_dir, file.filename)
    file.save(zip_path)

    # 解压文件
    extract_zip_flat(zip_path, save_dir)
    
    # 删除文件
    os.remove(zip_path)

    yaml_path = ""
    if include_yaml:
        # 自动搜索 yaml 文件
        for root, dirs, files in os.walk(save_dir):
            for f in files:
                if f.endswith(".yaml") and "info" not in f and not f.startswith("._"):
                    yaml_path = os.path.relpath(os.path.join(root, f), save_dir)
                    break
        if not yaml_path:
            return format_output(code=400, msg="未在压缩包中找到 YAML 文件")
    else:
        # 用户手动填写
        train = request.form.get("train", "")
        val = request.form.get("val", "")
        test = request.form.get("test", "")
        nc = int(request.form.get("nc", "1"))
        names = request.form.get("names", "").split(",")

        yaml_data = {
            "train": train,
            "val": val,
            "test": test if test else None,
            "nc": nc,
            "names": names
        }

        yaml_path = "dataset.yaml"
        with open(os.path.join(save_dir, yaml_path), "w", encoding="utf-8") as f:
            yaml.safe_dump(yaml_data, f, allow_unicode=True)

    # 平台 Info 文件
    info_data = {
        "name": name,
        "description": description,
        "version": version,
        "author": "unknown",
        "created_at": int(time.time()),
        "type": dataset_type,
        "yaml_file_path": yaml_path
    }
    with open(os.path.join(save_dir, "yolo_training_visualization_info.yaml"), "w", encoding="utf-8") as f:
        yaml.safe_dump(info_data, f, allow_unicode=True)
        
    return format_output(msg="数据集上传成功")

@IDataset_bp.route("/deleteDataset", methods=['POST'])
def delete_dataset():
    """
    删除一个数据集
    """
    path = request.json.get("path", None)
    if path == None:
        return format_output(code=400, msg="缺少必要的参数")
    
    try:
        shutil.rmtree(path)
    except OSError as e:
        print(f"删除文件夹 '{path}' 失败: {e}")
        return format_output(code=500, msg="删除失败")
    
    return format_output(msg="删除成功")

# -----------------------------
# Label Studio Integration APIs
# -----------------------------

@IDataset_bp.route('/listLabelStudioProjects', methods=["GET"])
def list_label_studio_projects():
    """
    列出 Label Studio 的项目列表。

    Query 参数：
    - base_url: Label Studio 服务地址，如 http://127.0.0.1:8080
    - token: Label Studio API Token（可选，如果服务未启用鉴权可不传）
    """
    base_url = request.args.get("base_url", "")
    token = request.args.get("token", "")
    if not base_url:
        return format_output(code=400, msg="缺少必要的参数 base_url")
    try:
        mapping = ls_get_projects_name(base_url=base_url, token=token)
        # 转换为列表形式，便于前端展示
        projects = [{"title": k, "id": v} for k, v in mapping.items()]
        return format_output(data={"projects": projects})
    except Exception as e:
        return format_output(code=500, msg=f"获取 Label Studio 项目失败: {e}")


@IDataset_bp.route('/buildDatasetFromLabelStudio', methods=["POST"])
def build_dataset_from_label_studio():
    """
    从 Label Studio 指定项目拉取标注，构建 YOLO 数据集并注册到平台。

    Body JSON：
    - base_url: Label Studio 服务地址（必填）
    - token: Label Studio API Token（可选）
    - project_id: 要导出的项目 ID（必填）
    - name: 数据集名称（必填）
    - version: 版本号，如 v1.0.0（必填）
    - description: 描述（可选）
    - exportType: 导出类型，默认 CSV（可选）
    - splits: 划分比例，形如 [0.8, 0.2, 0.0]（可选）
    - seed: 随机种子，默认 42（可选）
    - download_images: 是否下载图片，默认 True（可选）
    - class_names: 指定类别名列表，若不传则从数据推断（可选）
    """
    data = request.get_json(silent=True) or {}
    base_url = data.get("base_url", "")
    token = data.get("token", "")
    project_id = data.get("project_id")
    name = data.get("name")
    version = data.get("version")
    description = data.get("description", "")
    export_type = data.get("exportType", "CSV")
    splits = data.get("splits", [0.8, 0.2, 0.0])
    seed = int(data.get("seed", 42))
    download_images = bool(data.get("download_images", True))
    class_names = data.get("class_names", None)

    if not base_url or project_id is None or not name or not version:
        return format_output(code=400, msg="缺少必要的参数 base_url / project_id / name / version")

    # 输出目录：用户数据集根目录下 name_version
    dataset_root = get_dataset_path()
    save_dir = os.path.join(dataset_root, f"{name}_{version}")
    if os.path.exists(save_dir) and os.listdir(save_dir):
        return format_output(code=400, msg=f"名为 '{name}' 且版本为 '{version}' 的数据集已存在，请更换名称或版本。")
    os.makedirs(save_dir, exist_ok=True)

    try:
        # 构建数据集，返回 dataset.yaml 的路径
        dataset_yaml = build_yolo_dataset_from_label_studio(
            project_id=int(project_id),
            out_dir=save_dir,
            exportType=export_type,
            splits=tuple(splits) if isinstance(splits, (list, tuple)) else (0.8, 0.2, 0.0),
            seed=seed,
            download_images=download_images,
            class_names=class_names,
            base_url=base_url,
            token=token,
        )

        # 写平台信息文件
        info_data = {
            "name": name,
            "description": description,
            "version": version,
            "author": "unknown",
            "created_at": int(time.time()),
            "type": "YOLO",
            "yaml_file_path": os.path.relpath(dataset_yaml, save_dir)
        }
        with open(os.path.join(save_dir, "yolo_training_visualization_info.yaml"), "w", encoding="utf-8") as f:
            yaml.safe_dump(info_data, f, allow_unicode=True)

        return format_output(msg="数据集构建成功", data={
            "name": name,
            "path": save_dir,
            "yaml_file_path": info_data["yaml_file_path"],
        })
    except Exception as e:
        # 若失败且目录为空可清理
        try:
            if os.path.exists(save_dir) and not os.listdir(save_dir):
                shutil.rmtree(save_dir)
        except Exception:
            pass
        return format_output(code=500, msg=f"构建数据集失败: {e}")