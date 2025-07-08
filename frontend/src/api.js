import CONFIGS from "./config";

const BASE_URL = CONFIGS.API_BASE_URL;

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

async function request(method, endpoint, { data, params, headers } = {}) {
    const url = `${BASE_URL}${endpoint}${buildQuery(params)}`;
    const options = {
        method,
        headers: getHeaders(headers),
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(url, options);
        const contentType = response.headers.get("content-type");
        const isJson = contentType && contentType.includes("application/json");
        const result = isJson ? await response.json() : await response.text();

        if (!response.ok) {
            throw new Error(result?.message || response.statusText);
        }

        return result;
    } catch (error) {
        console.error(`[API ERROR] ${method} ${endpoint}:`, error);
        throw error;
    }
}

export const api = {
    get: (url, options = {}) => request("GET", url, options),
    post: (url, options = {}) => request("POST", url, options),
    put: (url, options = {}) => request("PUT", url, options),
    del: (url, options = {}) => request("DELETE", url, options),
};