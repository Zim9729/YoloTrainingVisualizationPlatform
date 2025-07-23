<div align="center">

# YOLO 可视化训练平台

#### 一个基于 Electron + Flask 的跨平台 YOLO 模型训练可视化工具，支持数据集上传、模型训练、训练进度监控、模型测试及结果可视化，旨在降低视觉学习检测任务的入门门槛。

简体中文 · [English](./README_en.md)

</div>

## 🖼️ 截图

<table>
  <tr>
    <td><img src="screenshot/s_1.png" /></td>
    <td><img src="screenshot/s_2.png" /></td>
  </tr>
  <tr>
    <td><img src="screenshot/s_3.png" /></td>
    <td><img src="screenshot/s_4.png" /></td>
  </tr>
</table>

## ✨ 功能

- 页面简洁，快速易上手
- 支持 YOLO、COCO 等多种格式数据
- 可视化设置训练参数（epoch、batch size、图像尺寸等）
- 支持选择基础模型进行迁移学习
- 可视化展示训练日志、损失变化、mAP 等关键指标
- 支持多任务并行训练
- 支持上传图片路径进行单图推理测试
- 完全本地运行，无需依赖云平台

## 📦 安装说明

### 前置依赖

- Node.js >= 20
- Python >= 3.9
- pip + virtualenv

### 克隆项目

```bash
git clone https://github.com/chzane/YoloTrainingVisualizationPlatform.git
cd YoloTrainingVisualizationPlatform
```

### 安装后端依赖

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 安装前端依赖

```bash
cd frontend
yarn install
```

## 🚀 启动项目

### 开发

**前端（Vite）**

```bash
cd frontend
yarn dev
```

**APP（Electron）**

```bash
cd app
yarn dev
```

### 打包

```bash
cd frontend
yarn build

cd backend
# 运行前，请先将main.py中的debug改为Flase
pyinstaller --onefile main.py

# 将 frontend/dist/ 移动到 app/ 内
# 将 backend/dist/main（Windows平台为main.exe） 移动到 app/resources/backend 内

cd app
yarn build
```

## 📁 项目结构简览

```
Yolo_Training_Visualization_Platform/
├── backend/                   # Python 后端（Flask + 多线程任务调度）
│   ├── ITraining/             # 训练任务蓝图
│   ├── IModel/                # 模型蓝图
│   ├── IDataset/              # 数据集蓝图
│   └── ...
├── frontend/                  # React 前端界面
│   └── ...
├── app/                       # Electron
│   └── ...
└── README.md 
```

## 🤝 贡献指南

欢迎提交 PR 或 issue！你可以：

* 提交 bug 报告
* 增加新的功能模块
* 提出 UI/UX 优化建议

## 📄 许可证

本项目采用 [MIT License](LICENSE)。

## 🧠 灵感与鸣谢

* [Ultralytics](https://github.com/ultralytics/)
* [Electron](https://www.electronjs.org/)
* [Vite](https://vitejs.dev/)
* [Flask](https://flask.palletsprojects.com/)

## 📫 联系方式

* 📧 Email: [slxzane@outlook.com](mailto:slxzane@outlook.com)
* 🌐 Github: [@chzane](https://github.com/chzane)
