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