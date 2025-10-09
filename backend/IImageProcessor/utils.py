"""
IImageProcessor工具函数模块

提供图像处理相关的工具函数
"""

import os
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
from pathlib import Path


def generate_image_id() -> int:
    """生成图像ID"""
    return int(datetime.now().timestamp() * 1000) % 65535  # 确保在2字节范围内


def validate_image_file(file_path: str) -> bool:
    """验证图像文件是否有效"""
    if not os.path.exists(file_path):
        return False
    
    # 检查文件扩展名
    valid_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp'}
    file_ext = Path(file_path).suffix.lower()
    
    return file_ext in valid_extensions


def get_image_info(file_path: str) -> Dict[str, Any]:
    """获取图像文件信息"""
    if not os.path.exists(file_path):
        return {}
    
    stat = os.stat(file_path)
    return {
        "filename": os.path.basename(file_path),
        "size": stat.st_size,
        "modified_time": datetime.fromtimestamp(stat.st_mtime).isoformat()
    }


def format_processing_time(seconds: float) -> str:
    """格式化处理时间显示"""
    if seconds < 1:
        return f"{seconds*1000:.1f}ms"
    else:
        return f"{seconds:.2f}s"


def create_processing_summary(result: Dict[str, Any]) -> str:
    """创建处理结果摘要"""
    if not result.get('success', False):
        return "处理失败"
    
    processing_time = result.get('processing_time', 0)
    time_str = format_processing_time(processing_time)
    
    return f"处理成功 - 用时: {time_str}"
