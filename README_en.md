<div align="center">

# YOLO Visualization Training Platform

#### A cross-platform YOLO model training visualization tool based on Electron + Flask, supporting dataset upload, model training, training progress monitoring, model testing, and result visualization. It aims to lower the entry barrier for visual learning detection tasks.

[简体中文](./README.md) · English

</div>

[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D20-339933)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-%3E%3D3.9-3776AB)](https://www.python.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Release](https://img.shields.io/github/v/release/Zim9729/YoloTrainingVisualizationPlatform?display_name=tag&logo=github)](https://github.com/Zim9729/YoloTrainingVisualizationPlatform/releases)

## 🖼️ Screenshots

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

## ✨ Features

### Dataset Management
- 📦 Supports YOLO, COCO and other formats
- 🏷️ Label Studio integration: One-click dataset import from annotation platform
- 📤 ZIP upload with auto-extraction and configuration
- 📊 Dataset statistics and visualization

### Model Training
- 🎯 Visual training parameter configuration (epoch, batch size, image size, etc.)
- 🔧 Base model selection for transfer learning
- 📈 Visual training logs, loss curves, mAP and key metrics
- ⚡ Multi-task parallel training support
- 💾 Training history management
- 🎨 Training result visualization (confusion matrix, PR curves, etc.)

### Model Testing & Validation
- 🖼️ Single image inference testing
- 🎥 Video inference (coming soon)
- ✅ Dataset validation
- 📊 Detailed performance metrics reports

### Model Export & Deployment
- 📦 Multi-format export (ONNX / TorchScript / OpenVINO / TensorRT)
- 🚀 One-click Triton Inference Server integration
- 📥 Export history management and artifact download
- 🔄 Triton model repository browsing and management

### TCP Image Processing Service 🆕
- 🔌 Seamless integration with C++ TCP service
- 🖼️ Single image upload processing
- 📁 Batch folder processing (recursive)
- 📊 Processing history and statistical analysis
- 📈 Real-time performance monitoring

### Other Features
- 💻 Fully local operation, no cloud dependency
- 🔒 Data privacy protection, all data stays local
- 🌐 Cross-platform support (Windows / macOS / Linux)
- 📱 Modern responsive interface

## 📦 Installation Instructions

### Prerequisites

- Node.js >= 20
- Python >= 3.9
- pip + uv

### Clone the Project

```bash
git clone https://github.com/Zim9729/YoloTrainingVisualizationPlatform.git
cd YoloTrainingVisualizationPlatform
```

### Install Backend Dependencies

```bash
cd backend
pip install uv
uv venv
source .venv/bin/activate  # Linux/macOS
.venv\Scripts\activate     # Windows
uv pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
```

### Install Frontend Dependencies

```bash
cd frontend
yarn install
```

## 🚀 Start the Project

### Development

**Frontend (Vite)**

```bash
cd frontend
yarn dev
```

**APP (Electron)**

```bash
cd app
yarn dev
```

### Build

```bash
cd frontend
yarn build

cd backend
# Before running, change debug in main.py to False
pyinstaller --onefile main.py

cd app
yarn build
```

## 📁 Project Structure Overview

```
Yolo_Training_Visualization_Platform/
├── backend/                   # Python backend (Flask + multithreading task scheduling)
│   ├── ITraining/             # Training task blueprint
│   ├── IModel/                # Model blueprint
│   ├── IDataset/              # Dataset blueprint
│   └── ...
├── frontend/                  # React frontend interface
│   └── ...
├── app/                       # Electron
│   └── ...
└── README.md 
```

## 🧩 Architecture

### Three-Tier Architecture

```
┌─────────────────────────────────────────────────────┐
│     Electron Desktop App (Cross-platform)          │
│  • Dev mode: loads http://localhost:5173           │
│  • Prod mode: loads resources/frontend/index.html  │
├─────────────────────────────────────────────────────┤
│              React + Vite Frontend                  │
│  • Port: 5173 (development)                        │
│  • API Base URL: http://localhost:10799            │
│  • State Management: Context API (TaskContext)    │
│  • Real-time Updates: Polling (5s interval)       │
├─────────────────────────────────────────────────────┤
│              Flask Backend API                      │
│  • Port: 10799                                      │
│  • Host: 0.0.0.0 (external access allowed)        │
│  • Architecture: Modular Blueprint Design          │
│  • Concurrency: Multi-threaded Task Management    │
└─────────────────────────────────────────────────────┘
```

### Backend Module Architecture

- **Frontend (`frontend/`)**: React + Vite, default dev port `5173`
  - API Client: `src/api.js` wraps all HTTP requests
  - Configuration: `src/config.js` defines API URL and constants
  - Environment Variables: Supports `.env.development` and `.env.production` overrides
  - State Management: TaskContext manages global task state

- **Backend (`backend/`)**: Flask-based, main entry `backend/main.py`, four blueprints:
  - **IDataset** (`/IDataset`): Dataset import, statistics, validation, and Label Studio integration
  - **ITraining** (`/ITraining`): Training task management, multi-task parallel execution, log streaming
  - **IModel** (`/IModel`): Model inference testing, validation, export, and Triton deployment
  - **IImageProcessor** (`/IImageProcessor`): TCP image processing service, batch processing, history management 🆕

- **Desktop (`app/`)**: Electron shell. Dev mode loads `http://localhost:5173`, production loads `resources/frontend/index.html`.

### Data Storage Directories

Runtime data directories (see `backend/config.py`, can be customized):

| Directory | Path | Description |
|-----------|------|-------------|
| Datasets | `~/.yolo_training_visualization_platform/dataset` | Uploaded training datasets |
| Task Configs | `~/.yolo_training_visualization_platform/tasks` | Training task YAML files |
| Training Output | `~/.yolo_training_visualization_platform/tasks/training` | Model weights and training artifacts |
| Model Cache | `~/.yolo_training_visualization_platform/models/base` | Downloaded pretrained models |
| Training Metadata | `~/.yolo_training_visualization_platform/tasks_result_files` | Training task records |
| Test Metadata | `~/.yolo_training_visualization_platform/test_result_files` | Inference test records |
| Validation Metadata | `~/.yolo_training_visualization_platform/validation_result_files` | Model validation records |
| Image Processing History 🆕 | `~/.yolo_training_visualization_platform/image_processing_history` | TCP processing history |

Backend version endpoint: `GET /info`, current `1.0.0`. The frontend checks compatibility via `SUPPORTED_BACKEND_VERSIONS` in `src/config.js`.

## 🔌 Backend API Overview (excerpt)

- `GET /`: health check (`OK`)
- `GET /info`: backend version
- `IDataset` (see `backend/IDataset/routes.py`): YAML/JSON parsing for YOLO/COCO, counts of images/labels, dataset upload and validation
  - Label Studio integration:
    - `GET /IDataset/listLabelStudioProjects?base_url=...&token=...`: list projects (token optional)
    - `POST /IDataset/buildDatasetFromLabelStudio`: build a YOLO dataset from a project
      - Body JSON keys: `base_url`(required), `token`(optional), `project_id`(required), `name`, `version`, `splits` (e.g. `[0.8,0.2,0.0]`), `download_images`, `class_names`
- `ITraining` (see `backend/ITraining/routes.py`): list/read tasks, start training, query status, fetch logs/artifacts (supports concurrent tasks)
- `IModel` (see `backend/IModel/routes.py`):
  - `POST /IModel/runModelTest`: start inference (image/video)
  - `POST /IModel/runModelValidation`: start model validation (provide `datasetYamlPath`, `modelType`, etc.)
  - `GET /IModel/getTaskLog`: poll logs for a test task
  - `GET /IModel/getValTaskLog`: poll logs for a validation task
  - `POST /IModel/uploadTestInput`: upload a test image (multipart form in browser)
  - list/load tasks, index and download result files

Export and artifact endpoints (see root `openapi.yaml` for details):

- `POST /IModel/runModelExport`: start an export task (supports `onnx/torchscript/openvino/engine`)
- `GET /IModel/getExportTaskLog`: poll export logs (with `exportKey`)
- `GET /IModel/getExportHistory`: list export history for a training result directory
- `GET /IModel/getExportHistoryLog`: read persisted log for a finished export task
- `GET /IModel/listExportArtifacts`: list files under `outputDir/export/`
- `GET /IModel/downloadExportArtifact`: download a specific export artifact

All endpoints return a unified structure (see `tools/format_output.py`). Frontend uses `src/api.js` to wrap `fetch` calls.

OpenAPI spec: see `openapi.yaml` at repository root (import into Swagger UI / Insomnia / Postman).

## 🗂️ Dataset & Task Configuration

The platform supports YOLO and COCO formats. YOLO is recommended.

- YOLO `dataset.yaml` example:

```yaml
path: /abs/path/to/dataset
train: images/train
val: images/val
test: images/test  # optional
names: [cat, dog]
nc: 2
```

- COCO layout (key files):
  - images under `train/`, `val/`
  - annotations at `annotations/instances_train.json`, `annotations/instances_val.json`

Task files are saved at: `~/.yolo_training_visualization_platform/tasks/*.yaml`.
The training module (`backend/ITraining/train.py`) reads task config and dataset platform info file `yolo_training_visualization_info.yaml` from the dataset root.

Common task parameters (aligned with `frontend/src/config.js#TASK_CONFIGURATiON_ITEMS`):

- `taskName`, `taskDescription`
- `datasetPath` (dataset root)
- `trainingType` (0: finetune; 1: from-scratch)
- `epochs`, `batchSize`, `imgSize`
- `device` (cpu/gpu/mps) with `gpuCUDAIndex`, `gpuCUDANum`
- `trainSeed`, `cache`, `modelYamlFile`, `baseModelID`

Model artifacts (excerpt from `frontend/src/config.js#MODEL_EXPLANATION`):

- `weights/best.pt`: best on validation, recommended for inference
- `weights/last.pt`: last epoch, good for resume
- `args.yaml`, `results.csv`: params and metrics

## ⚡ Quickstart (local dev)

1) Start backend (port 10799):

```bash
cd backend
python main.py
```

2) Start frontend (Vite at 5173):

```bash
cd frontend
yarn dev
```

3) Start Electron app (optional, loads 5173 in dev):

```bash
cd app
yarn dev
```

## 📦 Model Export & Deployment

The project provides built-in export via `ultralytics.YOLO`. Artifacts are consolidated under `export/` in the training result directory. Supported formats:

- ONNX (`onnx`)
- TorchScript (`torchscript`)
- OpenVINO (`openvino`, produces `.xml` and `.bin`)
- TensorRT (`engine`)

Trigger export using `POST /IModel/runModelExport` with key fields:

- `outputDir`: training result directory (contains `weights/best.pt`, etc.)
- `modelType`: weight name without extension, e.g., `best`, `last`, `epoch10`
- `formats`: array like `["onnx", "openvino"]`
- `imgsz`, `half`, `simplify`, `opset`, `device`: low-level export parameters

Logs & history:

- Poll logs via `GET /IModel/getExportTaskLog?exportKey=...`
- List history via `GET /IModel/getExportHistory?outputDir=...`
- Read persisted log via `GET /IModel/getExportHistoryLog?outputDir=...&exportKey=...`
- List artifacts via `GET /IModel/listExportArtifacts?outputDir=...` and download with `GET /IModel/downloadExportArtifact`

### Triton Model Repository Browser (optional)

Frontend page: `frontend/src/page/TritonRepoPage.jsx`

- Enter a local Triton `model_repository` path to browse models, versions, and files
- Copy model/file paths and delete models or specific versions
- Helps organize exported ONNX/TensorRT models for serving with Triton

Note: some Triton-related backend endpoints are evolving; OpenAPI may not fully cover them. Refer to the page and backend implementation for the latest behavior.

## 🛠️ Packaging & Release Tips

- Use `pyinstaller` to build backend single executable (set `debug=False` in `backend/main.py`).
- Electron uses `electron-builder`. `resources/backend` is included via `extraResources` (see `app/package.json`).
- Build frontend with `yarn build` and bundle output under Electron `resources/frontend/`.

## ❓ Troubleshooting

- Port conflicts:
  - Backend `10799` (change in `backend/main.py`)
  - Frontend `5173` (change in `frontend/vite.config.js`)
- Slow model downloads:
  - Training may download base models on demand (`download_model()` in `backend/ITraining/train.py`). You can pre-place models in `~/.yolo_training_visualization_platform/models/base/`.
- CUDA not available / driver mismatch:
  - Ensure PyTorch and CUDA versions match. Use `cpu` or `mps` as fallback.
- Dataset issues:
  - Check `dataset.yaml` fields (`path/train/val/test/names/nc`) or COCO annotation paths.
- Cross-platform paths:
  - Internally we use `pathlib` where possible; prefer relative paths in YAML with a proper `path` root.

## 💡 Development Tips

- Unified response format (`tools/format_output.py`), unified API client (`frontend/src/api.js`).
- Logs & progress via `tqdm` and custom `StreamToLogger` with queue handler (see `backend/ITraining/handlers.py`).
- Version sync: when updating backend `GET /info`, also update frontend `SUPPORTED_BACKEND_VERSIONS`.

## 🗺️ Roadmap

- [ ] Richer training visualizations (lr, loss breakdowns, PR curves)
- [ ] Resume training, task cloning & comparison
- [ ] More dataset formats and auto conversion
- [x] Model export (ONNX/TorchScript/OpenVINO/TensorRT) with Triton integration
- [x] TCP image processing service integration (C++ service communication)
- [ ] Video inference support
- [ ] Model performance analysis and optimization recommendations

## 🤝 Contribution Guide

Contributions via PR or issue are welcome! You can:

* Submit bug reports
* Add new feature modules
* Suggest UI/UX improvements

## 📄 License

This project is licensed under the [MIT License](LICENSE).

## 🧠 Inspiration and Acknowledgments

* [Ultralytics](https://github.com/ultralytics/)
* [Electron](https://www.electronjs.org/)
* [Vite](https://vitejs.dev/)
* [Flask](https://flask.palletsprojects.com/)

## 📫 Contact

* 📧 Email: [slxzane@outlook.com](mailto:slxzane@outlook.com)
* 🌐 Github: [@chzane](https://github.com/chzane)
