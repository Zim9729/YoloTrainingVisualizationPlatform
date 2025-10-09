import { useEffect, useState } from "react"

import Titlebar from "./components/Titlebar"
import Navbar from "./components/Navbar"
import Main from "./components/Main"
import { TaskProvider } from "./contexts/TaskContext"

import { api } from "./api"


function App() {
    const [pageUrl, setPageUrl] = useState("home");
    const [isDownloadHelperComponents, setIsDownloadHelperComponents] = useState(false);
    const [healthCheckAttempts, setHealthCheckAttempts] = useState(0);

    useEffect(() => {
        const checkBackendHealth = async () => {
            try {
                const data = await api.get("/", { params: {} });
                setIsDownloadHelperComponents(true);
                console.log("已下载助手组件", data);
            } catch (err) {
                console.error("健康检查失败:", err);
                
                // 最多重试3次
                if (healthCheckAttempts < 3) {
                    console.log(`健康检查重试 ${healthCheckAttempts + 1}/3`);
                    setTimeout(() => {
                        setHealthCheckAttempts(prev => prev + 1);
                    }, 2000);
                } else {
                    setIsDownloadHelperComponents(false);
                }
            }
        };

        checkBackendHealth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [healthCheckAttempts])

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
                            如您确信这是一个BUG，请点击下面的"反馈"按钮向我们提交issues。
                        </p>
                        <button className="btn sm" onClick={() => { window.open("https://github.com/chzane/YoloTrainingVisualizationPlatform/issues") }} style={{ marginRight: '7px' }}>反馈</button>
                        <button className="btn sm" onClick={() => { window.location.reload() }}>刷新页面</button>
                    </div>
                </div>
            ) : (
                <TaskProvider>
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
                </TaskProvider>
            )}
        </>
    )
}

export default App
