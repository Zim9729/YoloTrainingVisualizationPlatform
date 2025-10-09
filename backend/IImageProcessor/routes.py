"""
IImageProcessor API路由

提供TCP图像处理服务的REST API接口
"""

from flask import Blueprint, request, jsonify, make_response
from werkzeug.utils import secure_filename
import os
import tempfile
import cv2
import uuid
import time
import json
from datetime import datetime
from pathlib import Path

from .tcp_image_client import TCPImageClient
from .image_processor import ImageProcessor
from .models import ProcessingRecord, ServiceStatus
from .utils import generate_image_id, validate_image_file, get_image_info
from tools.format_output import format_output

# 创建蓝图
IImageProcessor_bp = Blueprint('IImageProcessor', __name__)

# 全局TCP客户端实例
tcp_client = None

def get_tcp_client():
    """获取TCP客户端实例"""
    global tcp_client
    if tcp_client is None:
        from config import get_tcp_image_service_config
        config = get_tcp_image_service_config()
        tcp_client = TCPImageClient(
            host=config['host'],
            port=config['port']
        )
        tcp_client.connection_timeout = config['timeout']
        tcp_client.max_retries = config['max_retries']
    return tcp_client

def get_history_path():
    """获取历史记录存储路径"""
    from config import get_image_processing_history_path
    return get_image_processing_history_path()

@IImageProcessor_bp.route('/info', methods=['GET'])
def info():
    """获取模块信息"""
    return format_output(data={
        "module": "IImageProcessor",
        "version": "1.0.0",
        "description": "TCP图像处理服务模块",
        "status": "运行中"
    })

@IImageProcessor_bp.route('/testConnection', methods=['GET'])
def test_connection():
    """测试TCP服务连接"""
    try:
        client = get_tcp_client()
        is_connected = client.test_connection()
        
        connection_info = client.get_connection_info()
        
        return format_output(
            data={
                "connected": is_connected,
                "connection_info": connection_info,
                "timestamp": datetime.now().isoformat()
            },
            msg="连接测试完成"
        )
    except Exception as e:
        return format_output(
            code=500,
            msg=f"连接测试失败: {str(e)}"
        )

@IImageProcessor_bp.route('/processImage', methods=['POST'])
def process_image():
    """处理上传的图像"""
    try:
        # 检查文件
        if 'image' not in request.files:
            return format_output(code=400, msg="未上传图像文件")
        
        file = request.files['image']
        if file.filename == '':
            return format_output(code=400, msg="未选择文件")
        
        # 获取参数
        camera_id = int(request.form.get('camera_id', 203))
        image_id = int(request.form.get('image_id', generate_image_id()))
        
        # 保存临时文件
        tmp_file_path = None
        img = None
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp_file:
                file.save(tmp_file.name)
                tmp_file_path = tmp_file.name
            
            # 验证图像文件
            if not validate_image_file(tmp_file_path):
                return format_output(code=400, msg="无效的图像文件格式")
            
            # 读取图像
            img = ImageProcessor.load_image_safe(tmp_file_path)
            if img is None:
                return format_output(code=400, msg="无法读取图像文件")
            
            # 立即删除临时文件（图像已加载到内存）
            try:
                if tmp_file_path and os.path.exists(tmp_file_path):
                    # 在Windows上添加短暂延迟以确保文件句柄释放
                    time.sleep(0.1)
                    os.unlink(tmp_file_path)
                    tmp_file_path = None  # 标记已删除
            except Exception as e:
                print(f"警告: 删除临时文件时出错 {tmp_file_path}: {e}")
                # 继续处理，稍后再次尝试删除
            
            # 预处理图像
            processed_img = ImageProcessor.preprocess_for_tcp(img)
            image_stats = ImageProcessor.get_image_stats(processed_img)
            
            # 释放原始图像内存
            del img
            
            # 发送到TCP服务
            start_time = time.time()
            client = get_tcp_client()
            result = client.send_image(processed_img, image_id, camera_id)
            processing_time = time.time() - start_time
            
            result['processing_time'] = processing_time
            
            # 保存处理记录
            record = ProcessingRecord(
                id=str(uuid.uuid4()),
                original_filename=file.filename,
                image_id=image_id,
                camera_id=camera_id,
                result=result,
                timestamp=datetime.now().isoformat(),
                processing_time=processing_time,
                dataset_path=None,
                image_stats=image_stats
            )
            record.save(get_history_path())
            
            return format_output(
                data={
                    "record_id": record.id,
                    "result": result,
                    "processing_time": processing_time,
                    "image_stats": image_stats
                },
                msg="图像处理完成"
            )
            
        finally:
            # 清理可能残留的临时文件
            if tmp_file_path and os.path.exists(tmp_file_path):
                try:
                    # 多次尝试删除
                    for _ in range(3):
                        try:
                            os.unlink(tmp_file_path)
                            break
                        except (OSError, PermissionError):
                            time.sleep(0.2)
                except Exception as e:
                    # 最后的延迟删除尝试
                    print(f"警告: 无法删除临时文件 {tmp_file_path}: {e}")
                    import threading
                    def delayed_delete():
                        for _ in range(5):
                            time.sleep(1)
                            try:
                                if os.path.exists(tmp_file_path):
                                    os.unlink(tmp_file_path)
                                    break
                            except:
                                pass
                    threading.Thread(target=delayed_delete, daemon=True).start()
            
    except Exception as e:
        return format_output(
            code=500,
            msg=f"处理失败: {str(e)}"
        )

@IImageProcessor_bp.route('/processDatasetImage', methods=['POST'])
def process_dataset_image():
    """处理数据集中的图像"""
    try:
        data = request.get_json()
        dataset_path = data.get('dataset_path')
        image_path = data.get('image_path')
        camera_id = int(data.get('camera_id', 203))
        image_id = int(data.get('image_id', generate_image_id()))
        
        if not dataset_path or not image_path:
            return format_output(code=400, msg="缺少必要参数")
        
        # 构建完整图像路径
        full_image_path = os.path.join(dataset_path, image_path)
        if not os.path.exists(full_image_path):
            return format_output(code=404, msg="图像文件不存在")
        
        # 验证图像文件
        if not validate_image_file(full_image_path):
            return format_output(code=400, msg="无效的图像文件格式")
        
        # 读取图像
        img = ImageProcessor.load_image_safe(full_image_path)
        if img is None:
            return format_output(code=400, msg="无法读取图像文件")
        
        # 预处理图像
        processed_img = ImageProcessor.preprocess_for_tcp(img)
        
        # 获取图像统计信息
        image_stats = ImageProcessor.get_image_stats(processed_img)
        
        # 发送到TCP服务
        start_time = time.time()
        client = get_tcp_client()
        result = client.send_image(processed_img, image_id, camera_id)
        processing_time = time.time() - start_time
        
        result['processing_time'] = processing_time
        
        # 保存处理记录
        record = ProcessingRecord(
            id=str(uuid.uuid4()),
            original_filename=os.path.basename(image_path),
            image_id=image_id,
            camera_id=camera_id,
            result=result,
            timestamp=datetime.now().isoformat(),
            processing_time=processing_time,
            dataset_path=dataset_path,
            image_stats=image_stats
        )
        record.save(get_history_path())
        
        return format_output(
            data={
                "record_id": record.id,
                "result": result,
                "image_stats": image_stats
            },
            msg="图像处理完成"
        )
        
    except Exception as e:
        return format_output(
            code=500,
            msg=f"图像处理失败: {str(e)}"
        )

@IImageProcessor_bp.route('/getProcessingHistory', methods=['GET'])
def get_processing_history():
    """获取处理历史记录"""
    try:
        page = int(request.args.get('page', 1))
        page_size = int(request.args.get('page_size', 20))
        
        history_path = get_history_path()
        records = ProcessingRecord.get_paginated(history_path, page, page_size)
        
        return format_output(
            data={
                "records": [record.to_dict() for record in records],
                "page": page,
                "page_size": page_size,
                "total_records": len(ProcessingRecord.get_all(history_path))
            },
            msg="获取处理历史成功"
        )
        
    except Exception as e:
        return format_output(
            code=500,
            msg=f"获取处理历史失败: {str(e)}"
        )

@IImageProcessor_bp.route('/getProcessingStatistics', methods=['GET'])
def get_processing_statistics():
    """获取处理统计信息"""
    try:
        history_path = get_history_path()
        statistics = ProcessingRecord.get_statistics(history_path)
        
        return format_output(
            data=statistics,
            msg="获取统计信息成功"
        )
        
    except Exception as e:
        return format_output(
            code=500,
            msg=f"获取统计信息失败: {str(e)}"
        )

@IImageProcessor_bp.route('/getServiceStatus', methods=['GET'])
def get_service_status():
    """获取TCP服务状态"""
    try:
        client = get_tcp_client()
        
        error_message = None
        try:
            is_connected = client.test_connection()
        except Exception as e:
            is_connected = False
            error_message = str(e)
        
        status = ServiceStatus.create_tcp_status(
            host=client.host,
            port=client.port,
            is_connected=is_connected,
            error_message=error_message
        )
        
        return format_output(
            data=status.to_dict(),
            msg="获取服务状态成功"
        )
        
    except Exception as e:
        return format_output(
            code=500,
            msg=f"获取服务状态失败: {str(e)}"
        )

@IImageProcessor_bp.route('/deleteProcessingRecord', methods=['POST'])
def delete_processing_record():
    """删除处理记录"""
    try:
        data = request.get_json()
        record_id = data.get('record_id')
        
        if not record_id:
            return format_output(code=400, msg="缺少记录ID")
        
        history_path = get_history_path()
        success = ProcessingRecord.delete(record_id, history_path)
        
        if success:
            return format_output(msg="删除记录成功")
        else:
            return format_output(code=404, msg="记录不存在")
        
    except Exception as e:
        return format_output(
            code=500,
            msg=f"删除记录失败: {str(e)}"
        )

@IImageProcessor_bp.route('/clearProcessingHistory', methods=['POST'])
def clear_processing_history():
    """清空处理历史记录"""
    try:
        history_path = get_history_path()
        
        if not os.path.exists(history_path):
            return format_output(msg="历史记录已为空")
        
        # 删除所有JSON文件
        deleted_count = 0
        for filename in os.listdir(history_path):
            if filename.endswith('.json'):
                file_path = os.path.join(history_path, filename)
                try:
                    os.remove(file_path)
                    deleted_count += 1
                except Exception:
                    pass
        
        return format_output(
            data={"deleted_count": deleted_count},
            msg=f"已清空 {deleted_count} 条历史记录"
        )
        
    except Exception as e:
        return format_output(
            code=500,
            msg=f"清空历史记录失败: {str(e)}"
        )

@IImageProcessor_bp.route('/processFolderImages', methods=['POST'])
def process_folder_images():
    """批量处理文件夹中的图像"""
    try:
        data = request.get_json()
        folder_path = data.get('folder_path')
        camera_id = int(data.get('camera_id', 203))
        
        if not folder_path:
            return format_output(code=400, msg="缺少文件夹路径参数")
        
        if not os.path.exists(folder_path):
            return format_output(code=404, msg="指定的文件夹不存在")
        
        if not os.path.isdir(folder_path):
            return format_output(code=400, msg="指定的路径不是文件夹")
        
        # 获取支持的图像格式
        from config import get_image_processing_config
        config = get_image_processing_config()
        supported_formats = config['supported_formats']
        
        # 递归扫描文件夹中的图像文件（包括子文件夹）
        image_files = []
        for root, dirs, files in os.walk(folder_path):
            for filename in files:
                file_path = os.path.join(root, filename)
                _, ext = os.path.splitext(filename.lower())
                if ext in supported_formats:
                    # 计算相对路径用于显示
                    relative_path = os.path.relpath(file_path, folder_path)
                    image_files.append({
                        'filename': filename,
                        'relative_path': relative_path,
                        'path': file_path,
                        'size': os.path.getsize(file_path),
                        'directory': os.path.dirname(relative_path) if os.path.dirname(relative_path) else '根目录'
                    })
        
        if not image_files:
            return format_output(
                code=404, 
                msg=f"文件夹中没有找到支持的图像文件 (支持格式: {', '.join(supported_formats)})"
            )
        
        # 开始批量处理
        results = []
        success_count = 0
        error_count = 0
        total_processing_time = 0
        batch_start_time = time.time()
        
        for i, image_file in enumerate(image_files):
            try:
                # 生成图像ID
                image_id = generate_image_id()
                
                # 读取并验证图像
                img = ImageProcessor.load_image_safe(image_file['path'])
                if img is None:
                    error_count += 1
                    results.append({
                        'filename': image_file['filename'],
                        'relative_path': image_file.get('relative_path', image_file['filename']),
                        'success': False,
                        'error': '无法读取图像文件',
                        'progress': i + 1,
                        'total': len(image_files)
                    })
                    continue
                
                # 预处理图像
                processed_img = ImageProcessor.preprocess_for_tcp(img)
                image_stats = ImageProcessor.get_image_stats(processed_img)
                
                # 发送到TCP服务
                start_time = time.time()
                client = get_tcp_client()
                result = client.send_image(processed_img, image_id, camera_id)
                processing_time = time.time() - start_time
                total_processing_time += processing_time
                
                result['processing_time'] = processing_time
                
                success_count += 1
                results.append({
                    'filename': image_file['filename'],
                    'relative_path': image_file.get('relative_path', image_file['filename']),
                    'success': True,
                    'image_id': image_id,
                    'processing_time': processing_time,
                    'result': result,
                    'progress': i + 1,
                    'total': len(image_files)
                })
                
            except Exception as e:
                error_count += 1
                results.append({
                    'filename': image_file['filename'],
                    'relative_path': image_file.get('relative_path', image_file['filename']),
                    'success': False,
                    'error': str(e),
                    'progress': i + 1,
                    'total': len(image_files)
                })
        
        # 创建统一的批量处理记录
        batch_total_time = time.time() - batch_start_time
        batch_record = ProcessingRecord(
            id=str(uuid.uuid4()),
            original_filename=f"批量处理 - {os.path.basename(folder_path)}",
            image_id=0,  # 批量处理使用特殊ID
            camera_id=camera_id,
            result={
                'batch_processing': True,
                'summary': {
                    'total_files': len(image_files),
                    'success_count': success_count,
                    'error_count': error_count,
                    'total_processing_time': total_processing_time,
                    'batch_total_time': batch_total_time
                }
            },
            timestamp=datetime.now().isoformat(),
            processing_time=batch_total_time,
            dataset_path=folder_path,
            image_stats=None,
            is_batch=True,
            batch_info={
                'folder_path': folder_path,
                'total_files': len(image_files),
                'success_count': success_count,
                'error_count': error_count,
                'results': results,
                'processing_summary': {
                    'avg_processing_time': total_processing_time / success_count if success_count > 0 else 0,
                    'total_processing_time': total_processing_time,
                    'batch_total_time': batch_total_time
                }
            }
        )
        batch_record.save(get_history_path())
        
        return format_output(
            data={
                'total_files': len(image_files),
                'success_count': success_count,
                'error_count': error_count,
                'results': results,
                'folder_path': folder_path
            },
            msg=f"批量处理完成: 成功 {success_count} 个，失败 {error_count} 个"
        )
        
    except Exception as e:
        return format_output(
            code=500,
            msg=f"批量处理失败: {str(e)}"
        )

@IImageProcessor_bp.route('/getFolderImageList', methods=['POST'])
def get_folder_image_list():
    """获取文件夹中的图像文件列表"""
    try:
        data = request.get_json()
        folder_path = data.get('folder_path')
        
        if not folder_path:
            return format_output(code=400, msg="缺少文件夹路径参数")
        
        if not os.path.exists(folder_path):
            return format_output(code=404, msg="指定的文件夹不存在")
        
        if not os.path.isdir(folder_path):
            return format_output(code=400, msg="指定的路径不是文件夹")
        
        # 获取支持的图像格式
        from config import get_image_processing_config
        config = get_image_processing_config()
        supported_formats = config['supported_formats']
        
        # 递归扫描文件夹中的图像文件（包括子文件夹）
        image_files = []
        total_size = 0
        directory_stats = {}  # 统计每个目录的文件数量
        
        for root, dirs, files in os.walk(folder_path):
            for filename in files:
                file_path = os.path.join(root, filename)
                _, ext = os.path.splitext(filename.lower())
                if ext in supported_formats:
                    file_size = os.path.getsize(file_path)
                    total_size += file_size
                    
                    # 计算相对路径用于显示
                    relative_path = os.path.relpath(file_path, folder_path)
                    directory = os.path.dirname(relative_path) if os.path.dirname(relative_path) else '根目录'
                    
                    # 统计目录文件数量
                    if directory not in directory_stats:
                        directory_stats[directory] = 0
                    directory_stats[directory] += 1
                    
                    # 获取图像基本信息
                    try:
                        img_info = get_image_info(file_path)
                    except:
                        img_info = None
                    
                    image_files.append({
                        'filename': filename,
                        'relative_path': relative_path,
                        'path': file_path,
                        'size': file_size,
                        'size_mb': round(file_size / (1024 * 1024), 2),
                        'directory': directory,
                        'image_info': img_info
                    })
        
        # 按文件名排序
        image_files.sort(key=lambda x: x['filename'])
        
        return format_output(
            data={
                'folder_path': folder_path,
                'total_files': len(image_files),
                'total_size': total_size,
                'total_size_mb': round(total_size / (1024 * 1024), 2),
                'supported_formats': supported_formats,
                'directory_stats': directory_stats,
                'files': image_files
            },
            msg=f"递归扫描完成，找到 {len(image_files)} 个图像文件，分布在 {len(directory_stats)} 个目录中"
        )
        
    except Exception as e:
        return format_output(
            code=500,
            msg=f"获取文件列表失败: {str(e)}"
        )

@IImageProcessor_bp.route('/downloadProcessingResult/<record_id>', methods=['GET'])
def download_processing_result(record_id):
    """下载单个处理结果"""
    try:
        history_path = get_history_path()
        record_file = os.path.join(history_path, f"{record_id}.json")
        
        if not os.path.exists(record_file):
            return format_output(code=404, msg="处理记录不存在")
        
        # 读取记录
        with open(record_file, 'r', encoding='utf-8') as f:
            record_data = json.load(f)
        
        # 生成下载文件名
        timestamp = record_data.get('timestamp', '').replace(':', '-').replace('T', '_')
        if record_data.get('is_batch'):
            filename = f"batch_result_{timestamp}.json"
        else:
            original_name = record_data.get('original_filename', 'unknown')
            name_without_ext = os.path.splitext(original_name)[0]
            filename = f"result_{name_without_ext}_{timestamp}.json"
        
        # 创建响应
        response = make_response(json.dumps(record_data, ensure_ascii=False, indent=2))
        response.headers['Content-Type'] = 'application/json; charset=utf-8'
        response.headers['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        return response
        
    except Exception as e:
        return format_output(
            code=500,
            msg=f"下载失败: {str(e)}"
        )

@IImageProcessor_bp.route('/downloadBatchResults', methods=['POST'])
def download_batch_results():
    """下载批量处理结果汇总"""
    try:
        data = request.get_json()
        record_ids = data.get('record_ids', [])
        
        if not record_ids:
            return format_output(code=400, msg="缺少记录ID参数")
        
        history_path = get_history_path()
        results = []
        
        for record_id in record_ids:
            record_file = os.path.join(history_path, f"{record_id}.json")
            if os.path.exists(record_file):
                with open(record_file, 'r', encoding='utf-8') as f:
                    record_data = json.load(f)
                    results.append(record_data)
        
        if not results:
            return format_output(code=404, msg="没有找到有效的处理记录")
        
        # 生成汇总数据
        summary = {
            'export_time': datetime.now().isoformat(),
            'total_records': len(results),
            'records': results
        }
        
        # 生成文件名
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"processing_results_export_{timestamp}.json"
        
        # 创建响应
        response = make_response(json.dumps(summary, ensure_ascii=False, indent=2))
        response.headers['Content-Type'] = 'application/json; charset=utf-8'
        response.headers['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        return response
        
    except Exception as e:
        return format_output(
            code=500,
            msg=f"批量下载失败: {str(e)}"
        )

@IImageProcessor_bp.route('/getStatistics', methods=['GET'])
def get_statistics():
    """获取处理统计信息"""
    try:
        history_path = get_history_path()
        
        if not os.path.exists(history_path):
            return format_output(data={
                "total_processed": 0,
                "success_count": 0,
                "error_count": 0,
                "success_rate": 0.0,
                "avg_processing_time": 0.0,
                "batch_count": 0,
                "single_count": 0,
                "total_batch_files": 0,
                "processing_time_stats": {
                    "min": 0,
                    "max": 0,
                    "median": 0
                },
                "daily_stats": [],
                "format_stats": {}
            })
        
        total_processed = 0
        success_count = 0
        error_count = 0
        total_processing_time = 0.0
        batch_count = 0
        single_count = 0
        total_batch_files = 0
        processing_times = []
        daily_stats = {}
        format_stats = {}
        
        for filename in os.listdir(history_path):
            if filename.endswith('.json'):
                try:
                    file_path = os.path.join(history_path, filename)
                    with open(file_path, 'r', encoding='utf-8') as f:
                        record = json.load(f)
                    
                    total_processed += 1
                    
                    # 统计批量vs单个处理
                    if record.get('is_batch', False):
                        batch_count += 1
                        batch_info = record.get('batch_info', {})
                        total_batch_files += batch_info.get('total_files', 0)
                        success_count += batch_info.get('success_count', 0)
                        error_count += batch_info.get('error_count', 0)
                    else:
                        single_count += 1
                        if record.get('result', {}).get('success', False):
                            success_count += 1
                        else:
                            error_count += 1
                    
                    # 处理时间统计
                    processing_time = record.get('processing_time', 0)
                    if processing_time:
                        total_processing_time += processing_time
                        processing_times.append(processing_time)
                    
                    # 按日期统计
                    timestamp = record.get('timestamp', '')
                    if timestamp:
                        date = timestamp.split('T')[0]  # 获取日期部分
                        if date not in daily_stats:
                            daily_stats[date] = {'count': 0, 'success': 0, 'error': 0}
                        daily_stats[date]['count'] += 1
                        
                        if record.get('is_batch', False):
                            batch_info = record.get('batch_info', {})
                            daily_stats[date]['success'] += batch_info.get('success_count', 0)
                            daily_stats[date]['error'] += batch_info.get('error_count', 0)
                        else:
                            if record.get('result', {}).get('success', False):
                                daily_stats[date]['success'] += 1
                            else:
                                daily_stats[date]['error'] += 1
                    
                    # 文件格式统计
                    filename_orig = record.get('original_filename', '')
                    if filename_orig and not record.get('is_batch', False):
                        ext = os.path.splitext(filename_orig.lower())[1]
                        if ext:
                            format_stats[ext] = format_stats.get(ext, 0) + 1
                        
                except Exception:
                    continue
        
        # 计算统计指标
        success_rate = (success_count / (success_count + error_count) * 100) if (success_count + error_count) > 0 else 0.0
        avg_processing_time = (total_processing_time / len(processing_times)) if processing_times else 0.0
        
        # 处理时间统计
        processing_time_stats = {
            "min": min(processing_times) if processing_times else 0,
            "max": max(processing_times) if processing_times else 0,
            "median": sorted(processing_times)[len(processing_times)//2] if processing_times else 0
        }
        
        # 转换日期统计为列表
        daily_stats_list = [
            {
                "date": date,
                "count": stats['count'],
                "success": stats['success'],
                "error": stats['error']
            }
            for date, stats in sorted(daily_stats.items())
        ]
        
        return format_output(data={
            "total_processed": total_processed,
            "success_count": success_count,
            "error_count": error_count,
            "success_rate": round(success_rate, 2),
            "avg_processing_time": round(avg_processing_time, 3),
            "batch_count": batch_count,
            "single_count": single_count,
            "total_batch_files": total_batch_files,
            "processing_time_stats": {
                "min": round(processing_time_stats["min"], 3),
                "max": round(processing_time_stats["max"], 3),
                "median": round(processing_time_stats["median"], 3)
            },
            "daily_stats": daily_stats_list[-7:],  # 最近7天
            "format_stats": format_stats
        })
        
    except Exception as e:
        return format_output(
            code=500,
            msg=f"获取统计信息失败: {str(e)}"
        )
