"""
TCP图像处理客户端

基于您提供的协议实现与C++ TCP服务的通信
"""

import cv2
import socket
import struct
import json
import threading
import time
from datetime import datetime
from typing import Optional, Dict, Any, Tuple
from contextlib import contextmanager


class TCPImageClient:
    """TCP图像处理客户端类"""
    
    def __init__(self, host: str = "10.10.21.224", port: int = 16000):
        self.host = host
        self.port = port
        self.TCP_HEADER = b"{[(tcp_header)]}"  # 16字节
        self.TCP_TAIL = b"{[(tcp_tail)]}"      # 14字节
        self._lock = threading.Lock()
        self.connection_timeout = 30
        self.max_retries = 3
    
    @contextmanager
    def get_connection(self):
        """获取TCP连接的上下文管理器"""
        sock = None
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(self.connection_timeout)
            sock.connect((self.host, self.port))
            yield sock
        except Exception as e:
            raise ConnectionError(f"TCP连接失败 {self.host}:{self.port} - {e}")
        finally:
            if sock:
                try:
                    sock.close()
                except:
                    pass
    
    def test_connection(self, quick_check: bool = True) -> bool:
        """
        测试TCP连接
        
        Args:
            quick_check: 是否使用快速检测（短超时）
            
        Note:
            在Docker环境中，socket.connect可能会成功即使目标不可达，
            因此需要尝试发送/接收数据来真正验证连接
        """
        sock = None
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            # 快速检测使用2秒超时，正常使用配置的超时
            timeout = 2 if quick_check else self.connection_timeout
            sock.settimeout(timeout)
            sock.connect((self.host, self.port))
            
            # 发送一个探测数据包（使用协议头，服务端会识别）
            # 由于不是有效请求，服务端可能会关闭连接或返回错误，但这说明连接是通的
            try:
                # 发送协议头作为探测
                sock.sendall(self.TCP_HEADER)
                # 尝试接收任何数据（即使是错误响应）
                sock.settimeout(1)  # 1秒读取超时
                sock.recv(1)
            except socket.timeout:
                # 读取超时说明连接不可用或服务无响应
                print(f"TCP连接探测超时 {self.host}:{self.port}")
                return False
            except (ConnectionResetError, BrokenPipeError):
                # 连接被重置说明服务端存在（拒绝了无效请求）
                return True
            except Exception as e:
                # 其他发送/接收错误
                print(f"TCP连接探测失败 {self.host}:{self.port} - {e}")
                return False
            
            return True
        except (socket.timeout, socket.error, ConnectionRefusedError, OSError) as e:
            print(f"TCP连接测试失败 {self.host}:{self.port} - {e}")
            return False
        except Exception as e:
            print(f"TCP连接测试异常 {self.host}:{self.port} - {e}")
            return False
        finally:
            if sock:
                try:
                    sock.close()
                except:
                    pass
    
    def send_image(self, img, image_id: int, camera_id: int = 203) -> Dict[str, Any]:
        """
        发送OpenCV图像到TCP服务并获取处理结果
        
        参数:
            img: OpenCV图像对象
            image_id: 图像ID
            camera_id: 摄像头ID
            
        返回:
            Dict: 包含处理结果的字典
        """
        # 检查图像是否为空
        if img is None or img.size == 0:
            raise ValueError("图像为空或无效")
        
        # 压缩为JPEG
        try:
            encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), 100]
            result, buf = cv2.imencode('.jpg', img, encode_param)
            if not result:
                raise ValueError("图像编码失败")
        except Exception as e:
            raise ValueError(f"图像编码失败: {e}")
        
        # 获取图像信息
        h, w = img.shape[:2]
        c = 3  # 固定为3通道
        file_size = len(buf)
        
        # 重试机制
        last_exception = None
        for attempt in range(self.max_retries):
            try:
                with self.get_connection() as sock:
                    # 构建数据包
                    data = bytearray()
                    data.extend(self.TCP_HEADER)  # 16字节头部
                    data.extend(struct.pack('>H', camera_id))  # 摄像头ID (2字节，大端)
                    data.extend(struct.pack('>H', image_id))   # 图像ID (2字节，大端)
                    data.extend(struct.pack('>H', h))          # 图像高度 (2字节，大端)
                    data.extend(struct.pack('>H', w))          # 图像宽度 (2字节，大端)
                    data.extend(struct.pack('>H', c))          # 图像通道数 (2字节，大端)
                    data.extend(struct.pack('I', file_size))   # 文件大小 (4字节，大端)
                    data.extend(buf)                           # 图像数据
                    data.extend(self.TCP_TAIL)                 # 14字节尾部
                    
                    # 发送数据
                    sock.sendall(data)
                    print(f"✅ 已发送图像 ID {image_id}, 大小: {file_size} 字节 (尝试 {attempt + 1}/{self.max_retries})")
                    
                    # 读取响应
                    return self._read_response(sock, image_id)
                    
            except (socket.error, ConnectionError, OSError) as e:
                last_exception = e
                if attempt < self.max_retries - 1:
                    print(f"⚠️ TCP连接失败，{1}秒后重试 (尝试 {attempt + 1}/{self.max_retries}): {e}")
                    time.sleep(1)
                else:
                    raise ConnectionError(f"TCP连接失败，已重试 {self.max_retries} 次: {e}")
            except Exception as e:
                last_exception = e
                if attempt < self.max_retries - 1:
                    print(f"⚠️ 发送图像失败，{1}秒后重试 (尝试 {attempt + 1}/{self.max_retries}): {e}")
                    time.sleep(1)
                else:
                    raise RuntimeError(f"发送图像失败，已重试 {self.max_retries} 次: {e}")
        
        # 如果所有重试都失败了
        raise RuntimeError(f"发送图像失败，已重试 {self.max_retries} 次: {last_exception}")
    
    def _read_response(self, sock: socket.socket, expected_image_id: int) -> Dict[str, Any]:
        """读取TCP响应"""
        try:
            # 设置读取超时
            sock.settimeout(30)  # 30秒超时
            
            # 读取响应头 (22字节)
            head_buf = b''
            while len(head_buf) < 22:
                chunk = sock.recv(22 - len(head_buf))
                if not chunk:
                    raise ValueError(f"连接中断，响应头长度不足: {len(head_buf)}/22")
                head_buf += chunk
                
            # 检查响应头
            if head_buf[:16] != self.TCP_HEADER:
                raise ValueError(f"响应头格式错误: {head_buf[:16]}")
                
            # 解析响应头
            cam_id = struct.unpack('>H', head_buf[16:18])[0]
            recv_id = struct.unpack('>H', head_buf[18:20])[0]
            json_len = struct.unpack('>H', head_buf[20:22])[0]
            
            print(f"📥 接收响应: Camera ID {cam_id}, Image ID {recv_id}, JSON长度: {json_len}")
            
            # 验证图像ID是否匹配
            if recv_id != expected_image_id:
                print(f"⚠️ 图像ID不匹配: 期望 {expected_image_id}, 收到 {recv_id}")
            
            # 读取JSON数据
            json_buf = b''
            while len(json_buf) < json_len:
                chunk = sock.recv(min(4096, json_len - len(json_buf)))
                if not chunk:
                    raise ValueError(f"连接中断，JSON数据不完整: {len(json_buf)}/{json_len}")
                json_buf += chunk
                
            if len(json_buf) != json_len:
                raise ValueError(f"JSON数据长度不匹配: {len(json_buf)}/{json_len}")
                
            # 读取尾部
            tail_buf = b''
            while len(tail_buf) < 14:
                chunk = sock.recv(14 - len(tail_buf))
                if not chunk:
                    raise ValueError(f"连接中断，响应尾部不完整: {len(tail_buf)}/14")
                tail_buf += chunk
                
            if tail_buf != self.TCP_TAIL:
                raise ValueError(f"响应尾部格式错误: {tail_buf}")
                
            # 解析JSON结果
            try:
                json_result = json.loads(json_buf.decode('utf-8'))
            except json.JSONDecodeError as e:
                raise ValueError(f"JSON解析失败: {e}")
            
            # 返回标准化结果
            now = datetime.now()
            print(f"⏰ 处理完成时间: {now.strftime('%Y-%m-%d %H:%M:%S')}.{now.microsecond // 1000:03d}")
            print(f"📊 处理结果: {json_result}")
            
            return {
                "success": True,
                "camera_id": cam_id,
                "image_id": recv_id,
                "result": json_result,
                "timestamp": now.isoformat(),
                "raw_result": json_buf.decode('utf-8')
            }
            
        except socket.timeout:
            raise ConnectionError("读取TCP响应超时")
        except Exception as e:
            raise RuntimeError(f"读取TCP响应失败: {e}")
    
    def send_image_file(self, image_path: str, image_id: int, camera_id: int = 203) -> Dict[str, Any]:
        """从文件路径发送图像"""
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"无法加载图像文件: {image_path}")
        return self.send_image(img, image_id, camera_id)
    
    def send_image_bytes(self, image_bytes: bytes, image_id: int, camera_id: int = 203) -> Dict[str, Any]:
        """从字节数据发送图像"""
        import numpy as np
        
        # 将字节数据转换为numpy数组
        nparr = np.frombuffer(image_bytes, np.uint8)
        # 解码为OpenCV图像
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise ValueError("无法解码图像字节数据")
            
        return self.send_image(img, image_id, camera_id)
    
    def get_connection_info(self) -> Dict[str, Any]:
        """获取连接信息"""
        return {
            "host": self.host,
            "port": self.port,
            "timeout": self.connection_timeout,
            "max_retries": self.max_retries,
            "header_size": len(self.TCP_HEADER),
            "tail_size": len(self.TCP_TAIL)
        }
