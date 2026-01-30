/**
 * 任务表单验证器
 * 提供各字段的验证函数
 */
export const taskFormValidators = {
    /**
     * 验证任务名称
     * @param {string} value - 任务名称
     * @returns {string|null} 错误信息或 null
     */
    taskName: (value) => {
        if (!value?.trim()) return '任务名称不能为空';
        if (value.length > 50) return '任务名称不能超过50个字符';
        if (!/^[\u4e00-\u9fa5a-zA-Z0-9_-]+$/.test(value)) {
            return '任务名称只能包含中文、英文、数字、下划线和连字符';
        }
        return null;
    },

    /**
     * 验证训练轮数
     * @param {number} value - 训练轮数
     * @returns {string|null} 错误信息或 null
     */
    epochs: (value) => {
        if (!value || value < 1) return '训练轮数必须大于0';
        if (value > 10000) return '训练轮数不能超过10000';
        return null;
    },

    /**
     * 验证批次大小
     * @param {number} value - 批次大小
     * @returns {string|null} 错误信息或 null
     */
    batchSize: (value) => {
        if (!value || value < 1) return '批次大小必须大于0';
        if (value > 256) return '批次大小不能超过256';
        return null;
    },

    /**
     * 验证图片尺寸
     * @param {number} value - 图片尺寸
     * @returns {string|null} 错误信息或 null
     */
    imgSize: (value) => {
        if (!value || value < 32) return '图片尺寸必须至少为32';
        if (value > 1280) return '图片尺寸不能超过1280';
        if (value % 32 !== 0) return '图片尺寸必须是32的倍数';
        return null;
    },

    /**
     * 验证 GPU CUDA 索引
     * @param {string} value - CUDA 索引
     * @param {string} device - 设备类型
     * @returns {string|null} 错误信息或 null
     */
    gpuCUDAIndex: (value, device) => {
        if (device === 'gpu' && !value) return '请设置CUDA设备编号';
        return null;
    },

    /**
     * 验证数据集路径
     * @param {string} value - 数据集路径
     * @returns {string|null} 错误信息或 null
     */
    datasetPath: (value) => {
        if (!value?.trim()) return '请选择数据集';
        return null;
    },

    /**
     * 验证基础模型
     * @param {string} value - 模型路径
     * @returns {string|null} 错误信息或 null
     */
    baseModel: (value) => {
        if (!value?.trim()) return '请选择基础模型';
        return null;
    }
};

/**
 * 验证整个任务表单
 * @param {Object} formData - 表单数据
 * @returns {{ isValid: boolean, errors: Object }}
 */
export function validateTaskForm(formData) {
    const errors = {};

    // 验证必填字段
    const fieldsToValidate = ['taskName', 'epochs', 'batchSize', 'imgSize', 'datasetPath', 'baseModel'];

    fieldsToValidate.forEach(field => {
        const validator = taskFormValidators[field];
        if (validator) {
            const error = validator(formData[field], formData.device);
            if (error) {
                errors[field] = error;
            }
        }
    });

    // 特殊验证：GPU 设备需要 CUDA 索引
    if (formData.device === 'gpu') {
        const gpuError = taskFormValidators.gpuCUDAIndex(formData.gpuCUDAIndex, formData.device);
        if (gpuError) {
            errors.gpuCUDAIndex = gpuError;
        }
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
}

/**
 * 验证单个字段
 * @param {string} fieldName - 字段名
 * @param {any} value - 字段值
 * @param {Object} formData - 完整表单数据（用于关联验证）
 * @returns {string|null} 错误信息或 null
 */
export function validateField(fieldName, value, formData = {}) {
    const validator = taskFormValidators[fieldName];
    if (!validator) return null;
    return validator(value, formData.device);
}
