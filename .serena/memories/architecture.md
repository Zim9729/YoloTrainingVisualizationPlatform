# 系统架构

## 三层架构

```
┌─────────────────────────────────────────────────┐
│  Electron 桌面应用层 (app/)                     │
│  - 跨平台打包                                   │
│  - 资源管理                                     │
│  - Python 后端启动管理                          │
└─────────────────────────────────────────────────┘
              ↓ 加载
┌─────────────────────────────────────────────────┐
│  React 前端层 (frontend/)                       │
│  - Vite 开发服务器 (端口: 5173)                │
│  - React 19 + 现代 UI                           │
│  - API 统一封装 (src/api.js)                    │
└─────────────────────────────────────────────────┘
              ↓ HTTP API
┌─────────────────────────────────────────────────┐
│  Flask 后端层 (backend/)                        │
│  - Flask REST API (端口: 10799)                 │
│  - 4 个蓝图模块                                 │
│  - 多线程任务调度                               │
│  - Ultralytics YOLO 集成                        │
└─────────────────────────────────────────────────┘
```

## 后端模块架构 (Flask Blueprints)

### 1. IDataset - 数据集管理
- **路径**: `backend/IDataset/`
- **URL 前缀**: `/IDataset`
- **功能**: 
  - 数据集上传和解压
  - YOLO/COCO 格式解析
  - 数据集统计和验证
  - Label Studio 项目集成

### 2. ITraining - 训练管理
- **路径**: `backend/ITraining/`
- **URL 前缀**: `/ITraining`
- **功能**:
  - 训练任务配置和管理
  - 多任务并行训练
  - 实时日志流式传输
  - 训练进度监控
  - 训练结果管理

### 3. IModel - 模型管理
- **路径**: `backend/IModel/`
- **URL 前缀**: `/IModel`
- **功能**:
  - 模型推理测试 (单图/视频)
  - 模型验证
  - 模型导出 (ONNX/TorchScript/OpenVINO/TensorRT)
  - Triton 仓库集成
  - 推理结果可视化

### 4. IImageProcessor - TCP 图像处理 (新增)
- **路径**: `backend/IImageProcessor/`
- **URL 前缀**: `/IImageProcessor`
- **功能**:
  - TCP 客户端连接管理
  - 单图/批量图像处理
  - 处理历史记录
  - 统计信息分析
  - 与外部 C++ 服务通信 (默认: 127.0.0.1:16000)

## 前端页面架构

### 核心页面 (frontend/src/page/)
- `HomePage.jsx` - 首页和任务概览
- `DatasetPage.jsx` - 数据集管理
- `TasksPage.jsx` - 训练任务创建和列表
- `TaskDetailedPage.jsx` - 训练任务详情和监控
- `TaskResultDetailedPage.jsx` - 训练结果详情
- `ModelsPage.jsx` - 模型列表
- `ModelTestPage.jsx` - 模型测试和验证
- `ModelExportPage.jsx` - 模型导出
- `TritonRepoPage.jsx` - Triton 仓库浏览
- `ServicesPage.jsx` - 服务状态页面
- `TcpImageProcessorPage.jsx` - TCP 图像处理页面
- `LabelStudioImportPage.jsx` - Label Studio 集成页面
- `SettingsPage.jsx` - 设置页面

### 核心组件 (frontend/src/components/)
- `Navbar.jsx` - 导航栏
- `Titlebar.jsx` - 标题栏
- `Bottombar.jsx` - 底部状态栏
- `Main.jsx` - 主内容区域
- `LogPanel.jsx` - 日志面板
- `TerminalViewer.jsx` - 终端查看器
- `TestForm.jsx` - 测试表单
- `ValidationForm.jsx` - 验证表单
- `ExportForm.jsx` - 导出表单
- `ExportLogPanel.jsx` - 导出日志面板
- `ErrorBoundary.jsx` - 错误边界

### 上下文管理 (frontend/src/contexts/)
- `TaskContext.jsx` - 任务上下文，管理运行中任务状态

## API 通信机制

### 统一 API 封装
- **文件**: `frontend/src/api.js`
- **配置**: `frontend/src/config.js`
- **环境变量**: 
  - Development: `frontend/.env.development`
  - Production: `frontend/.env.production`

### 后端统一响应格式
```python
# backend/tools/format_output.py
{
    "msg": "消息文本",
    "code": 200,  # HTTP 状态码
    "data": {}    # 返回数据
}
```

## 多线程任务调度

### 后端任务执行机制
- **文件**: `backend/run_in_thread.py`
- **日志处理**: `backend/ITraining/handlers.py` (QueueHandler)
- **日志流**: `backend/stream_to_logger.py`

### 任务类型
1. `run_main_in_thread()` - 训练任务
2. `run_modeltest_in_thread()` - 测试任务
3. `run_modelval_in_thread()` - 验证任务
4. `run_modelexport_in_thread()` - 导出任务

每个任务：
- 在独立线程中运行
- 使用 Queue 进行日志传输
- 支持实时日志流式传输
- 持久化日志到文件

## 配置管理

### 后端配置
- **主配置**: `backend/config.py`
- **环境变量**: `backend/.env.example`
- **可配置项**:
  - 数据路径
  - TCP 服务地址和端口
  - 图像处理参数
  - YOLO 模型 URL

### 前端配置
- **主配置**: `frontend/src/config.js`
- **内容**:
  - API_BASE_URL
  - SUPPORTED_BACKEND_VERSIONS
  - TASK_CONFIGURATION_ITEMS
  - MODEL_EXPLANATION
  - 其他 UI 配置

## 版本兼容性

- 后端版本: 通过 `GET /info` 返回
- 前端版本检查: `SUPPORTED_BACKEND_VERSIONS` 配置
- 当前版本: `1.0.0`