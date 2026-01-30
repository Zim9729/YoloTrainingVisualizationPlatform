import { useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';

/**
 * API 错误监听器组件
 * 监听全局 api-error 事件并显示 Toast 通知
 * 
 * 必须放在 ToastProvider 内部使用
 */
export function ApiErrorListener() {
    const toast = useToast();

    useEffect(() => {
        const handleApiError = (event) => {
            const { message, code } = event.detail;

            // 根据错误类型显示不同样式的 Toast
            if (code === 'NETWORK_ERROR') {
                toast.error(`网络错误: ${message}`);
            } else if (code === 'TIMEOUT') {
                toast.warning(`请求超时: ${message}`);
            } else {
                toast.error(message);
            }
        };

        window.addEventListener('api-error', handleApiError);

        return () => {
            window.removeEventListener('api-error', handleApiError);
        };
    }, [toast]);

    // 这是一个无渲染组件
    return null;
}
