<div align="center">

# YOLO 可视化训练平台

#### 一个基于 Electron + Flask 的跨平台 YOLO 模型训练可视化工具，支持数据集上传、模型训练、训练进度监控、模型测试及结果可视化，旨在降低视觉学习检测任务的入门门槛。

简体中文 · [English](./README_en.md)

</div>

[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D20-339933)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-%3E%3D3.9-3776AB)](https://www.python.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Release](https://img.shields.io/github/v/release/Zim9729/YoloTrainingVisualizationPlatform?display_name=tag&logo=github)](https://github.com/Zim9729/YoloTrainingVisualizationPlatform/releases)

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

### 数据集管理
- 📦 支持 YOLO、COCO 等多种格式数据
- 🏷️ Label Studio 集成：一键从标注平台导入数据集
- 📤 ZIP 压缩包上传，自动解压和配置
- 📊 数据集统计与可视化

### 模型训练
- 🎯 可视化设置训练参数（epoch、batch size、图像尺寸等）
- 🔧 支持选择基础模型进行迁移学习
- 📈 可视化展示训练日志、损失变化、mAP 等关键指标
- ⚡ 支持多任务并行训练
- 💾 训练历史记录管理
- 🎨 训练结果可视化（混淆矩阵、PR曲线等）

### 模型测试与验证
- 🖼️ 支持上传图片进行单图推理测试
- 🎥 支持视频推理（即将推出）
- ✅ 数据集验证功能
- 📊 详细的性能指标报告

### 模型导出与部署
- 📦 支持多格式导出（ONNX / TorchScript / OpenVINO / TensorRT）
- 🚀 一键集成到 Triton 推理服务器
- 📥 导出历史管理与产物下载
- 🔄 Triton 模型仓库浏览与管理

### TCP 图像处理服务 🆕
- 🔌 与 C++ TCP 服务无缝对接
- 🖼️ 单图上传处理
- 📁 批量文件夹处理（支持递归）
- 📊 处理历史记录与统计分析
- 📈 实时性能监控

### 服务管理中心 🆕
- 🛠️ 统一的服务状态监控面板
- 🔍 实时检测服务连接状态
- 📡 支持多种服务类型（TCP / HTTP）
- 🏷️ Label Studio 标注服务状态检查
- 🚀 Triton 推理服务状态检查
- 🖼️ TCP 图像处理服务状态检查
- 🔄 一键刷新服务状态
- 📊 服务统计信息展示

### 其他特性
- 💻 完全本地运行，无需依赖云平台
- 🔒 数据隐私保护，所有数据留在本地
- 🌐 跨平台支持（Windows / macOS / Linux）
- 📱 现代化响应式界面

## 📦 安装说明

### 前置依赖

- Node.js >= 20
- Python >= 3.9
- pip + uv

### 克隆项目

```bash
git clone https://github.com/Zim9729/YoloTrainingVisualizationPlatform.git
cd YoloTrainingVisualizationPlatform
```

### 安装后端依赖

```bash
cd backend
pip install uv
uv venv
source .venv/bin/activate  # Linux/macOS
.venv\Scripts\activate     # Windows
uv pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
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
# 运行前，请先将main.py中的debug改为False
pyinstaller --onefile main.py

cd app
yarn build
```

## 📁 项目结构详解

```
YoloTrainingVisualizationPlatform/
├── backend/                        # Python 后端（Flask + 多线程任务调度）
│   ├── IDataset/                   # 数据集管理模块
│   │   ├── routes.py              # API 路由
│   │   └── process_annotation_projects.py  # Label Studio 集成
│   ├── ITraining/                  # 训练任务模块
│   │   ├── routes.py              # API 路由
│   │   ├── train.py               # 训练主逻辑
│   │   └── handlers.py            # 日志处理器
│   ├── IModel/                     # 模型推理与导出模块
│   │   ├── routes.py              # API 路由（1483行）
│   │   ├── test.py                # 模型测试
│   │   ├── validate.py            # 模型验证
│   │   ├── export.py              # 模型导出
│   │   └── triton_integration.py  # Triton 集成
│   ├── IImageProcessor/            # TCP 图像处理模块 🆕
│   │   ├── routes.py              # API 路由（860行）
│   │   ├── tcp_image_client.py    # TCP 客户端
│   │   ├── image_processor.py     # 图像处理工具
│   │   ├── models.py              # 数据模型
│   │   └── utils.py               # 工具函数
│   ├── tools/                      # 工具模块
│   │   └── format_output.py       # 统一响应格式
│   ├── config.py                   # 配置文件
│   ├── main.py                     # 主入口
│   ├── run_in_thread.py            # 多线程管理
│   ├── stream_to_logger.py         # 日志流处理
│   └── requirements.txt            # Python 依赖
├── frontend/                       # React 前端界面
│   ├── src/
│   │   ├── api.js                 # API 封装
│   │   ├── config.js              # 前端配置
│   │   ├── App.jsx                # 根组件
│   │   ├── components/            # UI 组件
│   │   ├── contexts/              # Context 状态管理
│   │   │   └── TaskContext.jsx   # 任务状态管理
│   │   ├── page/                  # 页面组件（13个）
│   │   │   ├── HomePage.jsx
│   │   │   ├── DatasetPage.jsx
│   │   │   ├── TasksPage.jsx
│   │   │   ├── TcpImageProcessorPage.jsx  🆕
│   │   │   └── ...
│   │   └── assets/                # 静态资源
│   ├── package.json               # Node 依赖
│   └── vite.config.js             # Vite 配置
├── app/                            # Electron 桌面应用
│   ├── index.js                   # 主进程
│   ├── preload.js                 # 预加载脚本
│   ├── package.json               # 应用配置
│   └── resources/                 # 打包资源
│       ├── frontend/              # 前端构建产物
│       └── backend/               # 后端 Python 代码
├── test/                           # 测试数据集
├── Tritonmodel/                    # Triton 模型仓库示例
├── openapi.yaml                    # OpenAPI 3.0 文档
└── README.md                       # 项目说明
```

## 🧩 系统架构

### 三层架构设计

```
┌─────────────────────────────────────────────────────┐
│           Electron 桌面应用 (跨平台)                │
│  • 开发模式: 加载 http://localhost:5173            │
│  • 生产模式: 加载 resources/frontend/index.html    │
├─────────────────────────────────────────────────────┤
│              React + Vite 前端                      │
│  • 端口: 5173 (开发环境)                           │
│  • API 基础地址: http://localhost:10799            │
│  • 状态管理: Context API (TaskContext)            │
│  • 实时更新: 轮询机制 (5秒间隔)                   │
├─────────────────────────────────────────────────────┤
│              Flask 后端 API                         │
│  • 端口: 10799                                      │
│  • 主机: 0.0.0.0 (允许外部访问)                    │
│  • 架构: 蓝图模块化设计                            │
│  • 并发: 多线程任务管理                            │
└─────────────────────────────────────────────────────┘
```

### 后端模块架构

- **前端（`frontend/`）**：基于 React + Vite，默认开发端口 `5173`
  - API 客户端：`src/api.js` 封装所有 HTTP 请求
  - 配置管理：`src/config.js` 定义 API 地址和常量
  - 环境变量：支持 `.env.development` 和 `.env.production` 覆盖配置
  - 状态管理：TaskContext 管理全局任务状态

- **后端（`backend/`）**：基于 Flask，主入口 `backend/main.py`，注册四个蓝图：
  - **IDataset** (`/IDataset`): 数据集导入、统计、校验与 Label Studio 集成
  - **ITraining** (`/ITraining`): 训练任务管理、多任务并行执行、日志流式传输
  - **IModel** (`/IModel`): 模型推理测试、验证、导出与 Triton 部署
  - **IImageProcessor** (`/IImageProcessor`): TCP 图像处理服务、批量处理、历史管理 🆕

- **桌面端（`app/`）**：Electron 外壳，开发模式加载 `http://localhost:5173`，打包后加载 `resources/frontend/index.html`。

### 数据存储目录

后端运行时的默认数据目录（见 `backend/config.py`，按需修改）：

| 目录 | 路径 | 说明 |
|------|------|------|
| 数据集 | `~/.yolo_training_visualization_platform/dataset` | 上传的训练数据集 |
| 任务配置 | `~/.yolo_training_visualization_platform/tasks` | 训练任务 YAML 配置文件 |
| 训练输出 | `~/.yolo_training_visualization_platform/tasks/training` | 模型权重和训练产物 |
| 模型缓存 | `~/.yolo_training_visualization_platform/models/base` | 下载的预训练模型 |
| 训练元数据 | `~/.yolo_training_visualization_platform/tasks_result_files` | 训练任务结果记录 |
| 测试元数据 | `~/.yolo_training_visualization_platform/test_result_files` | 推理测试记录 |
| 验证元数据 | `~/.yolo_training_visualization_platform/validation_result_files` | 模型验证记录 |
| 图像处理历史 🆕 | `~/.yolo_training_visualization_platform/image_processing_history` | TCP处理历史记录 |

后端版本接口：`GET /info`，当前版本 `1.0.0`。前端在 `src/config.js` 的 `SUPPORTED_BACKEND_VERSIONS` 中做版本兼容检查。

## 🔌 后端 API 概览

### 基础接口
- `GET /`：健康检查（返回 `OK`）
- `GET /info`：返回后端版本信息

### IDataset 模块 - 数据集管理
- `GET /IDataset/getAllDatasets`：获取所有数据集列表
- `POST /IDataset/uploadDataset`：上传数据集 ZIP 包
- `POST /IDataset/deleteDataset`：删除数据集

**Label Studio 集成**：
- `GET /IDataset/listLabelStudioProjects`：列出 Label Studio 项目
  - 参数：`base_url`(必填), `token`(可选)
- `POST /IDataset/buildDatasetFromLabelStudio`：从 Label Studio 构建数据集
  - Body: `base_url`, `project_id`, `name`, `version`, `splits`, `download_images`, `class_names`
- `GET /IDataset/getLabelStudioServiceStatus`：获取 Label Studio 服务状态 🆕
  - 参数：`base_url`(可选), `token`(可选)

### ITraining 模块 - 训练管理
- `GET /ITraining/getAllTasks`：获取所有训练任务
- `POST /ITraining/createTask`：创建新训练任务
- `POST /ITraining/startTask`：启动训练任务
- `GET /ITraining/getTaskLog`：获取实时训练日志
- `GET /ITraining/getAllRunningTasks`：获取正在运行的任务
- `GET /ITraining/getTrainingTasksHistory`：获取训练历史
- `GET /ITraining/getAllBaseModelsFromGithub`：获取可用基础模型

### IModel 模块 - 模型推理与导出

**测试与验证**：
- `POST /IModel/runModelTest`：启动模型推理测试
- `POST /IModel/runModelValidation`：启动模型验证
- `POST /IModel/uploadTestInput`：上传测试图片
- `GET /IModel/getAllTest`：获取测试记录
- `GET /IModel/getAllValidation`：获取验证记录
- `GET /IModel/getTestResultImageBase64`：获取测试结果图片
- `GET /IModel/downloadValResultFile`：下载验证结果文件

**模型导出**：
- `POST /IModel/runModelExport`：启动模型导出（ONNX/TorchScript/OpenVINO/TensorRT）
- `GET /IModel/getExportTaskLog`：获取导出任务日志
- `GET /IModel/getExportHistory`：获取导出历史
- `GET /IModel/listExportArtifacts`：列出导出产物
- `GET /IModel/downloadExportArtifact`：下载导出文件

**Triton 集成**：
- `POST /IModel/registerExportArtifactToTriton`：注册模型到 Triton
- `GET /IModel/listTritonModels`：列出 Triton 模型
- `POST /IModel/deleteTritonModel`：删除 Triton 模型
- `GET /IModel/getTritonServiceStatus`：获取 Triton 服务状态 🆕

### IImageProcessor 模块 - TCP 图像处理 🆕

**连接与状态**：
- `GET /IImageProcessor/info`：获取模块信息
- `GET /IImageProcessor/testConnection`：测试 TCP 连接
- `GET /IImageProcessor/getServiceStatus`：获取 TCP 服务状态 🆕

**图像处理**：
- `POST /IImageProcessor/processImage`：处理上传的图片
- `POST /IImageProcessor/processDatasetImage`：处理数据集中的图片
- `POST /IImageProcessor/processFolderImages`：批量处理文件夹（递归）
- `POST /IImageProcessor/getFolderImageList`：获取文件夹图片列表

**历史与统计**：
- `GET /IImageProcessor/getProcessingHistory`：获取处理历史（分页）
- `GET /IImageProcessor/getStatistics`：获取统计信息
- `POST /IImageProcessor/deleteProcessingRecord`：删除处理记录
- `POST /IImageProcessor/clearProcessingHistory`：清空历史记录
- `GET /IImageProcessor/downloadProcessingResult/{id}`：下载处理结果
- `POST /IImageProcessor/downloadBatchResults`：批量下载结果

### 统一响应格式

所有接口返回统一的 JSON 格式（`tools/format_output.py`）：
```json
{
  "code": 200,
  "msg": "成功",
  "data": { /* 响应数据 */ }
}
```

### OpenAPI 文档

完整的 API 文档请参考根目录的 `openapi.yaml`，可导入以下工具查看：
- Swagger UI
- Insomnia
- Postman
- VS Code 的 OpenAPI 插件

## 🗂️ 数据集与任务配置

本平台兼容 YOLO 与 COCO 两种主流格式。建议优先使用 YOLO 格式。

- YOLO 样例 `dataset.yaml`（位于数据集根）：

```yaml
path: /abs/path/to/dataset
train: images/train
val: images/val
test: images/test  # 可选
names: [cat, dog]
nc: 2
```

- COCO 样例（关键文件位置）：
  - `train/`、`val/` 下图片
  - `annotations/instances_train.json`、`annotations/instances_val.json`

任务配置文件存放在：`~/.yolo_training_visualization_platform/tasks/*.yaml`。训练模块（`backend/ITraining/train.py`）会读取任务配置与数据集平台信息文件 `yolo_training_visualization_info.yaml`。

常见任务参数（对应 `frontend/src/config.js` 的 `TASK_CONFIGURATiON_ITEMS`）：

- `taskName`、`taskDescription`
- `datasetPath`（指向数据集根目录）
- `trainingType`（0：微调；1：从头构建）
- `epochs`、`batchSize`、`imgSize`
- `device`（cpu/gpu/mps 等）与 `gpuCUDAIndex`、`gpuCUDANum`
- `trainSeed`、`cache`、`modelYamlFile`、`baseModelID`

模型文件说明（节选，自 `frontend/src/config.js` 的 `MODEL_EXPLANATION`）：

- `weights/best.pt`：验证集最佳，推荐用于推理
- `weights/last.pt`：最后一个 epoch 权重，便于继续训练
- `args.yaml`、`results.csv`：训练参数与指标记录

## ⚡ 快速开始（本地开发）

1. 启动后端（默认端口 10799）：

```bash
cd backend
python main.py
```

2. 启动前端（Vite 默认 5173）：

```bash
cd frontend
yarn dev
```

3. 启动桌面端（可选，开发模式会加载本地 5173）：

```bash
cd app
yarn dev
```

4. 打开应用，按引导创建或选择数据集，配置训练任务，启动训练；在「测试」页选择 `best.pt` 进行单图/视频推理与结果可视化。

## 📦 模型导出与部署

本项目内置基于 `ultralytics.YOLO` 的导出能力，导出产物统一存放在训练结果目录的 `export/` 下，可选择以下格式：

- ONNX（`onnx`）
- TorchScript（`torchscript`）
- OpenVINO（`openvino`，会生成 `.xml` 与 `.bin`）
- TensorRT（`engine`）

触发导出：调用 `POST /IModel/runModelExport`，关键参数包括：

- `outputDir`：训练结果目录（包含 `weights/best.pt` 等）
- `modelType`：导出权重名（不含扩展名，例如 `best`、`last`、`epoch10`）
- `formats`：导出格式数组，如 `["onnx", "openvino"]`
- `imgsz`、`half`、`simplify`、`opset`、`device`：底层导出参数

日志与历史：

- 通过 `GET /IModel/getExportTaskLog?exportKey=...` 轮询导出日志
- 通过 `GET /IModel/getExportHistory?outputDir=...` 查询历史记录
- 通过 `GET /IModel/getExportHistoryLog?outputDir=...&exportKey=...` 查看历史任务日志
- 通过 `GET /IModel/listExportArtifacts?outputDir=...` 列出导出产物并可用 `GET /IModel/downloadExportArtifact` 下载

### Triton 模型仓库浏览（可选）

前端页面：`frontend/src/page/TritonRepoPage.jsx`

- 输入本地 Triton `model_repository` 路径后，可浏览模型、版本与文件结构
- 支持复制模型/文件路径，删除模型或指定版本
- 便于将导出的 ONNX/TensorRT 模型组织到 Triton 中进行在线服务

说明：部分 Triton 仓库相关后端接口仍在演进中，OpenAPI 可能未完全覆盖，具体以页面与后端实现为准。

## 🛠️ 打包与发布建议

- 后端可使用 `pyinstaller` 生成单文件可执行（注意在 `backend/main.py` 中将 `debug=True` 改为 `False`）。
- Electron 使用 `electron-builder`，会将 `resources/backend` 一并打包到应用资源目录（见 `app/package.json` 的 `extraResources`）。
- 前端需先 `yarn build`，将产物复制/打包到 Electron 的 `resources/frontend/` 路径。

## ❓ 常见问题与排错

- 端口冲突：
  - 后端默认 `10799`，可在 `backend/main.py` 修改 `app.run(..., port=10799)`。
  - 前端默认 `5173`，可在 `frontend/vite.config.js` 中调整开发端口。
- 模型下载慢：
  - 训练时会按需下载基础模型（见 `backend/ITraining/train.py` 的 `download_model()`），可提前将模型放到 `~/.yolo_training_visualization_platform/models/base/`。
- CUDA 不可用/驱动不匹配：
  - 请确保本地 PyTorch 与 CUDA 版本匹配。必要时将设备改为 `cpu` 或 `mps`。
- 数据集无法识别：
  - 核查 `dataset.yaml` 字段：`path/train/val/test/names/nc`；或 COCO 的 `annotations` 路径。
- 跨平台路径分隔：
  - 平台内部已尽量做兼容（如 `pathlib.Path`），建议在 yaml 中尽量使用相对路径并指定 `path` 为根。

## 💡 开发建议

- 统一返回结构：后端使用 `tools/format_output.py` 封装响应；前端统一经由 `src/api.js` 调用。
- 日志与进度：训练使用 `tqdm`、自定义 `StreamToLogger` 与队列处理器（见 `backend/ITraining/handlers.py`），便于前端消费。
- 版本协同：更新后端 `GET /info` 版本时，同步更新前端 `SUPPORTED_BACKEND_VERSIONS` 以避免不兼容。

## 🔌 TCP 图像处理服务配置 🆕

### 服务概述
IImageProcessor 模块提供与外部 C++ TCP 服务的通信能力，支持高性能图像处理。

### TCP 协议规范
- **请求头**: `{[(tcp_header)]}` (16字节)
- **请求尾**: `{[(tcp_tail)]}` (14字节)
- **字节序**: 大端序 (Big-Endian)
- **图像编码**: JPEG 格式

### 配置参数
在 `backend/config.py` 中配置：

```python
TCP_IMAGE_SERVICE_HOST = '127.0.0.1'  # TCP 服务地址
TCP_IMAGE_SERVICE_PORT = 16000          # TCP 服务端口
TCP_CONNECTION_TIMEOUT = 5              # 连接超时（秒）
TCP_MAX_RETRIES = 3                     # 最大重试次数
MAX_IMAGE_SIZE = 10 * 1024 * 1024      # 最大图像大小（10MB）
```

也可以通过环境变量覆盖：
```bash
export TCP_IMAGE_SERVICE_HOST=192.168.1.100
export TCP_IMAGE_SERVICE_PORT=16000
```

### 支持的图像格式
- `.jpg` / `.jpeg`
- `.png`
- `.bmp`
- `.tiff`
- `.webp`

### 使用示例

**单图处理**:
```bash
curl -X POST http://localhost:10799/IImageProcessor/processImage \
  -F "image=@test.jpg" \
  -F "camera_id=203" \
  -F "image_id=1001"
```

**批量处理文件夹**:
```bash
curl -X POST http://localhost:10799/IImageProcessor/processFolderImages \
  -H "Content-Type: application/json" \
  -d '{"folder_path": "/path/to/images", "camera_id": 203}'
```

**查看统计信息**:
```bash
curl http://localhost:10799/IImageProcessor/getStatistics
```

### 功能特性
- ✅ 自动重试机制（最多3次）
- ✅ 连接健康检查
- ✅ 图像预处理（自动调整大小、格式转换）
- ✅ 批量处理支持（递归扫描子文件夹）
- ✅ 完整的处理历史记录
- ✅ 详细的统计分析（成功率、处理时间、按日期统计等）
- ✅ JSON 结果导出

详细使用说明请参考：[TCP_IMAGE_PROCESSOR_README.md](./TCP_IMAGE_PROCESSOR_README.md)

## 🔌 服务状态监控系统 🆕

### 概述
平台提供了统一的服务管理中心，可以实时监控所有外部服务的连接状态。

### 支持的服务
1. **TCP 图像处理服务** 
   - 类型：TCP 协议
   - 检测：连接测试 + 健康检查
   - 信息：主机地址、端口、最后检查时间

2. **Triton 推理服务**
   - 类型：HTTP 协议
   - 检测：HTTP API 调用
   - 信息：服务器版本、已加载模型数量、响应时间

3. **Label Studio 标注服务**
   - 类型：HTTP 协议
   - 检测：API 认证 + 项目列表访问
   - 信息：主机地址、端口、项目数量、认证状态

### 状态类型
- 🟢 **在线（online）**：服务正常运行，连接成功
- 🔴 **离线（offline）**：无法连接到服务
- 🟠 **错误（error）**：连接异常或认证失败
- ⚪ **未知（unknown）**：状态检查中

### 配置方式

#### Label Studio 配置
在 `backend/config.py` 中配置或使用环境变量：
```python
LABEL_STUDIO_HOST = os.getenv('LABEL_STUDIO_HOST', 'localhost')
LABEL_STUDIO_PORT = _safe_int_env('LABEL_STUDIO_PORT', 8080)
LABEL_STUDIO_API_TOKEN = os.getenv('LABEL_STUDIO_API_TOKEN', '')
```

环境变量示例：
```bash
export LABEL_STUDIO_HOST=10.10.10.96
export LABEL_STUDIO_PORT=8080
export LABEL_STUDIO_API_TOKEN="Token your_token_here"
```

#### Triton 服务配置
```python
TRITON_SERVER_HOST = os.getenv('TRITON_SERVER_HOST', 'localhost')
TRITON_SERVER_PORT = _safe_int_env('TRITON_SERVER_PORT', 8000)
```

#### TCP 图像服务配置
```python
TCP_IMAGE_SERVICE_HOST = os.getenv('TCP_IMAGE_SERVICE_HOST', '127.0.0.1')
TCP_IMAGE_SERVICE_PORT = _safe_int_env('TCP_IMAGE_SERVICE_PORT', 16000)
```

### 使用方法
1. 启动平台后，访问前端页面
2. 点击导航栏的 **"服务"** 按钮
3. 查看所有服务的实时状态
4. 点击 **"刷新状态"** 按钮手动更新
5. 点击 **"进入服务"** 跳转到对应功能页面

### API 端点
- `GET /IDataset/getLabelStudioServiceStatus` - Label Studio 状态
- `GET /IModel/getTritonServiceStatus` - Triton 状态
- `GET /IImageProcessor/getServiceStatus` - TCP 服务状态

### 故障排查
- **离线状态**：检查服务是否启动、网络连接、防火墙设置
- **认证错误**：检查 API Token 是否正确、是否已过期
- **连接超时**：增加超时时间或检查网络延迟

## 🗺️ 路线图

- [ ] 训练过程更丰富的可视化（lr、各损失分项、PR 曲线）
- [ ] 断点续训、任务克隆与对比
- [ ] 更多数据集格式支持与自动转换
- [x] 模型导出（ONNX/TorchScript/OpenVINO/TensorRT）初步支持；部署助手与 Triton 集成持续完善
- [x] TCP 图像处理服务集成（与 C++ 服务通信）
- [x] 统一服务状态监控系统（Label Studio / Triton / TCP）
- [ ] 视频推理支持
- [ ] 模型性能分析与优化建议
- [ ] 更多外部服务集成（MLflow、W&B等）


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
