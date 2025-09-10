import { useState, useEffect } from "react";
import { api } from "../api";
import Icon_Box_seam_fill from "../assets/icons/box-seam-fill.svg";

function LogPanel({ 
    visible, 
    onClose, 
    logFilename, 
    taskType, 
    onTaskComplete,
    parameter,
    setPageUrl 
}) {
    const [logText, setLogText] = useState("");
    const [isRunning, setIsRunning] = useState(false);

    // 轮询日志
    useEffect(() => {
        if (!visible || !logFilename) return;

        let timer = null;
        let isMounted = true;

        const poll = async () => {
            try {
                const isVal = taskType === "validation";
                const endpoint = isVal ? "/IModel/getValTaskLog" : "/IModel/getTaskLog";
                const res = await api.get(`${endpoint}?filename=${encodeURIComponent(logFilename)}`);
                
                if (!isMounted) return;
                
                if (res.code === 200 && res.data) {
                    setLogText(res.data.log || "");
                    setIsRunning(!!res.data.is_running);
                    if (!res.data.is_running) {
                        if (timer) {
                            clearInterval(timer);
                            timer = null;
                        }
                        if (onTaskComplete) {
                            onTaskComplete();
                        }
                    }
                }
            } catch (err) {
                if (isMounted) {
                    console.error("获取日志失败:", err);
                }
            }
        };

        poll();
        timer = setInterval(poll, 1000);

        return () => {
            isMounted = false;
            if (timer) {
                clearInterval(timer);
                timer = null;
            }
        };
    }, [visible, logFilename, taskType, onTaskComplete]);

    const buildHistoryUrl = () => {
        try {
            const ts = parseInt(parameter.folder?.split('_')?.[2] || '0');
            const startedAtStr = ts ? new Date(ts * 1000).toLocaleString() : '';
            const openType = taskType === "validation" ? "validation" : "test";
            return `modelTest?taskName=${encodeURIComponent(parameter.taskName || '')}&startedAt=${encodeURIComponent(startedAtStr)}&folder=${encodeURIComponent(parameter.folder || '')}&open=${openType}`;
        } catch (e) {
            const openType = taskType === "validation" ? "validation" : "test";
            return `modelTest?taskName=${encodeURIComponent(parameter.taskName || '')}&folder=${encodeURIComponent(parameter.folder || '')}&open=${openType}`;
        }
    };

    if (!visible) return null;

    return (
        <div style={{ marginTop: '20px' }}>
            <div className="form-group-title">
                <h1 className="step-tag nobg">
                    <img src={Icon_Box_seam_fill} className="icon" />
                </h1>
                <h1 className="title">{taskType === "validation" ? "验证日志" : "测试日志"}</h1>
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
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px', alignItems: 'center' }}>
                <span style={{ color: 'var(--secondary-text-color)' }}>
                    状态：{isRunning ? '运行中' : '已结束'}
                </span>
                {!isRunning && (
                    <>
                        <button className="btn sm" onClick={() => setPageUrl("models?type=trained")}>
                            返回训练模型列表
                        </button>
                        <button className="btn sm" onClick={() => setPageUrl(buildHistoryUrl())}>
                            查看{taskType === "validation" ? "验证" : "测试"}历史记录
                        </button>
                    </>
                )}
                <button className="btn sm" onClick={onClose}>收起</button>
            </div>
        </div>
    );
}

export default LogPanel;
