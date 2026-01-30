import { lazy, Suspense } from 'react';
import { createBrowserRouter, Outlet } from 'react-router-dom';
import RootLayout from './components/RootLayout';

// 懒加载页面组件
const HomePage = lazy(() => import('./page/HomePage'));
const DatasetPage = lazy(() => import('./page/DatasetPage'));
const TasksPage = lazy(() => import('./page/TasksPage'));
const TaskDetailedPage = lazy(() => import('./page/TaskDetailedPage'));
const TaskResultDetailedPage = lazy(() => import('./page/TaskResultDetailedPage'));
const ModelsPage = lazy(() => import('./page/ModelsPage'));
const ModelTestPage = lazy(() => import('./page/ModelTestPage'));
const ModelExportPage = lazy(() => import('./page/ModelExportPage'));
const LabelStudioImportPage = lazy(() => import('./page/LabelStudioImportPage'));
const ServicesPage = lazy(() => import('./page/ServicesPage'));
const TcpImageProcessorPage = lazy(() => import('./page/TcpImageProcessorPage'));
const TritonRepoPage = lazy(() => import('./page/TritonRepoPage'));
const SettingsPage = lazy(() => import('./page/SettingsPage'));

// 页面加载占位组件
function PageLoader() {
    return (
        <div className="main" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
            <div className="loading-state">
                <div className="spinner"></div>
                <span style={{ marginTop: '12px', color: 'var(--secondary-text-color)' }}>加载中...</span>
            </div>
        </div>
    );
}

// 包装懒加载组件
function withSuspense(Component) {
    return (
        <Suspense fallback={<PageLoader />}>
            <Component />
        </Suspense>
    );
}

// 路由配置
export const router = createBrowserRouter([
    {
        path: '/',
        element: <RootLayout />,
        children: [
            {
                index: true,
                element: withSuspense(HomePage),
            },
            {
                path: 'dataset',
                element: withSuspense(DatasetPage),
            },
            {
                path: 'tasks',
                element: withSuspense(TasksPage),
            },
            {
                path: 'tasks/:filename',
                element: withSuspense(TaskDetailedPage),
            },
            {
                path: 'results/:taskId',
                element: withSuspense(TaskResultDetailedPage),
            },
            {
                path: 'models',
                element: withSuspense(ModelsPage),
            },
            {
                path: 'models/test',
                element: withSuspense(ModelTestPage),
            },
            {
                path: 'models/export',
                element: withSuspense(ModelExportPage),
            },
            {
                path: 'import/label-studio',
                element: withSuspense(LabelStudioImportPage),
            },
            {
                path: 'services',
                element: withSuspense(ServicesPage),
            },
            {
                path: 'services/tcp-processor',
                element: withSuspense(TcpImageProcessorPage),
            },
            {
                path: 'triton',
                element: withSuspense(TritonRepoPage),
            },
            {
                path: 'settings',
                element: withSuspense(SettingsPage),
            },
            {
                // 404 处理
                path: '*',
                element: (
                    <div className="main">
                        <h1 style={{ marginBottom: '-13px' }}>404</h1>
                        <p>找不到请求的页面</p>
                        <a href="/">返回首页</a>
                    </div>
                ),
            },
        ],
    },
]);
