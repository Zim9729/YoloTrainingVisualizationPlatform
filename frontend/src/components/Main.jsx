import { useMemo, useEffect } from "react";
import hljs from 'highlight.js';

import Bottombar from "./Bottombar";

import HomePage from "../page/HomePage";
import DatasetPage from "../page/DatasetPage";
import TasksPage from "../page/TasksPage";
import TaskDetailedPage from "../page/TaskDetailedPage";
import ModelsPage from "../page/ModelsPage";
import TaskResultDetailedPage from "../page/TaskResultDetailedPage";

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
    };

    const PageComponent = PageComponentMap[pageType];

    return (
        <>
            {PageComponent ? (
                <>
                    <PageComponent key={pageUrl} setPageUrl={setPageUrl} parameter={parameter} />
                    <Bottombar setPageUrl={setPageUrl} />
                </>
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
