document.addEventListener("DOMContentLoaded", () => {

    loadDeals();

    const dealForm =
        document.getElementById("deal-form");

    dealForm.addEventListener(
        "submit",
        createDeal
    );

});


/* =====================================================
   LOAD DEALS
   ===================================================== */

async function loadDeals() {

    try {

        const response =
            await fetch("/api/deals");

        const result =
            await response.json();

        const tableBody =
            document.getElementById(
                "deals-table-body"
            );


        if (result.status !== "success") {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="8">
                        Failed to load deals.
                    </td>
                </tr>
            `;

            return;
        }


        if (result.data.length === 0) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="8">
                        No deals found.
                    </td>
                </tr>
            `;

            return;
        }


        tableBody.innerHTML = "";


        result.data.forEach(deal => {

            const row =
                document.createElement("tr");


            row.innerHTML = `

                <td>
                    ${deal.title || "-"}
                </td>

                <td>
                    ${deal.contact_name || "-"}
                </td>

                <td>
                    ${deal.company_name || "-"}
                </td>

                <td>
                    <span class="stage">
                        ${formatStage(deal.stage)}
                    </span>
                </td>

                <td class="value">
                    ₹${Number(
                        deal.deal_value || 0
                    ).toLocaleString("en-IN")}
                </td>

                <td>
                    ${deal.expected_close_date || "-"}
                </td>

                <td>
                    ${deal.assigned_to || "-"}
                </td>

                <td>

                    <button
                        class="action-button edit-button"
                        onclick="editDeal(${deal.id})">
                        Edit
                    </button>

                    <button
                        class="action-button delete-button"
                        onclick="deleteDeal(${deal.id})">
                        Delete
                    </button>

                </td>
            `;


            tableBody.appendChild(row);

        });

    } catch (error) {

        console.error(
            "Error loading deals:",
            error
        );

        document.getElementById(
            "deals-table-body"
        ).innerHTML = `
            <tr>
                <td colspan="8">
                    Error loading deals.
                </td>
            </tr>
        `;
    }
}


/* =====================================================
   FORMAT STAGE
   ===================================================== */

function formatStage(stage) {

    if (!stage) {
        return "-";
    }


    return stage
        .replace("_", " ")
        .replace(/\b\w/g, letter =>
            letter.toUpperCase()
        );
}


/* =====================================================
   CREATE DEAL
   ===================================================== */

async function createDeal(event) {

    event.preventDefault();


    const message =
        document.getElementById(
            "deal-message"
        );


    const dealData = {

        title:
            document.getElementById(
                "deal-title"
            ).value,

        contact_id:
            document.getElementById(
                "contact-id"
            ).value,

        assigned_to:
            document.getElementById(
                "assigned-to"
            ).value || null,

        stage:
            document.getElementById(
                "stage"
            ).value,

        deal_value:
            document.getElementById(
                "deal-value"
            ).value || 0,

        expected_close_date:
            document.getElementById(
                "expected-close-date"
            ).value || null
    };


    try {

        const response =
            await fetch(
                "/api/deals",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            dealData
                        )
                }
            );


        const result =
            await response.json();


        if (result.status === "success") {

            message.textContent =
                "Deal added successfully!";

            message.style.color =
                "green";


            document
                .getElementById("deal-form")
                .reset();


            await loadDeals();

        } else {

            message.textContent =
                result.message ||
                "Failed to add deal.";

            message.style.color =
                "red";
        }

    } catch (error) {

        console.error(
            "Error creating deal:",
            error
        );

        message.textContent =
            "Something went wrong.";

        message.style.color =
            "red";
    }
}


/* =====================================================
   EDIT DEAL
   ===================================================== */

async function editDeal(dealId) {

    const title =
        prompt("Enter deal title:");

    if (!title) {
        return;
    }


    const contactId =
        prompt("Enter contact ID:");


    const assignedTo =
        prompt("Enter assigned user ID:");


    const stage =
        prompt(
            "Enter stage (new/contacted/qualified/proposal_sent/won/lost):"
        );


    const dealValue =
        prompt("Enter deal value:");


    const expectedCloseDate =
        prompt(
            "Enter expected close date (YYYY-MM-DD):"
        );


    const dealData = {

        title: title,

        contact_id:
            contactId || null,

        assigned_to:
            assignedTo || null,

        stage:
            stage || "new",

        deal_value:
            dealValue || 0,

        expected_close_date:
            expectedCloseDate || null
    };


    try {

        const response =
            await fetch(
                `/api/deals/${dealId}`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            dealData
                        )
                }
            );


        const result =
            await response.json();


        if (result.status === "success") {

            alert(
                "Deal updated successfully!"
            );

            await loadDeals();

        } else {

            alert(
                result.message ||
                "Failed to update deal."
            );
        }

    } catch (error) {

        console.error(
            "Error updating deal:",
            error
        );

        alert(
            "Something went wrong while updating."
        );
    }
}


/* =====================================================
   DELETE DEAL
   ===================================================== */

async function deleteDeal(dealId) {

    const confirmed =
        confirm(
            "Are you sure you want to delete this deal?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                `/api/deals/${dealId}`,
                {
                    method: "DELETE"
                }
            );


        const result =
            await response.json();


        if (result.status === "success") {

            alert(
                "Deal deleted successfully!"
            );

            await loadDeals();

        } else {

            alert(
                result.message ||
                "Failed to delete deal."
            );
        }

    } catch (error) {

        console.error(
            "Error deleting deal:",
            error
        );

        alert(
            "Something went wrong while deleting."
        );
    }
}