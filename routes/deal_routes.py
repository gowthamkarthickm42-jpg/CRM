from flask import Blueprint, jsonify, request
from database.connection import get_db_connection


deal_bp = Blueprint(
    "deal",
    __name__,
    url_prefix="/api/deals"
)


# =========================================================
# GET ALL DEALS
# =========================================================

@deal_bp.route("", methods=["GET"])
def get_deals():

    connection = get_db_connection()
    cursor = connection.cursor()

    cursor.execute("""
        SELECT
            d.id,
            d.title,
            d.stage,
            d.deal_value,
            d.expected_close_date,
            c.first_name,
            c.last_name,
            co.company_name,
            u.full_name AS assigned_to
        FROM deals d
        LEFT JOIN contacts c
            ON d.contact_id = c.id
        LEFT JOIN companies co
            ON c.company_id = co.id
        LEFT JOIN users u
            ON d.assigned_to = u.id
        ORDER BY d.created_at DESC
    """)

    deals = cursor.fetchall()

    cursor.close()
    connection.close()

    deal_list = []

    for deal in deals:

        deal_list.append({
            "id": deal[0],
            "title": deal[1],
            "stage": deal[2],
            "deal_value": float(deal[3]),
            "expected_close_date": (
                deal[4].isoformat()
                if deal[4]
                else None
            ),
            "contact_name": (
                f"{deal[5]} {deal[6] or ''}"
            ).strip(),
            "company_name": deal[7],
            "assigned_to": deal[8]
        })

    return jsonify({
        "status": "success",
        "data": deal_list
    })


# =========================================================
# CREATE DEAL
# =========================================================

@deal_bp.route("", methods=["POST"])
def create_deal():

    data = request.get_json()

    contact_id = data.get("contact_id")
    assigned_to = data.get("assigned_to")
    title = data.get("title")
    stage = data.get("stage", "new")
    deal_value = data.get("deal_value", 0)
    expected_close_date = data.get("expected_close_date")


    if not contact_id:
        return jsonify({
            "status": "error",
            "message": "Contact is required"
        }), 400


    if not title:
        return jsonify({
            "status": "error",
            "message": "Deal title is required"
        }), 400


    connection = get_db_connection()
    cursor = connection.cursor()


    cursor.execute("""
        INSERT INTO deals
        (
            contact_id,
            assigned_to,
            title,
            stage,
            deal_value,
            expected_close_date
        )
        VALUES (%s, %s, %s, %s, %s, %s)
        RETURNING id
    """, (
        contact_id,
        assigned_to,
        title,
        stage,
        deal_value,
        expected_close_date
    ))


    deal_id = cursor.fetchone()[0]

    connection.commit()

    cursor.close()
    connection.close()


    return jsonify({
        "status": "success",
        "message": "Deal created successfully",
        "deal_id": deal_id
    }), 201


# =========================================================
# UPDATE DEAL
# =========================================================

@deal_bp.route("/<int:deal_id>", methods=["PUT"])
def update_deal(deal_id):

    data = request.get_json()

    contact_id = data.get("contact_id")
    assigned_to = data.get("assigned_to")
    title = data.get("title")
    stage = data.get("stage")
    deal_value = data.get("deal_value")
    expected_close_date = data.get("expected_close_date")


    if not contact_id:
        return jsonify({
            "status": "error",
            "message": "Contact is required"
        }), 400


    if not title:
        return jsonify({
            "status": "error",
            "message": "Deal title is required"
        }), 400


    connection = get_db_connection()
    cursor = connection.cursor()


    cursor.execute("""
        UPDATE deals
        SET
            contact_id = %s,
            assigned_to = %s,
            title = %s,
            stage = %s,
            deal_value = %s,
            expected_close_date = %s,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = %s
        RETURNING id
    """, (
        contact_id,
        assigned_to,
        title,
        stage,
        deal_value,
        expected_close_date,
        deal_id
    ))


    updated_deal = cursor.fetchone()


    if not updated_deal:

        cursor.close()
        connection.close()

        return jsonify({
            "status": "error",
            "message": "Deal not found"
        }), 404


    connection.commit()

    cursor.close()
    connection.close()


    return jsonify({
        "status": "success",
        "message": "Deal updated successfully",
        "deal_id": deal_id
    })


# =========================================================
# DELETE DEAL
# =========================================================

@deal_bp.route("/<int:deal_id>", methods=["DELETE"])
def delete_deal(deal_id):

    connection = get_db_connection()
    cursor = connection.cursor()


    cursor.execute("""
        DELETE FROM deals
        WHERE id = %s
        RETURNING id
    """, (deal_id,))


    deleted_deal = cursor.fetchone()


    if not deleted_deal:

        cursor.close()
        connection.close()

        return jsonify({
            "status": "error",
            "message": "Deal not found"
        }), 404


    connection.commit()

    cursor.close()
    connection.close()


    return jsonify({
        "status": "success",
        "message": "Deal deleted successfully",
        "deal_id": deal_id
    })