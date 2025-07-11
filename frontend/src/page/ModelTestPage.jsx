import { useState, useEffect } from "react";
import { api } from "../api";

function ModelTestPage({ setPageUrl, parameter }) {
    const [modelList, setModelList] = useState([]);
    const [modelName, setModelName] = useState("best.pt");
    const [inputPath, setInputPath] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (parameter?.weights) {
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
                outputDir: parameter.outputDir || "",
                inputPath: inputPath,
                inputType: "image",
                modelType: modelName.replace(".pt", "")
            }
        })
            .then(data => {
                console.log("启动测试任务成功: ", data);
                alert(data.msg);
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
}

export default ModelTestPage;
