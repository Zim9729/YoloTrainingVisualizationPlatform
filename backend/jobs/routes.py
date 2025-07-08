# 账户相关蓝图
from flask import Blueprint, request
from tools.format_output import format_output

jobs_bp = Blueprint('auth', __name__)

@jobs_bp.route('/add_job')
def add_job():
    """
    注册任务
    """
    data = request.json
    if not data:
        return format_output(
            msg="No data provided",
            code=400
        )
    
    return format_output(
        msg="Login"
    )
