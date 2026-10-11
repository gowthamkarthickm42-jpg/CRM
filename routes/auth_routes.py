
from flask import Blueprint, request, jsonify, session
from werkzeug.security import check_password_hash
from database.connection import get_db_connection


auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({
            "status": "error",
            "message": "Email and password are required"
        }), 400

    connection = get_db_connection()
    cursor = connection.cursor()

    try:
        cursor.execute("""
            SELECT id, full_name, email, password_hash, role
            FROM users
            WHERE email = %s AND is_active = TRUE
        """, (email,))

        user = cursor.fetchone()
    finally:
        cursor.close()
        connection.close()

    if not user or not check_password_hash(user[3], password):
        return jsonify({
            "status": "error",
            "message": "Invalid email or password"
        }), 401

    session.clear()
    session["user_id"] = user[0]
    session["user_name"] = user[1]
    session["user_role"] = user[4]

    return jsonify({
        "status": "success",
        "message": "Login successful",
        "user": {
            "id": user[0],
            "full_name": user[1],
            "email": user[2],
            "role": user[4]
        }
    })


@auth_bp.route("/logout", methods=["POST"])
def logout():
    session.clear()

    return jsonify({
        "status": "success",
        "message": "Logged out successfully"
    })


@auth_bp.route("/users", methods=["GET"])
def get_users():
    connection = get_db_connection()
    cursor = connection.cursor()

    try:
        cursor.execute("""
            SELECT id, full_name, email, role
            FROM users
            WHERE is_active = TRUE
            ORDER BY full_name
        """)

        rows = cursor.fetchall()
    finally:
        cursor.close()
        connection.close()

    users = []

    for row in rows:
        users.append({
            "id": row[0],
            "full_name": row[1],
            "email": row[2],
            "role": row[3]
        })

    return jsonify({
        "status": "success",
        "data": users
    })