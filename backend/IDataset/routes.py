from flask import Blueprint, request
from tools.format_output import format_output
from config import get_dataset_path
import os
from glob import glob
import yaml
from pathlib import Path


IDataset_bp = Blueprint('IDataset', __name__)

def count_images_and_labels(image_dir, label_dir):
    """
    统计指定目录下的图片和标签数量
    """
    image_paths = glob(os.path.join(image_dir, "*.jpg")) + \
                  glob(os.path.join(image_dir, "*.png"))
    label_paths = [p.replace("/images/", "/labels/").replace(".jpg", ".txt").replace(".png", ".txt")
                   for p in image_paths]
    num_labels = 0
    for label_file in label_paths:
        if os.path.exists(label_file):
            with open(label_file, "r") as f:
                lines = f.readlines()
                num_labels += len(lines)
    return len(image_paths), num_labels

def load_dataset_yoloinfofile(yaml_path):
    """
    加载数据集的yaml文件
    """
    with open(yaml_path, "r") as f:
        data = yaml.safe_load(f)

    root_path = Path(data["path"])
    train_path = Path(data["train"])
    val_path = Path(data["val"])
    test_path = Path(data.get("test", None))
    class_names = data["names"]
    num_classes = data.get("nc", len(class_names))
    
    train_img_count, train_label_count = count_images_and_labels(str(train_path), str(train_path).replace("/images", "/labels"))
    
    return {
        "root_path": str(root_path),
        "train_path": str(train_path),
        "val_path": str(val_path),
        "test_path": str(test_path) if test_path else None,
        "class_names": class_names,
        "num_classes": num_classes,
        "train_img_count": train_img_count,
        "train_label_count": train_label_count
    }
    
def load_dataset_platforminfofile(info_file):
    """
    加载数据集的平台info文件
    """
    with open(info_file, "r") as f:
        data = yaml.safe_load(f)
    
    return {
        "name": data.get("name", "Unknown"),
        "description": data.get("description", ""),
        "version": data.get("version", "Unknown"),
        "author": data.get("author", "Unknown"),
        "type": data.get("type", "COCO"),
        "created_at": data.get("created_at", ""),
        "yaml_file_path": data.get("yaml_file_path", None)
    }
        
@IDataset_bp.route('/getAllDatasets')
def get_all_datasets():
    """
    获取所有数据集
    """
    dataset_path = get_dataset_path()

    datasets = []
    for item in os.listdir(dataset_path):
        item_path = os.path.join(dataset_path, item)
        
        if os.path.isdir(item_path):
            info_file = os.path.join(item_path, "yolo_training_visualization_info.yaml")
            
            if os.path.exists(info_file):
                info_file_data = load_dataset_platforminfofile(info_file)
                
                yolo_file = os.path.join(item_path, info_file_data["yaml_file_path"])
                if os.path.exists(yolo_file):
                    dataset_info = {
                        "name": item,
                        "path": item_path,
                        "yaml_info": load_dataset_yoloinfofile(yolo_file),
                        "platform_info": info_file_data
                    }
                    datasets.append(dataset_info)
        
    return format_output(data={
        "datasets": datasets
    })