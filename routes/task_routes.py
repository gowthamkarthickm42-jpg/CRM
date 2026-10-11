from flask import Blueprint, jsonify, request
from database.connection import get_db_connection


task_bp = Blueprint(
    "task",
    __name__,
    url_prefix="/api/tasks"
)


# GET ALL TASKS
@task_bp.route("", methods=["GET"])
def get_tasks():

    connection = get_db_connection()
    cursor = connection.cursor()

    cursor.execute("""
        SELECT
            t.id,
            t.title,
            t.description,
            t.due_date,
            t.status,
            t.completed_at,

            t.contact_id,
            t.deal_id,
            t.assigned_to,

            c.first_name,
            c.last_name,

            d.title AS deal_title,

            u.full_name AS assigned_to_name

        FROM tasks t

        LEFT JOIN contacts c
            ON t.contact_id = c.id

        LEFT JOIN deals d
            ON t.deal_id = d.id

        LEFT JOIN users u
            ON t.assigned_to = u.id

        ORDER BY t.due_date ASC
    """)

    tasks = cursor.fetchall()

    cursor.close()
    connection.close()

    task_list = []

    for task in tasks:

        task_list.append({

            "id": task[0],

            "title": task[1],

            "description": task[2],

            "due_date": (
                task[3].isoformat()
                if task[3]
                else None
            ),

            "status": task[4],

            "completed_at": (
                task[5].isoformat()
                if task[5]
                else None
            ),

            # IDs needed for Edit / Complete
            "contact_id": task[6],

            "deal_id": task[7],

            "assigned_to_id": task[8],

            # Display information
            "contact_name": (
                f"{task[9]} {task[10] or ''}"
            ).strip(),

            "deal_title": task[11],

            "assigned_to": task[12]
        })

    return jsonify({
        "status": "success",
        "data": task_list
    })


# CREATE TASK
@task_bp.route("", methods=["POST"])
def create_task():

    data = request.get_json()

    title = data.get("title")
    description = data.get("description")
    contact_id = data.get("contact_id")
    deal_id = data.get("deal_id")
    assigned_to = data.get("assigned_to")
    due_date = data.get("due_date")
    status = data.get("status", "pending")

    if not title:
        return jsonify({
            "status": "error",
            "message": "Task title is required"
        }), 400

    if not due_date:
        return jsonify({
            "status": "error",
            "message": "Due date is required"
        }), 400

    if status not in ["pending", "completed"]:
        return jsonify({
            "status": "error",
            "message": "Invalid task status"
        }), 400

    connection = get_db_connection()
    cursor = connection.cursor()

    if status == "completed":

        cursor.execute("""
            INSERT INTO tasks
            (
                contact_id,
                deal_id,
                assigned_to,
                title,
                description,
                due_date,
                status,
                completed_at
            )
            VALUES
            (
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                CURRENT_TIMESTAMP
            )
            RETURNING id
        """, (
            contact_id or None,
            deal_id or None,
            assigned_to or None,
            title,
            description,
            due_date,
            status
        ))

    else:

        cursor.execute("""
            INSERT INTO tasks
            (
                contact_id,
                deal_id,
                assigned_to,
                title,
                description,
                due_date,
                status
            )
            VALUES
            (
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s
            )
            RETURNING id
        """, (
            contact_id or None,
            deal_id or None,
            assigned_to or None,
            title,
            description,
            due_date,
            status
        ))

    task_id = cursor.fetchone()[0]

    connection.commit()

    cursor.close()
    connection.close()

    return jsonify({
        "status": "success",
        "message": "Task created successfully",
        "task_id": task_id
    }), 201


# UPDATE TASK
@task_bp.route("/<int:task_id>", methods=["PUT"])
def update_task(task_id):

    data = request.get_json()

    title = data.get("title")
    description = data.get("description")
    contact_id = data.get("contact_id")
    deal_id = data.get("deal_id")
    assigned_to = data.get("assigned_to")
    due_date = data.get("due_date")
    status = data.get("status", "pending")

    if not title:
        return jsonify({
            "status": "error",
            "message": "Task title is required"
        }), 400

    if not due_date:
        return jsonify({
            "status": "error",
            "message": "Due date is required"
        }), 400

    if status not in ["pending", "completed"]:
        return jsonify({
            "status": "error",
            "message": "Invalid task status"
        }), 400

    connection = get_db_connection()
    cursor = connection.cursor()

    if status == "completed":

        cursor.execute("""
            UPDATE tasks

            SET
                contact_id = %s,
                deal_id = %s,
                assigned_to = %s,
                title = %s,
                description = %s,
                due_date = %s,
                status = %s,
                completed_at = CURRENT_TIMESTAMP

            WHERE id = %s

            RETURNING id
        """, (
            contact_id or None,
            deal_id or None,
            assigned_to or None,
            title,
            description,
            due_date,
            status,
            task_id
        ))

    else:

        cursor.execute("""
            UPDATE tasks

            SET
                contact_id = %s,
                deal_id = %s,
                assigned_to = %s,
                title = %s,
                description = %s,
                due_date = %s,
                status = %s,
                completed_at = NULL

            WHERE id = %s

            RETURNING id
        """, (
            contact_id or None,
            deal_id or None,
            assigned_to or None,
            title,
            description,
            due_date,
            status,
            task_id
        ))

    updated_task = cursor.fetchone()

    if not updated_task:

        cursor.close()
        connection.close()

        return jsonify({
            "status": "error",
            "message": "Task not found"
        }), 404

    connection.commit()

    cursor.close()
    connection.close()

    return jsonify({
        "status": "success",
        "message": "Task updated successfully",
        "task_id": task_id
    })


# DELETE TASK
@task_bp.route("/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):

    connection = get_db_connection()
    cursor = connection.cursor()

    cursor.execute("""
        DELETE FROM tasks
        WHERE id = %s
        RETURNING id
    """, (task_id,))

    deleted_task = cursor.fetchone()

    if not deleted_task:

        cursor.close()
        connection.close()

        return jsonify({
            "status": "error",
            "message": "Task not found"
        }), 404

    connection.commit()

    cursor.close()
    connection.close()

    return jsonify({
        "status": "success",
        "message": "Task deleted successfully",
        "task_id": task_id
    })