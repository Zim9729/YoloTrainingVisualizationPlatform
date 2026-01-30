import { useState, useCallback, createContext, useContext } from 'react';

const ConfirmContext = createContext();

/**
 * Modal 确认框组件
 */
function ConfirmModal({ isOpen, title, message, confirmText, cancelText, onConfirm, onCancel, type }) {
    if (!isOpen) return null;

    const typeClass = type === 'danger' ? 'danger' : '';

    return (
        <div className="modal-backdrop" onClick={onCancel}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <h3 className="modal-title">{title || '确认操作'}</h3>
                <p className="modal-message">{message}</p>
                <div className="modal-actions">
                    <button className="btn secondary" onClick={onCancel}>
                        {cancelText || '取消'}
                    </button>
                    <button className={`btn ${typeClass}`} onClick={onConfirm}>
                        {confirmText || '确认'}
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * Confirm Provider - 提供全局确认弹窗能力
 */
export function ConfirmProvider({ children }) {
    const [state, setState] = useState({
        isOpen: false,
        config: {},
        resolve: null
    });

    const confirm = useCallback((config) => {
        return new Promise((resolve) => {
            setState({
                isOpen: true,
                config,
                resolve
            });
        });
    }, []);

    const handleConfirm = useCallback(() => {
        state.resolve?.(true);
        setState({ isOpen: false, config: {}, resolve: null });
    }, [state.resolve]);

    const handleCancel = useCallback(() => {
        state.resolve?.(false);
        setState({ isOpen: false, config: {}, resolve: null });
    }, [state.resolve]);

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}
            <ConfirmModal
                isOpen={state.isOpen}
                {...state.config}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
            />
        </ConfirmContext.Provider>
    );
}

/**
 * 使用确认弹窗的 Hook
 * @returns {{ confirm: (config: {title?: string, message: string, confirmText?: string, cancelText?: string, type?: 'danger'}) => Promise<boolean> }}
 * 
 * @example
 * const { confirm } = useConfirm();
 * const confirmed = await confirm({ 
 *   title: '删除确认', 
 *   message: '确定要删除这个任务吗？',
 *   type: 'danger'
 * });
 * if (confirmed) { ... }
 */
export const useConfirm = () => {
    const context = useContext(ConfirmContext);
    if (!context) {
        throw new Error('useConfirm must be used within a ConfirmProvider');
    }
    return context;
};
