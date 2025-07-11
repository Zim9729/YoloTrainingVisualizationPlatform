import { api } from "../api";
import { useState, useEffect } from "react";
import CONFIGS from "../config";

import Logo_Coco from "../assets/logo/coco_sm.png";
import Logo_Ultralytics from "../assets/logo/ultralytics.svg";

function uploadDataset({ setPageUrl, datasetType, includeYaml, trainPath, valPath, testPath, nc, names }) {
    const formData = new FormData();

    const name = document.getElementById("datasetName").value;
    const description = document.getElementById("datasetDescription").value;
    const version = document.getElementById("datasetVersion").value;
    const file = document.querySelector('input[type="file"]').files[0];

    formData.append("name", name);
    formData.append("description", description);
    formData.append("version", version);
    formData.append("type", datasetType);
    formData.append("include_yaml", includeYaml);
    formData.append("file", file);

    if (includeYaml == 0) {
        formData.append("train", trainPath);
        formData.append("val", valPath);
        formData.append("test", testPath || "");
        formData.append("nc", nc);
        formData.append("names", names);
    }

    fetch(`${CONFIGS.API_BASE_URL}/IDataset/uploadDataset`, {
        method: "POST",
        body: formData,
    })
        .then(async res => {
            if (!res.ok) throw await res.text();
            return res.json();
        })
        .then(data => {
            alert(data.msg);
            if (data.code == 200) setPageUrl("home");
        })
        .catch(err => {
            alert("上传失败：" + err);
            console.error("上传失败：", err);
        });
}

function DatasetPage({ setPageUrl, parameter }) {
    const [datasetsList, setDatasetsList] = useState([]);
    const [datasetType, setDatasetType] = useState("yolo");
    const [includeYaml, setIncludeYaml] = useState(1);
    const [trainPath, setTrainPath] = useState("");
    const [valPath, setValPath] = useState("");
    const [testPath, setTestPath] = useState("");
    const [nc, setNc] = useState(1);
    const [names, setNames] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [showDetailsInfo, setShowDetailsInfo] = useState([]);

    useEffect(() => {
        api.get("/IDataset/getAllDatasets", { params: {} })
            .then(data => {
                console.log("获取数据集:", data.data);
                setDatasetsList(data.data.datasets);
            })
            .catch(err => {
                console.error("获取数据集失败:", err);
                alert(err);
            });
    }, []);

    const deleteDataset = (path) => {
        if (confirm("您真的要删除该数据集吗？")) {
            console.log("删除数据集: " + path);
            const data = {
                path: path
            };

            api.post("/IDataset/deleteDataset", { data: data, params: {} })
                .then(data => {
                    alert(data.msg);
                    if (data.code == 200) setPageUrl("home");
                })
                .catch(err => {
                    console.error("删除数据集失败:", err);
                    alert(err);
                });
        } else {
            console.log("用户取消删除操作");
        }
    };

    switch (parameter.type) {
        case "uploadDataset":
            return (
                <div className="main">
                    <h1 className="page-title">上传数据集</h1>
                    <p className="page-des">上传数据集以供模型使用</p>

                    <div className="form-group">
                        <label htmlFor="datasetName">数据集名称</label>
                        <input type="text" id="datasetName" placeholder="请输入数据集名称" />
                    </div>

                    <div className="form-group">
                        <label htmlFor="datasetDescription">数据集描述</label>
                        <textarea id="datasetDescription" placeholder="请输入数据集描述"></textarea>
                    </div>

                    <div className="form-group">
                        <label htmlFor="datasetVersion">数据集版本</label>
                        <input type="text" id="datasetVersion" placeholder="请输入数据集版本" defaultValue={"v1.0.0"} />
                    </div>

                    <div className="form-group">
                        <label htmlFor="datasetType">选择数据集格式</label>
                        <div style={{ display: 'flex', gap: '20px' }}>
                            <div className={`card hover-enabled${datasetType == "yolo" ? " click" : ""}`} style={{ flex: '1' }} onClick={() => { setDatasetType("yolo") }}>
                                <h1 className="title mb12">
                                    <img src={Logo_Ultralytics} className="invert_w" style={{ height: '22px', marginRight: '12px', marginBottom: '-4px' }} />
                                    YOLO 格式
                                </h1>
                            </div>
                            <div className={`card hover-enabled${datasetType == "coco" ? " click" : ""}`} style={{ flex: '1' }} onClick={() => { setDatasetType("coco") }}>
                                <h1 className="title mb12">
                                    <img src={Logo_Coco} style={{ height: '22px', marginRight: '12px', marginBottom: '-4px' }} />
                                    COCO 格式
                                </h1>
                            </div>
                            <div className={`card hover-enabled${datasetType == "null" ? " click" : ""}`} style={{ flex: '1' }} onClick={() => { setDatasetType("null") }}>
                                <h1 className="title mb12">
                                    其他格式
                                </h1>
                            </div>
                        </div>
                    </div>
                    <div className="tip-box">
                        {datasetType != "null" && <div>
                            对于 {datasetType} 数据集格式，详细请见
                            {datasetType == "yolo" && <a href="https://docs.ultralytics.com/zh/datasets/detect/" target="_blank">https://docs.ultralytics.com/zh/datasets/detect/</a>}
                            {datasetType == "coco" && <a href="https://docs.ultralytics.com/zh/datasets/detect/coco/" target="_blank">https://docs.ultralytics.com/zh/datasets/detect/coco/</a>}。
                        </div>}
                        {datasetType == "null" && <div>
                            对于您自定义的数据集格式，请参见<a href="https://docs.ultralytics.com/zh/datasets/detect/" target="_blank">https://docs.ultralytics.com/zh/datasets/detect/</a>的要求。
                            <br />
                            我们无法对自定义数据集进行分析，部分参数无法在页面上显示。
                            <br />
                            请确保您的数据集压缩包中包含 <code>.yaml</code> 文件，并且格式正确。
                        </div>}
                    </div>

                    {datasetType != "null" &&
                        <div>
                            <div className="form-group">
                                <label htmlFor="includeYaml">是否包含Yaml文件</label>
                                <select id="datasetType" value={includeYaml} onChange={(e) => setIncludeYaml(e.target.value)}>
                                    <option value="1">包含</option>
                                    <option value="0">不包含</option>
                                </select>
                            </div>

                            {includeYaml == "1" &&
                                <div className="tip-box">
                                    <p>
                                        请确保您的 <code>.yaml</code> 文件格式正确，即包含以下字段:
                                    </p>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>字段</th>
                                                <th>类型</th>
                                                <th>说明</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td>train</td>
                                                <td>str</td>
                                                <td>训练集图像路径（可以是文件夹或 <code>.txt</code> 路径列表）</td>
                                            </tr>
                                            <tr>
                                                <td>val</td>
                                                <td>str</td>
                                                <td>验证集图像路径（同上）</td>
                                            </tr>
                                            <tr>
                                                <td>nc</td>
                                                <td>int</td>
                                                <td>类别总数（必须与 <code>names</code> 数量一致）</td>
                                            </tr>
                                            <tr>
                                                <td>names</td>
                                                <td>list[str]</td>
                                                <td>类别名称列表，索引即为标签 ID（如 0 表示第一个名字）</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            }

                            {includeYaml == "0" && (
                                <div className="manual-yaml-input">
                                    <div className="tip-box">
                                        请手动填写 <code>.yaml</code> 文件所需信息（路径请使用压缩包内的<b>相对路径</b>）
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="trainPath">训练集路径</label>
                                        <input type="text" id="trainPath" placeholder="如：train/images" value={trainPath} onChange={(e) => setTrainPath(e.target.value)} />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="valPath">验证集路径</label>
                                        <input type="text" id="valPath" placeholder="如：val/images" value={valPath} onChange={(e) => setValPath(e.target.value)} />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="testPath">测试集路径（可选）</label>
                                        <input type="text" id="testPath" placeholder="如：test/images" value={testPath} onChange={(e) => setTestPath(e.target.value)} />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="nc">类别总数 (nc)</label>
                                        <input type="number" id="nc" min="1" value={nc} onChange={(e) => setNc(parseInt(e.target.value))} />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="names">类别名称（请使用英文逗号","分割）</label>
                                        <input type="text" id="names" placeholder="如：cat,dog,person" value={names} onChange={(e) => setNames(e.target.value)} />
                                    </div>
                                </div>
                            )}

                        </div>
                    }

                    <div className="form-group">
                        <label htmlFor="datasetFile">上传数据集压缩包 (.zip)</label>
                        <input type="file" accept=".zip" />
                    </div>

                    {datasetType != "null" &&
                        <div className="tip-box">
                            {datasetType == "yolo" &&
                                <>
                                    <p>
                                        Yolo 数据集压缩包格式示例:
                                    </p>
                                    <pre>
                                        <code>
                                            your_dataset/<br />
                                            ├── images/<br />
                                            │   └── train/, val/<br />
                                            ├── labels/<br />
                                            │   └── train/, val/<br />
                                            ├── dataset.yaml<br />
                                        </code>
                                    </pre>
                                </>}
                            {datasetType == "coco" &&
                                <>
                                    <p>
                                        COCO 数据集压缩包格式示例
                                    </p>
                                    <pre>
                                        <code>
                                            your_dataset/<br />
                                            ├── images/<br />
                                            │   └── train/, val/<br />
                                            ├── annotations/<br />
                                            │   └── instances_train.json<br />
                                            ├── dataset.yaml<br />
                                        </code>
                                    </pre>
                                </>}
                        </div>
                    }

                    <button className="btn sm upload-btn" onClick={() => {
                        setIsUploading(true);
                        uploadDataset({ setPageUrl, datasetType, includeYaml, trainPath, valPath, testPath, nc, names });
                    }}>
                        {isUploading ? (<>正在上传中</>) : (<>上传数据集</>)}
                    </button>
                </div>
            );
        default:
            return (
                <div className="main">
                    <h1 className="page-title">数据集</h1>
                    <p className="page-des">查看和管理您的数据集。</p>
                    <button className="btn sm" onClick={() => setPageUrl("dataset?type=uploadDataset")} style={{ marginBottom: '10px' }}>上传数据集</button>
                    {datasetsList.map((dataset, index) => (
                        <div key={index} className="card" style={{ marginBottom: '10px' }}>
                            <p className="tag-group">
                                <span className="tag" style={{ fontSize: '12px', marginRight: '10px' }}>{CONFIGS.DATASET_TYPE[dataset.platform_info.type]}</span>
                            </p>
                            <p className="title">
                                {dataset.platform_info.name} ({dataset.platform_info.version})
                            </p>
                            <p className="dataset-des">{dataset.platform_info.description || "无描述"}</p>
                            <p className="dataset-info">
                                标记数量: {dataset.yaml_info.num_classes}
                                <br />
                                创建时间: {new Date(dataset.platform_info.created_at * 1000).toLocaleString()}
                                <br />
                                {dataset.platform_info.type != "null" && showDetailsInfo.includes(index) &&
                                    <>
                                        数据集路径: {dataset.path}
                                        <br />
                                        标记类别: {dataset.yaml_info.class_names.join(', ')}
                                        <br />
                                        训练集图片数量: {dataset.yaml_info.train_img_count}
                                        <br />
                                        训练集标注数量: {dataset.yaml_info.train_label_count}
                                        <br />
                                        {(dataset.yaml_info.train_img_count == 0 || dataset.yaml_info.train_label_count == 0) &&
                                            <span>Tip: 训练集图片/标注数量为0可能是因为格式有误，如您确定数据集内包含数据，请检查您的数据集格式是否正确。</span>
                                        }
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
                            <button className="btn sm" style={{ marginRight: '10px' }} onClick={() => { setPageUrl(`tasks?type=newTask&datasetPath=${dataset.path}`) }}>从该数据集开始创建任务</button>
                            <button className="btn sm r" onClick={() => { deleteDataset(dataset.path) }}>删除数据集</button>
                        </div>
                    ))}
                </div>
            );
    }
}

export default DatasetPage;