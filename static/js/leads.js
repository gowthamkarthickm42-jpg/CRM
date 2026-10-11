document.addEventListener("DOMContentLoaded", function () {

    loadLeads();
    loadFilterOptions();

    const leadForm =
        document.getElementById("leadForm");

    leadForm.addEventListener("submit", function (event) {

        event.preventDefault();

        addLead();

    });

});


async function loadLeads() {

    try {

        const response =
            await fetch("/api/leads");

        const result =
            await response.json();

        displayLeads(result.data || []);

    } catch (error) {

        console.error(
            "Error loading leads:",
            error
        );

        document.getElementById("leadsTableBody").innerHTML =
            "<tr><td colspan='8'>Something went wrong</td></tr>";

    }

}


function displayLeads(leads) {

    const tableBody =
        document.getElementById("leadsTableBody");

    tableBody.innerHTML = "";

    if (leads.length === 0) {

        tableBody.innerHTML =
            "<tr><td colspan='8'>No leads found</td></tr>";

        return;
    }


    leads.forEach(function (lead) {

        const row =
            document.createElement("tr");

        const fullName =
            `${lead.first_name} ${lead.last_name || ""}`.trim();

        row.innerHTML = `
            <td>${lead.id}</td>

            <td>${fullName}</td>

            <td>${lead.email || "-"}</td>

            <td>${lead.phone || "-"}</td>

            <td>${lead.company_name || "-"}</td>

            <td>${lead.assigned_to_name || "-"}</td>

            <td>
                <select onchange="changeLeadStatus(${lead.id}, this.value)">

                    <option value="lead"
                        ${lead.status === "lead" ? "selected" : ""}>
                        Lead
                    </option>

                    <option value="contacted"
                        ${lead.status === "contacted" ? "selected" : ""}>
                        Contacted
                    </option>

                    <option value="qualified"
                        ${lead.status === "qualified" ? "selected" : ""}>
                        Qualified
                    </option>

                    <option value="proposal_sent"
                        ${lead.status === "proposal_sent" ? "selected" : ""}>
                        Proposal Sent
                    </option>

                    <option value="won"
                        ${lead.status === "won" ? "selected" : ""}>
                        Won
                    </option>

                    <option value="lost"
                        ${lead.status === "lost" ? "selected" : ""}>
                        Lost
                    </option>

                </select>
            </td>

            <td>

                <button onclick="editLead(${lead.id})">
                    Edit
                </button>

                <button onclick="deleteLead(${lead.id})">
                    Delete
                </button>

            </td>
        `;

        tableBody.appendChild(row);

    });

}


async function loadFilterOptions() {

    try {

        // Load companies

        const companyResponse =
            await fetch("/api/companies");

        const companyResult =
            await companyResponse.json();

        const companyFilter =
            document.getElementById("companyFilter");

        if (
            companyFilter &&
            companyResult.status === "success" &&
            companyResult.data
        ) {

            companyResult.data.forEach(function (company) {

                const option =
                    document.createElement("option");

                option.value = company.id;

                option.textContent =
                    company.company_name;

                companyFilter.appendChild(option);

            });

        }


        // Load sales representatives

        const userResponse =
            await fetch("/api/auth/users");

        if (userResponse.ok) {

            const userResult =
                await userResponse.json();

            const salesRepFilter =
                document.getElementById("salesRepFilter");

            if (
                salesRepFilter &&
                userResult.status === "success" &&
                userResult.data
            ) {

                userResult.data
                    .filter(user => user.role === "sales_rep")
                    .forEach(function (user) {

                        const option =
                            document.createElement("option");

                        option.value = user.id;

                        option.textContent =
                            user.full_name;

                        salesRepFilter.appendChild(option);

                    });

            }

        }

    } catch (error) {

        console.error(
            "Error loading filter options:",
            error
        );

    }

}


async function filterLeads() {

    try {

        const search =
            document
                .getElementById("leadSearch")
                .value
                .trim()
                .toLowerCase();

        const companyId =
            document.getElementById(
                "companyFilter"
            ).value;

        const salesRepId =
            document.getElementById(
                "salesRepFilter"
            ).value;

        const status =
            document.getElementById(
                "statusFilter"
            ).value;


        const response =
            await fetch("/api/leads");

        const result =
            await response.json();


        if (result.status !== "success") {

            alert("Failed to load leads.");

            return;
        }


        let filteredLeads =
            result.data;


        // Search by name

        if (search) {

            filteredLeads =
                filteredLeads.filter(function (lead) {

                    const fullName =
                        `${lead.first_name} ${lead.last_name || ""}`
                            .trim()
                            .toLowerCase();

                    return fullName.includes(search);

                });

        }


        // Filter by company

        if (companyId) {

            filteredLeads =
                filteredLeads.filter(function (lead) {

                    return String(lead.company_id) ===
                        String(companyId);

                });

        }


        // Filter by sales representative

        if (salesRepId) {

            filteredLeads =
                filteredLeads.filter(function (lead) {

                    return String(lead.assigned_to) ===
                        String(salesRepId);

                });

        }


        // Filter by status

        if (status) {

            filteredLeads =
                filteredLeads.filter(function (lead) {

                    return lead.status === status;

                });

        }


        displayLeads(filteredLeads);

    } catch (error) {

        console.error(
            "Error filtering leads:",
            error
        );

        alert(
            "Something went wrong while filtering leads."
        );

    }

}


function clearLeadFilters() {

    document.getElementById(
        "leadSearch"
    ).value = "";

    document.getElementById(
        "companyFilter"
    ).value = "";

    document.getElementById(
        "salesRepFilter"
    ).value = "";

    document.getElementById(
        "statusFilter"
    ).value = "";

    loadLeads();

}


async function addLead() {

    const firstName =
        document.getElementById("firstName").value.trim();

    const lastName =
        document.getElementById("lastName").value.trim();

    const email =
        document.getElementById("email").value.trim();

    const phone =
        document.getElementById("phone").value.trim();

    const jobTitle =
        document.getElementById("jobTitle").value.trim();

    const companyId =
        document.getElementById("companyId").value;

    const assignedTo =
        document.getElementById("assignedTo").value;


    if (!firstName) {

        alert("First name is required.");

        return;
    }


    try {

        const response =
            await fetch("/api/leads", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    first_name: firstName,

                    last_name: lastName,

                    email: email,

                    phone: phone,

                    job_title: jobTitle,

                    company_id:
                        companyId
                            ? Number(companyId)
                            : null,

                    assigned_to:
                        assignedTo
                            ? Number(assignedTo)
                            : null

                })

            });


        const result =
            await response.json();


        if (result.status === "success") {

            alert("Lead added successfully!");

            document
                .getElementById("leadForm")
                .reset();

            await loadLeads();

            await loadFilterOptions();

        } else {

            alert(
                result.message ||
                "Failed to add lead."
            );

        }

    } catch (error) {

        console.error(
            "Error adding lead:",
            error
        );

        alert(
            "Something went wrong while adding the lead."
        );

    }

}


/* Change Lead Status */

async function changeLeadStatus(leadId, newStatus) {

    const confirmed =
        confirm(
            `Change lead status to "${newStatus}"?`
        );


    if (!confirmed) {

        await loadLeads();

        return;
    }


    try {

        const response =
            await fetch("/api/leads");

        const result =
            await response.json();


        if (result.status !== "success") {

            alert("Failed to load lead.");

            await loadLeads();

            return;
        }


        const lead =
            result.data.find(
                item => item.id === leadId
            );


        if (!lead) {

            alert("Lead not found.");

            await loadLeads();

            return;
        }


        const updateResponse =
            await fetch(
                `/api/leads/${leadId}`,
                {

                    method: "PUT",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({

                        first_name:
                            lead.first_name,

                        last_name:
                            lead.last_name || "",

                        email:
                            lead.email || "",

                        phone:
                            lead.phone || "",

                        job_title:
                            lead.job_title || "",

                        company_id:
                            lead.company_id || null,

                        assigned_to:
                            lead.assigned_to || null,

                        status:
                            newStatus

                    })

                }
            );


        const updateResult =
            await updateResponse.json();


        if (updateResult.status === "success") {

            alert(
                `Lead status changed to ${newStatus.replace("_", " ")}.`
            );

            await loadLeads();

        } else {

            alert(
                updateResult.message ||
                "Failed to change lead status."
            );

            await loadLeads();

        }

    } catch (error) {

        console.error(
            "Error changing lead status:",
            error
        );

        alert(
            "Something went wrong while changing the lead status."
        );

        await loadLeads();

    }

}


async function editLead(leadId) {

    try {

        const response =
            await fetch("/api/leads");

        const result =
            await response.json();


        if (result.status !== "success") {

            alert("Failed to load lead.");

            return;
        }


        const lead =
            result.data.find(
                item => item.id === leadId
            );


        if (!lead) {

            alert("Lead not found.");

            return;
        }


        const firstName =
            prompt(
                "First Name:",
                lead.first_name || ""
            );

        if (firstName === null) {
            return;
        }


        const lastName =
            prompt(
                "Last Name:",
                lead.last_name || ""
            );

        if (lastName === null) {
            return;
        }


        const email =
            prompt(
                "Email:",
                lead.email || ""
            );

        if (email === null) {
            return;
        }


        const phone =
            prompt(
                "Phone:",
                lead.phone || ""
            );

        if (phone === null) {
            return;
        }


        const jobTitle =
            prompt(
                "Job Title:",
                lead.job_title || ""
            );

        if (jobTitle === null) {
            return;
        }


        const companyId =
            prompt(
                "Company ID:",
                lead.company_id || ""
            );

        if (companyId === null) {
            return;
        }


        const assignedTo =
            prompt(
                "Assigned Sales Rep ID:",
                lead.assigned_to || ""
            );

        if (assignedTo === null) {
            return;
        }


        const responseUpdate =
            await fetch(
                `/api/leads/${leadId}`,
                {

                    method: "PUT",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({

                        first_name:
                            firstName,

                        last_name:
                            lastName,

                        email:
                            email,

                        phone:
                            phone,

                        job_title:
                            jobTitle,

                        company_id:
                            companyId
                                ? Number(companyId)
                                : null,

                        assigned_to:
                            assignedTo
                                ? Number(assignedTo)
                                : null,

                        status:
                            lead.status

                    })

                }
            );


        const updateResult =
            await responseUpdate.json();


        if (updateResult.status === "success") {

            alert("Lead updated successfully!");

            loadLeads();

        } else {

            alert(
                updateResult.message ||
                "Failed to update lead."
            );

        }

    } catch (error) {

        console.error(
            "Error editing lead:",
            error
        );

        alert(
            "Something went wrong while editing the lead."
        );

    }

}


async function deleteLead(leadId) {

    const confirmed =
        confirm(
            "Are you sure you want to delete this lead?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                `/api/leads/${leadId}`,
                {
                    method: "DELETE"
                }
            );


        const result =
            await response.json();


        if (result.status === "success") {

            alert("Lead deleted successfully!");

            loadLeads();

        } else {

            alert(
                result.message ||
                "Failed to delete lead."
            );

        }

    } catch (error) {

        console.error(
            "Error deleting lead:",
            error
        );

        alert(
            "Something went wrong while deleting the lead."
        );

    }

}