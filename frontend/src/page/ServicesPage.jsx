import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { getStatusColor, getStatusText } from '../tools';
import '../styles/services.css';

function ServicesPage() {
    const navigate = useNavigate();
    const [services, setServices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingService, setEditingService] = useState(null);
    const [editForm, setEditForm] = useState({ host: '', port: '', api_token: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [serviceConfig, setServiceConfig] = useState({});

    // 服务配置
    const serviceConfigs = [
        {
            id: 'tcp-image-processor',
            name: 'TCP图像处理服务',
            description: '基于C++的高性能图像处理服务',
            type: 'tcp',
            icon: '🖼️',
            status: 'unknown',
            path: '/services/tcp-processor',
            apiPath: '/IImageProcessor'
        },
        {
            id: 'triton-inference',
            name: 'Triton推理服务',
            description: 'NVIDIA Triton模型推理服务',
            type: 'http',
            icon: '🚀',
            status: 'unknown',
            path: '/triton',
            apiPath: '/triton'
        },
        {
            id: 'label-studio',
            name: 'Label Studio标注服务',
            description: '数据标注和管理平台',
            type: 'http',
            icon: '🏷️',
            status: 'unknown',
            path: '/import/label-studio',
            apiPath: '/labelstudio'
        }
    ];

    // 加载服务配置
    const loadServiceConfig = async () => {
        try {
            const response = await api.getServiceConfig();
            if (response.code === 200 && response.data) {
                setServiceConfig(response.data);
            }
        } catch (error) {
            console.error('加载服务配置失败:', error);
        }
    };

    useEffect(() => {
        loadServiceConfig();
        checkServicesStatus();
    }, []);

    // 开始编辑服务配置
    const handleEditService = (serviceId) => {
        const configMap = {
            'tcp-image-processor': 'tcp_image_service',
            'triton-inference': 'triton_server',
            'label-studio': 'label_studio'
        };
        const configKey = configMap[serviceId];
        const config = serviceConfig[configKey] || {};

        setEditForm({
            host: config.host || '',
            port: config.port || '',
            api_token: config.api_token || ''
        });
        setEditingService(serviceId);
    };

    // 保存服务配置
    const handleSaveConfig = async () => {
        const configMap = {
            'tcp-image-processor': 'tcp_image_service',
            'triton-inference': 'triton_server',
            'label-studio': 'label_studio'
        };
        const configKey = configMap[editingService];

        setIsSaving(true);
        try {
            const response = await api.updateServiceConfig(
                configKey,
                editForm.host,
                parseInt(editForm.port),
                editForm.api_token
            );

            if (response.code === 200) {
                setServiceConfig(response.data);
                setEditingService(null);
                // 刷新服务状态
                checkServicesStatus();
            } else {
                alert('保存失败: ' + response.msg);
            }
        } catch (error) {
            alert('保存失败: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const checkServicesStatus = async () => {
        setIsLoading(true);

        const statusPromises = serviceConfigs.map(async (service) => {
            try {
                let response;

                if (service.id === 'tcp-image-processor') {
                    // TCP 图像处理服务
                    response = await api.get(`${service.apiPath}/getServiceStatus`);
                    return {
                        ...service,
                        status: response.data.status,
                        host: response.data.host,
                        port: response.data.port,
                        last_check: response.data.last_check,
                        error_message: response.data.error_message
                    };
                } else if (service.id === 'triton-inference') {
                    // Triton 推理服务
                    response = await api.get('/IModel/getTritonServiceStatus');
                    return {
                        ...service,
                        status: response.data.status,
                        host: response.data.host,
                        port: response.data.port,
                        last_check: response.data.last_check,
                        error_message: response.data.error_message,
                        server_info: response.data.server_info,
                        models_count: response.data.models_count,
                        response_time: response.data.response_time
                    };
                } else if (service.id === 'label-studio') {
                    // Label Studio 标注服务
                    response = await api.get('/IDataset/getLabelStudioServiceStatus');
                    return {
                        ...service,
                        status: response.data.status,
                        host: response.data.host,
                        port: response.data.port,
                        last_check: response.data.last_check,
                        error_message: response.data.error_message,
                        projects_count: response.data.projects_count
                    };
                } else {
                    // 其他服务的状态检查逻辑
                    return { ...service, status: 'offline' };
                }
            } catch (error) {
                return {
                    ...service,
                    status: 'error',
                    error_message: error.message
                };
            }
        });

        const servicesWithStatus = await Promise.all(statusPromises);
        setServices(servicesWithStatus);
        setIsLoading(false);
    };

    const ServiceCard = ({ service, onNavigate, onRefreshStatus }) => {
        const [isRefreshing, setIsRefreshing] = useState(false);

        const handleRefresh = async () => {
            setIsRefreshing(true);
            await onRefreshStatus();
            setIsRefreshing(false);
        };

        const statusClass = service.status || 'unknown';

        return (
            <div className="service-card">
                {/* 卡片头部 */}
                <div className="service-card-header">
                    <div className={`service-icon ${service.type}`}>
                        {service.icon}
                    </div>
                    <div className="service-info">
                        <h3 className="service-name">
                            {service.name}
                            <span className={`status-badge ${statusClass}`}>
                                <span className={`status-dot ${statusClass}`}></span>
                                {getStatusText(service.status)}
                            </span>
                        </h3>
                        <p className="service-description">{service.description}</p>

                        {/* 服务地址 */}
                        {service.host && service.port && (
                            <div className="service-address">
                                <span className="service-address-label">地址</span>
                                <span className="service-address-value">
                                    {service.host}:{service.port}
                                </span>
                            </div>
                        )}

                        {/* Triton 服务额外信息 */}
                        {service.id === 'triton-inference' && service.status === 'online' && (
                            <div className="service-extra-info">
                                {service.server_info && (
                                    <div className="service-extra-item">
                                        🔧 版本: <strong>{service.server_info.version}</strong>
                                    </div>
                                )}
                                {service.models_count !== undefined && (
                                    <div className="service-extra-item">
                                        📦 模型: <strong>{service.models_count}</strong>
                                    </div>
                                )}
                                {service.response_time && (
                                    <div className="service-extra-item">
                                        ⚡ 响应: <strong>{service.response_time}ms</strong>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 错误消息 */}
                        {service.error_message && (
                            <div className="service-error">
                                <span className="service-error-icon">⚠️</span>
                                <span>{service.error_message}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* 卡片底部 */}
                <div className="service-card-footer">
                    <span className={`protocol-tag ${service.type}`}>
                        {service.type.toUpperCase()}
                    </span>

                    <div className="service-actions">
                        <button
                            className="service-btn service-btn-config"
                            onClick={() => handleEditService(service.id)}
                        >
                            ⚙️ 配置
                        </button>
                        <button
                            className="service-btn service-btn-refresh"
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                        >
                            {isRefreshing ? '🔄 检测中...' : '🔄 刷新'}
                        </button>
                        <button
                            className="service-btn service-btn-primary"
                            onClick={onNavigate}
                        >
                            🚀 进入服务
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="main" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '100px 20px',
                    textAlign: 'center'
                }}>
                    <div className="loading-spinner"></div>
                    <h2 style={{
                        margin: '0 0 12px 0',
                        fontSize: '24px',
                        fontWeight: '600',
                        color: '#2c3e50'
                    }}>
                        正在检查服务状态
                    </h2>
                    <p style={{
                        margin: '0',
                        color: '#6c757d',
                        fontSize: '16px'
                    }}>
                        请稍候，正在连接各个服务...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="main" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
            {/* 配置编辑模态框 */}
            {editingService && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        padding: '24px',
                        width: '400px',
                        maxWidth: '90%',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                    }}>
                        <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600' }}>
                            ⚙️ 配置服务地址
                        </h3>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#495057' }}>
                                主机地址
                            </label>
                            <input
                                type="text"
                                value={editForm.host}
                                onChange={(e) => setEditForm({ ...editForm, host: e.target.value })}
                                placeholder="例如: 192.168.1.100"
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    border: '1px solid #ced4da',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#495057' }}>
                                端口
                            </label>
                            <input
                                type="number"
                                value={editForm.port}
                                onChange={(e) => setEditForm({ ...editForm, port: e.target.value })}
                                placeholder="例如: 8080"
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    border: '1px solid #ced4da',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        {editingService === 'label-studio' && (
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#495057' }}>
                                    API Token
                                </label>
                                <input
                                    type="text"
                                    value={editForm.api_token}
                                    onChange={(e) => setEditForm({ ...editForm, api_token: e.target.value })}
                                    placeholder="Token xxxxx"
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        border: '1px solid #ced4da',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                            <button
                                onClick={() => setEditingService(null)}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: '6px',
                                    border: '1px solid #ced4da',
                                    backgroundColor: 'white',
                                    color: '#495057',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    cursor: 'pointer'
                                }}
                            >
                                取消
                            </button>
                            <button
                                onClick={handleSaveConfig}
                                disabled={isSaving}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    backgroundColor: isSaving ? '#6c757d' : '#28a745',
                                    color: 'white',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    cursor: isSaving ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {isSaving ? '保存中...' : '保存'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div style={{
                marginBottom: '40px',
                padding: '32px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '16px',
                color: 'white',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
            }}>
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
                        🛠️
                    </div>
                    <div>
                        <h1 style={{
                            margin: '0 0 8px 0',
                            fontSize: '32px',
                            fontWeight: '700',
                            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                        }}>
                            服务管理中心
                        </h1>
                        <p style={{
                            margin: '0',
                            fontSize: '16px',
                            opacity: '0.9',
                            fontWeight: '400'
                        }}>
                            统一管理和监控各种外部服务连接状态
                        </p>
                    </div>
                </div>

                <div style={{
                    display: 'flex',
                    gap: '24px',
                    marginTop: '20px'
                }}>
                    <div style={{
                        background: 'rgba(255,255,255,0.15)',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        backdropFilter: 'blur(10px)'
                    }}>
                        <div style={{ fontSize: '24px', fontWeight: '700' }}>
                            {services.length}
                        </div>
                        <div style={{ fontSize: '12px', opacity: '0.8' }}>
                            总服务数
                        </div>
                    </div>
                    <div style={{
                        background: 'rgba(255,255,255,0.15)',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        backdropFilter: 'blur(10px)'
                    }}>
                        <div style={{ fontSize: '24px', fontWeight: '700' }}>
                            {services.filter(s => s.status === 'online').length}
                        </div>
                        <div style={{ fontSize: '12px', opacity: '0.8' }}>
                            在线服务
                        </div>
                    </div>
                    <div style={{
                        background: 'rgba(255,255,255,0.15)',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        backdropFilter: 'blur(10px)'
                    }}>
                        <div style={{ fontSize: '24px', fontWeight: '700' }}>
                            {services.filter(s => s.status === 'offline' || s.status === 'error').length}
                        </div>
                        <div style={{ fontSize: '12px', opacity: '0.8' }}>
                            异常服务
                        </div>
                    </div>
                </div>
            </div>

            <div className="service-card-container">
                {services.map(service => (
                    <ServiceCard
                        key={service.id}
                        service={service}
                        onNavigate={() => navigate(service.path)}
                        onRefreshStatus={checkServicesStatus}
                    />
                ))}
            </div>

            <div
                className="card"
                style={{
                    marginTop: '30px',
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
                        服务状态说明
                    </h3>
                </div>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        backgroundColor: '#d4edda',
                        borderRadius: '8px',
                        border: '1px solid #c3e6cb'
                    }}>
                        <span style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            backgroundColor: '#28a745',
                            boxShadow: '0 0 0 3px #28a74533'
                        }}></span>
                        <div>
                            <div style={{ fontWeight: '600', color: '#155724', fontSize: '14px' }}>在线</div>
                            <div style={{ fontSize: '12px', color: '#155724', opacity: '0.8' }}>服务正常运行</div>
                        </div>
                    </div>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        backgroundColor: '#f8d7da',
                        borderRadius: '8px',
                        border: '1px solid #f5c6cb'
                    }}>
                        <span style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            backgroundColor: '#dc3545',
                            boxShadow: '0 0 0 3px #dc354533'
                        }}></span>
                        <div>
                            <div style={{ fontWeight: '600', color: '#721c24', fontSize: '14px' }}>离线</div>
                            <div style={{ fontSize: '12px', color: '#721c24', opacity: '0.8' }}>服务无法连接</div>
                        </div>
                    </div>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        backgroundColor: '#fff3cd',
                        borderRadius: '8px',
                        border: '1px solid #ffeaa7'
                    }}>
                        <span style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            backgroundColor: '#fd7e14',
                            boxShadow: '0 0 0 3px #fd7e1433'
                        }}></span>
                        <div>
                            <div style={{ fontWeight: '600', color: '#856404', fontSize: '14px' }}>错误</div>
                            <div style={{ fontSize: '12px', color: '#856404', opacity: '0.8' }}>服务连接异常</div>
                        </div>
                    </div>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        backgroundColor: '#e2e3e5',
                        borderRadius: '8px',
                        border: '1px solid #d6d8db'
                    }}>
                        <span style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            backgroundColor: '#6c757d',
                            boxShadow: '0 0 0 3px #6c757d33'
                        }}></span>
                        <div>
                            <div style={{ fontWeight: '600', color: '#383d41', fontSize: '14px' }}>未知</div>
                            <div style={{ fontSize: '12px', color: '#383d41', opacity: '0.8' }}>状态检查中</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ServicesPage;
