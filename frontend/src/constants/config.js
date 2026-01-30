/**
 * 训练配置常量
 */

// 训练类型
export const TRAINING_TYPES = {
    FINETUNE: '0',        // 微调训练
    FROM_SCRATCH: '1'     // 从头训练
};

export const TRAINING_TYPE_LABELS = {
    [TRAINING_TYPES.FINETUNE]: '微调训练',
    [TRAINING_TYPES.FROM_SCRATCH]: '从头训练'
};

// 设备类型
export const DEVICE_TYPES = {
    CPU: 'cpu',
    GPU: 'gpu',
    GPU_IDLE_FIRST: 'gpu_idlefirst',
    MPS: 'mps'
};

export const DEVICE_TYPE_LABELS = {
    [DEVICE_TYPES.CPU]: 'CPU',
    [DEVICE_TYPES.GPU]: 'GPU (指定)',
    [DEVICE_TYPES.GPU_IDLE_FIRST]: 'GPU (自动选择空闲)',
    [DEVICE_TYPES.MPS]: 'MPS (Apple Silicon)'
};

// 缓存类型
export const CACHE_TYPES = {
    DISK: 'disk',
    RAM: 'ram',
    FALSE: 'false'
};

export const CACHE_TYPE_LABELS = {
    [CACHE_TYPES.DISK]: '磁盘缓存',
    [CACHE_TYPES.RAM]: '内存缓存',
    [CACHE_TYPES.FALSE]: '不使用缓存'
};

// 默认任务配置
export const DEFAULT_TASK_CONFIG = {
    epochs: 100,
    batchSize: 16,
    imgSize: 640,
    device: DEVICE_TYPES.CPU,
    gpuCUDAIndex: '0',
    cache: CACHE_TYPES.DISK,
    trainingType: TRAINING_TYPES.FINETUNE,
    workers: 4,
    patience: 50,
    optimizer: 'auto'
};

// 优化器选项
export const OPTIMIZER_OPTIONS = [
    { value: 'auto', label: '自动选择' },
    { value: 'SGD', label: 'SGD' },
    { value: 'Adam', label: 'Adam' },
    { value: 'AdamW', label: 'AdamW' },
    { value: 'NAdam', label: 'NAdam' },
    { value: 'RAdam', label: 'RAdam' }
];

// 图片尺寸选项
export const IMAGE_SIZE_OPTIONS = [
    { value: 320, label: '320 (小)' },
    { value: 416, label: '416' },
    { value: 512, label: '512' },
    { value: 640, label: '640 (推荐)' },
    { value: 768, label: '768' },
    { value: 1024, label: '1024 (大)' },
    { value: 1280, label: '1280 (超大)' }
];

// 任务状态
export const TASK_STATUS = {
    PENDING: 'pending',
    RUNNING: 'running',
    COMPLETED: 'completed',
    FAILED: 'failed',
    STOPPED: 'stopped'
};

export const TASK_STATUS_LABELS = {
    [TASK_STATUS.PENDING]: '等待中',
    [TASK_STATUS.RUNNING]: '训练中',
    [TASK_STATUS.COMPLETED]: '已完成',
    [TASK_STATUS.FAILED]: '失败',
    [TASK_STATUS.STOPPED]: '已停止'
};

// API 端点
export const API_ENDPOINTS = {
    BASE_URL: 'http://127.0.0.1:5000',

    // 训练相关
    GET_ALL_TASKS: '/ITraining/getAllTasks',
    CREATE_TASK: '/ITraining/createTask',
    START_TASK: '/ITraining/startTask',
    DELETE_TASK: '/ITraining/deleteTask',
    GET_TASK_STATUS: '/ITraining/getTaskStatus',

    // 数据集相关
    GET_DATASETS: '/IDataSet/getDataSets',

    // 模型相关
    GET_BASE_MODELS: '/ITraining/getBaseModels',
    GET_FINE_TUNED_MODELS: '/ITraining/getFineTunedModels'
};

// 版本信息
export const APP_VERSION = {
    FRONTEND: '2.0.0',
    MIN_BACKEND: '1.0.0'
};
