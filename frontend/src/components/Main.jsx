import { useState, useEffect } from "react"
import hljs from 'highlight.js';

import HomePage from "../page/HomePage";
import DatasetPage from "../page/DatasetPage";

function Main({ page_url = "home", setPageUrl }) {
    const [pageType, setPageType] = useState("")
    const [parameter, setParameter] = useState({})

    useEffect(() => {
        hljs.highlightAll()

        if (page_url.includes("?")) {
            const [type, queryString] = page_url.split("?")
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
            setPageType(page_url)
            setParameter({})
        }
    }, [page_url])

    switch (pageType) {
        case "home":
            return (
                <HomePage setPageUrl={setPageUrl} parameter={parameter} />
            );
        case "dataset":
            return (
                <DatasetPage setPageUrl={setPageUrl} parameter={parameter} />
            );
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