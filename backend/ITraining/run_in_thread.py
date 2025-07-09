import threading
import sys
import io
from .train import main

def run_main_in_thread(taskfile_path):
    """
    在新线程中运行 main，并捕获所有输出（stdout/stderr）
    """
    log_stream = io.StringIO()

    class StreamInterceptor:
        """
        同时写到原stdout/stderr 和 log_stream
        """
        def __init__(self, original):
            self.original = original

        def write(self, message):
            self.original.write(message)
            log_stream.write(message)

        def flush(self):
            self.original.flush()
            log_stream.flush()

    # 替换 sys.stdout 和 sys.stderr
    sys_stdout_backup = sys.stdout
    sys_stderr_backup = sys.stderr
    sys.stdout = StreamInterceptor(sys.stdout)
    sys.stderr = StreamInterceptor(sys.stderr)

    def target():
        try:
            main(taskfile_path)
        except Exception as e:
            print(f"[ERROR] Exception: {e}")
        finally:
            # 恢复 stdout/stderr，防止影响后续
            sys.stdout = sys_stdout_backup
            sys.stderr = sys_stderr_backup

    t = threading.Thread(target=target)
    t.start()

    return t, log_stream
