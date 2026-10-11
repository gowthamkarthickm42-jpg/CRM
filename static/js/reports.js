document.addEventListener("DOMContentLoaded", function () {
    loadPipelineReport();
    loadWonLostReport();
    loadSalesPerformanceReport();
    loadMonthlyLeadsReport();
});


async function loadPipelineReport() {

    try {

        const response = await fetch("/api/reports/pipeline");
        const result = await response.json();

        const tableBody =
            document.getElementById("pipelineTableBody");

        tableBody.innerHTML = "";

        if (result.status !== "success") {
            tableBody.innerHTML =
                "<tr><td colspan='3'>Failed to load report</td></tr>";
            return;
        }

        result.data.forEach(function (item) {

            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${formatStage(item.stage)}</td>
                <td>${item.deal_count}</td>
                <td>₹${Number(item.total_value).toLocaleString("en-IN")}</td>
            `;

            tableBody.appendChild(row);
        });

    } catch (error) {

        console.error("Pipeline report error:", error);

    }
}


async function loadWonLostReport() {

    try {

        const response = await fetch("/api/reports/won-lost");
        const result = await response.json();

        const tableBody =
            document.getElementById("wonLostTableBody");

        tableBody.innerHTML = "";

        if (result.status !== "success") {
            tableBody.innerHTML =
                "<tr><td colspan='3'>Failed to load report</td></tr>";
            return;
        }

        result.data.forEach(function (item) {

            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${formatStage(item.stage)}</td>
                <td>${item.deal_count}</td>
                <td>₹${Number(item.total_value).toLocaleString("en-IN")}</td>
            `;

            tableBody.appendChild(row);
        });

    } catch (error) {

        console.error("Won/Lost report error:", error);

    }
}


async function loadSalesPerformanceReport() {

    try {

        const response =
            await fetch("/api/reports/sales-performance");

        const result = await response.json();

        const tableBody =
            document.getElementById(
                "salesPerformanceTableBody"
            );

        tableBody.innerHTML = "";

        if (result.status !== "success") {
            tableBody.innerHTML =
                "<tr><td colspan='4'>Failed to load report</td></tr>";
            return;
        }

        result.data.forEach(function (item) {

            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${item.sales_rep}</td>
                <td>${item.total_deals}</td>
                <td>${item.won_deals}</td>
                <td>₹${Number(item.won_value).toLocaleString("en-IN")}</td>
            `;

            tableBody.appendChild(row);
        });

    } catch (error) {

        console.error(
            "Sales performance report error:",
            error
        );

    }
}


async function loadMonthlyLeadsReport() {

    try {

        const response =
            await fetch("/api/reports/monthly-leads");

        const result = await response.json();

        const tableBody =
            document.getElementById(
                "monthlyLeadsTableBody"
            );

        tableBody.innerHTML = "";

        if (result.status !== "success") {
            tableBody.innerHTML =
                "<tr><td colspan='2'>Failed to load report</td></tr>";
            return;
        }

        result.data.forEach(function (item) {

            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${item.month}</td>
                <td>${item.lead_count}</td>
            `;

            tableBody.appendChild(row);
        });

    } catch (error) {

        console.error(
            "Monthly leads report error:",
            error
        );

    }
}


function formatStage(stage) {

    if (!stage) {
        return "-";
    }

    return stage
        .replace(/_/g, " ")
        .replace(/\b\w/g, function (letter) {
            return letter.toUpperCase();
        });
}