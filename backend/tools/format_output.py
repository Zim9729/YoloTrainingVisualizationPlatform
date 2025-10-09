from flask import jsonify

def format_output(msg: str = "", code: int = 200, data: dict = None):
    """
    格式化API输出
    
    Args:
        msg: 响应消息
        code: HTTP状态码
        data: 响应数据字典
    
    Returns:
        JSON响应对象
    """
    if data is None:
        data = {}
    
    return jsonify({
        "msg": msg,
        "code": code,
        "data": data
    })