import { useEffect, useState } from "react";

function SettingsPage({ setPageUrl }) {
  const [repo, setRepo] = useState("");
  const [imgsz, setImgsz] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    try {
      setRepo(localStorage.getItem('triton_repo_path') || "");
      setImgsz(localStorage.getItem('triton_default_imgsz') || "");
    } catch (_) {}
  }, []);

  const save = () => {
    try {
      localStorage.setItem('triton_repo_path', repo || "");
      if (imgsz && Number(imgsz) > 0) {
        localStorage.setItem('triton_default_imgsz', String(Number(imgsz)));
      } else {
        localStorage.removeItem('triton_default_imgsz');
      }
      setToast('已保存');
      setTimeout(() => setToast(""), 1500);
    } catch (e) {
      setToast('保存失败');
      setTimeout(() => setToast(""), 1500);
    }
  };

  return (
    <div className="main">
      <a href="#" onClick={() => setPageUrl("home")} style={{ textDecoration: 'none' }}>返回</a>
      <h1 className="page-title">设置</h1>
      <p className="page-des">全局默认参数</p>

      <div className="card" style={{ padding: '14px', maxWidth: 680 }}>
        <div className="form-group">
          <label className="label">Triton 模型仓库路径</label>
          <input type="text" value={repo} onChange={(e)=>setRepo(e.target.value)} placeholder="/path/to/triton/model_repository" style={{ width: '100%' }} />
        </div>
        <div className="form-group">
          <label className="label">默认 imgsz（可选，留空则使用导出参数或 640）</label>
          <input type="number" value={imgsz} onChange={(e)=>setImgsz(e.target.value)} placeholder="640" style={{ width: '160px' }} />
        </div>
        <button className="btn" onClick={save}>保存</button>
        {toast && (
          <span style={{ marginLeft: 10, color: 'var(--secondary-text-color)' }}>{toast}</span>
        )}
      </div>
    </div>
  );
}

export default SettingsPage;
