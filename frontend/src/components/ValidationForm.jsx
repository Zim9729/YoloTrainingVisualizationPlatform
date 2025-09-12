import { useState, useEffect } from "react";
import { api } from "../api";

function ValidationForm({ 
    modelList, 
    parameter, 
    setPageUrl, 
    onValidationStart 
}) {
    const [modelName, setModelName] = useState("best.pt");
    const [datasetList, setDatasetList] = useState([]);
    const [datasetYamlPath, setDatasetYamlPath] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // 设置默认模型
        if (modelList.includes("best.pt")) {
            setModelName("best.pt");
        } else {
            setModelName(modelList[0] || "");
        }

        // 获取数据集列表
        api.get("/IDataset/getAllDatasets").then(res => {
            if (res.code === 200) {
                const dsList = res.data.datasets || [];
                setDatasetList(dsList);

                // 1) 若页面参数携带了 datasetYamlPath，则优先使用它
                const fromParamYaml = (parameter?.datasetYamlPath || "").toString();
                if (fromParamYaml) {
                    setDatasetYamlPath(fromParamYaml.replace(/\\\\/g, "/"));
                    return;
                }
                // 2) 否则默认选择第一个数据集
                if (dsList.length > 0) {
                    const first = dsList[0];
                    const yamlAbsPath = `${first.path.replace(/\\\\/g, "/")}/${first.platform_info.yaml_file_path}`;
                    setDatasetYamlPath(yamlAbsPath);
                }
            }
        }).catch(err => {
            console.error("获取数据集失败", err)
            // 即便拉取失败，也尝试使用参数中的 datasetYamlPath
            const fromParamYaml = (parameter?.datasetYamlPath || "").toString();
            if (fromParamYaml) {
                setDatasetYamlPath(fromParamYaml.replace(/\\\\/g, "/"));
            }
        });
    }, [modelList, parameter?.datasetYamlPath]);

    const handleStartValidation = async () => {
        if (!datasetYamlPath || !modelName) {
            alert("请选择数据集和模型");
            return;
        }
        setLoading(true);

        try {
            const data = await api.post("/IModel/runModelValidation", {
                data: {
                    taskID: parameter.taskID,
                    taskName: parameter.taskName,
                    outputDir: parameter.outputDir || "",
                    datasetYamlPath: datasetYamlPath,
                    modelType: modelName.replace(".pt", "")
                }
            });

            console.log("启动验证任务成功: ", data);
            alert(data.msg);
            
            if (data.code === 200 && data.data?.filename && onValidationStart) {
                onValidationStart(data.data.filename);
            }
        } catch (err) {
            console.error("启动验证任务失败:", err);
        } finally {
            setLoading(false);
        }
    };

    const buildHistoryUrl = () => {
        try {
            const ts = parseInt(parameter.folder?.split('_')?.[2] || '0');
            const startedAtStr = ts ? new Date(ts * 1000).toLocaleString() : '';
            return `modelTest?taskName=${encodeURIComponent(parameter.taskName || '')}&startedAt=${encodeURIComponent(startedAtStr)}&folder=${encodeURIComponent(parameter.folder || '')}&open=validation`;
        } catch (e) {
            return `modelTest?taskName=${encodeURIComponent(parameter.taskName || '')}&folder=${encodeURIComponent(parameter.folder || '')}&open=validation`;
        }
    };

    return (
        <div className="main">
            <a href="#" onClick={() => setPageUrl("models?type=trained")} style={{ textDecoration: 'none' }}>返回</a>
            <h1 className="page-title">模型验证</h1>
            <p className="page-des">来自任务「{parameter.taskName || "Unknown"}」</p>

            <div className="form-group">
                <label htmlFor="modelName">您想要验证哪一个模型？</label>
                <select id="modelName" value={modelName} onChange={(e) => setModelName(e.target.value)}>
                    {modelList.map((item, index) => (
                        <option key={`model_select_${index}`} value={item}>{item}</option>
                    ))}
                </select>
            </div>

            <div className="form-group">
                <label htmlFor="datasetYaml">请选择用于验证的数据集</label>
                <select id="datasetYaml" value={datasetYamlPath} onChange={(e) => setDatasetYamlPath(e.target.value)}>
                    {/* 如果参数中给出了 datasetYamlPath，但不在列表中，则先渲染一个可选项 */}
                    {(() => {
                        const exists = datasetList.some(ds => `${ds.path.replace(/\\\\/g, "/")}/${ds.platform_info.yaml_file_path}` === datasetYamlPath);
                        if (datasetYamlPath && !exists) {
                            return (
                                <option value={datasetYamlPath}>{datasetYamlPath}（来自任务）</option>
                            );
                        }
                        return null;
                    })()}
                    {datasetList.map((ds, idx) => {
                        const yamlPath = `${ds.path.replace(/\\\\/g, "/")}/${ds.platform_info.yaml_file_path}`;
                        return (
                            <option key={`ds_${idx}`} value={yamlPath}>
                                {ds.name} - {ds.platform_info.version}
                            </option>
                        );
                    })}
                </select>
                {datasetList.length === 0 && (
                    <div className="tip-box" style={{ marginTop: '8px' }}>
                        没有可用数据集。请先在"数据集"页面上传或创建一个数据集。
                    </div>
                )}
                {(parameter?.datasetYamlPath || parameter?.datasetPath) && (
                    <div className="tip-box" style={{ marginTop: '8px' }}>
                        来自训练任务：
                        {parameter?.datasetYamlPath && (<>
                            <br />YAML：{parameter.datasetYamlPath}
                        </>)}
                        {parameter?.datasetPath && (<>
                            <br />数据集目录：{parameter.datasetPath}
                        </>)}
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn primary" onClick={handleStartValidation} disabled={loading || !datasetYamlPath}>
                    {loading ? "验证中..." : "开始验证"}
                </button>
                <button className="btn" onClick={() => setPageUrl(buildHistoryUrl())}>
                    查看验证历史记录
                </button>
                <button className="btn" onClick={() => setPageUrl("models?type=trained")}>
                    返回训练模型列表
                </button>
            </div>
        </div>
    );
}

export default ValidationForm;
