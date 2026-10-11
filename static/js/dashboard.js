document.addEventListener("DOMContentLoaded", loadDashboard);
document.addEventListener("DOMContentLoaded", loadRecentActivities);


async function loadDashboard() {
    try {
        const response = await fetch("/api/dashboard/summary");
        const result = await response.json();

        if (result.status !== "success") {
            console.error("Dashboard data load failed");
            return;
        }

        document.getElementById("total-contacts").textContent =
            result.data.total_contacts;

        document.getElementById("total-companies").textContent =
            result.data.total_companies;

        document.getElementById("total-deals").textContent =
            result.data.total_deals;

        document.getElementById("pipeline-value").textContent =
            "₹" + result.data.pipeline_value.toLocaleString("en-IN");

    } catch (error) {
        console.error("Error loading dashboard:", error);
    }
}
async function loadRecentActivities() {
    try {
        const response = await fetch("/api/dashboard/recent-activities");
        const result = await response.json();

        const activitiesList = document.getElementById("activities-list");

        if (result.status !== "success" || result.data.length === 0) {
            activitiesList.innerHTML = "<p>No recent activities found.</p>";
            return;
        }

        activitiesList.innerHTML = "";

        result.data.forEach(activity => {
            const item = document.createElement("div");

            item.style.padding = "12px 0";
            item.style.borderBottom = "1px solid #eee";

            item.innerHTML = `
                <strong>${activity.activity_type.toUpperCase()}</strong>
                - ${activity.subject || "No subject"}
                <br>
                <small>
                    ${activity.contact_name || "Unknown contact"}
                    | ${activity.user_name || "Unknown user"}
                </small>
            `;

            activitiesList.appendChild(item);
        });

    } catch (error) {
        console.error("Error loading recent activities:", error);
    }
}