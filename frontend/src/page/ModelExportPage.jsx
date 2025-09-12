import { useCallback, useEffect, useMemo, useState } from "react";
import ExportForm from "../components/ExportForm";
import ExportLogPanel from "../components/ExportLogPanel";
import { api } from "../api";

function ModelExportPage({ setPageUrl, parameter }) {
  const [exportKey, setExportKey] = useState("");
  const [showLog, setShowLog] = useState(false);
  const [history, setHistory] = useState([]);
  const [deletingKey, setDeletingKey] = useState("");

  const outputDir = useMemo(() => parameter.outputDir || "", [parameter.outputDir]);

  const handleExportStart = useCallback((key) => {
    setExportKey(key);
    setShowLog(true);
  }, []);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!outputDir) return;
      try {
        const res = await api.get(`/IModel/getExportHistory?outputDir=${encodeURIComponent(outputDir)}`);
        if (res.code === 200) {
          setHistory(Array.isArray(res.data?.history) ? res.data.history : []);
        }
      } catch (e) {
        // ignore
      }
    };
    fetchHistory();
  }, [outputDir]);

  const handleDeleteHistory = async (exportKey) => {
    if (!outputDir || !exportKey) return;
    if (!confirm && typeof window !== 'undefined') {
      // if confirm is undefined in environment, skip prompt
    } else {
      const ok = window.confirm('确定删除该导出历史及其日志文件吗？');
      if (!ok) return;
    }
    try {
      setDeletingKey(exportKey);
      const res = await api.post('/IModel/deleteExportHistory', { data: { outputDir, exportKey } });
      if (res.code === 200) {
        // refresh
        const res2 = await api.get(`/IModel/getExportHistory?outputDir=${encodeURIComponent(outputDir)}`);
        if (res2.code === 200) {
          setHistory(Array.isArray(res2.data?.history) ? res2.data.history : []);
        }
      } else {
        alert(res.msg || '删除失败');
      }
    } catch (e) {
      alert('删除失败: ' + (e?.message || e));
    } finally {
      setDeletingKey("");
    }
  };

  return (
    <div className="main">
      <a href="#" onClick={() => setPageUrl("models?type=trained")} style={{ textDecoration: 'none' }}>返回</a>
      <h1 className="page-title">模型导出 / 转换</h1>
      <p className="page-des">任务「{parameter.taskName}」 - 选择权重与导出格式</p>

      {/* 历史记录 */}
      <div className="card" style={{ padding: '14px', marginBottom: '12px' }}>
        <div className="form-group-title">
          <h1 className="step-tag nobg">0</h1>
          <h1 className="title">历史导出记录</h1>
        </div>
        {!outputDir && <div className="tip-box">未提供输出目录，无法加载历史记录</div>}
        {outputDir && (
          <div className="list-card" style={{ padding: '10px' }}>
            {Array.isArray(history) && history.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {history.map((h, idx) => (
                  <div key={idx} style={{ borderBottom: '1px dashed var(--border-color)', padding: '6px 0' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:'10px' }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:600, wordBreak:'break-all' }}>{h.model_choice || 'best'}.pt → {Array.isArray(h.formats) ? h.formats.join(', ') : ''}</div>
                        <div style={{ color:'var(--secondary-text-color)', fontSize:'12px' }}>
                          {new Date((h.startedAt||0) * 1000).toLocaleString()} · exportKey: {h.exportKey}
                        </div>
                      </div>
                      <div style={{ whiteSpace:'nowrap', display:'flex', gap:'8px' }}>
                        <button className="btn sm" onClick={() => { setExportKey(h.exportKey); setShowLog(true); }}>查看历史记录</button>
                        <button className={`btn sm danger ${deletingKey===h.exportKey?'disabled':''}`} disabled={deletingKey===h.exportKey}
                          onClick={() => handleDeleteHistory(h.exportKey)}>
                          {deletingKey===h.exportKey ? '删除中...' : '删除历史记录'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="tip-box">暂无历史记录</div>
            )}
          </div>
        )}
      </div>

      <ExportForm parameter={parameter} setPageUrl={setPageUrl} onExportStart={handleExportStart} />

      <ExportLogPanel visible={showLog} onClose={() => setShowLog(false)} exportKey={exportKey} parameter={parameter} setPageUrl={setPageUrl} />
    </div>
  );
}

export default ModelExportPage;
