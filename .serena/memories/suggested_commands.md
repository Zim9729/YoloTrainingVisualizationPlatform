# 常用开发命令

## Windows 系统命令 (项目运行在 Windows)

### 文件和目录操作
```powershell
# 列出目录内容
dir
ls  # PowerShell 别名

# 切换目录
cd path\to\directory

# 创建目录
mkdir directory_name
New-Item -ItemType Directory -Path directory_name

# 删除文件
del filename
Remove-Item filename

# 删除目录
rmdir /s directory_name
Remove-Item -Recurse directory_name

# 复制文件
copy source destination
Copy-Item source destination

# 移动文件
move source destination
Move-Item source destination

# 查找文件
dir /s filename
Get-ChildItem -Recurse -Filter filename

# 查看文件内容
type filename
Get-Content filename

# 清屏
cls
Clear-Host
```

### 进程和系统
```powershell
# 查看进程
tasklist
Get-Process

# 杀死进程
taskkill /F /PID pid_number
Stop-Process -Id pid_number

# 查看端口占用
netstat -ano | findstr :10799
Get-NetTCPConnection -LocalPort 10799

# 查看系统信息
systeminfo
```

## Python 后端开发命令

### 环境设置
```bash
# 安装 uv (如果未安装)
pip install uv

# 创建虚拟环境
cd backend
uv venv

# 激活虚拟环境 (Windows)
.venv\Scripts\activate

# 激活虚拟环境 (Linux/macOS)
source .venv/bin/activate

# 安装依赖
uv pip install -r requirements.txt

# 使用清华镜像安装 (国内推荐)
uv pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
```

### 运行后端
```bash
# 开发模式运行 (修改 main.py 中 debug=True)
cd backend
python main.py

# 生产模式运行 (debug=False)
cd backend
python main.py

# 指定端口运行 (修改 main.py 中的 port 参数)
# 默认端口: 10799
```

### 打包后端
```bash
cd backend
# 确保 main.py 中 debug=False
pyinstaller --onefile main.py

# 输出: backend/dist/main.exe
```

## 前端开发命令

### 安装依赖
```bash
cd frontend
yarn install
# 或
npm install
```

### 开发模式
```bash
cd frontend
yarn dev
# 或
npm run dev

# 默认运行在: http://localhost:5173
```

### 构建生产版本
```bash
cd frontend
yarn build
# 或
npm run build

# 输出: frontend/dist/
```

### 代码检查
```bash
cd frontend
yarn lint
# 或
npm run lint
```

### 预览构建结果
```bash
cd frontend
yarn preview
# 或
npm run preview
```

## Electron 应用开发命令

### 安装依赖
```bash
cd app
yarn install
# 或
npm install
```

### 开发模式
```bash
cd app
yarn dev
# 或
npm run dev

# 会启动 Electron 窗口，加载 http://localhost:5173
```

### 打包应用
```bash
cd app
yarn build
# 或
npm run build

# Windows 打包
yarn build:win

# 输出: app/dist/
```

### 打包修复 (Windows)
```bash
cd app
yarn build:fix
# 或
npm run build:fix

# 清理并重新打包
yarn build:clean
# 或
npm run build:clean
```

## Git 命令

### 基本操作
```bash
# 查看状态
git status

# 查看分支
git branch

# 添加文件
git add .
git add filename

# 提交
git commit -m "提交信息"

# 推送
git push

# 拉取
git pull

# 查看日志
git log --oneline

# 查看差异
git diff
```

### 分支操作
```bash
# 创建并切换分支
git checkout -b branch_name

# 切换分支
git checkout branch_name

# 合并分支
git merge branch_name

# 删除分支
git branch -d branch_name
```

## 完整开发流程命令

### 首次设置
```powershell
# 1. 克隆项目
git clone https://github.com/chzane/YoloTrainingVisualizationPlatform.git
cd YoloTrainingVisualizationPlatform

# 2. 安装后端依赖
cd backend
pip install uv
uv venv
.venv\Scripts\activate
uv pip install -r requirements.txt
cd ..

# 3. 安装前端依赖
cd frontend
yarn install
cd ..

# 4. 安装 Electron 依赖 (可选)
cd app
yarn install
cd ..
```

### 日常开发
```powershell
# 终端 1: 启动后端
cd backend
.venv\Scripts\activate
python main.py

# 终端 2: 启动前端
cd frontend
yarn dev

# 终端 3 (可选): 启动 Electron
cd app
yarn dev
```

### 生产构建
```powershell
# 1. 构建前端
cd frontend
yarn build

# 2. 打包后端 (确保 main.py 中 debug=False)
cd ..\backend
pyinstaller --onefile main.py

# 3. 打包 Electron 应用
cd ..\app
yarn build
```

## 测试和调试命令

### 后端测试
```bash
cd backend
# 运行测试脚本 (如果有)
python test_image_processor.py
python test_tcp_image_processing.py
```

### API 测试
```bash
# 使用 curl 测试健康检查
curl http://localhost:10799/

# 测试版本信息
curl http://localhost:10799/info

# 测试 TCP 图像处理连接
curl http://localhost:10799/IImageProcessor/testConnection
```

## 环境变量配置

### 后端环境变量
```powershell
# 设置 TCP 服务配置
$env:TCP_IMAGE_SERVICE_HOST="127.0.0.1"
$env:TCP_IMAGE_SERVICE_PORT="16000"
$env:TCP_CONNECTION_TIMEOUT="5"
$env:TCP_MAX_RETRIES="3"
```

### 前端环境变量
编辑 `frontend/.env.development` 或 `frontend/.env.production`:
```
VITE_API_BASE_URL=http://localhost:10799
```

## 清理命令

### 清理 Python 缓存
```powershell
# PowerShell
Get-ChildItem -Path . -Filter "__pycache__" -Recurse -Directory | Remove-Item -Recurse -Force
Get-ChildItem -Path . -Filter "*.pyc" -Recurse -File | Remove-Item -Force

# CMD
for /d /r . %d in (__pycache__) do @if exist "%d" rd /s /q "%d"
```

### 清理 Node.js
```bash
# 删除 node_modules
cd frontend
rm -rf node_modules
# 或
Remove-Item -Recurse -Force node_modules

cd ../app
rm -rf node_modules
# 或
Remove-Item -Recurse -Force node_modules

# 重新安装
yarn install
```

## 端口检查和清理

```powershell
# 查看端口占用
netstat -ano | findstr :10799  # 后端端口
netstat -ano | findstr :5173   # 前端端口
netstat -ano | findstr :16000  # TCP 图像服务端口

# 杀死占用端口的进程
taskkill /F /PID <PID>
```