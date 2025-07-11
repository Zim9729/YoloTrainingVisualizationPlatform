from ultralytics import YOLO

def test_model_thread(model_path, input_path, output_dir, test_type="image"):
    model = YOLO(model_path)

    model.predict(
        source=input_path,
        save=True,
        save_txt=True,
        save_conf=True,
        project=output_dir,
        name="result"
    )
    
if __name__ == '__main__':
    test_model_thread(
        "/Users/zane/.yolo_training_visualization_platform/tasks/training/task_1816273444_1752217382/result/weights/best.pt",
        "/Users/zane/Downloads/dce08992-9646-4b0f-b39e-8808e6682483.jpg",
        "/Users/zane/.yolo_training_visualization_platform/tasks/training/task_1816273444_1752217382/result/test_result/1234567"
    )