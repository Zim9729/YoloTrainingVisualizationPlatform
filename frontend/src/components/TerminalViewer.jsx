import { useEffect, useRef } from "react";
import { Terminal } from "xterm";
import "xterm/css/xterm.css";
import { api } from "../api";

function TerminalViewer({ filename, setIsRunning, trainingCompleted }) {
    const terminalRef = useRef(null);
    const termInstance = useRef(null);

    useEffect(() => {
        termInstance.current = new Terminal({
            cursorBlink: true,
            fontSize: 14,
        });

        termInstance.current.open(terminalRef.current);

        return () => {
            termInstance.current?.dispose();
        };
    }, []);

    useEffect(() => {
        const fetchLog = () => {
            api.get("/ITraining/getTaskLog", {
                params: { filename },
            })
                .then(res => {
                    if (res.code === 200) {
                        const { log, is_running } = res.data;
                        if (termInstance.current) {
                            termInstance.current.clear();
                            termInstance.current.write(log.replace(/\n/g, "\r\n"));
                        }
                        if (!is_running) {
                            clearInterval(timerRef.current);
                            trainingCompleted();
                        }

                        setIsRunning(is_running);
                    }
                })
                .catch(err => {
                    console.error("获取日志失败:", err);
                });
        };

        const timerRef = { current: null };

        fetchLog();
        timerRef.current = setInterval(fetchLog, 3000); // 每3秒请求一次

        return () => {
            clearInterval(timerRef.current);
        };
    }, [filename]);

    return (
        <div style={{ width: "100%", height: "400px", backgroundColor: "#000" }}>
            <div ref={terminalRef} style={{ height: "100%" }} />
        </div>
    );
}

export default TerminalViewer;
