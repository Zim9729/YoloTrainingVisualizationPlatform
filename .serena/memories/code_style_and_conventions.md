# 代码风格和规范

## Python 后端规范

### 代码风格
- **函数注释**: 使用简洁的 docstring (单行或多行)
- **命名规范**:
  - 函数: `snake_case` (如: `get_dataset_path()`)
  - 类: `PascalCase` (如: `ProcessingRecord`)
  - 常量: `UPPER_SNAKE_CASE` (如: `DATASET_PATH`)
  - 私有变量: 无强制下划线前缀，但内部函数可使用
- **导入顺序**:
  1. 标准库导入
  2. 第三方库导入
  3. 本地模块导入
- **字符串**: 混用单引号和双引号，优先使用双引号
- **编码**: UTF-8 (文件头通常不显式声明)

### 文件结构
```python
# 1. 导入
import os
import sys
from flask import Blueprint, request
from tools.format_output import format_output

# 2. 全局变量/配置
tcp_client = None

# 3. 辅助函数
def get_tcp_client():
    pass

# 4. 路由函数
@blueprint.route('/endpoint', methods=['GET', 'POST'])
def endpoint_handler():
    pass
```

### API 返回规范
所有 API 必须使用统一的返回格式：
```python
from tools.format_output import format_output

# 成功
return format_output(data={...}, msg="操作成功")

# 失败
return format_output(code=400, msg="错误信息")
```

### 蓝图模块规范
每个功能模块 (如 IDataset, ITraining) 都是一个 Flask Blueprint:
- **文件**: `routes.py` - 定义路由
- **目录结构**:
  ```
  IModuleName/
  ├── __init__.py
  ├── routes.py       # 路由定义
  ├── handlers.py     # 业务逻辑 (可选)
  └── models.py       # 数据模型 (可选)
  ```

### 异常处理
```python
try:
    # 业务逻辑
    result = process_data()
    return format_output(data=result)
except Exception as e:
    return format_output(code=500, msg=f"操作失败: {str(e)}")
```

### 日志规范
- 使用 Python `logging` 模块
- 格式: `[时间] 消息内容`
- 示例: `logger.info("开始任务: task_001")`
- 日志级别: INFO, WARNING, ERROR, EXCEPTION

### 配置管理
- 所有配置集中在 `backend/config.py`
- 使用环境变量覆盖默认值
- 配置函数命名: `get_*_path()` 或 `get_*_config()`

## JavaScript/React 前端规范

### 代码风格
- **组件命名**: `PascalCase` (如: `HomePage`, `Navbar`)
- **函数命名**: `camelCase` (如: `handleSubmit`, `fetchData`)
- **常量命名**: `UPPER_SNAKE_CASE` (如: `API_BASE_URL`)
- **文件命名**: 
  - 组件: `ComponentName.jsx`
  - 工具: `fileName.js`
- **引号**: 混用单引号和双引号
- **分号**: 不强制使用

### 组件结构
```jsx
// 1. 导入
import { useState, useEffect } from "react"
import { api } from "../api"

// 2. 组件定义
function ComponentName({ prop1, prop2 }) {
    // 3. State 声明
    const [data, setData] = useState(null)
    
    // 4. Effect hooks
    useEffect(() => {
        // 初始化逻辑
    }, [])
    
    // 5. 事件处理函数
    const handleClick = () => {
        // 处理逻辑
    }
    
    // 6. 渲染
    return (
        <div>
            {/* JSX */}
        </div>
    )
}

// 7. 导出
export default ComponentName
```

### API 调用规范
```javascript
import { api } from "./api"

// GET 请求
const data = await api.get("/endpoint", { params: { key: value } })

// POST 请求
const result = await api.post("/endpoint", { body: { key: value } })

// 文件上传
const response = await api.upload("/endpoint", file, { key: value })
```

### 错误处理
```javascript
try {
    const data = await api.get("/endpoint")
    // 处理数据
} catch (err) {
    console.error("错误:", err)
    // 显示错误消息
}
```

### 状态管理
- 使用 React Context API (`TaskContext`)
- 本地状态: `useState`
- 副作用: `useEffect`
- 不使用 Redux 或其他状态管理库

### 样式规范
- 使用原生 CSS 文件
- CSS 文件位置: `frontend/src/assets/style/`
- 组件内联样式: 使用 `style` 属性
- 类名: 使用 `className` 属性

## 项目通用规范

### Git 提交规范
- 提交信息使用中文或英文
- 格式: `[类型] 简短描述`
- 类型: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### 文档规范
- README 使用 Markdown
- 中英文双语支持 (README.md + README_en.md)
- 包含截图和示例

### 目录命名
- 后端模块: `IModuleName` (首字母大写 I)
- 前端页面: `page/`
- 前端组件: `components/`
- 静态资源: `assets/`

### 注释规范
- Python: 使用 docstring
- JavaScript: 使用 `//` 单行注释或 `/* */` 多行注释
- 注释语言: 中文 (项目团队使用中文)

## 依赖管理

### Python
- 依赖文件: `requirements.txt`
- 包管理器: `pip` + `uv`
- 安装命令: `uv pip install -r requirements.txt`

### Node.js
- 依赖文件: `package.json`
- 包管理器: `yarn` (推荐) 或 `npm`
- 安装命令: `yarn install`

## 版本控制

### 版本号格式
- 遵循 Semantic Versioning (语义化版本)
- 格式: `MAJOR.MINOR.PATCH`
- 当前版本: `1.0.0`

### 版本同步
- 后端版本: `GET /info` 返回
- 前端检查: `SUPPORTED_BACKEND_VERSIONS` 配置
- App 版本: `app/package.json` 中的 `version` 字段