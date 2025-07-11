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
        "cpu": "CPU",
        "gpu": "GPU (CUDA)",
        "gpu_idlefirst": "GPU (CUDA, 空闲优先)",
        "mps": "苹果芯片 (MPS)"
    },
    TRAINING_TYPE: {
        "0": "微调",
        "1": "从头构建"
    },
    TASK_CONFIGURATiON_ITEMS: {
        "taskName": "任务名称",
        "taskDescription": "任务描述",
        "datasetPath": "数据集路径",
        "trainingType": "训练方式",
        "epochs": "训练轮数",
        "batchSize": "每批训练样本数量",
        "imgSize": "图像尺寸",
        "device": "训练设备",
        "gpuCUDAIndex": "CUDA设备编号",
        "gpuCUDANum": "GPU 数量",
        "trainSeed": "训练种子",
        "cache": "数据缓存位置",
        "modelYamlFile": "模型结构定义",
        "baseModelID": "基础模型"
    }
}

export default CONFIGS;