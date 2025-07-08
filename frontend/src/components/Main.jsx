import { useState, useEffect } from "react"
import hljs from 'highlight.js';

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
            console.log(1)
            setPageType(page_url)
            setParameter({})
        }
    }, [page_url])

    switch (pageType) {
        case "home":
            return (
                <div className="main">
                    <h1 style={{ marginBottom: '-13px' }}>👋 欢迎</h1>
                    <p>快速开始训练 Yolo 模型</p>
                    <div className="card-group" style={{ marginTop: '10px' }}>
                        <div className="card">
                            <div className="tag">1</div>
                            <h1 className="title">上传数据集</h1>
                            <p className="content">支持 YOLO 格式的数据集，系统会自动解析标注信息并生成预览。</p>
                            <button className="btn sm" onClick={() => { setPageUrl("dataset?type=uploadDataset") }}>上传数据集</button>
                        </div>
                        <div className="card">
                            <div className="tag">2</div>
                            <h1 className="title">配置训练任务</h1>
                            <p className="content">选择基础模型，并设置 epoch、batch size、图像尺寸等参数，无需编码，即可轻松完成配置。</p>
                            <button className="btn sm" onClick={() => { setPageUrl("tasks?type=newTask") }}>创建训练任务</button>
                        </div>
                        <div className="card">
                            <div className="tag">3</div>
                            <h1 className="title">一键启动模型训练</h1>
                            <p className="content">点击“开始训练”，系统将在后台自动调度任务，实时跟踪训练进度。</p>
                        </div>
                        <div className="card">
                            <div className="tag">4</div>
                            <h1 className="title">下载模型并测试</h1>
                            <p className="content">训练完成后可一键下载模型文件，同时可查看模型在验证集上的预测结果。</p>
                            <button className="btn sm" onClick={() => { setPageUrl("tasks?type=myTask") }}>查看我的任务</button>
                        </div>
                    </div>
                    <div className="card" style={{ marginTop: '15px' }}>
                        <h1 className="title">未识别到训练助手组件</h1>
                        <p className="content">
                            Yolo Training Visualization Platform 依赖于训练助手组件，请点击下方按钮下载助手组件。
                        </p>
                        <button className="btn sm" onClick={() => { alert("下载未授权") }}>下载助手组件</button>
                    </div>
                </div>
            );
        case "dataset":
            return (
                <div className="main">
                    <p>{JSON.stringify(parameter || {}, null, 2)}</p>
                </div>
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