import os
import json
import shutil
import logging
from pathlib import Path
from typing import Dict, List, Optional


def generate_triton_config(model_name: str, 
                          model_format: str,
                          input_shape: List[int] = [1, 3, 640, 640],
                          output_names: List[str] = None,
                          max_batch_size: int = 8,
                          instance_group_count: int = 1,
                          optimization_policy: Dict = None) -> Dict:
    """
    生成 Triton 模型配置
    
    Args:
        model_name: 模型名称
        model_format: 模型格式 (onnx, tensorrt, pytorch_libtorch)
        input_shape: 输入形状 [batch, channels, height, width]
        output_names: 输出名称列表
        max_batch_size: 最大批次大小
        instance_group_count: 实例组数量
        optimization_policy: 优化策略
    
    Returns:
        Triton 配置字典
    """
    if output_names is None:
        output_names = ["output"]
    
    # 格式映射
    platform_map = {
        "onnx": "onnxruntime_onnx",
        "tensorrt": "tensorrt_plan", 
        "engine": "tensorrt_plan",
        "torchscript": "pytorch_libtorch"
    }
    
    platform = platform_map.get(model_format, "onnxruntime_onnx")
    
    config = {
        "name": model_name,
        "platform": platform,
        "max_batch_size": max_batch_size,
        "input": [
            {
                "name": "images",
                "data_type": "TYPE_FP32",
                "dims": input_shape[1:]  # 去掉 batch 维度
            }
        ],
        "output": [],
        "instance_group": [
            {
                "count": instance_group_count,
                "kind": "KIND_GPU" if platform == "tensorrt_plan" else "KIND_CPU"
            }
        ]
    }
    
    # 添加输出配置
    for i, output_name in enumerate(output_names):
        config["output"].append({
            "name": output_name,
            "data_type": "TYPE_FP32",
            "dims": [-1]  # 动态维度
        })
    
    # 添加优化策略
    if optimization_policy:
        config["optimization"] = optimization_policy
    elif platform == "tensorrt_plan":
        config["optimization"] = {
            "execution_accelerators": {
                "gpu_execution_accelerator": [
                    {
                        "name": "tensorrt",
                        "parameters": {
                            "precision_mode": "FP16",
                            "max_workspace_size_bytes": "1073741824"
                        }
                    }
                ]
            }
        }
    
    return config


def register_model_to_triton(model_path: str,
                           triton_repo_path: str,
                           model_name: str,
                           model_format: str,
                           version: str = "1",
                           input_shape: List[int] = [1, 3, 640, 640],
                           logger: logging.Logger = None) -> bool:
    """
    将导出的模型注册到 Triton 模型仓库
    
    Args:
        model_path: 导出模型文件路径
        triton_repo_path: Triton 模型仓库根目录
        model_name: 模型名称
        model_format: 模型格式
        version: 模型版本
        input_shape: 输入形状
        logger: 日志记录器
    
    Returns:
        是否成功注册
    """
    if logger is None:
        logger = logging.getLogger("triton_integration")
    
    try:
        # 创建模型目录结构
        model_dir = Path(triton_repo_path) / model_name
        version_dir = model_dir / version
        version_dir.mkdir(parents=True, exist_ok=True)
        
        # 确定模型文件名
        if model_format in ["onnx"]:
            target_filename = "model.onnx"
        elif model_format in ["tensorrt", "engine"]:
            target_filename = "model.plan"
        elif model_format in ["torchscript"]:
            target_filename = "model.pt"
        else:
            target_filename = Path(model_path).name
        
        # 复制模型文件
        target_path = version_dir / target_filename
        shutil.copy2(model_path, target_path)
        logger.info(f"[TRITON] 模型文件已复制到: {target_path}")
        
        # 生成配置文件
        config = generate_triton_config(
            model_name=model_name,
            model_format=model_format,
            input_shape=input_shape
        )
        
        config_path = model_dir / "config.pbtxt"
        with open(config_path, 'w', encoding='utf-8') as f:
            f.write(_dict_to_pbtxt(config))
        
        logger.info(f"[TRITON] 配置文件已生成: {config_path}")
        logger.info(f"[TRITON] 模型 {model_name} 已成功注册到 Triton 仓库")
        
        return True
        
    except Exception as e:
        logger.error(f"[TRITON] 注册模型到 Triton 仓库失败: {e}")
        return False


def _dict_to_pbtxt(data: Dict, indent: int = 0) -> str:
    """
    将字典转换为 protobuf text 格式
    """
    lines = []
    indent_str = "  " * indent
    
    for key, value in data.items():
        if isinstance(value, dict):
            lines.append(f"{indent_str}{key} {{")
            lines.append(_dict_to_pbtxt(value, indent + 1))
            lines.append(f"{indent_str}}}")
        elif isinstance(value, list):
            for item in value:
                if isinstance(item, dict):
                    lines.append(f"{indent_str}{key} {{")
                    lines.append(_dict_to_pbtxt(item, indent + 1))
                    lines.append(f"{indent_str}}}")
                else:
                    lines.append(f"{indent_str}{key}: {_format_value(item)}")
        else:
            lines.append(f"{indent_str}{key}: {_format_value(value)}")
    
    return "\n".join(lines)


def _format_value(value):
    """
    格式化值为 pbtxt 格式
    """
    if isinstance(value, str):
        return f'"{value}"'
    elif isinstance(value, bool):
        return "true" if value else "false"
    else:
        return str(value)


def list_triton_models(triton_repo_path: str) -> List[Dict]:
    """
    列出 Triton 仓库中的所有模型
    
    Args:
        triton_repo_path: Triton 模型仓库路径
    
    Returns:
        模型列表
    """
    models = []
    
    if not os.path.exists(triton_repo_path):
        return models
    
    try:
        for model_dir in Path(triton_repo_path).iterdir():
            if model_dir.is_dir():
                config_path = model_dir / "config.pbtxt"
                if config_path.exists():
                    versions = []
                    for version_dir in model_dir.iterdir():
                        if version_dir.is_dir() and version_dir.name.isdigit():
                            versions.append(version_dir.name)
                    
                    models.append({
                        "name": model_dir.name,
                        "path": str(model_dir),
                        "versions": sorted(versions, key=int, reverse=True),
                        "config_exists": True
                    })
    except Exception:
        pass
    
    return models


def remove_triton_model(triton_repo_path: str, model_name: str, version: str = None) -> bool:
    """
    从 Triton 仓库中移除模型
    
    Args:
        triton_repo_path: Triton 模型仓库路径
        model_name: 模型名称
        version: 版本号，如果为 None 则删除整个模型
    
    Returns:
        是否成功删除
    """
    try:
        model_dir = Path(triton_repo_path) / model_name
        
        if version:
            # 删除特定版本
            version_dir = model_dir / version
            if version_dir.exists():
                shutil.rmtree(version_dir)
                return True
        else:
            # 删除整个模型
            if model_dir.exists():
                shutil.rmtree(model_dir)
                return True
        
        return False
    except Exception:
        return False
