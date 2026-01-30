import { useMemo, useEffect, lazy, Suspense } from "react";
import hljs from 'highlight.js';

import Bottombar from "./Bottombar";

// 懒加载页面组件 - 代码分割
const HomePage = lazy(() => import("../page/HomePage"));
const DatasetPage = lazy(() => import("../page/DatasetPage"));
const TasksPage = lazy(() => import("../page/TasksPage"));
const TaskDetailedPage = lazy(() => import("../page/TaskDetailedPage"));
const ModelsPage = lazy(() => import("../page/ModelsPage"));
const TaskResultDetailedPage = lazy(() => import("../page/TaskResultDetailedPage"));
const ModelTestPage = lazy(() => import("../page/ModelTestPage"));
const LabelStudioImportPage = lazy(() => import("../page/LabelStudioImportPage"));
const ModelExportPage = lazy(() => import("../page/ModelExportPage"));
const SettingsPage = lazy(() => import("../page/SettingsPage"));
const TritonRepoPage = lazy(() => import("../page/TritonRepoPage"));
const ServicesPage = lazy(() => import("../page/ServicesPage"));
const TcpImageProcessorPage = lazy(() => import("../page/TcpImageProcessorPage"));

// 页面加载中的占位组件
function PageLoadingFallback() {
    return (
        <div className="main" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
            <div className="loading-state">
                <div className="spinner"></div>
                <span style={{ marginTop: '12px', color: 'var(--secondary-text-color)' }}>加载中...</span>
            </div>
        </div>
    );
}

function Main({ pageUrl = "home", setPageUrl }) {
    // 识别页面类型并提取参数
    const { pageType, parameter } = useMemo(() => {
        if (pageUrl.includes("?")) {
            const [type, queryString] = pageUrl.split("?");
            const params = {};

            queryString.split("&").forEach((param) => {
                const [key, value] = param.split("=");
                if (key) params[key] = decodeURIComponent(value || "");
            });

            return { pageType: type, parameter: params };
        }
        return { pageType: pageUrl, parameter: {} };
    }, [pageUrl]);

    // highlight 高亮初始化
    useEffect(() => {
        hljs.highlightAll();
    }, [pageType, parameter]);

    // 页面映射表
    const PageComponentMap = {
        home: HomePage,
        dataset: DatasetPage,
        tasks: TasksPage,
        tasksDetailed: TaskDetailedPage,
        models: ModelsPage,
        taskResultDetailed: TaskResultDetailedPage,
        modelTest: ModelTestPage,
        labelStudioImport: LabelStudioImportPage,
        modelExport: ModelExportPage,
        settings: SettingsPage,
        tritonRepo: TritonRepoPage,
        services: ServicesPage,
        'services/tcp-image-processor': TcpImageProcessorPage,
    };

    const PageComponent = PageComponentMap[pageType];

    return (
        <>
            {PageComponent ? (
                <Suspense fallback={<PageLoadingFallback />}>
                    <PageComponent key={pageUrl} setPageUrl={setPageUrl} parameter={parameter} />
                    <Bottombar setPageUrl={setPageUrl} />
                </Suspense>
            ) : (
                <div className="main">
                    <h1 style={{ marginBottom: '-13px' }}>ERROR</h1>
                    <p>找不到请求的资源</p>
                    <pre>
                        <code className="language-bash hljs">
                            {`PageID: ${pageType}\nParameter: ${JSON.stringify(parameter, null, 2)}`}
                        </code>
                    </pre>
                </div>
            )}
        </>
    );
}

export default Main;

