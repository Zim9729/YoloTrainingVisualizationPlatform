import { useEffect, useMemo, useState } from "react";
import { api } from "../api";

function ExportForm({ parameter, setPageUrl, onExportStart }) {
  const [modelType, setModelType] = useState("best");
  const [availableWeights, setAvailableWeights] = useState([]);
  const [formats, setFormats] = useState(["onnx"]);
  const [imgsz, setImgSz] = useState(640);
  const [half, setHalf] = useState(false);
  const [simplify, setSimplify] = useState(false);
  const [opset, setOpset] = useState(12);
  const [device, setDevice] = useState("cpu");
  const [loading, setLoading] = useState(false);
  const [enableTriton, setEnableTriton] = useState(false);
  const [tritonRepoPath, setTritonRepoPath] = useState("");
  const [tritonModelName, setTritonModelName] = useState("");

  const taskID = parameter.taskID || "";
  const taskName = parameter.taskName || "";
  const outputDir = parameter.outputDir || "";

  useEffect(() => {
    // 获取该 task 的权重文件列表
    const fetchWeights = async () => {
      try {
        const res = await api.get("/IModel/getAllTrainedModel");
        const models = res?.data?.models || [];
        const norm = (s) => (s || "").toString().replace(/\\\\/g, "/");
        const qFolder = (() => { try { return norm(decodeURIComponent(parameter.folder || "")); } catch(_) { return norm(parameter.folder || ""); } })();
        const qTaskId = taskID ? String(taskID) : "";
        let targetModel = models.find(model => {
          const byTaskId = qTaskId && String(model.task_id) === qTaskId;
          const byFolder = qFolder && norm(model.folder) === qFolder;
          return byTaskId || byFolder;
        });
        if (!targetModel && models.length > 0) targetModel = models[0];
        const keys = targetModel ? Object.keys(targetModel.weights || {}) : [];
        const clean = keys.map(k => k.replace(/\.pt$/i, ""));
        setAvailableWeights(clean);
        if (clean.includes("best")) setModelType("best");
        else if (clean.includes("last")) setModelType("last");
        else if (clean.length > 0) setModelType(clean[0]);
      } catch (e) {
        console.error("获取权重失败", e);
        setAvailableWeights(["best", "last"]);
      }
    };
    fetchWeights();
  }, [parameter.folder, taskID]);

  const toggleFormat = (fmt) => {
    setFormats(prev => prev.includes(fmt) ? prev.filter(f => f !== fmt) : [...prev, fmt]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!taskID || !taskName || !outputDir || !modelType) {
      alert("参数不完整");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        taskID,
        taskName,
        outputDir,
        modelType,
        formats,
        imgsz,
        half,
        simplify,
        opset: opset || null,
        device,
        enableTriton,
        tritonRepoPath: enableTriton ? tritonRepoPath : null,
        tritonModelName: enableTriton ? tritonModelName : null,
      };
      const res = await api.post("/IModel/runModelExport", { data: payload });
      if (res.code === 200 && res.data?.exportKey) {
        onExportStart(res.data.exportKey);
      } else {
        alert(res.msg || "启动导出任务失败");
      }
    } catch (e) {
      alert("启动导出任务失败: " + (e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ padding: '14px' }}>
      <div className="form-group-title">
        <h1 className="step-tag nobg">1</h1>
        <h1 className="title">配置导出参数</h1>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="label">选择权重文件</label>
          <select value={modelType} onChange={(e)=>setModelType(e.target.value)}>
            {availableWeights.map(w => (
              <option key={w} value={w}>{w}.pt</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="label">导出格式</label>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {['onnx','torchscript','openvino','engine'].map(fmt => (
              <label key={fmt} style={{ display:'inline-flex', alignItems:'center', gap:'6px' }}>
                <input type="checkbox" checked={formats.includes(fmt)} onChange={()=>toggleFormat(fmt)} /> {fmt}
              </label>
            ))}
          </div>
        </div>

        <div className="form-group" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <label className="label">imgsz</label>
          <input type="number" value={imgsz} onChange={(e)=>setImgSz(e.target.value)} style={{ width: '120px' }} />

          <label className="label" style={{ marginLeft: '12px' }}>opset</label>
          <input type="number" value={opset} onChange={(e)=>setOpset(e.target.value)} style={{ width: '120px' }} />

          <label className="label" style={{ marginLeft: '12px' }}>device</label>
          <input type="text" placeholder="cpu 或 0,1" value={device} onChange={(e)=>setDevice(e.target.value)} style={{ width: '160px' }} />
        </div>

        <div className="form-group" style={{ display:'flex', gap:'16px' }}>
          <label style={{ display:'inline-flex', alignItems:'center', gap:'6px' }}>
            <input type="checkbox" checked={half} onChange={(e)=>setHalf(e.target.checked)} /> 半精度 (half)
          </label>
          <label style={{ display:'inline-flex', alignItems:'center', gap:'6px' }}>
            <input type="checkbox" checked={simplify} onChange={(e)=>setSimplify(e.target.checked)} /> 简化 (simplify)
          </label>
        </div>

        {/* Triton 集成选项 */}
        <div className="form-group">
          <label style={{ display:'inline-flex', alignItems:'center', gap:'6px', marginBottom:'8px' }}>
            <input type="checkbox" checked={enableTriton} onChange={(e)=>setEnableTriton(e.target.checked)} /> 
            启用 Triton 模型仓库集成
          </label>
          {enableTriton && (
            <div style={{ marginLeft:'20px', display:'flex', flexDirection:'column', gap:'8px' }}>
              <div>
                <label className="label">Triton 仓库路径</label>
                <input 
                  type="text" 
                  placeholder="/path/to/triton/model_repository" 
                  value={tritonRepoPath} 
                  onChange={(e)=>setTritonRepoPath(e.target.value)} 
                  style={{ width: '300px' }} 
                />
              </div>
              <div>
                <label className="label">模型名称前缀 (可选)</label>
                <input 
                  type="text" 
                  placeholder="留空则使用权重文件名" 
                  value={tritonModelName} 
                  onChange={(e)=>setTritonModelName(e.target.value)} 
                  style={{ width: '200px' }} 
                />
              </div>
            </div>
          )}
        </div>

        <div style={{ marginTop: '12px' }}>
          <button className={`btn ${loading ? 'disabled' : ''}`} disabled={loading} type="submit">
            {loading ? '启动中...' : '开始导出'}
          </button>
          <button type="button" className="btn sm" style={{ marginLeft: '10px' }} onClick={()=>setPageUrl('models?type=trained')}>返回</button>
        </div>
      </form>
    </div>
  );
}

export default ExportForm;
