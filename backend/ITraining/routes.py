from flask import Blueprint, request
from tools.format_output import format_output
from config import get_tasks_path, get_yolo_models_list_url
import yaml
import time
import json
import requests
import os


ITraining_bp = Blueprint('ITraining', __name__)

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
            modelYamlFile = data.get("modelYamlFile", "")
            if modelYamlFile == "":
                return format_output(code=400, msg="缺少必要的参数(step:4)")
            extra_params["modelYamlFile"] = modelYamlFile
    
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
    
    timestamp = int(time.time())
    
    yaml_data = {
        "taskName": taskName,
        "taskDescription": taskDescription,
        "datasetPath": datasetPath,
        "trainingType": trainingType,
        "epochs": epochs,
        "batchSize": batchSize,
        "imgSize": imgSize,
        "trainSeed": trainSeed,
        "createTime": timestamp,
        **extra_params,
        **device_params,
    }

    # 文件名：taskName_时间戳.yaml
    filename = f"{taskName}_{timestamp}.yaml"
    file_path = os.path.join(tasks_path, filename)

    os.makedirs(tasks_path, exist_ok=True)

    with open(file_path, "w", encoding="utf-8") as f:
        yaml.dump(yaml_data, f, allow_unicode=True)

    return format_output(msg="任务已创建", data={"yaml_file": filename})