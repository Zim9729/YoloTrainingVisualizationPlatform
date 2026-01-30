import { useState, useEffect } from 'react';
import { api } from '../api';
import { getStatusColor, getStatusText } from '../tools';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmContext';
import '../styles/services.css';

function TcpImageProcessorPage({ setPageUrl }) {
    const [serviceStatus, setServiceStatus] = useState('unknown');
    const [serviceInfo, setServiceInfo] = useState({});
    const [processingHistory, setProcessingHistory] = useState([]);
    const [statistics, setStatistics] = useState({});
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [cameraId, setCameraId] = useState(203);
    const [imageId, setImageId] = useState('');
    const [folderPath, setFolderPath] = useState('');
    const [folderFiles, setFolderFiles] = useState([]);
    const [showFolderProcessor, setShowFolderProcessor] = useState(false);
    const [isBatchProcessing, setIsBatchProcessing] = useState(false);
    const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
    const [selectedRecords, setSelectedRecords] = useState([]);
    const [showResultModal, setShowResultModal] = useState(false);
    const [currentResult, setCurrentResult] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all'); // all, success, error, batch, single

    const toast = useToast();
    const { confirm } = useConfirm();

    useEffect(() => {
        checkServiceStatus();
        loadProcessingHistory();
        loadStatistics();
    }, []);

    const checkServiceStatus = async () => {
        try {
            console.log('正在检查服务状态...');
            const response = await api.get('/IImageProcessor/getServiceStatus');
            console.log('服务状态响应:', response);

            if (response && response.code === 200 && response.data) {
                setServiceStatus(response.data.status || 'unknown');
                setServiceInfo(response.data);
            } else {
                setServiceStatus('error');
                console.error('服务状态响应错误:', response?.msg || '未知错误');
                setServiceInfo({ error_message: response?.msg || '获取服务状态失败' });
            }
        } catch (error) {
            setServiceStatus('error');
            console.error('获取服务状态失败:', error);
            setServiceInfo({ error_message: error.message });
        }
    };

    const loadProcessingHistory = async () => {
        try {
            console.log('正在加载处理历史...');
            const response = await api.get('/IImageProcessor/getProcessingHistory', {
                params: { page: 1, page_size: 10 }
            });
            console.log('处理历史响应:', response);

            if (response && response.code === 200 && response.data) {
                setProcessingHistory(response.data.records || []);
            } else {
                console.error('获取处理历史失败:', response?.msg || '未知错误');
                setProcessingHistory([]);
            }
        } catch (error) {
            console.error('获取处理历史失败:', error);
            setProcessingHistory([]);
        }
    };

    const loadStatistics = async () => {
        try {
            console.log('正在加载统计信息...');
            const response = await api.get('/IImageProcessor/getProcessingStatistics');
            console.log('统计信息响应:', response);

            if (response && response.code === 200 && response.data) {
                setStatistics(response.data);
            } else {
                console.error('获取统计信息失败:', response?.msg || '未知错误');
                setStatistics({});
            }
        } catch (error) {
            console.error('获取统计信息失败:', error);
            setStatistics({});
        }
    };

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        setSelectedFile(file);
    };

    const handleImageProcess = async () => {
        if (!selectedFile) {
            toast.warning('请选择图像文件');
            return;
        }

        if (serviceStatus !== 'online') {
            toast.warning('TCP服务未连接，请检查服务状态');
            return;
        }

        setIsProcessing(true);
        try {
            const formData = new FormData();
            formData.append('image', selectedFile);
            formData.append('camera_id', cameraId.toString());
            if (imageId) {
                formData.append('image_id', imageId.toString());
            }

            console.log('开始处理图像:', {
                filename: selectedFile.name,
                size: selectedFile.size,
                camera_id: cameraId,
                image_id: imageId
            });

            // 使用专门的upload方法处理文件上传
            const response = await api.upload('/IImageProcessor/processImage', formData, {
                timeout: 60000 // 60秒超时
            });

            console.log('图像处理响应:', response);

            if (response.code === 200) {
                toast.success('图像处理完成！');

                // 刷新历史记录和统计
                await loadProcessingHistory();
                await loadStatistics();

                // 清空表单
                setSelectedFile(null);
                setImageId('');
                const fileInput = document.getElementById('imageInput');
                if (fileInput) {
                    fileInput.value = '';
                }
            } else {
                throw new Error(response.msg || '处理失败');
            }

        } catch (error) {
            console.error('图像处理失败:', error);

            // 错误消息处理
            let errorMessage = '图像处理失败';
            if (error.code === 'UPLOAD_TIMEOUT') {
                errorMessage = '上传超时，请检查网络连接或文件大小';
            } else if (error.code === 'UPLOAD_NETWORK_ERROR') {
                errorMessage = '网络连接失败，请检查网络设置';
            } else if (error.message) {
                errorMessage = error.message;
            }

            toast.error(`${errorMessage}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const formatProcessingTime = (seconds) => {
        if (seconds < 1) {
            return `${(seconds * 1000).toFixed(1)}ms`;
        } else {
            return `${seconds.toFixed(2)}s`;
        }
    };

    const formatTimestamp = (timestamp) => {
        return new Date(timestamp).toLocaleString('zh-CN');
    };

    const loadFolderFiles = async () => {
        if (!folderPath.trim()) {
            toast.warning('请输入文件夹路径');
            return;
        }

        try {
            const response = await api.post('/IImageProcessor/getFolderImageList', {
                data: { folder_path: folderPath.trim() }
            });

            if (response && response.code === 200 && response.data) {
                setFolderFiles(response.data.files || []);
                const dirCount = Object.keys(response.data.directory_stats || {}).length;
                toast.success(`递归扫描完成！找到 ${response.data.total_files} 个图像文件，分布在 ${dirCount} 个目录中，总大小: ${response.data.total_size_mb} MB`);
            } else {
                toast.error('获取文件列表失败: ' + (response?.msg || '未知错误'));
                setFolderFiles([]);
            }
        } catch (error) {
            console.error('获取文件列表失败:', error);
            toast.error('获取文件列表失败: ' + error.message);
            setFolderFiles([]);
        }
    };

    const processFolderImages = async () => {
        if (folderFiles.length === 0) {
            toast.warning('请先加载文件夹中的图像文件');
            return;
        }

        if (serviceStatus !== 'online') {
            toast.warning('TCP服务未连接，请检查服务状态');
            return;
        }

        const confirmMsg = `将处理 ${folderFiles.length} 个图像文件，是否继续？`;
        const ok = await confirm({
            title: '批量处理确认',
            message: confirmMsg,
            confirmText: '继续处理',
            cancelText: '取消'
        });
        if (!ok) {
            return;
        }

        setIsBatchProcessing(true);
        setBatchProgress({ current: 0, total: folderFiles.length });

        try {
            const response = await api.post('/IImageProcessor/processFolderImages', {
                data: {
                    folder_path: folderPath.trim(),
                    camera_id: cameraId
                }
            });

            if (response && response.code === 200 && response.data) {
                const { success_count, error_count, total_files, results } = response.data;

                // 显示详细的处理结果
                const successFiles = results.filter(r => r.success).map(r => r.filename);
                const errorFiles = results.filter(r => !r.success).map(r => `${r.filename}: ${r.error}`);

                let resultMsg = `批量处理完成！\n\n📊 统计信息:\n✅ 成功: ${success_count} 个\n❌ 失败: ${error_count} 个\n📁 总计: ${total_files} 个`;

                if (errorFiles.length > 0 && errorFiles.length <= 5) {
                    resultMsg += `\n\n❌ 失败文件:\n${errorFiles.join('\n')}`;
                } else if (errorFiles.length > 5) {
                    resultMsg += `\n\n❌ 失败文件 (前5个):\n${errorFiles.slice(0, 5).join('\n')}\n... 还有 ${errorFiles.length - 5} 个`;
                }

                toast.success(`批量处理完成！✅ 成功: ${success_count} 个 ❌ 失败: ${error_count} 个 📁 总计: ${total_files} 个`);

                // 刷新历史记录和统计
                await loadProcessingHistory();
                await loadStatistics();
            } else {
                toast.error('批量处理失败: ' + (response?.msg || '未知错误'));
            }
        } catch (error) {
            console.error('批量处理失败:', error);
            toast.error('批量处理失败: ' + error.message);
        } finally {
            setIsBatchProcessing(false);
            setBatchProgress({ current: 0, total: 0 });
        }
    };

    const downloadSingleResult = async (recordId, filename) => {
        try {
            const response = await fetch(`/api/IImageProcessor/downloadProcessingResult/${recordId}`);

            if (!response.ok) {
                throw new Error('下载失败');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename || `result_${recordId}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (error) {
            console.error('下载失败:', error);
            toast.error('下载失败: ' + error.message);
        }
    };

    const downloadBatchResults = async () => {
        if (selectedRecords.length === 0) {
            toast.warning('请先选择要下载的记录');
            return;
        }

        try {
            const response = await api.post('/IImageProcessor/downloadBatchResults', {
                data: { record_ids: selectedRecords }
            });

            if (response) {
                // 这里需要处理文件下载
                const blob = new Blob([JSON.stringify(response, null, 2)], { type: 'application/json' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `batch_results_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }

        } catch (error) {
            console.error('批量下载失败:', error);
            toast.error('批量下载失败: ' + error.message);
        }
    };

    const viewResultDetails = (record) => {
        setCurrentResult(record);
        setShowResultModal(true);
    };

    const toggleRecordSelection = (recordId) => {
        setSelectedRecords(prev =>
            prev.includes(recordId)
                ? prev.filter(id => id !== recordId)
                : [...prev, recordId]
        );
    };

    const selectAllRecords = () => {
        if (selectedRecords.length === processingHistory.length) {
            setSelectedRecords([]);
        } else {
            setSelectedRecords(processingHistory.map(record => record.id));
        }
    };

    // 筛选处理历史
    const filteredHistory = processingHistory.filter(record => {
        // 搜索筛选
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            const matchesFilename = record.original_filename?.toLowerCase().includes(searchLower);
            const matchesId = record.id?.toLowerCase().includes(searchLower);
            const matchesImageId = record.image_id?.toString().includes(searchLower);

            if (!matchesFilename && !matchesId && !matchesImageId) {
                return false;
            }
        }

        // 类型筛选
        switch (filterType) {
            case 'success':
                return record.is_batch ?
                    (record.batch_info?.error_count === 0) :
                    record.result?.success;
            case 'error':
                return record.is_batch ?
                    (record.batch_info?.success_count === 0) :
                    !record.result?.success;
            case 'batch':
                return record.is_batch;
            case 'single':
                return !record.is_batch;
            default:
                return true;
        }
    });

    return (
        <div className="main" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
            {/* 页面头部 */}
            <div style={{
                marginBottom: '40px',
                padding: '32px',
                background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                borderRadius: '16px',
                color: 'white',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <button
                    className="btn sm"
                    onClick={() => setPageUrl('services')}
                    style={{
                        marginBottom: '20px',
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        color: 'white',
                        border: '1px solid rgba(255,255,255,0.3)',
                        backdropFilter: 'blur(10px)',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '500'
                    }}
                >
                    ← 返回服务列表
                </button>

                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{
                        fontSize: '48px',
                        marginRight: '20px',
                        background: 'rgba(255,255,255,0.2)',
                        borderRadius: '12px',
                        padding: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        🖼️
                    </div>
                    <div>
                        <h1 style={{
                            margin: '0 0 8px 0',
                            fontSize: '32px',
                            fontWeight: '700',
                            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                        }}>
                            TCP图像处理服务
                        </h1>
                        <p style={{
                            margin: '0',
                            fontSize: '16px',
                            opacity: '0.9',
                            fontWeight: '400'
                        }}>
                            基于C++的高性能图像处理服务
                        </p>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                {/* 主要内容区域 */}
                <div>
                    {/* 服务状态面板 */}
                    <div
                        className="card"
                        style={{
                            marginBottom: '24px',
                            padding: '24px',
                            border: '1px solid #e0e0e0',
                            borderRadius: '12px',
                            backgroundColor: '#ffffff',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                            <span style={{ fontSize: '24px', marginRight: '12px' }}>🔗</span>
                            <h3 style={{ margin: '0', fontSize: '20px', fontWeight: '600', color: '#2c3e50' }}>
                                服务连接状态
                            </h3>
                        </div>

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '16px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '8px 16px',
                                    borderRadius: '20px',
                                    backgroundColor: serviceStatus === 'online' ? '#d4edda' :
                                        serviceStatus === 'offline' ? '#f8d7da' :
                                            serviceStatus === 'error' ? '#fff3cd' : '#e2e3e5'
                                }}>
                                    <span
                                        style={{
                                            width: '12px',
                                            height: '12px',
                                            borderRadius: '50%',
                                            backgroundColor: getStatusColor(serviceStatus),
                                            boxShadow: `0 0 0 3px ${getStatusColor(serviceStatus)}33`
                                        }}
                                    ></span>
                                    <span style={{
                                        fontWeight: '600',
                                        fontSize: '14px',
                                        color: serviceStatus === 'online' ? '#155724' :
                                            serviceStatus === 'offline' ? '#721c24' :
                                                serviceStatus === 'error' ? '#856404' : '#6c757d'
                                    }}>
                                        {getStatusText(serviceStatus)}
                                    </span>
                                </div>

                                {serviceInfo.host && serviceInfo.port && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '12px', color: '#6c757d', fontWeight: '500' }}>
                                            服务地址:
                                        </span>
                                        <code style={{
                                            fontSize: '13px',
                                            color: '#495057',
                                            backgroundColor: '#f8f9fa',
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            fontFamily: 'Monaco, Consolas, monospace'
                                        }}>
                                            {serviceInfo.host}:{serviceInfo.port}
                                        </code>
                                    </div>
                                )}
                            </div>

                            <button
                                className="btn sm"
                                onClick={checkServiceStatus}
                                style={{
                                    backgroundColor: '#6c757d',
                                    color: 'white',
                                    border: 'none',
                                    padding: '8px 16px',
                                    borderRadius: '6px',
                                    fontSize: '13px',
                                    fontWeight: '500',
                                    cursor: 'pointer'
                                }}
                            >
                                🔄 刷新状态
                            </button>
                        </div>

                        {serviceInfo.error_message && (
                            <div style={{
                                padding: '12px 16px',
                                backgroundColor: '#f8d7da',
                                border: '1px solid #f5c6cb',
                                borderRadius: '8px',
                                fontSize: '14px',
                                color: '#721c24'
                            }}>
                                <strong>⚠️ 连接错误:</strong> {serviceInfo.error_message}
                            </div>
                        )}
                    </div>

                    {/* 图像上传处理 */}
                    <div
                        className="card"
                        style={{
                            marginBottom: '24px',
                            padding: '24px',
                            border: '1px solid #e0e0e0',
                            borderRadius: '12px',
                            backgroundColor: '#ffffff',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                            <span style={{ fontSize: '24px', marginRight: '12px' }}>📤</span>
                            <h3 style={{ margin: '0', fontSize: '20px', fontWeight: '600', color: '#2c3e50' }}>
                                图像处理
                            </h3>
                        </div>

                        <div style={{ marginTop: '20px' }}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '8px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: '#495057'
                                }}>
                                    📁 选择图像文件:
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        id="imageInput"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileSelect}
                                        style={{
                                            width: '100%',
                                            padding: '12px 16px',
                                            border: '2px dashed #dee2e6',
                                            borderRadius: '8px',
                                            backgroundColor: '#f8f9fa',
                                            fontSize: '14px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.target.style.borderColor = '#007bff';
                                            e.target.style.backgroundColor = '#e3f2fd';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.borderColor = '#dee2e6';
                                            e.target.style.backgroundColor = '#f8f9fa';
                                        }}
                                    />
                                    {selectedFile && (
                                        <div style={{
                                            marginTop: '8px',
                                            padding: '8px 12px',
                                            backgroundColor: '#d4edda',
                                            border: '1px solid #c3e6cb',
                                            borderRadius: '6px',
                                            fontSize: '13px',
                                            color: '#155724'
                                        }}>
                                            ✅ 已选择: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '20px',
                                marginBottom: '20px'
                            }}>
                                <div>
                                    <label style={{
                                        display: 'block',
                                        marginBottom: '8px',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        color: '#495057'
                                    }}>
                                        📹 摄像头ID:
                                    </label>
                                    <input
                                        type="number"
                                        value={cameraId}
                                        onChange={(e) => {
                                            const value = parseInt(e.target.value, 10);
                                            setCameraId(Number.isNaN(value) ? 203 : value);
                                        }}
                                        style={{
                                            width: '100%',
                                            padding: '12px 16px',
                                            border: '1px solid #ced4da',
                                            borderRadius: '8px',
                                            fontSize: '14px',
                                            backgroundColor: '#ffffff'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{
                                        display: 'block',
                                        marginBottom: '8px',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        color: '#495057'
                                    }}>
                                        🏷️ 图像ID (可选):
                                    </label>
                                    <input
                                        type="number"
                                        value={imageId}
                                        onChange={(e) => setImageId(e.target.value)}
                                        placeholder="留空自动生成"
                                        style={{
                                            width: '100%',
                                            padding: '12px 16px',
                                            border: '1px solid #ced4da',
                                            borderRadius: '8px',
                                            fontSize: '14px',
                                            backgroundColor: '#ffffff'
                                        }}
                                    />
                                </div>
                            </div>

                            <button
                                className="btn"
                                onClick={handleImageProcess}
                                disabled={isProcessing || !selectedFile || serviceStatus !== 'online'}
                                style={{
                                    width: '100%',
                                    padding: '14px 20px',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    borderRadius: '8px',
                                    border: 'none',
                                    cursor: isProcessing || !selectedFile || serviceStatus !== 'online' ? 'not-allowed' : 'pointer',
                                    backgroundColor: isProcessing ? '#6c757d' :
                                        !selectedFile ? '#e9ecef' :
                                            serviceStatus !== 'online' ? '#ffc107' : '#28a745',
                                    color: 'white',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                {isProcessing ? '🔄 处理中...' :
                                    !selectedFile ? '📁 请先选择图像文件' :
                                        serviceStatus !== 'online' ? '⚠️ 服务未连接' : '🚀 开始处理'}
                            </button>
                        </div>
                    </div>

                    {/* 文件夹批量处理 */}
                    <div
                        className="card"
                        style={{
                            marginBottom: '24px',
                            padding: '24px',
                            border: '1px solid #e0e0e0',
                            borderRadius: '12px',
                            backgroundColor: '#ffffff',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <span style={{ fontSize: '24px', marginRight: '12px' }}>📁</span>
                                <h3 style={{ margin: '0', fontSize: '20px', fontWeight: '600', color: '#2c3e50' }}>
                                    文件夹批量处理
                                </h3>
                            </div>
                            <button
                                className="btn sm"
                                onClick={() => setShowFolderProcessor(!showFolderProcessor)}
                                style={{
                                    backgroundColor: '#6c757d',
                                    color: 'white',
                                    border: 'none',
                                    padding: '8px 16px',
                                    borderRadius: '6px',
                                    fontSize: '13px',
                                    fontWeight: '500',
                                    cursor: 'pointer'
                                }}
                            >
                                {showFolderProcessor ? '隐藏' : '显示'}
                            </button>
                        </div>

                        {showFolderProcessor && (
                            <div>
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{
                                        display: 'block',
                                        marginBottom: '8px',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        color: '#495057'
                                    }}>
                                        📂 文件夹路径:
                                    </label>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <input
                                            type="text"
                                            value={folderPath}
                                            onChange={(e) => setFolderPath(e.target.value)}
                                            placeholder="如: C:\\Users\\用户名\\Pictures\\images"
                                            style={{
                                                flex: 1,
                                                padding: '12px 16px',
                                                border: '1px solid #ced4da',
                                                borderRadius: '8px',
                                                fontSize: '14px',
                                                backgroundColor: '#ffffff'
                                            }}
                                        />
                                        <button
                                            className="btn sm"
                                            onClick={loadFolderFiles}
                                            style={{
                                                backgroundColor: '#007bff',
                                                color: 'white',
                                                border: 'none',
                                                padding: '12px 20px',
                                                borderRadius: '8px',
                                                fontSize: '14px',
                                                fontWeight: '500',
                                                cursor: 'pointer',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            🔍 扫描文件
                                        </button>
                                    </div>
                                </div>

                                {folderFiles.length > 0 && (
                                    <div style={{ marginBottom: '20px' }}>
                                        <div style={{
                                            padding: '16px',
                                            backgroundColor: '#e3f2fd',
                                            border: '1px solid #bbdefb',
                                            borderRadius: '8px',
                                            marginBottom: '16px'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <strong style={{ color: '#1976d2' }}>📊 扫描结果:</strong>
                                                    <span style={{ marginLeft: '12px', color: '#1976d2' }}>
                                                        找到 {folderFiles.length} 个图像文件
                                                    </span>
                                                </div>
                                                <div style={{ color: '#1976d2', fontSize: '13px' }}>
                                                    总大小: {(folderFiles.reduce((sum, file) => sum + file.size, 0) / (1024 * 1024)).toFixed(2)} MB
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{
                                            maxHeight: '200px',
                                            overflowY: 'auto',
                                            border: '1px solid #e9ecef',
                                            borderRadius: '8px',
                                            backgroundColor: '#f8f9fa'
                                        }}>
                                            {folderFiles.map((file, index) => (
                                                <div
                                                    key={index}
                                                    style={{
                                                        padding: '8px 12px',
                                                        borderBottom: index < folderFiles.length - 1 ? '1px solid #e9ecef' : 'none',
                                                        fontSize: '13px'
                                                    }}
                                                >
                                                    <div style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center'
                                                    }}>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ color: '#495057', marginBottom: '2px' }}>
                                                                📄 {file.filename}
                                                            </div>
                                                            {file.directory !== '根目录' && (
                                                                <div style={{
                                                                    color: '#6c757d',
                                                                    fontSize: '11px',
                                                                    marginLeft: '16px'
                                                                }}>
                                                                    📁 {file.directory}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <span style={{ color: '#6c757d', fontSize: '12px' }}>
                                                            {file.size_mb} MB
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <button
                                    className="btn"
                                    onClick={processFolderImages}
                                    disabled={isBatchProcessing || folderFiles.length === 0 || serviceStatus !== 'online'}
                                    style={{
                                        width: '100%',
                                        padding: '14px 20px',
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        borderRadius: '8px',
                                        border: 'none',
                                        cursor: isBatchProcessing || folderFiles.length === 0 || serviceStatus !== 'online' ? 'not-allowed' : 'pointer',
                                        backgroundColor: isBatchProcessing ? '#6c757d' :
                                            folderFiles.length === 0 ? '#e9ecef' :
                                                serviceStatus !== 'online' ? '#ffc107' : '#28a745',
                                        color: 'white',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    {isBatchProcessing ? '🔄 批量处理中...' :
                                        folderFiles.length === 0 ? '📁 请先扫描文件夹' :
                                            serviceStatus !== 'online' ? '⚠️ 服务未连接' : `🚀 批量处理 ${folderFiles.length} 个文件`}
                                </button>

                                <div style={{
                                    marginTop: '16px',
                                    padding: '12px 16px',
                                    backgroundColor: '#fff3cd',
                                    border: '1px solid #ffeaa7',
                                    borderRadius: '8px',
                                    fontSize: '13px',
                                    color: '#856404'
                                }}>
                                    <strong>💡 提示:</strong> 支持递归扫描多层目录，自动识别 JPG, PNG, BMP, TIFF, WEBP 格式。批量处理会按顺序处理所有图像文件，包括子文件夹中的图片。
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 处理历史 */}
                    <div
                        className="card"
                        style={{
                            padding: '24px',
                            border: '1px solid #e0e0e0',
                            borderRadius: '12px',
                            backgroundColor: '#ffffff',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <span style={{ fontSize: '24px', marginRight: '12px' }}>📋</span>
                                <h3 style={{ margin: '0', fontSize: '20px', fontWeight: '600', color: '#2c3e50' }}>
                                    处理历史
                                </h3>
                                {processingHistory.length > 0 && (
                                    <span style={{
                                        marginLeft: '12px',
                                        padding: '2px 8px',
                                        backgroundColor: '#e9ecef',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        color: '#6c757d'
                                    }}>
                                        {selectedRecords.length}/{processingHistory.length} 已选择
                                    </span>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {processingHistory.length > 0 && (
                                    <>
                                        <button
                                            className="btn sm"
                                            onClick={selectAllRecords}
                                            style={{
                                                backgroundColor: '#6c757d',
                                                color: 'white',
                                                border: 'none',
                                                padding: '8px 12px',
                                                borderRadius: '6px',
                                                fontSize: '12px',
                                                fontWeight: '500',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {selectedRecords.length === processingHistory.length ? '取消全选' : '全选'}
                                        </button>
                                        <button
                                            className="btn sm"
                                            onClick={downloadBatchResults}
                                            disabled={selectedRecords.length === 0}
                                            style={{
                                                backgroundColor: selectedRecords.length === 0 ? '#e9ecef' : '#28a745',
                                                color: selectedRecords.length === 0 ? '#6c757d' : 'white',
                                                border: 'none',
                                                padding: '8px 12px',
                                                borderRadius: '6px',
                                                fontSize: '12px',
                                                fontWeight: '500',
                                                cursor: selectedRecords.length === 0 ? 'not-allowed' : 'pointer'
                                            }}
                                        >
                                            📥 批量下载
                                        </button>
                                    </>
                                )}
                                <button
                                    className="btn sm"
                                    onClick={loadProcessingHistory}
                                    style={{
                                        backgroundColor: '#007bff',
                                        color: 'white',
                                        border: 'none',
                                        padding: '8px 16px',
                                        borderRadius: '6px',
                                        fontSize: '13px',
                                        fontWeight: '500',
                                        cursor: 'pointer'
                                    }}
                                >
                                    🔄 刷新
                                </button>
                            </div>
                        </div>

                        {/* 搜索和筛选 */}
                        {processingHistory.length > 0 && (
                            <div style={{
                                marginBottom: '20px',
                                padding: '16px',
                                backgroundColor: '#f8f9fa',
                                borderRadius: '8px',
                                border: '1px solid #e9ecef'
                            }}>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '2fr 1fr',
                                    gap: '12px',
                                    alignItems: 'center'
                                }}>
                                    <div>
                                        <input
                                            type="text"
                                            placeholder="🔍 搜索文件名、记录ID或图像ID..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '8px 12px',
                                                border: '1px solid #ced4da',
                                                borderRadius: '6px',
                                                fontSize: '14px'
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <select
                                            value={filterType}
                                            onChange={(e) => setFilterType(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '8px 12px',
                                                border: '1px solid #ced4da',
                                                borderRadius: '6px',
                                                fontSize: '14px',
                                                backgroundColor: 'white'
                                            }}
                                        >
                                            <option value="all">📋 全部记录</option>
                                            <option value="success">✅ 仅成功</option>
                                            <option value="error">❌ 仅失败</option>
                                            <option value="batch">📁 批量处理</option>
                                            <option value="single">🖼️ 单个处理</option>
                                        </select>
                                    </div>
                                </div>

                                {(searchTerm || filterType !== 'all') && (
                                    <div style={{
                                        marginTop: '8px',
                                        fontSize: '12px',
                                        color: '#6c757d'
                                    }}>
                                        显示 {filteredHistory.length} / {processingHistory.length} 条记录
                                        {(searchTerm || filterType !== 'all') && (
                                            <button
                                                onClick={() => {
                                                    setSearchTerm('');
                                                    setFilterType('all');
                                                }}
                                                style={{
                                                    marginLeft: '8px',
                                                    padding: '2px 6px',
                                                    fontSize: '11px',
                                                    backgroundColor: '#6c757d',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                清除筛选
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {filteredHistory.length === 0 ? (
                            <div style={{
                                textAlign: 'center',
                                padding: '40px 20px',
                                color: '#6c757d'
                            }}>
                                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
                                <p style={{ margin: '0', fontSize: '16px' }}>暂无处理记录</p>
                                <p style={{ margin: '8px 0 0 0', fontSize: '14px', opacity: '0.7' }}>
                                    上传图像进行处理后，历史记录将显示在这里
                                </p>
                            </div>
                        ) : (
                            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                                {filteredHistory.map((record, index) => (
                                    <div
                                        key={record.id}
                                        style={{
                                            padding: '20px',
                                            borderBottom: index < filteredHistory.length - 1 ? '1px solid #e9ecef' : 'none',
                                            borderRadius: '8px',
                                            marginBottom: index < filteredHistory.length - 1 ? '8px' : '0',
                                            backgroundColor: record.is_batch ? '#f0f8ff' : (index % 2 === 0 ? '#ffffff' : '#f8f9fa'),
                                            border: record.is_batch ? '2px solid #4CAF50' : 'none',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = record.is_batch ? '#e8f5e8' : '#e3f2fd';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = record.is_batch ? '#f0f8ff' : (index % 2 === 0 ? '#ffffff' : '#f8f9fa');
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1 }}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedRecords.includes(record.id)}
                                                    onChange={() => toggleRecordSelection(record.id)}
                                                    style={{
                                                        marginTop: '4px',
                                                        transform: 'scale(1.2)',
                                                        cursor: 'pointer'
                                                    }}
                                                />
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                                                        <span style={{ fontSize: '20px', marginRight: '8px' }}>
                                                            {record.is_batch ? '📁' : '🖼️'}
                                                        </span>
                                                        <h4 style={{
                                                            margin: '0',
                                                            fontSize: '16px',
                                                            fontWeight: '600',
                                                            color: record.is_batch ? '#4CAF50' : '#2c3e50'
                                                        }}>
                                                            {record.original_filename}
                                                        </h4>
                                                        {record.is_batch && (
                                                            <span style={{
                                                                marginLeft: '8px',
                                                                padding: '2px 8px',
                                                                backgroundColor: '#4CAF50',
                                                                color: 'white',
                                                                borderRadius: '12px',
                                                                fontSize: '11px',
                                                                fontWeight: '600'
                                                            }}>
                                                                批量处理
                                                            </span>
                                                        )}
                                                    </div>

                                                    {record.is_batch ? (
                                                        <div style={{
                                                            display: 'grid',
                                                            gridTemplateColumns: '1fr 1fr 1fr',
                                                            gap: '12px',
                                                            marginBottom: '8px'
                                                        }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                <span style={{ fontSize: '12px' }}>📊</span>
                                                                <span style={{ fontSize: '13px', color: '#6c757d' }}>
                                                                    总文件: <strong>{record.batch_info?.total_files || 0}</strong>
                                                                </span>
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                <span style={{ fontSize: '12px' }}>✅</span>
                                                                <span style={{ fontSize: '13px', color: '#28a745' }}>
                                                                    成功: <strong>{record.batch_info?.success_count || 0}</strong>
                                                                </span>
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                <span style={{ fontSize: '12px' }}>❌</span>
                                                                <span style={{ fontSize: '13px', color: '#dc3545' }}>
                                                                    失败: <strong>{record.batch_info?.error_count || 0}</strong>
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div style={{
                                                            display: 'grid',
                                                            gridTemplateColumns: '1fr 1fr',
                                                            gap: '12px',
                                                            marginBottom: '8px'
                                                        }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                <span style={{ fontSize: '12px' }}>🏷️</span>
                                                                <span style={{ fontSize: '13px', color: '#6c757d' }}>
                                                                    图像ID: <strong>{record.image_id}</strong>
                                                                </span>
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                <span style={{ fontSize: '12px' }}>📹</span>
                                                                <span style={{ fontSize: '13px', color: '#6c757d' }}>
                                                                    摄像头: <strong>{record.camera_id}</strong>
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '16px',
                                                        marginBottom: '8px'
                                                    }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <span style={{ fontSize: '12px' }}>⏱️</span>
                                                            <span style={{ fontSize: '13px', color: '#6c757d' }}>
                                                                {formatProcessingTime(record.processing_time)}
                                                            </span>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <span style={{ fontSize: '12px' }}>🕒</span>
                                                            <span style={{ fontSize: '12px', color: '#6c757d' }}>
                                                                {formatTimestamp(record.timestamp)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                                                <div style={{
                                                    padding: '6px 12px',
                                                    borderRadius: '20px',
                                                    fontSize: '12px',
                                                    fontWeight: '600',
                                                    backgroundColor: record.is_batch ?
                                                        (record.batch_info?.error_count === 0 ? '#d4edda' :
                                                            record.batch_info?.success_count === 0 ? '#f8d7da' : '#fff3cd') :
                                                        (record.result.success ? '#d4edda' : '#f8d7da'),
                                                    color: record.is_batch ?
                                                        (record.batch_info?.error_count === 0 ? '#155724' :
                                                            record.batch_info?.success_count === 0 ? '#721c24' : '#856404') :
                                                        (record.result.success ? '#155724' : '#721c24'),
                                                    border: record.is_batch ?
                                                        (record.batch_info?.error_count === 0 ? '1px solid #c3e6cb' :
                                                            record.batch_info?.success_count === 0 ? '1px solid #f5c6cb' : '1px solid #ffeaa7') :
                                                        `1px solid ${record.result.success ? '#c3e6cb' : '#f5c6cb'}`
                                                }}>
                                                    {record.is_batch ?
                                                        (record.batch_info?.error_count === 0 ? '✅ 全部成功' :
                                                            record.batch_info?.success_count === 0 ? '❌ 全部失败' : '⚠️ 部分成功') :
                                                        (record.result.success ? '✅ 成功' : '❌ 失败')}
                                                </div>

                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                    <button
                                                        onClick={() => viewResultDetails(record)}
                                                        style={{
                                                            padding: '4px 8px',
                                                            fontSize: '11px',
                                                            backgroundColor: '#007bff',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            fontWeight: '500'
                                                        }}
                                                        title="查看详细结果"
                                                    >
                                                        👁️ 查看
                                                    </button>
                                                    <button
                                                        onClick={() => downloadSingleResult(record.id, `${record.original_filename}_result.json`)}
                                                        style={{
                                                            padding: '4px 8px',
                                                            fontSize: '11px',
                                                            backgroundColor: '#28a745',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            fontWeight: '500'
                                                        }}
                                                        title="下载处理结果"
                                                    >
                                                        📥 下载
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {record.is_batch && record.batch_info?.results ? (
                                            <div style={{
                                                marginTop: '12px',
                                                padding: '12px 16px',
                                                backgroundColor: '#f8f9fa',
                                                border: '1px solid #e9ecef',
                                                borderRadius: '8px',
                                                fontSize: '12px'
                                            }}>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    marginBottom: '8px'
                                                }}>
                                                    <span style={{ fontSize: '14px', marginRight: '6px' }}>📋</span>
                                                    <strong style={{ color: '#495057' }}>批量处理详情:</strong>
                                                </div>
                                                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                                    {record.batch_info.results.map((result, idx) => (
                                                        <div key={idx} style={{
                                                            padding: '4px 8px',
                                                            marginBottom: '2px',
                                                            backgroundColor: result.success ? '#d4edda' : '#f8d7da',
                                                            borderRadius: '4px',
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center'
                                                        }}>
                                                            <span style={{
                                                                fontSize: '11px',
                                                                color: result.success ? '#155724' : '#721c24'
                                                            }}>
                                                                {result.success ? '✅' : '❌'} {result.relative_path || result.filename}
                                                            </span>
                                                            {result.processing_time && (
                                                                <span style={{
                                                                    fontSize: '10px',
                                                                    color: '#6c757d'
                                                                }}>
                                                                    {formatProcessingTime(result.processing_time)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (record.result.result && !record.is_batch && (
                                            <div style={{
                                                marginTop: '12px',
                                                padding: '12px 16px',
                                                backgroundColor: '#f8f9fa',
                                                border: '1px solid #e9ecef',
                                                borderRadius: '8px',
                                                fontSize: '12px'
                                            }}>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    marginBottom: '8px'
                                                }}>
                                                    <span style={{ fontSize: '14px', marginRight: '6px' }}>📊</span>
                                                    <strong style={{ color: '#495057' }}>处理结果:</strong>
                                                </div>
                                                <pre style={{
                                                    margin: '0',
                                                    whiteSpace: 'pre-wrap',
                                                    fontFamily: 'Monaco, Consolas, monospace',
                                                    fontSize: '11px',
                                                    color: '#495057',
                                                    lineHeight: '1.4'
                                                }}>
                                                    {JSON.stringify(record.result.result, null, 2)}
                                                </pre>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* 侧边栏 */}
                <div>
                    {/* 统计信息 */}
                    <div
                        className="card"
                        style={{
                            marginBottom: '24px',
                            padding: '24px',
                            border: '1px solid #e0e0e0',
                            borderRadius: '12px',
                            backgroundColor: '#ffffff',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                            <span style={{ fontSize: '24px', marginRight: '12px' }}>📊</span>
                            <h3 style={{ margin: '0', fontSize: '20px', fontWeight: '600', color: '#2c3e50' }}>
                                处理统计
                            </h3>
                        </div>

                        <div style={{ marginTop: '20px' }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '16px',
                                padding: '12px 16px',
                                backgroundColor: '#f8f9fa',
                                borderRadius: '8px',
                                border: '1px solid #e9ecef'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '16px' }}>📈</span>
                                    <span style={{ fontSize: '14px', color: '#6c757d' }}>总处理次数</span>
                                </div>
                                <strong style={{ fontSize: '18px', color: '#2c3e50' }}>
                                    {statistics.total_count || 0}
                                </strong>
                            </div>

                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '16px',
                                padding: '12px 16px',
                                backgroundColor: '#d4edda',
                                borderRadius: '8px',
                                border: '1px solid #c3e6cb'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '16px' }}>✅</span>
                                    <span style={{ fontSize: '14px', color: '#155724' }}>成功次数</span>
                                </div>
                                <strong style={{ fontSize: '18px', color: '#155724' }}>
                                    {statistics.success_count || 0}
                                </strong>
                            </div>

                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '16px',
                                padding: '12px 16px',
                                backgroundColor: '#f8d7da',
                                borderRadius: '8px',
                                border: '1px solid #f5c6cb'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '16px' }}>❌</span>
                                    <span style={{ fontSize: '14px', color: '#721c24' }}>失败次数</span>
                                </div>
                                <strong style={{ fontSize: '18px', color: '#721c24' }}>
                                    {statistics.failure_count || 0}
                                </strong>
                            </div>

                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '16px',
                                padding: '12px 16px',
                                backgroundColor: '#e3f2fd',
                                borderRadius: '8px',
                                border: '1px solid #bbdefb'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '16px' }}>🎯</span>
                                    <span style={{ fontSize: '14px', color: '#1976d2' }}>成功率</span>
                                </div>
                                <strong style={{ fontSize: '18px', color: '#1976d2' }}>
                                    {statistics.success_rate ? `${statistics.success_rate.toFixed(1)}%` : '0%'}
                                </strong>
                            </div>

                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '12px 16px',
                                backgroundColor: '#fff3cd',
                                borderRadius: '8px',
                                border: '1px solid #ffeaa7'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '16px' }}>⏱️</span>
                                    <span style={{ fontSize: '14px', color: '#856404' }}>平均处理时间</span>
                                </div>
                                <strong style={{ fontSize: '18px', color: '#856404' }}>
                                    {statistics.avg_processing_time ? formatProcessingTime(statistics.avg_processing_time) : '0ms'}
                                </strong>
                            </div>

                            {/* 详细统计信息 */}
                            {statistics.batch_count !== undefined && (
                                <div style={{ marginTop: '20px' }}>
                                    <h4 style={{
                                        margin: '0 0 12px 0',
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        color: '#495057'
                                    }}>
                                        📊 详细统计
                                    </h4>

                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: '12px',
                                        marginBottom: '16px'
                                    }}>
                                        <div style={{
                                            padding: '12px',
                                            backgroundColor: '#f8f9fa',
                                            borderRadius: '8px',
                                            border: '1px solid #e9ecef'
                                        }}>
                                            <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>
                                                单个处理
                                            </div>
                                            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#495057' }}>
                                                {statistics.single_count || 0}
                                            </div>
                                        </div>

                                        <div style={{
                                            padding: '12px',
                                            backgroundColor: '#f8f9fa',
                                            borderRadius: '8px',
                                            border: '1px solid #e9ecef'
                                        }}>
                                            <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>
                                                批量处理
                                            </div>
                                            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#495057' }}>
                                                {statistics.batch_count || 0}
                                            </div>
                                        </div>
                                    </div>

                                    {statistics.processing_time_stats && (
                                        <div style={{
                                            padding: '12px',
                                            backgroundColor: '#e8f5e9',
                                            borderRadius: '8px',
                                            border: '1px solid #c8e6c9',
                                            marginBottom: '16px'
                                        }}>
                                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#2e7d32', marginBottom: '8px' }}>
                                                ⏱️ 处理时间分析
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#2e7d32' }}>
                                                <span>最快: {formatProcessingTime(statistics.processing_time_stats.min || 0)}</span>
                                                <span>最慢: {formatProcessingTime(statistics.processing_time_stats.max || 0)}</span>
                                                <span>中位数: {formatProcessingTime(statistics.processing_time_stats.median || 0)}</span>
                                            </div>
                                        </div>
                                    )}

                                    {statistics.format_stats && Object.keys(statistics.format_stats).length > 0 && (
                                        <div style={{
                                            padding: '12px',
                                            backgroundColor: '#e3f2fd',
                                            borderRadius: '8px',
                                            border: '1px solid #bbdefb',
                                            marginBottom: '16px'
                                        }}>
                                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#1976d2', marginBottom: '8px' }}>
                                                📁 文件格式分布
                                            </div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                {Object.entries(statistics.format_stats).map(([format, count]) => (
                                                    <span key={format} style={{
                                                        padding: '2px 8px',
                                                        backgroundColor: '#1976d2',
                                                        color: 'white',
                                                        borderRadius: '12px',
                                                        fontSize: '11px',
                                                        fontWeight: '500'
                                                    }}>
                                                        {format.toUpperCase()}: {count}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {statistics.daily_stats && statistics.daily_stats.length > 0 && (
                                        <div style={{
                                            padding: '12px',
                                            backgroundColor: '#fff3e0',
                                            borderRadius: '8px',
                                            border: '1px solid #ffcc02'
                                        }}>
                                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#f57c00', marginBottom: '8px' }}>
                                                📈 最近7天趋势
                                            </div>
                                            <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
                                                {statistics.daily_stats.map((day, index) => (
                                                    <div key={index} style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        padding: '4px 0',
                                                        borderBottom: index < statistics.daily_stats.length - 1 ? '1px solid #ffcc02' : 'none'
                                                    }}>
                                                        <span style={{ fontSize: '12px', color: '#e65100' }}>
                                                            {day.date}
                                                        </span>
                                                        <div style={{ display: 'flex', gap: '8px', fontSize: '11px' }}>
                                                            <span style={{ color: '#2e7d32' }}>✅ {day.success}</span>
                                                            <span style={{ color: '#d32f2f' }}>❌ {day.error}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 服务信息 */}
                    <div
                        className="card"
                        style={{
                            padding: '24px',
                            border: '1px solid #e0e0e0',
                            borderRadius: '12px',
                            backgroundColor: '#ffffff',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                            <span style={{ fontSize: '24px', marginRight: '12px' }}>ℹ️</span>
                            <h3 style={{ margin: '0', fontSize: '20px', fontWeight: '600', color: '#2c3e50' }}>
                                服务信息
                            </h3>
                        </div>

                        <div style={{ marginTop: '20px' }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                marginBottom: '16px',
                                padding: '12px',
                                backgroundColor: '#f8f9fa',
                                borderRadius: '8px'
                            }}>
                                <span style={{ fontSize: '16px', marginRight: '12px' }}>🔌</span>
                                <div>
                                    <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '2px' }}>服务类型</div>
                                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#495057' }}>TCP 协议</div>
                                </div>
                            </div>

                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                marginBottom: '16px',
                                padding: '12px',
                                backgroundColor: '#f8f9fa',
                                borderRadius: '8px'
                            }}>
                                <span style={{ fontSize: '16px', marginRight: '12px' }}>🏷️</span>
                                <div>
                                    <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '2px' }}>协议版本</div>
                                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#495057' }}>v1.0</div>
                                </div>
                            </div>

                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                marginBottom: '16px',
                                padding: '12px',
                                backgroundColor: '#f8f9fa',
                                borderRadius: '8px'
                            }}>
                                <span style={{ fontSize: '16px', marginRight: '12px' }}>🖼️</span>
                                <div>
                                    <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '2px' }}>支持格式</div>
                                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#495057' }}>
                                        JPG, PNG, BMP, TIFF, WEBP
                                    </div>
                                </div>
                            </div>

                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                marginBottom: serviceInfo.last_check ? '16px' : '0',
                                padding: '12px',
                                backgroundColor: '#f8f9fa',
                                borderRadius: '8px'
                            }}>
                                <span style={{ fontSize: '16px', marginRight: '12px' }}>📏</span>
                                <div>
                                    <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '2px' }}>最大文件大小</div>
                                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#495057' }}>10 MB</div>
                                </div>
                            </div>

                            {serviceInfo.last_check && (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '12px',
                                    backgroundColor: '#e3f2fd',
                                    borderRadius: '8px',
                                    border: '1px solid #bbdefb'
                                }}>
                                    <span style={{ fontSize: '16px', marginRight: '12px' }}>🕒</span>
                                    <div>
                                        <div style={{ fontSize: '12px', color: '#1976d2', marginBottom: '2px' }}>最后检查时间</div>
                                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#1976d2' }}>
                                            {formatTimestamp(serviceInfo.last_check)}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 结果详情模态框 */}
            {showResultModal && currentResult && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        padding: '24px',
                        maxWidth: '80vw',
                        maxHeight: '80vh',
                        overflow: 'auto',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '20px',
                            borderBottom: '1px solid #e9ecef',
                            paddingBottom: '16px'
                        }}>
                            <h3 style={{ margin: 0, color: '#2c3e50' }}>
                                {currentResult.is_batch ? '📁' : '🖼️'} {currentResult.original_filename} - 处理结果详情
                            </h3>
                            <button
                                onClick={() => setShowResultModal(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '24px',
                                    cursor: 'pointer',
                                    color: '#6c757d'
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <h4 style={{ color: '#495057', marginBottom: '8px' }}>基本信息:</h4>
                            <div style={{
                                backgroundColor: '#f8f9fa',
                                padding: '12px',
                                borderRadius: '8px',
                                fontSize: '14px'
                            }}>
                                <div><strong>处理时间:</strong> {formatTimestamp(currentResult.timestamp)}</div>
                                <div><strong>耗时:</strong> {formatProcessingTime(currentResult.processing_time)}</div>
                                <div><strong>摄像头ID:</strong> {currentResult.camera_id}</div>
                                {currentResult.is_batch ? (
                                    <>
                                        <div><strong>文件夹路径:</strong> {currentResult.batch_info?.folder_path}</div>
                                        <div><strong>总文件数:</strong> {currentResult.batch_info?.total_files}</div>
                                        <div><strong>成功数:</strong> {currentResult.batch_info?.success_count}</div>
                                        <div><strong>失败数:</strong> {currentResult.batch_info?.error_count}</div>
                                    </>
                                ) : (
                                    <div><strong>图像ID:</strong> {currentResult.image_id}</div>
                                )}
                            </div>
                        </div>

                        <div>
                            <h4 style={{ color: '#495057', marginBottom: '8px' }}>处理结果:</h4>
                            <pre style={{
                                backgroundColor: '#f8f9fa',
                                padding: '16px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontFamily: 'Monaco, Consolas, monospace',
                                overflow: 'auto',
                                maxHeight: '400px',
                                border: '1px solid #e9ecef'
                            }}>
                                {JSON.stringify(currentResult.is_batch ? currentResult.batch_info : currentResult.result, null, 2)}
                            </pre>
                        </div>

                        <div style={{
                            marginTop: '20px',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '12px'
                        }}>
                            <button
                                onClick={() => downloadSingleResult(currentResult.id, `${currentResult.original_filename}_result.json`)}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: '500'
                                }}
                            >
                                📥 下载结果
                            </button>
                            <button
                                onClick={() => setShowResultModal(false)}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#6c757d',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: '500'
                                }}
                            >
                                关闭
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TcpImageProcessorPage;
