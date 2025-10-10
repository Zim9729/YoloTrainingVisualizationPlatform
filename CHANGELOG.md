# 更新日志

本文档记录 YOLO 可视化训练平台的所有重要更新和变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
并且本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

---

## [Unreleased]

### 新增 🎉

#### 服务管理中心 (2025-01-09)
- 新增统一的服务状态监控面板 (`frontend/src/page/ServicesPage.jsx`)
- 支持实时检测外部服务连接状态
- 支持三种服务类型的状态检查：
  - 🏷️ Label Studio 标注服务（HTTP）
  - 🚀 Triton 推理服务（HTTP）
  - 🖼️ TCP 图像处理服务（TCP）

#### Label Studio 服务状态检查
- 新增 API 端点：`GET /IDataset/getLabelStudioServiceStatus`
- 支持通过环境变量配置服务地址和 Token
- 自动检测认证状态（401/403 错误处理）
- 显示项目数量统计
- 支持自定义 base_url 和 token 参数覆盖配置

#### Triton 服务状态检查
- 新增 API 端点：`GET /IModel/getTritonServiceStatus`
- 显示服务器版本信息
- 显示已加载模型数量
- 显示 API 响应时间
- 自动健康检查机制

#### TCP 服务状态检查
- API 端点：`GET /IImageProcessor/getServiceStatus`
- TCP 连接测试
- 显示主机地址和端口信息
- 错误详情展示

#### 配置增强
- 在 `backend/config.py` 新增 Label Studio 配置项：
  - `LABEL_STUDIO_HOST`
  - `LABEL_STUDIO_PORT`
  - `LABEL_STUDIO_API_TOKEN`
  - `LABEL_STUDIO_CONNECTION_TIMEOUT`
- 新增配置函数：`get_label_studio_config()`
- 支持通过环境变量覆盖默认配置

### 改进 ✨

#### 前端优化
- 服务卡片 UI 美化
  - 渐变色标题栏
  - 状态指示器优化（在线/离线/错误/未知）
  - 服务图标与信息展示
  - 悬浮效果和阴影
- 服务状态刷新功能
  - 全局刷新按钮
  - 单个服务刷新按钮
  - 刷新状态加载指示
- 错误信息友好展示
  - 详细错误提示
  - 配置建议
  - 故障排查指引

#### 后端优化
- 统一的服务状态响应格式
- 完善的错误处理机制：
  - 连接失败（ConnectionError）
  - 连接超时（Timeout）
  - 认证失败（401）
  - 权限不足（403）
- 服务状态数据模型标准化

#### 安全性
- API Token 通过环境变量配置，避免硬编码
- 支持动态 Token 传递（请求参数覆盖）
- 敏感信息不记录到日志

### 文档更新 📚
- README.md 更新：
  - 新增"服务管理中心"功能说明
  - 新增服务状态监控系统介绍
  - 新增 Label Studio 状态 API 文档
  - 更新 Triton 和 TCP 服务状态 API 文档
  - 新增配置方式说明
  - 新增故障排查指南
- 创建 CHANGELOG.md 记录版本更新

---

## [1.0.0] - 2024-XX-XX

### 新增
- 🎯 YOLO 模型训练可视化界面
- 📦 数据集管理（YOLO/COCO 格式支持）
- 🏷️ Label Studio 集成（一键导入数据集）
- 🔧 可视化训练配置
- 📈 实时训练日志与指标监控
- ⚡ 多任务并行训练
- 🖼️ 模型测试与验证
- 📦 多格式模型导出（ONNX/TorchScript/OpenVINO/TensorRT）
- 🚀 Triton 推理服务器集成
- 🔌 TCP 图像处理服务模块
- 💻 Electron 桌面应用
- 🌐 跨平台支持（Windows/macOS/Linux）

### 技术栈
- **前端**: React + Vite + Context API
- **后端**: Flask + Ultralytics YOLO + 多线程
- **桌面**: Electron
- **推理**: Triton Inference Server
- **标注**: Label Studio

---

## 版本说明

### 版本命名规则
- **主版本号（Major）**：不兼容的 API 修改
- **次版本号（Minor）**：向下兼容的功能性新增
- **修订号（Patch）**：向下兼容的问题修正

### 更新类型标识
- 🎉 **新增（Added）**：新功能
- ✨ **改进（Changed）**：对现有功能的变更
- 🐛 **修复（Fixed）**：Bug 修复
- 🗑️ **移除（Removed）**：移除的功能
- ⚠️ **弃用（Deprecated）**：即将移除的功能
- 🔒 **安全（Security）**：安全相关更新
- 📚 **文档（Documentation）**：文档更新

---

## 相关链接
- [项目主页](https://github.com/Zim9729/YoloTrainingVisualizationPlatform)
- [问题反馈](https://github.com/Zim9729/YoloTrainingVisualizationPlatform/issues)
- [发布页面](https://github.com/Zim9729/YoloTrainingVisualizationPlatform/releases)

---

**维护者**: [@chzane](https://github.com/chzane)  
**最后更新**: 2025-01-09

