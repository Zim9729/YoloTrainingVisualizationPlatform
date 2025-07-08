import os

USER_HOME = os.path.expanduser("~")   # 用户主目录
DATASET_PATH = USER_HOME + "/.yolo_training_visualization_platform/dataset"   # 数据集存放路径

def get_dataset_path():
    """
    获取数据集存放路径
    """
    if not os.path.exists(DATASET_PATH):
        os.makedirs(DATASET_PATH)
    
    return DATASET_PATH