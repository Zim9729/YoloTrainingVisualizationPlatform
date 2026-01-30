import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

/**
 * Toast 通知 Provider
 * 提供 success, error, warning, info 四种通知方法
 */
export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'info', duration = 3000) => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, type }]);

        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, duration);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const success = useCallback((msg) => showToast(msg, 'success'), [showToast]);
    const error = useCallback((msg) => showToast(msg, 'error'), [showToast]);
    const warning = useCallback((msg) => showToast(msg, 'warning'), [showToast]);
    const info = useCallback((msg) => showToast(msg, 'info'), [showToast]);

    return (
        <ToastContext.Provider value={{ success, error, warning, info }}>
            {children}
            <div className="toast-container">
                {toasts.map(toast => (
                    <div key={toast.id} className={`toast ${toast.type}`}>
                        <div className="toast-icon">
                            {toast.type === 'success' && '✓'}
                            {toast.type === 'error' && '✕'}
                            {toast.type === 'warning' && '⚠'}
                            {toast.type === 'info' && 'ℹ'}
                        </div>
                        <div className="toast-content">
                            <div className="toast-message">{toast.message}</div>
                        </div>
                        <button
                            className="toast-close"
                            onClick={() => removeToast(toast.id)}
                            aria-label="关闭"
                        >
                            ✕
                        </button>
                        <div className="toast-progress" style={{ animationDuration: '3s' }} />
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

/**
 * 使用 Toast 通知的 Hook
 * @returns {{ success: Function, error: Function, warning: Function, info: Function }}
 */
export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
