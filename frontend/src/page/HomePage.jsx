import { useState, useEffect } from "react";
import { api } from "../api";

import BACKGROUND_IMAGE from "@/assets/background_3.png";
import Icon_rocket_takeoff from "../assets/icons/rocket-takeoff-fill.svg";

function HomePage({ setPageUrl, parameter }) {
    const [runningTasksList, setRunningTasksList] = useState([]);

    useEffect(() => {
        api.get("/ITraining/getAllRunningTasks", { params: {} })
            .then(data => {
                console.log("获取正在运行的训练任务:", data.data.tasks);
                setRunningTasksList(data.data.tasks);
            })
            .catch(err => {
                console.error("获取正在运行的训练任务失败:", err);
                alert(err);
            });
    }, [])

    return (
        <div className="main">
            <div className="banner" style={{
                backgroundImage: `url(${BACKGROUND_IMAGE})`,
                backgroundSize: 'cover',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
            }}>
                <h1 className="page-title">👋 欢迎</h1>
            </div>

            <div>
                <h1 className="home-page-title">快速开始</h1>
                <div className="card-group" style={{ marginTop: '20px' }}>
                    <div className="card b-transform">
                        <div className="top-tag">1</div>
                        <h1 className="title">导入/上传数据集</h1>
                        <p className="content">支持上传 YOLO / COCO 压缩包，或从 Label Studio 连接项目并一键构建 YOLO 数据集。</p>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                            <button className="btn sm" onClick={() => { setPageUrl("dataset?type=uploadDataset") }}>上传压缩包</button>
                            <button className="btn sm" onClick={() => { setPageUrl("labelStudioImport") }}>从 Label Studio 导入</button>
                        </div>
                    </div>
                    <div className="card b-transform pointer" onClick={() => { setPageUrl("tasks?type=newTask") }}>
                        <div className="top-tag">2</div>
                        <h1 className="title">创建训练任务</h1>
                        <p className="content">选择基础模型，并设置 epoch、batch size、图像尺寸等参数，无需编码，即可轻松完成配置。</p>
                    </div>
                    <div className="card b-transform pointer" onClick={() => { setPageUrl("tasks") }}>
                        <div className="top-tag">3</div>
                        <h1 className="title">启动模型训练</h1>
                        <p className="content">点击“开始训练”，系统将在后台自动调度任务，实时跟踪训练进度。</p>
                    </div>
                    <div className="card b-transform pointer" onClick={() => { setPageUrl("models?type=trained") }}>
                        <div className="top-tag">4</div>
                        <h1 className="title">下载模型并测试</h1>
                        <p className="content">训练完成后可一键下载模型文件，同时可查看模型在验证集上的预测结果。</p>
                    </div>
                </div>

                <div style={{ marginTop: '40px' }}>
                    <h1 className="home-page-title">进行中的训练</h1>
                    {runningTasksList.length <= 0 ? (
                        <span style={{ color: 'var(--secondary-text-color)' }}>空空如也</span>
                    ) : (
                        <div className="list-card-group">
                            {runningTasksList.map((item, index) => (
                                <div key={`runningTaskList_${index}`} className="list-card" style={{ wordBreak: 'break-all' }} onClick={() => setPageUrl(`tasksDetailed?filename=${item.filename}`)}>
                                    <span style={{ fontSize: '18px', fontWeight: 'bold', marginRight: '4px' }}>
                                        {item.taskname}
                                    </span>
                                    <span style={{ fontSize: '14px' }}>
                                        #{item.task_id}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default HomePage;