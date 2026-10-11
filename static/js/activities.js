document.addEventListener("DOMContentLoaded", () => {

    loadActivities();

    const activityForm =
        document.getElementById("activity-form");

    activityForm.addEventListener(
        "submit",
        createActivity
    );

});


/* =====================================================
   LOAD ACTIVITIES
   ===================================================== */

async function loadActivities() {

    try {

        const response =
            await fetch("/api/activities");

        const result =
            await response.json();

        const tableBody =
            document.getElementById(
                "activities-table-body"
            );


        if (result.status !== "success") {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="8">
                        Failed to load activities.
                    </td>
                </tr>
            `;

            return;
        }


        if (result.data.length === 0) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="8">
                        No activities found.
                    </td>
                </tr>
            `;

            return;
        }


        tableBody.innerHTML = "";


        result.data.forEach(activity => {

            const row =
                document.createElement("tr");


            row.innerHTML = `

                <td>
                    <span class="activity-type">
                        ${activity.activity_type || "-"}
                    </span>
                </td>

                <td>
                    ${activity.subject || "-"}
                </td>

                <td>
                    ${activity.contact_name || "-"}
                </td>

                <td>
                    ${activity.deal_title || "-"}
                </td>

                <td class="description">
                    ${activity.description || "-"}
                </td>

                <td>
                    ${
                        activity.activity_date
                            ? formatDate(
                                activity.activity_date
                            )
                            : "-"
                    }
                </td>

                <td>
                    ${activity.user_name || "-"}
                </td>

                <td>

                    <button
                        class="action-button edit-button"
                        onclick="editActivity(${activity.id})">
                        Edit
                    </button>

                    <button
                        class="action-button delete-button"
                        onclick="deleteActivity(${activity.id})">
                        Delete
                    </button>

                </td>
            `;


            tableBody.appendChild(row);

        });

    } catch (error) {

        console.error(
            "Error loading activities:",
            error
        );

        document.getElementById(
            "activities-table-body"
        ).innerHTML = `
            <tr>
                <td colspan="8">
                    Error loading activities.
                </td>
            </tr>
        `;
    }
}


/* =====================================================
   FORMAT DATE
   ===================================================== */

function formatDate(dateValue) {

    const date =
        new Date(dateValue);

    return date.toLocaleString(
        "en-IN",
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    );
}


/* =====================================================
   CREATE ACTIVITY
   ===================================================== */

async function createActivity(event) {

    event.preventDefault();


    const message =
        document.getElementById(
            "activity-message"
        );


    const activityData = {

        activity_type:
            document.getElementById(
                "activity-type"
            ).value,

        subject:
            document.getElementById(
                "subject"
            ).value,

        contact_id:
            document.getElementById(
                "contact-id"
            ).value || null,

        deal_id:
            document.getElementById(
                "deal-id"
            ).value || null,

        user_id:
            document.getElementById(
                "user-id"
            ).value || null,

        description:
            document.getElementById(
                "description"
            ).value,

        activity_date:
            document.getElementById(
                "activity-date"
            ).value || null
    };


    try {

        const response =
            await fetch(
                "/api/activities",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            activityData
                        )
                }
            );


        const result =
            await response.json();


        if (result.status === "success") {

            message.textContent =
                "Activity added successfully!";

            message.style.color =
                "green";


            document
                .getElementById(
                    "activity-form"
                )
                .reset();


            await loadActivities();

        } else {

            message.textContent =
                result.message ||
                "Failed to add activity.";

            message.style.color =
                "red";
        }

    } catch (error) {

        console.error(
            "Error creating activity:",
            error
        );

        message.textContent =
            "Something went wrong.";

        message.style.color =
            "red";
    }
}


/* =====================================================
   EDIT ACTIVITY
   ===================================================== */

async function editActivity(activityId) {

    const activityType =
        prompt(
            "Enter type (call/email/meeting/note):"
        );

    if (!activityType) {
        return;
    }


    const subject =
        prompt("Enter subject:");


    const contactId =
        prompt("Enter contact ID:");


    const dealId =
        prompt("Enter deal ID:");


    const userId =
        prompt("Enter user ID:");


    const description =
        prompt("Enter description:");


    const activityDate =
        prompt(
            "Enter date (YYYY-MM-DD HH:MM:SS):"
        );


    const activityData = {

        activity_type:
            activityType,

        subject:
            subject || "",

        contact_id:
            contactId || null,

        deal_id:
            dealId || null,

        user_id:
            userId || null,

        description:
            description || "",

        activity_date:
            activityDate || null
    };


    try {

        const response =
            await fetch(
                `/api/activities/${activityId}`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            activityData
                        )
                }
            );


        const result =
            await response.json();


        if (result.status === "success") {

            alert(
                "Activity updated successfully!"
            );

            await loadActivities();

        } else {

            alert(
                result.message ||
                "Failed to update activity."
            );
        }

    } catch (error) {

        console.error(
            "Error updating activity:",
            error
        );

        alert(
            "Something went wrong while updating."
        );
    }
}


/* =====================================================
   DELETE ACTIVITY
   ===================================================== */

async function deleteActivity(activityId) {

    const confirmed =
        confirm(
            "Are you sure you want to delete this activity?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                `/api/activities/${activityId}`,
                {
                    method: "DELETE"
                }
            );


        const result =
            await response.json();


        if (result.status === "success") {

            alert(
                "Activity deleted successfully!"
            );

            await loadActivities();

        } else {

            alert(
                result.message ||
                "Failed to delete activity."
            );
        }

    } catch (error) {

        console.error(
            "Error deleting activity:",
            error
        );

        alert(
            "Something went wrong while deleting."
        );
    }
}