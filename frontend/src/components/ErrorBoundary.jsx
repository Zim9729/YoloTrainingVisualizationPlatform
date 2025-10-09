import { Component } from 'react';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { 
            hasError: false, 
            error: null,
            errorInfo: null 
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({
            error,
            errorInfo
        });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100vh',
                    padding: '20px',
                    backgroundColor: '#f8f9fa'
                }}>
                    <div className="card" style={{ 
                        maxWidth: '600px', 
                        padding: '30px',
                        textAlign: 'center'
                    }}>
                        <h1 className="title" style={{ 
                            fontSize: '32px', 
                            marginBottom: '16px',
                            color: '#dc3545' 
                        }}>
                            😵 糟糕！出错了
                        </h1>
                        <p className="content" style={{ 
                            marginBottom: '20px',
                            color: '#6c757d'
                        }}>
                            应用程序遇到了一个意外错误。这不应该发生，我们正在努力修复它。
                        </p>
                        
                        {this.state.error && (
                            <div style={{
                                textAlign: 'left',
                                backgroundColor: '#f8d7da',
                                border: '1px solid #f5c6cb',
                                borderRadius: '6px',
                                padding: '12px',
                                marginBottom: '20px'
                            }}>
                                <strong style={{ color: '#721c24' }}>错误信息:</strong>
                                <pre style={{ 
                                    margin: '8px 0 0 0',
                                    fontSize: '12px',
                                    color: '#721c24',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word'
                                }}>
                                    {this.state.error.toString()}
                                </pre>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <button 
                                className="btn sm" 
                                onClick={() => window.location.reload()}
                                style={{
                                    backgroundColor: '#007bff',
                                    color: 'white',
                                    padding: '10px 20px'
                                }}
                            >
                                🔄 刷新页面
                            </button>
                            <button 
                                className="btn sm" 
                                onClick={() => {
                                    this.setState({ hasError: false, error: null, errorInfo: null });
                                }}
                                style={{
                                    backgroundColor: '#6c757d',
                                    color: 'white',
                                    padding: '10px 20px'
                                }}
                            >
                                🔙 返回应用
                            </button>
                            <button 
                                className="btn sm" 
                                onClick={() => {
                                    window.open('https://github.com/chzane/YoloTrainingVisualizationPlatform/issues', '_blank');
                                }}
                                style={{
                                    backgroundColor: '#28a745',
                                    color: 'white',
                                    padding: '10px 20px'
                                }}
                            >
                                📝 反馈问题
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
