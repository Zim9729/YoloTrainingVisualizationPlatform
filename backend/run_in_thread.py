from threading import Thread
import logging
from ITraining.handlers import QueueHandler
import queue
from ITraining.train import main
from IModel.test import test_model

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

    def target():
        try:
            logger.info(f"开始任务: {taskfile_path}")
            main(taskfile_path, logger=logger, task_id=task_id, task_result_file_path=task_result_file_path)
            logger.info("🎉 训练任务结束")
        except Exception as e:
            logger.exception(f"训练线程发生异常: {e}")

    t = Thread(target=target, args=(), daemon=True)
    t.start()

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

    t = Thread(target=target, args=(), daemon=True)
    t.start()

    return t, log_q