from flask import Blueprint, jsonify, request
from database.connection import get_db_connection


activity_bp = Blueprint(
    "activity",
    __name__,
    url_prefix="/api/activities"
)


# ==========================================
# GET ALL ACTIVITIES
# ==========================================

@activity_bp.route("", methods=["GET"])
def get_activities():

    connection = get_db_connection()
    cursor = connection.cursor()

    cursor.execute("""
        SELECT
            a.id,
            a.contact_id,
            a.deal_id,
            a.activity_type,
            a.subject,
            a.description,
            a.activity_date,
            c.first_name,
            c.last_name,
            d.title AS deal_title,
            u.full_name AS user_name
        FROM activities a
        LEFT JOIN contacts c
            ON a.contact_id = c.id
        LEFT JOIN deals d
            ON a.deal_id = d.id
        LEFT JOIN users u
            ON a.user_id = u.id
        ORDER BY a.activity_date DESC
    """)

    activities = cursor.fetchall()

    cursor.close()
    connection.close()

    activity_list = []

    for activity in activities:

        activity_list.append({
            "id": activity[0],
            "contact_id": activity[1],
            "deal_id": activity[2],
            "activity_type": activity[3],
            "subject": activity[4],
            "description": activity[5],
            "activity_date": (
                activity[6].isoformat()
                if activity[6]
                else None
            ),
            "contact_name": (
                f"{activity[7]} {activity[8] or ''}"
            ).strip(),
            "deal_title": activity[9],
            "user_name": activity[10]
        })

    return jsonify({
        "status": "success",
        "data": activity_list
    })


# ==========================================
# GET ACTIVITIES FOR ONE CONTACT
# ==========================================

@activity_bp.route(
    "/contact/<int:contact_id>",
    methods=["GET"]
)
def get_contact_activities(contact_id):

    connection = get_db_connection()
    cursor = connection.cursor()

    cursor.execute("""
        SELECT
            a.id,
            a.contact_id,
            a.deal_id,
            a.activity_type,
            a.subject,
            a.description,
            a.activity_date,
            d.title AS deal_title,
            u.full_name AS user_name
        FROM activities a
        LEFT JOIN deals d
            ON a.deal_id = d.id
        LEFT JOIN users u
            ON a.user_id = u.id
        WHERE a.contact_id = %s
        ORDER BY a.activity_date DESC
    """, (contact_id,))

    activities = cursor.fetchall()

    cursor.close()
    connection.close()

    activity_list = []

    for activity in activities:

        activity_list.append({
            "id": activity[0],
            "contact_id": activity[1],
            "deal_id": activity[2],
            "activity_type": activity[3],
            "subject": activity[4],
            "description": activity[5],
            "activity_date": (
                activity[6].isoformat()
                if activity[6]
                else None
            ),
            "deal_title": activity[7],
            "user_name": activity[8]
        })

    return jsonify({
        "status": "success",
        "data": activity_list
    })


# ==========================================
# CREATE ACTIVITY
# ==========================================

@activity_bp.route("", methods=["POST"])
def create_activity():

    data = request.get_json()

    contact_id = data.get("contact_id")
    deal_id = data.get("deal_id")
    user_id = data.get("user_id")
    activity_type = data.get("activity_type")
    subject = data.get("subject")
    description = data.get("description")
    activity_date = data.get("activity_date")

    if not activity_type:

        return jsonify({
            "status": "error",
            "message": "Activity type is required"
        }), 400


    allowed_types = [
        "call",
        "email",
        "meeting",
        "note"
    ]


    if activity_type not in allowed_types:

        return jsonify({
            "status": "error",
            "message": "Invalid activity type"
        }), 400


    connection = get_db_connection()
    cursor = connection.cursor()

    cursor.execute("""
        INSERT INTO activities
        (
            contact_id,
            deal_id,
            user_id,
            activity_type,
            subject,
            description,
            activity_date
        )
        VALUES (
            %s,
            %s,
            %s,
            %s,
            %s,
            %s,
            COALESCE(
                %s::timestamp,
                CURRENT_TIMESTAMP
            )
        )
        RETURNING id
    """, (
        contact_id,
        deal_id,
        user_id,
        activity_type,
        subject,
        description,
        activity_date
    ))

    activity_id = cursor.fetchone()[0]

    connection.commit()

    cursor.close()
    connection.close()

    return jsonify({
        "status": "success",
        "message": "Activity created successfully",
        "activity_id": activity_id
    }), 201


# ==========================================
# UPDATE ACTIVITY
# ==========================================

@activity_bp.route(
    "/<int:activity_id>",
    methods=["PUT"]
)
def update_activity(activity_id):

    data = request.get_json()

    contact_id = data.get("contact_id")
    deal_id = data.get("deal_id")
    user_id = data.get("user_id")
    activity_type = data.get("activity_type")
    subject = data.get("subject")
    description = data.get("description")
    activity_date = data.get("activity_date")

    if not activity_type:

        return jsonify({
            "status": "error",
            "message": "Activity type is required"
        }), 400


    allowed_types = [
        "call",
        "email",
        "meeting",
        "note"
    ]


    if activity_type not in allowed_types:

        return jsonify({
            "status": "error",
            "message": "Invalid activity type"
        }), 400


    connection = get_db_connection()
    cursor = connection.cursor()

    cursor.execute("""
        UPDATE activities
        SET
            contact_id = %s,
            deal_id = %s,
            user_id = %s,
            activity_type = %s,
            subject = %s,
            description = %s,
            activity_date =
                COALESCE(
                    %s::timestamp,
                    CURRENT_TIMESTAMP
                )
        WHERE id = %s
        RETURNING id
    """, (
        contact_id,
        deal_id,
        user_id,
        activity_type,
        subject,
        description,
        activity_date,
        activity_id
    ))

    updated_activity = cursor.fetchone()

    if not updated_activity:

        cursor.close()
        connection.close()

        return jsonify({
            "status": "error",
            "message": "Activity not found"
        }), 404


    connection.commit()

    cursor.close()
    connection.close()

    return jsonify({
        "status": "success",
        "message": "Activity updated successfully",
        "activity_id": activity_id
    })


# ==========================================
# DELETE ACTIVITY
# ==========================================

@activity_bp.route(
    "/<int:activity_id>",
    methods=["DELETE"]
)
def delete_activity(activity_id):

    connection = get_db_connection()
    cursor = connection.cursor()

    cursor.execute("""
        DELETE FROM activities
        WHERE id = %s
        RETURNING id
    """, (activity_id,))

    deleted_activity = cursor.fetchone()

    if not deleted_activity:

        cursor.close()
        connection.close()

        return jsonify({
            "status": "error",
            "message": "Activity not found"
        }), 404


    connection.commit()

    cursor.close()
    connection.close()

    return jsonify({
        "status": "success",
        "message": "Activity deleted successfully",
        "activity_id": activity_id
    })