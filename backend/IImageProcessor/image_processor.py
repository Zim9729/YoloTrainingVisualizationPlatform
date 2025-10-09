"""
图像处理器辅助类

提供图像预处理和后处理功能
"""

import cv2
import numpy as np
from typing import Tuple, Optional, Dict, Any
from pathlib import Path


class ImageProcessor:
    """图像处理辅助类"""
    
    @staticmethod
    def validate_image(img) -> bool:
        """验证图像是否有效"""
        if img is None:
            return False
        if img.size == 0:
            return False
        if len(img.shape) not in [2, 3]:  # 灰度图或彩色图
            return False
        return True
    
    @staticmethod
    def resize_image(img, max_width: int = 1920, max_height: int = 1080) -> np.ndarray:
        """调整图像大小，保持宽高比"""
        if not ImageProcessor.validate_image(img):
            raise ValueError("无效的图像")
        
        h, w = img.shape[:2]
        
        # 如果图像已经在限制范围内，直接返回
        if w <= max_width and h <= max_height:
            return img
        
        # 计算缩放比例
        scale_w = max_width / w
        scale_h = max_height / h
        scale = min(scale_w, scale_h)
        
        # 计算新尺寸
        new_w = int(w * scale)
        new_h = int(h * scale)
        
        # 调整大小
        resized = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)
        return resized
    
    @staticmethod
    def ensure_rgb(img) -> np.ndarray:
        """确保图像是RGB格式"""
        if not ImageProcessor.validate_image(img):
            raise ValueError("无效的图像")
        
        if len(img.shape) == 2:  # 灰度图
            return cv2.cvtColor(img, cv2.COLOR_GRAY2RGB)
        elif len(img.shape) == 3 and img.shape[2] == 3:  # 已经是3通道
            return img
        elif len(img.shape) == 3 and img.shape[2] == 4:  # RGBA
            return cv2.cvtColor(img, cv2.COLOR_RGBA2RGB)
        else:
            raise ValueError(f"不支持的图像格式: {img.shape}")
    
    @staticmethod
    def preprocess_for_tcp(img, max_size: Tuple[int, int] = (1920, 1080)) -> np.ndarray:
        """为TCP传输预处理图像"""
        # 验证图像
        if not ImageProcessor.validate_image(img):
            raise ValueError("无效的图像")
        
        # 确保是RGB格式
        processed = ImageProcessor.ensure_rgb(img)
        
        # 调整大小
        processed = ImageProcessor.resize_image(processed, max_size[0], max_size[1])
        
        return processed
    
    @staticmethod
    def get_image_stats(img) -> Dict[str, Any]:
        """获取图像统计信息"""
        if not ImageProcessor.validate_image(img):
            return {}
        
        h, w = img.shape[:2]
        channels = img.shape[2] if len(img.shape) == 3 else 1
        
        stats = {
            "width": w,
            "height": h,
            "channels": channels,
            "total_pixels": h * w,
            "dtype": str(img.dtype)
        }
        
        # 计算基本统计
        if channels == 1:
            stats.update({
                "mean": float(np.mean(img)),
                "std": float(np.std(img)),
                "min": int(np.min(img)),
                "max": int(np.max(img))
            })
        else:
            # 多通道图像，计算每个通道的统计
            for i in range(channels):
                channel_name = ['B', 'G', 'R'][i] if channels == 3 else f'C{i}'
                stats[f"{channel_name}_mean"] = float(np.mean(img[:, :, i]))
                stats[f"{channel_name}_std"] = float(np.std(img[:, :, i]))
        
        return stats
    
    @staticmethod
    def load_image_safe(image_path: str) -> Optional[np.ndarray]:
        """安全加载图像文件，确保文件句柄正确释放"""
        try:
            if not Path(image_path).exists():
                return None
            
            # 使用cv2.imread读取图像
            # cv2.imread会立即读取并关闭文件，但在Windows上可能有短暂的文件锁
            img = cv2.imread(image_path, cv2.IMREAD_COLOR)
            if img is None:
                return None
            
            # 创建副本并立即释放原始数据
            # 这有助于确保文件句柄尽快释放
            img_copy = img.copy()
            del img
            
            # OpenCV默认加载为BGR，转换为RGB
            img_rgb = cv2.cvtColor(img_copy, cv2.COLOR_BGR2RGB)
            del img_copy
            
            return img_rgb
            
        except Exception as e:
            print(f"加载图像失败: {image_path}, 错误: {e}")
            return None
    
    @staticmethod
    def save_image_safe(img, output_path: str, quality: int = 95) -> bool:
        """安全保存图像文件"""
        try:
            if not ImageProcessor.validate_image(img):
                return False
            
            # 确保输出目录存在
            Path(output_path).parent.mkdir(parents=True, exist_ok=True)
            
            # 如果是RGB格式，转换为BGR用于OpenCV保存
            if len(img.shape) == 3:
                img_bgr = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
            else:
                img_bgr = img
            
            # 根据文件扩展名设置保存参数
            ext = Path(output_path).suffix.lower()
            if ext in ['.jpg', '.jpeg']:
                params = [cv2.IMWRITE_JPEG_QUALITY, quality]
            elif ext == '.png':
                params = [cv2.IMWRITE_PNG_COMPRESSION, 9]
            else:
                params = []
            
            return cv2.imwrite(output_path, img_bgr, params)
            
        except Exception:
            return False
