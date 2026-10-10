from functools import wraps
from flask import session, jsonify


def api_login_required(view_function):
    @wraps(view_function)
    def wrapped_view(*args, **kwargs):
        if not session.get("user_id"):
            return jsonify({
                "status": "error",
                "message": "Please login to access this resource"
            }), 401

        return view_function(*args, **kwargs)

    return wrapped_view         