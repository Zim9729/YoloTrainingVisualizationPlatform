import sys
import logging

class StreamToLogger:
    def __init__(self, logger, log_level=logging.INFO, log_cache=None):
        self.logger = logger
        self.log_level = log_level
        self.linebuf = ''
        self.log_cache = log_cache if log_cache is not None else []

    def write(self, buf):
        for line in buf.rstrip().splitlines():
            line = line.rstrip()
            self.logger.log(self.log_level, line)
            self.log_cache.append(line)

    def flush(self):
        pass