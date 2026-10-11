from flask import Blueprint, jsonify, request
from database.connection import get_db_connection
from config import Config

import os
import smtplib

from email.message import EmailMessage


email_bp = Blueprint(
    "email",
    __name__,
    url_prefix="/api/email"
)


@email_bp.route("/send", methods=["POST"])
def send_email():

    data = request.get_json()

    contact_id = data.get("contact_id")
    user_id = data.get("user_id")
    to_email = data.get("to_email")
    subject = data.get("subject")
    message = data.get("message")


    # ==========================================
    # BASIC VALIDATION
    # ==========================================

    if not to_email:

        return jsonify({
            "status": "error",
            "message": "Recipient email is required"
        }), 400


    if not subject:

        return jsonify({
            "status": "error",
            "message": "Email subject is required"
        }), 400


    if not message:

        return jsonify({
            "status": "error",
            "message": "Email message is required"
        }), 400


    # ==========================================
    # SMTP SETTINGS
    # ==========================================

    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = os.getenv("SMTP_PORT")
    smtp_email = os.getenv("SMTP_EMAIL")
    smtp_password = os.getenv("SMTP_PASSWORD")


    if not all([
        smtp_host,
        smtp_port,
        smtp_email,
        smtp_password
    ]):

        return jsonify({
            "status": "error",
            "message": "Email service is not configured. Please configure SMTP settings."
        }), 503


    try:

        smtp_port = int(smtp_port)


        # ==========================================
        # CREATE EMAIL
        # ==========================================

        email = EmailMessage()

        email["From"] = smtp_email
        email["To"] = to_email
        email["Subject"] = subject

        email.set_content(message)


        # ==========================================
        # SEND EMAIL
        # ==========================================

        with smtplib.SMTP(
            smtp_host,
            smtp_port
        ) as server:

            server.starttls()

            server.login(
                smtp_email,
                smtp_password
            )

            server.send_message(email)


        # ==========================================
        # SAVE EMAIL ACTIVITY
        # ==========================================

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
            VALUES
            (
                %s,
                NULL,
                %s,
                'email',
                %s,
                %s,
                CURRENT_TIMESTAMP
            )
            RETURNING id
        """, (
            contact_id,
            user_id,
            subject,
            message
        ))


        activity_id = cursor.fetchone()[0]


        connection.commit()

        cursor.close()
        connection.close()


        return jsonify({
            "status": "success",
            "message": "Email sent successfully",
            "activity_id": activity_id
        })


    except Exception as error:

        print("Email sending error:", error)

        return jsonify({
            "status": "error",
            "message": "Failed to send email. Please check SMTP settings."
        }), 500