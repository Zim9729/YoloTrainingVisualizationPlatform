from ultralytics import YOLO
from stream_to_logger import StreamToLogger
import logging
import sys
import os
import yaml
import time
import json
from collections.abc import Mapping, Sequence


def _to_plain_python(obj):
    """
    将可能包含 numpy / torch 等对象的结构转换为纯 Python 基本类型，便于 yaml.safe_dump / json 序列化。
    """
    # Lazy imports to avoid hard deps
    np = None
    torch = None
    try:
        import numpy as _np  # type: ignore
        np = _np
    except Exception:
        pass
    try:
        import torch as _torch  # type: ignore
        torch = _torch
    except Exception:
        pass

    # 1) 基础标量
    if isinstance(obj, (str, int, float, bool)) or obj is None:
        return obj

    # 2) numpy 标量
    if np is not None and isinstance(obj, np.generic):
        try:
            return obj.item()
        except Exception:
            # 兜底转为 float 或字符串
            try:
                return float(obj)
            except Exception:
                return str(obj)

    # 3) torch 张量
    if torch is not None:
        # 0-dim tensor -> 标量
        if isinstance(obj, torch.Tensor):
            try:
                if obj.ndim == 0:
                    return _to_plain_python(obj.item())
                else:
                    return _to_plain_python(obj.detach().cpu().tolist())
            except Exception:
                try:
                    return _to_plain_python(obj.tolist())
                except Exception:
                    return str(obj)

    # 4) numpy 数组（放在序列判断前，避免走到通用序列分支）
    if np is not None:
        try:
            if isinstance(obj, np.ndarray):
                return _to_plain_python(obj.tolist())
        except Exception:
            pass

    # 5) 映射类型
    if isinstance(obj, Mapping):
        try:
            return { str(k): _to_plain_python(v) for k, v in obj.items() }
        except Exception:
            # 尽量逐项转换，失败则字符串化
            out = {}
            for k, v in list(getattr(obj, 'items', lambda: [])()):
                try:
                    out[str(k)] = _to_plain_python(v)
                except Exception:
                    out[str(k)] = str(v)
            return out

    # 6) 序列（但排除字节/字符串）
    if isinstance(obj, Sequence) and not isinstance(obj, (str, bytes, bytearray)):
        try:
            return [_to_plain_python(x) for x in obj]
        except Exception:
            # 逐个元素兜底
            out_list = []
            for x in obj:
                try:
                    out_list.append(_to_plain_python(x))
                except Exception:
                    out_list.append(str(x))
            return out_list

    # 7) 其他可转换为 float 的对象
    try:
        return float(obj)
    except Exception:
        # 最后兜底转字符串
        return str(obj)


def validate_model(model_path, dataset_yaml_path, output_dir, result_file_path, logger=None, task_id=None):
    if logger is None:
        logger = logging.getLogger("default")
        logger.setLevel(logging.INFO)
        handler = logging.StreamHandler()
        handler.setFormatter(logging.Formatter("[%(asctime)s] %(message)s"))
        logger.addHandler(handler)

    if task_id is None:
        logger.info("未获取到Task ID")
        sys.exit(1)

    if result_file_path is None:
        logger.info("未获取到Validation Result File Path")
        sys.exit(1)

    log_cache = []

    stdout_backup = sys.stdout
    stderr_backup = sys.stderr
    sys.stdout = StreamToLogger(logger, logging.INFO, log_cache=log_cache)
    sys.stderr = StreamToLogger(logger, logging.ERROR, log_cache=log_cache)

    logger.info("[INFO] 启动验证任务...")

    try:
        model = YOLO(model_path)
        # 覆盖模型类名，确保绘图（包括混淆矩阵）使用数据集类别名
        save_json_flag = True  # 默认导出 JSON
        plots_flag = True      # 默认生成图表
        class_mismatch = False
        ds_names_list = None
        try:
            if isinstance(dataset_yaml_path, str) and os.path.exists(dataset_yaml_path):
                with open(dataset_yaml_path, 'r', encoding='utf-8') as f_yaml_for_names:
                    ds_yaml_for_names = yaml.safe_load(f_yaml_for_names) or {}
                ds_names = ds_yaml_for_names.get('names', None)
                names_dict = None
                if isinstance(ds_names, list):
                    ds_names_list = list(ds_names)
                    names_dict = {i: n for i, n in enumerate(ds_names)}
                elif isinstance(ds_names, dict):
                    names_dict = ds_names
                    # 尝试转为有序列表
                    try:
                        ds_names_list = [names_dict[i] for i in range(len(names_dict))]
                    except Exception:
                        ds_names_list = list(names_dict.values())
                if names_dict:
                    try:
                        model.names = names_dict  # 优先设置高级封装属性
                    except Exception:
                        pass
                    try:
                        # 同时尝试设置底层模型属性，增强兼容性
                        if hasattr(model, 'model') and hasattr(model.model, 'names'):
                            model.model.names = names_dict
                    except Exception:
                        pass
                # 如果数据集类别数与模型类别数不一致，禁用 save_json 以避免内部 class_map 越界
                try:
                    model_nc = None
                    if hasattr(model, 'model') and hasattr(model.model, 'nc'):
                        model_nc = int(model.model.nc)
                    elif hasattr(model, 'names') and isinstance(model.names, (dict, list)):
                        model_nc = len(model.names)
                    ds_nc = len(ds_names_list) if isinstance(ds_names_list, list) else None
                    if isinstance(model_nc, int) and isinstance(ds_nc, int) and model_nc != ds_nc:
                        class_mismatch = True
                        save_json_flag = False
                        plots_flag = False  # 避免 ConfusionMatrix 在内部以数据集类别数构建矩阵时越界
                        logger.warning(f"[WARN] 模型类别数({model_nc})与数据集类别数({ds_nc})不一致，已禁用 save_json 与图表绘制以避免崩溃。")
                except Exception:
                    pass
        except Exception:
            # 如果无法覆盖，不影响验证流程
            pass

        # Run validation
        metrics = model.val(
            data=dataset_yaml_path,
            project=output_dir,
            name="result",
            save_json=save_json_flag,
            plots=plots_flag,
        )
    finally:
        sys.stdout = stdout_backup
        sys.stderr = stderr_backup

    logger.info("[INFO] 🎉 验证完成")

    completed_time = int(time.time())

    # 仅保留日志原文以便回放，不再从日志解析 per-class 表格

    result_info = {
        "completedAt": completed_time,
        "log": log_cache
    }

    # 若类别数不一致，记入结果，供前端展示友好提示
    try:
        if class_mismatch:
            result_info['class_mismatch'] = True
            # 写入简单的数量信息（若可用）
            try:
                result_info['dataset_nc'] = len(ds_names_list) if isinstance(ds_names_list, list) else None
            except Exception:
                pass
            try:
                if hasattr(model, 'model') and hasattr(model.model, 'nc'):
                    result_info['model_nc'] = int(model.model.nc)
                elif hasattr(model, 'names') and isinstance(model.names, (dict, list)):
                    result_info['model_nc'] = len(model.names)
            except Exception:
                pass
    except Exception:
        pass

    # Try to append simple metrics and per-class rows from metrics (preferred over parsing logs)
    try:
        # Overall metrics summary (dict)
        raw_metrics = None
        if hasattr(metrics, 'results_dict'):
            raw_metrics = getattr(metrics, 'results_dict')
        else:
            # Fallback minimal overall
            overall = {}
            try:
                if hasattr(metrics, 'box'):
                    if hasattr(metrics.box, 'map50'):
                        overall['mAP50'] = float(metrics.box.map50)
                    if hasattr(metrics.box, 'map'):
                        overall['mAP50_95'] = float(metrics.box.map)
                    if hasattr(metrics.box, 'mp'):
                        overall['P'] = float(metrics.box.mp)
                    if hasattr(metrics.box, 'mr'):
                        overall['R'] = float(metrics.box.mr)
            except Exception:
                pass
            if overall:
                raw_metrics = overall
        if raw_metrics is not None:
            result_info["metrics"] = _to_plain_python(raw_metrics)

        # Per-class rows
        per_class_rows_by_metrics = []
        try:
            # 1) 优先从数据集 YAML 中获取权威类别名顺序
            names_list = None
            # 预先准备基于数据集统计到的按类图片/实例数量
            images_per_class = None
            instances_per_class = None
            total_val_images = None
            try:
                if isinstance(dataset_yaml_path, str) and os.path.exists(dataset_yaml_path):
                    with open(dataset_yaml_path, 'r', encoding='utf-8') as f_yaml:
                        ds_yaml = yaml.safe_load(f_yaml) or {}
                    ds_names = ds_yaml.get('names', None)
                    # 解析 val 标签目录，统计每类图片数与实例数
                    try:
                        # root 默认为 yaml 所在目录
                        root_dir = ds_yaml.get('path')
                        if not root_dir:
                            root_dir = os.path.dirname(os.path.abspath(dataset_yaml_path))
                        val_path = ds_yaml.get('val')
                        if isinstance(val_path, str):
                            # 仅支持本地路径（相对或绝对）
                            if os.path.isabs(val_path):
                                images_dir = val_path
                            else:
                                images_dir = os.path.join(root_dir, val_path)
                            # 推导 labels 目录
                            labels_dir = images_dir.replace('/images', '/labels').replace('\\images', '\\labels')
                            if os.path.isdir(images_dir):
                                # 统计总图片数
                                exts = ('.jpg', '.jpeg', '.png', '.webp')
                                total_val_images = sum(1 for fn in os.listdir(images_dir) if fn.lower().endswith(exts))
                            # 统计每类实例与包含该类的图片数量
                            if ds_names is not None and os.path.isdir(labels_dir):
                                ncls_est = len(ds_names) if isinstance(ds_names, (list, dict)) else None
                                if isinstance(ncls_est, int) and ncls_est > 0:
                                    images_per_class = [0] * ncls_est
                                    instances_per_class = [0] * ncls_est
                                    # 遍历 labels 下所有 .txt
                                    for root_d, _, files in os.walk(labels_dir):
                                        for f in files:
                                            if not f.lower().endswith('.txt'):
                                                continue
                                            fpath = os.path.join(root_d, f)
                                            try:
                                                with open(fpath, 'r', encoding='utf-8') as lf:
                                                    lines = [ln.strip() for ln in lf.readlines() if ln.strip()]
                                            except Exception:
                                                lines = []
                                            # 按图片统计是否出现过该类
                                            has_class = set()
                                            for ln in lines:
                                                try:
                                                    cls_idx = int(ln.split()[0])
                                                except Exception:
                                                    continue
                                                if 0 <= cls_idx < ncls_est:
                                                    instances_per_class[cls_idx] += 1
                                                    has_class.add(cls_idx)
                                            for cls_idx in has_class:
                                                images_per_class[cls_idx] += 1
                    except Exception:
                        images_per_class = None
                        instances_per_class = None
                        total_val_images = None
                    # names 可以是 list 或 dict（id->name）
                    if isinstance(ds_names, dict):
                        try:
                            names_list = [ds_names[i] for i in range(len(ds_names))]
                        except Exception:
                            names_list = list(ds_names.values())
                    elif isinstance(ds_names, list):
                        names_list = ds_names
            except Exception:
                names_list = None

            # 2) 若数据集未提供，则回退到 metrics / model 的 names
            if names_list is None:
                names = None
                if hasattr(metrics, 'names') and isinstance(getattr(metrics, 'names'), (list, dict)):
                    names = getattr(metrics, 'names')
                elif 'names' in raw_metrics if isinstance(raw_metrics, dict) else False:
                    names = raw_metrics['names']
                # Fallback to model names
                try:
                    if names is None and hasattr(model, 'names'):
                        names = model.names
                except Exception:
                    pass

                if isinstance(names, dict):
                    try:
                        names_list = [names[i] for i in range(len(names))]
                    except Exception:
                        names_list = list(names.values())
                elif isinstance(names, list):
                    names_list = names

            ncls = len(names_list) if names_list else None

            # 3) 收集各类指标数组（不同版本字段名不同，做兼容）
            def _as_list(arr):
                try:
                    return list(arr) if arr is not None else None
                except Exception:
                    return None

            p_list = _as_list(getattr(metrics.box, 'p', None) if hasattr(metrics, 'box') else None)
            r_list = _as_list(getattr(metrics.box, 'r', None) if hasattr(metrics, 'box') else None)
            nt_list = _as_list(getattr(metrics.box, 'nt', None) if hasattr(metrics, 'box') else None)  # number of targets per class
            map50_list = None
            map5095_list = None

            for cand in ['maps', 'map50_per_class', 'ap50', 'ap50_per_class']:
                if hasattr(metrics, 'box') and hasattr(metrics.box, cand):
                    map50_list = _as_list(getattr(metrics.box, cand))
                    if map50_list:
                        break
            for cand in ['map_per_class', 'ap', 'ap_per_class']:
                if hasattr(metrics, 'box') and hasattr(metrics.box, cand):
                    map5095_list = _as_list(getattr(metrics.box, cand))
                    if map5095_list:
                        break

            # 4) 对齐长度（以类别数为准）
            def _norm_len(lst, L):
                if lst is None or L is None:
                    return lst
                if len(lst) > L:
                    return lst[:L]
                if len(lst) < L:
                    return lst + [None] * (L - len(lst))
                return lst

            if ncls:
                p_list = _norm_len(p_list, ncls)
                r_list = _norm_len(r_list, ncls)
                map50_list = _norm_len(map50_list, ncls)
                map5095_list = _norm_len(map5095_list, ncls)
                nt_list = _norm_len(nt_list, ncls)

            # 5) 生成行，严格按照 names_list 顺序输出，避免类别错位
            if names_list and (p_list or r_list or map50_list or map5095_list):
                for i, cname in enumerate(names_list):
                    row = {
                        'Class': cname,
                        'Images': None,
                        'Instances': None,
                    }
                    # 优先填充来自数据集的统计
                    try:
                        if images_per_class is not None and i < len(images_per_class):
                            row['Images'] = int(images_per_class[i])
                    except Exception:
                        pass
                    try:
                        if instances_per_class is not None and i < len(instances_per_class):
                            row['Instances'] = int(instances_per_class[i])
                    except Exception:
                        pass
                    if p_list and i < len(p_list):
                        try: row['P'] = float(p_list[i])
                        except Exception: row['P'] = p_list[i]
                    if r_list and i < len(r_list):
                        try: row['R'] = float(r_list[i])
                        except Exception: row['R'] = r_list[i]
                    # Derive F1 when possible
                    try:
                        if isinstance(row.get('P'), (int, float)) and isinstance(row.get('R'), (int, float)):
                            p_v, r_v = float(row['P']), float(row['R'])
                            denom = (p_v + r_v)
                            if denom > 0:
                                row['F1'] = 2 * p_v * r_v / denom
                    except Exception:
                        pass
                    if nt_list and i < len(nt_list):
                        try: row['Instances'] = int(nt_list[i])
                        except Exception: row['Instances'] = nt_list[i]
                    if map50_list and i < len(map50_list):
                        try: row['mAP50'] = float(map50_list[i])
                        except Exception: row['mAP50'] = map50_list[i]
                    if map5095_list and i < len(map5095_list):
                        try: row['mAP50_95'] = float(map5095_list[i])
                        except Exception: row['mAP50_95'] = map5095_list[i]
                    per_class_rows_by_metrics.append(row)

            # Add overall row 'all'
            overall_row = {'Class': 'all', 'Images': None, 'Instances': None}
            # 总图片/实例数（来自数据集统计）
            try:
                if total_val_images is not None:
                    overall_row['Images'] = int(total_val_images)
            except Exception:
                pass
            try:
                if instances_per_class is not None:
                    overall_row['Instances'] = int(sum(instances_per_class))
            except Exception:
                pass
            try:
                if hasattr(metrics, 'box'):
                    if hasattr(metrics.box, 'mp'):
                        overall_row['P'] = float(metrics.box.mp)
                    if hasattr(metrics.box, 'mr'):
                        overall_row['R'] = float(metrics.box.mr)
                    if hasattr(metrics.box, 'map50'):
                        overall_row['mAP50'] = float(metrics.box.map50)
                    if hasattr(metrics.box, 'map'):
                        overall_row['mAP50_95'] = float(metrics.box.map)
                    # Derive overall F1 when possible
                    try:
                        if isinstance(overall_row.get('P'), (int, float)) and isinstance(overall_row.get('R'), (int, float)):
                            p_v, r_v = float(overall_row['P']), float(overall_row['R'])
                            denom = (p_v + r_v)
                            if denom > 0:
                                overall_row['F1'] = 2 * p_v * r_v / denom
                    except Exception:
                        pass
            except Exception:
                pass
            # 仅在至少有一个字段时加入
            if any(k in overall_row for k in ['P','R','mAP50','mAP50_95']):
                per_class_rows_by_metrics.insert(0, overall_row)

        except Exception:
            per_class_rows_by_metrics = []

        if per_class_rows_by_metrics:
            result_info['per_class_rows'] = _to_plain_python(per_class_rows_by_metrics)
            # 同时持久化类别名，前端/后端后续可直接使用
            try:
                result_info['names'] = _to_plain_python([r['Class'] for r in per_class_rows_by_metrics if 'Class' in r and r['Class'] != 'all'])
            except Exception:
                pass
    except Exception:
        pass

    if os.path.exists(result_file_path):
        with open(result_file_path, 'r', encoding='utf-8') as f:
            existing_data = yaml.safe_load(f) or {}
    else:
        existing_data = {}

    existing_data.update(result_info)

    # 不从日志写入 per_class_table / per_class_rows；per_class_rows 由 metrics 生成

    # Ensure everything is JSON/YAML-safe
    safe_data = _to_plain_python(existing_data)

    # 可靠写入 YAML：若 safe_dump 仍失败，进行一次更严格的深度清洗后重试
    try:
        with open(result_file_path, 'w', encoding='utf-8') as f:
            yaml.safe_dump(safe_data, f, allow_unicode=True)
    except Exception:
        # 深度清洗（再次跑一遍，确保极端对象被强制转 str/float）
        def deep_sanitize(x):
            x = _to_plain_python(x)
            if isinstance(x, dict):
                return {str(k): deep_sanitize(v) for k, v in x.items()}
            if isinstance(x, list):
                return [deep_sanitize(v) for v in x]
            return x

        really_safe = deep_sanitize(safe_data)
        try:
            with open(result_file_path, 'w', encoding='utf-8') as f:
                yaml.safe_dump(really_safe, f, allow_unicode=True)
        except Exception:
            # 最终兜底：通过 JSON round-trip 强制转为原生可序列化类型
            def _json_default(o):
                try:
                    # 优先尝试转换为原生类型
                    return _to_plain_python(o)
                except Exception:
                    try:
                        return float(o)
                    except Exception:
                        return str(o)

            try:
                json_text = json.dumps(really_safe, ensure_ascii=False, default=_json_default)
                final_safe = json.loads(json_text)
            except Exception:
                # 如果依然失败，退化为将整个对象转字符串
                final_safe = str(really_safe)

            with open(result_file_path, 'w', encoding='utf-8') as f:
                yaml.safe_dump(final_safe, f, allow_unicode=True)
