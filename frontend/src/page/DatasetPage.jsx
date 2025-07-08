import { api } from "../api";
import { useState, useEffect } from "react";
import CONFIGS from "../config";

function uploadDataset() {
    api.get("/IDataset/uploadDataset", { params: {} })
        .then(data => {
            console.log("上传数据集:", data.data);
            alert("数据集上传成功");
            window.location.reload();
        })
        .catch(err => {
            console.error("上传数据集失败:", err);
            alert(err);
        });
}

function DatasetPage({ setPageUrl, parameter }) {
    const [datasetsList, setDatasetsList] = useState([]);

    useState(() => {
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

    return (
        <div className="main">
            <h1 className="page-title" style={{ marginBottom: '-13px' }}>📁 数据集</h1>
            <p className="page-des">在这里，您可以查看和管理您的数据集。</p>
            <button className="btn sm" onClick={() => uploadDataset()} style={{ marginBottom: '10px' }}>上传数据集</button>
            {datasetsList.map((dataset, index) => (
                <div key={index} className="card">
                    <p className="title" style={{ fontWeight: 'bold' }}>{dataset.platform_info.name} ({dataset.platform_info.version})</p>
                    <p className="dataset-des">{dataset.platform_info.description || "无描述"}</p>
                    <p className="dataset-info">
                        数据集路径: {dataset.path}
                        <br />
                        创建时间: {new Date(dataset.platform_info.created_at * 1000).toLocaleString()}
                        <br />
                        标记数量: {dataset.yaml_info.num_classes}
                        <br />
                        训练集图片数量: {dataset.yaml_info.train_img_count}
                        <br />
                        训练集标注数量: {dataset.yaml_info.train_label_count}
                    </p>
                </div>
            ))}
        </div>
    );
}

export default DatasetPage;