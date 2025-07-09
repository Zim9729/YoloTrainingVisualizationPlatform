import os
import sys
import yaml
import argparse
from ultralytics import YOLO
from config import get_tasks_path, get_models_path
import os
import time
import requests
from tqdm import tqdm

def load_task_config(task_file):
    """
    加载任务配置
    """
    if not os.path.exists(task_file):
        print(f"[ERROR] 配置文件不存在: {task_file}")
        sys.exit(1)
    with open(task_file, 'r', encoding='utf-8') as f:
        config = yaml.safe_load(f)
    return config

def load_platform_infofile(dataset_path):
    """
    加载平台数据集配置
    """
    dataset_platforminfofile_path = os.path.join(dataset_path, "yolo_training_visualization_info.yaml")
    if not os.path.exists(dataset_platforminfofile_path):
        print(f"[ERROR] 数据集平台配置文件不存在: {dataset_platforminfofile_path}")
        sys.exit(1) 
        
    with open(dataset_platforminfofile_path, 'r', encoding='utf-8') as f:
        config = yaml.safe_load(f)
    return config

def download_model(model_name, model_browser_download_url):
    """
    根据 baseModelInfo 下载模型，带进度条
    """
    download_dir = os.path.join(get_models_path(), "base")
    
    os.makedirs(download_dir, exist_ok=True)
    local_path = os.path.join(download_dir, model_name)
    
    if not os.path.exists(local_path):
        print(f"[INFO] 正在下载模型: {model_name}")
        
        with requests.get(model_browser_download_url, stream=True) as r:
            r.raise_for_status()
            total_size = int(r.headers.get('content-length', 0))
            block_size = 1024

            with open(local_path, 'wb') as f, tqdm(
                desc=model_name,
                total=total_size,
                unit='iB',
                unit_scale=True,
                unit_divisor=1024
            ) as bar:
                for chunk in r.iter_content(chunk_size=block_size):
                    if chunk:
                        f.write(chunk)
                        bar.update(len(chunk))
        
        print(f"[INFO] 下载完成: {local_path}")
    else:
        print(f"[INFO] 模型已存在: {local_path}")
    
    return local_path

def main(taskfile_path):
    tasks_dir = get_tasks_path()
    task_file = os.path.join(tasks_dir, taskfile_path)

    config = load_task_config(task_file)

    print(f"[INFO] 加载配置成功: {taskfile_path}")
    print(f"[INFO] 配置内容: {yaml.dump(config, allow_unicode=True)}")

    dataset_path = config['datasetPath']
    epochs = config.get('epochs', 100)
    batch_size = config.get('batchSize', 16)
    imgsz = config.get('imgSize', 640)
    seed = config.get('trainSeed', 0)
    cache = config.get('cache', 'disk')
    training_type = config.get('trainingType', 0)
    
    platform_infofile = load_platform_infofile(dataset_path)
    dataset_yamlfile = platform_infofile.get('yaml_file_path', None)
    if dataset_yamlfile == None:
        print(f"[ERROR] 数据集平台配置文件信息缺失: 找不到数据集Yaml配置文件")
        sys.exit(1) 
    
    dataset_yamlfile_path = os.path.join(dataset_path, dataset_yamlfile)
    
    extra_params = {}
    match training_type:
        case 0:
            extra_params['base_model_info'] = config.get('baseModelInfo', None)
            if extra_params['base_model_info'] == None:
                print(f"[ERROR] 加载基础模型配置时出错")
                sys.exit(1) 
        case 1:
            extra_params['modelYamlFile'] = config.get('modelYamlFile', None)
            if extra_params['modelYamlFile'] == None:
                print(f"[ERROR] 加载模型结构Yaml文件配置时出错")
                sys.exit(1) 
        case _:
            print(f"[ERROR] 训练类型无效(0,1)")
            sys.exit(1) 
    
    device = config.get('device', 0)
    device_params = {"device": device}
    match device:
        case "gpu":
            device_params["gpuCUDAIndex"] = config.get("gpuCUDAIndex", "0")
        case "gpu_idlefirst":
            device_params["gpuCUDANum"] = int(config.get("gpuCUDANum", 1))
        case _:
            pass
        
    match training_type:
        case 0:
            try:
                model_name = extra_params['base_model_info']['name']
                model_browser_download_url = extra_params['base_model_info']['browser_download_url']
                model_path = os.path.join(get_models_path(), "base", model_name)
                if not os.path.exists(model_path):
                    download_model(model_name, model_browser_download_url)
            except:
                print(f"[ERROR] 下载模型时出错")
                sys.exit(1) 
        case 1:
            try:
                yaml_file = config.get('modelYamlFile')
                
                tmp_yaml = f"tmp_{int(time.time())}.yaml"
                with open(tmp_yaml, 'w', encoding='utf-8') as f:
                    f.write(yaml_file)
                    
                model_path = tmp_yaml
            except:
                print(f"[ERROR] 在本地生成临时Yaml文件时出错")
                sys.exit(1) 
            
    print(f"[INFO] 开始训练模型...")
    model = YOLO(model_path)
    
    match device:
        case "gpu":
            device_arg = device_params["gpuCUDAIndex"].split(",")
        case "gpu_idlefirst":
            device_arg = []
            for _ in range(device_params["gpuCUDANum"]):
                device_arg.append(-1)
        case "mps":
            device_arg = "mps"
        case _:
            device_arg = "cpu"
    
    project_path = os.path.join(get_tasks_path(), "training", f"task_{int(time.time())}")
    if cache == "disk":
        _cache = False
    else:
        _cache = True
    
    model.train(
        data=dataset_yamlfile_path,
        project=project_path,
        name="result",
        epochs=int(epochs),
        batch=int(batch_size),
        imgsz=int(imgsz),
        seed=int(seed),
        cache=_cache,
        device=device_arg,
        plots=True,
        save_period=5
    )
    
    print("[INFO] 🎉 训练完成")
