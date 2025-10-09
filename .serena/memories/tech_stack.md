# 技术栈

## 前端技术栈

### 核心框架
- **React** 19.1.0 - UI 框架
- **Vite** 7.0.0 - 构建工具和开发服务器
- **ESLint** 9.29.0 - 代码检查

### UI 和交互
- **xterm** 5.3.0 - 终端模拟器
- **@xterm/xterm** 5.5.0 - 终端组件
- **canvas-confetti** 1.9.3 - 动画效果
- **highlight.js** 11.11.1 - 代码高亮
- **prismjs** 1.30.0 - 代码语法高亮
- **vite-plugin-prismjs** - Vite Prism.js 插件
- **js-yaml** 4.1.0 - YAML 解析

### 开发工具
- **@vitejs/plugin-react** 4.5.2 - React Vite 插件
- **TypeScript types** - React 类型定义

## 后端技术栈

### 核心框架
- **Flask** 3.1.1 - Web 框架
- **flask-cors** 6.0.1 - CORS 支持
- **Werkzeug** 3.1.3 - WSGI 工具库

### 深度学习和计算机视觉
- **torch** 2.7.1+cu121 - PyTorch (CUDA 12.1)
- **torchvision** 0.22.1+cu121 - 视觉模型和工具
- **ultralytics** 8.3.162 - YOLO 框架
- **ultralytics-thop** 2.0.14 - 模型复杂度分析
- **opencv-python** 4.12.0.88 - 计算机视觉库

### 数据处理和科学计算
- **numpy** 2.2.6 - 数值计算
- **pandas** 2.3.1 - 数据处理
- **scipy** 1.16.0 - 科学计算
- **matplotlib** 3.10.3 - 数据可视化
- **pillow** 11.3.0 - 图像处理

### 系统和工具
- **PyYAML** 6.0.2 - YAML 解析
- **requests** 2.32.4 - HTTP 客户端
- **tqdm** 4.67.1 - 进度条
- **psutil** 7.0.0 - 系统和进程工具
- **py-cpuinfo** 9.0.0 - CPU 信息
- **python-dateutil** 2.9.0 - 日期时间工具

### 打包工具
- **pyinstaller** 6.14.2 - Python 打包工具
- **pyinstaller-hooks-contrib** 2025.5 - PyInstaller 钩子

## 桌面应用技术栈

### Electron
- **electron** 37.2.1 - 跨平台桌面应用框架
- **electron-builder** 26.0.12 - 打包构建工具
- **electron-squirrel-startup** 1.0.1 - Squirrel 启动支持
- **python-shell** 5.0.0 - Python 进程管理

### Electron Forge 工具链
- **@electron-forge/cli** 7.8.1
- **@electron-forge/maker-deb** 7.8.1 - Debian 包
- **@electron-forge/maker-rpm** 7.8.1 - RPM 包
- **@electron-forge/maker-squirrel** 7.8.1 - Windows 安装包
- **@electron-forge/maker-zip** 7.8.1 - ZIP 压缩包
- **@electron-forge/plugin-auto-unpack-natives** 7.8.1
- **@electron-forge/plugin-fuses** 7.8.1
- **@electron/fuses** 1.8.0

## 开发环境要求

### 系统要求
- **操作系统**: Windows 10/11, macOS, Linux
- **Node.js**: >= 20.0.0
- **Python**: >= 3.9
- **包管理器**: 
  - npm / yarn (Node.js)
  - pip + uv (Python)

### GPU 支持 (可选)
- **CUDA**: 12.1 (用于 GPU 加速训练)
- **cuDNN**: 匹配 CUDA 版本
- **NVIDIA 驱动**: 最新版本

## 外部服务集成

### Label Studio (可选)
- 用于数据标注和数据集构建
- 通过 API 集成

### Triton Inference Server (可选)
- 用于模型部署和推理服务
- 支持模型仓库浏览和管理

### TCP 图像处理服务 (可选)
- 外部 C++ TCP 服务
- 默认地址: 127.0.0.1:16000
- 用于图像处理任务