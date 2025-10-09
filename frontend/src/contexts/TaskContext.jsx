import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';

const TaskContext = createContext();

export function TaskProvider({ children }) {
    const [runningTasks, setRunningTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchRunningTasks = async () => {
            try {
                const data = await api.get("/ITraining/getAllRunningTasks", { params: {} });
                setRunningTasks(data.data.tasks || []);
                setIsLoading(false);
            } catch (err) {
                console.error("获取正在运行的训练任务失败:", err);
                setRunningTasks([]);
                setIsLoading(false);
            }
        };

        // 初始加载
        fetchRunningTasks();

        // 每 5 秒轮询一次
        const intervalId = setInterval(fetchRunningTasks, 5000);

        return () => clearInterval(intervalId);
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
