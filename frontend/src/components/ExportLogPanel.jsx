import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import CONFIGS from "../config";
import Icon_Box_seam_fill from "../assets/icons/box-seam-fill.svg";

function ExportLogPanel({ visible, onClose, exportKey, parameter, setPageUrl }) {
  const [logText, setLogText] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [files, setFiles] = useState([]);
  const [meta, setMeta] = useState(null);
  const [toast, setToast] = useState("");
  const [registeredMap, setRegisteredMap] = useState({});

  const outputDir = useMemo(() => {
    // 优先使用后端返回的 output_dir，其次使用参数传入的
    return (meta && meta.output_dir) || parameter.outputDir || "";
  }, [meta, parameter.outputDir]);

  const formatBytes = (bytes) => {
    if (bytes === 0 || bytes == null) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const buildDownloadUrl = (outputDir, filePath) => {
    const qs = new URLSearchParams({ outputDir, filePath }).toString();
    return `${CONFIGS.API_BASE_URL}/IModel/downloadExportArtifact?${qs}`;
  };

  // 自动检测导出时的 imgsz（优先后端 meta.imgsz，其次页面参数，再次本地设置，最后默认 640）
  const detectedImgSz = useMemo(() => {
    const m = meta && Number(meta.imgsz);
    if (!Number.isNaN(m) && m > 0) return m;
    const p = parameter && Number(parameter.imgsz);
    if (!Number.isNaN(p) && p > 0) return p;
    try {
      const s = Number(localStorage.getItem('triton_default_imgsz'));
      if (!Number.isNaN(s) && s > 0) return s;
    } catch(_) {}
    return 640;
  }, [meta, parameter]);

  const supportsTriton = (f) => {
    const p = (f?.path || "").toLowerCase();
    return p.endsWith('.onnx') || p.endsWith('.plan') || p.endsWith('.engine') || p.endsWith('.pt');
  };

  const onRegisterToTriton = async (filePath) => {
    try {
      // 记住最近一次的 Triton 仓库路径
      const lastRepo = (() => { try { return localStorage.getItem('triton_repo_path') || ''; } catch(_) { return ''; } })();
      const repo = window.prompt('请输入 Triton 模型仓库路径', lastRepo);
      if (!repo) return;
      try { localStorage.setItem('triton_repo_path', repo); } catch(_) {}
      const name = window.prompt('可选：自定义模型名称（默认: <文件名>_<格式>）') || undefined;
      const res = await api.post('/IModel/registerExportArtifactToTriton', { data: {
        outputDir,
        filePath,
        tritonRepoPath: repo,
        tritonModelName: name,
        imgsz:  detectedImgSz,
      }});
      if (res.code === 200) {
        setToast('已注册到 Triton: ' + (res.data?.model_name || ''));
        // 更新注册标记
        setRegisteredMap((prev) => ({ ...prev, [filePath]: { registered: true, model_name: res.data?.model_name || '' } }));
      } else {
        setToast(res.msg || '注册失败');
      }
    } catch (e) {
      setToast('注册失败: ' + (e?.message || e));
    }
    setTimeout(() => setToast("") , 1800);
  };

  const refreshRegistered = async () => {
    try {
      const repo = (() => { try { return localStorage.getItem('triton_repo_path') || ''; } catch(_) { return ''; } })();
      if (!repo) return;
      if (!outputDir) return;
      const res = await api.post('/IModel/listRegisteredExportArtifacts', { data: { outputDir, tritonRepoPath: repo } });
      if (res.code === 200 && Array.isArray(res.data?.items)) {
        const map = {};
        res.data.items.forEach(it => { map[it.filePath] = { registered: !!it.registered, model_name: it.model_name }; });
        setRegisteredMap(map);
      }
    } catch (_) { /* ignore */ }
  };

  const renderFiles = () => {
    if (!Array.isArray(files) || files.length === 0) {
      return <div className="tip-box">暂无导出产物</div>;
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {files.map((f, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '6px 0', borderBottom: '1px dashed var(--border-color)' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, wordBreak: 'break-all' }}>{f.path}</div>
              <div style={{ color: 'var(--secondary-text-color)', fontSize: '12px' }}>
                {formatBytes(f.size)} · {new Date((f.mtime||0)*1000).toLocaleString()} · {f.mime}
                {registeredMap[f.path]?.registered && (
                  <span
                    style={{
                      marginLeft: 8,
                      background: '#1f883d',
                      color: '#ffffff',
                      borderRadius: '999px',
                      padding: '2px 10px',
                      fontSize: '12px',
                      lineHeight: 1.6,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'help',
                      border: '1px solid rgba(0,0,0,0.15)',
                      boxShadow: '0 0 0 2px rgba(31,136,61,0.15)',
                      fontWeight: 700,
                    }}
                    title={`模型名称: ${registeredMap[f.path]?.model_name || ''}`}
                  >
                    <span style={{ fontWeight: 700 }}>✓</span>
                    已注册
                  </span>
                )}
                {!registeredMap[f.path]?.registered && supportsTriton(f) && (
                  <span
                    role="button"
                    onClick={() => onRegisterToTriton(f.path)}
                    style={{
                      marginLeft: 8,
                      background: '#e2e8f0',
                      color: '#334155',
                      borderRadius: '999px',
                      padding: '2px 10px',
                      fontSize: '12px',
                      lineHeight: 1.6,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      border: '1px solid rgba(0,0,0,0.10)'
                    }}
                    title="未注册，点击一键注册到 Triton"
                  >
                    <span style={{
                      width: 6,
                      height: 6,
                      background: '#94a3b8',
                      borderRadius: '50%',
                      display: 'inline-block'
                    }} />
                    未注册
                  </span>
                )}
              </div>
            </div>
            <div style={{ whiteSpace: 'nowrap', display: 'flex', gap: '8px' }}>
              <a className="btn sm" href={buildDownloadUrl(outputDir, f.path)} target="_blank" rel="noreferrer">下载</a>
              {supportsTriton(f) && (
                <button className="btn sm" onClick={() => onRegisterToTriton(f.path)}>注册到Triton</button>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  useEffect(() => {
    if (!visible || !exportKey) return;
    let timer = null;
    let mounted = true;

    const poll = async () => {
      try {
        const res = await api.get(`/IModel/getExportTaskLog?exportKey=${encodeURIComponent(exportKey)}`);
        if (!mounted) return;
        if (res.code === 200 && res.data) {
          setLogText(res.data.log || "");
          setIsRunning(!!res.data.is_running);
          setMeta(res.data.meta || null);
        }
      } catch (e) {
        // 若实时任务不存在（404），尝试读取历史日志
        try {
          const res2 = await api.get(`/IModel/getExportHistoryLog?outputDir=${encodeURIComponent(outputDir)}&exportKey=${encodeURIComponent(exportKey)}`);
          if (!mounted) return;
          if (res2.code === 200 && res2.data) {
            setLogText(res2.data.log || "");
            setIsRunning(false);
          }
        } catch (_) {
          if (mounted) {
            // 静默
          }
        }
      }
    };

    poll();
    timer = setInterval(poll, 1000);

    // 初始加载时尝试刷新注册标记
    refreshRegistered();

    return () => {
      mounted = false;
      if (timer) clearInterval(timer);
    };
  }, [visible, exportKey]);

  // 轮询导出产物列表
  useEffect(() => {
    if (!visible || !outputDir) return;
    let timer = null;
    let mounted = true;

    const pollFiles = async () => {
      try {
        const res = await api.get(`/IModel/listExportArtifacts?outputDir=${encodeURIComponent(outputDir)}`);
        if (!mounted) return;
        if (res.code === 200 && res.data?.files) {
          setFiles(res.data.files);
        }
      } catch (e) {
        if (mounted) {
          // 静默失败
        }
      }
    };

    pollFiles();
    // 运行中每2秒刷新一次，结束后不再自动轮询
    if (isRunning) {
      timer = setInterval(pollFiles, 2000);
    }

    return () => {
      mounted = false;
      if (timer) clearInterval(timer);
    };
  }, [visible, outputDir, isRunning]);

  if (!visible) return null;

  return (
    <div style={{ marginTop: '20px' }}>
      <div className="form-group-title">
        <h1 className="step-tag nobg">
          <img src={Icon_Box_seam_fill} className="icon" />
        </h1>
        <h1 className="title">导出日志</h1>
      </div>
      <div style={{
        border: '1px solid var(--border-color)',
        borderRadius: '6px',
        padding: '12px',
        background: 'var(--card-bg)',
        maxHeight: '320px',
        overflow: 'auto',
        whiteSpace: 'pre-wrap',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        fontSize: '13px'
      }}>
        {logText || '等待日志...'}
      </div>
      {/* 产物浏览 */}
      <div id="export-artifacts" className="form-group-title" style={{ marginTop: '16px' }}>
        <h1 className="step-tag nobg">2</h1>
        <h1 className="title">导出产物</h1>
        <div style={{ marginLeft: 'auto' }}>
          <button className="btn sm" onClick={() => setPageUrl('settings')}>设置</button>
          <button className="btn sm" style={{ marginLeft: 8 }} onClick={refreshRegistered}>刷新标记</button>
        </div>
      </div>
      {!outputDir && (
        <div className="tip-box">未识别到输出目录</div>
      )}
      {outputDir && (
        <div className="list-card" style={{ padding: '10px' }}>
          {renderFiles()}
        </div>
      )}
      {toast && (
        <div className="tip-box" style={{ marginTop: '8px' }}>{toast}</div>
      )}
      <div style={{ display: 'flex', gap: '10px', marginTop: '10px', alignItems: 'center' }}>
        <span style={{ color: 'var(--secondary-text-color)' }}>
          状态：{isRunning ? '运行中' : '已结束'}
        </span>
        {!isRunning && (
          <>
            <button className="btn sm" onClick={() => setPageUrl("models?type=trained")}>
              返回训练模型列表
            </button>
          </>
        )}
        <button className="btn sm" onClick={onClose}>收起</button>
      </div>
    </div>
  );
}

export default ExportLogPanel;
