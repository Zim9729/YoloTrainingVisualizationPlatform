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
    },
    MODEL_EXPLANATION: {
        // 模型文件
        "^weights/last\\.pt$": [
            "最后一个训练周期（epoch）完成后保存的模型权重。",
            "表示模型训练完成时的状态，用于继续训练（resume）时非常重要，可能过拟合，不一定性能最优。"
        ],
        "^weights/best\\.pt$": [
            "在训练过程中，根据验证集的性能指标最好的一次保存下来的模型权重。",
            "通常是推理部署时推荐使用的模型，性能最优，通常比 last.pt 更泛化。"
        ],
        "^weights/epoch\\d+\\.pt$": [
            "训练周期完成后的模型快照，用于调试或分析阶段训练效果。",
            "它一般不会用于推理部署，因为性能很差，只是一个过程保存结果。"
        ],

        // 配置文件
        "^args\\.yaml$": [
            "训练参数配置文件，包含训练时使用的超参数和设置。"
        ],
        "^results\\.csv$": [
            "训练结果的CSV文件，包含详细的数值指标和评估数据。"
        ],

        // 图像结果
        "^BoxF1_curve\\.png$": [
            "F1分数曲线图，反映模型在不同阈值下的F1分数变化。"
        ],
        "^BoxP_curve\\.png$": [
            "精确率（Precision）曲线图，显示模型在不同阈值下的精确率表现。"
        ],
        "^BoxPR_curve\\.png$": [
            "精确率-召回率（Precision-Recall）曲线，评估模型分类性能的常用指标。"
        ],
        "^BoxR_curve\\.png$": [
            "召回率（Recall）曲线图，展示模型对正样本的检测能力。"
        ],
        "^confusion_matrix_normalized\\.png$": [
            "归一化的混淆矩阵图，显示模型预测类别的准确率及误差分布。"
        ],
        "^confusion_matrix\\.png$": [
            "原始混淆矩阵图，表示真实标签与预测标签的对应关系。"
        ],
        "^results\\.png$": [
            "训练结果的汇总图像，通常包含各种性能指标的可视化。"
        ],
        "^labels\\.jpg$": [
            "训练或验证集中的标签示意图片，显示目标标注情况。"
        ],
        "^train_batch\\d+\\.jpg$": [
            "训练集批次样本图像示例。"
        ],
        "^val_batch\\d+_labels\\.jpg$": [
            "验证集对应批次的标签图像，显示标注信息。"
        ],
        "^val_batch\\d+_pred\\.jpg$": [
            "验证集对应批次的预测结果图像，展示模型检测效果。"
        ],

        // 其他通用图片文件
        "\\.(png|jpg|jpeg)$": [
            "训练过程中的图像结果文件。"
        ]
    }
}

export default CONFIGS;