import { useEffect, useMemo, useState, useRef } from "react";
import { api } from "../api";
import { useConfirm } from "../contexts/ConfirmContext";

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
  const toastTimerRef = useRef(null);

  const { confirm } = useConfirm();

  // Enhanced UI helpers
  const Chip = ({ color = '#64748b', bg = '#e2e8f0', children, title, variant = 'default' }) => {
    const variants = {
      success: { bg: '#dcfce7', color: '#166534', border: '#bbf7d0' },
      warning: { bg: '#fef3c7', color: '#92400e', border: '#fde68a' },
      info: { bg: '#dbeafe', color: '#1e40af', border: '#bfdbfe' },
      purple: { bg: '#ede9fe', color: '#5b21b6', border: '#d8b4fe' },
      default: { bg, color, border: 'rgba(0,0,0,0.1)' }
    };
    const style = variants[variant] || variants.default;

    return (
      <span
        title={title}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          background: style.bg, color: style.color, borderRadius: 6,
          padding: '4px 8px', fontSize: 11, fontWeight: 500, lineHeight: 1.4,
          border: `1px solid ${style.border}`,
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
        }}
      >{children}</span>
    );
  };

  const IconDot = ({ color = '#94a3b8', size = 6 }) => (
    <span style={{
      width: size, height: size, background: color, borderRadius: '50%',
      display: 'inline-block', flexShrink: 0
    }} />
  );

  // Icons
  const FolderIcon = ({ size = 16, color = '#6b7280' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );

  const FileIcon = ({ size = 16, color = '#6b7280' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14,2 14,8 20,8" />
    </svg>
  );

  const ChevronIcon = ({ expanded, size = 16, color = '#6b7280' }) => (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"
      style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
    >
      <polyline points="9,18 15,12 9,6" />
    </svg>
  );

  const SearchIcon = ({ size = 16, color = '#6b7280' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );

  useEffect(() => {
    try { setRepo(localStorage.getItem('triton_repo_path') || ""); } catch (_) { }
  }, []);

  // 清理toast定时器
  useEffect(() => {
    if (toast) {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
      toastTimerRef.current = setTimeout(() => {
        setToast("");
        toastTimerRef.current = null;
      }, 1500);
    }
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
        toastTimerRef.current = null;
      }
    };
  }, [toast]);

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
      arr.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sortKey === 'config') {
      arr.sort((a, b) => (b.config_exists ? 1 : 0) - (a.config_exists ? 1 : 0));
    } else if (sortKey === 'versions') {
      arr.sort((a, b) => (Array.isArray(b.versions) ? b.versions.length : 0) - (Array.isArray(a.versions) ? a.versions.length : 0));
    }
    return arr;
  }, [models, search, sortKey]);

  useEffect(() => { load(); }, [repo]);

  const saveRepo = () => {
    try { localStorage.setItem('triton_repo_path', repo || ""); } catch (_) { }
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
    }
  };

  const toggleModel = (name) => {
    setExpanded(prev => ({ ...prev, [name]: { ...(prev[name] || {}), open: !prev[name]?.open } }));
  };

  const handleDelete = async ({ modelName, version }) => {
    if (!repo) return;
    const label = version ? `模型 ${modelName} 的版本 ${version}` : `模型 ${modelName}`;
    const ok = await confirm({
      title: '删除确认',
      message: `确定删除 ${label} 吗？此操作不可恢复。`,
      confirmText: '删除',
      cancelText: '取消',
      type: 'danger'
    });
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
  };

  return (
    <div className="main">
      {!embedded && (
        <a href="#" onClick={() => setPageUrl("home")} style={{ textDecoration: 'none' }}>返回</a>
      )}
      {!embedded && <h1 className="page-title">Triton 模型仓库</h1>}
      {!embedded && <p className="page-des">浏览 Triton 仓库中的模型与版本</p>}

      <div className="card" style={{
        padding: 20,
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Repository Path Section */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FolderIcon size={18} color="#4f46e5" />
              <label className="label" style={{ fontWeight: 600, color: '#374151' }}>仓库路径</label>
            </div>
            <input
              type="text"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              placeholder="/path/to/triton/model_repository"
              style={{
                flex: '1 1 400px',
                minWidth: 300,
                padding: '10px 12px',
                border: '2px solid #e5e7eb',
                borderRadius: 8,
                fontSize: 14,
                transition: 'border-color 0.2s',
                ':focus': { borderColor: '#4f46e5', outline: 'none' }
              }}
            />
            <button
              className="btn sm"
              onClick={saveRepo}
              style={{
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: 8,
                fontWeight: 600,
                boxShadow: '0 2px 4px rgba(79, 70, 229, 0.3)',
                transition: 'all 0.2s'
              }}
            >
              保存/刷新
            </button>
          </div>

          {/* Search and Filter Section */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Chip variant="info">
                <FolderIcon size={12} />
                共 {filteredModels.length} 个模型
              </Chip>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ position: 'relative' }}>
                <SearchIcon
                  size={16}
                  color="#9ca3af"
                  style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="搜索模型名..."
                  style={{
                    width: 220,
                    padding: '8px 12px 8px 36px',
                    border: '2px solid #e5e7eb',
                    borderRadius: 8,
                    fontSize: 14,
                    transition: 'border-color 0.2s'
                  }}
                />
              </div>

              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value)}
                style={{
                  padding: '8px 12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: 8,
                  fontSize: 14,
                  background: 'white',
                  minWidth: 140
                }}
              >
                <option value="name">按名称排序</option>
                <option value="config">按配置状态</option>
                <option value="versions">按版本数量</option>
              </select>
            </div>
          </div>

          {err && (
            <div style={{
              padding: 12,
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 8,
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <IconDot color="#dc2626" size={8} />
              错误：{err}
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        {loading ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 60,
            background: 'white',
            borderRadius: 12,
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              width: 40,
              height: 40,
              border: '3px solid #e5e7eb',
              borderTop: '3px solid #4f46e5',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginBottom: 16
            }}></div>
            <div style={{ color: '#6b7280', fontSize: 16 }}>加载模型中...</div>
          </div>
        ) : (Array.isArray(filteredModels) && filteredModels.length > 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            alignItems: 'stretch'
          }}>
            {filteredModels.map((m, idx) => (
              <div
                key={idx}
                style={{
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: 12,
                  padding: 0,
                  height: 'fit-content',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.2s ease',
                  ':hover': { boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }
                }}
              >
                {/* Model Header */}
                <div style={{
                  padding: 20,
                  borderBottom: expanded[m.name]?.open ? '1px solid #f3f4f6' : 'none'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Model Name and Icon */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <button
                          onClick={() => toggleModel(m.name)}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 4,
                            cursor: 'pointer',
                            borderRadius: 4,
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'background-color 0.2s'
                          }}
                        >
                          <ChevronIcon expanded={expanded[m.name]?.open} size={18} color="#6b7280" />
                        </button>
                        <FolderIcon size={20} color="#4f46e5" />
                        <h3 style={{
                          margin: 0,
                          fontSize: 18,
                          fontWeight: 600,
                          color: '#111827',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {m.name}
                        </h3>
                      </div>

                      {/* Status and Version Info */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <Chip variant={m.config_exists ? 'success' : 'warning'}>
                          <IconDot color={m.config_exists ? '#22c55e' : '#f59e0b'} size={6} />
                          {m.config_exists ? 'Config 已配置' : 'Config 缺失'}
                        </Chip>

                        {Array.isArray(m.versions) && m.versions.length > 0 && (
                          <Chip variant="info">
                            {m.versions.length} 个版本
                          </Chip>
                        )}
                      </div>

                      {/* Path Info */}
                      <div style={{
                        fontSize: 12,
                        color: '#6b7280',
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                        background: '#f9fafb',
                        padding: '6px 8px',
                        borderRadius: 4,
                        border: '1px solid #f3f4f6'
                      }}>
                        {m.path}
                      </div>
                    </div>

                    {/* Actions Menu */}
                    <div style={{ position: 'relative' }}>
                      <button
                        onClick={() => setOpenMenuModel(openMenuModel === m.name ? null : m.name)}
                        style={{
                          background: '#f9fafb',
                          border: '1px solid #e5e7eb',
                          borderRadius: 6,
                          padding: '6px 10px',
                          fontSize: 12,
                          color: '#6b7280',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        ⋯
                      </button>
                      {openMenuModel === m.name && (
                        <div style={{
                          position: 'absolute',
                          right: 0,
                          top: '100%',
                          marginTop: 4,
                          zIndex: 10,
                          background: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: 8,
                          padding: 8,
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                          minWidth: 160
                        }}>
                          <button
                            onClick={() => { copyText(m.name, '已复制模型名称'); setOpenMenuModel(null); }}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              background: 'none',
                              border: 'none',
                              padding: '8px 12px',
                              fontSize: 13,
                              color: '#374151',
                              cursor: 'pointer',
                              borderRadius: 4,
                              transition: 'background-color 0.2s'
                            }}
                          >
                            复制名称
                          </button>
                          <button
                            onClick={() => { copyText(m.path, '已复制模型路径'); setOpenMenuModel(null); }}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              background: 'none',
                              border: 'none',
                              padding: '8px 12px',
                              fontSize: 13,
                              color: '#374151',
                              cursor: 'pointer',
                              borderRadius: 4,
                              transition: 'background-color 0.2s'
                            }}
                          >
                            复制路径
                          </button>
                          <hr style={{ margin: '4px 0', border: 'none', borderTop: '1px solid #f3f4f6' }} />
                          <button
                            onClick={() => { setOpenMenuModel(null); handleDelete({ modelName: m.name }); }}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              background: 'none',
                              border: 'none',
                              padding: '8px 12px',
                              fontSize: 13,
                              color: '#dc2626',
                              cursor: 'pointer',
                              borderRadius: 4,
                              transition: 'background-color 0.2s'
                            }}
                          >
                            删除模型
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {/* Versions and Files */}
                {expanded[m.name]?.open && (
                  <div style={{ padding: '0 20px 20px' }}>
                    {Array.isArray(m.versions) && m.versions.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {m.versions.map((ver) => (
                          <div
                            key={ver}
                            style={{
                              background: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              borderRadius: 8,
                              padding: 16,
                              transition: 'all 0.2s'
                            }}
                          >
                            {/* Version Header */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <Chip variant="info">
                                  <IconDot color="#3b82f6" size={6} />
                                  版本 {ver}
                                </Chip>

                                <button
                                  onClick={() => {
                                    const hasFiles = Array.isArray(expanded[m.name]?.files?.[ver]) && expanded[m.name]?.files?.[ver].length > 0;
                                    if (hasFiles) {
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
                                  }}
                                  style={{
                                    background: 'white',
                                    border: '1px solid #d1d5db',
                                    borderRadius: 6,
                                    padding: '6px 12px',
                                    fontSize: 12,
                                    color: '#374151',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    transition: 'all 0.2s'
                                  }}
                                >
                                  <FileIcon size={14} />
                                  {(Array.isArray(expanded[m.name]?.files?.[ver]) && expanded[m.name]?.files?.[ver].length > 0) ? '收起文件' : '查看文件'}
                                </button>
                              </div>

                              <div style={{ position: 'relative' }}>
                                <button
                                  onClick={() => setOpenMenuVersion(prev => ({ ...prev, [m.name]: (prev[m.name] === ver ? null : ver) }))}
                                  style={{
                                    background: 'white',
                                    border: '1px solid #d1d5db',
                                    borderRadius: 6,
                                    padding: '6px 10px',
                                    fontSize: 12,
                                    color: '#6b7280',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                  }}
                                >
                                  ⋯
                                </button>
                                {openMenuVersion[m.name] === ver && (
                                  <div style={{
                                    position: 'absolute',
                                    right: 0,
                                    top: '100%',
                                    marginTop: 4,
                                    zIndex: 10,
                                    background: 'white',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: 8,
                                    padding: 8,
                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                    minWidth: 140
                                  }}>
                                    <button
                                      onClick={() => { setOpenMenuVersion(prev => ({ ...prev, [m.name]: null })); handleDelete({ modelName: m.name, version: ver }); }}
                                      style={{
                                        width: '100%',
                                        textAlign: 'left',
                                        background: 'none',
                                        border: 'none',
                                        padding: '8px 12px',
                                        fontSize: 13,
                                        color: '#dc2626',
                                        cursor: 'pointer',
                                        borderRadius: 4,
                                        transition: 'background-color 0.2s'
                                      }}
                                    >
                                      删除版本
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Loading State */}
                            {expanded[m.name]?.loading?.[ver] && (
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: 12,
                                background: 'white',
                                borderRadius: 6,
                                border: '1px solid #e5e7eb'
                              }}>
                                <div style={{
                                  width: 16,
                                  height: 16,
                                  border: '2px solid #e5e7eb',
                                  borderTop: '2px solid #4f46e5',
                                  borderRadius: '50%',
                                  animation: 'spin 1s linear infinite'
                                }}></div>
                                <span style={{ color: '#6b7280', fontSize: 13 }}>加载文件中...</span>
                              </div>
                            )}

                            {/* Files List */}
                            {Array.isArray(expanded[m.name]?.files?.[ver]) && expanded[m.name]?.files?.[ver].length > 0 && (
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
                                {expanded[m.name]?.files?.[ver].map((fItem, i) => (
                                  <div
                                    key={i}
                                    style={{
                                      background: 'white',
                                      border: '1px solid #e5e7eb',
                                      borderRadius: 6,
                                      padding: 12,
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      gap: 12
                                    }}
                                  >
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                        <FileIcon size={16} color="#6b7280" />
                                        <span style={{
                                          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                                          fontSize: 13,
                                          fontWeight: /^(model\.(onnx|plan|pt))$/i.test(fItem.name) ? 600 : 400,
                                          color: '#111827'
                                        }}>
                                          {fItem.name}
                                        </span>
                                        {/^(model\.(onnx|plan|pt))$/i.test(fItem.name) && (
                                          <Chip variant="purple" title="主模型文件">
                                            主文件
                                          </Chip>
                                        )}
                                      </div>
                                      <div style={{
                                        fontSize: 11,
                                        color: '#6b7280',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8
                                      }}>
                                        <span>{(fItem.size / 1024).toFixed(2)} KB</span>
                                        <IconDot color="#d1d5db" size={4} />
                                        <span>{new Date((fItem.mtime || 0) * 1000).toLocaleString()}</span>
                                      </div>
                                    </div>

                                    <button
                                      onClick={() => copyText(fItem.path, '已复制文件路径')}
                                      style={{
                                        background: '#f9fafb',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: 6,
                                        padding: '6px 12px',
                                        fontSize: 12,
                                        color: '#374151',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        flexShrink: 0
                                      }}
                                    >
                                      复制路径
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* No Files Message */}
                            {Array.isArray(expanded[m.name]?.files?.[ver]) && expanded[m.name]?.files?.[ver].length === 0 && !expanded[m.name]?.loading?.[ver] && (
                              <div style={{
                                padding: 16,
                                background: 'white',
                                borderRadius: 6,
                                border: '1px solid #e5e7eb',
                                textAlign: 'center',
                                color: '#6b7280',
                                fontSize: 13
                              }}>
                                暂无文件
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{
                        padding: 16,
                        background: '#fef3c7',
                        border: '1px solid #fde68a',
                        borderRadius: 8,
                        color: '#92400e',
                        fontSize: 13,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                      }}>
                        <IconDot color="#f59e0b" size={8} />
                        该模型没有版本目录
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 60,
            background: 'white',
            borderRadius: 12,
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <FolderIcon size={48} color="#d1d5db" />
            <div style={{
              marginTop: 16,
              fontSize: 16,
              fontWeight: 500,
              color: '#6b7280',
              textAlign: 'center'
            }}>
              {search ? `未找到匹配 "${search}" 的模型` : '未发现模型'}
            </div>
            <div style={{
              marginTop: 8,
              fontSize: 14,
              color: '#9ca3af',
              textAlign: 'center'
            }}>
              {search ? '尝试调整搜索条件' : '请检查仓库路径是否正确'}
            </div>
          </div>
        ))}
      </div>

      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          padding: '12px 20px',
          borderRadius: 8,
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          fontSize: 14,
          fontWeight: 500,
          zIndex: 1000,
          animation: 'slideInUp 0.3s ease-out'
        }}>
          {toast}
        </div>
      )}

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes slideInUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        button:hover {
          transform: translateY(-1px);
        }
        
        .card:hover {
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
}

export default TritonRepoPage;
