"""
服务配置管理模块
用于保存和读取用户配置的服务地址
"""

import os
import json
from config import (
    get_image_processing_history_path,
    TCP_IMAGE_SERVICE_HOST,
    TCP_IMAGE_SERVICE_PORT,
    TRITON_SERVER_HOST,
    TRITON_SERVER_PORT,
    LABEL_STUDIO_HOST,
    LABEL_STUDIO_PORT,
    LABEL_STUDIO_API_TOKEN
)

# 配置文件路径
def _get_config_dir():
    """获取配置目录"""
    from config import _BASE_DIR
    config_dir = os.path.join(_BASE_DIR, "config")
    if not os.path.exists(config_dir):
        os.makedirs(config_dir)
    return config_dir

def _get_service_config_path():
    """获取服务配置文件路径"""
    return os.path.join(_get_config_dir(), "services.json")

# 默认配置
DEFAULT_SERVICE_CONFIG = {
    "tcp_image_service": {
        "host": TCP_IMAGE_SERVICE_HOST,
        "port": TCP_IMAGE_SERVICE_PORT
    },
    "triton_server": {
        "host": TRITON_SERVER_HOST,
        "port": TRITON_SERVER_PORT
    },
    "label_studio": {
        "host": LABEL_STUDIO_HOST,
        "port": LABEL_STUDIO_PORT,
        "api_token": LABEL_STUDIO_API_TOKEN
    }
}

def load_service_config():
    """
    加载服务配置
    如果配置文件不存在，返回默认配置
    """
    config_path = _get_service_config_path()
    
    if os.path.exists(config_path):
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                saved_config = json.load(f)
                # 合并默认配置和保存的配置
                config = DEFAULT_SERVICE_CONFIG.copy()
                for key in config:
                    if key in saved_config:
                        config[key].update(saved_config[key])
                return config
        except Exception as e:
            print(f"加载配置文件失败: {e}")
            return DEFAULT_SERVICE_CONFIG.copy()
    else:
        return DEFAULT_SERVICE_CONFIG.copy()

def save_service_config(config):
    """
    保存服务配置
    
    Args:
        config: 服务配置字典
    """
    config_path = _get_service_config_path()
    
    try:
        with open(config_path, 'w', encoding='utf-8') as f:
            json.dump(config, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"保存配置文件失败: {e}")
        return False

def update_service_config(service_id, host=None, port=None, api_token=None):
    """
    更新单个服务的配置
    
    Args:
        service_id: 服务ID (tcp_image_service, triton_server, label_studio)
        host: 主机地址
        port: 端口
        api_token: API Token (仅 label_studio)
    
    Returns:
        更新后的完整配置
    """
    config = load_service_config()
    
    if service_id not in config:
        raise ValueError(f"未知的服务ID: {service_id}")
    
    if host is not None:
        config[service_id]["host"] = host
    if port is not None:
        config[service_id]["port"] = int(port)
    if api_token is not None and service_id == "label_studio":
        config[service_id]["api_token"] = api_token
    
    save_service_config(config)
    return config

def get_service_address(service_id):
    """
    获取服务地址
    
    Args:
        service_id: 服务ID
    
    Returns:
        (host, port) 元组
    """
    config = load_service_config()
    
    if service_id in config:
        return config[service_id].get("host"), config[service_id].get("port")
    
    return None, None

def get_tcp_service_address():
    """获取 TCP 图像服务地址"""
    return get_service_address("tcp_image_service")

def get_triton_service_address():
    """获取 Triton 服务地址"""
    return get_service_address("triton_server")

def get_label_studio_config():
    """获取 Label Studio 配置"""
    config = load_service_config()
    ls_config = config.get("label_studio", {})
    return ls_config.get("host"), ls_config.get("port"), ls_config.get("api_token")
