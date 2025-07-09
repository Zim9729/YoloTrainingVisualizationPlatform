function TasksPage({ setPageUrl, parameter }) {
    switch (parameter.type) {
        case "newTask":
            return (
                <div className="main">
                    <h1 className="page-title">创建训练任务</h1>
                    <p className="page-des">填写模型训练信息。</p>

                    <div className="form-group-title">
                        <h1 className="step-tag">1</h1>
                        <h1 className="title">
                            基本信息
                        </h1>
                    </div>

                    <div className="form-group-title">
                        <h1 className="step-tag">2</h1>
                        <h1 className="title">
                            数据集选择
                        </h1>
                    </div>

                    <div className="form-group-title">
                        <h1 className="step-tag">3</h1>
                        <h1 className="title">
                            训练参数
                        </h1>
                    </div>

                    <div className="form-group-title">
                        <h1 className="step-tag">4</h1>
                        <h1 className="title">
                            高级选项
                        </h1>
                    </div>
                </div>
            );
        default:
            return (
                <div className="main">
                    <h1 className="page-title">训练任务</h1>
                    <p className="page-des">管理所有模型训练任务。</p>
                    <button className="btn sm" onClick={() => setPageUrl("tasks?type=newTask")} style={{ marginBottom: '10px' }}>新建训练任务</button>
                </div>
            );
    }
}

export default TasksPage;