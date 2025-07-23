<div align="center">

# YOLO Visualization Training Platform

#### A cross-platform YOLO model training visualization tool based on Electron + Flask, supporting dataset upload, model training, training progress monitoring, model testing, and result visualization. It aims to lower the entry barrier for visual learning detection tasks.

[简体中文](./README.md) · English

</div>

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

- Simple interface, quick and easy to use
- Supports multiple data formats such as YOLO and COCO
- Visual configuration of training parameters (epoch, batch size, image size, etc.)
- Supports selecting base models for transfer learning
- Visual display of training logs, loss changes, mAP, and other key metrics
- Supports multi-task parallel training
- Supports single image inference testing by uploading image paths
- Fully local operation, no reliance on cloud platforms

## 📦 Installation Instructions

### Prerequisites

- Node.js >= 20
- Python >= 3.9
- pip + virtualenv

### Clone the Project

```bash
git clone https://github.com/chzane/YoloTrainingVisualizationPlatform.git
cd YoloTrainingVisualizationPlatform
```

### Install Backend Dependencies

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
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

# Move frontend/dist/ into app/
# Move backend/dist/main (main.exe on Windows) into app/resources/backend

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
