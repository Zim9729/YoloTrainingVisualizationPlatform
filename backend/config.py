import os

USER_HOME = os.path.expanduser("~")   # 用户主目录

DATASET_PATH = os.path.join(USER_HOME, ".yolo_training_visualization_platform/dataset")   # 数据集存放路径
TASKS_PATH = os.path.join(USER_HOME, ".yolo_training_visualization_platform/tasks")
MODELS_PATH = os.path.join(USER_HOME, ".yolo_training_visualization_platform/models")
TASKS_RESULT_FILES_PATH = os.path.join(USER_HOME, ".yolo_training_visualization_platform/tasks_result_files")
TASKS_RESULT_YAML_FILES_PATH = os.path.join(USER_HOME, ".yolo_training_visualization_platform/tasks/t")
TEST_RESULT_FILES_PATH = os.path.join(USER_HOME, ".yolo_training_visualization_platform/test_result_files")

YOLO_MODEL_LIST_URL = "https://api.github.com/repos/ultralytics/assets/releases/latest"

YOLO_MODEL_CACHE_EXPIRATION_TIME = 3600

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
    """
    获取模型存放路径
    """
    if not os.path.exists(MODELS_PATH):
        os.makedirs(MODELS_PATH)
        
    return MODELS_PATH

def get_tasks_result_files_path():
    """
    获取训练任务结果元数据
    """
    if not os.path.exists(TASKS_RESULT_FILES_PATH):
        os.makedirs(TASKS_RESULT_FILES_PATH)
        
    return TASKS_RESULT_FILES_PATH

def get_test_result_files_path():
    """
    获取测试任务结果元数据
    """
    if not os.path.exists(TEST_RESULT_FILES_PATH):
        os.makedirs(TEST_RESULT_FILES_PATH)
        
    return TEST_RESULT_FILES_PATH

def get_tasks_yaml_file_path():
    """
    获取trainingType=1任务的Yaml文件
    """
    if not os.path.exists(TASKS_RESULT_YAML_FILES_PATH):
        os.makedirs(TASKS_RESULT_YAML_FILES_PATH)
        
    return TASKS_RESULT_YAML_FILES_PATH

def get_yolo_model_list_url():
    """
    获取Yolo模型Github列表URL
    """
    return YOLO_MODEL_LIST_URL

def get_yolo_model_cahce_expiration_time():
    """
    获取Yolo模型缓存文件过期时间
    """
    return YOLO_MODEL_CACHE_EXPIRATION_TIME