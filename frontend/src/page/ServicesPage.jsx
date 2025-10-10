import { useState, useEffect } from 'react';
import { api } from '../api';
import { getStatusColor, getStatusText } from '../tools';
import '../styles/services.css';

function ServicesPage({ setPageUrl }) {
    const [services, setServices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // 服务配置
    const serviceConfigs = [
        {
            id: 'tcp-image-processor',
            name: 'TCP图像处理服务',
            description: '基于C++的高性能图像处理服务',
            type: 'tcp',
            icon: '🖼️',
            status: 'unknown',
            pageUrl: 'services/tcp-image-processor',
            apiPath: '/IImageProcessor'
        },
        {
            id: 'triton-inference',
            name: 'Triton推理服务',
            description: 'NVIDIA Triton模型推理服务',
            type: 'http',
            icon: '🚀',
            status: 'unknown',
            pageUrl: 'tritonRepo',
            apiPath: '/triton'
        },
        {
            id: 'label-studio',
            name: 'Label Studio标注服务',
            description: '数据标注和管理平台',
            type: 'http',
            icon: '🏷️',
            status: 'unknown',
            pageUrl: 'labelStudioImport',
            apiPath: '/labelstudio'
        }
    ];

    useEffect(() => {
        checkServicesStatus();
    }, []);

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

        return (
            <div 
                className="card" 
                style={{ 
                    marginBottom: '20px',
                    padding: '24px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s ease',
                    backgroundColor: '#ffffff'
                }}
                onMouseEnter={(e) => {
                    e.target.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
                    e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                    e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                    e.target.style.transform = 'translateY(0)';
                }}
            >
                <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '20px' }}>
                    <div 
                        style={{ 
                            fontSize: '56px', 
                            marginRight: '20px',
                            padding: '12px',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: '80px',
                            height: '80px'
                        }}
                    >
                        {service.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                            <h3 style={{ 
                                margin: '0', 
                                fontSize: '22px', 
                                fontWeight: '600',
                                color: '#2c3e50'
                            }}>
                                {service.name}
                            </h3>
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '8px',
                                marginLeft: '16px',
                                padding: '6px 12px',
                                borderRadius: '20px',
                                backgroundColor: service.status === 'online' ? '#d4edda' : 
                                               service.status === 'offline' ? '#f8d7da' : 
                                               service.status === 'error' ? '#fff3cd' : '#e2e3e5'
                            }}>
                                <span 
                                    style={{ 
                                        width: '8px', 
                                        height: '8px', 
                                        borderRadius: '50%',
                                        backgroundColor: getStatusColor(service.status),
                                        boxShadow: `0 0 0 2px ${getStatusColor(service.status)}33`
                                    }}
                                ></span>
                                <span style={{ 
                                    fontSize: '13px', 
                                    fontWeight: '600',
                                    color: service.status === 'online' ? '#155724' : 
                                           service.status === 'offline' ? '#721c24' : 
                                           service.status === 'error' ? '#856404' : '#6c757d'
                                }}>
                                    {getStatusText(service.status)}
                                </span>
                            </div>
                        </div>
                        
                        <p style={{ 
                            margin: '0 0 12px 0', 
                            color: '#6c757d', 
                            fontSize: '15px',
                            lineHeight: '1.5'
                        }}>
                            {service.description}
                        </p>
                        
                        {service.host && service.port && (
                            <div style={{ 
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                marginBottom: '8px'
                            }}>
                                <span style={{ 
                                    fontSize: '12px',
                                    color: '#6c757d',
                                    fontWeight: '500'
                                }}>
                                    服务地址:
                                </span>
                                <code style={{ 
                                    fontSize: '13px', 
                                    color: '#495057',
                                    backgroundColor: '#f8f9fa',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontFamily: 'Monaco, Consolas, monospace'
                                }}>
                                    {service.host}:{service.port}
                                </code>
                            </div>
                        )}
                        
                        {/* Triton 服务额外信息 */}
                        {service.id === 'triton-inference' && service.status === 'online' && (
                            <div style={{ marginBottom: '8px' }}>
                                {service.server_info && (
                                    <div style={{ 
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        marginBottom: '4px'
                                    }}>
                                        <span style={{ fontSize: '12px', color: '#6c757d', fontWeight: '500' }}>
                                            服务器版本:
                                        </span>
                                        <code style={{ 
                                            fontSize: '13px', 
                                            color: '#28a745',
                                            backgroundColor: '#d4edda',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            fontFamily: 'Monaco, Consolas, monospace'
                                        }}>
                                            {service.server_info.version}
                                        </code>
                                    </div>
                                )}
                                <div style={{ 
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px',
                                    fontSize: '12px',
                                    color: '#6c757d'
                                }}>
                                    {service.models_count !== undefined && (
                                        <span>
                                            📦 已加载模型: <strong style={{ color: '#495057' }}>{service.models_count}</strong>
                                        </span>
                                    )}
                                    {service.response_time && (
                                        <span>
                                            ⚡ 响应时间: <strong style={{ color: '#495057' }}>{service.response_time}ms</strong>
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        {service.error_message && (
                            <div style={{ 
                                margin: '8px 0 0 0', 
                                padding: '8px 12px',
                                backgroundColor: '#f8d7da',
                                border: '1px solid #f5c6cb',
                                borderRadius: '6px',
                                fontSize: '13px', 
                                color: '#721c24'
                            }}>
                                <strong>错误:</strong> {service.error_message}
                            </div>
                        )}
                    </div>
                </div>
                
                <div style={{ 
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '16px',
                    borderTop: '1px solid #e9ecef'
                }}>
                    <span 
                        style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            backgroundColor: service.type === 'tcp' ? '#e3f2fd' : '#f3e5f5',
                            color: service.type === 'tcp' ? '#1976d2' : '#7b1fa2',
                            border: `1px solid ${service.type === 'tcp' ? '#bbdefb' : '#e1bee7'}`
                        }}
                    >
                        {service.type.toUpperCase()} 协议
                    </span>
                    
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button 
                            className="btn sm"
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            style={{ 
                                backgroundColor: isRefreshing ? '#6c757d' : '#6c757d',
                                color: 'white',
                                border: 'none',
                                padding: '8px 16px',
                                borderRadius: '6px',
                                fontSize: '13px',
                                fontWeight: '500',
                                cursor: isRefreshing ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            {isRefreshing ? '🔄 检查中...' : '🔄 刷新状态'}
                        </button>
                        <button 
                            className="btn sm"
                            onClick={onNavigate}
                            style={{ 
                                backgroundColor: '#007bff',
                                color: 'white',
                                border: 'none',
                                padding: '8px 16px',
                                borderRadius: '6px',
                                fontSize: '13px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = '#0056b3';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = '#007bff';
                            }}
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
            
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', 
                gap: '24px',
                marginBottom: '40px'
            }}>
                {services.map(service => (
                    <ServiceCard 
                        key={service.id}
                        service={service}
                        onNavigate={() => setPageUrl(service.pageUrl)}
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
