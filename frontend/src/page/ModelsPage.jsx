import { useEffect, useState } from "react";
import { api } from "../api";

import Icon_Info_circle_fill from "../assets/icons/info-circle-fill.svg";

function ModelsPage({ setPageUrl, parameter }) {
    const [localModelList, setLocalModelList] = useState([]);
    const [trainedModelList, setTrainedModelList] = useState([]);
    const [showModelType, setShowModelType] = useState(0);

    useEffect(() => {
        api.get("/ITraining/getAllBaseModelFromLocal")
            .then(data => {
                console.log("获取本地基础模型列表: ", data);
                if (data.code == 200) {
                    setLocalModelList(data.data.models);
                }
            })
            .catch(err => {
                console.error("获取本地基础模型列表失败:", err);
            });

        api.get("/IModel/getAllTrainedModel")
            .then(data => {
                console.log("获取训练结果模型: ", data);
                if (data.code == 200) {
                    setTrainedModelList(data.data.models);
                }
            })
            .catch(err => {
                console.error("获取训练结果模型失败:", err);
            });
    }, []);

    useEffect(() => {
        if (parameter.type == "base") {
            setShowModelType(0);
        } else if (parameter.type == "trained") {
            setShowModelType(1);
        }
    }, [parameter.type]);

    const startModelTest = (taskID, taskName, folder, weightsArray, outputDir) => {
        const weights = weightsArray.join(",");
        setPageUrl(`modelTest?type=newTest&taskID=${taskID}&taskName=${taskName}&folder=${folder}&weights=${weights}&outputDir=${outputDir}`);
    };

    return (
        <div className="main">
            <h1 className="page-title">模型</h1>
            <p className="page-des">查看我的模型</p>

            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                <div className={`card hover-enabled${showModelType == 0 ? " click" : ""}`} style={{ flex: '1' }} onClick={() => { setShowModelType(0) }}>
                    <h1 className="title mb12">本地基础模型</h1>
                </div>
                <div className={`card hover-enabled${showModelType == 1 ? " click" : ""}`} style={{ flex: '1' }} onClick={() => { setShowModelType(1) }}>
                    <h1 className="title mb12">训练结果模型</h1>
                </div>
            </div>

            {showModelType === 0 &&
                localModelList.map((item, index) => (
                    <div key={index} className="card pointer" style={{ wordBreak: 'break-all' }}>
                        <p className="title">{item.name}</p>
                        <p className="content">
                            {item.path}
                        </p>
                        <p className="content">
                            大小: {Math.round(item.size / 1024 / 1024)} MB
                            <br />
                            创建于 {new Date(item.modified_time * 1000).toLocaleString()}
                        </p>
                    </div>
                ))
            }

            {showModelType === 1 &&
                <>
                    <div className="tip-box">
                        <img src={Icon_Info_circle_fill} className="icon" style={{ marginRight: '10px', marginBottom: '-3px' }} />
                        同一任务可能包含多个训练结果，请务必核查训练时间
                    </div>
                    {trainedModelList.map((model, index) => (
                        <div key={index} className="card pointer" style={{ marginBottom: '20px', wordBreak: 'break-all' }}>
                            <p className="title">
                                {model.task_name || "Unknown"} <span style={{ fontSize: '16px' }}>#{model.task_id}</span>
                            </p>
                            <p className="content">
                                训练时间: {new Date(parseInt(model.folder.split('_')[2]) * 1000).toLocaleString()}
                                <br />
                                存放目录名称: {model.folder}
                            </p>
                            <p className="content">
                                {["best.pt", "last.pt"].map(key => (
                                    model.weights[key] && (
                                        <div key={key}>
                                            <strong>{key}</strong>: {model.weights[key]}
                                        </div>
                                    )
                                ))}

                                {Object.keys(model.weights).filter(k => /^epoch\d+\.pt$/.test(k)).length > 0 && (
                                    <div style={{ marginTop: '8px', color: '#888' }}>
                                        其他周期模型文件: {Object.keys(model.weights).filter(k => /^epoch\d+\.pt$/.test(k)).length} 个
                                    </div>
                                )}
                            </p>
                            <button className="btn sm" onClick={() => startModelTest(model.task_id, model.task_name, model.folder, Object.keys(model.weights), model.output_dir)} style={{ marginRight: '8px' }}>进行测试</button>
                            <button className="btn sm" onClick={() => {
                                setPageUrl(`modelTest?taskName=${model.task_name}&startedAt=${new Date(parseInt(model.folder.split('_')[2]) * 1000).toLocaleString()}&folder=${model.folder}`)
                            }}>查看测试历史记录</button>
                        </div>
                    ))}
                </>
            }
        </div>
    );
}

export default ModelsPage;
