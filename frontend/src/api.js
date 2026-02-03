import CONFIGS from "./config";

const BASE_URL = CONFIGS.API_BASE_URL;

// API状态检查
let apiHealthy = true;
let lastHealthCheck = 0;
const HEALTH_CHECK_INTERVAL = 30000; // 30秒

// 简单的健康检查
async function checkApiHealth() {
    const now = Date.now();
    if (now - lastHealthCheck < HEALTH_CHECK_INTERVAL) {
        return apiHealthy;
    }

    try {
        const response = await fetch(`${BASE_URL}/`, {
            method: 'GET',
            signal: AbortSignal.timeout(5000) // 5秒超时
        });
        apiHealthy = response.ok;
        lastHealthCheck = now;
    } catch (error) {
        apiHealthy = false;
        lastHealthCheck = now;
        console.warn('[API HEALTH] Backend appears to be down:', error.message);
    }

    return apiHealthy;
}

function buildQuery(params = {}) {
    const query = new URLSearchParams(params).toString();
    return query ? `?${query}` : "";
}

function getHeaders(customHeaders = {}) {
    return {
        "Content-Type": "application/json",
        ...customHeaders,
    };
}

async function request(method, endpoint, { data, params, headers, signal, timeout = 30000 } = {}) {
    const url = `${BASE_URL}${endpoint}${buildQuery(params)}`;
    const options = {
        method,
        headers: getHeaders(headers),
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    // 创建超时控制器
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // 如果有外部signal，监听其abort事件并传播到内部controller
    if (signal) {
        signal.addEventListener('abort', () => {
            controller.abort();
        }, { once: true });
    }

    // 始终使用内部controller的signal（这样超时和外部取消都能工作）
    options.signal = controller.signal;

    try {
        const response = await fetch(url, options);

        const contentType = response.headers.get("content-type");
        const isJson = contentType && contentType.includes("application/json");

        let result;
        try {
            result = isJson ? await response.json() : await response.text();
        } catch (parseError) {
            throw new Error(`响应解析失败: ${parseError.message}`);
        }

        if (!response.ok) {
            // 改进错误消息提取逻辑
            const errorMsg = result?.message || result?.msg || result?.error || response.statusText || '请求失败';
            throw new Error(errorMsg);
        }

        return result;
    } catch (error) {
        // 处理不同类型的错误
        if (error.name === 'AbortError') {
            // 区分是超时还是手动取消
            const wasTimeout = !signal || !signal.aborted;
            const timeoutError = new Error(wasTimeout ? '请求超时，请检查网络连接' : '请求已取消');
            timeoutError.code = wasTimeout ? 'TIMEOUT' : 'CANCELLED';
            console.error(`[API ${timeoutError.code}] ${method} ${endpoint}:`, timeoutError);

            // 只对非取消的超时错误触发全局事件
            if (wasTimeout) {
                window.dispatchEvent(new CustomEvent('api-error', {
                    detail: { message: timeoutError.message, code: timeoutError.code }
                }));
            }
            throw timeoutError;
        }

        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            const networkError = new Error('网络连接失败，请检查网络设置');
            networkError.code = 'NETWORK_ERROR';
            console.error(`[API NETWORK ERROR] ${method} ${endpoint}:`, networkError);

            // 触发全局错误事件
            window.dispatchEvent(new CustomEvent('api-error', {
                detail: { message: networkError.message, code: networkError.code }
            }));
            throw networkError;
        }

        console.error(`[API ERROR] ${method} ${endpoint}:`, error);

        // 触发全局错误事件（用于 Toast 显示）
        window.dispatchEvent(new CustomEvent('api-error', {
            detail: { message: error.message, code: error.code || 'UNKNOWN' }
        }));

        throw error;
    } finally {
        // 确保超时定时器总是被清理
        clearTimeout(timeoutId);
    }
}

async function upload(endpoint, formData, { params, signal, timeout = 60000 } = {}) {
    const url = `${BASE_URL}${endpoint}${buildQuery(params)}`;

    // 创建超时控制器
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // 如果有外部signal，监听其abort事件
    if (signal) {
        signal.addEventListener('abort', () => {
            controller.abort();
        }, { once: true });
    }

    try {
        const response = await fetch(url, {
            method: "POST",
            // 不要手动设置 Content-Type，浏览器会自动设置 multipart 边界
            body: formData,
            signal: controller.signal,
        });

        const contentType = response.headers.get("content-type");
        const isJson = contentType && contentType.includes("application/json");

        let result;
        try {
            result = isJson ? await response.json() : await response.text();
        } catch (parseError) {
            throw new Error(`上传响应解析失败: ${parseError.message}`);
        }

        if (!response.ok) {
            const errorMsg = result?.message || result?.msg || result?.error || response.statusText || '上传失败';
            throw new Error(errorMsg);
        }

        return result;
    } catch (error) {
        if (error.name === 'AbortError') {
            // 区分是超时还是手动取消
            const wasTimeout = !signal || !signal.aborted;
            const timeoutError = new Error(wasTimeout ? '上传超时，请检查网络连接或文件大小' : '上传已取消');
            timeoutError.code = wasTimeout ? 'UPLOAD_TIMEOUT' : 'UPLOAD_CANCELLED';
            console.error(`[API ${timeoutError.code}] ${endpoint}:`, timeoutError);
            throw timeoutError;
        }

        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            const networkError = new Error('上传网络连接失败');
            networkError.code = 'UPLOAD_NETWORK_ERROR';
            console.error(`[API UPLOAD NETWORK ERROR] ${endpoint}:`, networkError);
            throw networkError;
        }

        console.error(`[API ERROR] UPLOAD ${endpoint}:`, error);
        throw error;
    } finally {
        // 确保超时定时器总是被清理
        clearTimeout(timeoutId);
    }
}

// 添加重试功能的包装函数
async function requestWithRetry(method, url, options = {}, maxRetries = 2) {
    const { retries = maxRetries, retryDelay = 1000, ...requestOptions } = options;

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            return await request(method, url, requestOptions);
        } catch (error) {
            // 只对网络错误和超时进行重试
            const shouldRetry = attempt < retries &&
                (error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT');

            if (!shouldRetry) {
                throw error;
            }

            console.warn(`[API RETRY] ${method} ${url} - Attempt ${attempt + 1}/${retries + 1} failed, retrying in ${retryDelay}ms...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
        }
    }
}

export const api = {
    get: (url, options = {}) => requestWithRetry("GET", url, options),
    post: (url, options = {}) => requestWithRetry("POST", url, options),
    put: (url, options = {}) => requestWithRetry("PUT", url, options),
    del: (url, options = {}) => requestWithRetry("DELETE", url, options),
    upload: (url, formData, options = {}) => upload(url, formData, options),
    // 提供不重试的原始方法
    getRaw: (url, options = {}) => request("GET", url, options),
    postRaw: (url, options = {}) => request("POST", url, options),
    putRaw: (url, options = {}) => request("PUT", url, options),
    delRaw: (url, options = {}) => request("DELETE", url, options),

    // 服务配置 API
    getServiceConfig: () => request("GET", "/getServiceConfig"),
    updateServiceConfig: (serviceId, host, port, apiToken) =>
        request("POST", "/updateServiceConfig", {
            data: {
                service_id: serviceId,
                host,
                port,
                api_token: apiToken
            }
        }),
};