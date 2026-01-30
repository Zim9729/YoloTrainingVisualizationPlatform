import { useEffect, useState } from "react"

import Titlebar from "./components/Titlebar"
import Navbar from "./components/Navbar"
import Main from "./components/Main"
import { ApiErrorListener } from "./components/ApiErrorListener"
import { TaskProvider } from "./contexts/TaskContext"
import { ToastProvider } from "./contexts/ToastContext"
import { ConfirmProvider } from "./contexts/ConfirmContext"

import { api } from "./api"


function App() {
    const [pageUrl, setPageUrl] = useState("home");
    const [isBackendHealthy, setIsBackendHealthy] = useState(false);
    const [isCheckingHealth, setIsCheckingHealth] = useState(true);

    useEffect(() => {
        let isMounted = true;
        let retryCount = 0;
        const maxRetries = 3;
        const retryDelay = 2000;

        const checkBackendHealth = async () => {
            if (!isMounted) return;

            try {
                await api.get("/");

                if (isMounted) {
                    setIsBackendHealthy(true);
                    setIsCheckingHealth(false);
                    console.log("后端连接成功");
                }
            } catch (err) {
                console.error(`健康检查失败 (尝试 ${retryCount + 1}/${maxRetries + 1}):`, err);

                retryCount++;

                if (retryCount <= maxRetries && isMounted) {
                    console.log(`将在 ${retryDelay}ms 后重试...`);
                    setTimeout(() => {
                        checkBackendHealth();
                    }, retryDelay);
                } else if (isMounted) {
                    setIsBackendHealthy(false);
                    setIsCheckingHealth(false);
                    console.error("后端连接失败，已达到最大重试次数");
                }
            }
        };

        checkBackendHealth();

        // 清理函数
        return () => {
            isMounted = false;
        };
    }, [])

    return (
        <ToastProvider>
            <ApiErrorListener />
            <ConfirmProvider>
                <Titlebar />
                {isCheckingHealth ? (
                    <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <div className="card" style={{ marginTop: '15px' }}>
                            <h1 className="title">正在连接后端服务...</h1>
                            <p className="content">请稍候</p>
                        </div>
                    </div>
                ) : !isBackendHealthy ? (
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
            </ConfirmProvider>
        </ToastProvider>
    )
}

export default App

