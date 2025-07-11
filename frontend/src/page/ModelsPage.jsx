import { useEffect, useState } from "react";
import { api } from "../api";

function ModelsPage({ setPageUrl, parameter }) {
    const [localModelList, setLocalModelList] = useState([]);
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
    }, []);

    useEffect(() => {
        if (parameter.type == "base") {
            setShowModelType(0);
        } else if (parameter.type == "local") {
            console.log(1);
            setShowModelType(1);
        }
    }, [parameter.type]);

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

            {localModelList.map((item, index) => (
                <div key={index} className="card">
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
            ))}
        </div>
    );
}

export default ModelsPage;