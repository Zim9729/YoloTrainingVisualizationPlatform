import BACKGROUND_IMAGE from "@/assets/background_3.png";

function HomePage({ setPageUrl, parameter }) {
    return (
        <div className="main nopadding">
            <div className="banner" style={{
                backgroundImage: `url(${BACKGROUND_IMAGE})`,
                backgroundSize: 'cover',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
            }}>
                <h1 className="page-title">👋 欢迎</h1>
                <p className="page-des">快速开始训练视觉模型</p>
            </div>
            <div style={{ padding: '40px 70px' }}>
                <div className="card-group" style={{ marginTop: '10px' }}>
                    <div className="card">
                        <div className="top-tag">1</div>
                        <h1 className="title">上传数据集</h1>
                        <p className="content">支持 YOLO / COCO 格式的数据集，系统会自动解析标注信息并生成预览。</p>
                        <button className="btn sm bottom-btn" onClick={() => { setPageUrl("dataset?type=uploadDataset") }} style={{ marginRight: '5px' }}>上传数据集</button>
                        <button className="btn sm bottom-btn" onClick={() => { setPageUrl("dataset") }}>从已有的数据集开始</button>
                    </div>
                    <div className="card">
                        <div className="top-tag">2</div>
                        <h1 className="title">配置训练任务</h1>
                        <p className="content">选择基础模型，并设置 epoch、batch size、图像尺寸等参数，无需编码，即可轻松完成配置。</p>
                        <button className="btn sm bottom-btn" onClick={() => { setPageUrl("tasks?type=newTask") }}>创建训练任务</button>
                    </div>
                    <div className="card">
                        <div className="top-tag">3</div>
                        <h1 className="title">一键启动模型训练</h1>
                        <p className="content">点击“开始训练”，系统将在后台自动调度任务，实时跟踪训练进度。</p>
                        <button className="btn sm bottom-btn" onClick={() => { setPageUrl("tasks") }}>查看我的任务</button>
                    </div>
                    <div className="card">
                        <div className="top-tag">4</div>
                        <h1 className="title">下载模型并测试</h1>
                        <p className="content">训练完成后可一键下载模型文件，同时可查看模型在验证集上的预测结果。</p>
                        <button className="btn sm bottom-btn" onClick={() => { setPageUrl("models") }}>查看我的模型</button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default HomePage;