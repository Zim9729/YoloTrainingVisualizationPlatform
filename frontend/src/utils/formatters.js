/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的字符串
 */
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + units[i];
}

/**
 * 格式化日期时间
 * @param {string|Date} date - 日期
 * @param {string} format - 格式：'full' | 'date' | 'time' | 'relative'
 * @returns {string} 格式化后的字符串
 */
export function formatDateTime(date, format = 'full') {
    const d = new Date(date);

    if (format === 'relative') {
        return formatRelativeTime(d);
    }

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    switch (format) {
        case 'date':
            return `${year}-${month}-${day}`;
        case 'time':
            return `${hours}:${minutes}:${seconds}`;
        case 'full':
        default:
            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
}

/**
 * 格式化相对时间
 * @param {Date} date - 日期
 * @returns {string} 相对时间字符串
 */
export function formatRelativeTime(date) {
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;

    return formatDateTime(date, 'date');
}

/**
 * 格式化训练时长
 * @param {number} seconds - 秒数
 * @returns {string} 格式化后的时长
 */
export function formatDuration(seconds) {
    if (seconds < 60) return `${seconds}秒`;

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
        return `${hours}小时${minutes}分钟`;
    }

    return `${minutes}分钟${secs}秒`;
}

/**
 * 格式化百分比
 * @param {number} value - 小数值 (0-1)
 * @param {number} decimals - 小数位数
 * @returns {string} 百分比字符串
 */
export function formatPercent(value, decimals = 1) {
    return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * 截断文本
 * @param {string} text - 原始文本
 * @param {number} maxLength - 最大长度
 * @param {string} suffix - 后缀
 * @returns {string} 截断后的文本
 */
export function truncateText(text, maxLength = 50, suffix = '...') {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * 格式化路径（只显示最后几级目录）
 * @param {string} path - 完整路径
 * @param {number} levels - 显示的目录层级数
 * @returns {string} 简化后的路径
 */
export function formatPath(path, levels = 2) {
    if (!path) return '';

    const parts = path.replace(/\\/g, '/').split('/').filter(Boolean);

    if (parts.length <= levels) {
        return parts.join('/');
    }

    return '.../' + parts.slice(-levels).join('/');
}
