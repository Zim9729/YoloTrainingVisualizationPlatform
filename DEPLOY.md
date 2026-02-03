# YOLO Training Visualization Platform 部署指南

## 迁移到其他机器

### 前提条件

目标机器需要安装：
- **Docker** (版本 20.10+)
- **Docker Compose** (版本 2.0+)

### 方式一：复制源代码部署（推荐）

1. **复制整个项目文件夹到目标机器**
   ```bash
   # 需要复制的文件/文件夹：
   YoloTrainingVisualizationPlatform/
   ├── backend/              # 后端代码
   ├── frontend/             # 前端代码
   ├── docker/               # Docker 配置文件
   ├── docker-compose.yml    # 生产环境配置
   └── docker-compose.dev.yml # 开发环境配置（可选）
   ```

2. **在目标机器上构建并启动**
   ```bash
   cd YoloTrainingVisualizationPlatform
   
   # 生产模式
   docker-compose build
   docker-compose up -d
   
   # 或开发模式
   docker-compose -f docker-compose.dev.yml build
   docker-compose -f docker-compose.dev.yml up -d
   ```

3. **访问应用**
   - 前端界面: `http://<目标机器IP>`
   - 后端API: `http://<目标机器IP>:10799`

---

### 方式二：导出 Docker 镜像部署

适用于目标机器无法联网或网络较慢的情况。

**在源机器上：**

1. **构建镜像**
   ```bash
   docker-compose build
   ```

2. **导出镜像为文件**
   ```bash
   # 导出后端镜像
   docker save yolotrainingvisualizationplatform-backend -o yolo-backend.tar
   
   # 导出前端镜像
   docker save yolotrainingvisualizationplatform-frontend -o yolo-frontend.tar
   ```

3. **复制到目标机器**
   - `yolo-backend.tar`
   - `yolo-frontend.tar`
   - `docker-compose.yml`
   - `docker/nginx.conf`

**在目标机器上：**

1. **加载镜像**
   ```bash
   docker load -i yolo-backend.tar
   docker load -i yolo-frontend.tar
   ```

2. **启动服务**
   ```bash
   docker-compose up -d
   ```

---

## 常用命令

| 命令 | 说明 |
|------|------|
| `docker-compose up -d` | 启动服务 |
| `docker-compose down` | 停止服务 |
| `docker-compose logs -f` | 查看日志 |
| `docker-compose ps` | 查看状态 |
| `docker-compose restart` | 重启服务 |

## 端口说明

| 端口 | 服务 |
|------|------|
| 80 | 前端 Web 界面 |
| 10799 | 后端 API |

## 数据持久化

- 服务配置保存在 Docker Volume `yolo-data` 中
- 数据目录映射：容器内 `/data` → Volume

## 故障排查

```bash
# 查看容器日志
docker-compose logs backend
docker-compose logs frontend

# 进入容器调试
docker exec -it yolo-backend bash
docker exec -it yolo-frontend sh

# 检查容器状态
docker-compose ps
```
