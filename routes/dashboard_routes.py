
from flask import Blueprint, jsonify
from database.connection import get_db_connection


dashboard_bp = Blueprint(
    "dashboard",
    __name__,
    url_prefix="/api/dashboard"
)


# DASHBOARD SUMMARY
@dashboard_bp.route("/summary", methods=["GET"])
def dashboard_summary():
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute("SELECT COUNT(*) FROM contacts")
        total_contacts = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM companies")
        total_companies = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM deals")
        total_deals = cursor.fetchone()[0]

        cursor.execute("""
            SELECT COALESCE(SUM(deal_value), 0)
            FROM deals
            WHERE LOWER(stage) NOT IN ('won', 'lost')
        """)
        pipeline_value = cursor.fetchone()[0]

        return jsonify({
            "status": "success",
            "data": {
                "total_contacts": total_contacts,
                "total_companies": total_companies,
                "total_deals": total_deals,
                "pipeline_value": float(pipeline_value)
            }
        })

    except Exception as error:
        print("Dashboard summary error:", error)

        return jsonify({
            "status": "error",
            "message": "Unable to load dashboard summary."
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()


# RECENT ACTIVITIES
@dashboard_bp.route("/recent-activities", methods=["GET"])
def recent_activities():
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute("""
            SELECT
                a.id,
                a.activity_type,
                a.subject,
                a.description,
                a.activity_date,
                c.first_name,
                c.last_name,
                u.full_name AS user_name
            FROM activities a
            LEFT JOIN contacts c
                ON a.contact_id = c.id
            LEFT JOIN users u
                ON a.user_id = u.id
            ORDER BY
                a.activity_date DESC NULLS LAST,
                a.id DESC
            LIMIT 5
        """)

        activities = cursor.fetchall()
        activity_list = []

        for activity in activities:
            activity_date = activity[4]

            activity_list.append({
                "id": activity[0],
                "activity_type": activity[1],
                "subject": activity[2],
                "description": activity[3],
                "activity_date": (
                    activity_date.isoformat()
                    if activity_date else None
                ),
                "contact_name": (
                    f"{activity[5] or ''} {activity[6] or ''}"
                ).strip() or "Unknown Contact",
                "user_name": activity[7] or "Unknown User"
            })

        return jsonify({
            "status": "success",
            "data": activity_list
        })

    except Exception as error:
        print("Recent activities error:", error)

        return jsonify({
            "status": "error",
            "message": "Unable to load recent activities."
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()
