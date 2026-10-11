
from functools import wraps

from flask import Blueprint, jsonify, request, session
from database.connection import get_db_connection


contact_bp = Blueprint(
    "contact",
    __name__,
    url_prefix="/api/contacts"
)


# =========================================================
# LOGIN PROTECTION
# =========================================================

def api_login_required(view_function):
    @wraps(view_function)
    def wrapped_view(*args, **kwargs):
        if not session.get("user_id"):
            return jsonify({
                "status": "error",
                "message": "Please login first"
            }), 401

        return view_function(*args, **kwargs)

    return wrapped_view


# =========================================================
# GET ALL CONTACTS
# =========================================================

@contact_bp.route("", methods=["GET"])
@api_login_required
def get_contacts():
    connection = get_db_connection()
    cursor = connection.cursor()

    try:
        cursor.execute("""
            SELECT
                c.id,
                c.first_name,
                c.last_name,
                c.email,
                c.phone,
                c.job_title,
                c.status,
                co.company_name,
                u.full_name AS assigned_to
            FROM contacts c
            LEFT JOIN companies co
                ON c.company_id = co.id
            LEFT JOIN users u
                ON c.assigned_to = u.id
            ORDER BY c.created_at DESC
        """)

        contacts = cursor.fetchall()

        contact_list = []

        for contact in contacts:
            contact_list.append({
                "id": contact[0],
                "first_name": contact[1],
                "last_name": contact[2],
                "email": contact[3],
                "phone": contact[4],
                "job_title": contact[5],
                "status": contact[6],
                "company_name": contact[7],
                "assigned_to": contact[8]
            })

        return jsonify({
            "status": "success",
            "data": contact_list
        })

    finally:
        cursor.close()
        connection.close()


# =========================================================
# GET ONE CONTACT
# =========================================================

@contact_bp.route("/<int:contact_id>", methods=["GET"])
@api_login_required
def get_contact(contact_id):
    connection = get_db_connection()
    cursor = connection.cursor()

    try:
        cursor.execute("""
            SELECT
                c.id,
                c.first_name,
                c.last_name,
                c.email,
                c.phone,
                c.job_title,
                c.status,
                c.company_id,
                co.company_name,
                c.assigned_to,
                u.full_name AS assigned_to_name,
                c.created_at,
                c.updated_at
            FROM contacts c
            LEFT JOIN companies co
                ON c.company_id = co.id
            LEFT JOIN users u
                ON c.assigned_to = u.id
            WHERE c.id = %s
        """, (contact_id,))

        contact = cursor.fetchone()

        if not contact:
            return jsonify({
                "status": "error",
                "message": "Contact not found"
            }), 404

        contact_data = {
            "id": contact[0],
            "first_name": contact[1],
            "last_name": contact[2],
            "email": contact[3],
            "phone": contact[4],
            "job_title": contact[5],
            "status": contact[6],
            "company_id": contact[7],
            "company_name": contact[8],
            "assigned_to": contact[9],
            "assigned_to_name": contact[10],
            "created_at": (
                contact[11].isoformat()
                if contact[11] else None
            ),
            "updated_at": (
                contact[12].isoformat()
                if contact[12] else None
            )
        }

        return jsonify({
            "status": "success",
            "data": contact_data
        })

    finally:
        cursor.close()
        connection.close()


# =========================================================
# CREATE CONTACT
# =========================================================

@contact_bp.route("", methods=["POST"])
@api_login_required
def create_contact():
    data = request.get_json(silent=True) or {}

    first_name = data.get("first_name")

    if not first_name:
        return jsonify({
            "status": "error",
            "message": "First name is required"
        }), 400

    last_name = data.get("last_name")
    email = data.get("email")
    phone = data.get("phone")
    job_title = data.get("job_title")
    company_id = data.get("company_id") or None
    assigned_to = data.get("assigned_to") or None
    status = data.get("status", "lead")

    connection = get_db_connection()
    cursor = connection.cursor()

    try:
        cursor.execute("""
            INSERT INTO contacts (
                company_id,
                first_name,
                last_name,
                email,
                phone,
                job_title,
                status,
                assigned_to
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            company_id,
            first_name,
            last_name,
            email,
            phone,
            job_title,
            status,
            assigned_to
        ))

        contact_id = cursor.fetchone()[0]
        connection.commit()

        return jsonify({
            "status": "success",
            "message": "Contact created successfully",
            "contact_id": contact_id
        }), 201

    except Exception:
        connection.rollback()
        raise

    finally:
        cursor.close()
        connection.close()


# =========================================================
# UPDATE CONTACT
# =========================================================

@contact_bp.route("/<int:contact_id>", methods=["PUT"])
@api_login_required
def update_contact(contact_id):
    data = request.get_json(silent=True) or {}

    first_name = data.get("first_name")

    if not first_name:
        return jsonify({
            "status": "error",
            "message": "First name is required"
        }), 400

    last_name = data.get("last_name")
    email = data.get("email")
    phone = data.get("phone")
    job_title = data.get("job_title")
    company_id = data.get("company_id") or None
    assigned_to = data.get("assigned_to") or None
    status = data.get("status")

    if not status:
        return jsonify({
            "status": "error",
            "message": "Status is required"
        }), 400

    connection = get_db_connection()
    cursor = connection.cursor()

    try:
        cursor.execute("""
            UPDATE contacts
            SET
                first_name = %s,
                last_name = %s,
                email = %s,
                phone = %s,
                job_title = %s,
                company_id = %s,
                assigned_to = %s,
                status = %s,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
            RETURNING id
        """, (
            first_name,
            last_name,
            email,
            phone,
            job_title,
            company_id,
            assigned_to,
            status,
            contact_id
        ))

        updated_contact = cursor.fetchone()

        if not updated_contact:
            return jsonify({
                "status": "error",
                "message": "Contact not found"
            }), 404

        connection.commit()

        return jsonify({
            "status": "success",
            "message": "Contact updated successfully",
            "contact_id": contact_id
        })

    except Exception:
        connection.rollback()
        raise

    finally:
        cursor.close()
        connection.close()


# =========================================================
# DELETE CONTACT
# =========================================================

@contact_bp.route("/<int:contact_id>", methods=["DELETE"])
@api_login_required
def delete_contact(contact_id):
    connection = get_db_connection()
    cursor = connection.cursor()

    try:
        cursor.execute("""
            DELETE FROM contacts
            WHERE id = %s
            RETURNING id
        """, (contact_id,))

        deleted_contact = cursor.fetchone()

        if not deleted_contact:
            return jsonify({
                "status": "error",
                "message": "Contact not found"
            }), 404

        connection.commit()

        return jsonify({
            "status": "success",
            "message": "Contact deleted successfully",
            "contact_id": contact_id
        })

    except Exception:
        connection.rollback()
        raise

    finally:
        cursor.close()
        connection.close()