import { useState, useEffect } from "react";
import { api } from "../api";
import CONFIGS from "../config";

function TasksPage({ setPageUrl, parameter }) {
    const [datasetsList, setDatasetsList] = useState([]);
    const [modelList, setModelList] = useState([]);

    const [tabIndex, setTabIndex] = useState(0);
    const [taskName, setTaskName] = useState("");
    const [taskDescription, setTaskDescription] = useState("");
    const [datasetPath, setDatasetPath] = useState("");
    const [trainingType, setTrainingType] = useState("0");

    // trainningType == 0
    const [baseModelID, setBaseModelID] = useState("");
    const [selectedBaseModel, setSelectedBaseModel] = useState(null);

    // trainingType == 1
    const [modelYamlFile, setModelYamlFile] = useState("");

    const [epochs, setEpochs] = useState(100);
    const [batchSize, setBatchSize] = useState(16);
    const [imgSize, setImgSize] = useState(640);

    const [device, setDevice] = useState("cpu");
    const [gpuCUDAIndex, setGpuCUDAIndex] = useState("");
    const [gpuCUDANum, setGpuCUDANum] = useState(1);

    const [trainSeed, setTrainSeed] = useState("");

    const [cache, setCache] = useState("disk");

    const [canBackLastTab, setCanBackLastTab] = useState(false);

    const tabIndexCount = 5;

    useEffect(() => {
        api.get("/IDataset/getAllDatasets", { params: {} })
            .then(data => {
                console.log("获取数据集:", data.data);
                setDatasetsList(data.data.datasets);
                if (!parameter.datasetPath) {
                    setDatasetPath(data.data.datasets[0].path);
                }
            })
            .catch(err => {
                console.error("获取数据集失败:", err);
                alert(err);
            });
    }, [])

    useEffect(() => {
        if (parameter.datasetPath) {
            console.log("自动加载数据集" + parameter.datasetPath);
            setDatasetPath(parameter.datasetPath);
        }
    }, [])

    useEffect(() => {
        fetch("https://api.github.com/repos/ultralytics/assets/releases/latest")
            .then(res => res.json())
            .then(data => {
                const models = data.assets.filter(asset => asset.name.endsWith(".pt"));
                setModelList(models);
                if (models.length > 0) {
                    // 设置默认的模型是yolo11n.pt
                    setBaseModelID(196201276);
                }
            })
            .catch(err => {
                console.error("模型拉取失败: ", err);
                alert(err);
            });
    }, []);

    useEffect(() => {
        const found = modelList.find(item => item.id === parseInt(baseModelID));
        setSelectedBaseModel(found || null);
    }, [baseModelID]);

    useEffect(() => {
        if (tabIndex == 5) {
            setCanBackLastTab(true);
        }
    }, [tabIndex]);

    switch (parameter.type) {
        case "newTask":
            return (
                <div className="main">
                    <h1 className="page-title">创建训练任务</h1>
                    <p className="page-des">填写模型训练信息。</p>

                    <div className={`tab-content ${tabIndex === 0 ? "active" : "hidden"}`}>
                        <div className="form-group-title">
                            <h1 className="step-tag">1</h1>
                            <h1 className="title">
                                基本信息
                            </h1>
                        </div>

                        <div className="form-group">
                            <label htmlFor="taskName">任务名称</label>
                            <input type="text" id="taskName" value={taskName} onChange={(e) => { setTaskName(e.target.value) }} placeholder="请输入任务名称" />
                        </div>

                        <div className="form-group">
                            <label htmlFor="taskDescription">任务描述</label>
                            <textarea id="taskDescription" value={taskDescription} onChange={(e) => { setTaskDescription(e.target.value) }} placeholder="请输入任务描述"></textarea>
                        </div>
                    </div>

                    <div className={`tab-content ${tabIndex === 1 ? "active" : "hidden"}`}>
                        <div className="form-group-title">
                            <h1 className="step-tag">2</h1>
                            <h1 className="title">
                                数据集
                            </h1>
                        </div>

                        <div className="form-group">
                            <label htmlFor="datasetPath">选择数据集</label>
                            {datasetsList.length != 0 &&
                                <select id="datasetPath" value={datasetPath} onChange={(e) => setDatasetPath(e.target.value)}>
                                    {datasetsList.map((item, index) => (
                                        <option key={`datasetPath_select_${index}`} value={item.path}>{item.name}</option>
                                    ))}
                                </select>
                            }
                            {datasetsList.length == 0 &&
                                <div className="tip-box">
                                    您还没有上传任何数据集，请点击<a href="#" onClick={() => { setPageUrl("dataset?type=uploadDataset") }}>这里</a>上传数据集
                                </div>
                            }
                        </div>
                    </div>

                    <div className={`tab-content ${tabIndex === 2 ? "active" : "hidden"}`}>
                        <div className="form-group">
                            <label htmlFor="trainingType">你想要...</label>
                            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                                <div className={`card hover-enabled${trainingType == 0 ? " click" : ""}`} style={{ flex: '1' }} onClick={() => { setTrainingType(0) }}>
                                    <h1 className="title">直接微调官方模型</h1>
                                    <p>加载一个完整的、已训练的预训练模型（常用方式）</p>
                                </div>
                                <div className={`card hover-enabled${trainingType == 1 ? " click" : ""}`} style={{ flex: '1' }} onClick={() => { setTrainingType(1) }}>
                                    <h1 className="title">从头训练自定义结构</h1>
                                    <p className="des">从 <code>.yaml</code> 配置文件构建一个新模型（不含任何权重）</p>
                                </div>
                            </div>
                            <div className="tip-box">
                                {trainingType == 0 &&
                                    <>
                                        <p>
                                            对于“直接微调官方模型”:
                                            <br />
                                            📦 用途：直接使用官方或已有的预训练模型进行微调或推理。
                                            <br />
                                            ✅ 包含完整结构 + 预训练权重。
                                            <br />
                                            ✅ 推荐用于迁移学习或直接部署。
                                        </p>
                                        <p>
                                            加载代码
                                            <pre>
                                                <code className="language-python">
                                                    model = YOLO("yolo11n.pt")
                                                </code>
                                            </pre>
                                        </p>
                                    </>
                                }
                                {trainingType == 1 &&
                                    <>
                                        <p>
                                            对于“训练自定义结构”:
                                            <br />
                                            📦 用途：你要<b>从头训练（scratch）</b>一个自定义结构的模型。
                                            <br />
                                            📄 <code>.yaml</code> 文件中定义了模型结构，例如 backbone、head 层数、通道数等。
                                            <br />
                                            🚫 不会加载任何预训练权重。
                                            <br />
                                            ✅ 用于研究、修改架构、自定义实验。
                                        </p>
                                        <p>
                                            加载代码
                                            <pre>
                                                <code className="language-python">
                                                    model = YOLO("yolo11n.yaml")
                                                </code>
                                            </pre>
                                        </p>
                                    </>
                                }
                            </div>
                        </div>
                    </div>

                    <div className={`tab-content ${tabIndex === 3 ? "active" : "hidden"}`}>
                        <div className="form-group-title">
                            <h1 className="step-tag">3</h1>
                            <h1 className="title">
                                训练参数
                            </h1>
                        </div>

                        {trainingType == 0 &&
                            <>
                                <div className="form-group">
                                    <label htmlFor="baseModelID">选择基准模型</label>
                                    <select
                                        id="baseModelID"
                                        value={baseModelID}
                                        onChange={(e) => setBaseModelID(e.target.value)}
                                    >
                                        {modelList.map((item, index) => (
                                            <option key={`baseModelID_select_${index}`} value={item.id}>
                                                {item.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {selectedBaseModel != null && (
                                    <div className="tip-box">
                                        <strong>模型ID</strong> {selectedBaseModel.id}
                                        <br />
                                        <strong>模型大小</strong> {Math.round(selectedBaseModel.size / 1024 / 1024)} MB
                                        <br />
                                        <strong>下载次数</strong> {selectedBaseModel.download_count} 次
                                        <br />
                                        <strong>上传者</strong> <a href={selectedBaseModel.uploader.html_url}>{selectedBaseModel.uploader.login}</a>
                                    </div>
                                )}

                                <div className="tip-box">
                                    <table>
                                        <thead>
                                            <tr>
                                                <td>任务</td>
                                                <td>名称标记</td>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td>
                                                    <a href="https://docs.ultralytics.com/zh/tasks/detect/">检测</a>
                                                </td>
                                                <td>
                                                    <code>.pt</code>
                                                    <br />
                                                    例: yolo11n.pt yolo11s.pt
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <a href="https://docs.ultralytics.com/zh/tasks/segment/">实例分割</a>
                                                </td>
                                                <td>
                                                    <code>-seg.pt</code>
                                                    <br />
                                                    例: yolo11n-seg.pt yolo11s-seg.pt
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <a href="https://docs.ultralytics.com/zh/tasks/pose/">姿势/关键点</a>
                                                </td>
                                                <td>
                                                    <code>-pose.pt</code>
                                                    <br />
                                                    例: yolo11n-pose.pt yolo11s-pose.pt
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <a href="https://docs.ultralytics.com/zh/tasks/obb/">定向检测</a>
                                                </td>
                                                <td>
                                                    <code>-obb.pt</code>
                                                    <br />
                                                    例: yolo11n-obb.pt yolo11s-obb.pt
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <a href="https://docs.ultralytics.com/zh/tasks/classify/">分类</a>
                                                </td>
                                                <td>
                                                    <code>-cls.pt</code>
                                                    <br />
                                                    例: yolo11n-cls.pt yolo11s-cls.pt
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                    如下拉框长时间无内容，请检查网络配置
                                </div>
                            </>
                        }

                        {trainingType == 1 &&
                            <>
                                <div className="form-group">
                                    <label htmlFor="modelYamlFile">模型<code>.yaml</code>文件</label>
                                    <textarea id="modelYamlFile" value={modelYamlFile} rows={10} onChange={(e) => { setModelYamlFile(e.target.value) }} placeholder="请输入模型.yaml文件"></textarea>
                                </div>
                            </>
                        }

                        <div className="form-group">
                            <label htmlFor="epochs">训练轮数 (epochs)</label>
                            <input type="number" id="epochs" min="1" value={epochs} onChange={(e) => setEpochs(parseInt(e.target.value))} />
                        </div>

                        <div className="form-group">
                            <label htmlFor="batchSize">每批训练样本数量 (batch_size)</label>
                            <input type="number" id="batchSize" min="1" value={batchSize} onChange={(e) => setBatchSize(parseInt(e.target.value))} />
                        </div>

                        <div className="form-group">
                            <label htmlFor="imgSize">输入图像尺寸 (imgsz)</label>
                            <input type="number" id="imgSize" min="1" value={imgSize} onChange={(e) => setImgSize(parseInt(e.target.value))} />
                        </div>

                        <div className="tip-box">
                            对于以上参数的描述，参见<a href="https://docs.ultralytics.com/zh/modes/train/#train-settings">https://docs.ultralytics.com/zh/modes/train/#train-settings</a>
                            <br />
                            如果您不了解，那么通常情况下您不需要更改这些参数
                        </div>
                    </div>

                    <div className={`tab-content ${tabIndex === 4 ? "active" : "hidden"}`}>
                        <div className="form-group-title">
                            <h1 className="step-tag">4</h1>
                            <h1 className="title">
                                高级选项
                            </h1>
                        </div>

                        <div className="form-group">
                            <label htmlFor="device">选择训练设备(device)</label>
                            <select
                                id="device"
                                value={device}
                                onChange={(e) => setDevice(e.target.value)}
                            >
                                <option key="device_select_cpu" value="cpu">
                                    CPU
                                </option>
                                <option key="device_select_gpu" value="gpu">
                                    GPU（CUDA）
                                </option>
                                <option key="device_select_gpu_idlefirst" value="gpu_idlefirst">
                                    GPU（CUDA，闲置设备优先）
                                </option>
                                <option key="device_select_mps" value="mps">
                                    苹果芯片（MPS）
                                </option>
                            </select>
                        </div>

                        {device == "gpu" &&
                            <div className="form-group">
                                <label htmlFor="gpuCUDAIndex">设置CUDA设备编号（如有多个CUDA设备，请使用英文逗号","分割）</label>
                                <input type="text" id="gpuCUDAIndex" value={gpuCUDAIndex} onChange={(e) => { setGpuCUDAIndex(e.target.value) }} placeholder="例: 0,1,2" />
                            </div>
                        }

                        {device == "gpu_idlefirst" &&
                            <div className="form-group">
                                <label htmlFor="gpuCUDANum">设置CUDA设备数量</label>
                                <input type="number" id="gpuCUDANum" min="1" value={gpuCUDANum} onChange={(e) => setGpuCUDANum(parseInt(e.target.value))} />
                            </div>
                        }

                        <div className="tip-box">
                            对于训练设备相关，参见<a href="https://docs.ultralytics.com/zh/modes/train/#usage-examples">https://docs.ultralytics.com/zh/modes/train/#usage-examples</a>
                        </div>

                        <div className="form-group">
                            <label htmlFor="trainSeed">设置训练种子(seed)</label>
                            <input type="text" id="trainSeed" value={trainSeed} onChange={(e) => { setTrainSeed(e.target.value) }} placeholder="默认: 0" />
                        </div>

                        <div className="form-group">
                            <label htmlFor="cache">缓存数据集图像位置(cache)</label>
                            <select id="cache" value={cache} onChange={(e) => setCache(e.target.value)}>
                                <option key="cache_select_cpu" value="disk">
                                    在磁盘中(disk)
                                </option>
                                <option key="cache_select_gpu" value="ram">
                                    在内存中(ram)
                                </option>
                            </select>
                        </div>

                        <div className="tip-box">
                            对于以上参数的描述，参见<a href="https://docs.ultralytics.com/zh/modes/train/#train-settings">https://docs.ultralytics.com/zh/modes/train/#train-settings</a>
                            <br />
                            如果您不了解，那么通常情况下您不需要更改这些参数
                        </div>
                    </div>

                    <div className={`tab-content ${tabIndex === 5 ? "active" : "hidden"}`}>
                        <div className="form-group-title">
                            <h1 className="step-tag">5</h1>
                            <h1 className="title">配置确认</h1>
                        </div>

                        <div className="tip-box">
                            请检查以上所有配置信息无误后，点击“完成”开始创建任务。
                            <br />
                            <b>需要修改配置项？</b>点击对应的配置项以修改值。
                        </div>

                        <table className="config-table">
                            <tbody>
                                <tr onClick={() => setTabIndex(0)}>
                                    <td><strong>任务名称</strong></td>
                                    <td>{taskName}</td>
                                </tr>
                                <tr onClick={() => setTabIndex(0)}>
                                    <td><strong>任务描述</strong></td>
                                    <td>{taskDescription}</td>
                                </tr>
                                <tr onClick={() => setTabIndex(1)}>
                                    <td><strong>数据集路径</strong></td>
                                    <td>{datasetPath}</td>
                                </tr>
                                <tr onClick={() => setTabIndex(2)}>
                                    <td><strong>训练方式</strong></td>
                                    <td>{trainingType == 0 ? "微调预训练模型" : "自定义结构"}</td>
                                </tr>

                                {trainingType == 0 && selectedBaseModel && (
                                    <>
                                        <tr onClick={() => setTabIndex(3)}><td><strong>基准模型</strong></td><td>{selectedBaseModel.name}</td></tr>
                                        <tr onClick={() => setTabIndex(3)}><td><strong>模型大小</strong></td><td>{Math.round(selectedBaseModel.size / 1024 / 1024)} MB</td></tr>
                                    </>
                                )}

                                {trainingType == 1 && (
                                    <tr onClick={() => setTabIndex(3)}><td><strong>模型结构定义</strong></td><td><pre style={{ whiteSpace: 'pre-wrap' }}>{modelYamlFile}</pre></td></tr>
                                )}

                                <tr onClick={() => setTabIndex(3)}><td><strong>训练轮数</strong></td><td>{epochs}</td></tr>
                                <tr onClick={() => setTabIndex(3)}><td><strong>Batch Size</strong></td><td>{batchSize}</td></tr>
                                <tr onClick={() => setTabIndex(3)}><td><strong>图像尺寸</strong></td><td>{imgSize}</td></tr>
                                <tr onClick={() => setTabIndex(4)}><td><strong>训练设备</strong></td><td>{device}</td></tr>

                                {device === "gpu" && (
                                    <tr onClick={() => setTabIndex(4)}><td><strong>GPU Index</strong></td><td>{gpuCUDAIndex}</td></tr>
                                )}
                                {device === "gpu_idlefirst" && (
                                    <tr onClick={() => setTabIndex(4)}><td><strong>GPU 数量</strong></td><td>{gpuCUDANum}</td></tr>
                                )}

                                <tr onClick={() => setTabIndex(4)}><td><strong>训练种子</strong></td><td>{trainSeed || "默认(0)"}</td></tr>
                                <tr onClick={() => setTabIndex(4)}><td><strong>数据缓存位置</strong></td><td>{cache}</td></tr>
                            </tbody>
                        </table>
                    </div>

                    <div style={{ display: 'flex', gap: '20px', marginTop: '20px', marginBottom: '20px' }}>
                        <button className="btn" style={{ flex: '1' }} onClick={() => { setTabIndex(Math.max(tabIndex - 1, 0)) }}>上一步</button>
                        <button className="btn" style={{ flex: '1' }} onClick={() => { setTabIndex(Math.min(tabIndex + 1, tabIndexCount)) }}>
                            {tabIndex == tabIndexCount ? "完成" : "下一步"}
                        </button>
                        {canBackLastTab &&
                            <button className="btn" style={{ flex: '1' }} onClick={() => { setTabIndex(5) }}>返回配置确认</button>
                        }
                    </div>
                </div>
            );
        default:
            return (
                <div className="main">
                    <h1 className="page-title">训练任务</h1>
                    <p className="page-des">管理所有模型训练任务。</p>
                    <button className="btn sm" onClick={() => setPageUrl("tasks?type=newTask")} style={{ marginBottom: '10px' }}>新建训练任务</button>
                </div>
            );
    }
}

export default TasksPage;