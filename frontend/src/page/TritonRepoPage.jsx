import { useEffect, useMemo, useState } from "react";
import { api } from "../api";

function TritonRepoPage({ setPageUrl, embedded = false }) {
  const [repo, setRepo] = useState("");
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [toast, setToast] = useState("");
  // 展开状态： { [modelName]: { open: boolean, files: { [version]: FileItem[] }, loading: { [version]: boolean } } }
  const [expanded, setExpanded] = useState({});
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("name"); // name | config | versions
  const [openMenuModel, setOpenMenuModel] = useState(null); // 当前展开的模型更多菜单
  const [openMenuVersion, setOpenMenuVersion] = useState({}); // { [modelName]: version }

  // UI helpers
  const Chip = ({ color = '#64748b', bg = '#e2e8f0', children, title }) => (
    <span
      title={title}
      style={{
        display:'inline-flex', alignItems:'center', gap:6,
        background: bg, color, borderRadius: 999,
        padding: '2px 8px', fontSize: 12, lineHeight: 1.6,
        border: '1px solid rgba(0,0,0,0.06)'
      }}
    >{children}</span>
  );
  const IconDot = ({ color = '#94a3b8' }) => (
    <span style={{ width:6, height:6, background: color, borderRadius:'50%', display:'inline-block' }} />
  );

  useEffect(() => {
    try { setRepo(localStorage.getItem('triton_repo_path') || ""); } catch(_) {}
  }, []);

  const load = async () => {
    setErr("");
    setLoading(true);
    try {
      if (!repo) {
        setModels([]);
      } else {
        const qs = new URLSearchParams({ tritonRepoPath: repo }).toString();
        const res = await api.get(`/IModel/listTritonModels?${qs}`);
        if (res.code === 200) {
          setModels(Array.isArray(res.data?.models) ? res.data.models : []);
          // 默认展开第一个模型及其第一个版本
          const arr = Array.isArray(res.data?.models) ? res.data.models : [];
          if (arr.length > 0) {
            const first = arr[0];
            setExpanded(prev => ({ ...prev, [first.name]: { ...(prev[first.name] || {}), open: true } }));
            const v = (Array.isArray(first.versions) && first.versions[0]) || "1";
            refreshFiles(first.name, v);
          }
        } else {
          setErr(res.msg || "加载失败");
        }
      }
    } catch (e) {
      setErr(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  const filteredModels = useMemo(() => {
    let arr = Array.isArray(models) ? models.slice() : [];
    const s = search.trim().toLowerCase();
    if (s) arr = arr.filter(m => (m.name || '').toLowerCase().includes(s));
    if (sortKey === 'name') {
      arr.sort((a,b) => (a.name||'').localeCompare(b.name||''));
    } else if (sortKey === 'config') {
      arr.sort((a,b) => (b.config_exists?1:0) - (a.config_exists?1:0));
    } else if (sortKey === 'versions') {
      arr.sort((a,b) => (Array.isArray(b.versions)?b.versions.length:0) - (Array.isArray(a.versions)?a.versions.length:0));
    }
    return arr;
  }, [models, search, sortKey]);

  useEffect(() => { load(); }, [repo]);

  const saveRepo = () => {
    try { localStorage.setItem('triton_repo_path', repo || ""); } catch(_) {}
    load();
  };

  const copyText = async (text, successMsg = "已复制") => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
      }
      setToast(successMsg);
    } catch (e) {
      setToast('复制失败');
    }
    setTimeout(() => setToast(""), 1500);
  };

  const refreshFiles = async (modelName, version = "1") => {
    try {
      if (!repo) return;
      const qs = new URLSearchParams({ tritonRepoPath: repo, modelName, version }).toString();
      setExpanded(prev => ({
        ...prev,
        [modelName]: {
          ...(prev[modelName] || {}),
          loading: { ...(prev[modelName]?.loading || {}), [version]: true }
        }
      }));
      const res = await api.get(`/IModel/listTritonModelFiles?${qs}`);
      const files = Array.isArray(res.data?.files) ? res.data.files : [];
      setExpanded(prev => ({
        ...prev,
        [modelName]: {
          ...(prev[modelName] || {}),
          files: { ...(prev[modelName]?.files || {}), [version]: files },
          loading: { ...(prev[modelName]?.loading || {}), [version]: false },
          open: true,
        }
      }));
    } catch (e) {
      setExpanded(prev => ({
        ...prev,
        [modelName]: {
          ...(prev[modelName] || {}),
          loading: { ...(prev[modelName]?.loading || {}), [version]: false },
        }
      }));
      setToast('加载文件失败');
      setTimeout(() => setToast(""), 1500);
    }
  };

  const toggleModel = (name) => {
    setExpanded(prev => ({ ...prev, [name]: { ...(prev[name] || {}), open: !prev[name]?.open } }));
  };

  const handleDelete = async ({ modelName, version }) => {
    if (!repo) return;
    const label = version ? `模型 ${modelName} 的版本 ${version}` : `模型 ${modelName}`;
    const ok = window.confirm(`确定删除 ${label} 吗？此操作不可恢复。`);
    if (!ok) return;
    try {
      const res = await api.post('/IModel/deleteTritonModel', { data: { tritonRepoPath: repo, modelName, version } });
      if (res.code === 200 && res.data?.ok) {
        setToast('删除成功');
        // 重新加载列表
        load();
      } else {
        setToast(res.msg || '删除失败');
      }
    } catch (e) {
      setToast('删除失败');
    }
    setTimeout(() => setToast(""), 1500);
  };

  return (
    <div className="main">
      {!embedded && (
        <a href="#" onClick={() => setPageUrl("home")} style={{ textDecoration: 'none' }}>返回</a>
      )}
      {!embedded && <h1 className="page-title">Triton 模型仓库</h1>}
      {!embedded && <p className="page-des">浏览 Triton 仓库中的模型与版本</p>}

      <div className="card" style={{ padding: 12, display:'flex', flexWrap:'wrap', alignItems:'center', gap:10 }}>
        <label className="label">仓库路径</label>
        <input type="text" value={repo} onChange={(e)=>setRepo(e.target.value)} placeholder="/path/to/triton/model_repository" style={{ flex:'1 1 480px', minWidth: 320 }} />
        <button className="btn sm" onClick={saveRepo}>保存/刷新</button>
        <div style={{ marginLeft:'auto', display:'flex', gap:10, alignItems:'center' }}>
          <input type="text" value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="搜索模型名..." style={{ width: 200 }} />
          <select value={sortKey} onChange={(e)=>setSortKey(e.target.value)} style={{ height: 30 }}>
            <option value="name">按名称</option>
            <option value="config">按是否有 config</option>
            <option value="versions">按版本数量</option>
          </select>
        </div>
        {err && <div className="tip-box" style={{ width:'100%' }}>错误：{err}</div>}
      </div>

      <div className="list-card" style={{ padding: 8, marginTop: 10 }}>
        {loading ? (
          <div className="tip-box">加载中...</div>
        ) : (Array.isArray(filteredModels) && filteredModels.length > 0 ? (
          <div style={{ display:'grid', gridTemplateColumns: embedded ? 'repeat(3, minmax(0, 1fr))' : 'repeat(auto-fit, minmax(360px, 1fr))', gap: 12, alignItems:'start' }}>
            {filteredModels.map((m, idx) => (
              <div key={idx} className="card" style={{ padding: 12, height:'100%' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:10 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, minWidth:0 }}>
                    <button className="btn sm" onClick={() => toggleModel(m.name)}>{expanded[m.name]?.open ? '收起' : '展开'}</button>
                    <div style={{ fontWeight:700, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{m.name}</div>
                    <Chip bg={m.config_exists ? '#DCFCE7' : '#FEF3C7'} color={m.config_exists ? '#166534' : '#92400E'}>
                      <IconDot color={m.config_exists ? '#22c55e' : '#f59e0b'} />
                      {m.config_exists ? 'config.pbtxt 已存在' : 'config.pbtxt 缺失'}
                    </Chip>
                  </div>
                  <div style={{ position:'relative' }}>
                    <button className="btn sm" onClick={() => setOpenMenuModel(openMenuModel === m.name ? null : m.name)}>更多 ▾</button>
                    {openMenuModel === m.name && (
                      <div className="card" style={{ position:'absolute', right:0, top:'110%', zIndex:10, padding:8, display:'flex', flexDirection:'column', gap:6, minWidth:140 }}>
                        <button className="btn sm" onClick={() => { copyText(m.name, '已复制模型名称'); setOpenMenuModel(null); }}>复制名称</button>
                        <button className="btn sm" onClick={() => { copyText(m.path, '已复制模型路径'); setOpenMenuModel(null); }}>复制路径</button>
                        <button className="btn sm danger" onClick={() => { setOpenMenuModel(null); handleDelete({ modelName: m.name }); }}>删除模型</button>
                      </div>
                    )}
                  </div>
                </div>
                {/* 版本与文件 */}
                {expanded[m.name]?.open && (
                  <div style={{ marginTop:10, display:'grid', gridTemplateColumns:'1fr', gap:8 }}>
                    <div style={{ marginBottom:6, color:'var(--secondary-text-color)', fontSize:12 }}>
                      版本：{Array.isArray(m.versions) && m.versions.length>0 ? m.versions.join(', ') : '无'}
                    </div>
                    {Array.isArray(m.versions) && m.versions.length>0 ? (
                      <div style={{ display:'grid', gridTemplateColumns: embedded ? '1fr' : '1fr', gap:6 }}>
                        {m.versions.map((ver) => (
                          <div key={ver} className="card" style={{ padding: 10 }}>
                            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                                <Chip bg="#DBEAFE" color="#1E40AF">版本 {ver}</Chip>
                                <button className="btn sm" onClick={() => {
                                  const hasFiles = Array.isArray(expanded[m.name]?.files?.[ver]) && expanded[m.name]?.files?.[ver].length>0;
                                  if (hasFiles) {
                                    // 收起文件
                                    setExpanded(prev => ({
                                      ...prev,
                                      [m.name]: {
                                        ...(prev[m.name] || {}),
                                        files: { ...(prev[m.name]?.files || {}), [ver]: [] }
                                      }
                                    }));
                                  } else {
                                    refreshFiles(m.name, ver);
                                  }
                                }}>{(Array.isArray(expanded[m.name]?.files?.[ver]) && expanded[m.name]?.files?.[ver].length>0) ? '收起文件' : '查看文件'}</button>
                              </div>
                              <div style={{ position:'relative' }}>
                                <button className="btn sm" onClick={() => setOpenMenuVersion(prev => ({ ...prev, [m.name]: (prev[m.name] === ver ? null : ver) }))}>更多 ▾</button>
                                {openMenuVersion[m.name] === ver && (
                                  <div className="card" style={{ position:'absolute', right:0, top:'110%', zIndex:10, padding:8, display:'flex', flexDirection:'column', gap:6, minWidth:160 }}>
                                    <button className="btn sm danger" onClick={() => { setOpenMenuVersion(prev => ({ ...prev, [m.name]: null })); handleDelete({ modelName: m.name, version: ver }); }}>删除该版本</button>
                                  </div>
                                )}
                              </div>
                            </div>
                            {expanded[m.name]?.loading?.[ver] ? (
                              <div className="tip-box" style={{ marginTop:6 }}>加载文件中...</div>
                            ) : (Array.isArray(expanded[m.name]?.files?.[ver]) && expanded[m.name]?.files?.[ver].length>0 ? (
                              <div style={{ marginTop:6, display:'grid', gridTemplateColumns: embedded ? '1fr' : '1fr 1fr', gap:8 }}>
                                {expanded[m.name]?.files?.[ver].map((fItem, i) => (
                                  <div key={i} className="card" style={{ padding:8, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                                    <div style={{ fontFamily:'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', fontSize:12 }}>
                                      <span style={{ fontWeight: /^(model\.(onnx|plan|pt))$/i.test(fItem.name) ? 700 : 400 }}>
                                        {fItem.name}
                                      </span>
                                      {/^(model\.(onnx|plan|pt))$/i.test(fItem.name) && (
                                        <Chip bg="#EDE9FE" color="#5B21B6" title="主文件">主文件</Chip>
                                      )}
                                      <span style={{ marginLeft:8, color:'var(--secondary-text-color)' }}>
                                        {(fItem.size/1024).toFixed(2)} KB · {new Date((fItem.mtime||0)*1000).toLocaleString()}
                                      </span>
                                    </div>
                                    <div style={{ display:'flex', gap:8 }}>
                                      <button className="btn sm" onClick={() => copyText(fItem.path, '已复制文件路径')}>复制路径</button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="tip-box" style={{ marginTop:6 }}>暂无文件</div>
                            ))}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="tip-box">该模型没有版本目录</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="tip-box">未发现模型</div>
        ))}
      </div>
      {toast && <div className="tip-box" style={{ marginTop:8 }}>{toast}</div>}
    </div>
  );
}

export default TritonRepoPage;
