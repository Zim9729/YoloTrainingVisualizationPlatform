import logging
import queue

class QueueHandler(logging.Handler):
    """
    日志处理器
    """
    def __init__(self, log_queue):
        super().__init__()
        self.log_queue = log_queue

    def emit(self, record):
        log_entry = self.format(record)
        self.log_queue.put(log_entry)
