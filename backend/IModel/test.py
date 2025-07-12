from ultralytics import YOLO
from stream_to_logger import StreamToLogger
import logging
import sys
import os
import yaml
import time

def test_model(model_path, input_path, output_dir, result_file_path, test_type="image", logger=None, task_id=None):
    if logger is None:
        logger = logging.getLogger("default")
        logger.setLevel(logging.INFO)
        handler = logging.StreamHandler()
        handler.setFormatter(logging.Formatter("[%(asctime)s] %(message)s"))
        logger.addHandler(handler)
    
    if task_id == None:
        logger.info("未获取到Task ID")
        sys.exit(1)
        
    if result_file_path == None:
        logger.info("未获取到Test Result File Path")
        sys.exit(1)
        
    log_cache = []
        
    stdout_backup = sys.stdout
    stderr_backup = sys.stderr
    sys.stdout = StreamToLogger(logger, logging.INFO, log_cache=log_cache)
    sys.stderr = StreamToLogger(logger, logging.ERROR, log_cache=log_cache)

    logger.info("[INFO] 启动测试任务...")
    
    try:
        model = YOLO(model_path)

        model.predict(
            source=input_path,
            save=True,
            save_txt=True,
            save_conf=True,
            project=output_dir,
            name="result"
        )
    finally:
        sys.stdout = stdout_backup
        sys.stderr = stderr_backup    
    
    logger.info("[INFO] 🎉 测试完成")
    
    completed_time = int(time.time())
    
    result_info = {
        "completedAt": completed_time,
        "log": log_cache
    }

    if os.path.exists(result_file_path):
        with open(result_file_path, 'r', encoding='utf-8') as f:
            existing_data = yaml.safe_load(f) or {}
    else:
        existing_data = {}

    existing_data.update(result_info)

    with open(result_file_path, 'w', encoding='utf-8') as f:
        yaml.dump(existing_data, f, allow_unicode=True)
     
    
if __name__ == '__main__':
    test_model(
        "/Users/zane/.yolo_training_visualization_platform/tasks/training/task_1816273444_1752217382/result/weights/best.pt",
        "/Users/zane/Downloads/dce08992-9646-4b0f-b39e-8808e6682483.jpg",
        "/Users/zane/.yolo_training_visualization_platform/tasks/training/task_1816273444_1752217382/result/test_result/1234567",
        "test_result_file_path"
    )