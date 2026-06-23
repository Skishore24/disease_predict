const API = "http://127.0.0.1:8000";
let historyData = [];

// Authentication check on page load
document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("user");

    if (!token || !username) {
        window.location.href = "login.html";
        return;
    }

    // Set user profile details
    document.getElementById("userNameDisplay").textContent = username;
    document.getElementById("avatarLetter").textContent = username.charAt(0).toUpperCase();

    // Initial data load
    loadHistory();
});

// Toast notification helper
function showToast(message, type = "success") {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    
    let prefix = "✓";
    if (type === "error") prefix = "✕";
    if (type === "info") prefix = "ℹ";

    toast.innerHTML = `<span><strong>${prefix}</strong> ${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => toast.classList.add("show"), 10);

    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Tab Switching Mechanism
function switchTab(tabId, element) {
    // Update active tab buttons
    document.querySelectorAll(".nav-item").forEach(item => {
        item.classList.remove("active");
    });
    element.classList.add("active");

    // Update active tab panes
    document.querySelectorAll(".tab-pane").forEach(pane => {
        pane.classList.remove("active");
    });

    const activePane = document.getElementById(`${tabId}Tab`);
    if (activePane) {
        activePane.classList.add("active");
    }

    // Update header title based on active tab
    const titles = {
        'overview': 'Dashboard Overview',
        'predict': 'New Diagnosis',
        'history': 'Scan History Database'
    };
    document.getElementById("tabHeaderTitle").textContent = titles[tabId] || "Dashboard";

    // Refresh history statistics on switching
    if (tabId === "history" || tabId === "overview") {
        loadHistory();
    }
}

// Execute Prediction Diagnostic
async function runPrediction(event) {
    event.preventDefault();

    const patientName = document.getElementById("patientName").value.trim();
    const fever = document.getElementById("symptomFever").checked ? 1 : 0;
    const cough = document.getElementById("symptomCough").checked ? 1 : 0;
    const headache = document.getElementById("symptomHeadache").checked ? 1 : 0;
    const fatigue = document.getElementById("symptomFatigue").checked ? 1 : 0;
    const vomiting = document.getElementById("symptomVomiting").checked ? 1 : 0;

    if (!patientName) {
        showToast("Please enter a patient name", "error");
        return;
    }

    const placeholder = document.getElementById("resultPlaceholder");
    const loading = document.getElementById("resultLoading");
    const details = document.getElementById("resultDetails");

    // Toggle views for loading
    placeholder.classList.add("hidden");
    details.classList.add("hidden");
    loading.classList.remove("hidden");

    try {
        const response = await fetch(`${API}/predict`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                patient_name: patientName,
                fever: fever,
                cough: cough,
                headache: headache,
                fatigue: fatigue,
                vomiting: vomiting
            })
        });

        const result = await response.ok ? await response.json() : null;

        if (!result) {
            const errData = await response.json();
            showToast(errData.detail || "Diagnosis prediction failed", "error");
            resetPredictionUI();
            return;
        }

        // Render result details
        document.getElementById("resultPatientName").textContent = result.patient_name;
        document.getElementById("resultDisease").textContent = result.disease;
        document.getElementById("resultConfidenceVal").textContent = result.confidence;

        // Set confidence progress bar
        const confidenceValParsed = parseFloat(result.confidence);
        const confBar = document.getElementById("resultConfidenceBar");
        confBar.style.width = "0%";
        
        const totalSymptoms = fever + cough + headache + fatigue + vomiting;
        document.getElementById("resultSymptomCount").textContent = `${totalSymptoms} / 5`;

        loading.classList.add("hidden");
        details.classList.remove("hidden");

        // Animate fill bar
        setTimeout(() => {
            confBar.style.width = `${confidenceValParsed}%`;
        }, 150);

        showToast("Diagnostic scan completed successfully!", "success");

        // Reset inputs
        document.getElementById("predictionForm").reset();

        // Refresh stats
        loadHistory();

    } catch (err) {
        console.error("Prediction Error:", err);
        showToast("Could not contact prediction API", "error");
        resetPredictionUI();
    }
}

function resetPredictionUI() {
    document.getElementById("resultLoading").classList.add("hidden");
    document.getElementById("resultDetails").classList.add("hidden");
    document.getElementById("resultPlaceholder").classList.remove("hidden");
}

// Fetch and load Scan history
async function loadHistory() {
    try {
        const response = await fetch(`${API}/history`);
        if (!response.ok) throw new Error("Failed to fetch history");

        historyData = await response.json();
        
        // Update Statistics
        updateStats();

        // Render history table and recent activity
        renderHistoryTable(historyData);
        renderRecentScans(historyData);

    } catch (err) {
        console.error("Load History Error:", err);
        showToast("Could not sync scan history records", "error");
    }
}

function updateStats() {
    const totalPredictions = historyData.length;
    
    // Unique Patients list
    const uniquePatients = new Set();
    const uniqueDiseases = new Set();

    historyData.forEach(item => {
        if (item.patient_name) uniquePatients.add(item.patient_name.toLowerCase());
        if (item.disease) uniqueDiseases.add(item.disease.toLowerCase());
    });

    document.getElementById("statPredictions").textContent = totalPredictions;
    document.getElementById("statPatients").textContent = uniquePatients.size;
    document.getElementById("statDiseases").textContent = uniqueDiseases.size || 7; // Fallback to trained classes
}

function renderHistoryTable(data) {
    const tbody = document.getElementById("historyTableBody");
    if (!tbody) return;

    if (data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; color: var(--text-secondary); padding: 40px 0;">
                    No records found in database.
                </td>
            </tr>
        `;
        document.getElementById("historyRecordCount").textContent = "Showing 0 records";
        return;
    }

    let rowsHtml = "";
    data.forEach(item => {
        const diseaseClass = `pill-${item.disease.toLowerCase().replace(/\s+/g, '-')}`;
        const confidenceVal = parseFloat(item.confidence);
        
        let confidenceClass = "confidence-low";
        if (confidenceVal >= 75) confidenceClass = "confidence-high";
        else if (confidenceVal >= 50) confidenceClass = "confidence-medium";

        // Extract a shorter version of Mongo ID
        const shortId = item._id ? item._id.substring(18) : "-";

        rowsHtml += `
            <tr>
                <td style="font-weight: 600; color: #ffffff;">${escapeHTML(item.patient_name)}</td>
                <td><span class="disease-pill ${diseaseClass}">${escapeHTML(item.disease)}</span></td>
                <td><span class="confidence-badge ${confidenceClass}">${item.confidence}</span></td>
                <td style="font-family: monospace; color: var(--text-secondary); font-size: 12px;">#${shortId}</td>
            </tr>
        `;
    });

    tbody.innerHTML = rowsHtml;
    document.getElementById("historyRecordCount").textContent = `Showing ${data.length} record${data.length === 1 ? '' : 's'}`;
}

function renderRecentScans(data) {
    const container = document.getElementById("recentPredictionsList");
    if (!container) return;

    if (data.length === 0) {
        container.innerHTML = `<p style="color: var(--text-secondary); font-size: 13px; text-align: center; padding: 20px 0;">No scans run yet.</p>`;
        return;
    }

    // Get latest 3
    const latest = data.slice(0, 3);
    let listHtml = "";

    latest.forEach(item => {
        const diseaseClass = `pill-${item.disease.toLowerCase().replace(/\s+/g, '-')}`;
        listHtml += `
            <div class="recent-item">
                <div class="recent-info">
                    <h5>${escapeHTML(item.patient_name)}</h5>
                    <p>Inference: <strong style="color: #ffffff;">${item.confidence}</strong></p>
                </div>
                <span class="disease-pill ${diseaseClass}">${escapeHTML(item.disease)}</span>
            </div>
        `;
    });

    container.innerHTML = listHtml;
}

// Client-side search filtration
function filterHistoryTable() {
    const query = document.getElementById("historySearch").value.toLowerCase().trim();
    if (!query) {
        renderHistoryTable(historyData);
        return;
    }

    const filtered = historyData.filter(item => 
        item.patient_name && item.patient_name.toLowerCase().includes(query)
    );
    renderHistoryTable(filtered);
}

// Safety helper to prevent XSS
function escapeHTML(str) {
    if (!str) return "";
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

// Handle Logout
function logout() {
    localStorage.clear();
    showToast("Signed out successfully", "info");
    setTimeout(() => {
        window.location.href = "login.html";
    }, 800);
}
