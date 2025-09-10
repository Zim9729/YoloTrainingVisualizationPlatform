import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "../api";
import CONFIGS from "../config";
import { splitPath } from "../tools";
import LogPanel from "../components/LogPanel";
import TestForm from "../components/TestForm";
import ValidationForm from "../components/ValidationForm";

import Icon_Box_seam_fill from "../assets/icons/box-seam-fill.svg";
import Icon_Calendar_fill from "../assets/icons/calendar-fill.svg";

function TestResultImage({ taskID, filePath, style }) {
    const [base64, setBase64] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!taskID || !filePath) return;
        const controller = new AbortController();
        setError(null);
        setBase64(null);

        api.get(`/IModel/getTestResultImageBase64?taskID=${taskID}&filePath=${encodeURIComponent(filePath)}`, { signal: controller.signal })
            .then(data => {
                if (data.code === 200 && data.data.type === "image") {
                    const b64 = data.data.base64 || '';
                    const src = b64.startsWith('data:') ? b64 : `data:image/png;base64,${b64}`;
                    setBase64(src);
                } else {
                    setError('未获取到图片');
                }
            })
            .catch(err => {
                if (err?.name === 'AbortError') return;
                console.error("加载图片失败", err);
                setError('加载失败');
            });

        return () => controller.abort();
    }, [taskID, filePath]);

    if (error) return <div className="tip-box">{error}</div>;
    if (!base64) return <div className="tip-box">加载中...</div>;

    return <img src={base64} style={style} alt="测试结果图" loading="lazy" />;
}

function ValResultImage({ taskID, filePath, style }) {
    const [base64, setBase64] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!taskID || !filePath) return;
        const controller = new AbortController();
        setLoading(true);
        setError(null);
        setBase64(null);
        api.get(`/IModel/getValResultImageBase64?taskID=${taskID}&filePath=${encodeURIComponent(filePath)}`, { signal: controller.signal })
            .then(data => {
                if (data.code === 200 && data.data?.type === "image") {
                    const b64 = data.data.base64 || '';
                    const src = b64.startsWith('data:') ? b64 : `data:image/png;base64,${b64}`;
                    setBase64(src);
                } else {
                    setError('未获取到图片');
                }
            })
            .catch(err => {
                if (err?.name === 'AbortError') return;
                console.error("加载验证图片失败", err);
                setError('加载失败');
            })
            .finally(() => setLoading(false));

        return () => controller.abort();
    }, [taskID, filePath]);

    if (loading) return <div className="tip-box">加载中...</div>;
    if (error) return <div className="tip-box">{error}</div>;
    if (!base64) return <div className="tip-box">未获取到图片</div>;
    return <img src={base64} style={style} alt="验证结果图" loading="lazy" />;
}

function ModelTestPage({ setPageUrl, parameter }) {
    const [modelList, setModelList] = useState([]);
    const [trainedModelList, setTrainedModelList] = useState([]);
    const [showTestResultImage, setShowTestResultImage] = useState([]);
    // 日志相关状态
    const [showLogPanel, setShowLogPanel] = useState(false);
    const [logFilename, setLogFilename] = useState("");
    // 预览大图相关
    const [previewVisible, setPreviewVisible] = useState(false);
    const [previewInfo, setPreviewInfo] = useState({ taskID: "", filePath: "", title: "" });
    // 验证卡片展开控制
    const [showValPlots, setShowValPlots] = useState([]);   // 用作“显示列表”或“隐藏列表”，取决于默认开关
    const [showValTable, setShowValTable] = useState([]);   // 同上
    // 验证历史默认展开选项
    const [defaultValTableOpen, setDefaultValTableOpen] = useState(false);
    const [defaultValPlotsOpen, setDefaultValPlotsOpen] = useState(false);
    // 历史记录显示控制
    const [historyViewMode, setHistoryViewMode] = useState('none'); // 'none', 'test', 'validation'

    const buildValDownloadUrl = (taskID, filePath) => {
        const qs = new URLSearchParams({ taskID, filePath }).toString();
        return `${CONFIGS.API_BASE_URL}/IModel/downloadValResultFile?${qs}`;
    };

    // 统一错误处理
    const showError = (message, error) => {
        console.error(message, error);
        alert(message + (error ? `: ${error.message || error}` : ''));
    };

    // 共享的模型获取逻辑
    const fetchModelData = async () => {
        try {
            const data = await api.get("/IModel/getAllTrainedModel");
            if (data.code === 200) {
                const models = data.data.models;
                const norm = (s) => (s || "").toString().replace(/\\/g, "/");
                const qFolder = (() => { try { return norm(decodeURIComponent(parameter.folder || "")); } catch(_) { return norm(parameter.folder || ""); } })();
                const qTaskId = parameter.taskID ? String(parameter.taskID) : "";
                let targetModel = models.find(model => {
                    const byTaskId = qTaskId && String(model.task_id) === qTaskId;
                    const byFolder = qFolder && norm(model.folder) === qFolder;
                    return byTaskId || byFolder;
                });
                if (!targetModel && models.length > 0) {
                    targetModel = models[0];
                }
                if (!targetModel) {
                    setTrainedModelList([]);
                    return;
                }
                const [testRes, valRes] = await Promise.all([
                    api.get(`/IModel/getAllTest?taskID=${targetModel.task_id}`),
                    api.get(`/IModel/getAllValidation?taskID=${targetModel.task_id}`),
                ]);
                const testList = testRes.code === 200 ? (testRes.data.test || []) : [];
                const valList = valRes.code === 200 ? (valRes.data.validation || []) : [];
                const updatedModel = { ...targetModel, tests: testList, validations: valList };
                setTrainedModelList([updatedModel]);
            }
        } catch (err) {
            showError("获取模型数据失败", err);
        }
    };


    // 删除记录（测试/验证）
    const handleDeleteTest = useCallback(async (filename) => {
        try {
            const res = await api.post('/IModel/deleteTestResult', { data: { filename } });
            if (res.code === 200) {
                // 从前端状态移除该记录
                setTrainedModelList(prev => prev.map(m => ({
                    ...m,
                    tests: Array.isArray(m.tests) ? m.tests.filter(t => t.__testResultFilePath !== filename) : m.tests
                })));
            } else {
                showError(res.msg || '删除失败');
            }
        } catch (e) {
            showError('删除失败', e);
        }
    }, [showError]);

    const handleDeleteValidation = useCallback(async (filename) => {
        try {
            const res = await api.post('/IModel/deleteValidationResult', { data: { filename } });
            if (res.code === 200) {
                setTrainedModelList(prev => prev.map(m => ({
                    ...m,
                    validations: Array.isArray(m.validations) ? m.validations.filter(v => v.__valResultFilePath !== filename) : m.validations
                })));
            } else {
                showError(res.msg || '删除失败');
            }
        } catch (e) {
            showError('删除失败', e);
        }
    }, [showError]);

    const buildPerClassCSV = (rows) => {
        if (!Array.isArray(rows) || rows.length === 0) return '';
        const header = ['Class','Images','Instances','P','R','mAP50','mAP50_95'];
        const escape = (v) => {
            if (v === null || v === undefined) return '';
            if (typeof v === 'number') return String(v);
            const s = String(v);
            if (s.includes(',') || s.includes('\n') || s.includes('"')) {
                return '"' + s.replace(/"/g, '""') + '"';
            }
            return s;
        };
        const lines = [header.map(h => h.replace('mAP50_95','mAP50-95')).join(',')];
        rows.forEach(r => {
            lines.push(header.map(c => escape(r[c])).join(','));
        });
        return lines.join('\n');
    };

    const triggerDownload = (filename, content, mime = 'text/plain;charset=utf-8') => {
        try {
            const blob = new Blob([content], { type: mime });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 0);
        } catch (e) {
            showError('下载失败', e);
        }
    };

    const refreshHistory = useCallback(async () => {
        await fetchModelData();
    }, [fetchModelData]);

    useEffect(() => {
        if ((parameter.type === "newTest" || parameter.type === "newVal") && parameter?.weights) {
            const weightsArray = parameter.weights
                .split(",")
                .map(w => w.trim())
                .filter(w => w.endsWith(".pt"));   // 过滤非法内容

            setModelList(weightsArray);
        } else {
            fetchModelData();
        }
    }, [parameter]);


    const handleTestStart = useCallback((filename) => {
        setLogFilename(filename);
        setShowLogPanel(true);
    }, []);

    const handleValidationStart = useCallback((filename) => {
        setLogFilename(filename);
        setShowLogPanel(true);
    }, []);


    switch (parameter.type) {
        case "newTest":
            return (
                <>
                    <TestForm
                        modelList={modelList}
                        parameter={parameter}
                        setPageUrl={setPageUrl}
                        onTestStart={handleTestStart}
                    />
                    <LogPanel
                        visible={showLogPanel}
                        onClose={() => setShowLogPanel(false)}
                        logFilename={logFilename}
                        taskType="test"
                        parameter={parameter}
                        setPageUrl={setPageUrl}
                    />
                </>
            );
        case "newVal":
            return (
                <>
                    <ValidationForm
                        modelList={modelList}
                        parameter={parameter}
                        setPageUrl={setPageUrl}
                        onValidationStart={handleValidationStart}
                    />
                    <LogPanel
                        visible={showLogPanel}
                        onClose={() => setShowLogPanel(false)}
                        logFilename={logFilename}
                        taskType="validation"
                        parameter={parameter}
                        setPageUrl={setPageUrl}
                    />
                </>
            );
        default:
            return (
                <div className="main">
                    <a href="#" onClick={() => setPageUrl("models?type=trained")} style={{ textDecoration: 'none' }}>返回</a>
                    <h1 className="page-title">
                        任务「{parameter.taskName}」模型
                        {parameter.open === 'test' ? '测试结果' : 
                         parameter.open === 'validation' ? '验证结果' : 
                         '测试和验证结果'}
                    </h1>
                    <p className="page-des">训练于 {parameter.startedAt}</p>

                    {trainedModelList && trainedModelList.length > 0 && (() => {
                        const model = trainedModelList[0];
                        if (!model) return null;

                        return (
                            <div>
                                {/* 显示控制工具栏 */}
                                <div className="list-card" style={{ marginBottom: '16px', padding: '12px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                        <button 
                                            className={`btn sm ${historyViewMode === 'test' ? 'primary' : ''}`} 
                                            onClick={() => setHistoryViewMode(historyViewMode === 'test' ? 'none' : 'test')}
                                        >
                                            {historyViewMode === 'test' ? '隐藏测试历史记录' : '查看测试历史记录'}
                                        </button>
                                        <button 
                                            className={`btn sm ${historyViewMode === 'validation' ? 'primary' : ''}`} 
                                            onClick={() => setHistoryViewMode(historyViewMode === 'validation' ? 'none' : 'validation')}
                                        >
                                            {historyViewMode === 'validation' ? '隐藏验证历史记录' : '查看验证历史记录'}
                                        </button>
                                    </div>
                                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px', alignItems: 'center' }}>
                                        <button className="btn sm" onClick={refreshHistory}>刷新</button>
                                        {historyViewMode === 'validation' && (
                                            <>
                                                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                                    <input type="checkbox" checked={defaultValTableOpen} onChange={(e)=>setDefaultValTableOpen(e.target.checked)} /> 验证-按类指标默认展开
                                                </label>
                                                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                                    <input type="checkbox" checked={defaultValPlotsOpen} onChange={(e)=>setDefaultValPlotsOpen(e.target.checked)} /> 验证-图表默认展开
                                                </label>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {(() => {
                                    const testsSorted = Array.isArray(model.tests) ? 
                                        model.tests.slice().sort((a,b)=> (b.startedAt||0)-(a.startedAt||0)) : [];
                                    const validationsSorted = Array.isArray(model.validations) ? 
                                        model.validations.slice().sort((a,b)=> (b.startedAt||0)-(a.startedAt||0)) : [];

                                    // 根据历史记录查看模式决定显示哪种历史记录
                                    const showTestHistory = historyViewMode === 'test';
                                    const showValidationHistory = historyViewMode === 'validation';

                                    return (
                                        <>
                                {/* 测试历史记录部分 */}
                                {showTestHistory && (
                                    <>
                                        <div className="form-group-title">
                                            <h1 className="step-tag nobg">
                                                <img src={Icon_Calendar_fill} className="icon" />
                                            </h1>
                                            <h1 className="title">历史测试记录{Array.isArray(model.tests) ? `（${testsSorted.length}）` : ''}</h1>
                                        </div>

                                        <div className="list-card-group">
                                            {Array.isArray(testsSorted) && testsSorted.length > 0 && (
                                                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                    {testsSorted.map((test) => {
                                                        const k = test.__testResultFilePath;
                                                        const show = showTestResultImage.includes(k);
                                                        return (
                                                            <div key={k} className="list-card" style={{ padding: '10px' }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                    <div>
                                                                        <span style={{ fontSize: '16px', fontWeight: 600 }}>
                                                                            {new Date((test.startedAt||0) * 1000).toLocaleString()} - {test.completedAt ? new Date(test.completedAt * 1000).toLocaleString() : '未完成'}
                                                                        </span>
                                                                        <br />
                                                                        <span style={{ fontSize: '13px', color: 'var(--secondary-text-color)' }}>测试图片来自 {splitPath(test.input_path).pop()}</span>
                                                                        <br />
                                                                        <span style={{ fontSize: '13px', color: 'var(--secondary-text-color)' }}>使用 {splitPath(test.model_path).pop()} 进行测试</span>
                                                                    </div>
                                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                                        <button className="btn sm" onClick={() => setShowTestResultImage(prev => prev.includes(k) ? prev.filter(i => i !== k) : [...prev, k])}>
                                                                            {show ? '收起结果图' : '查看结果图'}
                                                                        </button>
                                                                        <button className="btn sm danger" onClick={() => handleDeleteTest(k)}>删除</button>
                                                                    </div>
                                                                </div>
                                                                {show && (
                                                                    <div style={{ marginTop: '8px', textAlign: 'center' }}>
                                                                        <div style={{ fontSize: '13px', color: 'var(--secondary-text-color)', marginBottom: '6px' }}>测试结果图</div>
                                                                        <div style={{ cursor: 'zoom-in' }} onClick={() => { 
                                                                            setPreviewInfo({ 
                                                                                taskID: model.task_id, 
                                                                                filePath: test.result_file_path, 
                                                                                title: '测试结果图' 
                                                                            }); 
                                                                            setPreviewVisible(true); 
                                                                        }}>
                                                                            <TestResultImage 
                                                                                taskID={model.task_id} 
                                                                                filePath={test.result_file_path} 
                                                                                style={{ 
                                                                                    maxWidth: '320px', 
                                                                                    borderRadius: '6px', 
                                                                                    border: '1px solid var(--border-color)' 
                                                                                }} 
                                                                            />
                                                                        </div>
                                                                        <div style={{ marginTop: '6px' }}>
                                                                            <a 
                                                                                className="btn sm" 
                                                                                href={`${CONFIGS.API_BASE_URL}/IModel/downloadTestResult?taskID=${model.task_id}&filePath=${encodeURIComponent(test.result_file_path)}`} 
                                                                                target="_blank" 
                                                                                rel="noreferrer"
                                                                            >
                                                                                下载
                                                                            </a>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                            {(!Array.isArray(testsSorted) || testsSorted.length === 0) && (
                                                <div className="tip-box" style={{ marginTop: '8px' }}>暂无测试记录</div>
                                            )}
                                        </div>
                                    </>
                                )}

                                {/* 验证历史记录部分 */}
                                {showValidationHistory && (
                                    <>
                                        <div className="form-group-title">
                                            <h1 className="step-tag nobg">
                                                <img src={Icon_Calendar_fill} className="icon" />
                                            </h1>
                                            <h1 className="title">历史验证记录{Array.isArray(model.validations) ? `（${validationsSorted.length}）` : ''}</h1>
                                        </div>

                                        <div className="list-card-group">
                                            {Array.isArray(validationsSorted) && validationsSorted.length > 0 && (
                                                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                    {validationsSorted.map((val) => {
                                                        const k = val.__valResultFilePath;
                                                        const isTableExpanded = showValTable.includes(k);
                                                        const isPlotsExpanded = showValPlots.includes(k);
                                                        const showTbl = defaultValTableOpen ? !isTableExpanded : isTableExpanded;
                                                        const showPlots = defaultValPlotsOpen ? !isPlotsExpanded : isPlotsExpanded;
                                                        return (
                                                            <div key={k} className="list-card" style={{ padding: '10px' }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                    <div>
                                                                <span style={{ fontSize: '16px', fontWeight: 600 }}>
                                                                    {new Date((val.startedAt||0) * 1000).toLocaleString()} - {val.completedAt ? new Date(val.completedAt * 1000).toLocaleString() : '未完成'}
                                                                </span>
                                                                <br />
                                                                <span style={{ fontSize: '13px', color: 'var(--secondary-text-color)' }}>使用 {splitPath(val.model_path).pop()} 进行验证</span>
                                                                <br />
                                                                {val.metrics && (
                                                                    <span style={{ fontSize: '13px', color: 'var(--secondary-text-color)' }}>
                                                                        指标摘要：{Object.entries(val.metrics).slice(0, 4).map(([k1, v1]) => `${k1}: ${typeof v1 === 'number' ? v1.toFixed(4) : v1}`).join(' | ')}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                                {(val.per_class_rows || val.per_class_table) && (
                                                                    <button className="btn sm" onClick={() => setShowValTable(prev => 
                                                                        prev.includes(k) ? prev.filter(i => i !== k) : [...prev, k]
                                                                    )}>
                                                                        {showTbl ? '收起按类指标' : '查看按类指标'}
                                                                    </button>
                                                                )}
                                                                {val.plots && (
                                                                    <button className="btn sm" onClick={() => setShowValPlots(prev => 
                                                                        prev.includes(k) ? prev.filter(i => i !== k) : [...prev, k]
                                                                    )}>
                                                                        {showPlots ? '收起图表' : '查看图表'}
                                                                    </button>
                                                                )}
                                                                <button className="btn sm danger" onClick={() => handleDeleteValidation(k)}>删除</button>
                                                            </div>
                                                        </div>

                                                        {(val.per_class_rows || val.per_class_table) && showTbl && (
                                                            <div>
                                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', margin: '6px 0', flexWrap: 'wrap' }}>
                                                                    {Array.isArray(val.per_class_rows) && val.per_class_rows.length > 0 && (
                                                                        <>
                                                                            <button className="btn sm" onClick={() => navigator.clipboard.writeText(buildPerClassCSV(val.per_class_rows))}>复制CSV</button>
                                                                            <button className="btn sm" onClick={() => triggerDownload(`per_class_metrics_${model.task_id}_${val.startedAt || ''}.csv`, buildPerClassCSV(val.per_class_rows), 'text/csv;charset=utf-8')}>下载CSV</button>
                                                                        </>
                                                                    )}
                                                                    {val.per_class_table && (
                                                                        <>
                                                                            <button className="btn sm" onClick={() => navigator.clipboard.writeText(val.per_class_table || '')}>复制文本</button>
                                                                            <button className="btn sm" onClick={() => triggerDownload(`per_class_metrics_${model.task_id}_${val.startedAt || ''}.txt`, val.per_class_table || '')}>下载TXT</button>
                                                                        </>
                                                                    )}
                                                                </div>
                                                                <div style={{ border: '1px solid var(--border-color)', borderRadius: '6px', background: 'var(--card-bg)', padding: '10px', overflow: 'auto' }}>
                                                                    {Array.isArray(val.per_class_rows) && val.per_class_rows.length > 0 ? (
                                                                        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: '680px' }}>
                                                                            <thead>
                                                                                <tr>
                                                                                    {['Class','Images','Instances','P','R','mAP50','mAP50_95'].map(h => (
                                                                                        <th key={h} style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)', padding: '6px 8px' }}>{h.replace('mAP50_95','mAP50-95')}</th>
                                                                                    ))}
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                {[...val.per_class_rows].sort((a,b)=> (a.Class==='all')? -1 : (b.Class==='all')? 1 : 0).map((r, irow) => (
                                                                                    <tr key={irow}>
                                                                                        {['Class','Images','Instances','P','R','mAP50','mAP50_95'].map(c => (
                                                                                            <td key={c} style={{ padding: '6px 8px', borderBottom: '1px dashed var(--border-color)' }}>
                                                                                                {typeof r[c] === 'number' ? r[c].toFixed(c==='Images'||c==='Instances'?0:3) : (r[c] ?? '')}
                                                                                            </td>
                                                                                        ))}
                                                                                    </tr>
                                                                                ))}
                                                                            </tbody>
                                                                        </table>
                                                                    ) : (
                                                                        <pre style={{ whiteSpace: 'pre', overflow: 'auto', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace', fontSize: '12px', margin: 0 }}>{val.per_class_table}</pre>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {val.plots && showPlots && (
                                                            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                                                                {val.plots.confusion_matrix && (
                                                                    <div style={{ textAlign: 'center' }}>
                                                                        <div style={{ fontSize: '13px', color: 'var(--secondary-text-color)', marginBottom: '6px' }}>混淆矩阵</div>
                                                                        <div style={{ cursor: 'zoom-in' }} onClick={() => { setPreviewInfo({ taskID: model.task_id, filePath: val.plots.confusion_matrix, title: '混淆矩阵' }); setPreviewVisible(true); }}>
                                                                            <ValResultImage taskID={model.task_id} filePath={val.plots.confusion_matrix} style={{ maxWidth: '320px', borderRadius: '6px', border: '1px solid var(--border-color)' }} />
                                                                        </div>
                                                                        <div style={{ marginTop: '6px' }}>
                                                                            <a className="btn sm" href={buildValDownloadUrl(model.task_id, val.plots.confusion_matrix)} target="_blank" rel="noreferrer">下载</a>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {!val.plots.confusion_matrix && val.plots.results && (
                                                                    <div style={{ textAlign: 'center' }}>
                                                                        <div style={{ fontSize: '13px', color: 'var(--secondary-text-color)', marginBottom: '6px' }}>结果图</div>
                                                                        <div style={{ cursor: 'zoom-in' }} onClick={() => { setPreviewInfo({ taskID: model.task_id, filePath: val.plots.results, title: '结果图' }); setPreviewVisible(true); }}>
                                                                            <ValResultImage taskID={model.task_id} filePath={val.plots.results} style={{ maxWidth: '320px', borderRadius: '6px', border: '1px solid var(--border-color)' }} />
                                                                        </div>
                                                                        <div style={{ marginTop: '6px' }}>
                                                                            <a className="btn sm" href={buildValDownloadUrl(model.task_id, val.plots.results)} target="_blank" rel="noreferrer">下载</a>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {val.plots.pr_curve && (
                                                                    <div style={{ textAlign: 'center' }}>
                                                                        <div style={{ fontSize: '13px', color: 'var(--secondary-text-color)', marginBottom: '6px' }}>PR 曲线</div>
                                                                        <div style={{ cursor: 'zoom-in' }} onClick={() => { setPreviewInfo({ taskID: model.task_id, filePath: val.plots.pr_curve, title: 'PR 曲线' }); setPreviewVisible(true); }}>
                                                                            <ValResultImage taskID={model.task_id} filePath={val.plots.pr_curve} style={{ maxWidth: '320px', borderRadius: '6px', border: '1px solid var(--border-color)' }} />
                                                                        </div>
                                                                        <div style={{ marginTop: '6px' }}>
                                                                            <a className="btn sm" href={buildValDownloadUrl(model.task_id, val.plots.pr_curve)} target="_blank" rel="noreferrer">下载</a>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {val.plots.f1_curve && (
                                                                    <div style={{ textAlign: 'center' }}>
                                                                        <div style={{ fontSize: '13px', color: 'var(--secondary-text-color)', marginBottom: '6px' }}>F1 曲线</div>
                                                                        <div style={{ cursor: 'zoom-in' }} onClick={() => { setPreviewInfo({ taskID: model.task_id, filePath: val.plots.f1_curve, title: 'F1 曲线' }); setPreviewVisible(true); }}>
                                                                            <ValResultImage taskID={model.task_id} filePath={val.plots.f1_curve} style={{ maxWidth: '320px', borderRadius: '6px', border: '1px solid var(--border-color)' }} />
                                                                        </div>
                                                                        <div style={{ marginTop: '6px' }}>
                                                                            <a className="btn sm" href={buildValDownloadUrl(model.task_id, val.plots.f1_curve)} target="_blank" rel="noreferrer">下载</a>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {val.plots.p_curve && (
                                                                    <div style={{ textAlign: 'center' }}>
                                                                        <div style={{ fontSize: '13px', color: 'var(--secondary-text-color)', marginBottom: '6px' }}>P 曲线</div>
                                                                        <div style={{ cursor: 'zoom-in' }} onClick={() => { setPreviewInfo({ taskID: model.task_id, filePath: val.plots.p_curve, title: 'P 曲线' }); setPreviewVisible(true); }}>
                                                                            <ValResultImage taskID={model.task_id} filePath={val.plots.p_curve} style={{ maxWidth: '320px', borderRadius: '6px', border: '1px solid var(--border-color)' }} />
                                                                        </div>
                                                                        <div style={{ marginTop: '6px' }}>
                                                                            <a className="btn sm" href={buildValDownloadUrl(model.task_id, val.plots.p_curve)} target="_blank" rel="noreferrer">下载</a>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {val.plots.r_curve && (
                                                                    <div style={{ textAlign: 'center' }}>
                                                                        <div style={{ fontSize: '13px', color: 'var(--secondary-text-color)', marginBottom: '6px' }}>R 曲线</div>
                                                                        <div style={{ cursor: 'zoom-in' }} onClick={() => { setPreviewInfo({ taskID: model.task_id, filePath: val.plots.r_curve, title: 'R 曲线' }); setPreviewVisible(true); }}>
                                                                            <ValResultImage taskID={model.task_id} filePath={val.plots.r_curve} style={{ maxWidth: '320px', borderRadius: '6px', border: '1px solid var(--border-color)' }} />
                                                                        </div>
                                                                        <div style={{ marginTop: '6px' }}>
                                                                            <a className="btn sm" href={buildValDownloadUrl(model.task_id, val.plots.r_curve)} target="_blank" rel="noreferrer">下载</a>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                        {val.plots && !showPlots && (
                                                            <div className="tip-box" style={{ marginTop: '8px' }}>包含图表：可点击"查看图表"展开</div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                    {(!Array.isArray(validationsSorted) || validationsSorted.length === 0) && (
                                        <div className="tip-box" style={{ marginTop: '8px' }}>暂无验证记录</div>
                                    )}
                                </div>
                                    </>
                                )}
                                        </>
                                    );
                                })()}

                            {/* 预览大图弹层 */}
                            {previewVisible && (
                                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setPreviewVisible(false)}>
                                    <div style={{ background: '#fff', borderRadius: '8px', padding: '12px', maxWidth: '92vw', maxHeight: '92vh' }} onClick={(e) => e.stopPropagation()}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                            <div style={{ fontWeight: 'bold' }}>{previewInfo.title || '预览'}</div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <a 
                                                    className="btn sm" 
                                                    href={previewInfo.title === '测试结果图' ? 
                                                        `${CONFIGS.API_BASE_URL}/IModel/downloadTestResult?taskID=${previewInfo.taskID}&filePath=${encodeURIComponent(previewInfo.filePath)}` : 
                                                        buildValDownloadUrl(previewInfo.taskID, previewInfo.filePath)
                                                    } 
                                                    target="_blank" 
                                                    rel="noreferrer"
                                                >
                                                    下载
                                                </a>
                                                <button className="btn sm" onClick={() => setPreviewVisible(false)}>关闭</button>
                                            </div>
                                        </div>
                                        <div style={{ overflow: 'auto', maxWidth: '90vw', maxHeight: '82vh' }}>
                                            {previewInfo.title === '测试结果图' ? (
                                                <TestResultImage taskID={previewInfo.taskID} filePath={previewInfo.filePath} style={{ maxWidth: '100%', maxHeight: '80vh' }} />
                                            ) : (
                                                <ValResultImage taskID={previewInfo.taskID} filePath={previewInfo.filePath} style={{ maxWidth: '100%', maxHeight: '80vh' }} />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                            </div>
                        );
                    })()}
                </div>
            );
    }
}

export default ModelTestPage;
