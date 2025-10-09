#!/bin/bash
# Electron构建脚本 (Linux/macOS)
# 跨平台版本

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}=== YOLO Training Visualization Platform 构建脚本 ===${NC}"
echo -e "${CYAN}时间: $(date)${NC}"
echo ""

# 检查当前目录
if [ ! -f "package.json" ]; then
    echo -e "${RED}错误: 请在app目录下运行此脚本${NC}"
    exit 1
fi

# 清理构建目录
if [ -d "dist" ]; then
    echo -e "${CYAN}清理构建目录...${NC}"
    rm -rf "dist"
    echo -e "${GREEN}✓ 构建目录已清理${NC}"
fi

# 检查依赖
echo -e "${CYAN}检查项目依赖...${NC}"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}未找到node_modules，正在安装依赖...${NC}"
    yarn install
fi
echo -e "${GREEN}✓ 依赖检查完成${NC}"

# 检查backend资源
echo -e "${CYAN}检查backend资源...${NC}"
if [ ! -d "resources/backend" ]; then
    echo -e "${YELLOW}未找到backend资源，正在复制...${NC}"
    mkdir -p "resources"
    cp -r "../backend" "resources/backend"
    
    # 清理不必要的文件
    rm -rf "resources/backend/.venv" 2>/dev/null || true
    rm -rf "resources/backend/build" 2>/dev/null || true
    rm -rf "resources/backend/dist" 2>/dev/null || true
    find "resources/backend" -name "*.pyc" -delete 2>/dev/null || true
    find "resources/backend" -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
fi
echo -e "${GREEN}✓ Backend资源检查完成${NC}"

# 执行构建
echo -e "${CYAN}开始Electron构建...${NC}"
BUILD_START=$(date +%s)

# 根据操作系统选择构建目标
OS=$(uname -s)
case "$OS" in
    Darwin*)
        echo -e "${CYAN}检测到macOS，构建DMG...${NC}"
        yarn build --mac
        BUILD_OUTPUT="dist/mac"
        APP_NAME="YoloTrainingVisualizationApp.app"
        ;;
    Linux*)
        echo -e "${CYAN}检测到Linux，构建AppImage...${NC}"
        yarn build --linux
        BUILD_OUTPUT="dist/linux-unpacked"
        APP_NAME="YoloTrainingVisualizationApp"
        ;;
    *)
        echo -e "${RED}不支持的操作系统: $OS${NC}"
        exit 1
        ;;
esac

BUILD_END=$(date +%s)
BUILD_TIME=$((BUILD_END - BUILD_START))

# 验证构建结果
echo -e "${CYAN}验证构建结果...${NC}"
if [ -d "$BUILD_OUTPUT" ]; then
    echo -e "${GREEN}✓ 应用程序构建成功${NC}"
    echo -e "${CYAN}  输出目录: $(pwd)/$BUILD_OUTPUT${NC}"
    
    if [ -f "$BUILD_OUTPUT/$APP_NAME" ] || [ -d "$BUILD_OUTPUT/$APP_NAME" ]; then
        echo -e "${CYAN}  应用程序: $APP_NAME${NC}"
    fi
else
    echo -e "${RED}构建失败: 输出目录不存在${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}=== 构建完成 ===${NC}"
echo -e "${GREEN}构建时间: ${BUILD_TIME} 秒${NC}"
echo -e "${GREEN}输出路径: $(pwd)/$BUILD_OUTPUT${NC}"
echo ""
echo -e "${CYAN}使用方法:${NC}"
case "$OS" in
    Darwin*)
        echo -e "${CYAN}  打开应用: open $BUILD_OUTPUT/$APP_NAME${NC}"
        ;;
    Linux*)
        echo -e "${CYAN}  运行应用: ./$BUILD_OUTPUT/$APP_NAME${NC}"
        ;;
esac
echo ""
