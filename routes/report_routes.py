from flask import Blueprint, jsonify
from database.connection import get_db_connection


report_bp = Blueprint(
    "report",
    __name__,
    url_prefix="/api/reports"
)


# 1. Pipeline Summary
@report_bp.route("/pipeline", methods=["GET"])
def pipeline_report():

    connection = get_db_connection()
    cursor = connection.cursor()

    cursor.execute("""
        SELECT
            stage,
            COUNT(*) AS deal_count,
            COALESCE(SUM(deal_value), 0) AS total_value
        FROM deals
        GROUP BY stage
        ORDER BY stage
    """)

    rows = cursor.fetchall()

    cursor.close()
    connection.close()

    data = []

    for row in rows:
        data.append({
            "stage": row[0],
            "deal_count": row[1],
            "total_value": float(row[2])
        })

    return jsonify({
        "status": "success",
        "data": data
    })


# 2. Won vs Lost Report
@report_bp.route("/won-lost", methods=["GET"])
def won_lost_report():

    connection = get_db_connection()
    cursor = connection.cursor()

    cursor.execute("""
        SELECT
            stage,
            COUNT(*) AS deal_count,
            COALESCE(SUM(deal_value), 0) AS total_value
        FROM deals
        WHERE stage IN ('won', 'lost')
        GROUP BY stage
        ORDER BY stage
    """)

    rows = cursor.fetchall()

    cursor.close()
    connection.close()

    data = []

    for row in rows:
        data.append({
            "stage": row[0],
            "deal_count": row[1],
            "total_value": float(row[2])
        })

    return jsonify({
        "status": "success",
        "data": data
    })


# 3. Sales Rep Performance
@report_bp.route("/sales-performance", methods=["GET"])
def sales_performance_report():

    connection = get_db_connection()
    cursor = connection.cursor()

    cursor.execute("""
        SELECT
            u.full_name,
            COUNT(d.id) AS total_deals,
            COUNT(
                CASE
                    WHEN d.stage = 'won'
                    THEN 1
                END
            ) AS won_deals,
            COALESCE(
                SUM(
                    CASE
                        WHEN d.stage = 'won'
                        THEN d.deal_value
                        ELSE 0
                    END
                ),
                0
            ) AS won_value
        FROM users u
        LEFT JOIN deals d
            ON u.id = d.assigned_to
        WHERE u.role = 'sales_rep'
        GROUP BY u.id, u.full_name
        ORDER BY won_value DESC
    """)

    rows = cursor.fetchall()

    cursor.close()
    connection.close()

    data = []

    for row in rows:
        data.append({
            "sales_rep": row[0],
            "total_deals": row[1],
            "won_deals": row[2],
            "won_value": float(row[3])
        })

    return jsonify({
        "status": "success",
        "data": data
    })


# 4. Monthly New Leads
@report_bp.route("/monthly-leads", methods=["GET"])
def monthly_leads_report():

    connection = get_db_connection()
    cursor = connection.cursor()

    cursor.execute("""
        SELECT
            TO_CHAR(created_at, 'YYYY-MM') AS month,
            COUNT(*) AS lead_count
        FROM contacts
        WHERE status = 'lead'
        GROUP BY TO_CHAR(created_at, 'YYYY-MM')
        ORDER BY month
    """)

    rows = cursor.fetchall()

    cursor.close()
    connection.close()

    data = []

    for row in rows:
        data.append({
            "month": row[0],
            "lead_count": row[1]
        })

    return jsonify({
        "status": "success",
        "data": data
    })