@echo off
REM Electron构建批处理脚本 (Windows)
REM 简化版本，用于快速构建

echo === YOLO Training Visualization Platform 构建脚本 ===
echo 时间: %date% %time%
echo.

REM 检查当前目录
if not exist "package.json" (
    echo 错误: 请在app目录下运行此脚本
    pause
    exit /b 1
)

REM 清理构建目录
if exist "dist" (
    echo 清理构建目录...
    rmdir /s /q "dist" 2>nul
    echo ✓ 构建目录已清理
)

REM 构建前端静态文件
echo 构建前端静态文件...
cd ..\frontend
call npm run build
if %ERRORLEVEL% neq 0 (
    echo 前端构建失败
    pause
    exit /b 1
)
cd ..\app
echo ✓ 前端构建完成

REM 检查backend资源
if not exist "resources\backend" (
    echo 复制backend资源...
    mkdir "resources\backend" 2>nul
    xcopy "..\backend\IDataset" "resources\backend\IDataset" /E /I /Q
    xcopy "..\backend\IModel" "resources\backend\IModel" /E /I /Q
    xcopy "..\backend\ITraining" "resources\backend\ITraining" /E /I /Q
    xcopy "..\backend\tools" "resources\backend\tools" /E /I /Q
    copy "..\backend\config.py" "resources\backend\" >nul
    copy "..\backend\main.py" "resources\backend\" >nul
    copy "..\backend\requirements.txt" "resources\backend\" >nul
    copy "..\backend\run_in_thread.py" "resources\backend\" >nul
    copy "..\backend\stream_to_logger.py" "resources\backend\" >nul
    echo ✓ Backend资源已复制 (排除了.venv, __pycache__, build, dist等文件夹)
)

REM 复制前端构建文件
if exist "..\frontend\dist" (
    echo 复制前端构建文件...
    mkdir "resources\frontend" 2>nul
    xcopy "..\frontend\dist" "resources\frontend" /E /I /Q
    echo ✓ 前端资源已复制
) else (
    echo ⚠ 前端构建文件不存在
)

REM 执行构建
echo 开始Electron构建...
call yarn build

REM 检查构建结果并修复
if not exist "dist\win-unpacked\YoloTrainingVisualizationApp.exe" (
    if exist "dist\win-unpacked" (
        echo 修复缺失的electron.exe...
        copy "node_modules\electron\dist\electron.exe" "dist\win-unpacked\electron.exe" >nul
        ren "dist\win-unpacked\electron.exe" "YoloTrainingVisualizationApp.exe"
        xcopy "node_modules\electron\dist\*" "dist\win-unpacked\" /E /Y /Q
        echo ✓ 构建修复完成
    ) else (
        echo 构建失败: 输出目录不存在
        pause
        exit /b 1
    )
)

REM 复制后端执行程序
if exist "..\backend\dist\main.exe" (
    echo 复制后端执行程序...
    copy "..\backend\dist\main.exe" "dist\win-unpacked\main.exe" >nul
    echo ✓ 后端执行程序已复制到应用目录
) else (
    echo ⚠ 未找到后端执行程序
)

echo.
echo === 构建完成 ===
echo 输出路径: %cd%\dist\win-unpacked
echo 可执行文件: YoloTrainingVisualizationApp.exe
echo 后端程序: main.exe
echo.
echo 按任意键退出...
pause >nul
