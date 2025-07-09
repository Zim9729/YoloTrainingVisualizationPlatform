const CONFIGS = {
    API_BASE_URL: "http://localhost:10799",
    SUPPORTED_BACKEND_VERSIONS: ["1.0.0"],
    FRONTEND_VERSION: "1.0.0",
    DATASET_TYPE: {
        "yolo": "Yolo 格式",
        "coco": "Coco 格式",
        "null": "其他格式"
    },
    DEVICE_TYPE: {
        "cpu": "Cpu",
        "gpu": "GPU (CUDA)",
        "gpu_idlefirst": "GPU (CUDA, 空闲优先)",
        "mps": "苹果芯片 (MPS)"
    },
    TRAINING_TYPE: {
        "0": "微调",
        "1": "从头构建"
    },
    YOLO_MODLES_LIST: "https://api.github.com/repos/ultralytics/assets/releases/latest"
}

export default CONFIGS;