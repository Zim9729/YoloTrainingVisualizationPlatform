import { useState, useEffect } from "react";
import { api } from "../api";
import { splitPath } from "../tools";

import Icon_Box_seam_fill from "../assets/icons/box-seam-fill.svg";
import Icon_Calendar_fill from "../assets/icons/calendar-fill.svg";

function TestResultImage({ taskID, filePath }) {
    const [base64, setBase64] = useState(null);

    useEffect(() => {
        if (!taskID || !filePath) return;

        api.get(`/IModel/getTestResultImageBase64?taskID=${taskID}&filePath=${encodeURIComponent(filePath)}`)
            .then(data => {
                if (data.code == 200 && data.data.type == "image") {
                    setBase64(data.data.base64);
                }
            })
            .catch(err => console.error("加载图片失败", err));
    }, [taskID, filePath]);

    if (!base64) return <p>加载中...</p>;

    return <img src={base64} />;
}

function ModelTestPage({ setPageUrl, parameter }) {
    const [modelList, setModelList] = useState([]);
    const [modelName, setModelName] = useState("best.pt");
    const [inputPath, setInputPath] = useState("");
    const [loading, setLoading] = useState(false);
    const [trainedModelList, setTrainedModelList] = useState([]);
    const [showTestResultImage, setShowTestResultImage] = useState([]);

    useEffect(() => {
        if (parameter.type == "newTest" && parameter?.weights) {
            const weightsArray = parameter.weights
                .split(",")
                .map(w => w.trim())
                .filter(w => w.endsWith(".pt"));   // 过滤非法内容

            setModelList(weightsArray);

            if (weightsArray.includes("best.pt")) {
                setModelName("best.pt");
            } else {
                setModelName(weightsArray[0] || "");
            }
        } else {
            api.get("/IModel/getAllTrainedModel")
                .then(async data => {
                    console.log("获取训练结果模型: ", data);

                    if (data.code == 200) {
                        const models = data.data.models;

                        const targetModel = models.find(model => model.folder === parameter.folder);
                        if (!targetModel) {
                            console.warn("未找到指定 folder 的模型:", parameter.folder);
                            setTrainedModelList([]);
                            return;
                        }

                        try {
                            const testRes = await api.get(`/IModel/getAllTest?taskID=${targetModel.task_id}`);
                            if (testRes.code === 200) {
                                const testList = testRes.data.test || [];

                                const matchedTests = testList.filter(test =>
                                    Object.values(targetModel.weights).includes(test.model_path)
                                );

                                const updatedModel = {
                                    ...targetModel,
                                    tests: matchedTests
                                };

                                setTrainedModelList([updatedModel]);
                            }
                        } catch (err) {
                            console.error(`获取测试记录失败 taskID=${targetModel.task_id}`, err);
                            setTrainedModelList([{ ...targetModel, tests: [] }]);
                        }
                    }
                })
                .catch(err => {
                    console.error("获取训练结果模型失败:", err);
                });
        }
    }, [parameter]);

    const handleStartTest = () => {
        if (!inputPath || !modelName) {
            alert("请填写文件路径和选择模型");
            return;
        }

        setLoading(true);

        console.log({
            taskID: parameter.taskID,
            outputDir: parameter.outputDir || "",
            inputPath: inputPath,
            inputType: "image",
            modelType: modelName.replace(".pt", "")
        })

        api.post("/IModel/runModelTest", {
            data: {
                taskID: parameter.taskID,
                taskName: parameter.taskName,
                outputDir: parameter.outputDir || "",
                inputPath: inputPath,
                inputType: "image",
                modelType: modelName.replace(".pt", "")
            }
        })
            .then(data => {
                console.log("启动测试任务成功: ", data);
                alert(data.msg);
                if (data.code == 200) setPageUrl("models?type=trained");
            })
            .catch(err => {
                console.error("启动测试任务失败:", err);
            });

        setLoading(false);
    };

    const handleBrowseClick = async () => {
        const filePath = await window.electronAPI.selectFile();
        if (filePath) {
            setInputPath(filePath);
        }
    };

    switch (parameter.type) {
        case "newTest":
            return (
                <div className="main">
                    <a href="#" onClick={() => setPageUrl("models?type=trained")} style={{ textDecoration: 'none' }}>返回</a>
                    <h1 className="page-title">模型测试</h1>
                    <p className="page-des">来自任务「{parameter.taskName || "Unknown"}」</p>

                    <div className="form-group">
                        <label htmlFor="modelName">您想要测试哪一个模型？</label>
                        <select id="modelName" value={modelName} onChange={(e) => setModelName(e.target.value)}>
                            {modelList.map((item, index) => (
                                <option key={`model_select_${index}`} value={item}>{item}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="inputPath">请选择您希望用于测试的图片</label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input
                                type="text"
                                value={inputPath}
                                onChange={(e) => setInputPath(e.target.value)}
                                placeholder="请选择文件或输入路径"
                                style={{ flex: 1 }}
                            />
                            <button className="btn sm" onClick={handleBrowseClick}>
                                浏览...
                            </button>
                        </div>
                    </div>

                    <button className="btn primary" onClick={handleStartTest} disabled={loading}>
                        {loading ? "测试中..." : "开始测试"}
                    </button>
                </div>
            );
        default:
            return (
                <div className="main">
                    <a href="#" onClick={() => setPageUrl("models?type=trained")} style={{ textDecoration: 'none' }}>返回</a>
                    <h1 className="page-title">任务「{parameter.taskName}」模型测试结果</h1>
                    <p className="page-des">训练于 {parameter.startedAt}</p>

                    {trainedModelList && trainedModelList.length > 0 && (() => {
                        const model = trainedModelList[0];
                        if (!model) return null;

                        return (
                            <div>
                                <div className="form-group-title">
                                    <h1 className="step-tag nobg">
                                        <img src={Icon_Calendar_fill} className="icon" />
                                    </h1>
                                    <h1 className="title">历史测试记录</h1>
                                </div>

                                <div className="list-card-group">
                                    {Array.isArray(model.tests) && model.tests.length > 0 && (
                                        <div style={{ marginTop: '20px' }}>
                                            {model.tests
                                                .sort((a, b) => b.startedAt - a.startedAt)
                                                .map((test, index) => (
                                                    <div key={`test_history_${index}`} className="list-card" onClick={() => {
                                                        setShowTestResultImage(prev =>
                                                            prev.includes(index)
                                                                ? prev.filter(i => i !== index)
                                                                : [...prev, index]
                                                        );
                                                    }}>
                                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                            <div style={{ flex: '1' }}>
                                                                <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
                                                                    {new Date(test.startedAt * 1000).toLocaleString()} - {test.completedAt ? new Date(test.completedAt * 1000).toLocaleString() : "未完成"}
                                                                </span>
                                                                <br />
                                                                <span style={{ fontSize: '14px', color: 'var(--secondary-text-color)' }}>
                                                                    测试图片来自 {splitPath(test.input_path).pop()}
                                                                </span>
                                                                <br />
                                                                <span style={{ fontSize: '14px', color: 'var(--secondary-text-color)' }}>
                                                                    使用 {splitPath(test.model_path).pop()} 进行测试
                                                                </span>
                                                            </div>

                                                            <div style={{ flex: '1' }}>
                                                                {showTestResultImage.includes(index) && (
                                                                    <TestResultImage taskID={model.task_id} filePath={test.result_file_path} />
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })()}
                </div>
            );
    }
}

export default ModelTestPage;
