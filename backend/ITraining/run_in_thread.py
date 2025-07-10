from threading import Thread
import logging
from .handlers import QueueHandler
import queue
from .train import main

def run_main_in_thread(taskfile_path, task_id):
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
            main(taskfile_path, logger=logger, task_id=task_id)
            logger.info("🎉 训练任务结束")
        except Exception as e:
            logger.exception(f"训练线程发生异常: {e}")

    t = Thread(target=target, args=(), daemon=True)
    t.start()

    return t, log_q
