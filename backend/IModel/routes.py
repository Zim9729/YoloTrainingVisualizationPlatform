from flask import request, Blueprint
from tools.format_output import format_output
from .test import test_model_thread
from config import get_test_result_files_path, get_tasks_path
import os
import time
import yaml
import shutil
import re

IModel_bp = Blueprint('IModel', __name__)

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

@IModel_bp.route("/runModelTest", methods=['POST'])
def run_model_test():
    """
    启动模型测试任务
    """
    data = request.json
    task_id = data.get("taskID")
    output_dir = data.get("outputDir")
    input_type = data.get("inputType", "image") # image 或 video
    input_path = data.get("inputPath")
    model_choice = data.get("modelType", "best")

    if not task_id or not output_dir or not input_path:
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
        
    print(weight_path)

    if not os.path.exists(weight_path):
        return format_output(code=404, msg=f"模型权重文件未找到: {model_choice}.pt, {weight_path}")
    
    test_result_file_path = os.path.join(get_test_result_files_path(), f"{task_id}_{timestamp}.yaml")

    result_info = {
        "model_path": weight_path,
        "input_type": input_type,
        "input_path": input_path,
        "output_dir": test_output_dir,
        "startedAt": timestamp,
        "completedAt": None,
    }
    
    with open(test_result_file_path, "w", encoding="utf-8") as f:
        yaml.dump(result_info, f, allow_unicode=True)

    return format_output(msg="测试任务启动成功", data={"output_dir": test_output_dir})

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
            
        r_data.append(data)
    
    return format_output(data={
        "test": r_data
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