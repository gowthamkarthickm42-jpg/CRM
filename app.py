
from functools import wraps

from flask import (
    Flask,
    jsonify,
    render_template,
    redirect,
    session,
    request,
)
from config import Config
from database.connection import get_db_connection

from routes.auth_routes import auth_bp
from routes.dashboard_routes import dashboard_bp
from routes.contact_routes import contact_bp
from routes.company_routes import company_bp
from routes.deal_routes import deal_bp
from routes.activity_routes import activity_bp
from routes.task_routes import task_bp
from routes.report_routes import report_bp
from routes.lead_routes import lead_bp
from routes.email_routes import email_bp


app = Flask(__name__)
app.config.from_object(Config)


# Register API Blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(dashboard_bp)
app.register_blueprint(contact_bp)
app.register_blueprint(company_bp)
app.register_blueprint(deal_bp)
app.register_blueprint(activity_bp)
app.register_blueprint(task_bp)
app.register_blueprint(report_bp)
app.register_blueprint(lead_bp)
app.register_blueprint(email_bp)


# Protect HTML pages with login session
def login_required(view_function):
    @wraps(view_function)
    def wrapped_view(*args, **kwargs):
        if not session.get("user_id"):
            return redirect("/login")
        return view_function(*args, **kwargs)

    return wrapped_view


# Home
@app.route("/")
def home():
    if session.get("user_id"):
        return redirect("/dashboard")
    return redirect("/login")


# Login Page
@app.route("/login")
def login_page():
    if session.get("user_id"):
        return redirect("/dashboard")
    return render_template("login.html")


# Dashboard Page
@app.route("/dashboard")
@login_required
def dashboard():
    return render_template("dashboard.html")


# Leads Page
@app.route("/leads")
@login_required
def leads_page():
    return render_template("leads.html")


# Contacts Page
@app.route("/contacts")
@login_required
def contacts_page():
    return render_template("contacts.html")


# Companies Page
@app.route("/companies")
@login_required
def companies_page():
    return render_template("companies.html")


# Deals Page
@app.route("/deals")
@login_required
def deals_page():
    return render_template("deals.html")


# Activities Page
@app.route("/activities")
@login_required
def activities_page():
    return render_template("activities.html")


# Tasks Page
@app.route("/tasks")
@login_required
def tasks_page():
    return render_template("tasks.html")


# Reports Page
@app.route("/reports")
@login_required
def reports_page():
    return render_template("reports.html")


# Health Check
@app.route("/api/health")
def health_check():
    try:
        connection = get_db_connection()
        connection.close()

        return jsonify({
            "status": "success",
            "message": "Flask and PostgreSQL are connected!"
        })

    except Exception:
        app.logger.exception("Database health check failed")

        return jsonify({
            "status": "error",
            "message": "Database connection failed"
        }), 500


# Start Flask Server
if __name__ == "__main__":
    app.run(debug=True)