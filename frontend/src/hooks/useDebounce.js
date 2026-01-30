import { useState, useEffect, useCallback } from 'react';

/**
 * 防抖 Hook - 延迟更新值
 * @param {any} value - 需要防抖的值
 * @param {number} delay - 延迟时间（毫秒）
 * @returns {any} 防抖后的值
 * 
 * @example
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearch = useDebounce(searchTerm, 300);
 * 
 * useEffect(() => {
 *   // 只有当用户停止输入 300ms 后才会执行搜索
 *   if (debouncedSearch) {
 *     searchAPI(debouncedSearch);
 *   }
 * }, [debouncedSearch]);
 */
export function useDebounce(value, delay = 300) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(timer);
        };
    }, [value, delay]);

    return debouncedValue;
}

/**
 * 防抖回调 Hook - 延迟执行函数
 * @param {Function} callback - 需要防抖的回调函数
 * @param {number} delay - 延迟时间（毫秒）
 * @returns {Function} 防抖后的函数
 * 
 * @example
 * const handleSearch = useDebouncedCallback((value) => {
 *   searchAPI(value);
 * }, 300);
 * 
 * <input onChange={(e) => handleSearch(e.target.value)} />
 */
export function useDebouncedCallback(callback, delay = 300) {
    const [timer, setTimer] = useState(null);

    const debouncedCallback = useCallback((...args) => {
        if (timer) {
            clearTimeout(timer);
        }

        const newTimer = setTimeout(() => {
            callback(...args);
        }, delay);

        setTimer(newTimer);
    }, [callback, delay, timer]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timer) {
                clearTimeout(timer);
            }
        };
    }, [timer]);

    return debouncedCallback;
}
