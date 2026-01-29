---
name: frontend-refactor
description: 专门用于重构和美化前后端分离项目的前端界面。包括UI/UX改进、代码优化、性能提升、现代化框架迁移和响应式设计。
---

# 前端重构美化 Skill

## 核心功能

### UI/UX 美化
- 现代化设计系统应用
- 色彩方案和主题优化
- 组件样式统一化
- 交互动效和微交互
- 响应式设计改进

### 代码重构
- 组件架构优化
- 代码规范化和标准化
- 状态管理优化
- 路由结构改进
- API 集成优化

### 性能优化
- 代码分割和懒加载
- 资源优化和压缩
- 缓存策略改进
- 首屏加载优化
- 运行时性能提升

### 现代化迁移
- 旧版本框架升级
- 新技术栈集成
- TypeScript 迁移
- 构建工具优化
- 开发体验改进

## 重构流程

### 1. 项目分析阶段
```javascript
// 评估当前技术栈
const techStack = {
  framework: 'React/Vue/Angular',
  version: 'x.x.x',
  uiLibrary: 'Ant Design/Element UI/Material-UI',
  stateManagement: 'Redux/Vuex/MobX',
  buildTool: 'Webpack/Vite'
}

// 识别问题点
const issues = [
  '组件耦合度高',
  '样式不一致',
  '性能瓶颈',
  '可访问性问题'
]
```

### 2. 设计系统建立
```css
/* 设计令牌 */
:root {
  --primary-color: #1890ff;
  --secondary-color: #52c41a;
  --success-color: #52c41a;
  --warning-color: #faad14;
  --error-color: #f5222d;
  --text-primary: #262626;
  --text-secondary: #595959;
  --border-color: #d9d9d9;
  --border-radius: 6px;
  --box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
```

### 3. 组件重构
```jsx
// 重构前
const OldComponent = () => {
  return (
    <div className="old-component">
      <div className="header">标题</div>
      <div className="content">内容</div>
    </div>
  );
};

// 重构后
const ModernComponent = ({ title, children, actions }) => {
  return (
    <Card 
      className="modern-component"
      title={title}
      extra={actions}
      bordered={false}
      hoverable
    >
      {children}
    </Card>
  );
};
```

## 常见重构场景

### 场景 1：传统管理系统美化
```
用户：我有一个传统的后台管理系统，界面比较老旧，想要美化一下
Claude：我来帮你进行现代化改造。首先我会分析当前的技术栈和UI结构，然后应用现代设计系统，优化组件结构和交互体验...
```

### 场景 2：移动端适配优化
```
用户：我的PC端网站在移动端显示效果不好，需要做响应式改造
Claude：我会为你进行全面的响应式重构，包括弹性布局、媒体查询、触摸优化和移动端特有功能...
```

### 场景 3：性能优化重构
```
用户：网站加载速度慢，用户反馈体验不好
Claude：我来帮你进行性能优化重构，包括代码分割、资源优化、缓存策略和首屏加载优化...
```

### 场景 4：技术栈升级
```
用户：项目还在用 React 16，想要升级到最新版本并引入 TypeScript
Claude：我会为你制定渐进式升级方案，确保平滑过渡到新版本并添加类型安全...
```

## 技术栈支持

### 前端框架
- **React 18+**: Hooks、Concurrent Features
- **Vue 3+**: Composition API、TypeScript 支持
- **Angular 15+**: Standalone Components、Signals

### UI 组件库
- **Ant Design 5+**: 设计系统、主题定制
- **Material-UI (MUI) 5+**: Emotion、主题系统
- **Chakra UI**: 简洁现代的组件库
- **Tailwind CSS**: 原子化 CSS 框架

### 状态管理
- **Redux Toolkit**: 现代化 Redux
- **Zustand**: 轻量级状态管理
- **Pinia**: Vue 3 推荐状态管理

### 构建工具
- **Vite**: 快速构建工具
- **Webpack 5**: 模块联邦、缓存优化
- **Next.js**: React 全栈框架

## 重构最佳实践

### 1. 渐进式重构
- 不要一次性重构整个项目
- 先重构核心页面和组件
- 逐步迁移到新技术栈
- 保持向后兼容性

### 2. 设计系统优先
- 建立统一的设计令牌
- 创建可复用的组件库
- 制定代码规范和最佳实践
- 确保品牌一致性

### 3. 性能导向
- 优先解决性能瓶颈
- 实施代码分割和懒加载
- 优化资源加载策略
- 监控和测量性能指标

### 4. 用户体验为中心
- 关注可访问性 (a11y)
- 优化交互反馈
- 减少用户认知负担
- 提供流畅的动画效果

## 代码示例

### 现代化组件结构
```jsx
// 使用现代 React 模式
import { useState, useCallback, useMemo } from 'react';
import { Button, Card, Space, Typography } from 'antd';
import styled from '@emotion/styled';

const StyledCard = styled(Card)`
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }
`;

const ModernComponent = ({ data, onEdit, onDelete }) => {
  const [loading, setLoading] = useState(false);
  
  const handleEdit = useCallback(async () => {
    setLoading(true);
    try {
      await onEdit();
    } finally {
      setLoading(false);
    }
  }, [onEdit]);
  
  const actions = useMemo(() => (
    <Space>
      <Button type="primary" onClick={handleEdit} loading={loading}>
        编辑
      </Button>
      <Button danger onClick={onDelete}>
        删除
      </Button>
    </Space>
  ), [handleEdit, loading, onDelete]);
  
  return (
    <StyledCard
      title={data.title}
      extra={actions}
      bordered={false}
    >
      <Typography.Paragraph>
        {data.description}
      </Typography.Paragraph>
    </StyledCard>
  );
};

export default ModernComponent;
```

### 响应式布局
```css
/* 移动优先的响应式设计 */
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
}

@media (min-width: 768px) {
  .container {
    padding: 0 24px;
  }
}

@media (min-width: 1024px) {
  .container {
    padding: 0 32px;
  }
}

.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

@media (min-width: 768px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

## 质量保证

### 代码质量
- ESLint + Prettier 代码规范
- TypeScript 类型检查
- 单元测试和集成测试
- 代码审查流程

### 性能监控
- Lighthouse 性能评分
- Core Web Vitals 监控
- 错误追踪和日志
- 用户行为分析

### 可访问性
- WCAG 2.1 AA 标准
- 键盘导航支持
- 屏幕阅读器兼容
- 色彩对比度检查

## 注意事项

- 重构前做好代码备份
- 制定详细的测试计划
- 与团队保持沟通协调
- 考虑SEO和可访问性要求
- 重视用户反馈和体验数据
