import { useEffect, useState } from "react";
import { api } from "../api";
import TritonRepoPage from "./TritonRepoPage";

import Icon_Info_circle_fill from "../assets/icons/info-circle-fill.svg";

function ModelsPage({ setPageUrl, parameter }) {
    const [localModelList, setLocalModelList] = useState([]);
    const [trainedModelList, setTrainedModelList] = useState([]);
    const [showModelType, setShowModelType] = useState(0); // 0: 本地基础模型, 1: 训练结果模型, 2: Triton 仓库

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

    const startModelValidation = (model) => {
        const weights = Object.keys(model.weights).join(",");
        // 尝试从 model.dataset 拼接数据集信息
        let datasetPath = "";
        let datasetYamlPath = "";
        try {
            if (model.dataset && model.dataset.path) {
                datasetPath = model.dataset.path.replace(/\\\\/g, "/");
                if (model.dataset.yaml_file_path) {
                    datasetYamlPath = `${datasetPath}/${model.dataset.yaml_file_path}`;
                }
            }
        } catch (_) {}
        const qs = new URLSearchParams({
            type: 'newVal',
            taskID: model.task_id,
            taskName: model.task_name || '',
            folder: model.folder,
            weights,
            outputDir: model.output_dir || '',
            datasetPath,
            datasetYamlPath,
        }).toString();
        setPageUrl(`modelTest?${qs}`);
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
                <div className={`card hover-enabled${showModelType == 2 ? " click" : ""}`} style={{ flex: '1' }} onClick={() => { setShowModelType(2) }}>
                    <h1 className="title mb12">Triton 仓库</h1>
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
                            {model.dataset && (
                                <p className="content">
                                    <strong>训练数据集</strong>
                                    <br />
                                    名称: {model.dataset.name || 'Unknown'}{model.dataset.version ? ` 版本: ${model.dataset.version}` : ''}
                                    <br />
                                    路径: {model.dataset.path}
                                    {model.dataset.yaml_file_path && (
                                        <>
                                            <br />
                                            配置: {model.dataset.yaml_file_path}
                                        </>
                                    )}
                                </p>
                            )}
                            <p className="content">
                                {["best.pt", "last.pt"].map(key => (
                                    model.weights[key] && (
                                        <div key={key}>
                                            <strong>{key}</strong>: {model.weights[key]}
                                        </div>
                                    )
                                ))}
                            </p>
                            <p className="content">
                                {Object.keys(model.weights).filter(k => /^epoch\d+\.pt$/.test(k)).length > 0 && (
                                    <div style={{ marginTop: '8px', color: 'var(--secondary-text-color)' }}>
                                        其他周期模型文件: {Object.keys(model.weights).filter(k => /^epoch\d+\.pt$/.test(k)).length} 个
                                    </div>
                                )}
                            </p>
                            <button className="btn sm" onClick={() => startModelTest(model.task_id, model.task_name, model.folder, Object.keys(model.weights), model.output_dir)} style={{ marginRight: '8px' }}>进行测试</button>
                            <button className="btn sm" onClick={() => startModelValidation(model)} style={{ marginRight: '8px' }}>进行验证</button>
                            <button className="btn sm" onClick={() => {
                                const qs = new URLSearchParams({
                                    taskID: model.task_id,
                                    taskName: model.task_name || '',
                                    folder: model.folder,
                                    outputDir: model.output_dir || '',
                                }).toString();
                                setPageUrl(`modelExport?${qs}`);
                            }} style={{ marginRight: '8px' }}>导出/转换</button>
                            <button className="btn sm" onClick={() => {
                                try {
                                    const ts = parseInt(model.folder.split('_')[2]);
                                    const startedAtStr = new Date(ts * 1000).toLocaleString();
                                    setPageUrl(`modelTest?taskID=${model.task_id}&taskName=${encodeURIComponent(model.task_name || '')}&startedAt=${encodeURIComponent(startedAtStr)}&folder=${model.folder}`);
                                } catch (e) {
                                    setPageUrl(`modelTest?taskID=${model.task_id}&taskName=${encodeURIComponent(model.task_name || '')}&folder=${model.folder}`);
                                }
                            }}>查看测试/验证历史记录</button>
                        </div>
                    ))}
                </>
            }

            {showModelType === 2 && (
                <div className="card" style={{ padding: '10px' }}>
                    <TritonRepoPage setPageUrl={setPageUrl} embedded={true} />
                </div>
            )}
        </div>
    );
}

export default ModelsPage;
