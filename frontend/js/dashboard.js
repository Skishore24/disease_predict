/* MediPredict AI - World-Class Patient Dashboard Logic Suite */
const API = window.location.port === "8000" ? window.location.origin : `${window.location.protocol}//${window.location.hostname}:8000`;
let historyData = [];

// Static Disease Database for Knowledge Center & Fallbacks
const DISEASE_DB = {
    "covid": {
        "name": "COVID-19 (Coronavirus)",
        "description": "A contagious viral respiratory illness caused by the SARS-CoV-2 virus, ranging from mild symptoms to severe pneumonia.",
        "causes": ["Inhaling airborne viral respiratory droplets", "Close contact with infected people", "Touching contaminated surfaces"],
        "symptoms": ["Fever or chills", "Dry cough & sore throat", "Shortness of breath", "Loss of taste or smell", "Body aches & fatigue"],
        "prevention": ["Keep vaccines updated", "Wear masks in poorly ventilated spaces", "Wash hands regularly"],
        "treatments": ["Symptomatic care (fever reducers)", "Antiviral drugs if prescribed", "Oxygen therapy in severe cases"],
        "timeline": "Typically 7 to 14 days, though fatigue can persist longer.",
        "foods_to_eat": ["Broths", "Citrus fruits", "Garlic"],
        "foods_to_avoid": ["Cold beverages", "Processed sugars"],
        "risk_level": "High"
    },
    "flu": {
        "name": "Influenza (Flu)",
        "description": "A highly infectious respiratory viral illness marked by rapid onset of fever, shivering, and body aches.",
        "causes": ["Influenza A or B viral transmission", "Inhaling sneeze or cough droplets", "Direct physical contact"],
        "symptoms": ["Sudden high fever", "Muscle and joint pains", "Dry cough & sore throat", "Headache & chills", "Fatigue"],
        "prevention": ["Annual flu vaccination shot", "Avoiding crowds during flu season", "Sanitizing hands"],
        "treatments": ["Complete bed rest", "Antiviral medications if caught early", "Adequate hydration"],
        "timeline": "Usually resolves in 5 to 7 days.",
        "foods_to_eat": ["Warm vegetable soups", "Oatmeal", "Ginger tea"],
        "foods_to_avoid": ["Dairy products", "Fried foods"],
        "risk_level": "Medium"
    },
    "cold": {
        "name": "Common Cold",
        "description": "A mild, self-limiting viral infection of the nose, throat, and sinuses.",
        "causes": ["Rhinovirus or common coronaviruses", "Exposure to infected droplets", "Low immune defenses"],
        "symptoms": ["Runny or stuffy nose", "Sore throat & sneezing", "Mild dry cough", "Low-grade fever", "Fatigue"],
        "prevention": ["Wash hands frequently", "Avoid sharing personal cups/utensils", "Maintain daily vitamins"],
        "treatments": ["Hydration", "Saline sprays & throat lozenges", "Over-the-counter decongestants"],
        "timeline": "Usually clears in 3 to 10 days.",
        "foods_to_eat": ["Lemon honey tea", "Clear broths", "Kiwi"],
        "foods_to_avoid": ["Ice cream", "Caffeine"],
        "risk_level": "Low"
    },
    "dengue": {
        "name": "Dengue Fever",
        "description": "A tropical, mosquito-borne viral disease characterized by sudden high fever, rash, and intense joint pain.",
        "causes": ["Bite of an Aedes mosquito carrying the Dengue virus", "Standing water facilitating mosquito breeding"],
        "symptoms": ["Sudden high fever", "Pain behind the eyes", "Severe joint & muscle pain ('breakbone')", "Skin rash", "Vomiting"],
        "prevention": ["Eliminate standing water", "Apply mosquito repellents (DEET)", "Wear long-sleeved clothing"],
        "treatments": ["Acetaminophen/paracetamol (Avoid NSAIDs/Aspirin)", "Complete bed rest", "Electrolyte fluids"],
        "timeline": "Fever lasts 2-7 days; full recovery takes 1-2 weeks.",
        "foods_to_eat": ["Papaya leaf juice", "Coconut water", "Pomegranate"],
        "foods_to_avoid": ["Spicy foods", "NSAID painkillers"],
        "risk_level": "Critical"
    },
    "malaria": {
        "name": "Malaria",
        "description": "A serious, mosquito-borne parasitic blood infection causing cyclical high fever, shaking chills, and sweating.",
        "causes": ["Plasmodium parasite from female Anopheles mosquito bite"],
        "symptoms": ["Cyclical high fever", "Severe shivering and chills", "Profuse sweating", "Headache", "Nausea & vomiting"],
        "prevention": ["Use insecticide-treated bed nets", "Indoor insect sprays", "Prophylactic pills when traveling"],
        "treatments": ["Prescription antimalarial pills (Chloroquine, Artemisinin)"],
        "timeline": "Varies by parasite; recovery takes 1 to 3 weeks on medication.",
        "foods_to_eat": ["Rice porridge", "Boiled vegetables", "Citrus juices"],
        "foods_to_avoid": ["High-fiber raw items", "Fried foods"],
        "risk_level": "High"
    },
    "typhoid": {
        "name": "Typhoid Fever",
        "description": "A systemic bacterial infection caused by Salmonella Typhi, primarily spread through contaminated food or water.",
        "causes": ["Ingesting Salmonella Typhi bacteria", "Poor sanitation & hand hygiene"],
        "symptoms": ["Sustained high fever", "Headache & abdominal pain", "Diarrhea or constipation", "Loss of appetite", "Fatigue"],
        "prevention": ["Drink bottled or boiled water", "Eat fully cooked food", "Get typhoid vaccination"],
        "treatments": ["Prescription antibiotics", "Continuous fluid intake"],
        "timeline": "Symptom improvement in 3-5 days on antibiotics; recovery 2-3 weeks.",
        "foods_to_eat": ["Bananas", "Potatoes", "Soft boiled rice"],
        "foods_to_avoid": ["Raw salads", "Spicy food", "High fiber seeds"],
        "risk_level": "High"
    },
    "migraine": {
        "name": "Migraine Headache",
        "description": "A neurological condition causing throbbing, severe headaches, usually on one side of the head, with sensory disturbances.",
        "causes": ["Genetics", "Environmental triggers (lights, noises, stress)", "Dehydration or lack of sleep"],
        "symptoms": ["Severe throbbing headache", "Sensitivity to light/sound", "Nausea or vomiting", "Dizziness"],
        "prevention": ["Identify and avoid trigger foods", "Maintain regular sleep cycles", "Stay hydrated"],
        "treatments": ["Pain relievers", "Triptans", "Quiet, dark room resting"],
        "timeline": "Individual attacks last 4 to 72 hours.",
        "foods_to_eat": ["Spinach", "Almonds", "Ginger tea"],
        "foods_to_avoid": ["Aged cheese", "Red wine", "Excess chocolate"],
        "risk_level": "Low"
    },
    "gastroenteritis": {
        "name": "Gastroenteritis (Stomach Flu)",
        "description": "An acute inflammation of the stomach and intestinal lining, commonly causing watery diarrhea and vomiting.",
        "causes": ["Norovirus or Rotavirus infection", "Eating spoiled or contaminated food"],
        "symptoms": ["Watery diarrhea & stomach cramps", "Nausea and vomiting", "Low-grade fever", "Fatigue"],
        "prevention": ["Wash hands after bathroom use", "Thoroughly cook meats", "Wash raw vegetables"],
        "treatments": ["Oral Rehydration Salts (ORS)", "Bland foods (BRAT diet)", "Avoiding dairy and fats"],
        "timeline": "Typically clears in 2 to 5 days.",
        "foods_to_eat": ["Toast", "Applesauce", "Electrolytes", "Bananas"],
        "foods_to_avoid": ["Milk/cheese", "Chili", "Greasy fast food"],
        "risk_level": "Low"
    },
    "pneumonia": {
        "name": "Pneumonia",
        "description": "An infection that inflames the air sacs in one or both lungs, which may fill with fluid or pus.",
        "causes": ["Bacterial (Streptococcus)", "Viral (Flu, RSV, COVID)", "Fungal infections"],
        "symptoms": ["Cough with green/yellow phlegm", "Fever & shivering chills", "Shortness of breath", "Sharp chest pain when coughing"],
        "prevention": ["Pneumococcal vaccine", "Flu vaccines", "Avoiding smoking & air pollutants"],
        "treatments": ["Antibiotics (if bacterial)", "Fever control", "Oxygen support if severe"],
        "timeline": "Symptom relief in 1-2 weeks; full lung recovery can take 4-6 weeks.",
        "foods_to_eat": ["Warm chicken broth", "Walnuts", "Spinach"],
        "foods_to_avoid": ["Chilled drinks", "Deep fried items"],
        "risk_level": "High"
    },
    "allergy": {
        "name": "Allergies (Allergic Rhinitis)",
        "description": "An immune system hypersensitivity response to foreign environmental allergens such as pollen, mold, or dander.",
        "causes": ["Inhaling airborne pollen or dust mites", "Pet dander", "Mold spores"],
        "symptoms": ["Runny nose & sneezing", "Itchy, watery eyes", "Dry cough & sore throat", "Skin rash or hives"],
        "prevention": ["Use HEPA filters", "Keep windows closed during high pollen days", "Wash bedding weekly"],
        "treatments": ["Antihistamines", "Nasal steroid sprays", "Avoiding allergen triggers"],
        "timeline": "Symptom relief within hours of taking antihistamines; chronic seasonal variations.",
        "foods_to_eat": ["Onions", "Turmeric", "Citrus fruits"],
        "foods_to_avoid": ["Alcohol", "Highly processed grains"],
        "risk_level": "Low"
    }
};

const SYMPTOMS_LIST = {
    "general": [
        { id: "symptomFever", label: "Fever", key: "fever" },
        { id: "symptomHeadache", label: "Headache", key: "headache" },
        { id: "symptomFatigue", label: "Fatigue", key: "fatigue" },
        { id: "symptomDizziness", label: "Dizziness", key: "dizziness" },
        { id: "symptomJointPain", label: "Joint Pain", key: "joint_paint" },
        { id: "symptomBodyPain", label: "Body Pain", key: "body_pain" },
        { id: "symptomChills", label: "Chills", key: "chills" },
        { id: "symptomWeightLoss", label: "Weight Loss", key: "weight_loss" }
    ],
    "respiratory": [
        { id: "symptomCough", label: "Cough", key: "cough" },
        { id: "symptomSoreThroat", label: "Sore Throat", key: "sore_throat" },
        { id: "symptomRunnyNose", label: "Runny Nose", key: "runny_nose" },
        { id: "symptomLossSmell", label: "Loss of Smell", key: "loss_of_smell" },
        { id: "symptomLossTaste", label: "Loss of Taste", key: "loss_of_taste" }
    ],
    "digestive": [
        { id: "symptomVomiting", label: "Vomiting", key: "vomiting" },
        { id: "symptomDiarrhea", label: "Diarrhea", key: "diarrhea" },
        { id: "symptomNausea", label: "Nausea", key: "nausea" },
        { id: "symptomAbdominal", label: "Abdominal Pain", key: "abdominal_pain" }
    ],
    "emergency": [
        { id: "symptomChestPain", label: "Chest Pain", key: "chest_pain" },
        { id: "symptomShortBreath", label: "Difficulty Breathing", key: "shortness_of_breath" },
        { id: "symptomBloodVomit", label: "Blood Vomiting", key: "emergency_blood_vomiting" },
        { id: "symptomUnconscious", label: "Loss of Consciousness", key: "emergency_unconsciousness" },
        { id: "symptomExtremeFever", label: "Very High Fever (>39.5°C)", key: "emergency_very_high_fever" }
    ]
};

const HEALTH_TIPS = [
    "Drink a glass of water first thing in the morning to jumpstart hydration.",
    "Prioritize 7-8 hours of sleep to support your body's immune system.",
    "Limit processed sugars to decrease cell inflammation levels.",
    "Take regular stretching breaks during desk work to prevent back fatigue.",
    "Maintain consistent daily meal timings to stabilize digestive processes.",
    "Include high-fiber options like berries and leafy greens in your lunches."
];

// Recovery state trackers
let waterCups = 0;
let sleepHoursList = [7.5, 8.0, 7.0, 6.5, 8.0, 7.5, 8.0];
let sleepChart = null;
let recoveryChart = null;
let currentPredictionResult = null;
let activeMood = "Good";

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Sync User Session credentials
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    const user = localStorage.getItem("user") || sessionStorage.getItem("user");

    if (!token || !user) {
        window.location.href = "login.html";
        return;
    }

    // Set Welcome elements
    document.querySelectorAll(".patient-name-placeholder").forEach(el => el.textContent = user);
    document.getElementById("userNameDisplay").textContent = user;
    document.getElementById("avatarLetter").textContent = user.charAt(0).toUpperCase();

    // 2. Fetch Settings
    await loadUserSettings();

    // 3. Load Profile details from Server
    await loadPatientProfileDetails();

    // 4. Render Symptoms Chips
    renderSymptomChips();

    // 5. Render Disease Knowledge
    renderKnowledgeList();

    // 6. Water and Checklists
    await fetchWaterIntake();
    await fetchRecoveryTasks();
    await fetchMedicines();

    // 7. Load predictions history
    await loadHistoryData();

    // 8. Initialize charts & rotating tips
    initializeCharts();
    rotateDailyTip();
});

// Rotate tip of the day
function rotateDailyTip() {
    const tipEl = document.getElementById("dailyTipText");
    if (tipEl) {
        const randIndex = Math.floor(Math.random() * HEALTH_TIPS.length);
        tipEl.textContent = HEALTH_TIPS[randIndex];
    }
}

// Dark Mode Toggle
function toggleDarkMode() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute("data-theme") || "light";
    const nextTheme = currentTheme === "light" ? "dark" : "light";
    
    html.setAttribute("data-theme", nextTheme);
    localStorage.setItem("theme", nextTheme);
    
    // Save settings back to API asynchronously
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    fetch(`${API}/api/settings`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ dark_mode: nextTheme === "dark", notifications_enabled: true })
    }).catch(err => console.error("Error saving theme settings:", err));

    updateThemeBtnDisplay(nextTheme);
    showToast(`Switched to ${nextTheme} mode`, "info");
}

function updateThemeBtnDisplay(theme) {
    const icon = document.querySelector("#themeToggleBtn i");
    const text = document.getElementById("themeToggleText");
    if (theme === "dark") {
        if (icon) icon.className = "fa-solid fa-sun";
        if (text) text.textContent = "Light Mode";
    } else {
        if (icon) icon.className = "fa-solid fa-moon";
        if (text) text.textContent = "Dark Mode";
    }
}

async function loadUserSettings() {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    try {
        const res = await fetch(`${API}/api/settings`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
            // Force light mode theme
            document.documentElement.setAttribute("data-theme", "light");
        }
    } catch (e) {
        console.error("Failed to load user settings:", e);
    }
}

// Tab Nav Controller
function switchTab(tabId, element) {
    document.querySelectorAll(".tab-pane").forEach(pane => pane.classList.remove("active"));
    document.querySelectorAll(".nav-links .nav-item").forEach(item => item.classList.remove("active"));

    const targetPane = document.getElementById(tabId);
    if (targetPane) targetPane.classList.add("active");
    if (element) element.classList.add("active");

    const titleEl = document.getElementById("currentTabTitle");
    if (titleEl && element) {
        titleEl.textContent = element.querySelector("span").textContent;
    }

    if (tabId === "recoveryTab" || tabId === "dashboardTab") {
        setTimeout(() => initializeCharts(), 100);
    }
}

// Draw Symptom Chips
function renderSymptomChips() {
    const renderSection = (containerId, items) => {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = "";
        items.forEach(item => {
            const chip = document.createElement("div");
            chip.className = "symptom-chip";
            chip.dataset.key = item.key;
            chip.dataset.label = item.label;
            chip.id = item.id;
            chip.innerHTML = `<span>${item.label}</span><i class="fa-solid fa-plus" style="font-size:10px;"></i>`;
            chip.addEventListener("click", () => {
                chip.classList.toggle("selected");
                const icon = chip.querySelector("i");
                if (chip.classList.contains("selected")) {
                    icon.className = "fa-solid fa-check";
                } else {
                    icon.className = "fa-solid fa-plus";
                }
            });
            container.appendChild(chip);
        });
    };

    renderSection("chipsGeneral", SYMPTOMS_LIST.general);
    renderSection("chipsRespiratory", SYMPTOMS_LIST.respiratory);
    renderSection("chipsDigestive", SYMPTOMS_LIST.digestive);
    renderSection("chipsEmergency", SYMPTOMS_LIST.emergency);
}

// Filter chips
function filterSymptomChips() {
    const query = document.getElementById("symptomSearchInput").value.toLowerCase();
    document.querySelectorAll(".symptom-chip").forEach(chip => {
        const text = chip.dataset.label.toLowerCase();
        if (text.includes(query)) {
            chip.classList.remove("hidden");
        } else {
            chip.classList.add("hidden");
        }
    });
}

// Toast
function showToast(message, type = "success") {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    let iconClass = "fa-solid fa-circle-check";
    if (type === "error") iconClass = "fa-solid fa-circle-xmark";
    if (type === "info") iconClass = "fa-solid fa-circle-info";

    toast.innerHTML = `<i class="${iconClass}"></i><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => toast.classList.add("show"), 10);
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Load Check History
async function loadHistoryData() {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    try {
        const response = await fetch(`${API}/history`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (response.status === 401) {
            handleExpiredSession();
            return;
        }

        if (!response.ok) throw new Error();

        historyData = await response.json();
        
        // Show content
        document.body.style.setProperty("display", "flex", "important");

        updateDashboardWidgets();
        renderHistoryTables();
    } catch (err) {
        console.error(err);
        document.body.style.setProperty("display", "flex", "important");
    }
}

function handleExpiredSession() {
    localStorage.clear();
    sessionStorage.clear();
    showToast("Session expired. Please sign in again.", "error");
    setTimeout(() => window.location.href = "login.html", 1200);
}

function updateDashboardWidgets() {
    document.getElementById("statChecksCount").textContent = historyData.length;

    // Health Score logic
    let score = 95;
    if (historyData.length > 0) {
        const lastCheck = historyData[0];
        if (lastCheck.emergency_detected) {
            score = 45;
        } else {
            const bp = parseInt(lastCheck.vital_bp_sys || 120);
            const temp = parseFloat(lastCheck.vital_temp || 36.8);
            const spo2 = parseInt(lastCheck.vital_spo2 || 98);
            
            if (bp > 140 || temp > 38.5 || spo2 < 94) {
                score = 60;
            } else if (bp > 130 || temp > 37.8 || spo2 < 96) {
                score = 78;
            }
        }
    }

    // Weight and Height BMIs
    const height = parseFloat(localStorage.getItem("profile_height") || "175");
    const weight = parseFloat(localStorage.getItem("profile_weight") || "70");
    const bmi = roundVal(weight / ((height / 100) ** 2));
    
    document.getElementById("statBMIDisplay").textContent = bmi;
    const bmiStatus = document.getElementById("statBMIStatus");
    if (bmi < 18.5) {
        bmiStatus.textContent = "Underweight";
    } else if (bmi < 25) {
        bmiStatus.textContent = "Normal Range";
    } else if (bmi < 30) {
        bmiStatus.textContent = "Overweight";
    } else {
        bmiStatus.textContent = "Obese Range";
    }

    // Update BMI spectrum indicator
    const pointer = document.getElementById("statBMIPointer");
    if (pointer) {
        let leftPct = 50;
        if (bmi < 18.5) {
            leftPct = Math.max(0, Math.min(30, ((bmi - 10) / 8.5) * 30));
        } else if (bmi < 25) {
            leftPct = 30 + ((bmi - 18.5) / 6.5) * 30;
        } else if (bmi < 30) {
            leftPct = 60 + ((bmi - 25) / 5) * 20;
        } else {
            leftPct = 80 + Math.min(20, ((bmi - 30) / 10) * 20);
        }
        pointer.style.left = `${leftPct}%`;
    }

    // Goal Checklist Completion impact
    const checked = document.querySelectorAll("#recoveryTab input[type='checkbox']:checked").length;
    score = Math.min(score - (4 - checked) * 3 + Math.min(waterCups, 8), 100);
    
    const scoreEl = document.getElementById("dashboardHealthScore");
    if (scoreEl) {
        scoreEl.textContent = Math.round(score);
        const circle = scoreEl.parentElement;
        if (score >= 90) circle.style.borderColor = "var(--success)";
        else if (score >= 75) circle.style.borderColor = "var(--warning)";
        else circle.style.borderColor = "var(--danger)";
    }

    // Update Water progress bar
    const waterBar = document.getElementById("statWaterBar");
    if (waterBar) {
        const pct = Math.round((waterCups / 8) * 100);
        waterBar.style.width = `${pct}%`;
    }
}

function renderHistoryTables() {
    const list = document.getElementById("dashboardChecksHistory");
    if (!list) return;

    list.innerHTML = "";

    if (historyData.length === 0) {
        list.innerHTML = `<tr><td colspan="5" class="empty-state">No symptoms checks run yet.</td></tr>`;
        return;
    }

    historyData.forEach(item => {
        const date = item.timestamp ? new Date(item.timestamp).toLocaleDateString() : new Date().toLocaleDateString();
        
        let riskClass = "badge-low";
        let riskText = item.risk_level || "Low";
        if (riskText === "Critical") riskClass = "badge-critical";
        else if (riskText === "High") riskClass = "badge-high";
        else if (riskText === "Medium") riskClass = "badge-medium";

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${date}</td>
            <td><strong>${item.disease}</strong></td>
            <td>${item.confidence || "85%"}</td>
            <td><span class="badge-pill ${riskClass}">${riskText}</span></td>
            <td>
                <div style="display:flex; gap:6px;">
                    <button class="btn-outline" style="padding:4px 8px; font-size:11px;" onclick="downloadSpecificPDF('${item._id}')"><i class="fa-solid fa-file-pdf"></i></button>
                    <button class="btn-outline" style="padding:4px 8px; font-size:11px; color:var(--danger); border-color:var(--danger-light);" onclick="deleteHistoryRecord('${item._id}')"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            </td>
        `;
        list.appendChild(tr);
    });
}

function filterHistory() {
    const search = document.getElementById("historySearch").value.toLowerCase();
    const risk = document.getElementById("historyFilterRisk").value;
    
    document.querySelectorAll("#dashboardChecksHistory tr").forEach(tr => {
        const cols = tr.querySelectorAll("td");
        if (cols.length < 4) return;
        const disease = cols[1].textContent.toLowerCase();
        const riskVal = cols[3].textContent.trim();

        const matchSearch = disease.includes(search);
        const matchRisk = !risk || riskVal.includes(risk);

        if (matchSearch && matchRisk) {
            tr.style.display = "";
        } else {
            tr.style.display = "none";
        }
    });
}

async function deleteHistoryRecord(id) {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!confirm("Are you sure you want to delete this checkup from your history?")) return;
    
    try {
        const res = await fetch(`${API}/history/${id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
            showToast("Record removed successfully", "success");
            await loadHistoryData();
        }
    } catch (e) {
        showToast("Failed to delete record", "error");
    }
}

// Predict Submit
async function runSymptomPrediction(event) {
    event.preventDefault();
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");

    // Gather checked symptom keys
    const payload = {};
    document.querySelectorAll(".symptom-chip").forEach(chip => {
        payload[chip.dataset.key] = chip.classList.contains("selected") ? 1 : 0;
    });

    const temp = parseFloat(document.getElementById("checkerTemp").value);
    const hr = parseInt(document.getElementById("checkerHR").value);
    const bpSys = parseInt(document.getElementById("checkerBPSys").value);
    const bpDia = parseInt(document.getElementById("checkerBPDia").value);
    const spo2 = parseInt(document.getElementById("checkerSpO2").value);

    payload.patient_name = localStorage.getItem("user");
    payload.vital_temp = temp;
    payload.vital_hr = hr;
    payload.vital_bp_sys = bpSys;
    payload.vital_bp_dia = bpDia;
    payload.vital_spo2 = spo2;

    // Loading State
    document.getElementById("checkerPlaceholder").classList.add("hidden");
    document.getElementById("checkerResultContent").classList.add("hidden");
    document.getElementById("outEmergencyAlert").classList.add("hidden");
    document.getElementById("checkerSkeleton").classList.remove("hidden");

    try {
        const response = await fetch(`${API}/predict`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (response.status === 401) {
            handleExpiredSession();
            return;
        }

        if (!response.ok) throw new Error();

        const result = await response.json();
        currentPredictionResult = result;

        setTimeout(() => {
            document.getElementById("checkerSkeleton").classList.add("hidden");

            if (result.emergency_detected) {
                // Render Emergency RED card
                document.getElementById("outEmergencySymptoms").textContent = result.metadata.symptoms.join(", ");
                document.getElementById("outEmergencyAlert").classList.remove("hidden");
                showToast("CRITICAL ALERT: Seek Immediate Care!", "error");
            } else {
                // Render normal prediction outcome
                document.getElementById("outDiseaseName").textContent = result.disease;
                document.getElementById("outConfidenceText").textContent = result.confidence;
                document.getElementById("outGaugeFill").style.width = result.confidence;

                // Set badges
                const rText = result.risk_level;
                const rBadge = document.getElementById("outRiskBadge");
                document.getElementById("outRiskText").textContent = `${rText} Risk Level`;
                rBadge.className = `risk-indicator ${rText.toLowerCase()}`;

                const sText = result.severity;
                const sBadge = document.getElementById("outSeverityBadge");
                document.getElementById("outSeverityText").textContent = `${sText} Severity`;
                sBadge.className = `risk-indicator info ${sText.toLowerCase()}`;

                // Set descriptions and explain details
                document.getElementById("outDescription").textContent = result.metadata.description;
                document.getElementById("outWhyExplanation").textContent = result.why_predicted;
                
                document.getElementById("outFoodsEat").textContent = result.metadata.foods_to_eat.join(", ");
                document.getElementById("outFoodsAvoid").textContent = result.metadata.foods_to_avoid.join(", ");
                document.getElementById("outHydration").textContent = result.metadata.hydration;
                document.getElementById("outSleep").textContent = result.metadata.sleep;
                document.getElementById("outActions").textContent = result.metadata.actions.join(". ");

                const matchesContainer = document.getElementById("outTopMatchesList");
                matchesContainer.innerHTML = "";
                (result.top_3_diseases || []).forEach(match => {
                    const ch = document.createElement("span");
                    ch.className = "symptom-chip selected";
                    ch.style.fontSize = "11px";
                    ch.style.padding = "4px 10px";
                    ch.textContent = `${match.disease} (${match.confidence})`;
                    matchesContainer.appendChild(ch);
                });

                document.getElementById("checkerResultContent").classList.remove("hidden");
                showToast("AI medical prediction loaded", "success");
            }

            // Reset checkers selection UI
            document.querySelectorAll(".symptom-chip").forEach(c => c.classList.remove("selected"));
            document.querySelectorAll(".symptom-chip i").forEach(i => i.className = "fa-solid fa-plus");
            document.getElementById("checkerForm").reset();

            loadHistoryData();
        }, 1200);

    } catch (err) {
        document.getElementById("checkerSkeleton").classList.add("hidden");
        document.getElementById("checkerPlaceholder").classList.remove("hidden");
        showToast("Error processing symptom check details", "error");
    }
}

function resetCheckerForm() {
    document.getElementById("outEmergencyAlert").classList.add("hidden");
    document.getElementById("checkerPlaceholder").classList.remove("hidden");
    document.getElementById("checkerForm").reset();
}

// Hydration tracking
async function fetchWaterIntake() {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    try {
        const res = await fetch(`${API}/api/trackers/water`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            waterCups = data.cups;
            updateWaterCupDisplay();
        }
    } catch (e) {
        console.error("Water load error", e);
    }
}

async function addWaterCup(change) {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    try {
        const res = await fetch(`${API}/api/trackers/water`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ cups: change })
        });
        if (res.ok) {
            const data = await res.json();
            waterCups = data.cups;
            updateWaterCupDisplay();
            updateGoalCompletionPercentage();
        }
    } catch (e) {
        showToast("Failed to log water intake", "error");
    }
}

function updateWaterCupDisplay() {
    document.getElementById("recoveryWaterDisplay").textContent = `${waterCups} / 8 Cups`;
    document.getElementById("statWaterProgress").textContent = `${waterCups} / 8 cups`;
    
    const pct = Math.round((waterCups / 8) * 100);
    document.getElementById("statWaterPct").textContent = `${pct}% target reached`;

    const waterBar = document.getElementById("statWaterBar");
    if (waterBar) waterBar.style.width = `${pct}%`;

    const icons = document.querySelectorAll("#waterCupsContainer i");
    icons.forEach((icon, index) => {
        if (index < waterCups) {
            icon.className = "fa-solid fa-glass-water filled";
        } else {
            icon.className = "fa-solid fa-glass-water";
        }
    });

    const chkHydrate = document.getElementById("chkHydrate");
    if (chkHydrate) chkHydrate.checked = waterCups >= 8;
}

// Recovery Tasks Checklist
async function fetchRecoveryTasks() {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    try {
        const res = await fetch(`${API}/api/trackers/recovery`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
            const list = await res.json();
            list.forEach(task => {
                const chk = document.getElementById(task.task_id);
                if (chk) chk.checked = task.completed;
            });
            updateGoalCompletionPercentage();
        }
    } catch (e) {
        console.error("Recovery tasks load error", e);
    }
}

async function toggleChecklistTask(id) {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    const chk = document.getElementById(id);
    if (!chk) return;
    try {
        await fetch(`${API}/api/trackers/recovery`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ task_id: id, completed: chk.checked })
        });
        updateGoalCompletionPercentage();
    } catch (e) {
        showToast("Failed to update task", "error");
    }
}

function updateGoalCompletionPercentage() {
    const chks = document.querySelectorAll("#recoveryTab input[type='checkbox']");
    let total = chks.length;
    let checked = 0;
    chks.forEach(c => { if (c.checked) checked++; });
    
    // Water and Meds influence goal bar
    const waterFactor = Math.min(waterCups / 8, 1);
    const progress = total > 0 ? Math.round(((checked / total) * 0.7 + waterFactor * 0.3) * 100) : 0;
    
    const bar = document.getElementById("recoveryGoalFill");
    const label = document.getElementById("recoveryPctText");
    if (bar) bar.style.width = `${progress}%`;
    if (label) label.textContent = `${progress}% Done`;

    updateDashboardWidgets();
}

// Medicine Reminders Manager
async function fetchMedicines() {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    try {
        const res = await fetch(`${API}/api/trackers/medicine`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
            const list = await res.json();
            renderMedicinesList(list);
        }
    } catch (e) {
        console.error("Medicines fetch failed", e);
    }
}

function renderMedicinesList(meds) {
    const container = document.getElementById("medicineReminderList");
    if (!container) return;
    container.innerHTML = "";

    if (meds.length === 0) {
        container.innerHTML = `<p style="font-size:12px; color:var(--text-muted); text-align:center; padding:10px;">No scheduled medicine reminders.</p>`;
        return;
    }

    meds.forEach(med => {
        const row = document.createElement("div");
        row.style = "display:flex; align-items:center; justify-content:space-between; padding:10px; background:var(--bg-secondary); border-radius:10px;";
        row.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px;">
                <input type="checkbox" ${med.taken ? "checked" : ""} onchange="toggleMedicineTaken('${med._id}', this)">
                <div>
                    <strong style="font-size:13px; color:var(--text-primary);">${med.medicine_name}</strong>
                    <span style="font-size:11px; color:var(--text-secondary); display:block;">Dosage: ${med.dosage || "N/A"} - Time: ${med.time}</span>
                </div>
            </div>
            <button class="btn-logout" style="padding:4px 8px; border:none; background:transparent;" onclick="deleteMedicineRecord('${med._id}')"><i class="fa-solid fa-trash-can" style="font-size:12px;"></i></button>
        `;
        container.appendChild(row);
    });
}

async function handleAddMedicine(event) {
    event.preventDefault();
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    const name = document.getElementById("medNameInput").value.trim();
    const dosage = document.getElementById("medDosageInput").value.trim();
    const time = document.getElementById("medTimeInput").value.trim();

    try {
        const res = await fetch(`${API}/api/trackers/medicine`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ medicine_name: name, dosage: dosage, time: time, taken: false })
        });
        if (res.ok) {
            showToast("Medicine added successfully", "success");
            document.getElementById("addMedsForm").reset();
            await fetchMedicines();
        }
    } catch (e) {
        showToast("Failed to add medicine", "error");
    }
}

async function toggleMedicineTaken(id, el) {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    try {
        await fetch(`${API}/api/trackers/medicine/${id}/toggle`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ taken: el.checked })
        });
        showToast("Medicine log updated", "success");
    } catch (e) {
        showToast("Failed to update status", "error");
    }
}

async function deleteMedicineRecord(id) {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    try {
        const res = await fetch(`${API}/api/trackers/medicine/${id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
            showToast("Reminder removed", "info");
            await fetchMedicines();
        }
    } catch (e) {
        showToast("Failed to delete medicine reminder", "error");
    }
}

// Mood Tracking
function logMood(mood, buttonEl) {
    activeMood = mood;
    document.querySelectorAll(".mood-btn").forEach(btn => btn.style.transform = "scale(1)");
    if (buttonEl) buttonEl.style.transform = "scale(1.35)";
    
    // Log in database feedback or settings if needed
    showToast(`Logged daily mood as: ${mood}!`, "success");
}

// Log Sleep hours
function logSleepHours() {
    const hrs = parseFloat(document.getElementById("sleepHoursInput").value);
    if (hrs > 0 && hrs <= 24) {
        sleepHoursList.shift();
        sleepHoursList.push(hrs);
        showToast(`Logged ${hrs} sleep hours`, "success");
        initializeCharts();
    }
}

// Profile management
async function loadPatientProfileDetails() {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    try {
        const res = await fetch(`${API}/profile`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) throw new Error();

        const profile = await res.json();
        
        // Save values in local storage for widgets
        localStorage.setItem("user", profile.name);
        localStorage.setItem("profile_age", profile.age);
        localStorage.setItem("profile_gender", profile.gender);
        localStorage.setItem("profile_height", profile.height);
        localStorage.setItem("profile_weight", profile.weight);

        // Render profile fields
        document.getElementById("profileAgeVal").textContent = profile.age;
        document.getElementById("profileGenderVal").textContent = profile.gender;
        document.getElementById("profileHeightVal").textContent = `${profile.height} cm`;
        document.getElementById("profileWeightVal").textContent = `${profile.weight} kg`;
        document.getElementById("profileBloodGroupVal").textContent = profile.blood_group;

        // Form fields
        document.getElementById("profileName").value = profile.name;
        document.getElementById("profileAge").value = profile.age;
        document.getElementById("profileGender").value = profile.gender;
        document.getElementById("profileHeight").value = profile.height;
        document.getElementById("profileWeight").value = profile.weight;
        document.getElementById("profileBloodGroup").value = profile.blood_group;
        document.getElementById("profileEmergencyContact").value = profile.emergency_contact === "None" ? "" : profile.emergency_contact;
        document.getElementById("profileHistory").value = profile.medical_history === "None" ? "" : profile.medical_history;
        document.getElementById("profileAllergies").value = profile.allergies === "None" ? "" : profile.allergies;

        // BMI details
        document.getElementById("profileBMIText").textContent = profile.bmi;
        const statusBadge = document.getElementById("profileBMIStatusBadge");
        if (profile.bmi < 18.5) {
            statusBadge.textContent = "Underweight";
            statusBadge.className = "badge-pill badge-high";
        } else if (profile.bmi < 25) {
            statusBadge.textContent = "Normal Range";
            statusBadge.className = "badge-pill badge-low";
        } else if (profile.bmi < 30) {
            statusBadge.textContent = "Overweight";
            statusBadge.className = "badge-pill badge-medium";
        } else {
            statusBadge.textContent = "Obese Range";
            statusBadge.className = "badge-pill badge-critical";
        }

        // Update welcome text, header profile name and avatar letter with new profile name
        document.querySelectorAll(".patient-name-placeholder").forEach(el => el.textContent = profile.name);
        document.getElementById("userNameDisplay").textContent = profile.name;
        document.getElementById("avatarLetter").textContent = profile.name.charAt(0).toUpperCase();

        updateDashboardWidgets();

    } catch (e) {
        console.error("Failed to load profile details", e);
    }
}

async function savePatientProfile(event) {
    event.preventDefault();
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    
    const payload = {
        name: document.getElementById("profileName").value.trim(),
        age: parseInt(document.getElementById("profileAge").value),
        gender: document.getElementById("profileGender").value,
        height: parseFloat(document.getElementById("profileHeight").value),
        weight: parseFloat(document.getElementById("profileWeight").value),
        blood_group: document.getElementById("profileBloodGroup").value.trim() || "Unknown",
        emergency_contact: document.getElementById("profileEmergencyContact").value.trim() || "None",
        medical_history: document.getElementById("profileHistory").value.trim() || "None",
        allergies: document.getElementById("profileAllergies").value.trim() || "None",
        profile_picture: ""
    };

    try {
        const res = await fetch(`${API}/profile`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            showToast("Profile credentials updated successfully", "success");
            await loadPatientProfileDetails();
        }
    } catch (e) {
        showToast("Failed to update profile", "error");
    }
}

// Download report
function exportPatientReportPDF() {
    if (!currentPredictionResult) return;
    downloadSpecificPDF(currentPredictionResult._id);
}

function downloadSpecificPDF(id) {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    showToast("Generating clinical PDF report...", "info");
    
    window.open(`${API}/predictions/${id}/pdf?authorization=Bearer ${token}`, "_blank");
}

// Recovery Pre-configurator
function startRecoveryChecklist() {
    if (!currentPredictionResult) return;
    switchTab("recoveryTab", document.querySelector("[onclick*='recoveryTab']"));
    
    // Auto configure checklist prompts
    showToast(`Recovery checklists pre-configured for ${currentPredictionResult.disease}!`, "info");
}

// Disease Knowledge center
function renderKnowledgeList() {
    const container = document.getElementById("knowledgeListContainer");
    if (!container) return;

    container.innerHTML = "";
    Object.keys(DISEASE_DB).forEach(key => {
        const item = document.createElement("div");
        item.className = "knowledge-list-item";
        item.textContent = DISEASE_DB[key].name;
        item.addEventListener("click", () => {
            document.querySelectorAll(".knowledge-list-item").forEach(el => el.classList.remove("active"));
            item.classList.add("active");
            showKnowledgeDetail(key);
        });
        container.appendChild(item);
    });
}

function showKnowledgeDetail(key) {
    const data = DISEASE_DB[key];
    const container = document.getElementById("knowledgeDetailContainer");
    if (!container) return;

    container.innerHTML = `
        <h2 style="font-size: 24px; font-weight:700; color: var(--primary); margin-bottom:8px;">${data.name}</h2>
        <span class="badge-pill badge-medium" style="background: var(--primary-light); color: var(--primary); margin-bottom: 12px; display:inline-block;">Risk Level: ${data.risk_level}</span>
        <p style="font-size: 14px; color: var(--text-secondary); margin-bottom:20px; line-height:1.5;">${data.description}</p>
        
        <div style="display:grid; grid-template-columns:1fr; gap:16px;">
            <div class="guidance-box" style="margin-top:0;">
                <div class="guidance-title"><i class="fa-solid fa-circle-exclamation"></i> Common Symptoms</div>
                <div class="guidance-text">${data.symptoms.join(", ")}</div>
            </div>
            <div class="guidance-box" style="margin-top:0;">
                <div class="guidance-title"><i class="fa-solid fa-dna"></i> Transmission & Causes</div>
                <div class="guidance-text">${data.causes.join(", ")}</div>
            </div>
            <div class="guidance-box" style="margin-top:0;">
                <div class="guidance-title"><i class="fa-solid fa-shield-halved"></i> Prevention Tips</div>
                <div class="guidance-text">${data.prevention.join(", ")}</div>
            </div>
            <div class="guidance-box" style="margin-top:0;">
                <div class="guidance-title"><i class="fa-solid fa-utensils"></i> Recommended Foods (To Eat / To Avoid)</div>
                <div class="guidance-text"><b>Eat:</b> ${data.foods_to_eat.join(", ")}<br/><b>Avoid:</b> ${data.foods_to_avoid.join(", ")}</div>
            </div>
            <div class="guidance-box" style="margin-top:0;">
                <div class="guidance-title"><i class="fa-solid fa-laptop-medical"></i> Common Treatments</div>
                <div class="guidance-text">${data.treatments.join(", ")}</div>
            </div>
            <div class="guidance-box" style="margin-top:0;">
                <div class="guidance-title"><i class="fa-solid fa-clock"></i> Typical Recovery Timeline</div>
                <div class="guidance-text">${data.timeline}</div>
            </div>
        </div>
    `;
}

function filterKnowledgeBase() {
    const query = document.getElementById("knowledgeSearchInput").value.toLowerCase();
    document.querySelectorAll(".knowledge-list-item").forEach(item => {
        if (item.textContent.toLowerCase().includes(query)) {
            item.style.display = "block";
        } else {
            item.style.display = "none";
        }
    });
}

// Chart Initializations
function initializeCharts() {
    const sleepCtx = document.getElementById("sleepChart");
    const recoveryCtx = document.getElementById("recoveryProgressChart");

    if (!sleepCtx || !recoveryCtx) return;

    if (sleepChart) sleepChart.destroy();
    if (recoveryChart) recoveryChart.destroy();

    sleepChart = new Chart(sleepCtx, {
        type: "line",
        data: {
            labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            datasets: [{
                label: "Sleep Duration (Hours)",
                data: sleepHoursList,
                borderColor: "#1a73e8",
                backgroundColor: "rgba(26, 115, 232, 0.08)",
                tension: 0.3,
                fill: true,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false }, ticks: { font: { family: "Outfit" } } },
                y: { grid: { color: "rgba(0,0,0,0.04)" }, ticks: { font: { family: "Outfit" } } }
            }
        }
    });

    const trendScores = [88, 89, 90, 88, 91, 93, 92];
    recoveryChart = new Chart(recoveryCtx, {
        type: "line",
        data: {
            labels: ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7"],
            datasets: [{
                label: "Health Index Score",
                data: trendScores,
                borderColor: "#007b83",
                backgroundColor: "rgba(0, 123, 131, 0.08)",
                tension: 0.3,
                fill: true,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false }, ticks: { font: { family: "Outfit" } } },
                y: { grid: { color: "rgba(0,0,0,0.04)" }, ticks: { font: { family: "Outfit" } } }
            }
        }
    });
}

function handleLogout() {
    localStorage.clear();
    sessionStorage.clear();
    showToast("Signed out successfully.", "info");
    setTimeout(() => {
        window.location.href = "login.html";
    }, 1000);
}

function roundVal(v) {
    return Math.round(v * 10) / 10;
}
