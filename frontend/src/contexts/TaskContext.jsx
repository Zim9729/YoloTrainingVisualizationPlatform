import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';

const TaskContext = createContext();

export function TaskProvider({ children }) {
    const [runningTasks, setRunningTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        let intervalId = null;

        const fetchRunningTasks = async () => {
            // 检查组件是否还挂载
            if (!isMounted) return;
            
            try {
                const data = await api.get("/ITraining/getAllRunningTasks");
                
                // 再次检查，因为请求可能需要时间
                if (isMounted) {
                    setRunningTasks(data.data.tasks || []);
                    setIsLoading(false);
                }
            } catch (err) {
                console.error("获取正在运行的训练任务失败:", err);
                
                if (isMounted) {
                    setRunningTasks([]);
                    setIsLoading(false);
                }
            }
        };

        // 初始加载
        fetchRunningTasks();

        // 每 5 秒轮询一次
        intervalId = setInterval(() => {
            if (isMounted) {
                fetchRunningTasks();
            }
        }, 5000);

        // 清理函数
        return () => {
            isMounted = false;
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, []);

    // 手动刷新函数
    const refreshRunningTasks = async () => {
        try {
            const data = await api.get("/ITraining/getAllRunningTasks", { params: {} });
            setRunningTasks(data.data.tasks || []);
        } catch (err) {
            console.error("刷新运行任务失败:", err);
        }
    };

    // 检查某个任务是否正在运行
    const isTaskRunning = (filename) => {
        return runningTasks.some(task => task.filename === filename);
    };

    // 获取运行任务的文件名列表
    const getRunningFilenames = () => {
        return runningTasks.map(task => task.filename);
    };

    const value = {
        runningTasks,
        isLoading,
        refreshRunningTasks,
        isTaskRunning,
        getRunningFilenames,
        runningTasksCount: runningTasks.length
    };

    return (
        <TaskContext.Provider value={value}>
            {children}
        </TaskContext.Provider>
    );
}

// 自定义 Hook
export function useRunningTasks() {
    const context = useContext(TaskContext);
    if (context === undefined) {
        throw new Error('useRunningTasks must be used within a TaskProvider');
    }
    return context;
}

export default TaskContext;
