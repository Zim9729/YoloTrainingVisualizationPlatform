from threading import Thread
import logging
import os
from ITraining.handlers import QueueHandler
import queue
from ITraining.train import main
from IModel.test import test_model
from IModel.validate import validate_model
from IModel.export import export_model

def run_main_in_thread(taskfile_path, task_id, task_result_file_path):
    """
    在新线程中运行 main，并捕获所有输出（stdout/stderr）
    """
    log_q = queue.Queue()
    
    logger = logging.getLogger(f"training-{taskfile_path}")
    logger.setLevel(logging.INFO)

    logger.handlers.clear()

    q_handler = QueueHandler(log_q)
    formatter = logging.Formatter("[%(asctime)s] %(message)s", "%H:%M:%S")
    q_handler.setFormatter(formatter)
    logger.addHandler(q_handler)

    # File log handler for persistence
    try:
        # 从任务结果文件路径推断输出目录
        if task_result_file_path:
            result_dir = os.path.dirname(task_result_file_path)
            logfile = os.path.join(result_dir, f"{task_id}.log")
            f_handler = logging.FileHandler(logfile, encoding="utf-8")
            f_handler.setFormatter(formatter)
            logger.addHandler(f_handler)
    except Exception:
        # Ignore file logging failures; still stream via queue
        pass

    def target():
        try:
            logger.info(f"开始任务: {taskfile_path}")
            main(taskfile_path, logger=logger, task_id=task_id, task_result_file_path=task_result_file_path)
            logger.info("🎉 训练任务结束")
        except Exception as e:
            logger.exception(f"训练线程发生异常: {e}")

    t = Thread(target=target, args=(), daemon=True, name=f"training-{task_id}")
    try:
        t.start()
        logger.info(f"训练线程已启动: {t.name}")
    except Exception as e:
        logger.error(f"启动训练线程失败: {e}")
        raise

    return t, log_q

def run_modelexport_in_thread(task_id,
                              model_path,
                              output_dir,
                              result_file_path=None,
                              formats=None,
                              imgsz=640,
                              half=False,
                              simplify=False,
                              opset=None,
                              device="cpu",
                              triton_repo_path=None,
                              triton_model_name=None,
                              enable_triton=False):
    """
    在新线程中运行模型导出（转换），并捕获所有输出（stdout/stderr）。
    """
    log_q = queue.Queue()

    logger = logging.getLogger(f"export-{task_id}")
    logger.setLevel(logging.INFO)

    logger.handlers.clear()

    q_handler = QueueHandler(log_q)
    formatter = logging.Formatter("[%(asctime)s] %(message)s", "%H:%M:%S")
    q_handler.setFormatter(formatter)
    logger.addHandler(q_handler)

    def target():
        try:
            logger.info(f"开始任务: {task_id}")
            export_model(
                model_path=model_path,
                output_dir=output_dir,
                result_file_path=result_file_path,
                formats=formats,
                imgsz=imgsz,
                half=half,
                simplify=simplify,
                opset=opset,
                device=device,
                logger=logger,
                task_id=task_id,
                triton_repo_path=triton_repo_path,
                triton_model_name=triton_model_name,
                enable_triton=enable_triton,
            )
            logger.info("🎉 导出任务结束")
        except Exception as e:
            logger.exception(f"导出线程发生异常: {e}")

    t = Thread(target=target, args=(), daemon=True, name=f"export-{task_id}")
    try:
        t.start()
        logger.info(f"导出线程已启动: {t.name}")
    except Exception as e:
        logger.error(f"启动导出线程失败: {e}")
        raise

    return t, log_q

def run_modeltest_in_thread(task_id, model_path, input_path, output_dir, result_file_path, test_type="image"):
    """
    在新线程中运行 ModelTest，并捕获所有输出（stdout/stderr）
    """
    log_q = queue.Queue()
    
    logger = logging.getLogger(f"testing-{task_id}")
    logger.setLevel(logging.INFO)

    logger.handlers.clear()

    q_handler = QueueHandler(log_q)
    formatter = logging.Formatter("[%(asctime)s] %(message)s", "%H:%M:%S")
    q_handler.setFormatter(formatter)
    logger.addHandler(q_handler)

    def target():
        try:
            logger.info(f"开始任务: {task_id}")
            test_model(model_path, input_path, output_dir, result_file_path, test_type, logger=logger, task_id=task_id)
            logger.info("🎉 测试任务结束")
        except Exception as e:
            logger.exception(f"测试线程发生异常: {e}")

    t = Thread(target=target, args=(), daemon=True, name=f"test-{task_id}")
    try:
        t.start()
        logger.info(f"测试线程已启动: {t.name}")
    except Exception as e:
        logger.error(f"启动测试线程失败: {e}")
        raise

    return t, log_q

def run_modelval_in_thread(task_id, model_path, dataset_yaml_path, output_dir, result_file_path):
    """
    在新线程中运行 Model Validation，并捕获所有输出（stdout/stderr）
    """
    log_q = queue.Queue()

    logger = logging.getLogger(f"validation-{task_id}")
    logger.setLevel(logging.INFO)

    logger.handlers.clear()

    q_handler = QueueHandler(log_q)
    formatter = logging.Formatter("[%(asctime)s] %(message)s", "%H:%M:%S")
    q_handler.setFormatter(formatter)
    logger.addHandler(q_handler)

    def target():
        try:
            logger.info(f"开始任务: {task_id}")
            validate_model(model_path, dataset_yaml_path, output_dir, result_file_path, logger=logger, task_id=task_id)
            logger.info("🎉 验证任务结束")
        except Exception as e:
            logger.exception(f"验证线程发生异常: {e}")

    t = Thread(target=target, args=(), daemon=True, name=f"validation-{task_id}")
    try:
        t.start()
        logger.info(f"验证线程已启动: {t.name}")
    except Exception as e:
        logger.error(f"启动验证线程失败: {e}")
        raise

    return t, log_q