# Electron构建自动修复脚本
# 用于解决Windows环境下electron.exe被防病毒软件删除的问题

param(
    [switch]$Clean,
    [switch]$Verbose
)

# 设置错误处理
$ErrorActionPreference = "Stop"

# 颜色输出函数
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Success { Write-ColorOutput Green $args }
function Write-Warning { Write-ColorOutput Yellow $args }
function Write-Error { Write-ColorOutput Red $args }
function Write-Info { Write-ColorOutput Cyan $args }

# 脚本开始
Write-Info "=== YOLO Training Visualization Platform 构建脚本 ==="
Write-Info "时间: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Info ""

try {
    # 检查当前目录
    if (!(Test-Path "package.json")) {
        throw "错误: 请在app目录下运行此脚本"
    }

    # 清理构建目录
    if ($Clean -or (Test-Path "dist")) {
        Write-Info "清理构建目录..."
        Remove-Item -Path "dist" -Recurse -Force -ErrorAction SilentlyContinue
        Write-Success "✓ 构建目录已清理"
    }

    # 检查依赖
    Write-Info "检查项目依赖..."
    if (!(Test-Path "node_modules")) {
        Write-Warning "未找到node_modules，正在安装依赖..."
        yarn install
    }
    Write-Success "✓ 依赖检查完成"

    # 构建前端静态文件
    Write-Host "构建前端静态文件..." -ForegroundColor Yellow
    Set-Location "..\frontend"
    try {
        & npm run build
        if ($LASTEXITCODE -ne 0) {
            throw "前端构建失败"
        }
        Write-Host "✓ 前端构建完成" -ForegroundColor Green
    } catch {
        Write-Host "⚠ 前端构建失败: $_" -ForegroundColor Red
        Set-Location "..\app"
        exit 1
    }
    Set-Location "..\app"

    # 检查backend资源
    if (-not (Test-Path "resources\backend")) {
        Write-Host "复制backend资源..." -ForegroundColor Yellow
        New-Item -ItemType Directory -Path "resources\backend" -Force | Out-Null
        
        # 只复制运行时需要的文件和文件夹
        $backendItems = @(
            "IDataset",
            "IModel", 
            "ITraining",
            "tools",
            "config.py",
            "main.py",
            "requirements.txt",
            "run_in_thread.py",
            "stream_to_logger.py"
        )
        
        foreach ($item in $backendItems) {
            $sourcePath = "..\backend\$item"
            if (Test-Path $sourcePath) {
                Copy-Item $sourcePath "resources\backend\$item" -Recurse -Force
            }
        }
        Write-Host "✓ Backend资源已复制 (排除了.venv, __pycache__, build, dist等文件夹)" -ForegroundColor Green
    } else {
        Write-Host "✓ Backend资源检查完成" -ForegroundColor Green
    }

    # 复制前端构建文件
    if (Test-Path "..\frontend\dist") {
        Write-Host "复制前端构建文件..." -ForegroundColor Yellow
        New-Item -ItemType Directory -Path "resources\frontend" -Force | Out-Null
        Copy-Item "..\frontend\dist\*" "resources\frontend" -Recurse -Force
        Write-Host "✓ 前端资源已复制" -ForegroundColor Green
    } else {
        Write-Host "⚠ 前端构建文件不存在" -ForegroundColor Red
    }

    # 执行构建
    Write-Info "开始Electron构建..."
    $buildStart = Get-Date
    
    # 尝试正常构建
    try {
        & yarn build
        $buildExitCode = $LASTEXITCODE
    } catch {
        $buildExitCode = 1
        Write-Warning "构建过程中出现异常: $($_.Exception.Message)"
    }
    
    if ($buildExitCode -ne 0) {
        Write-Warning "⚠ 正常构建失败，开始修复..."
        
        # 检查构建输出目录
        if (!(Test-Path "dist\win-unpacked")) {
            throw "构建输出目录不存在，构建完全失败"
        }
        
        # 检查是否缺少electron.exe
        if (!(Test-Path "dist\win-unpacked\electron.exe") -and !(Test-Path "dist\win-unpacked\YoloTrainingVisualizationApp.exe")) {
            Write-Info "修复缺失的electron.exe文件..."
            
            # 复制electron.exe
            if (Test-Path "node_modules\electron\dist\electron.exe") {
                Copy-Item "node_modules\electron\dist\electron.exe" "dist\win-unpacked\electron.exe" -Force
                Write-Success "✓ 已复制electron.exe"
                
                # 重命名为目标应用名称
                Rename-Item "dist\win-unpacked\electron.exe" "YoloTrainingVisualizationApp.exe" -Force
                Write-Success "✓ 已重命名为YoloTrainingVisualizationApp.exe"
                
                # 复制其他必要的Electron文件
                Copy-Item "node_modules\electron\dist\*" "dist\win-unpacked\" -Recurse -Force -Exclude "electron.exe"
                Write-Success "✓ 已复制Electron运行时文件"
            } else {
                throw "未找到electron.exe源文件"
            }
        }
    } else {
        Write-Success "✓ 构建成功完成"
    }
    
    $buildEnd = Get-Date
    $buildTime = $buildEnd - $buildStart
    
    # 验证构建结果
    Write-Info "验证构建结果..."
    $appPath = "dist\win-unpacked\YoloTrainingVisualizationApp.exe"
    
    if (Test-Path $appPath) {
        $fileInfo = Get-Item $appPath
        Write-Success "✓ 应用程序构建成功"
        Write-Info "  路径: $($fileInfo.FullName)"
        Write-Info "  大小: $([math]::Round($fileInfo.Length / 1MB, 2)) MB"
        Write-Info "  修改时间: $($fileInfo.LastWriteTime)"
    } else {
        throw "应用程序文件不存在"
    }
    
    # 复制后端执行程序
    if (Test-Path "..\backend\dist\main.exe") {
        Write-Host "复制后端执行程序..." -ForegroundColor Yellow
        Copy-Item "..\backend\dist\main.exe" "dist\win-unpacked\main.exe" -Force
        Write-Success "✓ 后端执行程序已复制到应用目录"
    } else {
        Write-Warning "⚠ 未找到后端执行程序 (..\backend\dist\main.exe)"
    }
    
    # 检查资源文件
    if (Test-Path "dist\win-unpacked\resources") {
        $resourceCount = (Get-ChildItem "dist\win-unpacked\resources" -Recurse -File).Count
        Write-Success "✓ 资源文件已包含 ($resourceCount 个文件)"
    } else {
        Write-Warning "⚠ 未找到资源文件目录"
    }
    
    Write-Success ""
    Write-Success "=== 构建完成 ==="
    Write-Success "构建时间: $($buildTime.TotalSeconds.ToString('F1')) 秒"
    Write-Success "输出路径: $((Get-Item 'dist\win-unpacked').FullName)"
    Write-Success "可执行文件: YoloTrainingVisualizationApp.exe"
    Write-Success ""
    Write-Info "使用方法:"
    Write-Info "  1. 直接运行: .\dist\win-unpacked\YoloTrainingVisualizationApp.exe"
    Write-Info "  2. 分发整个 dist\win-unpacked 文件夹"
    Write-Success ""
    
} catch {
    Write-Error ""
    Write-Error "=== 构建失败 ==="
    Write-Error "错误: $($_.Exception.Message)"
    Write-Error "位置: $($_.ScriptStackTrace)"
    Write-Error ""
    Write-Info "故障排除建议:"
    Write-Info "  1. 确保在app目录下运行脚本"
    Write-Info "  2. 检查yarn和node是否正确安装"
    Write-Info "  3. 尝试添加项目文件夹到Windows Defender排除列表"
    Write-Info "  4. 以管理员身份运行PowerShell"
    exit 1
}
