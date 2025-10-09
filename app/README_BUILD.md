# Electron构建自动化脚本使用指南

本项目提供了多种自动化构建脚本，用于解决Windows环境下Electron构建时的常见问题。

## 🚀 快速开始

### Windows用户（推荐）

#### 方法1：使用PowerShell脚本（功能最全）
```powershell
# 普通构建
yarn build:fix

# 清理后构建
yarn build:clean

# 或直接运行脚本
.\build-fix.ps1
```

#### 方法2：使用批处理脚本（简单快速）
```cmd
# 双击运行或命令行执行
.\build.bat
```

### Linux/macOS用户

```bash
# 给脚本执行权限
chmod +x build.sh

# 运行构建
./build.sh
```

## 📋 脚本功能对比

| 脚本 | 平台 | 功能 | 推荐度 |
|------|------|------|--------|
| `build-fix.ps1` | Windows | 完整构建+自动修复+详细日志 | ⭐⭐⭐⭐⭐ |
| `build.bat` | Windows | 简单构建+基本修复 | ⭐⭐⭐⭐ |
| `build.sh` | Linux/macOS | 跨平台构建 | ⭐⭐⭐⭐ |

## 🔧 PowerShell脚本详细功能

### 基本用法
```powershell
# 标准构建
.\build-fix.ps1

# 清理后构建
.\build-fix.ps1 -Clean

# 详细输出
.\build-fix.ps1 -Verbose
```

### 自动修复功能
- ✅ 自动检测并修复缺失的 `electron.exe`
- ✅ 自动复制Electron运行时文件
- ✅ 自动重命名为目标应用程序名称
- ✅ 清理不必要的Python缓存文件
- ✅ 验证构建结果完整性

### 错误处理
- 🔍 详细的错误信息和堆栈跟踪
- 💡 自动故障排除建议
- 📊 构建时间统计
- 🎨 彩色输出便于识别

## 🐛 常见问题解决

### 问题1：PowerShell执行策略限制
```powershell
# 临时允许脚本执行
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process

# 或使用yarn命令（已配置）
yarn build:fix
```

### 问题2：防病毒软件干扰
1. 将项目文件夹添加到Windows Defender排除列表
2. 或临时禁用实时保护：
```powershell
# 管理员权限运行
Set-MpPreference -DisableRealtimeMonitoring $true
# 构建完成后重新启用
Set-MpPreference -DisableRealtimeMonitoring $false
```

### 问题3：构建失败
脚本会自动尝试修复，如果仍然失败：
1. 检查yarn和node版本
2. 删除`node_modules`重新安装
3. 检查磁盘空间
4. 以管理员身份运行

## 📦 构建输出

成功构建后，应用程序位于：
```
app/dist/win-unpacked/
├── YoloTrainingVisualizationApp.exe  # 主程序
├── resources/                        # 应用资源
│   ├── app.asar                     # 应用代码
│   └── backend/                     # Python后端
├── locales/                         # 本地化文件
└── [其他Electron运行时文件]
```

## 🚀 分发应用

### 便携版分发
直接压缩整个 `dist/win-unpacked` 文件夹即可分发。

### 安装包制作
如需制作安装包，修改 `package.json`：
```json
"win": {
  "target": "nsis",  // 改回nsis
  "requestedExecutionLevel": "asInvoker"
}
```

## 🔄 自动化集成

### GitHub Actions示例
```yaml
- name: Build Electron App
  run: |
    cd app
    yarn install
    yarn build:fix
```

### 本地开发流程
```bash
# 开发模式
yarn dev

# 构建测试
yarn build:fix

# 清理重建
yarn build:clean
```

## 📝 日志和调试

PowerShell脚本提供详细的构建日志：
- 🟢 成功操作（绿色）
- 🟡 警告信息（黄色）
- 🔴 错误信息（红色）
- 🔵 信息提示（蓝色）

## 🤝 贡献

如果你发现构建问题或有改进建议，请：
1. 检查现有的issue
2. 提供详细的错误信息
3. 包含系统环境信息

---

**注意**: 这些脚本专门为解决Windows环境下的Electron构建问题而设计，特别是防病毒软件导致的文件删除问题。
