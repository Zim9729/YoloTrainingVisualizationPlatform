from flask import jsonify

def format_output(msg: str = "", code: int = 200, data: dict = {}):
    """
    格式化API输出
    """
    return jsonify({
        "msg": msg,
        "code": code,
        "data": data
    })