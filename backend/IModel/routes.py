from flask import request, Blueprint
from tools.format_output import format_output
from config import get_test_result_files_path, get_tasks_path
from run_in_thread import run_modeltest_in_thread
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
    with open("test_list.json", "w", encoding="utf-8") as f:
        json.dump(TEST_LIST, f, ensure_ascii=False, indent=2)

def load_test_list():
    """
    加载测试任务列表
    """
    global TEST_LIST
    try:
        with open("test_list.json", "r", encoding="utf-8") as f:
            TEST_LIST = json.load(f)
    except FileNotFoundError:
        TEST_LIST = []

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

    test_output_dir = os.path.join(output_dir.removesuffix("/result"), "test", f"test_{task_id}_{timestamp}_{model_choice}")
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
    except:
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
                        candidate = result_file_path + ext
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

            abs_file_path = os.path.join(output_dir, file_path)
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

load_test_list()