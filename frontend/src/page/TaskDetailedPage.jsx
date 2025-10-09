import { useState, useEffect } from "react";
import { api } from "../api";
import { splitPath } from "../tools";
import { useRunningTasks } from "../contexts/TaskContext";
import confetti from 'canvas-confetti';
import yaml from 'js-yaml';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';

import TerminalViewer from "../components/TerminalViewer";

import Icon_Info_circle_fill from "../assets/icons/info-circle-fill.svg";
import Icon_Terminal_fill from "../assets/icons/terminal-fill.svg";

function TaskDetailedPage({ setPageUrl, parameter }) {
    const [taskData, setTaskData] = useState({});
    const [taskHistory, setTaskHistory] = useState([]);
    const [infoCardShowDetails, setInfoCardShowDetails] = useState([]);
    const [isRunning, setIsRunning] = useState(false);
    const [trainingCompleted, setTrainingCompleted] = useState(false);
    const [basicInfo, setBasicInfo] = useState([]);
    const [modelInfo, setModelInfo] = useState([]);

    const [showLastLog, setShowLastLog] = useState(false);
    const [lastLog, setLastLog] = useState("");

    const [showModelInfoCardDetails, setShowModelInfoCardDetails] = useState([]);
    
    const { isTaskRunning, refreshRunningTasks } = useRunningTasks();

    const startTask = (filename, taskname, taskID) => {
        if (confirm("真的要开始训练该任务吗？")) {
            console.log("开始训练任务: " + filename + " " + taskname);
            const data = {
                taskID: taskID,
                filename: filename,
                taskname: taskname
            };

            api.post("/ITraining/startTask", { data: data, params: {} })
                .then(data => {
                    if (data.code === 200) {
                        setTrainingCompleted(false);
                        setIsRunning(true);
                        refreshRunningTasks(); // 刷新运行任务列表
                    } else {
                        alert(data.msg);
                    }
                })
                .catch(err => {
                    console.error("训练任务失败:", err);
                    alert(err);
                });
        } else {
            console.log("用户取消开始训练操作");
        }
    }

    useEffect(() => {
        // 获取任务数据
        api.get("/ITraining/getTask", {
            params: {
                filename: parameter.filename
            }
        })
            .then(data => {
                if (data.code === 200) {
                    setTaskData(data.data);
                }
            })
            .catch(err => {
                console.error("获取任务信息失败: ", err);
                alert(err);
            });

        // 使用 Context 中的状态检查是否运行中
        setIsRunning(isTaskRunning(parameter.filename));
    }, [parameter.filename, isTaskRunning]);

    useEffect(() => {
        if (taskData.trainingType === "0") {
            setBasicInfo([
                { name: "创建时间", data: new Date(taskData.createTime * 1000).toLocaleString() },
                { name: "数据集", data: taskData.datasetPath ? splitPath(taskData.datasetPath).pop() : "", details: taskData.datasetPath },
                { name: "训练轮数 (epochs)", data: taskData.epochs },
                { name: "每批训练样本数量 (batchSize)", data: taskData.batchSize },
                { name: "输入图像尺寸 (imgSize)", data: taskData.imgSize },
                { name: "训练设备", data: taskData.device },
                { name: "训练种子", data: taskData.trainSeed == 0 ? "默认(0)" : taskData.trainSeed }
            ]);

            setModelInfo([
                { name: "基础模型", data: taskData.baseModelInfo.name },
                { name: "模型大小", data: `${(taskData.baseModelInfo.size / 1024 / 1024).toFixed(2)} MB` },
                { name: "模型ID", data: taskData.baseModelInfo.id },
                {
                    name: "上传者",
                    data: taskData.baseModelInfo.uploader.login,
                    url: taskData.baseModelInfo.uploader.html_url
                }
            ]);
        } else if (taskData.trainingType === "1") {
            setBasicInfo([
                { name: "创建时间", data: new Date(taskData.createTime * 1000).toLocaleString() },
                {
                    name: "数据集",
                    data: taskData.datasetPath ? splitPath(taskData.datasetPath).pop() : "",
                    details: taskData.datasetPath
                },
                { name: "训练轮数 (epochs)", data: taskData.epochs },
                { name: "每批训练样本数量 (batchSize)", data: taskData.batchSize },
                { name: "输入图像尺寸 (imgSize)", data: taskData.imgSize },
                { name: "训练设备", data: taskData.device },
                { name: "训练种子", data: taskData.trainSeed == 0 ? "默认(0)" : taskData.trainSeed }
            ]);

            setModelInfo([
                {
                    name: "模型结构文件",
                    code: yaml.dump(taskData.yamlFile)
                }
            ]);
        }
    }, [taskData]);

    const getTaskHistory = () => {
        api.get("/ITraining/getTrainingTasksHistory", {
            params: {
                taskID: taskData.taskID
            }
        })
            .then(data => {
                if (data.code === 200) {
                    console.log("获取训练任务训练历史记录: " + data.data.history);
                    setTaskHistory(data.data.history);
                }
            })
            .catch(err => {
                console.error("获取训练任务训练历史记录时失败:", err);
            });
    }

    const onTrainingCompleted = () => {
        setTrainingCompleted(true);
        getTaskHistory();
    }

    const showLastTaskLog = () => {
        console.log(parameter.filename);

        api.get("/ITraining/getTaskLog", {
            params: { filename: parameter.filename },
        })
            .then(res => {
                setShowLastLog(true);

                if (res.code === 200) {
                    const { log, is_running } = res.data;
                    setLastLog(log);
                } else {
                    setLastLog(res.msg);
                }
            })
            .catch(err => {
                console.error("获取日志失败:", err);
            });
    }

    useEffect(() => {
        if (taskData) {
            getTaskHistory();
        }
    }, [taskData, isRunning]);

    useEffect(() => {
        if (trainingCompleted) {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 }
            });
        }
    }, [trainingCompleted]);

    useEffect(() => {
        hljs.highlightAll();
    });

    return (
        <div className="main">
            <a href="#" onClick={() => setPageUrl("tasks")} style={{ textDecoration: 'none' }}>返回</a>
            <h1 className="page-title">{taskData.taskName || "unknown"}</h1>
            <p className="page-des">{taskData.taskDescription || "无描述"}</p>
            {isRunning &&
                <span className="tag turquoise" style={{ display: 'flex', alignItems: 'center' }}>
                    正在训练中
                </span>
            }
            {trainingCompleted &&
                <>
                    <span className="tag green" style={{ display: 'flex', alignItems: 'center' }}>
                        🎉 训练完成，在下方查看训练结果
                    </span>
                </>
            }

            {isRunning && (
                <div className="terminal-container">
                    <div className="form-group-title">
                        <h1 className="step-tag nobg">
                            <img src={Icon_Terminal_fill} className="icon" />
                        </h1>
                        <h1 className="title">终端</h1>
                    </div>
                    <TerminalViewer filename={parameter.filename} setIsRunning={setIsRunning} trainingCompleted={onTrainingCompleted} />
                </div>
            )}

            {!isRunning &&
                <button className="btn" onClick={() => startTask(parameter.filename, taskData.taskName, taskData.taskID)}>启动训练</button>
            }

            <div className="task-detail-box">
                <div className="form-group-title">
                    <h1 className="step-tag nobg">
                        <img src={Icon_Info_circle_fill} className="icon" />
                    </h1>
                    <h1 className="title">任务基本信息</h1>
                </div>

                <div className="info-card-group">
                    {basicInfo.map((item, index) => (
                        <div className="info-card" key={`basic_info_${index}`} onClick={() => {
                            setInfoCardShowDetails(prev =>
                                prev.includes(index)
                                    ? prev.filter(i => i !== index)
                                    : [...prev, index]
                            );
                        }}>
                            <span className="key">{item.name}</span>
                            <span className="value">{item.data}</span>
                            {(infoCardShowDetails.includes(index) && item.details) &&
                                <span className="key" style={{ wordBreak: 'break-all' }}>详细: {item.details}</span>
                            }
                        </div>
                    ))}
                </div>

                <div className="form-group-title" style={{ marginTop: "40px" }}>
                    <h1 className="step-tag nobg">
                        <img src={Icon_Info_circle_fill} className="icon" />
                    </h1>
                    <h1 className="title">模型相关信息</h1>
                </div>

                <div className="info-card-group">
                    {modelInfo.map((item, index) => (
                        <div className="info-card"
                            key={`model_info_${index}`}
                            onClick={() => {
                                setShowModelInfoCardDetails(prev =>
                                    prev.includes(index)
                                        ? prev.filter(i => i !== index)
                                        : [...prev, index]
                                );
                            }}
                        >
                            <span className="key">{item.name}</span>
                            {item.url ? (
                                <span className="value">
                                    <a href={item.url} target="_blank" rel="noreferrer">{item.data}</a>
                                </span>
                            ) : item.data ? (
                                <span className="value">{item.data}</span>
                            ) : item.code ? (
                                <pre style={{ maxHeight: showModelInfoCardDetails.includes(index) ? "none" : "200px", overflow: "auto" }}>
                                    <code className="language-yaml hljs" style={{ fontSize: '14px', wordBreak: 'break-word' }}>
                                        {item.code}
                                    </code>
                                </pre>
                            ) : null}

                            {(showModelInfoCardDetails.includes(index) && item.details) && (
                                <span className="key" style={{ wordBreak: 'break-all' }}>
                                    详细: {item.details}
                                </span>
                            )}
                        </div>
                    ))}
                </div>

                <div className="form-group-title" style={{ marginTop: "40px" }}>
                    <h1 className="step-tag nobg">
                        <img src={Icon_Info_circle_fill} className="icon" />
                    </h1>
                    <h1 className="title">训练记录</h1>
                    <a href="#" onClick={() => showLastTaskLog()}>没有训练结果？显示上一次的日志</a>
                </div>

                {showLastLog && (
                    <pre>
                        <code>
                            {lastLog}
                        </code>
                    </pre>
                )}

                <div className="list-card-group">
                    {taskHistory
                        .slice()
                        .sort((a, b) => b.startedAt - a.startedAt)
                        .map((item, index) => (
                            <div className="list-card" key={`task_history_${index}`} onClick={() => {
                                if (item.completedAt != null) {
                                    setPageUrl(`taskResultDetailed?taskID=${item.taskID}&startedAt=${item.startedAt}&taskName=${taskData.taskName}`);
                                }
                            }}>
                                <span style={{ fontWeight: 'bold', fontSize: '18px' }}>
                                    {new Date(item.startedAt * 1000).toLocaleString()} - {item.completedAt != null ? new Date(item.completedAt * 1000).toLocaleString() : "无记录"}
                                </span>
                                <br />
                                {item.completedAt == null ? (
                                    <>
                                        <span style={{ color: 'var(--red-color)', fontSize: '14px' }}>该训练暂无结果</span>
                                    </>
                                ) : (
                                    <span style={{ color: 'var(--secondary-text-color)', fontSize: '14px' }}>
                                        训练结果: {item.outputDir || "unknown"}
                                    </span>
                                )}
                            </div>
                        ))}
                    {taskHistory.length == 0 &&
                        <span>您还没有任何训练记录</span>
                    }
                </div>
            </div>
        </div >
    );
}

export default TaskDetailedPage;
