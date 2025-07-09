import os

USER_HOME = os.path.expanduser("~")   # 用户主目录
DATASET_PATH = USER_HOME + "/.yolo_training_visualization_platform/dataset"   # 数据集存放路径
TASKS_PATH = USER_HOME + "/.yolo_training_visualization_platform/tasks"
MODELS_PATH = USER_HOME + "/.yolo_training_visualization_platform/models"
YOLO_MODELS_LIST_URL = "https://api.github.com/repos/ultralytics/assets/releases/latest"

def get_dataset_path():
    """
    获取数据集存放路径
    """
    if not os.path.exists(DATASET_PATH):
        os.makedirs(DATASET_PATH)
    
    return DATASET_PATH

def get_tasks_path():
    """
    获取训练任务存放路径
    """
    if not os.path.exists(TASKS_PATH):
        os.makedirs(TASKS_PATH)
        
    return TASKS_PATH

def get_models_path():
    if not os.path.exists(MODELS_PATH):
        os.makedirs(MODELS_PATH)
        
    return MODELS_PATH

def get_yolo_models_list_url():
    return YOLO_MODELS_LIST_URL