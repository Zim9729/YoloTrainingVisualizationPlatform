import os

USER_HOME = os.path.expanduser("~")   # 用户主目录

DATASET_PATH = os.path.join(USER_HOME, ".yolo_training_visualization_platform", "dataset")   # 数据集存放路径
TASKS_PATH = os.path.join(USER_HOME, ".yolo_training_visualization_platform", "tasks")
MODELS_PATH = os.path.join(USER_HOME, ".yolo_training_visualization_platform", "models")
TASKS_RESULT_FILES_PATH = os.path.join(USER_HOME, ".yolo_training_visualization_platform", "tasks_result_files")
TASKS_RESULT_YAML_FILES_PATH = os.path.join(USER_HOME, ".yolo_training_visualization_platform", "tasks", "t")
TEST_RESULT_FILES_PATH = os.path.join(USER_HOME, ".yolo_training_visualization_platform", "test_result_files")
VALIDATION_RESULT_FILES_PATH = os.path.join(USER_HOME, ".yolo_training_visualization_platform", "validation_result_files")

# TCP图像处理服务配置
TCP_IMAGE_SERVICE_HOST = os.getenv('TCP_IMAGE_SERVICE_HOST', '127.0.0.1')
TCP_IMAGE_SERVICE_PORT = int(os.getenv('TCP_IMAGE_SERVICE_PORT', '16000'))
TCP_CONNECTION_TIMEOUT = int(os.getenv('TCP_CONNECTION_TIMEOUT', '5'))
TCP_MAX_RETRIES = int(os.getenv('TCP_MAX_RETRIES', '3'))

# 图像处理历史存储路径
IMAGE_PROCESSING_HISTORY_PATH = os.path.join(USER_HOME, ".yolo_training_visualization_platform", "image_processing_history")

# 图像处理配置
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10MB
SUPPORTED_IMAGE_FORMATS = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp']
JPEG_QUALITY = 100

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

def get_validation_result_files_path():
    """
    获取验证任务结果元数据
    """
    if not os.path.exists(VALIDATION_RESULT_FILES_PATH):
        os.makedirs(VALIDATION_RESULT_FILES_PATH)
        
    return VALIDATION_RESULT_FILES_PATH

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

def get_yolo_model_cache_expiration_time():
    """
    获取Yolo模型缓存文件过期时间
    """
    return YOLO_MODEL_CACHE_EXPIRATION_TIME

def get_tcp_image_service_config():
    """
    获取TCP图像服务配置
    """
    return {
        "host": TCP_IMAGE_SERVICE_HOST,
        "port": TCP_IMAGE_SERVICE_PORT,
        "timeout": TCP_CONNECTION_TIMEOUT,
        "max_retries": TCP_MAX_RETRIES
    }

def get_image_processing_history_path():
    """
    获取图像处理历史存储路径
    """
    if not os.path.exists(IMAGE_PROCESSING_HISTORY_PATH):
        os.makedirs(IMAGE_PROCESSING_HISTORY_PATH)
    return IMAGE_PROCESSING_HISTORY_PATH

def get_image_processing_config():
    """
    获取图像处理配置
    """
    return {
        "max_image_size": MAX_IMAGE_SIZE,
        "supported_formats": SUPPORTED_IMAGE_FORMATS,
        "jpeg_quality": JPEG_QUALITY
    }