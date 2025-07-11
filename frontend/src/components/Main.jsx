import { useState, useEffect } from "react"
import hljs from 'highlight.js';

import Bottombar from "./Bottombar";

import HomePage from "../page/HomePage";
import DatasetPage from "../page/DatasetPage";
import TasksPage from "../page/TasksPage";
import TaskDetailedPage from "../page/TaskDetailedPage";

function Main({ pageUrl = "home", setPageUrl }) {
    const [pageType, setPageType] = useState("");
    const [parameter, setParameter] = useState({});

    useEffect(() => {
        hljs.highlightAll();

        if (pageUrl.includes("?")) {
            const [type, queryString] = pageUrl.split("?")
            setPageType(type)

            const params = {}
            if (queryString) {
                queryString.split("&").forEach((param) => {
                    const [key, value] = param.split("=")
                    if (key) {
                        params[key] = decodeURIComponent(value || "")
                    }
                })
            }
            setParameter(params)
        } else {
            setPageType(pageUrl)
            setParameter({})
        }
    }, [pageUrl]);

    switch (pageType) {
        case "home":
            return (
                <>
                    <HomePage setPageUrl={setPageUrl} parameter={parameter} />
                    <Bottombar setPageUrl={setPageUrl} />
                </>
            );
        case "dataset":
            return (
                <>
                    <DatasetPage setPageUrl={setPageUrl} parameter={parameter} />
                    <Bottombar setPageUrl={setPageUrl} />
                </>
            );
        case "tasks":
            return (
                <>
                    <TasksPage setPageUrl={setPageUrl} parameter={parameter} />
                    <Bottombar setPageUrl={setPageUrl} />
                </>
            );
        case "tasksDetailed":
            return (
                <>
                    <TaskDetailedPage setPageUrl={setPageUrl} parameter={parameter} />
                    <Bottombar setPageUrl={setPageUrl} />
                </>
            )
        default:
            return (
                <div className="main">
                    <h1 style={{ marginBottom: '-13px' }}>ERROR</h1>
                    <p>找不到请求的资源</p>
                    <pre>
                        <code className="language-bash hljs">
                            {`PageID: ${pageType}\nParameter: ${JSON.stringify(parameter || {}, null, 2)}`}
                        </code>
                    </pre>
                </div>
            );
    }
}

export default Main;