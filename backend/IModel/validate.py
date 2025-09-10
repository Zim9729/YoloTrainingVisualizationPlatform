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
        # Run validation
        metrics = model.val(
            data=dataset_yaml_path,
            project=output_dir,
            name="result",
            save_json=True,
            plots=True,
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
            # Class names
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

            # Normalize names to list ordered by index
            names_list = None
            if isinstance(names, dict):
                try:
                    names_list = [names[i] for i in range(len(names))]
                except Exception:
                    names_list = list(names.values())
            elif isinstance(names, list):
                names_list = names

            ncls = len(names_list) if names_list else None

            # Collect per-class arrays from possible attributes
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

            # Common variants across versions
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

            # If lengths mismatch, try to trim/pad
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

            if names_list and (p_list or r_list or map50_list or map5095_list):
                for i, cname in enumerate(names_list):
                    row = {
                        'Class': cname,
                        'Images': None,
                        'Instances': None,
                    }
                    if p_list and i < len(p_list):
                        try: row['P'] = float(p_list[i])
                        except Exception: row['P'] = p_list[i]
                    if r_list and i < len(r_list):
                        try: row['R'] = float(r_list[i])
                        except Exception: row['R'] = r_list[i]
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
            except Exception:
                pass
            # 仅在至少有一个字段时加入
            if any(k in overall_row for k in ['P','R','mAP50','mAP50_95']):
                per_class_rows_by_metrics.insert(0, overall_row)

        except Exception:
            per_class_rows_by_metrics = []

        if per_class_rows_by_metrics:
            result_info['per_class_rows'] = _to_plain_python(per_class_rows_by_metrics)
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
