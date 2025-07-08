from flask import Flask

app = Flask(__name__)

from jobs.routes import jobs_bp

# 注册蓝图
app.register_blueprint(
    jobs_bp,
    url_prefix='/jobs',
)

@app.route("/")
def hello_world():
    return "OK"

if __name__ == '__main__':
    app.run(debug=True, port=1024, host='0.0.0.0')