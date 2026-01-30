import { useState, useCallback } from 'react';

/**
 * 通用 API 调用 Hook
 * 提供 loading、error、data 状态管理
 * 
 * @param {Function} apiFunction - API 调用函数
 * @returns {{ execute: Function, loading: boolean, error: Error|null, data: any, reset: Function }}
 * 
 * @example
 * const { execute: fetchTasks, loading, data: tasks, error } = useApi(taskService.getAllTasks);
 * 
 * useEffect(() => {
 *   fetchTasks();
 * }, []);
 * 
 * if (loading) return <Spinner />;
 * if (error) return <Error message={error.message} />;
 * return <TaskList tasks={tasks} />;
 */
export function useApi(apiFunction) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);

    const execute = useCallback(async (...args) => {
        try {
            setLoading(true);
            setError(null);
            const result = await apiFunction(...args);
            setData(result);
            return result;
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [apiFunction]);

    const reset = useCallback(() => {
        setLoading(false);
        setError(null);
        setData(null);
    }, []);

    return { execute, loading, error, data, reset };
}

/**
 * 带自动执行的 API Hook
 * 组件挂载时自动调用 API
 * 
 * @param {Function} apiFunction - API 调用函数
 * @param {Array} deps - 依赖数组，变化时重新执行
 * @returns {{ loading: boolean, error: Error|null, data: any, refetch: Function }}
 */
export function useAutoApi(apiFunction, deps = []) {
    const { execute, loading, error, data } = useApi(apiFunction);

    // Auto-execute on mount and when deps change
    useState(() => {
        execute();
    });

    return { loading, error, data, refetch: execute };
}
