import { useState, useEffect } from "react";
import { api } from "../api";
import { useRunningTasks } from "../contexts/TaskContext";
import { useToast } from "../contexts/ToastContext";
import { useConfirm } from "../contexts/ConfirmContext";
import CONFIGS from "../config";

function TasksPage({ setPageUrl, parameter }) {
    const [tasksList, setTasksList] = useState([]);

    const [datasetsList, setDatasetsList] = useState([]);
    const [modelList, setModelList] = useState([]);
    const [getModelListError, setGetModelListError] = useState("");

    const [tabIndex, setTabIndex] = useState(0);
    const tabIndexCount = 5;
    const [canBackLastTab, setCanBackLastTab] = useState(false);
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

    const [isUploading, setIsUploading] = useState(false);
    const [showDetailsInfo, setShowDetailsInfo] = useState([]);

    const [errorList, setErrorList] = useState([]);

    const { getRunningFilenames, refreshRunningTasks } = useRunningTasks();
    const runningTasksList = getRunningFilenames();

    // Toast 和 Confirm hooks
    const toast = useToast();
    const { confirm } = useConfirm();

    useEffect(() => {
        api.get("/ITraining/getAllTasks", { params: {} })
            .then(data => {
                console.log("获取训练任务:", data.data);
                setTasksList(data.data.tasks);
            })
            .catch(err => {
                console.error("获取训练任务失败:", err);
                toast.error('获取训练任务失败');
            });
    }, [])

    useEffect(() => {
        api.get("/IDataset/getAllDatasets", { params: {} })
            .then(data => {
                console.log("获取数据集:", data.data);
                setDatasetsList(data.data.datasets);
                if (!parameter.datasetPath && data.data.datasets.length > 0) {
                    setDatasetPath(data.data.datasets[0].path);
                }
            })
            .catch(err => {
                console.error("获取数据集失败:", err);
                toast.error('获取数据集失败');
            });
    }, [parameter.datasetPath])

    useEffect(() => {
        if (parameter.datasetPath) {
            console.log("自动加载数据集" + parameter.datasetPath);
            setDatasetPath(parameter.datasetPath);
        }
    }, [parameter.datasetPath])

    useEffect(() => {
        if (parameter.type === "newTask") {
            api.get("/ITraining/getAllBaseModelsFromGithub")
                .then(data => {
                    console.log("获取基础模型列表: " + JSON.stringify(data.data));

                    const models = data.data.models.filter(asset => asset.name.endsWith(".pt"));
                    setModelList(models);

                    if (models.length > 0) {
                        // 设置默认的模型是yolo11n.pt
                        setBaseModelID(196201276);
                    }

                    if (data.data.has_network_error || data.data.has_fileread_error) {
                        setGetModelListError(data.msg);
                    }
                })
                .catch(err => {
                    console.error("模型拉取失败: ", err);
                    setGetModelListError(err.message);
                });
        }
    }, [parameter.type]);

    useEffect(() => {
        const found = modelList.find(item => item.id === parseInt(baseModelID));
        setSelectedBaseModel(found || null);
    }, [baseModelID, modelList]);

    // 表单验证函数
    const validateForm = () => {
        const errors = [];

        if (taskName.trim() === "") {
            errors.push("taskName");
        }
        if (datasetPath === "") {
            errors.push("datasetPath");
        }
        if (epochs < 1) {
            errors.push("epochs");
        }
        if (batchSize < 1) {
            errors.push("batchSize");
        }
        if (imgSize < 1) {
            errors.push("imgSize");
        }
        if (device === "gpu" && gpuCUDAIndex === "") {
            errors.push("gpuCUDAIndex");
        }
        if (device === "gpu_idlefirst" && gpuCUDANum < 1) {
            errors.push("gpuCUDANum");
        }
        if (!(trainSeed === "" || /^\d+$/.test(String(trainSeed)))) {
            errors.push("trainSeed");
        }
        if (trainingType === "1" && modelYamlFile === "") {
            errors.push("modelYamlFile");
        }
        if (trainingType === "0" && !selectedBaseModel) {
            errors.push("baseModelID");
        }

        return errors;
    };

    useEffect(() => {
        if (tabIndex === 5) {
            setCanBackLastTab(true);
            const errors = validateForm();
            setErrorList(errors);
        }
    }, [tabIndex, taskName, datasetPath, epochs, batchSize, imgSize, device, gpuCUDAIndex, gpuCUDANum, trainSeed, trainingType, modelYamlFile, selectedBaseModel]);

    const createTask = () => {
        setIsUploading(true);

        const data = {
            taskName: taskName,   // 任务名称
            taskDescription: taskDescription,   // 任务描述
            datasetPath: datasetPath,   // 数据集路径
            trainingType: trainingType,   // 训练类型
            baseModelID: baseModelID,   // 基础模型ID
            modelYamlFile: modelYamlFile,   // 模型Yaml文件
            epochs: epochs,   // epochs
            batchSize: batchSize,   // batch_size
            imgSize: imgSize,   // 图像大小
            device: device,   // 设备
            gpuCUDAIndex: gpuCUDAIndex,   // cuda设备id
            gpuCUDANum: gpuCUDANum,   // cuda数量
            trainSeed: trainSeed || 0,   // 种子
            cache: cache   // 缓存位置
        };

        api.post("/ITraining/createTask", { data: data, params: {} })
            .then(data => {
                setIsUploading(false);
                if (data.code === 200) {
                    toast.success(data.msg || '任务创建成功');
                    setPageUrl("home");
                } else {
                    toast.error(data.msg || '创建失败');
                }
            })
            .catch(err => {
                toast.error("创建失败：" + err.message);
                setIsUploading(false);
            });
    };

    const startTask = async (filename, taskname, taskID) => {
        const confirmed = await confirm({
            title: '开始训练',
            message: '真的要开始训练该任务吗？',
            confirmText: '开始训练',
            cancelText: '取消'
        });

        if (confirmed) {
            console.log("开始训练任务: " + filename + " " + taskname);
            const data = {
                taskID: taskID,
                filename: filename,
                taskname: taskname
            };

            api.post("/ITraining/startTask", { data: data, params: {} })
                .then(data => {
                    if (data.code === 200) {
                        refreshRunningTasks();
                        setPageUrl(`tasksDetailed?filename=${filename}`);
                    } else {
                        toast.error(data.msg);
                    }
                })
                .catch(err => {
                    console.error("训练任务失败:", err);
                    toast.error('启动训练任务失败');
                });
        } else {
            console.log("用户取消开始训练操作");
        }
    }

    const deleteTask = async (path) => {
        const confirmed = await confirm({
            title: '删除任务',
            message: '真的要删除该训练任务吗？此操作不可恢复。',
            confirmText: '删除',
            cancelText: '取消',
            type: 'danger'
        });

        if (confirmed) {
            console.log("删除训练任务: " + path);
            const data = { path: path };

            api.post("/ITraining/deleteTask", { data: data, params: {} })
                .then(data => {
                    if (data.code === 200) {
                        toast.success(data.msg || '任务已删除');
                        setPageUrl("home");
                    } else {
                        toast.error(data.msg || '删除失败');
                    }
                })
                .catch(err => {
                    console.error("删除训练任务失败:", err);
                    toast.error('删除训练任务失败');
                });
        } else {
            console.log("用户取消删除操作");
        }
    };


    const renderCheckIcon = (key) => {
        return errorList.includes(key) ? (
            <span style={{ color: 'red', fontWeight: 'bold' }}>*</span>
        ) : "";
    };

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
                            <textarea id="taskDescription" value={taskDescription} rows={7} onChange={(e) => { setTaskDescription(e.target.value) }} placeholder="请输入任务描述"></textarea>
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
                                <div className={`card hover-enabled${trainingType === "0" ? " click" : ""}`} style={{ flex: '1' }} onClick={() => { setTrainingType("0") }}>
                                    <h1 className="title">直接微调官方模型</h1>
                                    <p>加载一个完整的、已训练的预训练模型（常用方式）</p>
                                </div>
                                <div className={`card hover-enabled${trainingType === "1" ? " click" : ""}`} style={{ flex: '1' }} onClick={() => { setTrainingType("1") }}>
                                    <h1 className="title">从头训练自定义结构</h1>
                                    <p className="des">从 <code>.yaml</code> 配置文件构建一个新模型（不含任何权重）</p>
                                </div>
                            </div>
                            <div className="tip-box">
                                {trainingType === "0" &&
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
                                {trainingType === "1" &&
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

                        {trainingType === "0" && !getModelListError &&
                            <>
                                <div className="form-group">
                                    <label htmlFor="baseModelID">选择基础模型</label>
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
                                        <strong>上传者</strong> <a href={selectedBaseModel.uploader.html_url} target="_blank">{selectedBaseModel.uploader.login}</a>
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
                                                    <a href="https://docs.ultralytics.com/zh/tasks/detect/" target="_blank">检测</a>
                                                </td>
                                                <td>
                                                    <code>.pt</code>
                                                    <br />
                                                    例: yolo11n.pt yolo11s.pt
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <a href="https://docs.ultralytics.com/zh/tasks/segment/" target="_blank">实例分割</a>
                                                </td>
                                                <td>
                                                    <code>-seg.pt</code>
                                                    <br />
                                                    例: yolo11n-seg.pt yolo11s-seg.pt
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <a href="https://docs.ultralytics.com/zh/tasks/pose/" target="_blank">姿势/关键点</a>
                                                </td>
                                                <td>
                                                    <code>-pose.pt</code>
                                                    <br />
                                                    例: yolo11n-pose.pt yolo11s-pose.pt
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <a href="https://docs.ultralytics.com/zh/tasks/obb/" target="_blank">定向检测</a>
                                                </td>
                                                <td>
                                                    <code>-obb.pt</code>
                                                    <br />
                                                    例: yolo11n-obb.pt yolo11s-obb.pt
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <a href="https://docs.ultralytics.com/zh/tasks/classify/" target="_blank">分类</a>
                                                </td>
                                                <td>
                                                    <code>-cls.pt</code>
                                                    <br />
                                                    例: yolo11n-cls.pt yolo11s-cls.pt
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        }

                        {getModelListError && (
                            <div className="tip-box">
                                <span style={{ color: 'var(--red-color)' }}>
                                    获取基础模型信息时出错: {getModelListError}
                                </span>
                            </div>
                        )}

                        {trainingType === "1" &&
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
                            对于以上参数的描述，参见<a href="https://docs.ultralytics.com/zh/modes/train/#train-settings" target="_blank">https://docs.ultralytics.com/zh/modes/train/#train-settings</a>
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

                        {device === "gpu" &&
                            <div className="form-group">
                                <label htmlFor="gpuCUDAIndex">设置CUDA设备编号（如有多个CUDA设备，请使用英文逗号","分割）</label>
                                <input type="text" id="gpuCUDAIndex" value={gpuCUDAIndex} onChange={(e) => { setGpuCUDAIndex(e.target.value) }} placeholder="例: 0,1,2" />
                            </div>
                        }

                        {device === "gpu_idlefirst" &&
                            <div className="form-group">
                                <label htmlFor="gpuCUDANum">设置CUDA设备数量</label>
                                <input type="number" id="gpuCUDANum" min="1" value={gpuCUDANum} onChange={(e) => setGpuCUDANum(parseInt(e.target.value))} />
                            </div>
                        }

                        <div className="tip-box">
                            对于训练设备相关，参见<a href="https://docs.ultralytics.com/zh/modes/train/#usage-examples" target="_blank">https://docs.ultralytics.com/zh/modes/train/#usage-examples</a>
                        </div>

                        <div className="form-group">
                            <label htmlFor="trainSeed">设置训练种子(seed，默认请留空)</label>
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
                            对于以上参数的描述，参见<a href="https://docs.ultralytics.com/zh/modes/train/#train-settings" target="_blank">https://docs.ultralytics.com/zh/modes/train/#train-settings</a>
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

                        {errorList.length !== 0 && (
                            <div className="tip-box">
                                请检查<span style={{ color: 'red', fontWeight: 'bold' }}>{errorList.map(key => CONFIGS.TASK_CONFIGURATION_ITEMS[key]).join(", ")}</span>配置项是否正确
                            </div>
                        )}

                        <table className="config-table">
                            <tbody>
                                <tr onClick={() => setTabIndex(0)}>
                                    <td>{renderCheckIcon("taskName")} <strong>任务名称</strong></td>
                                    <td>{taskName}</td>
                                </tr>
                                <tr onClick={() => setTabIndex(0)}>
                                    <td>{renderCheckIcon("taskDescription")} <strong>任务描述</strong></td>
                                    <td>{taskDescription || "无"}</td>
                                </tr>
                                <tr onClick={() => setTabIndex(1)}>
                                    <td>{renderCheckIcon("datasetPath")} <strong>数据集路径</strong></td>
                                    <td>{datasetPath}</td>
                                </tr>
                                <tr onClick={() => setTabIndex(2)}>
                                    <td>{renderCheckIcon("trainingType")} <strong>训练方式</strong></td>
                                    <td>{trainingType === "0" ? "微调预训练模型" : "自定义结构"}</td>
                                </tr>

                                {trainingType === "0" && selectedBaseModel ? (
                                    <>
                                        <tr onClick={() => setTabIndex(3)}>
                                            <td>{renderCheckIcon("baseModelID")} <strong>基础模型</strong></td>
                                            <td>{selectedBaseModel.name || "unknown"}</td>
                                        </tr>
                                        <tr onClick={() => setTabIndex(3)}>
                                            <td><strong>模型大小</strong></td>
                                            <td>{Math.round(selectedBaseModel.size / 1024 / 1024) || "0"} MB</td>
                                        </tr>
                                    </>
                                ) : (
                                    <>
                                        <tr onClick={() => setTabIndex(3)}>
                                            <td>{renderCheckIcon("baseModelID")} <strong>基础模型</strong></td>
                                            <td>您还未选择基础模型</td>
                                        </tr>
                                    </>
                                )}

                                {trainingType === "1" && (
                                    <tr onClick={() => setTabIndex(3)}>
                                        <td>{renderCheckIcon("modelYamlFile")} <strong>模型结构定义</strong></td>
                                        <td><pre style={{ whiteSpace: 'pre-wrap' }}>{modelYamlFile}</pre></td>
                                    </tr>
                                )}

                                <tr onClick={() => setTabIndex(3)}>
                                    <td>{renderCheckIcon("epochs")} <strong>训练轮数</strong></td>
                                    <td>{epochs}</td>
                                </tr>
                                <tr onClick={() => setTabIndex(3)}>
                                    <td>{renderCheckIcon("batchSize")} <strong>每批训练样本数量</strong></td>
                                    <td>{batchSize}</td>
                                </tr>
                                <tr onClick={() => setTabIndex(3)}>
                                    <td>{renderCheckIcon("imgSize")} <strong>图像尺寸</strong></td>
                                    <td>{imgSize}</td>
                                </tr>
                                <tr onClick={() => setTabIndex(4)}>
                                    <td>{renderCheckIcon("device")} <strong>训练设备</strong></td>
                                    <td>{device}</td>
                                </tr>

                                {device === "gpu" && (
                                    <tr onClick={() => setTabIndex(4)}>
                                        <td>{renderCheckIcon("gpuCUDAIndex")} <strong>CUDA设备编号</strong></td>
                                        <td>{gpuCUDAIndex}</td>
                                    </tr>
                                )}
                                {device === "gpu_idlefirst" && (
                                    <tr onClick={() => setTabIndex(4)}>
                                        <td>{renderCheckIcon("gpuCUDANum")} <strong>GPU 数量</strong></td>
                                        <td>{gpuCUDANum}</td>
                                    </tr>
                                )}

                                <tr onClick={() => setTabIndex(4)}>
                                    <td>{renderCheckIcon("trainSeed")} <strong>训练种子</strong></td>
                                    <td>{trainSeed || "默认(0)"}</td>
                                </tr>
                                <tr onClick={() => setTabIndex(4)}>
                                    <td>{renderCheckIcon("cache")} <strong>数据缓存位置</strong></td>
                                    <td>{cache}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div style={{ display: 'flex', gap: '20px', marginTop: '20px', marginBottom: '20px' }}>
                        <button className="btn" style={{ flex: '1' }} onClick={() => { setTabIndex(Math.max(tabIndex - 1, 0)) }}>上一步</button>
                        <button className="btn" style={{ flex: '1' }} onClick={() => {
                            if (tabIndex === tabIndexCount) {
                                createTask();
                            } else {
                                setTabIndex(Math.min(tabIndex + 1, tabIndexCount));
                            }
                        }}>
                            {isUploading ? "正在上传中" : ((tabIndex === tabIndexCount && !isUploading) ? "完成" : "下一步")}
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

                    {tasksList.map((task, index) => (
                        <div key={index} className="card" style={{ marginBottom: '10px' }}>
                            <p className="tag-group">
                                {runningTasksList.includes(task.__filename) &&
                                    <span className="tag turquoise" style={{ fontSize: '12px', marginRight: '5px' }}>
                                        训练中
                                    </span>
                                }
                                <span className="tag" style={{ fontSize: '12px', marginRight: '10px' }}>
                                    {CONFIGS.TRAINING_TYPE[task.trainingType]}
                                </span>
                            </p>
                            <p className="title">
                                {task.taskName}
                            </p>
                            <p className="dataset-des">{task.taskDescription || "无描述"}</p>
                            <p className="dataset-info">
                                创建时间: {new Date(task.createTime * 1000).toLocaleString()}
                                {showDetailsInfo.includes(index) &&
                                    <>
                                        <br />
                                        数据集: {task.datasetPath}
                                        <br />
                                        训练设备: {CONFIGS.DEVICE_TYPE[task.device]} {task.device === "gpu" ? `(CUDA 编号: ${task.gpuCUDAIndex})` : (task.device === "gpu_idlefirst" ? `(将要唤起的 GPU 数量: ${task.gpuCUDANum})` : "")}
                                        <br />
                                        训练轮数(epochs): {task.epochs}
                                        <br />
                                        每批训练样本数量(batch_size): {task.batchSize}
                                        <br />
                                        输入图像尺寸 (imgsz): {task.imgSize}
                                        <br />
                                        {task.trainingType === "0" && (
                                            <>
                                                基础模型ID: {task.baseModelID}
                                                <br />
                                                基础模型名称: {task.baseModelInfo.name}
                                                <br />
                                                基础模型大小: {Math.round(task.baseModelInfo.size / 1024 / 1024)} MB
                                                <br />
                                                模型下载量: {task.baseModelInfo.download_count}
                                                <br />
                                                模型上传者: <a href={task.baseModelInfo.uploader.html_url} target="_blank">{task.baseModelInfo.uploader.login}</a>
                                            </>
                                        )}
                                        {task.trainingType === "1" && (
                                            <>
                                                模型结构Yaml文件: {task.modelYamlFile}
                                            </>
                                        )}
                                    </>
                                }
                            </p>
                            <a className="dataset-info" style={{ marginRight: '10px' }} onClick={() => {
                                if (showDetailsInfo.includes(index)) {
                                    setShowDetailsInfo(prev => prev.filter(item => item !== index));
                                } else {
                                    setShowDetailsInfo(prev => [...prev, index]);
                                }
                            }}>
                                {showDetailsInfo.includes(index) ? <>隐藏详细</> : <>查看详情</>}
                            </a>
                            {!runningTasksList.includes(task.__filename) &&
                                <button className="btn sm" style={{ marginRight: '10px' }} onClick={() => { startTask(task.__filename, task.taskName, task.taskID) }}>
                                    启动训练
                                </button>
                            }
                            <button className="btn sm" style={{ marginRight: '10px' }} onClick={() => { setPageUrl(`tasksDetailed?filename=${task.__filename}`) }}>
                                进入任务页面
                            </button>
                            {!runningTasksList.includes(task.__filename) &&
                                <button className="btn sm r" onClick={() => { deleteTask(task.__filename) }}>删除训练任务</button>
                            }
                        </div>
                    ))}
                </div>
            );
    }
}

export default TasksPage;