document.addEventListener("DOMContentLoaded", () => {
    loadCompanies();

    const companyForm = document.getElementById("company-form");

    companyForm.addEventListener("submit", createCompany);
});


async function loadCompanies() {

    try {

        const response = await fetch("/api/companies");
        const result = await response.json();

        const tableBody =
            document.getElementById("companies-table-body");


        if (result.status !== "success") {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="8">
                        Failed to load companies.
                    </td>
                </tr>
            `;

            return;
        }


        if (result.data.length === 0) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="8">
                        No companies found.
                    </td>
                </tr>
            `;

            return;
        }


        tableBody.innerHTML = "";


        result.data.forEach(company => {

            const row = document.createElement("tr");


            row.innerHTML = `

                <td>
                    ${company.company_name || "-"}
                </td>

                <td>
                    ${company.industry || "-"}
                </td>

                <td>
                    ${
                        company.website
                            ? `<a
                                class="website"
                                href="${company.website}"
                                target="_blank">
                                Visit
                               </a>`
                            : "-"
                    }
                </td>

                <td>
                    ${company.phone || "-"}
                </td>

                <td>
                    ${company.email || "-"}
                </td>

                <td>
                    ${company.address || "-"}
                </td>

                <td>
                    <span class="contact-count">
                        ${company.contact_count}
                    </span>
                </td>

                <td>

                    <button
                        class="action-button edit-button"
                        onclick="editCompany(${company.id})">
                        Edit
                    </button>

                    <button
                        class="action-button delete-button"
                        onclick="deleteCompany(${company.id})">
                        Delete
                    </button>

                </td>
            `;


            tableBody.appendChild(row);

        });

    } catch (error) {

        console.error(
            "Error loading companies:",
            error
        );

        document.getElementById(
            "companies-table-body"
        ).innerHTML = `
            <tr>
                <td colspan="8">
                    Error loading companies.
                </td>
            </tr>
        `;
    }
}


/* =====================================================
   CREATE COMPANY
   ===================================================== */

async function createCompany(event) {

    event.preventDefault();

    const message =
        document.getElementById("company-message");


    const companyData = {

        company_name:
            document.getElementById("company-name").value,

        industry:
            document.getElementById("industry").value,

        website:
            document.getElementById("website").value,

        phone:
            document.getElementById("phone").value,

        email:
            document.getElementById("email").value,

        address:
            document.getElementById("address").value
    };


    try {

        const response = await fetch(
            "/api/companies",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(companyData)
            }
        );


        const result = await response.json();


        if (result.status === "success") {

            message.textContent =
                "Company added successfully!";

            message.style.color = "green";


            document
                .getElementById("company-form")
                .reset();


            await loadCompanies();

        } else {

            message.textContent =
                result.message ||
                "Failed to add company.";

            message.style.color = "red";
        }

    } catch (error) {

        console.error(
            "Error creating company:",
            error
        );

        message.textContent =
            "Something went wrong.";

        message.style.color = "red";
    }
}


/* =====================================================
   EDIT COMPANY
   ===================================================== */

async function editCompany(companyId) {

    const companyName =
        prompt("Enter company name:");

    if (!companyName) {
        return;
    }


    const industry =
        prompt("Enter industry:");


    const website =
        prompt("Enter website:");


    const phone =
        prompt("Enter phone:");


    const email =
        prompt("Enter email:");


    const address =
        prompt("Enter address:");


    const companyData = {

        company_name: companyName,

        industry: industry || "",

        website: website || "",

        phone: phone || "",

        email: email || "",

        address: address || ""
    };


    try {

        const response = await fetch(
            `/api/companies/${companyId}`,
            {
                method: "PUT",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(companyData)
            }
        );


        const result = await response.json();


        if (result.status === "success") {

            alert(
                "Company updated successfully!"
            );

            await loadCompanies();

        } else {

            alert(
                result.message ||
                "Failed to update company."
            );
        }

    } catch (error) {

        console.error(
            "Error updating company:",
            error
        );

        alert(
            "Something went wrong while updating."
        );
    }
}


/* =====================================================
   DELETE COMPANY
   ===================================================== */

async function deleteCompany(companyId) {

    const confirmed = confirm(
        "Are you sure you want to delete this company?"
    );


    if (!confirmed) {
        return;
    }


    try {

        const response = await fetch(
            `/api/companies/${companyId}`,
            {
                method: "DELETE"
            }
        );


        const result = await response.json();


        if (result.status === "success") {

            alert(
                "Company deleted successfully!"
            );

            await loadCompanies();

        } else {

            alert(
                result.message ||
                "Failed to delete company."
            );
        }

    } catch (error) {

        console.error(
            "Error deleting company:",
            error
        );

        alert(
            "Something went wrong while deleting."
        );
    }
}