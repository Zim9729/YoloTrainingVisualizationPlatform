# 前端子项目（React + Vite）

本目录 `frontend/` 为计算机视觉模型可视化训练平台的前端工程，基于 React 19 与 Vite 7 构建。

## 快速开始

1) 安装依赖

```bash
yarn
```

2) 开发启动

```bash
yarn dev
```

3) 生产构建与预览

```bash
yarn build
yarn preview
```

## 环境变量

后端 API 地址通过 Vite 环境变量配置：

- `VITE_API_BASE_URL`（必填，开发环境默认为 `http://localhost:10799`）

你可以在以下文件中设置：

- `.env.development`
- `.env.production`

也可通过命令行临时覆盖：

```bash
VITE_API_BASE_URL=http://127.0.0.1:10799 yarn dev
```

相关读取逻辑见：`src/config.js`。

## 目录结构

```
frontend/
├─ index.html
├─ vite.config.js           # 启用 @vitejs/plugin-react 与 vite-plugin-prismjs
├─ package.json
├─ .env.development         # 开发环境变量（VITE_API_BASE_URL）
├─ .env.production          # 生产环境变量（VITE_API_BASE_URL）
└─ src/
   ├─ main.jsx              # 入口
   ├─ App.jsx               # 根组件（内部 pageUrl 伪路由）
   ├─ api.js                # API 封装（支持 AbortController）
   ├─ config.js             # 配置与常量（读取 VITE_API_BASE_URL）
   ├─ page/
   │  └─ ModelTestPage.jsx  # 测试/验证记录展示、图片懒加载与中止
   └─ components/           # UI 组件（日志面板、表单等）
```

## 代码高亮（Prism）

本项目使用 `vite-plugin-prismjs` 以启用 Prism 代码高亮（`yaml`、`css` 和 `line-numbers` 插件），配置见 `vite.config.js`。

如需扩展其他语言或主题，调整：

```js
import prismjs from 'vite-plugin-prismjs'

export default defineConfig({
  plugins: [
    prismjs({ languages: ['yaml', 'css'], plugins: ['line-numbers'], theme: 'twilight', css: true })
  ]
})
```

## 质量与规范

- ESLint：见 `eslint.config.js`（含 react-hooks 规则）
- 建议：引入 Prettier、TypeScript（按需）

## 与后端的交互

- 默认后端地址：`VITE_API_BASE_URL`
- 图片结果采用接口返回 base64 字符串，前端组件 `TestResultImage` 与 `ValResultImage`：
  - 使用 `AbortController` 防止组件卸载后继续 `setState`
  - 增加 `loading="lazy"` 优化性能
  - 失败状态有提示

## 常见问题

- 跨域：推荐通过后端允许 CORS 或在 Vite dev server 配置 `server.proxy`。
- 图片无法显示：检查后端是否返回 `data.type === 'image'` 且 `data.base64` 有效，或查看前端 Network/Console 日志。
