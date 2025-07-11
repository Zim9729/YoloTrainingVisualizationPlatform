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
            {!isDownloadHelperComponents &&
                <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div className="card" style={{ marginTop: '15px' }}>
                        <h1 className="title">未识别到训练助手组件</h1>
                        <p className="content">
                            Yolo Training Visualization Platform 依赖于训练助手组件。<br />如未安装，请点击下方按钮下载助手组件，如已安装，请启动助手组件程序，并刷新页面。
                        </p>
                        <button className="btn sm" onClick={() => { alert("下载未授权") }} style={{ marginRight: '7px' }}>下载助手组件</button>
                        <button className="btn sm" onClick={() => { window.location.reload() }}>刷新页面</button>
                    </div>
                </div>
            }
            {isDownloadHelperComponents &&
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
            }
        </>
    )
}

export default App
