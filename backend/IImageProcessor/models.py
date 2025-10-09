"""
IImageProcessor数据模型

定义图像处理相关的数据结构
"""

import json
import os
from datetime import datetime
from typing import List, Dict, Any, Optional


class ProcessingRecord:
    """图像处理记录模型"""
    
    def __init__(self, id, original_filename, image_id, camera_id, result, 
                 timestamp, processing_time=None, dataset_path=None, image_stats=None,
                 is_batch=False, batch_info=None):
        self.id = id
        self.original_filename = original_filename
        self.image_id = image_id
        self.camera_id = camera_id
        self.result = result
        self.timestamp = timestamp
        self.processing_time = processing_time
        self.dataset_path = dataset_path
        self.image_stats = image_stats
        self.is_batch = is_batch
        self.batch_info = batch_info  # 批量处理的详细信息 or {}
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典"""
        return {
            "id": self.id,
            "original_filename": self.original_filename,
            "image_id": self.image_id,
            "camera_id": self.camera_id,
            "result": self.result,
            "timestamp": self.timestamp,
            "processing_time": self.processing_time,
            "dataset_path": self.dataset_path,
            "image_stats": self.image_stats,
            "is_batch": self.is_batch,
            "batch_info": self.batch_info
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ProcessingRecord':
        """从字典创建实例"""
        return cls(**data)
    
    def save(self, history_path: str):
        """保存记录到文件"""
        if not os.path.exists(history_path):
            os.makedirs(history_path, exist_ok=True)
            
        record_file = os.path.join(history_path, f"{self.id}.json")
        
        with open(record_file, 'w', encoding='utf-8') as f:
            json.dump(self.to_dict(), f, ensure_ascii=False, indent=2)
    
    @classmethod
    def load(cls, record_id: str, history_path: str) -> Optional['ProcessingRecord']:
        """加载单个记录"""
        record_file = os.path.join(history_path, f"{record_id}.json")
        
        if not os.path.exists(record_file):
            return None
        
        try:
            with open(record_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            return cls.from_dict(data)
        except Exception:
            return None
    
    @classmethod
    def get_all(cls, history_path: str) -> List['ProcessingRecord']:
        """获取所有记录"""
        records = []
        
        if not os.path.exists(history_path):
            return records
        
        for filename in os.listdir(history_path):
            if filename.endswith('.json'):
                record_id = filename[:-5]  # 移除.json后缀
                record = cls.load(record_id, history_path)
                if record:
                    records.append(record)
        
        # 按时间戳排序（最新的在前）
        records.sort(key=lambda x: x.timestamp, reverse=True)
        return records
    
    @classmethod
    def get_paginated(cls, history_path: str, page: int, page_size: int) -> List['ProcessingRecord']:
        """分页获取记录"""
        all_records = cls.get_all(history_path)
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        return all_records[start_idx:end_idx]
    
    @classmethod
    def delete(cls, record_id: str, history_path: str) -> bool:
        """删除记录"""
        record_file = os.path.join(history_path, f"{record_id}.json")
        
        if os.path.exists(record_file):
            try:
                os.remove(record_file)
                return True
            except Exception:
                return False
        return False
    
    @classmethod
    def get_statistics(cls, history_path: str) -> Dict[str, Any]:
        """获取处理统计信息"""
        records = cls.get_all(history_path)
        
        if not records:
            return {
                "total_count": 0,
                "success_count": 0,
                "failure_count": 0,
                "avg_processing_time": 0,
                "last_processed": None
            }
        
        success_count = sum(1 for r in records if r.result.get('success', False))
        failure_count = len(records) - success_count
        
        # 计算平均处理时间（仅成功的记录）
        success_times = [r.processing_time for r in records if r.result.get('success', False)]
        avg_time = sum(success_times) / len(success_times) if success_times else 0
        
        return {
            "total_count": len(records),
            "success_count": success_count,
            "failure_count": failure_count,
            "success_rate": success_count / len(records) * 100,
            "avg_processing_time": avg_time,
            "last_processed": records[0].timestamp if records else None
        }


class ServiceStatus:
    """服务状态模型"""
    
    def __init__(self, service_type: str, status: str, host: str, port: int,
                 last_check: str, error_message: Optional[str] = None):
        self.service_type = service_type
        self.status = status  # online, offline, error
        self.host = host
        self.port = port
        self.last_check = last_check
        self.error_message = error_message
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典"""
        return {
            "service_type": self.service_type,
            "status": self.status,
            "host": self.host,
            "port": self.port,
            "last_check": self.last_check,
            "error_message": self.error_message
        }
    
    @classmethod
    def create_tcp_status(cls, host: str, port: int, is_connected: bool, 
                         error_message: Optional[str] = None) -> 'ServiceStatus':
        """创建TCP服务状态"""
        status = "online" if is_connected else "offline"
        if error_message and not is_connected:
            status = "error"
            
        return cls(
            service_type="tcp",
            status=status,
            host=host,
            port=port,
            last_check=datetime.now().isoformat(),
            error_message=error_message
        )
