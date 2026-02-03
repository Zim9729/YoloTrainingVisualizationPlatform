# Docker 部署指南

本项目支持 Docker 容器化部署，包含前端和后端两个服务。

## 前置要求

- Docker 20.10+
- Docker Compose 2.0+
- **GPU 训练需要**: NVIDIA Container Toolkit

### 安装 NVIDIA Container Toolkit (GPU 支持)

```bash
# Ubuntu/Debian
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | sudo tee /etc/apt/sources.list.d/nvidia-docker.list
sudo apt-get update && sudo apt-get install -y nvidia-container-toolkit
sudo systemctl restart docker
```

## 快速开始

### 1. 构建镜像

```bash
cd YoloTrainingVisualizationPlatform
docker-compose build
```

### 2. 启动服务

```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 仅查看后端日志
docker-compose logs -f backend
```

### 3. 访问服务

- **前端界面**: http://localhost
- **后端 API**: http://localhost:10799

### 4. 停止服务

```bash
docker-compose down
```

## 环境变量配置

用户可以通过 `.env` 文件自定义服务地址：

```bash
# 1. 复制示例配置文件
cp .env.example .env

# 2. 编辑配置（按需修改）
notepad .env   # Windows
nano .env      # Linux/macOS

# 3. 启动服务（自动读取 .env）
docker-compose up -d
```

### 可配置项

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `VITE_API_BASE_URL` | 前端访问后端的地址 | `http://localhost:10799` |
| `TCP_IMAGE_SERVICE_HOST` | TCP 图像处理服务 IP | `host.docker.internal` |
| `TCP_IMAGE_SERVICE_PORT` | TCP 服务端口 | `16000` |
| `TRITON_SERVER_HOST` | Triton 推理服务 IP | `host.docker.internal` |
| `TRITON_SERVER_PORT` | Triton 服务端口 | `8000` |
| `LABEL_STUDIO_HOST` | Label Studio 服务 IP | `host.docker.internal` |
| `LABEL_STUDIO_PORT` | Label Studio 端口 | `8080` |
| `LABEL_STUDIO_API_TOKEN` | Label Studio API Token | 空 |

> **提示**: `host.docker.internal` 是 Docker 中访问宿主机的特殊地址

## 数据持久化

默认挂载 `./data` 目录存储:
- 数据集
- 训练结果
- 模型文件
- 处理历史

```bash
# 创建数据目录
mkdir data
```

## 常见问题

### GPU 不可用

进入容器检查:
```bash
docker exec -it yolo-backend python -c "import torch; print('CUDA:', torch.cuda.is_available())"
```

### 连接外部服务

容器需要访问宿主机服务时，使用 `host.docker.internal`:
```bash
TCP_IMAGE_SERVICE_HOST=host.docker.internal
```

### 大文件上传

Nginx 已配置支持最大 500MB 文件上传。

## 生产部署建议

1. 使用 HTTPS (配置 SSL 证书)
2. 设置强密码的 API Token
3. 限制网络访问范围
4. 定期备份 `./data` 目录
