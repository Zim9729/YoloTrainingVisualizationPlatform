import { useState, useRef } from "react";
import { api } from "../api";

function TestForm({ 
    modelList, 
    parameter, 
    setPageUrl, 
    onTestStart 
}) {
    const [modelName, setModelName] = useState("best.pt");
    const [inputPath, setInputPath] = useState("");
    const [loading, setLoading] = useState(false);
    const [browseBusy, setBrowseBusy] = useState(false);
    const [hasElectron, setHasElectron] = useState(false);
    const fileInputRef = useRef(null);

    // 检测Electron环境
    useState(() => {
        try {
            setHasElectron(!!(window && window.electronAPI && window.electronAPI.selectFile));
        } catch (_) {
            setHasElectron(false);
        }
    }, []);

    const handleStartTest = async () => {
        if (!inputPath || !modelName) {
            alert("请填写文件路径和选择模型");
            return;
        }

        setLoading(true);

        try {
            const data = await api.post("/IModel/runModelTest", {
                data: {
                    taskID: parameter.taskID,
                    taskName: parameter.taskName,
                    outputDir: parameter.outputDir || "",
                    inputPath: inputPath,
                    inputType: "image",
                    modelType: modelName.replace(".pt", "")
                }
            });

            console.log("启动测试任务成功: ", data);
            alert(data.msg);
            
            if (data.code === 200 && data.data?.filename && onTestStart) {
                onTestStart(data.data.filename);
            }
        } catch (err) {
            console.error("启动测试任务失败:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleBrowseClick = async () => {
        if (browseBusy) return;
        try {
            if (!window?.electronAPI?.selectFile) {
                if (fileInputRef.current) {
                    fileInputRef.current.click();
                }
                return;
            }
            setBrowseBusy(true);
            const filePath = await window.electronAPI.selectFile();
            if (filePath) {
                setInputPath(filePath);
            }
        } catch (e) {
            console.error("打开文件选择器失败:", e);
        } finally {
            setBrowseBusy(false);
        }
    };

    const handleFileSelected = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            setBrowseBusy(true);
            const fd = new FormData();
            fd.append("file", file);
            const res = await api.upload("/IModel/uploadTestInput", fd);
            if (res.code === 200 && res.data?.path) {
                setInputPath(res.data.path);
            } else {
                alert(res.msg || "上传失败");
            }
        } catch (err) {
            console.error("上传测试文件失败", err);
            alert("上传失败");
        } finally {
            setBrowseBusy(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const buildHistoryUrl = () => {
        try {
            const ts = parseInt(parameter.folder?.split('_')?.[2] || '0');
            const startedAtStr = ts ? new Date(ts * 1000).toLocaleString() : '';
            return `modelTest?taskName=${encodeURIComponent(parameter.taskName || '')}&startedAt=${encodeURIComponent(startedAtStr)}&folder=${encodeURIComponent(parameter.folder || '')}&open=test`;
        } catch (e) {
            return `modelTest?taskName=${encodeURIComponent(parameter.taskName || '')}&folder=${encodeURIComponent(parameter.folder || '')}&open=test`;
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
                    <button className="btn sm" onClick={handleBrowseClick} disabled={browseBusy}>
                        浏览...
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp"
                        style={{ display: 'none' }}
                        onChange={handleFileSelected}
                    />
                </div>
                {!hasElectron && (
                    <div className="tip-box" style={{ marginTop: '8px' }}>
                        浏览器环境已支持上传测试图片：点击"浏览..."选择文件将自动上传后进行测试。
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn primary" onClick={handleStartTest} disabled={loading || !inputPath}>
                    {loading ? "测试中..." : "开始测试"}
                </button>
                <button className="btn" onClick={() => setPageUrl(buildHistoryUrl())}>
                    查看测试历史记录
                </button>
            </div>
        </div>
    );
}

export default TestForm;
