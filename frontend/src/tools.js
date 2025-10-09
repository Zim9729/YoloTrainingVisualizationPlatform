function pathJoin(...parts) {
    // 使用更可靠的平台检测方法
    const isWindows = typeof window !== 'undefined' && 
        (window.navigator.userAgent.includes('Windows') || 
         window.navigator.userAgent.includes('Win32') ||
         window.navigator.userAgent.includes('Win64'));
    const separator = isWindows ? '\\' : '/';

    return parts
        .map((part, index) => {
            if (index === 0) return part.replace(/[\\/]+$/, '');
            return part.replace(/^[\\/]+|[\\/]+$/g, '');
        })
        .filter(Boolean)
        .join(separator);
}

function splitPath(filePath) {
    return filePath
        .replace(/\\/g, '/') 
        .split('/')
        .filter(Boolean);
}

// 服务状态工具函数
function getStatusColor(status) {
    switch(status) {
        case 'online': return '#28a745';
        case 'offline': return '#dc3545'; 
        case 'error': return '#fd7e14';
        case 'unknown': return '#6c757d';
        default: return '#6c757d';
    }
}

function getStatusText(status) {
    switch(status) {
        case 'online': return '在线';
        case 'offline': return '离线';
        case 'error': return '错误';
        case 'unknown': return '未知';
        default: return '未知';
    }
}

// 统一错误处理函数
function handleApiError(error, customMessage = '操作失败') {
    let errorMessage = customMessage;
    
    if (error) {
        if (error.code === 'TIMEOUT' || error.code === 'UPLOAD_TIMEOUT') {
            errorMessage = '请求超时，请检查网络连接';
        } else if (error.code === 'NETWORK_ERROR' || error.code === 'UPLOAD_NETWORK_ERROR') {
            errorMessage = '网络连接失败，请检查网络设置';
        } else if (error.message) {
            errorMessage = error.message;
        } else if (typeof error === 'string') {
            errorMessage = error;
        }
    }
    
    return errorMessage;
}

// 统一的 alert 错误显示
function showError(error, customMessage = '操作失败') {
    const errorMessage = handleApiError(error, customMessage);
    alert(errorMessage);
}

export {
    pathJoin,
    splitPath,
    getStatusColor,
    getStatusText,
    handleApiError,
    showError
};