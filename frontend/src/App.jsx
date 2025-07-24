import { useEffect, useState } from "react"

import Titlebar from "./components/Titlebar"
import Navbar from "./components/Navbar"
import Main from "./components/Main"

import { api } from "./api"


function App() {
    const [pageUrl, setPageUrl] = useState("home");
    const [isDownloadHelperComponents, setIsDownloadHelperComponents] = useState(false);

    useEffect(() => {
        api.get("/", { params: {} })
            .then(data => {
                setIsDownloadHelperComponents(true);
                console.log("已下载助手组件", data);
            })
            .catch(err => {
                setIsDownloadHelperComponents(false);
                console.error("未下载助手组件", err);
            });
    }, [])

    return (
        <>
            <Titlebar />
            {!isDownloadHelperComponents ? (
                <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div className="card" style={{ marginTop: '15px' }}>
                        <h1 className="title">未识别到训练助手组件</h1>
                        <p className="content">
                            请先启动助手组件，待终端有提示后再刷新本页面。
                            <br />
                            如您确信这是一个BUG，请点击下面的“反馈”按钮向我们提交issues。
                        </p>
                        <button className="btn sm" onClick={() => { window.open("https://github.com/chzane/YoloTrainingVisualizationPlatform/issues") }} style={{ marginRight: '7px' }}>反馈</button>
                        <button className="btn sm" onClick={() => { window.location.reload() }}>刷新页面</button>
                    </div>
                </div>
            ) : (
                <div className="app">
                    <Navbar
                        pageUrl={pageUrl}
                        setPageUrl={(type) => {
                            setPageUrl(type);
                        }}
                    />
                    <Main
                        pageUrl={pageUrl}
                        setPageUrl={(type) => {
                            setPageUrl(type);
                        }}
                    />
                </div>
            )}
        </>
    )
}

export default App
