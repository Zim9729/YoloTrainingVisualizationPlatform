import os
import sys
import time
import logging
import shutil
from pathlib import Path
from ultralytics import YOLO
from .triton_integration import register_model_to_triton


def export_model(model_path,
                 output_dir,
                 result_file_path,
                 formats=None,
                 imgsz=640,
                 half=False,
                 simplify=False,
                 opset=None,
                 device="cpu",
                 logger: logging.Logger | None = None,
                 task_id: str | None = None,
                 triton_repo_path: str | None = None,
                 triton_model_name: str | None = None,
                 enable_triton: bool = False):
    """
    使用 Ultralytics YOLO 将 .pt 模型导出为多种部署格式。

    参数:
    - model_path: 源权重 .pt 文件路径
    - output_dir: 导出输出根目录（将保存到 output_dir/export/ 下）
    - result_file_path: 结果记录 YAML 文件路径（由调用方管理写入）
    - formats: 要导出的格式列表，例如 ["onnx", "openvino", "torchscript", "engine"]
    - imgsz: 输入尺寸
    - half: 半精度
    - simplify: 是否简化（ONNX等）
    - opset: ONNX opset 版本（可选）
    - device: 导出设备，如 "cpu"、"0"（GPU）
    - logger: 日志记录器
    - task_id: 任务ID（可选）
    - triton_repo_path: Triton 模型仓库路径（可选）
    - triton_model_name: Triton 模型名称前缀（可选）
    - enable_triton: 是否启用 Triton 集成
    """
    if logger is None:
        logger = logging.getLogger("export")
        if not logger.handlers:
            handler = logging.StreamHandler(sys.stdout)
            handler.setFormatter(logging.Formatter("[%(asctime)s] %(message)s", "%H:%M:%S"))
            logger.addHandler(handler)
        logger.setLevel(logging.INFO)

    if not os.path.exists(model_path):
        raise FileNotFoundError(f"模型文件不存在: {model_path}")

    # 规范化为绝对路径，避免相对路径导致的意外保存位置
    output_dir = os.path.abspath(output_dir)
    os.makedirs(output_dir, exist_ok=True)
    export_dir = os.path.join(output_dir, "export")
    os.makedirs(export_dir, exist_ok=True)

    if formats is None or not isinstance(formats, (list, tuple)) or len(formats) == 0:
        # 默认仅导出 ONNX，最通用
        formats = ["onnx"]

    logger.info(f"[INFO] 开始模型导出 task_id={task_id or ''}")
    logger.info(f"[INFO] 模型路径: {model_path}")
    logger.info(f"[INFO] 输出目录: {export_dir}")
    logger.info(f"[INFO] 计划导出格式: {formats}")
    if enable_triton and triton_repo_path:
        logger.info(f"[INFO] Triton 集成已启用，仓库路径: {triton_repo_path}")

    model = YOLO(model_path)

    # 针对每个格式分别调用 export，输出统一到 output_dir/export 下
    for fmt in formats:
        try:
            logger.info(f"[EXPORT] 正在导出格式: {fmt}")
            # Ultralytics export 参数说明:
            #   format: onnx/openvino/torchscript/engine/xml/pb/coreml/…
            #   imgsz: 输入尺寸
            #   device: 导出设备
            #   half: 半精度
            #   simplify: 简化（ONNX）
            #   opset: ONNX opset 版本
            #   project/name: 输出路径控制
            ret = model.export(
                format=fmt,
                imgsz=imgsz,
                device=device,
                half=half,
                simplify=simplify,
                opset=opset,
                project=output_dir,
                name="export",
                exist_ok=True,
            )
            # 确保产物最终位于 export_dir 下
            try:
                ret_path = Path(str(ret)).resolve() if ret else None
                export_base = Path(export_dir).resolve()
                if ret_path and ret_path.exists():
                    # 如果不在 export 目录下，则移动过去
                    if export_base not in ret_path.parents and export_base != ret_path:
                        target = export_base / ret_path.name
                        try:
                            if target.exists():
                                if target.is_file():
                                    target.unlink()
                                else:
                                    shutil.rmtree(target)
                        except Exception:
                            pass
                        shutil.move(str(ret_path), str(target))
                        logger.info(f"[EXPORT] {fmt} 产物已移动到: {target}")
                        ret_path = target.resolve()
                        # 处理伴随文件（如 OpenVINO .bin）
                        try:
                            if ret_path.suffix.lower() == ".xml":
                                src_bin = Path(str(ret)).with_suffix(".bin")
                                if src_bin.exists():
                                    dst_bin = export_base / src_bin.name
                                    if dst_bin.exists():
                                        dst_bin.unlink()
                                    shutil.move(str(src_bin), str(dst_bin))
                                    logger.info(f"[EXPORT] 附属文件已移动到: {dst_bin}")
                        except Exception:
                            pass
                logger.info(f"[EXPORT] 导出完成: {fmt} -> {ret_path}")
            except Exception as move_e:
                logger.warning(f"[EXPORT] 产物位置调整失败（忽略）: {move_e}")
            
            # Triton 模型仓库集成
            if enable_triton and triton_repo_path and ret_path and ret_path.exists():
                try:
                    # 生成模型名称
                    if not triton_model_name:
                        base_name = Path(model_path).stem  # 去掉 .pt 扩展名
                        triton_model_name_final = f"{base_name}_{fmt}"
                    else:
                        triton_model_name_final = f"{triton_model_name}_{fmt}"
                    
                    success = register_model_to_triton(
                        model_path=str(ret_path),
                        triton_repo_path=triton_repo_path,
                        model_name=triton_model_name_final,
                        model_format=fmt,
                        input_shape=[1, 3, imgsz, imgsz],
                        logger=logger
                    )
                    
                    if success:
                        logger.info(f"[TRITON] {fmt} 模型已成功注册到 Triton 仓库: {triton_model_name_final}")
                    else:
                        logger.warning(f"[TRITON] {fmt} 模型注册到 Triton 仓库失败")
                        
                except Exception as triton_e:
                    logger.warning(f"[TRITON] {fmt} 模型 Triton 集成失败: {triton_e}")
                    
        except Exception as e:
            logger.exception(f"[EXPORT] 导出 {fmt} 失败: {e}")

    logger.info(f"[INFO] 模型导出流程结束，产物目录: {export_dir}")
