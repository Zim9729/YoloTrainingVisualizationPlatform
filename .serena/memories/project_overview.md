# YOLO 可视化训练平台 - 项目概述

## 项目基本信息

- **项目名称**: YOLO Training Visualization Platform
- **项目路径**: `D:\workspace\03_model_code\YoloTrainingVisualizationPlatform`
- **许可证**: MIT License
- **版本**: 1.0.0
- **作者**: chzane (slxzane@outlook.com)
- **GitHub**: https://github.com/chzane/YoloTrainingVisualizationPlatform

## 项目目的

这是一个**跨平台 YOLO 模型训练可视化工具**，基于 Electron + Flask 架构开发，旨在**降低计算机视觉目标检测任务的入门门槛**。

### 核心功能

1. **数据集管理** - 支持 YOLO/COCO 格式，提供数据集上传、解析、统计、Label Studio 集成
2. **模型训练** - 可视化配置训练参数，支持多任务并行训练，实时监控训练进度
3. **模型测试** - 单图/视频推理测试，模型验证，结果可视化
4. **模型导出** - 支持导出为 ONNX/TorchScript/OpenVINO/TensorRT 格式
5. **部署集成** - Triton 模型仓库浏览和管理
6. **TCP 图像处理** (新增) - 与外部 C++ TCP 图像处理服务集成

### 项目特点

- ✅ **完全本地运行** - 无需依赖云平台
- ✅ **零代码训练** - 全程可视化配置
- ✅ **跨平台支持** - Windows/macOS/Linux
- ✅ **生产就绪** - 支持模型导出和部署

## 运行时数据目录

所有运行时数据存储在用户主目录下：`~/.yolo_training_visualization_platform/`

- `dataset/` - 数据集
- `tasks/` - 训练任务配置
- `models/` - 模型文件
- `tasks_result_files/` - 训练结果元数据
- `test_result_files/` - 测试结果元数据
- `validation_result_files/` - 验证结果元数据
- `image_processing_history/` - 图像处理历史记录