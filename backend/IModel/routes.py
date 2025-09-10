from flask import request, Blueprint, send_file
from tools.format_output import format_output
from config import get_test_result_files_path, get_tasks_path, get_validation_result_files_path
from run_in_thread import run_modeltest_in_thread, run_modelval_in_thread
from IModel.validate import _to_plain_python
import os
import time
import yaml
import shutil
import re
import json
import base64
import mimetypes

IModel_bp = Blueprint('IModel', __name__)

TEST_THREADS = {}
TEST_LIST = []
VAL_THREADS = {}
VAL_LIST = []

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
            "weights": {}
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