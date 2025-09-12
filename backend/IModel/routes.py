from flask import request, Blueprint, send_file
from tools.format_output import format_output
from config import get_test_result_files_path, get_tasks_path, get_validation_result_files_path
from run_in_thread import run_modeltest_in_thread, run_modelval_in_thread, run_modelexport_in_thread
from IModel.validate import _to_plain_python
import os
import time
import yaml
import shutil
import re
import json
import base64
import mimetypes
from pathlib import Path
from .triton_integration import register_model_to_triton, list_triton_models, remove_triton_model

IModel_bp = Blueprint('IModel', __name__)

TEST_THREADS = {}
TEST_LIST = []
VAL_THREADS = {}
VAL_LIST = []
EXPORT_THREADS = {}

def get_test_result_file(task_id):
    """
    获取模型测试任务结果数据文件
    """
    matched_files = []
    pattern = re.compile(rf"^{re.escape(task_id)}_\d+\.yaml$")

    try:
        directory = get_test_result_files_path()
        for filename in os.listdir(directory):
            if pattern.match(filename):
                matched_files.append(os.path.join(directory, filename))
        return matched_files, False
    except Exception as e:
        return -1, e

def save_test_list():
    """
    保存测试任务列表
    """
    test_list_file_path = os.path.join(get_test_result_files_path(), "test_list.json")
    with open(test_list_file_path, "w", encoding="utf-8") as f:
        json.dump(TEST_LIST, f, ensure_ascii=False, indent=2)

def load_test_list():
    """
    加载测试任务列表
    """
    global TEST_LIST
    try:
        test_list_file_path = os.path.join(get_test_result_files_path(), "test_list.json")
        with open(test_list_file_path, "r", encoding="utf-8") as f:
            TEST_LIST = json.load(f)
    except FileNotFoundError:
        TEST_LIST = []

def save_val_list():
    """
    保存验证任务列表
    """
    val_list_file_path = os.path.join(get_validation_result_files_path(), "validation_list.json")
    with open(val_list_file_path, "w", encoding="utf-8") as f:
        json.dump(VAL_LIST, f, ensure_ascii=False, indent=2)

def load_val_list():
    """
    加载验证任务列表
    """
    global VAL_LIST
    try:
        val_list_file_path = os.path.join(get_validation_result_files_path(), "validation_list.json")
        with open(val_list_file_path, "r", encoding="utf-8") as f:
            VAL_LIST = json.load(f)
    except FileNotFoundError:
        VAL_LIST = []

@IModel_bp.route("/runModelTest", methods=['POST'])
def run_model_test():
    """
    启动模型测试任务
    """
    data = request.json
    task_id = data.get("taskID")
    task_name = data.get("taskName")
    output_dir = data.get("outputDir")
    input_type = data.get("inputType", "image") # image 或 video
    input_path = data.get("inputPath")
    model_choice = data.get("modelType", "best")

    if not task_id or not task_name or not output_dir or not input_path:
        return format_output(code=400, msg="缺少必要的参数(step:1)")
    
    timestamp = int(time.time())

    # 统一处理 output_dir，若末级目录为 "result"，取其父目录，确保跨平台兼容
    norm_output_dir = os.path.normpath(output_dir)
    base_output_dir = os.path.dirname(norm_output_dir) if os.path.basename(norm_output_dir) == "result" else norm_output_dir
    test_output_dir = os.path.join(base_output_dir, "test", f"test_{task_id}_{timestamp}_{model_choice}")
    os.makedirs(test_output_dir, exist_ok=True)
    
    try:
        input_filename = os.path.basename(input_path)
        
        input_file_target_path = os.path.join(test_output_dir, "t")
        os.makedirs(input_file_target_path, exist_ok=True)
        
        shutil.copy(input_path, os.path.join(input_file_target_path, input_filename))
    except Exception as e:
        return format_output(code=500, msg=f"获取测试文件时失败: {str(e)}")

    weight_file = f"{model_choice}.pt"
    weight_path = ""
    
    for root, dirs, files in os.walk(output_dir):
        if weight_file in files:
            weight_path = os.path.join(root, weight_file)
            break

    if not os.path.exists(weight_path):
        return format_output(code=404, msg=f"模型权重文件未找到: {model_choice}.pt, {weight_path}")
    
    try:
        print(f"启动训练任务: {task_id}")
        
        test_result_file_path = os.path.join(get_test_result_files_path(), f"{task_id}_{timestamp}.yaml")

        result_info = {
            "model_path": weight_path,
            "input_type": input_type,
            "input_path": os.path.join(input_file_target_path, input_filename),
            "output_dir": test_output_dir,
            "startedAt": timestamp,
            "completedAt": None,
            "log": None
        }
        
        with open(test_result_file_path, "w", encoding="utf-8") as f:
            yaml.dump(result_info, f, allow_unicode=True)
            
        thread, log_stream = run_modeltest_in_thread(task_id, weight_path, os.path.join(input_file_target_path, input_filename), test_output_dir, test_result_file_path, "image")
        
        # 保存
        TEST_THREADS[test_result_file_path] = {
            "thread": thread,
            "log": log_stream,
        }
        TEST_LIST.append({
            "task_id": task_id,
            "taskname": task_name,
            "filename": test_result_file_path
        })
        save_test_list()
    except Exception as e:
        print("启动测试任务失败:", e)
        return format_output(code=500, msg=f"启动测试任务失败: {str(e)}")

    return format_output(msg=f"任务 {task_id} 已启动", data={"output_dir": test_output_dir, "filename": test_result_file_path})

@IModel_bp.route("/getAllTest", methods=['GET'])
def get_all_test():
    """
    获取所有的测试任务
    """
    r_data = []
    task_id = request.args.get("taskID")
    
    if not task_id:
        return format_output(code=400, msg="缺少必要的参数(step:1)")
    
    matched_files, e = get_test_result_file(task_id)
    if e:
        return format_output(code=500, msg=f"获取文件数据时失败: {e}")
    
    for item in matched_files:
        with open(item, 'r', encoding='utf-8') as f:
            data = yaml.safe_load(f.read())
            data["__testResultFilePath"] = item
        
        try:
            result_dir = os.path.join(data["output_dir"], "result")
            data["result_file_path"] = None
            if os.path.isdir(result_dir):
                input_filename = os.path.basename(data["input_path"])
                result_file_path = os.path.join(result_dir, input_filename)

                for ext in [".jpg", ".png", ".jpeg", ".webp"]:
                    candidate = result_file_path
                    if not candidate.lower().endswith(ext):
                        base_name, _ = os.path.splitext(result_file_path)
                        candidate = base_name + ext
                    if os.path.exists(candidate):
                        data["result_file_path"] = candidate
                        break
        except Exception as e:
            data["result_file_path"] = None
            
        try:
            test_info = TEST_THREADS.get(item)
            is_running = test_info["thread"].is_alive()
            data["is_running"] = is_running
        except Exception as e:
            data["is_running"] = False
        
        data["task_id"] = task_id
            
        r_data.append(data)
    
    return format_output(data={
        "test": r_data
    })

@IModel_bp.route("/uploadTestInput", methods=['POST'])
def upload_test_input():
    """
    上传用于模型测试的输入文件（浏览器环境使用）
    Form-Data: file
    返回: { path: 保存后的绝对路径 }
    """
    try:
        file = request.files.get('file')
        if not file:
            return format_output(code=400, msg="未选择文件")

        # 保存到测试结果根目录下的 temp 文件夹
        base_dir = get_test_result_files_path()
        temp_dir = os.path.join(base_dir, 'temp')
        os.makedirs(temp_dir, exist_ok=True)

        # 生成不重复文件名
        ts = int(time.time())
        safe_name = re.sub(r"[^a-zA-Z0-9._-]", "_", file.filename)
        save_path = os.path.join(temp_dir, f"{ts}_{safe_name}")
        file.save(save_path)

        return format_output(msg="上传成功", data={"path": save_path})
    except Exception as e:
        return format_output(code=500, msg=f"上传失败: {e}")

@IModel_bp.route("/runModelValidation", methods=['POST'])
def run_model_validation():
    """
    启动模型验证任务（使用独立数据集 dataset.yaml）
    Body JSON: taskID, taskName, outputDir, datasetYamlPath, modelType
    """
    data = request.json
    task_id = data.get("taskID")
    task_name = data.get("taskName")
    output_dir = data.get("outputDir")
    dataset_yaml_path = data.get("datasetYamlPath")
    model_choice = data.get("modelType", "best")

    if not task_id or not task_name or not output_dir or not dataset_yaml_path:
        return format_output(code=400, msg="缺少必要的参数(step:1)")

    timestamp = int(time.time())

    # 统一处理 output_dir，若末级目录为 "result"，取其父目录
    norm_output_dir = os.path.normpath(output_dir)
    base_output_dir = os.path.dirname(norm_output_dir) if os.path.basename(norm_output_dir) == "result" else norm_output_dir
    val_output_dir = os.path.join(base_output_dir, "val", f"val_{task_id}_{timestamp}_{model_choice}")
    os.makedirs(val_output_dir, exist_ok=True)

    weight_file = f"{model_choice}.pt"
    weight_path = ""
    for root, dirs, files in os.walk(output_dir):
        if weight_file in files:
            weight_path = os.path.join(root, weight_file)
            break

    if not os.path.exists(weight_path):
        return format_output(code=404, msg=f"模型权重文件未找到: {model_choice}.pt, {weight_path}")

    if not os.path.exists(dataset_yaml_path):
        return format_output(code=404, msg=f"未找到指定的数据集配置文件: {dataset_yaml_path}")

    try:
        result_file_path = os.path.join(get_validation_result_files_path(), f"{task_id}_{timestamp}.yaml")
        result_info = {
            "model_path": weight_path,
            "dataset_yaml_path": dataset_yaml_path,
            "output_dir": val_output_dir,
            "startedAt": timestamp,
            "completedAt": None,
            "log": None
        }
        with open(result_file_path, "w", encoding="utf-8") as f:
            yaml.dump(result_info, f, allow_unicode=True)

        thread, log_stream = run_modelval_in_thread(task_id, weight_path, dataset_yaml_path, val_output_dir, result_file_path)

        VAL_THREADS[result_file_path] = {
            "thread": thread,
            "log": log_stream,
        }
        VAL_LIST.append({
            "task_id": task_id,
            "taskname": task_name,
            "filename": result_file_path
        })
        save_val_list()
    except Exception as e:
        print("启动验证任务失败:", e)
        return format_output(code=500, msg=f"启动验证任务失败: {str(e)}")

    return format_output(msg=f"任务 {task_id} 验证已启动", data={"output_dir": val_output_dir, "filename": result_file_path})

@IModel_bp.route("/getAllValidation", methods=['GET'])
def get_all_validation():
    """
    获取所有的验证任务（按 taskID 过滤）
    """
    r_data = []
    task_id = request.args.get("taskID")
    if not task_id:
        return format_output(code=400, msg="缺少必要的参数(step:1)")

    # 匹配结果文件
    matched_files = []
    pattern = re.compile(rf"^{re.escape(task_id)}_\d+\.yaml$")
    try:
        directory = get_validation_result_files_path()
        for filename in os.listdir(directory):
            if pattern.match(filename):
                matched_files.append(os.path.join(directory, filename))
    except Exception as e:
        return format_output(code=500, msg=f"获取文件数据时失败: {e}")

    for item in matched_files:
        # 1) 读取并解析 YAML
        with open(item, 'r', encoding='utf-8') as f:
            content = f.read()
        try:
            parsed = yaml.safe_load(content)
        except Exception:
            # 兼容历史文件中包含的 numpy 等 Python 特殊标签
            parsed = yaml.unsafe_load(content)

        # 2) 转换为纯 Python 类型
        parsed = _to_plain_python(parsed)

        # 3) 确保为字典，若不是则包一层，避免后续赋值时报错
        if not isinstance(parsed, dict):
            parsed = {"data": parsed}

        # 基本字段
        parsed["__valResultFilePath"] = item
        parsed["task_id"] = task_id

        # 4) 线程运行状态（VAL_THREADS 中可能没有该项或值为 None，都视为不在运行）
        val_info = VAL_THREADS.get(item)
        is_running = False
        try:
            if val_info and "thread" in val_info and val_info["thread"] is not None:
                is_running = bool(val_info["thread"].is_alive())
        except Exception:
            is_running = False
        parsed["is_running"] = is_running

        # 5) 探测常见验证产物图（如混淆矩阵、PR/F1 曲线、总结果图等）
        try:
            plots = {}
            output_dir = parsed.get("output_dir")
            if output_dir:
                result_dir = os.path.join(output_dir, "result")
                if os.path.isdir(result_dir):
                    candidates = {
                        "confusion_matrix": [
                            "confusion_matrix.png",
                            "confusion_matrix.jpg",
                            "confusion_matrix.jpeg",
                            "confusion_matrix_normalized.png",
                            "confusion_matrix_normalized.jpg",
                        ],
                        "results": ["results.png", "results.jpg"],
                        "pr_curve": ["PR_curve.png", "PR_curve.jpg"],
                        "f1_curve": ["F1_curve.png", "F1_curve.jpg"],
                        "p_curve": ["P_curve.png", "P_curve.jpg"],
                        "r_curve": ["R_curve.png", "R_curve.jpg"],
                    }
                    for key, names in candidates.items():
                        for name in names:
                            fp = os.path.join(result_dir, name)
                            if os.path.exists(fp):
                                plots[key] = fp
                                break
            if plots:
                parsed["plots"] = plots
        except Exception:
            pass

        r_data.append(parsed)

    return format_output(data={
        "validation": r_data
    })

@IModel_bp.route("/runModelExport", methods=['POST'])
def run_model_export():
    """
    启动模型导出（转换）任务
    Body JSON: taskID, taskName, outputDir, modelType, formats, imgsz, half, simplify, opset, device
    - outputDir: 训练结果目录（通常以 result 结尾或其父目录包含 result），导出会写入到 outputDir/export 下
    - modelType: 要导出的权重名（如 best、last、epoch10），自动追加 .pt
    - formats: 例如 ["onnx", "openvino", "torchscript", "engine"]
    """
    data = request.json or {}
    task_id = data.get("taskID")
    task_name = data.get("taskName")
    output_dir = data.get("outputDir")
    model_choice = data.get("modelType", "best")
    formats = data.get("formats")
    imgsz = int(data.get("imgsz", 640))
    half = bool(data.get("half", False))
    simplify = bool(data.get("simplify", False))
    opset = data.get("opset", None)
    device = data.get("device", "cpu")

    if not task_id or not task_name or not output_dir:
        return format_output(code=400, msg="缺少必要的参数(step:1)")

    timestamp = int(time.time())

    # 统一处理 output_dir，若末级目录为 "result"，保留它作为基准导出目录
    norm_output_dir = os.path.normpath(output_dir)
    base_output_dir = norm_output_dir

    # 定位权重文件
    weight_file = f"{model_choice}.pt"
    weight_path = ""
    for root, dirs, files in os.walk(base_output_dir):
        if weight_file in files:
            weight_path = os.path.join(root, weight_file)
            break

    if not os.path.exists(weight_path):
        return format_output(code=404, msg=f"模型权重文件未找到: {model_choice}.pt, {weight_path}")

    try:
        export_key = f"{task_id}_{timestamp}"

        # Triton 集成参数
        triton_repo_path = data.get("tritonRepoPath")
        triton_model_name = data.get("tritonModelName")
        enable_triton = bool(data.get("enableTriton", False))
        
        thread, log_stream = run_modelexport_in_thread(
            task_id=export_key,
            model_path=weight_path,
            output_dir=base_output_dir,
            result_file_path=None,
            formats=formats,
            imgsz=imgsz,
            half=half,
            simplify=simplify,
            opset=opset,
            device=device,
            triton_repo_path=triton_repo_path,
            triton_model_name=triton_model_name,
            enable_triton=enable_triton,
        )

        EXPORT_THREADS[export_key] = {
            "thread": thread,
            "log": log_stream,
            "task_id": task_id,
            "task_name": task_name,
            "output_dir": base_output_dir,
            "model_choice": model_choice,
            "formats": formats,
            "imgsz": imgsz,
            "startedAt": timestamp,
            "triton_repo_path": triton_repo_path,
            "triton_model_name": triton_model_name,
            "enable_triton": enable_triton,
        }

        # 写入导出历史记录到 output_dir/export/export_history.json
        try:
            export_dir = os.path.join(base_output_dir, "export")
            os.makedirs(export_dir, exist_ok=True)
            history_file = os.path.join(export_dir, "export_history.json")
            entry = {
                "exportKey": export_key,
                "task_id": task_id,
                "task_name": task_name,
                "output_dir": base_output_dir,
                "model_choice": model_choice,
                "formats": formats,
                "imgsz": imgsz,
                "startedAt": timestamp,
                "triton_repo_path": triton_repo_path,
                "triton_model_name": triton_model_name,
                "enable_triton": enable_triton,
            }
            history = []
            try:
                if os.path.exists(history_file):
                    with open(history_file, 'r', encoding='utf-8') as hf:
                        history = json.load(hf) or []
            except Exception:
                history = []
            history.append(entry)
            with open(history_file, 'w', encoding='utf-8') as hf:
                json.dump(history, hf, ensure_ascii=False, indent=2)
        except Exception:
            pass

        return format_output(msg=f"导出任务 {export_key} 已启动", data={
            "exportKey": export_key,
            "output_dir": base_output_dir,
        })
    except Exception as e:
        return format_output(code=500, msg=f"启动导出任务失败: {str(e)}")

@IModel_bp.route("/getExportTaskLog", methods=['GET'])
def get_export_task_log():
    """
    获取导出任务的终端输出
    Query: exportKey
    """
    export_key = request.args.get("exportKey")
    if not export_key:
        return format_output(code=400, msg="缺少必要参数(step:1)")

    task_info = EXPORT_THREADS.get(export_key)
    if not task_info:
        return format_output(code=404, msg="任务未在运行，或不存在")

    log_q = task_info["log"]
    logs = []
    while not log_q.empty():
        logs.append(log_q.get())

    if "log_cache" not in task_info:
        task_info["log_cache"] = []
    task_info["log_cache"].extend(logs)

    log_text = "\n".join(task_info["log_cache"])
    is_running = task_info["thread"].is_alive()

    return format_output(data={
        "log": log_text,
        "is_running": is_running,
        "meta": {
            "task_id": task_info.get("task_id"),
            "task_name": task_info.get("task_name"),
            "output_dir": task_info.get("output_dir"),
            "model_choice": task_info.get("model_choice"),
            "formats": task_info.get("formats"),
            "imgsz": task_info.get("imgsz"),
            "startedAt": task_info.get("startedAt"),
        }
    })

@IModel_bp.route("/getExportHistoryLog", methods=["GET"])
def get_export_history_log():
    """
    读取历史导出任务的日志内容
    Query: outputDir, exportKey
    返回: { log: str }
    """
    output_dir = request.args.get("outputDir")
    export_key = request.args.get("exportKey")
    if not output_dir or not export_key:
        return format_output(code=400, msg="缺少必要参数(step:1)")

    try:
        log_file = os.path.join(output_dir, "export", f"{export_key}.log")
        if not os.path.exists(log_file):
            return format_output(code=404, msg="未找到历史日志文件")
        with open(log_file, 'r', encoding='utf-8') as f:
            content = f.read()
        return format_output(data={"log": content})
    except Exception as e:
        return format_output(code=500, msg=f"读取历史日志失败: {e}")

@IModel_bp.route("/getExportHistory", methods=["GET"])
def get_export_history():
    """
    获取某个输出目录下的导出历史记录
    Query: outputDir（训练结果目录，通常以 result 结尾）
    返回: { history: [...] }
    """
    output_dir = request.args.get("outputDir")
    if not output_dir:
        return format_output(code=400, msg="缺少必要参数(step:1)")

    export_dir = os.path.join(output_dir, "export")
    history_file = os.path.join(export_dir, "export_history.json")
    try:
        if os.path.exists(history_file):
            with open(history_file, 'r', encoding='utf-8') as hf:
                data = json.load(hf) or []
        else:
            data = []
    except Exception:
        data = []

    # 按时间倒序
    if isinstance(data, list):
        try:
            data.sort(key=lambda x: x.get("startedAt") or 0, reverse=True)
        except Exception:
            pass

    return format_output(data={"history": data})

@IModel_bp.route("/deleteExportHistory", methods=["POST"])
def delete_export_history():
    """
    删除一条导出历史记录，并删除其日志文件
    Body JSON: { outputDir: str, exportKey: str }
    """
    data = request.get_json(silent=True) or {}
    output_dir = data.get("outputDir")
    export_key = data.get("exportKey")
    if not output_dir or not export_key:
        return format_output(code=400, msg="缺少必要参数(step:1)")

    try:
        export_dir = os.path.join(output_dir, "export")
        os.makedirs(export_dir, exist_ok=True)
        history_file = os.path.join(export_dir, "export_history.json")
        # 删除日志文件
        log_file = os.path.join(export_dir, f"{export_key}.log")
        try:
            if os.path.exists(log_file):
                os.remove(log_file)
        except Exception:
            pass

        # 过滤历史记录
        history = []
        try:
            if os.path.exists(history_file):
                with open(history_file, 'r', encoding='utf-8') as hf:
                    history = json.load(hf) or []
        except Exception:
            history = []

        new_history = [h for h in history if h.get("exportKey") != export_key]
        try:
            with open(history_file, 'w', encoding='utf-8') as hf:
                json.dump(new_history, hf, ensure_ascii=False, indent=2)
        except Exception:
            pass

        return format_output(msg="删除成功")
    except Exception as e:
        return format_output(code=500, msg=f"删除失败: {e}")

@IModel_bp.route("/listExportArtifacts", methods=["GET"])
def list_export_artifacts():
    """
    列出导出产物文件（递归）
    Query: outputDir（训练结果目录，通常以 result 结尾）
    返回: { files: [ { path, size, mtime, mime } ] }
    """
    output_dir = request.args.get("outputDir")
    if not output_dir:
        return format_output(code=400, msg="缺少必要参数(step:1)")

    base = os.path.normpath(os.path.join(output_dir, "export"))
    if not os.path.isdir(base):
        return format_output(data={"files": []})

    files = []
    for root, dirs, filenames in os.walk(base):
        for name in filenames:
            fp = os.path.join(root, name)
            try:
                stat = os.stat(fp)
                mime, _ = mimetypes.guess_type(fp)
                rel = os.path.relpath(fp, base).replace("\\", "/")
                files.append({
                    "path": rel,
                    "size": stat.st_size,
                    "mtime": int(stat.st_mtime),
                    "mime": mime or "application/octet-stream",
                })
            except Exception:
                pass

    files.sort(key=lambda x: x.get("path") or "")
    return format_output(data={"files": files})

@IModel_bp.route("/downloadExportArtifact", methods=["GET"])
def download_export_artifact():
    """
    下载导出产物文件
    Query: outputDir, filePath（相对 outputDir/export 的路径，或绝对路径但必须位于该目录下）
    """
    output_dir = request.args.get("outputDir")
    file_path = request.args.get("filePath")
    if not output_dir or not file_path:
        return format_output(code=400, msg="缺少必要参数(step:1)")

    export_base = Path(os.path.join(output_dir, "export")).resolve()

    if os.path.isabs(file_path):
        target_path = Path(file_path).resolve()
    else:
        target_path = (export_base / file_path).resolve()

    try:
        # 路径安全校验：必须位于 export_base 下
        if export_base not in target_path.parents and export_base != target_path:
            return format_output(code=400, msg="非法路径")
        if not target_path.exists() or not target_path.is_file():
            return format_output(code=404, msg="文件不存在")
        return send_file(str(target_path), as_attachment=True, download_name=target_path.name)
    except Exception as e:
        return format_output(code=500, msg=f"下载失败: {e}")

@IModel_bp.route("/registerExportArtifactToTriton", methods=["POST"])
def register_export_artifact_to_triton():
    """
    将单个导出产物注册到 Triton 模型仓库
    Body JSON: { outputDir: str, filePath: str, tritonRepoPath: str, tritonModelName?: str, imgsz?: int }
    支持: .onnx, .plan/.engine, .pt
    """
    data = request.get_json(silent=True) or {}
    output_dir = data.get("outputDir")
    file_path = data.get("filePath")
    triton_repo_path = data.get("tritonRepoPath")
    triton_model_name = data.get("tritonModelName")
    imgsz = int(data.get("imgsz") or 640)

    if not output_dir or not file_path or not triton_repo_path:
        return format_output(code=400, msg="缺少必要参数(step:1)")

    export_base = Path(os.path.join(output_dir, "export")).resolve()
    target_path = (export_base / file_path).resolve()

    # 路径安全
    if export_base not in target_path.parents and export_base != target_path:
        return format_output(code=400, msg="非法路径")
    if not target_path.exists() or not target_path.is_file():
        return format_output(code=404, msg="文件不存在")

    # 校验 Triton 仓库路径
    repo = Path(triton_repo_path)
    if not repo.exists() or not repo.is_dir():
        return format_output(code=400, msg="Triton 仓库路径不存在或不是目录")
    try:
        testfile = repo / ".write_test.tmp"
        with open(testfile, 'w', encoding='utf-8') as tf:
            tf.write("ok")
        os.remove(testfile)
    except Exception:
        return format_output(code=400, msg="Triton 仓库路径不可写")

    ext = target_path.suffix.lower()
    if ext == ".onnx":
        fmt = "onnx"
    elif ext in (".plan", ".engine"):
        fmt = "engine"
    elif ext == ".pt":
        fmt = "torchscript"
    else:
        return format_output(code=400, msg=f"暂不支持注册该格式: {ext}")

    base_name = target_path.stem
    model_name = triton_model_name or f"{base_name}_{fmt}"

    ok = register_model_to_triton(
        model_path=str(target_path),
        triton_repo_path=triton_repo_path,
        model_name=model_name,
        model_format=fmt,
        input_shape=[1, 3, imgsz, imgsz],
        logger=None,
    )
    if not ok:
        return format_output(code=500, msg="注册到 Triton 失败")
    return format_output(msg="已注册到 Triton", data={"model_name": model_name})

@IModel_bp.route("/listTritonModels", methods=["GET"])
def list_triton_models_api():
    """
    列出 Triton 模型仓库中的所有模型
    Query: tritonRepoPath
    返回: { models: [ { name, path, versions, config_exists } ] }
    """
    triton_repo_path = request.args.get("tritonRepoPath")
    if not triton_repo_path:
        return format_output(code=400, msg="缺少必要参数: tritonRepoPath")
    try:
        models = list_triton_models(triton_repo_path)
        return format_output(data={"models": models})
    except Exception as e:
        return format_output(code=500, msg=f"读取 Triton 仓库失败: {e}")

@IModel_bp.route("/listTritonModelFiles", methods=["GET"])
def list_triton_model_files_api():
    """
    列出某个 Triton 模型某版本目录下的文件
    Query: tritonRepoPath, modelName, version (默认 1)
    返回: { files: [ { name, size, mtime, path } ] }
    """
    triton_repo_path = request.args.get("tritonRepoPath")
    model_name = request.args.get("modelName")
    version = request.args.get("version") or "1"
    if not triton_repo_path or not model_name:
        return format_output(code=400, msg="缺少必要参数: tritonRepoPath 或 modelName")
    try:
        model_dir = Path(triton_repo_path) / model_name / version
        if not model_dir.exists() or not model_dir.is_dir():
            return format_output(data={"files": []})
        files = []
        for p in model_dir.iterdir():
            if p.is_file():
                try:
                    st = p.stat()
                    files.append({
                        "name": p.name,
                        "size": st.st_size,
                        "mtime": int(st.st_mtime),
                        "path": str(p)
                    })
                except Exception:
                    pass
        files.sort(key=lambda x: x.get("name") or "")
        return format_output(data={"files": files})
    except Exception as e:
        return format_output(code=500, msg=f"读取文件失败: {e}")

@IModel_bp.route("/deleteTritonModel", methods=["POST"])
def delete_triton_model_api():
    """
    删除 Triton 模型或指定版本
    Body JSON: { tritonRepoPath, modelName, version? }
    返回: { ok: bool }
    """
    data = request.get_json(silent=True) or {}
    triton_repo_path = data.get("tritonRepoPath")
    model_name = data.get("modelName")
    version = data.get("version")
    if not triton_repo_path or not model_name:
        return format_output(code=400, msg="缺少必要参数(step:1)")
    try:
        ok = remove_triton_model(triton_repo_path, model_name, version)
        if not ok:
            return format_output(code=400, msg="未找到要删除的目标或删除失败")
        return format_output(data={"ok": True})
    except Exception as e:
        return format_output(code=500, msg=f"删除失败: {e}")

@IModel_bp.route("/listRegisteredExportArtifacts", methods=["POST"])
def list_registered_export_artifacts():
    """
    批量检查哪些导出产物已注册进 Triton 仓库
    Body JSON: { outputDir: str, tritonRepoPath: str }
    返回: { items: [ { filePath, model_name, registered } ] }
    """
    data = request.get_json(silent=True) or {}
    output_dir = data.get("outputDir")
    triton_repo_path = data.get("tritonRepoPath")
    if not output_dir or not triton_repo_path:
        return format_output(code=400, msg="缺少必要参数(step:1)")

    export_base = Path(os.path.join(output_dir, "export")).resolve()
    repo = Path(triton_repo_path)
    if not export_base.exists() or not repo.exists() or not repo.is_dir():
        return format_output(code=200, data={"items": []})

    def infer_fmt(path: Path):
        ext = path.suffix.lower()
        if ext == ".onnx":
            return "onnx"
        if ext in (".plan", ".engine"):
            return "engine"
        if ext == ".pt":
            return "torchscript"
        return None

    items = []
    for root, dirs, filenames in os.walk(export_base):
        for name in filenames:
            p = Path(root) / name
            rel = p.relative_to(export_base).as_posix()
            fmt = infer_fmt(p)
            if not fmt:
                continue
            base = p.stem
            model_name = f"{base}_{fmt}"
            model_dir = repo / model_name
            version_dir = model_dir / "1"
            # 目标文件名
            if fmt == "onnx":
                model_file = version_dir / "model.onnx"
            elif fmt == "engine":
                model_file = version_dir / "model.plan"
            else:
                model_file = version_dir / "model.pt"
            registered = model_dir.exists() and version_dir.exists() and model_file.exists()
            items.append({
                "filePath": rel,
                "model_name": model_name,
                "registered": bool(registered),
            })

    return format_output(data={"items": items})

@IModel_bp.route("/getValTaskLog", methods=['GET'])
def get_val_task_log():
    """
    获取验证任务的终端输出
    """
    filename = request.args.get("filename")
    if not filename:
        return format_output(code=400, msg="缺少必要参数(step:1)")

    task_info = VAL_THREADS.get(filename)
    if not task_info:
        return format_output(code=404, msg="任务未在运行，或不存在")

    log_q = task_info["log"]
    logs = []
    while not log_q.empty():
        logs.append(log_q.get())

    if "log_cache" not in task_info:
        task_info["log_cache"] = []
    task_info["log_cache"].extend(logs)

    log_text = "\n".join(task_info["log_cache"])
    is_running = task_info["thread"].is_alive()

    return format_output(data={
        "log": log_text,
        "is_running": is_running
    })
    
@IModel_bp.route("/getTaskLog", methods=["GET"])
def get_task_log():
    """
    获取测试任务的终端输出
    """
    filename = request.args.get("filename")
    if not filename:
        return format_output(code=400, msg="缺少必要参数(step:1)")
    
    print(TEST_THREADS)

    task_info = TEST_THREADS.get(filename)
    if not task_info:
        return format_output(code=404, msg="任务未在运行，或不存在")

    log_q = task_info["log"]
    logs = []
    while not log_q.empty():
        logs.append(log_q.get())

    if "log_cache" not in task_info:
        task_info["log_cache"] = []
    task_info["log_cache"].extend(logs)

    log_text = "\n".join(task_info["log_cache"])
    is_running = task_info["thread"].is_alive()

    return format_output(data={
        "log": log_text,
        "is_running": is_running
    })
    
@IModel_bp.route("/getAllTrainedModel", methods=['GET'])
def get_all_trained_models():
    """
    获取所有已经训练好的模型信息
    """
    trained_models = []
    training_dir = os.path.join(get_tasks_path(), "training")

    if not os.path.exists(training_dir):
        return format_output(data={"models": []})

    for folder in os.listdir(training_dir):
        folder_path = os.path.join(training_dir, folder)
        if not os.path.isdir(folder_path):
            continue

        match = re.match(r"task_(\d+)_(\d+)", folder)
        if not match:
            continue

        task_id = match.group(1)
        weights_dir = os.path.join(folder_path, "result", "weights")

        if not os.path.exists(weights_dir):
            continue

        model_info = {
            "task_id": task_id,
            "folder": folder,
            "task_name": None,
            "output_dir": os.path.join(training_dir, folder, "result"),
            "weights": {},
            # dataset metadata (to be filled from task config)
            "dataset": None
        }

        try:
            for filename in os.listdir(weights_dir):
                if filename.endswith(".pt"):
                    full_path = os.path.join(weights_dir, filename)
                    model_info["weights"][filename] = full_path
        except Exception as e:
            continue

        if not model_info["weights"]:
            continue

        try:
            task_config_file = os.path.join(get_tasks_path(), f"{folder.split('_')[0]}_{folder.split('_')[1]}.yaml")
            if os.path.exists(task_config_file):
                with open(task_config_file, "r", encoding="utf-8") as f:
                    task_config = yaml.safe_load(f)
                    model_info["task_name"] = task_config.get("taskName", None)
                    # datasetPath recorded when task was created
                    ds_path = task_config.get("datasetPath")
                    if isinstance(ds_path, str) and os.path.isdir(ds_path):
                        info_file = os.path.join(ds_path, "yolo_training_visualization_info.yaml")
                        ds_info = {"path": ds_path}
                        try:
                            if os.path.exists(info_file):
                                with open(info_file, 'r', encoding='utf-8') as f_info:
                                    info_data = yaml.safe_load(f_info) or {}
                                ds_info.update({
                                    "name": info_data.get("name"),
                                    "version": info_data.get("version"),
                                    "yaml_file_path": info_data.get("yaml_file_path"),
                                    "type": info_data.get("type", "YOLO"),
                                })
                        except Exception:
                            pass
                        model_info["dataset"] = ds_info
        except Exception as e:
            model_info["task_name"] = None

        trained_models.append(model_info)

    return format_output(data={"models": trained_models})

@IModel_bp.route("/getTestResultImageBase64", methods=["GET"])
def get_test_result_image_base64():
    """
    获取测试任务的结果图片的 Base64 内容
    """
    task_id = request.args.get("taskID")
    file_path = request.args.get("filePath")

    if not task_id or not file_path:
        return format_output(code=400, msg="缺少必要参数(step:1)")

    matched_files, e = get_test_result_file(task_id)
    if e or not matched_files:
        return format_output(code=404, msg=f"未找到测试任务ID为 {task_id} 的结果文件")

    try:
        for item in matched_files:
            with open(item, 'r', encoding='utf-8') as f:
                data = yaml.safe_load(f.read())

            output_dir = data.get("output_dir")
            if not output_dir:
                continue

            # 支持传入绝对路径或相对 output_dir 的路径
            abs_file_path = file_path if os.path.isabs(file_path) else os.path.join(output_dir, file_path)
            if not os.path.exists(abs_file_path):
                continue

            mime_type, _ = mimetypes.guess_type(abs_file_path)
            if mime_type and mime_type.startswith("image"):
                with open(abs_file_path, "rb") as img_file:
                    b64_data = base64.b64encode(img_file.read()).decode("utf-8")
                return format_output(data={
                    "type": "image",
                    "mime": mime_type,
                    "base64": f"data:{mime_type};base64,{b64_data}"
                })

            return format_output(code=415, msg="目标文件不是图片类型")

        return format_output(code=404, msg="未找到匹配的输出路径或文件不存在")

    except Exception as e:
        return format_output(code=500, msg=f"读取图片文件失败: {str(e)}")

@IModel_bp.route("/deleteTestResult", methods=["POST"])
def delete_test_result():
    """
    删除一条测试记录（删除结果 YAML 文件并从列表移除）
    Body JSON: filename (绝对路径，必须位于 get_test_result_files_path() 目录下)
    """
    try:
        data = request.get_json(silent=True) or {}
        filename = data.get("filename")
        if not filename:
            return format_output(code=400, msg="缺少必要参数 filename")

        base_dir = os.path.abspath(get_test_result_files_path())
        target = os.path.abspath(filename)
        if not target.startswith(base_dir):
            return format_output(code=400, msg="非法路径")

        if os.path.exists(target):
            os.remove(target)

        # 从内存列表移除并保存
        global TEST_LIST
        TEST_LIST = [x for x in TEST_LIST if x.get("filename") != target]
        save_test_list()
        # 同时移除运行中的线程缓存
        if target in TEST_THREADS:
            try:
                TEST_THREADS.pop(target, None)
            except Exception:
                pass

        return format_output(msg="删除成功")
    except Exception as e:
        return format_output(code=500, msg=f"删除失败: {e}")

@IModel_bp.route("/deleteValidationResult", methods=["POST"])
def delete_validation_result():
    """
    删除一条验证记录（删除结果 YAML 文件并从列表移除）
    Body JSON: filename (绝对路径，必须位于 get_validation_result_files_path() 目录下)
    """
    try:
        data = request.get_json(silent=True) or {}
        filename = data.get("filename")
        if not filename:
            return format_output(code=400, msg="缺少必要参数 filename")

        base_dir = os.path.abspath(get_validation_result_files_path())
        target = os.path.abspath(filename)
        if not target.startswith(base_dir):
            return format_output(code=400, msg="非法路径")

        if os.path.exists(target):
            os.remove(target)

        # 从内存列表移除并保存
        global VAL_LIST
        VAL_LIST = [x for x in VAL_LIST if x.get("filename") != target]
        save_val_list()
        # 同时移除运行中的线程缓存
        if target in VAL_THREADS:
            try:
                VAL_THREADS.pop(target, None)
            except Exception:
                pass

        return format_output(msg="删除成功")
    except Exception as e:
        return format_output(code=500, msg=f"删除失败: {e}")

@IModel_bp.route("/downloadTestResult", methods=["GET"])
def download_test_result():
    """
    下载测试任务结果图片
    Query: taskID, filePath (绝对路径或相对 output_dir/result)
    """
    task_id = request.args.get("taskID")
    file_path = request.args.get("filePath")

    if not task_id or not file_path:
        return format_output(code=400, msg="缺少必要参数(step:1)")

    matched_files, e = get_test_result_file(task_id)
    if e or not matched_files:
        return format_output(code=404, msg=f"未找到测试任务ID为 {task_id} 的结果文件")

    try:
        for item in matched_files:
            with open(item, 'r', encoding='utf-8') as f:
                data = yaml.safe_load(f.read())

            output_dir = data.get("output_dir")
            if not output_dir:
                continue

            # 支持传入绝对路径或相对 output_dir 的路径
            if os.path.isabs(file_path):
                abs_fp = file_path
            else:
                abs_fp = os.path.join(output_dir, "result", file_path)
                if not os.path.exists(abs_fp):
                    abs_fp = os.path.join(output_dir, file_path)

            if not os.path.exists(abs_fp):
                continue

            # 直接回传文件
            return send_file(abs_fp, as_attachment=True, download_name=os.path.basename(abs_fp))

        return format_output(code=404, msg="未找到匹配的输出路径或文件不存在")
    except Exception as e:
        return format_output(code=500, msg=f"下载文件失败: {str(e)}")

@IModel_bp.route("/downloadValResultFile", methods=["GET"])
def download_val_result_file():
    """
    下载验证任务产物文件（图片或其他产物）
    Query: taskID, filePath (绝对路径或相对 output_dir/result)
    """
    task_id = request.args.get("taskID")
    file_path = request.args.get("filePath")

    if not task_id or not file_path:
        return format_output(code=400, msg="缺少必要参数(step:1)")

    # 匹配该 task 的验证结果文件
    matched_files = []
    pattern = re.compile(rf"^{re.escape(task_id)}_\d+\.yaml$")
    try:
        directory = get_validation_result_files_path()
        for filename in os.listdir(directory):
            if pattern.match(filename):
                matched_files.append(os.path.join(directory, filename))
    except Exception as e:
        return format_output(code=500, msg=f"获取验证文件时失败: {e}")

    if not matched_files:
        return format_output(code=404, msg=f"未找到验证任务ID为 {task_id} 的结果文件")

    try:
        for item in matched_files:
            with open(item, 'r', encoding='utf-8') as f:
                content = f.read()
            try:
                data = yaml.safe_load(content)
            except Exception:
                data = yaml.unsafe_load(content)

            # 兼容空/非字典数据
            if data is None:
                data = {}
            else:
                data = _to_plain_python(data)
                if not isinstance(data, dict):
                    data = {"data": data}

            output_dir = data.get("output_dir")
            if not output_dir:
                continue

            # 允许传绝对路径或相对路径（相对 output_dir 或 output_dir/result）
            if os.path.isabs(file_path):
                abs_fp = file_path
            else:
                abs_fp = os.path.join(output_dir, "result", file_path)
                if not os.path.exists(abs_fp):
                    abs_fp = os.path.join(output_dir, file_path)

            if not os.path.exists(abs_fp):
                continue

            # 直接回传文件
            return send_file(abs_fp, as_attachment=True, download_name=os.path.basename(abs_fp))

        return format_output(code=404, msg="未找到匹配的输出路径或文件不存在")
    except Exception as e:
        return format_output(code=500, msg=f"下载文件失败: {str(e)}")

@IModel_bp.route("/downloadValResultFileStream", methods=["GET"])
def download_val_result_file_stream():
    """
    下载验证任务产物文件流
    Query: taskID, filePath (绝对路径或相对 output_dir/result)
    """
    task_id = request.args.get("taskID")
    file_path = request.args.get("filePath")

    if not task_id or not file_path:
        return format_output(code=400, msg="缺少必要参数(step:1)")

    # 匹配该 task 的验证结果文件
    matched_files = []
    pattern = re.compile(rf"^{re.escape(task_id)}_\d+\.yaml$")
    try:
        directory = get_validation_result_files_path()
        for filename in os.listdir(directory):
            if pattern.match(filename):
                matched_files.append(os.path.join(directory, filename))
    except Exception as e:
        return format_output(code=500, msg=f"获取验证文件时失败: {e}")

    if not matched_files:
        return format_output(code=404, msg=f"未找到验证任务ID为 {task_id} 的结果文件")

    try:
        for item in matched_files:
            with open(item, 'r', encoding='utf-8') as f:
                content = f.read()
            try:
                data = yaml.safe_load(content)
            except Exception:
                data = yaml.unsafe_load(content)

            # 兼容空/非字典数据
            if data is None:
                data = {}
            else:
                data = _to_plain_python(data)
                if not isinstance(data, dict):
                    data = {"data": data}

            output_dir = data.get("output_dir")
            if not output_dir:
                continue

            # 允许传绝对路径或相对路径（相对 output_dir 或 output_dir/result）
            if os.path.isabs(file_path):
                abs_fp = file_path
            else:
                abs_fp = os.path.join(output_dir, "result", file_path)
                if not os.path.exists(abs_fp):
                    abs_fp = os.path.join(output_dir, file_path)

            if not os.path.exists(abs_fp):
                continue

            # 直接回传文件流
            return send_file(abs_fp, as_attachment=True, download_name=os.path.basename(abs_fp), mimetype='application/octet-stream')

        return format_output(code=404, msg="未找到匹配的输出路径或文件不存在")
    except Exception as e:
        return format_output(code=500, msg=f"下载文件失败: {str(e)}")

@IModel_bp.route("/getValResultImageBase64", methods=["GET"])
def get_val_result_image_base64():
    """
    获取验证任务产物图片（如混淆矩阵）的 Base64 内容
    Query: taskID, filePath (绝对路径或相对 output_dir/result)
    """
    task_id = request.args.get("taskID")
    file_path = request.args.get("filePath")

    if not task_id or not file_path:
        return format_output(code=400, msg="缺少必要参数(step:1)")

    # 匹配该 task 的验证结果文件
    matched_files = []
    pattern = re.compile(rf"^{re.escape(task_id)}_\d+\.yaml$")
    try:
        directory = get_validation_result_files_path()
        for filename in os.listdir(directory):
            if pattern.match(filename):
                matched_files.append(os.path.join(directory, filename))
    except Exception as e:
        return format_output(code=500, msg=f"获取验证文件时失败: {e}")

    if not matched_files:
        return format_output(code=404, msg=f"未找到验证任务ID为 {task_id} 的结果文件")

    try:
        for item in matched_files:
            with open(item, 'r', encoding='utf-8') as f:
                content = f.read()
            try:
                data = yaml.safe_load(content)
            except Exception:
                data = yaml.unsafe_load(content)

            # 兼容空/非字典数据
            if data is None:
                data = {}
            else:
                data = _to_plain_python(data)
                if not isinstance(data, dict):
                    data = {"data": data}

            output_dir = data.get("output_dir")
            if not output_dir:
                continue

            # 允许传绝对路径或相对路径（相对 output_dir 或 output_dir/result）
            if os.path.isabs(file_path):
                abs_fp = file_path
            else:
                # 优先认为相对 result 目录
                abs_fp = os.path.join(output_dir, "result", file_path)
                if not os.path.exists(abs_fp):
                    abs_fp = os.path.join(output_dir, file_path)

            if not os.path.exists(abs_fp):
                continue

            mime_type, _ = mimetypes.guess_type(abs_fp)
            if mime_type and mime_type.startswith("image"):
                with open(abs_fp, "rb") as img_file:
                    b64_data = base64.b64encode(img_file.read()).decode("utf-8")
                return format_output(data={
                    "type": "image",
                    "mime": mime_type,
                    "base64": f"data:{mime_type};base64,{b64_data}"
                })

            return format_output(code=415, msg="目标文件不是图片类型")

        return format_output(code=404, msg="未找到匹配的输出路径或文件不存在")
    except Exception as e:
        return format_output(code=500, msg=f"读取图片文件失败: {str(e)}")

load_test_list()