from run_in_thread import run_main_in_thread
from flask import Blueprint, request
from tools.format_output import format_output
from config import get_tasks_path, get_tasks_result_files_path, get_tasks_yaml_file_path, get_yolo_model_list_url, get_models_path, get_yolo_model_cahce_expiration_time
import yaml
import json
import time
import requests
import base64
import os
import mimetypes
import random
import re


ITraining_bp = Blueprint('ITraining', __name__)
TASK_THREADS = {}
TASK_LIST = []

def get_task_result_file(task_id):
    """
    获取模型训练结果数据文件
    """
    matched_files = []
    pattern = re.compile(rf"^{re.escape(task_id)}_\d+\.yaml$")

    try:
        directory = get_tasks_result_files_path()
        for filename in os.listdir(directory):
            if pattern.match(filename):
                matched_files.append(os.path.join(directory, filename))
        return matched_files, False
    except Exception as e:
        return -1, e

@ITraining_bp.route("/getAllTasks", methods=["GET"])
def get_all_tasks():
    tasks_path = get_tasks_path()
    
    tasks = []
    for filename in os.listdir(tasks_path):
        if filename.endswith(".yaml") or filename.endswith(".yml"):
            file_path = os.path.join(tasks_path, filename)
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = yaml.safe_load(f)
                    
                    data['__filename'] = filename
                    tasks.append(data)
            except Exception as e:
                print(f"读取文件出错: {filename}, 错误: {e}")
    
    return format_output(data={
        "tasks": tasks
    })

@ITraining_bp.route("/getTask", methods=["GET"])
def get_task():
    """
    获取指定任务信息
    """
    tasks_path = get_tasks_path()
    filename = request.args.get("filename")

    if not filename:
        return format_output(code=400, msg="缺少必要参数：filename")

    file_path = os.path.join(tasks_path, filename)

    if not os.path.exists(file_path):
        return format_output(code=404, msg="找不到该任务配置文件")

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = yaml.safe_load(f)
            
        if data["trainingType"] == 1:
            with open(data["modelYamlFile"], "r", encoding="utf-8") as yaml_f:
                task_yaml_file = yaml.safe_load(yaml_f)
                
            data["yamlFile"] = task_yaml_file
        
        return format_output(data=data)
    except Exception as e:
        print(f"读取任务配置文件出错: {filename}, 错误: {e}")
        return format_output(code=500, msg=f"读取任务配置失败: {str(e)}")

@ITraining_bp.route("/createTask", methods=["POST"])
def create_task():
    """
    创建训练任务
    """
    tasks_path = get_tasks_path()
    
    data = request.json
    taskName = data.get("taskName", None)
    taskDescription = data.get("taskDescription", "")
    datasetPath = data.get("datasetPath", None)
    trainingType = data.get("trainingType", None)
    
    if taskName == None or datasetPath == None or trainingType == None:
        return format_output(code=400, msg="缺少必要的参数(step:1)")
    if taskName == "":
        return format_output(code=400, msg="训练任务名称不能为空[参数非法(step:2)]")
    
    extra_params = {}
    timestamp = int(time.time())
    match int(trainingType):
        case 0:
            baseModelID = data.get("baseModelID", None)
            if baseModelID == None:
                return format_output(code=400, msg="缺少必要的参数(step:3)")
            extra_params["baseModelID"] = str(baseModelID)
            
            try:
                res = requests.get("https://api.github.com/repos/ultralytics/assets/releases/latest")
                res.raise_for_status()  # 如果不是200会抛异常
                release_data = res.json()

                model_list = release_data.get("assets", [])

                found_model = next((m for m in model_list if str(m["id"]) == str(baseModelID)), None)

                if found_model is None:
                    return format_output(code=404, msg=f"未找到ID为 {baseModelID} 的模型")

                extra_params["baseModelInfo"] = {
                    "id": found_model["id"],
                    "name": found_model["name"],
                    "size": found_model["size"],
                    "download_count": found_model.get("download_count", 0),
                    "browser_download_url": found_model["browser_download_url"],
                    "uploader": {
                        "login": found_model["uploader"]["login"],
                        "html_url": found_model["uploader"]["html_url"]
                    }
                }
            except Exception as e:
                print("获取模型信息出错:", e)
                return format_output(code=500, msg=f"获取模型信息失败: {str(e)}")
                
        case 1:
            modelYamlStr = data.get("modelYamlFile", "")
            if not modelYamlStr.strip():
                return format_output(code=400, msg="缺少必要的参数(step:4)")
            
            model_yaml_filename = f"tmp_{taskName}_model_{timestamp}.yaml"
            
            model_yaml_path = os.path.join(get_tasks_yaml_file_path(), model_yaml_filename)
            with open(model_yaml_path, 'w', encoding='utf-8') as f:
                f.write(modelYamlStr)

            extra_params["modelYamlFile"] = model_yaml_path
    
    # 通用参数
    epochs = data.get("epochs", 100)
    batchSize = data.get("batchSize", 16)
    imgSize = data.get("imgSize", 640)
    device = data.get("device", "cpu")
    
    device_params = {"device": device}
    match device:
        case "gpu":
            device_params["gpuCUDAIndex"] = data.get("gpuCUDAIndex", "0")
        case "gpu_idlefirst":
            device_params["gpuCUDANum"] = data.get("gpuCUDANum", 1)
        case _:
            pass
    
    try:
        trainSeed = int(data.get("trainSeed", 0))
    except:
        return format_output(code=400, msg="参数非法(step:5)")
    
    task_id = str(random.randint(11111111, 99999999) + timestamp)
    result_file_name = str(random.randint(1111111, 9999999))
    
    yaml_data = {
        "taskID": task_id,
        "taskName": taskName,
        "taskDescription": taskDescription,
        "datasetPath": datasetPath,
        "trainingType": trainingType,
        "epochs": epochs,
        "batchSize": batchSize,
        "imgSize": imgSize,
        "trainSeed": trainSeed,
        "createTime": timestamp,
        "resultFileName": result_file_name,
        **extra_params,
        **device_params,
    }

    filename = f"task_{task_id}.yaml"
    file_path = os.path.join(tasks_path, filename)

    os.makedirs(tasks_path, exist_ok=True)

    with open(file_path, "w", encoding="utf-8") as f:
        yaml.dump(yaml_data, f, allow_unicode=True)

    return format_output(msg="任务已创建", data={"yaml_file": filename})

@ITraining_bp.route("/deleteTask", methods=['POST'])
def delete_dataset():
    """
    删除一个训练任务
    """
    task_path = get_tasks_path()
    
    path = request.json.get("path", None)
    if path == None:
        return format_output(code=400, msg="缺少必要的参数")
    
    filePath = os.path.join(task_path, path)
    
    try:
        os.remove(filePath)
    except OSError as e:
        print(f"删除文件 '{path}' 失败: {e}")
        return format_output(code=500, msg="删除失败")
    
    return format_output(msg="删除成功")

@ITraining_bp.route("/startTask", methods=["POST"])
def start_task():
    """
    启动训练任务
    """
    tasks_path = get_tasks_path()
    
    data = request.json
    task_id = data.get("taskID", None)
    filename = data.get("filename", None)
    taskname = data.get("taskname", None)

    if not task_id or not filename or not taskname:
        return format_output(code=400, msg="缺少必要参数(step:1)")
    
    for task in TASK_LIST:
        if task["task_id"] == task_id:
            thread_info = TASK_THREADS.get(filename)

            if thread_info and thread_info["thread"].is_alive():
                return format_output(code=400, msg="任务正在运行中，无法同时启动")
            else:
                TASK_THREADS.pop(filename, None)
                TASK_LIST.remove(task)
            break

    file_path = os.path.join(tasks_path, filename)

    if not os.path.exists(file_path):
        return format_output(code=404, msg=f"找不到任务配置文件: {filename}")

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            config = yaml.safe_load(f)
    except Exception as e:
        print("读取配置文件失败:", e)
        return format_output(code=500, msg=f"读取配置文件失败: {str(e)}")
    
    timestamp = int(time.time())
    print(timestamp)

    try:
        print(f"启动训练任务: {config.get('taskName')}")
        print("训练参数: ", config)
        
        task_result_file_path = os.path.join(get_tasks_result_files_path(), f"{task_id}_{timestamp}.yaml")

        result_info = {
            "startedAt": timestamp,
            "completedAt": None,
            "filename": filename,
            "taskID": task_id,
            "outputDir": None,
            "log": None
        }

        with open(task_result_file_path, "w", encoding="utf-8") as f:
            yaml.dump(result_info, f, allow_unicode=True)

        thread, log_stream = run_main_in_thread(file_path, task_id, task_result_file_path)

        # 保存
        TASK_THREADS[filename] = {
            "thread": thread,
            "log": log_stream,
        }
        TASK_LIST.append({
            "task_id": task_id,
            "taskname": taskname,
            "filename": filename
        })

    except Exception as e:
        print("启动训练任务失败:", e)
        return format_output(code=500, msg=f"启动训练任务失败: {str(e)}")

    return format_output(msg=f"任务 {config.get('taskName')} 已启动", data={"taskName": config.get("taskName")})

@ITraining_bp.route("/getTaskLog", methods=["GET"])
def get_task_log():
    """
    获取训练任务的终端输出
    """
    filename = request.args.get("filename")
    if not filename:
        return format_output(code=400, msg="缺少必要参数(step:1)")

    task_info = TASK_THREADS.get(filename)
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
    
@ITraining_bp.route("/getAllRunningTasks", methods=['GET'])
def get_all_running_tasks():
    """
    获取所有正在运行中的任务
    """
    r_data = []
    for _ in TASK_LIST:
        try:
            task_info = TASK_THREADS[_["filename"]]
        except:
            pass
        is_running = task_info["thread"].is_alive()
        
        if is_running:
            r_data.append({
                "filename": _["filename"],
                "taskname": _["taskname"],
                "task_id": _["task_id"]
            })
    
    return format_output(data={ "tasks": r_data })

@ITraining_bp.route("/getTrainingTasksHistory", methods=['GET'])
def get_training_tasks_history():
    """
    获取训练任务的历史记录
    """
    r_data = []
    task_id = request.args.get("taskID", None)
    if not task_id:
        return format_output(code=400, msg="缺少必要参数(step:1)")
    
    matched_files, e = get_task_result_file(task_id)
    if e:
        return format_output(code=500, msg=f"获取文件数据时失败: {e}")
    
    for item in matched_files:
        with open(item, 'r', encoding='utf-8') as f:
            data = yaml.safe_load(f.read())
            data["__taskResultFilePath"] = item

        output_dir = data.get("outputDir", None)
        output_files = []
        if output_dir and os.path.exists(output_dir):
            for root, _, files in os.walk(output_dir):
                for name in files:
                    rel_path = os.path.relpath(os.path.join(root, name), output_dir)
                    output_files.append(rel_path)
        data["outputFiles"] = output_files

        r_data.append(data)
    
    return format_output(data={
        "history": r_data
    })
    
@ITraining_bp.route("/getTrainingTaskOutputFile", methods=["GET"])
def get_training_task_output_file():
    """
    根据任务ID与文件路径，返回对应的训练结果文件内容（支持图片、yaml、csv）
    """
    task_id = request.args.get("taskID")
    file_path = request.args.get("filePath")

    if not task_id or not file_path:
        return format_output(code=400, msg="缺少必要参数(taskID / filePath)")

    matched_files, e = get_task_result_file(task_id)
    if e or not matched_files:
        return format_output(code=404, msg=f"未找到任务ID为 {task_id} 的结果文件")

    try:
        with open(matched_files[0], "r", encoding="utf-8") as f:
            data = yaml.safe_load(f.read())

        output_dir = data.get("outputDir")
        if not output_dir:
            return format_output(code=500, msg="结果文件中缺少 outputDir 字段")

        abs_file_path = os.path.join(output_dir, file_path)

        if not os.path.exists(abs_file_path):
            return format_output(code=404, msg=f"文件不存在: {file_path}")

        mime_type, _ = mimetypes.guess_type(abs_file_path)

        # 图片
        if mime_type and mime_type.startswith("image"):
            with open(abs_file_path, "rb") as img_file:
                b64_data = base64.b64encode(img_file.read()).decode("utf-8")
            return format_output(data={
                "type": "image",
                "mime": mime_type,
                "base64": f"data:{mime_type};base64,{b64_data}"
            })

        # 文本格式
        elif file_path.endswith((".yaml", ".yml")):
            with open(abs_file_path, "r", encoding="utf-8") as f:
                return format_output(data={
                    "type": "yaml",
                    "content": f.read()
                })

        elif file_path.endswith(".csv"):
            with open(abs_file_path, "r", encoding="utf-8") as f:
                return format_output(data={
                    "type": "csv",
                    "content": f.read()
                })

        elif file_path.endswith(".txt"):
            with open(abs_file_path, "r", encoding="utf-8") as f:
                return format_output(data={
                    "type": "text",
                    "content": f.read()
                })

        else:
            return format_output(code=415, msg="不支持的文件类型")

    except Exception as e:
        return format_output(code=500, msg=f"读取文件出错: {str(e)}")
    
@ITraining_bp.route("/getAllBaseModelsFromGithub", methods=['GET'])
def get_all_base_models_from_github():
    """
    从Github上获取所有的基础模型
    """
    cache_file_path = os.path.join(get_models_path(), "models_cache_file.json")
    
    try:
        if os.path.exists(cache_file_path):
            with open(cache_file_path, "r", encoding="utf-8") as f:
                cache = json.load(f)
                cached_time = cache.get("timestamp", 0)
                if time.time() - cached_time < int(get_yolo_model_cahce_expiration_time()):
                    return format_output(data={"models": cache.get("models", []), "from_github": False, "has_network_error": False, "has_fileread_error": False})
    except:
        pass

    try:
        response = requests.get(get_yolo_model_list_url())
        if response.status_code == requests.codes.ok:
            models = response.json().get("assets", [])
        else:
            models = []
    except Exception as e:
        # 如果请求失败了也可以获取本地文件
        if os.path.exists(cache_file_path):
            with open(cache_file_path, "r", encoding="utf-8") as f:
                cache = json.load(f)
                return format_output(msg=str(e), data={"models": cache.get("models", []), "from_github": False, "has_network_error": True, "has_fileread_error": False})
        return format_output(msg=str(e), data={"models": [], "from_github": False, "has_network_error": True, "has_fileread_error": True})

    with open(cache_file_path, "w", encoding="utf-8") as f:
        json.dump({
            "timestamp": time.time(),
            "models": models
        }, f, ensure_ascii=False, indent=2)

    return format_output(data={"models": models, "from_github": True, "has_network_error": False, "has_fileread_error": False})

@ITraining_bp.route("/getAllBaseModelFromLocal", methods=['GET'])
def get_all_base_model_from_local():
    """
    从本地文件夹中读取所有模型文件（如 .pt 文件）
    """
    local_model_dir = os.path.join(get_models_path(), "base")
    
    if not os.path.exists(local_model_dir):
        return format_output(data={"models": []})

    models = []
    for filename in os.listdir(local_model_dir):
        filepath = os.path.join(local_model_dir, filename)
        if os.path.isfile(filepath):
            stat = os.stat(filepath)
            models.append({
                "name": filename,
                "size": stat.st_size,
                "path": filepath,
                "modified_time": int(stat.st_mtime)
            })

    return format_output(data={
        "models": sorted(models, key=lambda x: -x["modified_time"])
    })