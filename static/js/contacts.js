
document.addEventListener("DOMContentLoaded", () => {
    loadContacts();

    const contactForm = document.getElementById("contact-form");

    if (contactForm) {
        contactForm.addEventListener("submit", createContact);
    }
});

/* LOAD CONTACTS */
async function loadContacts() {
    const tableBody = document.getElementById("contacts-table-body");
    if (!tableBody) return;

    try {
        tableBody.innerHTML =
            `<tr><td colspan="8">Loading contacts...</td></tr>`;

        const response = await fetch("/api/contacts");
        const result = await response.json();

        if (!response.ok || result.status !== "success") {
            tableBody.innerHTML =
                `<tr><td colspan="8">Failed to load contacts.</td></tr>`;
            return;
        }

        const contacts = Array.isArray(result.data) ? result.data : [];

        if (contacts.length === 0) {
            tableBody.innerHTML =
                `<tr><td colspan="8">No contacts found.</td></tr>`;
            return;
        }

        tableBody.replaceChildren();

        contacts.forEach(contact => {
            const row = document.createElement("tr");

            const values = [
                `${contact.first_name || ""} ${contact.last_name || ""}`.trim(),
                contact.email || "-",
                contact.phone || "-",
                contact.job_title || "-",
                contact.company_name || "-",
                contact.status || "-",
                contact.assigned_to_name || "-"
            ];

            values.forEach(value => {
                const cell = document.createElement("td");
                cell.textContent = value;
                row.appendChild(cell);
            });

            const actions = document.createElement("td");

            [
                ["View", () => viewContact(contact.id)],
                ["Edit", () => editContact(contact.id)],
                ["Delete", () => deleteContact(contact.id)]
            ].forEach(([label, callback]) => {
                const button = document.createElement("button");
                button.type = "button";
                button.textContent = label;
                button.style.marginRight = "5px";
                button.style.cursor = "pointer";
                button.addEventListener("click", callback);
                actions.appendChild(button);
            });

            row.appendChild(actions);
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error("Error loading contacts:", error);
        tableBody.innerHTML =
            `<tr><td colspan="8">Error loading contacts. Check Flask.</td></tr>`;
    }
}

/* CREATE CONTACT */
async function createContact(event) {
    event.preventDefault();

    const form = document.getElementById("contact-form");
    const message = document.getElementById("form-message");

    const getValue = id =>
        document.getElementById(id)?.value?.trim() || "";

    const contactData = {
        first_name: getValue("first-name"),
        last_name: getValue("last-name"),
        email: getValue("email"),
        phone: getValue("phone"),
        job_title: getValue("job-title"),
        company_id: getValue("company-id") || null,
        assigned_to: getValue("assigned-to") || null,
        status: getValue("status") || "lead"
    };

    if (!contactData.first_name) {
        if (message) {
            message.textContent = "First name is required.";
            message.style.color = "red";
        }
        return;
    }

    try {
        const response = await fetch("/api/contacts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(contactData)
        });

        const result = await response.json();

        if (!response.ok || result.status !== "success") {
            throw new Error(result.message || "Failed to add contact.");
        }

        if (message) {
            message.textContent = "Contact added successfully!";
            message.style.color = "green";
        }

        if (form) form.reset();

        await loadContacts();
    } catch (error) {
        console.error("Error creating contact:", error);

        if (message) {
            message.textContent = error.message || "Something went wrong.";
            message.style.color = "red";
        }
    }
}

/* VIEW CONTACT */
async function viewContact(contactId) {
    try {
        const response = await fetch(`/api/contacts/${contactId}`);
        const result = await response.json();

        if (!response.ok || result.status !== "success") {
            alert(result.message || "Failed to load contact.");
            return;
        }

        const contact = result.data;
        if (!contact) {
            alert("Contact details not found.");
            return;
        }

        let modal = document.getElementById("contact-view-modal");

        if (!modal) {
            modal = document.createElement("div");
            modal.id = "contact-view-modal";

            const overlay = document.createElement("div");
            overlay.className = "contact-modal-overlay";

            const content = document.createElement("div");
            content.className = "contact-modal";

            const closeButton = document.createElement("button");
            closeButton.className = "close-modal-button";
            closeButton.type = "button";
            closeButton.textContent = "X";
            closeButton.addEventListener("click", closeContactModal);

            const heading = document.createElement("h2");
            heading.textContent = "Contact Details";

            const details = document.createElement("div");
            details.id = "contact-details";

            const actions = document.createElement("div");
            actions.className = "contact-actions";

            [
                ["Send Email", sendContactEmail],
                ["Send SMS", sendContactSMS],
                ["Log Call", logContactCall],
                ["Schedule Meeting", scheduleContactMeeting],
                ["Add Note", addContactNote]
            ].forEach(([label, callback]) => {
                const button = document.createElement("button");
                button.type = "button";
                button.textContent = label;
                button.addEventListener("click", () => {
                    callback(Number(modal.dataset.contactId));
                });
                actions.appendChild(button);
            });

            const divider = document.createElement("hr");

            const historyHeading = document.createElement("h3");
            historyHeading.textContent = "Activity History";

            const history = document.createElement("div");
            history.id = "contact-activity-history";
            history.textContent = "Loading activity history...";

            content.append(
                closeButton,
                heading,
                details,
                actions,
                divider,
                historyHeading,
                history
            );

            overlay.appendChild(content);
            modal.appendChild(overlay);
            document.body.appendChild(modal);

            addContactModalStyles();
        }

        modal.dataset.contactId = String(contactId);
        modal.style.display = "block";

        const details = document.getElementById("contact-details");
        details.replaceChildren();

        const fields = [
            ["Name", `${contact.first_name || ""} ${contact.last_name || ""}`.trim()],
            ["Email", contact.email || "-"],
            ["Phone", contact.phone || "-"],
            ["Job Title", contact.job_title || "-"],
            ["Company", contact.company_name || "-"],
            ["Status", contact.status || "-"],
            ["Assigned To", contact.assigned_to_name || "-"]
        ];

        fields.forEach(([label, value]) => {
            const paragraph = document.createElement("p");
            const strong = document.createElement("strong");

            strong.textContent = `${label}: `;
            paragraph.append(strong, document.createTextNode(value));
            details.appendChild(paragraph);
        });

        await loadContactActivities(contactId);
    } catch (error) {
        console.error("Error viewing contact:", error);
        alert("Unable to load contact. Check the Flask terminal.");
    }
}

/* LOAD ACTIVITY HISTORY */
async function loadContactActivities(contactId) {
    const history = document.getElementById("contact-activity-history");
    if (!history) return;

    history.textContent = "Loading activity history...";

    try {
        const response = await fetch(
            `/api/activities/contact/${contactId}`
        );

        const result = await response.json();

        if (!response.ok || result.status !== "success") {
            history.textContent =
                result.message || "Failed to load activity history.";
            return;
        }

        const activities = Array.isArray(result.data) ? result.data : [];

        if (activities.length === 0) {
            history.textContent = "No activity history found.";
            return;
        }

        history.replaceChildren();

        activities.forEach(activity => {
            const item = document.createElement("div");
            item.className = "activity-history-item";

            const title = document.createElement("p");
            const strong = document.createElement("strong");

            strong.textContent = activity.activity_type || "Activity";

            title.append(
                strong,
                document.createTextNode(
                    ` - ${activity.subject || "No subject"}`
                )
            );

            const description = document.createElement("p");
            description.textContent = activity.description || "";

            const date = document.createElement("small");
            date.textContent = activity.activity_date
                ? formatDate(activity.activity_date)
                : "";

            const user = document.createElement("small");
            user.textContent = `By: ${activity.user_name || "Unknown"}`;

            item.append(
                title,
                description,
                date,
                document.createElement("br"),
                user
            );

            history.appendChild(item);
        });
    } catch (error) {
        console.error("Error loading activity history:", error);
        history.textContent =
            "Unable to load activity history. Check Flask.";
    }
}

/* FORMAT DATE */
function formatDate(dateValue) {
    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return String(dateValue || "");
    }

    return date.toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short"
    });
}

/* CREATE CONTACT ACTIVITY */
async function createContactActivity(
    contactId,
    activityType,
    subject,
    description,
    activityDate = null
) {
    const userId = prompt(
        "Enter your CRM user ID (1 for admin, 2 for Arun, 3 for Priya):"
    );

    if (!userId || !/^[1-9]\d*$/.test(userId.trim())) {
        alert("Please enter a valid CRM user ID.");
        return false;
    }

    const activityData = {
        contact_id: Number(contactId),
        deal_id: null,
        user_id: Number(userId),
        activity_type: activityType,
        subject: subject.trim(),
        description: description || "",
        activity_date: activityDate
    };

    const response = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(activityData)
    });

    const result = await response.json();

    if (!response.ok || result.status !== "success") {
        alert(result.message || "Failed to save activity.");
        return false;
    }

    alert(
        activityType === "meeting"
            ? "Meeting scheduled successfully!"
            : activityType === "call"
                ? "Call logged successfully!"
                : "Note added successfully!"
    );

    await loadContactActivities(contactId);
    return true;
}

/* LOG CALL */
async function logContactCall(contactId) {
    const subject = prompt("Enter call subject:");
    if (!subject || !subject.trim()) return;

    const description = prompt("Enter call notes:") || "";

    try {
        await createContactActivity(
            contactId,
            "call",
            subject,
            description,
            new Date().toISOString()
        );
    } catch (error) {
        console.error("Error logging call:", error);
        alert("Something went wrong while logging the call.");
    }
}

/* ADD NOTE */
async function addContactNote(contactId) {
    const subject = prompt("Enter note subject:");
    if (!subject || !subject.trim()) return;

    const description = prompt("Enter your note:");
    if (!description || !description.trim()) return;

    try {
        await createContactActivity(
            contactId,
            "note",
            subject,
            description,
            new Date().toISOString()
        );
    } catch (error) {
        console.error("Error adding note:", error);
        alert("Something went wrong while adding the note.");
    }
}

/* SEND EMAIL */
async function sendContactEmail(contactId) {
    try {
        const contactResponse = await fetch(
            `/api/contacts/${contactId}`
        );

        const contactResult = await contactResponse.json();

        if (
            !contactResponse.ok ||
            contactResult.status !== "success"
        ) {
            alert("Unable to load contact details.");
            return;
        }

        const contact = contactResult.data;

        if (!contact.email) {
            alert("This contact has no email address.");
            return;
        }

        const subject = prompt("Enter email subject:");
        if (!subject || !subject.trim()) return;

        const message = prompt("Enter your email message:");
        if (!message || !message.trim()) return;

        const userId = prompt(
            "Enter your CRM user ID (1 for admin, 2 for Arun, 3 for Priya):"
        );

        if (!userId || !/^[1-9]\d*$/.test(userId.trim())) {
            alert("Please enter a valid CRM user ID.");
            return;
        }

        const response = await fetch("/api/email/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contact_id: Number(contactId),
                user_id: Number(userId),
                to_email: contact.email,
                subject: subject.trim(),
                message: message.trim()
            })
        });

        const result = await response.json();

        if (response.ok && result.status === "success") {
            alert("Email sent successfully!");
            await loadContactActivities(contactId);
        } else {
            alert(result.message || "Unable to send email.");
        }
    } catch (error) {
        console.error("Error sending email:", error);
        alert("Something went wrong. Check the Flask terminal.");
    }
}

/* SEND SMS - DEMO ONLY */
async function sendContactSMS(contactId) {
    try {
        // 1. Get contact details
        const contactResponse = await fetch(`/api/contacts/${contactId}`);
        const contactResult = await contactResponse.json();

        if (!contactResponse.ok || contactResult.status !== "success") {
            alert(contactResult.message || "Unable to load contact details.");
            return;
        }

        const contact = contactResult.data;

        if (!contact.phone || !String(contact.phone).trim()) {
            alert("This contact has no phone number.");
            return;
        }

        // 2. Get demo message
        const message = prompt(
            `SMS DEMO for ${contact.first_name || ""} ${contact.last_name || ""}\n` +
            `Phone: ${contact.phone}\n\nEnter your message:`
        );

        if (!message || !message.trim()) {
            return;
        }

        // 3. Get CRM user ID
        const userId = prompt(
            "Enter CRM user ID (1 for admin, 2 for Arun, 3 for Priya):"
        );

        if (!userId || !/^[1-9]\d*$/.test(userId.trim())) {
            alert("Please enter a valid CRM user ID.");
            return;
        }

        // 4. Save the demo message as an activity note
        const activityData = {
            contact_id: Number(contactId),
            deal_id: null,
            user_id: Number(userId),
            activity_type: "note",
            subject: "SMS Demo (NOT SENT)",
            description:
                `DEMO ONLY - NO SMS WAS SENT.\n` +
                `Phone: ${contact.phone}\n` +
                `Message: ${message.trim()}`,
            activity_date: new Date().toISOString()
        };

        const response = await fetch("/api/activities", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(activityData)
        });

        const result = await response.json();

        if (!response.ok || result.status !== "success") {
            console.error("SMS demo save failed:", result);
            alert(result.message || "Failed to save demo message.");
            return;
        }

        // 5. Refresh Activity History
        await loadContactActivities(contactId);

        alert("Demo message saved in Activity History! No real SMS was sent.");

    } catch (error) {
        console.error("Error saving SMS demo:", error);
        alert("Could not save the demo message. Check the Flask terminal.");
    }
}


/* SCHEDULE MEETING */
async function scheduleContactMeeting(contactId) {
    const subject = prompt("Enter meeting subject:");
    if (!subject || !subject.trim()) return;

    const meetingDate = prompt(
        "Enter meeting date and time (YYYY-MM-DDTHH:MM):"
    );

    if (!meetingDate || !meetingDate.trim()) return;

    const parsedDate = new Date(meetingDate);

    if (Number.isNaN(parsedDate.getTime())) {
        alert("Invalid date/time. Example: 2026-10-12T15:30");
        return;
    }

    const description = prompt("Enter meeting notes (optional):") || "";

    try {
        await createContactActivity(
            contactId,
            "meeting",
            subject,
            description,
            parsedDate.toISOString()
        );
    } catch (error) {
        console.error("Error scheduling meeting:", error);
        alert("Unable to schedule meeting. Check the Flask terminal.");
    }
}

/* EDIT CONTACT */
async function editContact(contactId) {
    const firstName = prompt("Enter first name:");
    if (!firstName || !firstName.trim()) return;

    const lastName = prompt("Enter last name:") || "";
    const email = prompt("Enter email:") || "";
    const phone = prompt("Enter phone:") || "";
    const jobTitle = prompt("Enter job title:") || "";
    const companyId = prompt("Enter company ID (leave blank for none):");
    const assignedTo = prompt("Enter assigned user ID (leave blank for none):");
    const status = prompt("Enter status (lead/customer):");

    if (status === null) return;

    const contactData = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        job_title: jobTitle.trim(),
        company_id: companyId?.trim() || null,
        assigned_to: assignedTo?.trim() || null,
        status: status.trim() || "lead"
    };

    try {
        const response = await fetch(`/api/contacts/${contactId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(contactData)
        });

        const result = await response.json();

        if (response.ok && result.status === "success") {
            alert("Contact updated successfully!");
            await loadContacts();
        } else {
            alert(result.message || "Failed to update contact.");
        }
    } catch (error) {
        console.error("Error updating contact:", error);
        alert("Something went wrong while updating.");
    }
}

/* DELETE CONTACT */
async function deleteContact(contactId) {
    if (!confirm("Are you sure you want to delete this contact?")) {
        return;
    }

    try {
        const response = await fetch(`/api/contacts/${contactId}`, {
            method: "DELETE"
        });

        const result = await response.json();

        if (response.ok && result.status === "success") {
            alert("Contact deleted successfully!");
            await loadContacts();
        } else {
            alert(result.message || "Failed to delete contact.");
        }
    } catch (error) {
        console.error("Error deleting contact:", error);
        alert("Something went wrong while deleting.");
    }
}

/* CLOSE MODAL */
function closeContactModal() {
    const modal = document.getElementById("contact-view-modal");

    if (modal) {
        modal.style.display = "none";
    }
}

/* MODAL STYLES */
function addContactModalStyles() {
    if (document.getElementById("contact-modal-styles")) return;

    const style = document.createElement("style");
    style.id = "contact-modal-styles";

    style.textContent = `
        #contact-view-modal {
            display: none;
        }

        .contact-modal-overlay {
            position: fixed;
            inset: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.45);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        }

        .contact-modal {
            box-sizing: border-box;
            background: white;
            color: #222;
            width: 800px;
            max-width: 90%;
            max-height: 85vh;
            overflow-y: auto;
            border-radius: 8px;
            padding: 25px;
            position: relative;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
        }

        .contact-modal h2 {
            margin-top: 0;
        }

        .contact-modal h3 {
            margin-top: 20px;
        }

        .close-modal-button {
            float: right;
            border: none;
            background: #eee;
            padding: 7px 10px;
            cursor: pointer;
            border-radius: 4px;
        }

        .contact-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 20px;
        }

        .contact-actions button {
            padding: 9px 13px;
            border: none;
            border-radius: 5px;
            background: #2563eb;
            color: white;
            cursor: pointer;
        }

        .contact-actions button:hover {
            background: #1d4ed8;
        }

        .activity-history-item {
            border: 1px solid #ddd;
            border-radius: 6px;
            padding: 12px;
            margin-bottom: 10px;
            background: #f8f9fa;
        }

        .activity-history-item p {
            margin: 5px 0;
        }

        .activity-history-item small {
            display: inline-block;
            margin-top: 5px;
            color: #666;
        }
    `;

    document.head.appendChild(style);
}