import os

USER_HOME = os.path.expanduser("~")   # 用户主目录

DATASET_PATH = os.path.join(USER_HOME, ".yolo_training_visualization_platform", "dataset")   # 数据集存放路径
TASKS_PATH = os.path.join(USER_HOME, ".yolo_training_visualization_platform", "tasks")
MODELS_PATH = os.path.join(USER_HOME, ".yolo_training_visualization_platform", "models")
TASKS_RESULT_FILES_PATH = os.path.join(USER_HOME, ".yolo_training_visualization_platform", "tasks_result_files")
TASKS_RESULT_YAML_FILES_PATH = os.path.join(USER_HOME, ".yolo_training_visualization_platform", "tasks", "t")
TEST_RESULT_FILES_PATH = os.path.join(USER_HOME, ".yolo_training_visualization_platform", "test_result_files")
VALIDATION_RESULT_FILES_PATH = os.path.join(USER_HOME, ".yolo_training_visualization_platform", "validation_result_files")

def _safe_int_env(key: str, default: int) -> int:
    """
    安全地从环境变量获取整数值
    
    Args:
        key: 环境变量键名
        default: 默认值
    
    Returns:
        整数值
    """
    try:
        return int(os.getenv(key, str(default)))
    except (ValueError, TypeError) as e:
        print(f"警告: 环境变量 {key} 的值无效 ({os.getenv(key)}), 使用默认值 {default}")
        return default

# TCP图像处理服务配置
TCP_IMAGE_SERVICE_HOST = os.getenv('TCP_IMAGE_SERVICE_HOST', '127.0.0.1')
TCP_IMAGE_SERVICE_PORT = _safe_int_env('TCP_IMAGE_SERVICE_PORT', 16000)
TCP_CONNECTION_TIMEOUT = _safe_int_env('TCP_CONNECTION_TIMEOUT', 5)
TCP_MAX_RETRIES = _safe_int_env('TCP_MAX_RETRIES', 3)

# 图像处理历史存储路径
IMAGE_PROCESSING_HISTORY_PATH = os.path.join(USER_HOME, ".yolo_training_visualization_platform", "image_processing_history")

# 图像处理配置
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10MB
SUPPORTED_IMAGE_FORMATS = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp']
JPEG_QUALITY = 100

# Triton 推理服务配置
TRITON_SERVER_HOST = os.getenv('TRITON_SERVER_HOST', 'localhost')
TRITON_SERVER_PORT = _safe_int_env('TRITON_SERVER_PORT', 8000)
TRITON_CONNECTION_TIMEOUT = _safe_int_env('TRITON_CONNECTION_TIMEOUT', 5)

# Label Studio 标注服务配置
LABEL_STUDIO_HOST = os.getenv('LABEL_STUDIO_HOST', '10.10.10.96')
LABEL_STUDIO_PORT = _safe_int_env('LABEL_STUDIO_PORT', 8080)
LABEL_STUDIO_API_TOKEN = os.getenv('LABEL_STUDIO_API_TOKEN', 'Token c438e617f6488a1d77ee04208e4c917723e25a34')  # 请替换为实际的 Token
LABEL_STUDIO_CONNECTION_TIMEOUT = _safe_int_env('LABEL_STUDIO_CONNECTION_TIMEOUT', 5)

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

def get_triton_server_config():
    """
    获取Triton服务器配置
    """
    return {
        "host": TRITON_SERVER_HOST,
        "port": TRITON_SERVER_PORT,
        "timeout": TRITON_CONNECTION_TIMEOUT
    }

def get_label_studio_config():
    """
    获取Label Studio服务配置
    """
    return {
        "host": LABEL_STUDIO_HOST,
        "port": LABEL_STUDIO_PORT,
        "api_token": LABEL_STUDIO_API_TOKEN,
        "timeout": LABEL_STUDIO_CONNECTION_TIMEOUT
    }