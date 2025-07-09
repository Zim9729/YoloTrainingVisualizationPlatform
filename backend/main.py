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
    
from IDataset.routes import IDataset_bp
from ITraining.routes import ITraining_bp

# 注册蓝图
app.register_blueprint(
    IDataset_bp,
    url_prefix='/IDataset',
)
app.register_blueprint(
    ITraining_bp,
    url_prefix='/ITraining'
)

if __name__ == '__main__':
    app.run(debug=True, port=10799, host='0.0.0.0')