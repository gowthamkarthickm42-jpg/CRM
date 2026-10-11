from flask import Blueprint, jsonify, request
from database.connection import get_db_connection


lead_bp = Blueprint(
    "lead",
    __name__,
    url_prefix="/api/leads"
)


# Get all leads
@lead_bp.route("", methods=["GET"])
def get_leads():

    connection = get_db_connection()
    cursor = connection.cursor()

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
            c.created_at
        FROM contacts c
        LEFT JOIN companies co
            ON c.company_id = co.id
        LEFT JOIN users u
            ON c.assigned_to = u.id
        WHERE c.status IN (
            'lead',
            'contacted',
            'qualified',
            'proposal_sent',
            'won',
            'lost'
        )
        ORDER BY c.created_at DESC
    """)

    rows = cursor.fetchall()

    cursor.close()
    connection.close()

    leads = []

    for row in rows:
        leads.append({
            "id": row[0],
            "first_name": row[1],
            "last_name": row[2],
            "email": row[3],
            "phone": row[4],
            "job_title": row[5],
            "status": row[6],
            "company_id": row[7],
            "company_name": row[8],
            "assigned_to": row[9],
            "assigned_to_name": row[10],
            "created_at": row[11].isoformat() if row[11] else None
        })

    return jsonify({
        "status": "success",
        "data": leads
    })


# Create new lead
@lead_bp.route("", methods=["POST"])
def create_lead():

    data = request.get_json()

    first_name = data.get("first_name")
    last_name = data.get("last_name")
    email = data.get("email")
    phone = data.get("phone")
    job_title = data.get("job_title")
    company_id = data.get("company_id")
    assigned_to = data.get("assigned_to")

    if not first_name:
        return jsonify({
            "status": "error",
            "message": "First name is required"
        }), 400

    connection = get_db_connection()
    cursor = connection.cursor()

    cursor.execute("""
        INSERT INTO contacts
        (
            first_name,
            last_name,
            email,
            phone,
            job_title,
            company_id,
            assigned_to,
            status
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, 'lead')
        RETURNING id
    """, (
        first_name,
        last_name,
        email,
        phone,
        job_title,
        company_id,
        assigned_to
    ))

    lead_id = cursor.fetchone()[0]

    connection.commit()

    cursor.close()
    connection.close()

    return jsonify({
        "status": "success",
        "message": "Lead created successfully",
        "lead_id": lead_id
    }), 201


# Update lead
@lead_bp.route("/<int:lead_id>", methods=["PUT"])
def update_lead(lead_id):

    data = request.get_json()

    first_name = data.get("first_name")
    last_name = data.get("last_name")
    email = data.get("email")
    phone = data.get("phone")
    job_title = data.get("job_title")
    company_id = data.get("company_id")
    assigned_to = data.get("assigned_to")
    status = data.get("status", "lead")

    allowed_statuses = [
        "lead",
        "contacted",
        "qualified",
        "proposal_sent",
        "won",
        "lost"
    ]

    if status not in allowed_statuses:
        return jsonify({
            "status": "error",
            "message": "Invalid lead status"
        }), 400

    if not first_name:
        return jsonify({
            "status": "error",
            "message": "First name is required"
        }), 400

    connection = get_db_connection()
    cursor = connection.cursor()

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
        lead_id
    ))

    updated = cursor.fetchone()

    if not updated:
        cursor.close()
        connection.close()

        return jsonify({
            "status": "error",
            "message": "Lead not found"
        }), 404

    connection.commit()

    cursor.close()
    connection.close()

    return jsonify({
        "status": "success",
        "message": "Lead updated successfully",
        "lead_id": lead_id
    })


# Delete lead
@lead_bp.route("/<int:lead_id>", methods=["DELETE"])
def delete_lead(lead_id):

    connection = get_db_connection()
    cursor = connection.cursor()

    cursor.execute("""
        DELETE FROM contacts
        WHERE id = %s
        RETURNING id
    """, (lead_id,))

    deleted = cursor.fetchone()

    if not deleted:
        cursor.close()
        connection.close()

        return jsonify({
            "status": "error",
            "message": "Lead not found"
        }), 404

    connection.commit()

    cursor.close()
    connection.close()

    return jsonify({
        "status": "success",
        "message": "Lead deleted successfully",
        "lead_id": lead_id
    })