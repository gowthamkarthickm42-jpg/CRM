from flask import Blueprint, jsonify, request
from database.connection import get_db_connection


company_bp = Blueprint(
    "company",
    __name__,
    url_prefix="/api/companies"
)


# =========================================================
# GET ALL COMPANIES
# =========================================================

@company_bp.route("", methods=["GET"])
def get_companies():

    connection = get_db_connection()
    cursor = connection.cursor()

    cursor.execute("""
        SELECT
            co.id,
            co.company_name,
            co.industry,
            co.website,
            co.phone,
            co.email,
            co.address,
            COUNT(c.id) AS contact_count
        FROM companies co
        LEFT JOIN contacts c
            ON co.id = c.company_id
        GROUP BY
            co.id,
            co.company_name,
            co.industry,
            co.website,
            co.phone,
            co.email,
            co.address
        ORDER BY co.created_at DESC
    """)

    companies = cursor.fetchall()

    cursor.close()
    connection.close()

    company_list = []

    for company in companies:

        company_list.append({
            "id": company[0],
            "company_name": company[1],
            "industry": company[2],
            "website": company[3],
            "phone": company[4],
            "email": company[5],
            "address": company[6],
            "contact_count": company[7]
        })

    return jsonify({
        "status": "success",
        "data": company_list
    })


# =========================================================
# CREATE COMPANY
# =========================================================

@company_bp.route("", methods=["POST"])
def create_company():

    data = request.get_json()

    company_name = data.get("company_name")
    industry = data.get("industry")
    website = data.get("website")
    phone = data.get("phone")
    email = data.get("email")
    address = data.get("address")

    if not company_name:
        return jsonify({
            "status": "error",
            "message": "Company name is required"
        }), 400

    connection = get_db_connection()
    cursor = connection.cursor()

    cursor.execute("""
        INSERT INTO companies
        (
            company_name,
            industry,
            website,
            phone,
            email,
            address
        )
        VALUES (%s, %s, %s, %s, %s, %s)
        RETURNING id
    """, (
        company_name,
        industry,
        website,
        phone,
        email,
        address
    ))

    company_id = cursor.fetchone()[0]

    connection.commit()

    cursor.close()
    connection.close()

    return jsonify({
        "status": "success",
        "message": "Company created successfully",
        "company_id": company_id
    }), 201


# =========================================================
# UPDATE COMPANY
# =========================================================

@company_bp.route("/<int:company_id>", methods=["PUT"])
def update_company(company_id):

    data = request.get_json()

    company_name = data.get("company_name")
    industry = data.get("industry")
    website = data.get("website")
    phone = data.get("phone")
    email = data.get("email")
    address = data.get("address")

    if not company_name:
        return jsonify({
            "status": "error",
            "message": "Company name is required"
        }), 400

    connection = get_db_connection()
    cursor = connection.cursor()

    cursor.execute("""
        UPDATE companies
        SET
            company_name = %s,
            industry = %s,
            website = %s,
            phone = %s,
            email = %s,
            address = %s
        WHERE id = %s
        RETURNING id
    """, (
        company_name,
        industry,
        website,
        phone,
        email,
        address,
        company_id
    ))

    updated_company = cursor.fetchone()

    if not updated_company:

        cursor.close()
        connection.close()

        return jsonify({
            "status": "error",
            "message": "Company not found"
        }), 404

    connection.commit()

    cursor.close()
    connection.close()

    return jsonify({
        "status": "success",
        "message": "Company updated successfully",
        "company_id": company_id
    })


# =========================================================
# DELETE COMPANY
# =========================================================

@company_bp.route("/<int:company_id>", methods=["DELETE"])
def delete_company(company_id):

    connection = get_db_connection()
    cursor = connection.cursor()

    cursor.execute("""
        DELETE FROM companies
        WHERE id = %s
        RETURNING id
    """, (company_id,))

    deleted_company = cursor.fetchone()

    if not deleted_company:

        cursor.close()
        connection.close()

        return jsonify({
            "status": "error",
            "message": "Company not found"
        }), 404

    connection.commit()

    cursor.close()
    connection.close()

    return jsonify({
        "status": "success",
        "message": "Company deleted successfully",
        "company_id": company_id
    })