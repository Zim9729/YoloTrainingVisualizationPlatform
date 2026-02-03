import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from flask import Flask
from flask_cors import CORS
from tools.format_output import format_output

app = Flask(__name__)
CORS(app)

@app.route("/")
def hello_world():
    return "OK"

@app.route("/info")
def info():
    return format_output(data={
        "version": "1.0.0"
    })

# 服务配置 API
from tools.service_config import load_service_config, update_service_config
from flask import request

@app.route("/getServiceConfig")
def get_service_config():
    """获取所有服务配置"""
    config = load_service_config()
    return format_output(data=config)

@app.route("/updateServiceConfig", methods=["POST"])
def update_service_config_api():
    """更新服务配置"""
    try:
        data = request.get_json()
        service_id = data.get("service_id")
        host = data.get("host")
        port = data.get("port")
        api_token = data.get("api_token")
        
        if not service_id:
            return format_output(code=400, msg="缺少 service_id 参数")
        
        config = update_service_config(service_id, host, port, api_token)
        return format_output(data=config, msg="配置更新成功")
    except ValueError as e:
        return format_output(code=400, msg=str(e))
    except Exception as e:
        return format_output(code=500, msg=f"更新配置失败: {str(e)}")

# 导入蓝图
from IDataset.routes import IDataset_bp
from ITraining.routes import ITraining_bp
from IModel.routes import IModel_bp
from IImageProcessor.routes import IImageProcessor_bp

# 注册蓝图
app.register_blueprint(IDataset_bp, url_prefix='/IDataset')
app.register_blueprint(ITraining_bp, url_prefix='/ITraining')
app.register_blueprint(IModel_bp, url_prefix='/IModel')
app.register_blueprint(IImageProcessor_bp, url_prefix='/IImageProcessor')

if __name__ == '__main__':
    app.run(debug=False, port=10799, host='0.0.0.0')
    # app.run(debug=True, port=10799, host='0.0.0.0')