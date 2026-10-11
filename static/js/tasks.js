document.addEventListener("DOMContentLoaded", () => {

    loadTasks();

    const taskForm =
        document.getElementById("task-form");

    taskForm.addEventListener(
        "submit",
        createTask
    );

});


async function loadTasks() {

    try {

        const response =
            await fetch("/api/tasks");

        const result =
            await response.json();

        const tableBody =
            document.getElementById(
                "tasks-table-body"
            );

        if (result.status !== "success") {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="8">
                        Failed to load tasks.
                    </td>
                </tr>
            `;

            return;
        }


        if (result.data.length === 0) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="8">
                        No tasks found.
                    </td>
                </tr>
            `;

            return;
        }


        tableBody.innerHTML = "";


        result.data.forEach(task => {

            const row =
                document.createElement("tr");


            const dueDate =
                task.due_date
                    ? new Date(
                        task.due_date
                    ).toLocaleString("en-IN")
                    : "-";


            row.innerHTML = `

                <td>
                    ${task.title || "-"}
                </td>

                <td class="description">
                    ${task.description || "-"}
                </td>

                <td>
                    ${task.contact_name || "-"}
                </td>

                <td>
                    ${task.deal_title || "-"}
                </td>

                <td>
                    ${dueDate}
                </td>

                <td>
                    <span class="status">
                        ${task.status || "-"}
                    </span>
                </td>

                <td>
                    ${task.assigned_to || "-"}
                </td>

                <td>

                    ${
                        task.status !== "completed"
                        ? `
                            <button
                                class="action-button complete-button"
                                onclick="completeTask(${task.id})"
                            >
                                Complete
                            </button>
                        `
                        : ""
                    }

                    <button
                        class="action-button edit-button"
                        onclick="editTask(${task.id})"
                    >
                        Edit
                    </button>

                    <button
                        class="action-button delete-button"
                        onclick="deleteTask(${task.id})"
                    >
                        Delete
                    </button>

                </td>
            `;


            tableBody.appendChild(row);

        });


    } catch (error) {

        console.error(
            "Error loading tasks:",
            error
        );

        document.getElementById(
            "tasks-table-body"
        ).innerHTML = `
            <tr>
                <td colspan="8">
                    Error loading tasks.
                </td>
            </tr>
        `;
    }
}



async function createTask(event) {

    event.preventDefault();


    const message =
        document.getElementById(
            "task-message"
        );


    const taskData = {

        title:
            document.getElementById(
                "title"
            ).value,

        description:
            document.getElementById(
                "description"
            ).value,

        contact_id:
            document.getElementById(
                "contact-id"
            ).value || null,

        deal_id:
            document.getElementById(
                "deal-id"
            ).value || null,

        assigned_to:
            document.getElementById(
                "assigned-to"
            ).value || null,

        due_date:
            document.getElementById(
                "due-date"
            ).value,

        status:
            document.getElementById(
                "status"
            ).value
    };


    try {

        const response =
            await fetch(
                "/api/tasks",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            taskData
                        )
                }
            );


        const result =
            await response.json();


        if (result.status === "success") {

            message.textContent =
                "Task added successfully!";

            message.style.color =
                "green";


            document
                .getElementById(
                    "task-form"
                )
                .reset();


            await loadTasks();

        } else {

            message.textContent =
                result.message ||
                "Failed to add task.";

            message.style.color =
                "red";
        }


    } catch (error) {

        console.error(
            "Error creating task:",
            error
        );

        message.textContent =
            "Something went wrong.";

        message.style.color =
            "red";
    }
}



async function completeTask(taskId) {

    const confirmed = confirm(
        "Mark this task as completed?"
    );

    if (!confirmed) {
        return;
    }

    try {

        const response = await fetch("/api/tasks");
        const result = await response.json();

        if (result.status !== "success") {
            alert("Failed to load task.");
            return;
        }

        const task = result.data.find(
            item => item.id === taskId
        );

        if (!task) {
            alert("Task not found.");
            return;
        }

        const updateResponse = await fetch(
            `/api/tasks/${taskId}`,
            {
                method: "PUT",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    title: task.title,
                    description: task.description || "",
                    contact_id: task.contact_id || null,
                    deal_id: task.deal_id || null,
                    assigned_to: task.assigned_to_id || null,
                    due_date: task.due_date,
                    status: "completed"
                })
            }
        );

        const updateResult =
            await updateResponse.json();

        if (updateResult.status === "success") {

            alert("Task marked as completed!");

            await loadTasks();

        } else {

            alert(
                updateResult.message ||
                "Failed to complete task."
            );
        }

    } catch (error) {

        console.error(
            "Error completing task:",
            error
        );

        alert(
            "Something went wrong while completing the task."
        );
    }
}

async function editTask(
    taskId,
    completeOnly = false
) {

    const title =
        prompt(
            "Enter task title:"
        );


    if (!title) {
        return;
    }


    const description =
        prompt(
            "Enter description:"
        );


    const contactId =
        prompt(
            "Enter contact ID:"
        );


    const dealId =
        prompt(
            "Enter deal ID:"
        );


    const assignedTo =
        prompt(
            "Enter assigned user ID:"
        );


    const dueDate =
        prompt(
            "Enter due date (YYYY-MM-DD HH:MM:SS):"
        );


    let status;

    if (completeOnly) {

        status = "completed";

    } else {

        status =
            prompt(
                "Enter status (pending/completed):"
            );

        if (
            status !== "pending" &&
            status !== "completed"
        ) {

            alert(
                "Invalid status."
            );

            return;
        }
    }


    const taskData = {

        title:
            title,

        description:
            description || "",

        contact_id:
            contactId || null,

        deal_id:
            dealId || null,

        assigned_to:
            assignedTo || null,

        due_date:
            dueDate,

        status:
            status
    };


    try {

        const response =
            await fetch(
                `/api/tasks/${taskId}`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            taskData
                        )
                }
            );


        const result =
            await response.json();


        if (result.status === "success") {

            alert(
                "Task updated successfully!"
            );

            await loadTasks();

        } else {

            alert(
                result.message ||
                "Failed to update task."
            );
        }


    } catch (error) {

        console.error(
            "Error updating task:",
            error
        );

        alert(
            "Something went wrong while updating."
        );
    }
}



async function deleteTask(taskId) {

    const confirmed =
        confirm(
            "Are you sure you want to delete this task?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                `/api/tasks/${taskId}`,
                {
                    method: "DELETE"
                }
            );


        const result =
            await response.json();


        if (result.status === "success") {

            alert(
                "Task deleted successfully!"
            );

            await loadTasks();

        } else {

            alert(
                result.message ||
                "Failed to delete task."
            );
        }


    } catch (error) {

        console.error(
            "Error deleting task:",
            error
        );

        alert(
            "Something went wrong while deleting."
        );
    }
}