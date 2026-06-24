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
        "timeline": "Typically 7 to 14 days, though fatigue can persist longer."
    },
    "flu": {
        "name": "Influenza (Flu)",
        "description": "A highly infectious respiratory viral illness marked by rapid onset of fever, shivering, and body aches.",
        "causes": ["Influenza A or B viral transmission", "Inhaling sneeze or cough droplets", "Direct physical contact"],
        "symptoms": ["Sudden high fever", "Muscle and joint pains", "Dry cough & sore throat", "Headache & chills", "Fatigue"],
        "prevention": ["Annual flu vaccination shot", "Avoiding crowds during flu season", "Sanitizing hands"],
        "treatments": ["Complete bed rest", "Antiviral medications if caught early", "Adequate hydration"],
        "timeline": "Usually resolves in 5 to 7 days."
    },
    "cold": {
        "name": "Common Cold",
        "description": "A mild, self-limiting viral infection of the nose, throat, and sinuses.",
        "causes": ["Rhinovirus or common coronaviruses", "Exposure to infected droplets", "Low immune defenses"],
        "symptoms": ["Runny or stuffy nose", "Sore throat & sneezing", "Mild dry cough", "Low-grade fever", "Fatigue"],
        "prevention": ["Wash hands frequently", "Avoid sharing personal cups/utensils", "Maintain daily vitamins"],
        "treatments": ["Hydration", "Saline sprays & throat lozenges", "Over-the-counter decongestants"],
        "timeline": "Usually clears in 3 to 10 days."
    },
    "dengue": {
        "name": "Dengue Fever",
        "description": "A tropical, mosquito-borne viral disease characterized by sudden high fever, rash, and intense joint pain.",
        "causes": ["Bite of an Aedes mosquito carrying the Dengue virus", "Standing water facilitating mosquito breeding"],
        "symptoms": ["Sudden high fever", "Pain behind the eyes", "Severe joint & muscle pain ('breakbone')", "Skin rash", "Vomiting"],
        "prevention": ["Eliminate standing water", "Apply mosquito repellents (DEET)", "Wear long-sleeved clothing"],
        "treatments": ["Acetaminophen/paracetamol (Avoid NSAIDs/Aspirin)", "Complete bed rest", "Electrolyte fluids"],
        "timeline": "Fever lasts 2-7 days; full recovery takes 1-2 weeks."
    },
    "malaria": {
        "name": "Malaria",
        "description": "A serious, mosquito-borne parasitic blood infection causing cyclical high fever, shaking chills, and sweating.",
        "causes": ["Plasmodium parasite from female Anopheles mosquito bite"],
        "symptoms": ["Cyclical high fever", "Severe shivering and chills", "Profuse sweating", "Headache", "Nausea & vomiting"],
        "prevention": ["Use insecticide-treated bed nets", "Indoor insect sprays", "Prophylactic pills when traveling"],
        "treatments": ["Prescription antimalarial pills (Chloroquine, Artemisinin)"],
        "timeline": "Varies by parasite; recovery takes 1 to 3 weeks on medication."
    },
    "typhoid": {
        "name": "Typhoid Fever",
        "description": "A systemic bacterial infection caused by Salmonella Typhi, primarily spread through contaminated food or water.",
        "causes": ["Ingesting Salmonella Typhi bacteria", "Poor sanitation & hand hygiene"],
        "symptoms": ["Sustained high fever", "Headache & abdominal pain", "Diarrhea or constipation", "Loss of appetite", "Fatigue"],
        "prevention": ["Drink bottled or boiled water", "Eat fully cooked food", "Get typhoid vaccination"],
        "treatments": ["Prescription antibiotics", "Continuous fluid intake"],
        "timeline": "Symptom improvement in 3-5 days on antibiotics; recovery 2-3 weeks."
    },
    "migraine": {
        "name": "Migraine Headache",
        "description": "A neurological condition causing throbbing, severe headaches, usually on one side of the head, with sensory disturbances.",
        "causes": ["Genetics", "Environmental triggers (lights, noises, stress)", "Dehydration or lack of sleep"],
        "symptoms": ["Severe throbbing headache", "Sensitivity to light/sound", "Nausea or vomiting", "Dizziness"],
        "prevention": ["Identify and avoid trigger foods", "Maintain regular sleep cycles", "Stay hydrated"],
        "treatments": ["Pain relievers", "Triptans", "Quiet, dark room resting"],
        "timeline": "Individual attacks last 4 to 72 hours."
    },
    "gastroenteritis": {
        "name": "Gastroenteritis (Stomach Flu)",
        "description": "An acute inflammation of the stomach and intestinal lining, commonly causing watery diarrhea and vomiting.",
        "causes": ["Norovirus or Rotavirus infection", "Eating spoiled or contaminated food"],
        "symptoms": ["Watery diarrhea & stomach cramps", "Nausea and vomiting", "Low-grade fever", "Fatigue"],
        "prevention": ["Wash hands after bathroom use", "Thoroughly cook meats", "Wash raw vegetables"],
        "treatments": ["Oral Rehydration Salts (ORS)", "Bland foods (BRAT diet)", "Avoiding dairy and fats"],
        "timeline": "Typically clears in 2 to 5 days."
    },
    "pneumonia": {
        "name": "Pneumonia",
        "description": "An infection that inflames the air sacs in one or both lungs, which may fill with fluid or pus.",
        "causes": ["Bacterial (Streptococcus)", "Viral (Flu, RSV, COVID)", "Fungal infections"],
        "symptoms": ["Cough with green/yellow phlegm", "Fever & shivering chills", "Shortness of breath", "Sharp chest pain when coughing"],
        "prevention": ["Pneumococcal vaccine", "Flu vaccines", "Avoiding smoking & air pollutants"],
        "treatments": ["Antibiotics (if bacterial)", "Fever control", "Oxygen support if severe"],
        "timeline": "Symptom relief in 1-2 weeks; full lung recovery can take 4-6 weeks."
    },
    "allergy": {
        "name": "Allergies (Allergic Rhinitis)",
        "description": "An immune system hypersensitivity response to foreign environmental allergens such as pollen, mold, or dander.",
        "causes": ["Inhaling airborne pollen or dust mites", "Pet dander", "Mold spores"],
        "symptoms": ["Runny nose & sneezing", "Itchy, watery eyes", "Dry cough & sore throat", "Skin rash or hives"],
        "prevention": ["Use HEPA filters", "Keep windows closed during high pollen days", "Wash bedding weekly"],
        "treatments": ["Antihistamines", "Nasal steroid sprays", "Avoiding allergen triggers"],
        "timeline": "Symptom relief within hours of taking antihistamines; chronic seasonal variations."
    }
};

const SYMPTOMS_LIST = {
    "general": [
        { id: "symptomFever", label: "Fever", key: "fever" },
        { id: "symptomHeadache", label: "Headache", key: "headache" },
        { id: "symptomFatigue", label: "Fatigue", key: "fatigue" },
        { id: "symptomDizziness", label: "Dizziness", key: "dizziness" },
        { id: "symptomJointPain", label: "Joint Pain", key: "joint_pain" },
        { id: "symptomBodyPain", label: "Body Pain", key: "body_pain" },
        { id: "symptomChills", label: "Chills", key: "chills" },
        { id: "symptomWeightLoss", label: "Weight Loss", key: "weight_loss" }
    ],
    "respiratory": [
        { id: "symptomCough", label: "Cough", key: "cough" },
        { id: "symptomSoreThroat", label: "Sore Throat", key: "sore_throat" },
        { id: "symptomRunnyNose", label: "Runny Nose", key: "runny_nose" },
        { id: "symptomLossSmell", label: "Loss of Smell", key: "loss_of_smell" },
        { id: "symptomLossTaste", label: "Loss of Taste", key: "loss_of_taste" },
        { id: "symptomShortBreath", label: "Shortness of Breath", key: "shortness_of_breath" }
    ],
    "digestive": [
        { id: "symptomVomiting", label: "Vomiting", key: "vomiting" },
        { id: "symptomDiarrhea", label: "Diarrhea", key: "diarrhea" },
        { id: "symptomChestPain", label: "Chest Pain", key: "chest_pain" },
        { id: "symptomNausea", label: "Nausea", key: "nausea" },
        { id: "symptomAbdominal", label: "Abdominal Pain", key: "abdominal_pain" }
    ]
};

// Recovery state trackers
let waterCups = 0;
let sleepHoursList = [7.5, 8.0, 7.0, 6.5, 8.0, 7.5, 8.0];
let sleepChart = null;
let recoveryChart = null;
let currentPredictionResult = null;

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Sync User Session credentials
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    if (!token || !user) {
        window.location.href = "login.html";
        return;
    }

    // Set Welcome Display elements
    document.querySelectorAll(".patient-name-placeholder").forEach(el => el.textContent = user);
    document.getElementById("userNameDisplay").textContent = user;
    document.getElementById("avatarLetter").textContent = user.charAt(0).toUpperCase();

    // 2. Load Patient Profile details from localStorage
    loadPatientProfileDetails();

    // 3. Render Symptom Checker Chips
    renderSymptomChips();

    // 4. Render Disease Knowledge sidebar list
    renderKnowledgeList();

    // 5. Hydration and Checklists defaults
    waterCups = parseInt(localStorage.getItem("water_intake") || "0");
    updateWaterCupDisplay();
    updateRecoveryProgress();

    // 6. Fetch historical health checks from server
    await loadHistoryData();

    // 7. Initialize Sleep & Recovery Charts
    initializeCharts();
});

// Tab Nav Controller
function switchTab(tabId, element) {
    document.querySelectorAll(".tab-pane").forEach(pane => {
        pane.classList.remove("active");
    });
    document.querySelectorAll(".nav-item").forEach(item => {
        item.classList.remove("active");
    });

    const targetPane = document.getElementById(tabId);
    if (targetPane) targetPane.classList.add("active");
    if (element) element.classList.add("active");

    const titleEl = document.getElementById("currentTabTitle");
    if (titleEl && element) {
        titleEl.textContent = element.querySelector("span").textContent;
    }

    // Refresh charts on tab activation
    if (tabId === "recoveryTab") {
        setTimeout(() => {
            initializeCharts();
        }, 100);
    }
}

// Draw Symptom Chips dynamically
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
}

// Filter symptoms chips based on search text input
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

// Toast helpers
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

// Fetch checking history
async function loadHistoryData() {
    const token = localStorage.getItem("token");
    try {
        const response = await fetch(`${API}/history`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (response.status === 401) {
            localStorage.clear();
            showToast("Session expired. Please log in.", "error");
            setTimeout(() => window.location.href = "login.html", 1200);
            return;
        }

        if (!response.ok) throw new Error("History loading failed.");

        historyData = await response.json();
        
        // Show body content
        document.body.style.setProperty("display", "flex", "important");

        updateDashboardWidgets();
        renderHistoryTables();

    } catch (err) {
        console.error("History fetch error:", err);
        document.body.style.setProperty("display", "flex", "important");
    }
}

// Update dashboard widget metrics
function updateDashboardWidgets() {
    const checksCount = historyData.length;
    document.getElementById("statChecksCount").textContent = checksCount;

    // Calculate score (mock logic based on symptoms and habits)
    let score = 95;
    if (historyData.length > 0) {
        const lastCheck = historyData[0];
        const bp = parseInt(lastCheck.vital_bp_sys || 120);
        const temp = parseFloat(lastCheck.vital_temp || 36.8);
        const spo2 = parseInt(lastCheck.vital_spo2 || 98);

        if (bp > 140 || temp > 38.5 || spo2 < 94) {
            score = 65; // Critical/High
        } else if (bp > 130 || temp > 37.8 || spo2 < 96) {
            score = 80;
        }
    }
    
    // Impact of water and tasks on score
    const tasksDone = document.querySelectorAll("#recoveryTab input[type='checkbox']:checked").length;
    const waterScoreFactor = Math.min(waterCups * 2, 16); // max +16
    score = Math.min(score - (4 - tasksDone) * 5 + waterScoreFactor, 100);
    
    const scoreEl = document.getElementById("dashboardHealthScore");
    if (scoreEl) {
        scoreEl.textContent = Math.round(score);
        // Highlight circle border
        const circle = scoreEl.parentElement;
        if (score >= 90) {
            circle.style.borderColor = "var(--success)";
        } else if (score >= 75) {
            circle.style.borderColor = "var(--warning)";
        } else {
            circle.style.borderColor = "var(--danger)";
        }
    }
}

// Render history records
function renderHistoryTables() {
    const list = document.getElementById("dashboardChecksHistory");
    if (!list) return;

    list.innerHTML = "";

    if (historyData.length === 0) {
        list.innerHTML = `<tr><td colspan="4" class="empty-state">No symptoms checks run yet.</td></tr>`;
        return;
    }

    historyData.slice(0, 5).forEach(item => {
        const date = item.timestamp ? new Date(item.timestamp).toLocaleDateString() : new Date().toLocaleDateString();
        const bp = parseInt(item.vital_bp_sys || 120);
        const temp = parseFloat(item.vital_temp || 36.8);
        const spo2 = parseInt(item.vital_spo2 || 98);

        let riskClass = "badge-low";
        let riskText = "Low";
        if (bp > 140 || temp > 38.5 || spo2 < 94) {
            riskClass = "badge-critical";
            riskText = "Critical";
        } else if (bp > 130 || temp > 37.8 || spo2 < 96) {
            riskClass = "badge-high";
            riskText = "High";
        } else if (parseInt(item.confidence) > 80) {
            riskClass = "badge-medium";
            riskText = "Medium";
        }

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${date}</td>
            <td><strong>${item.disease}</strong></td>
            <td>${item.confidence || "85%"}</td>
            <td><span class="badge-pill ${riskClass}">${riskText}</span></td>
        `;
        list.appendChild(tr);
    });
}

// Submit Symptom check
async function runSymptomPrediction(event) {
    event.preventDefault();
    const token = localStorage.getItem("token");

    // Gather active symptoms (from selection chips)
    const payload = {};
    document.querySelectorAll(".symptom-chip").forEach(chip => {
        payload[chip.dataset.key] = chip.classList.contains("selected") ? 1 : 0;
    });

    // Gather Vitals
    const temp = parseFloat(document.getElementById("checkerTemp").value);
    const hr = parseInt(document.getElementById("checkerHR").value);
    const bpSys = parseInt(document.getElementById("checkerBPSys").value);
    const bpDia = parseInt(document.getElementById("checkerBPDia").value);
    const spo2 = parseInt(document.getElementById("checkerSpO2").value);

    // Profile metadata
    payload.patient_name = localStorage.getItem("user");
    payload.vital_temp = temp;
    payload.vital_hr = hr;
    payload.vital_bp_sys = bpSys;
    payload.vital_bp_dia = bpDia;
    payload.vital_spo2 = spo2;

    // Loading State
    const btn = document.querySelector("#checkerForm button[type='submit']");
    const originalText = btn.innerHTML;
    btn.innerHTML = `<div class="spinner" style="width: 20px; height: 20px; border-width: 2px; margin-bottom: 0;"></div><span>Analyzing symptom profile...</span>`;
    btn.disabled = true;

    // Reset results views
    document.getElementById("checkerPlaceholder").classList.remove("hidden");
    document.getElementById("checkerResultContent").classList.add("hidden");

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
            localStorage.clear();
            showToast("Session expired. Redirecting...", "error");
            setTimeout(() => window.location.href = "login.html", 1200);
            return;
        }

        if (!response.ok) throw new Error("Check prediction request failed.");

        const result = await response.json();
        currentPredictionResult = result;

        setTimeout(() => {
            // Render Outputs
            document.getElementById("outDiseaseName").textContent = result.disease;
            document.getElementById("outConfidenceText").textContent = result.confidence;
            
            const confVal = parseInt(result.confidence);
            document.getElementById("outGaugeFill").style.width = confVal + "%";

            // Risk Assessment
            const riskBadge = document.getElementById("outRiskBadge");
            const riskText = document.getElementById("outRiskText");
            if (bpSys > 140 || temp > 38.5 || spo2 < 94) {
                riskBadge.className = "risk-indicator critical";
                riskText.textContent = "Critical Risk Level";
            } else if (bpSys > 130 || temp > 37.8 || spo2 < 96) {
                riskBadge.className = "risk-indicator high";
                riskText.textContent = "High Risk Level";
            } else if (confVal > 80) {
                riskBadge.className = "risk-indicator medium";
                riskText.textContent = "Medium Risk Level";
            } else {
                riskBadge.className = "risk-indicator low";
                riskText.textContent = "Low Risk Level";
            }

            // Description and Guidelines
            document.getElementById("outDescription").textContent = result.metadata.description;
            document.getElementById("outFoodsEat").textContent = result.metadata.foods_to_eat.join(", ");
            document.getElementById("outFoodsAvoid").textContent = result.metadata.foods_to_avoid.join(", ");
            document.getElementById("outHydration").textContent = result.metadata.hydration;
            document.getElementById("outSleep").textContent = result.metadata.sleep;
            document.getElementById("outActions").textContent = result.metadata.actions.join(". ");

            // Top Matches list
            const matchesContainer = document.getElementById("outTopMatchesList");
            matchesContainer.innerHTML = "";
            (result.top_3_diseases || []).forEach(match => {
                const chip = document.createElement("span");
                chip.className = "symptom-chip selected";
                chip.style.fontSize = "11px";
                chip.style.padding = "4px 10px";
                chip.textContent = `${match.disease} (${match.confidence})`;
                matchesContainer.appendChild(chip);
            });

            // Reveal Content
            document.getElementById("checkerPlaceholder").classList.add("hidden");
            document.getElementById("checkerResultContent").classList.remove("hidden");

            // Reset form selections
            document.querySelectorAll(".symptom-chip").forEach(c => c.classList.remove("selected"));
            document.querySelectorAll(".symptom-chip i").forEach(i => i.className = "fa-solid fa-plus");
            document.getElementById("checkerForm").reset();

            // Refresh History
            loadHistoryData();
            showToast("AI wellness analysis completed!", "success");

            btn.innerHTML = originalText;
            btn.disabled = false;
        }, 1200);

    } catch (err) {
        showToast("Error processing symptom check.", "error");
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// Add water cups intake tracker
function addWaterCup(change) {
    waterCups = Math.max(0, Math.min(8, waterCups + change));
    localStorage.setItem("water_intake", waterCups);
    updateWaterCupDisplay();
    updateRecoveryProgress();
}

function updateWaterCupDisplay() {
    const textEl = document.getElementById("recoveryWaterDisplay");
    const progressEl = document.getElementById("statWaterProgress");
    const pctEl = document.getElementById("statWaterPct");

    if (textEl) textEl.textContent = `${waterCups} / 8 Cups`;
    if (progressEl) progressEl.textContent = `${waterCups} / 8 cups`;
    
    const pct = Math.round((waterCups / 8) * 100);
    if (pctEl) pctEl.textContent = `${pct}% target reached`;

    // Fill glass icons
    const icons = document.querySelectorAll("#waterCupsContainer i");
    icons.forEach((icon, index) => {
        if (index < waterCups) {
            icon.className = "fa-solid fa-glass-water filled";
        } else {
            icon.className = "fa-solid fa-glass-water";
        }
    });

    const chkHydrate = document.getElementById("chkHydrate");
    if (chkHydrate) {
        chkHydrate.checked = waterCups >= 8;
    }
}

// Log sleep hours
function logSleepHours() {
    const hrs = parseFloat(document.getElementById("sleepHoursInput").value);
    if (hrs > 0 && hrs <= 24) {
        sleepHoursList.shift();
        sleepHoursList.push(hrs);
        showToast(`Logged ${hrs} sleep hours!`, "success");
        initializeCharts();
    }
}

// Update recovery checklist score
function updateRecoveryProgress() {
    const total = 4;
    const checked = document.querySelectorAll("#recoveryTab input[type='checkbox']:checked").length;
    
    const countEl = document.getElementById("statTasksCount");
    const pctEl = document.getElementById("statTasksPct");

    if (countEl) countEl.textContent = `${checked} / ${total} done`;
    if (pctEl) pctEl.textContent = `${Math.round((checked / total) * 100)}% done`;

    updateDashboardWidgets();
}

// Add condition to recovery checklist
function startRecoveryChecklist() {
    if (!currentPredictionResult) return;
    switchTab("recoveryTab", document.querySelector("[onclick*='recoveryTab']"));
    
    // Prefill checklist prompts
    showToast(`Recovery assistant pre-configured for ${currentPredictionResult.disease}!`, "info");
}

// Render Disease Knowledge list
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

// Filter Disease center
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

// Load patient profile data
function loadPatientProfileDetails() {
    const name = localStorage.getItem("user");
    const age = localStorage.getItem("profile_age") || "25";
    const gender = localStorage.getItem("profile_gender") || "Male";
    const height = localStorage.getItem("profile_height") || "175";
    const weight = localStorage.getItem("profile_weight") || "70";
    const history = localStorage.getItem("profile_history") || "None";
    const allergies = localStorage.getItem("profile_allergies") || "None";

    // Set spans
    const ageEl = document.getElementById("profileAgeVal");
    const genderEl = document.getElementById("profileGenderVal");
    const heightEl = document.getElementById("profileHeightVal");
    const weightEl = document.getElementById("profileWeightVal");
    
    if (ageEl) ageEl.textContent = age;
    if (genderEl) genderEl.textContent = gender;
    if (heightEl) heightEl.textContent = height + " cm";
    if (weightEl) weightEl.textContent = weight + " kg";

    // Set Form inputs
    const pName = document.getElementById("profileName");
    const pAge = document.getElementById("profileAge");
    const pGender = document.getElementById("profileGender");
    const pHeight = document.getElementById("profileHeight");
    const pWeight = document.getElementById("profileWeight");
    const pHistory = document.getElementById("profileHistory");
    const pAllergies = document.getElementById("profileAllergies");

    if (pName) pName.value = name;
    if (pAge) pAge.value = age;
    if (pGender) pGender.value = gender;
    if (pHeight) pHeight.value = height;
    if (pWeight) pWeight.value = weight;
    if (pHistory) pHistory.value = history === "None" ? "" : history;
    if (pAllergies) pAllergies.value = allergies === "None" ? "" : allergies;
}

// Save patient profile
function savePatientProfile(event) {
    event.preventDefault();
    const name = document.getElementById("profileName").value.trim();
    const age = document.getElementById("profileAge").value;
    const gender = document.getElementById("profileGender").value;
    const height = document.getElementById("profileHeight").value;
    const weight = document.getElementById("profileWeight").value;
    const history = document.getElementById("profileHistory").value.trim() || "None";
    const allergies = document.getElementById("profileAllergies").value.trim() || "None";

    localStorage.setItem("user", name);
    localStorage.setItem("profile_age", age);
    localStorage.setItem("profile_gender", gender);
    localStorage.setItem("profile_height", height);
    localStorage.setItem("profile_weight", weight);
    localStorage.setItem("profile_history", history);
    localStorage.setItem("profile_allergies", allergies);

    document.querySelectorAll(".patient-name-placeholder").forEach(el => el.textContent = name);
    document.getElementById("userNameDisplay").textContent = name;
    document.getElementById("avatarLetter").textContent = name.charAt(0).toUpperCase();

    loadPatientProfileDetails();
    showToast("Profile credentials updated!", "success");
}

// Export patient diagnosis report (Clean print frame)
function exportPatientReportPDF() {
    if (!currentPredictionResult) return;

    const data = currentPredictionResult;
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
        <html>
        <head>
            <title>Personal Health Diagnosis Report</title>
            <style>
                body { font-family: 'Outfit', sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
                .header { text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
                .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
                .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; background: #f8fafc; padding: 20px; border-radius: 12px; margin-bottom: 30px; }
                .meta div { font-size: 14px; }
                .disease-box { border: 1.5px solid #e2e8f0; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 30px; }
                .disease-name { font-size: 28px; font-weight: bold; color: #0f172a; margin-bottom: 4px; }
                .confidence { font-size: 16px; font-weight: bold; color: #10b981; }
                .vitals-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; border-top: 1px dashed #cbd5e1; border-bottom: 1px dashed #cbd5e1; padding: 20px 0; margin-bottom: 30px; }
                .vital-item { text-align: center; }
                .vital-item span { font-size: 12px; color: #64748b; display: block; }
                .vital-item strong { font-size: 16px; color: #0f172a; }
                .advice-box { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 0 12px 12px 0; margin-bottom: 40px; }
                .footer { text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="logo">MediPredict AI - Health Report</div>
                <div style="font-size: 14px; color: #64748b; margin-top: 4px;">AI Symptom Checker Outcome</div>
            </div>
            
            <div class="meta">
                <div>
                    <strong>Patient Name:</strong> ${localStorage.getItem("user")}<br>
                    <strong>Age / Gender:</strong> ${localStorage.getItem("profile_age") || "25"} / ${localStorage.getItem("profile_gender") || "Male"}<br>
                </div>
                <div>
                    <strong>Date Generated:</strong> ${new Date().toLocaleString()}<br>
                    <strong>Report ID:</strong> MD-${Math.floor(100000 + Math.random() * 900000)}
                </div>
            </div>

            <div class="disease-box">
                <div style="font-size: 12px; text-transform: uppercase; color: #64748b;">Predicted Condition</div>
                <div class="disease-name">${data.disease}</div>
                <div class="confidence">AI Confidence Level: ${data.confidence}</div>
            </div>

            <div class="vitals-grid">
                <div class="vital-item"><span>Temperature</span><strong>${data.vital_temp || "36.8"}°C</strong></div>
                <div class="vital-item"><span>Heart Rate</span><strong>${data.vital_hr || "72"} bpm</strong></div>
                <div class="vital-item"><span>Blood Pressure</span><strong>${data.vital_bp_sys || "120"}/${data.vital_bp_dia || "80"}</strong></div>
                <div class="vital-item"><span>SpO2 Level</span><strong>${data.vital_spo2 || "98"}%</strong></div>
            </div>

            <div class="advice-box">
                <strong style="display: block; margin-bottom: 8px; color: #1e3a8a;">Recommended Actions & Advice:</strong>
                ${data.metadata.description}<br><br>
                <strong>Home Remedies:</strong> ${data.metadata.remedies.join(". ")}
            </div>

            <div class="footer">
                This is an AI-generated health assistance report. For clinical treatment, please seek professional medical care.
            </div>
            
            <script>
                window.onload = function() {
                    window.print();
                    setTimeout(() => window.close(), 500);
                }
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

// Chart Initializations
function initializeCharts() {
    const sleepCtx = document.getElementById("sleepChart");
    const recoveryCtx = document.getElementById("recoveryProgressChart");

    if (!sleepCtx || !recoveryCtx) return;

    if (sleepChart) sleepChart.destroy();
    if (recoveryChart) recoveryChart.destroy();

    // Sleep line chart
    sleepChart = new Chart(sleepCtx, {
        type: "line",
        data: {
            labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            datasets: [{
                label: "Sleep Duration (Hours)",
                data: sleepHoursList,
                borderColor: "#1a73e8",
                backgroundColor: "rgba(26, 115, 232, 0.1)",
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

    // Recovery trend score graph (Simulated mock trend based on health metrics)
    const trendScores = [88, 89, 90, 88, 91, 93, 92];
    recoveryChart = new Chart(recoveryCtx, {
        type: "line",
        data: {
            labels: ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7"],
            datasets: [{
                label: "Health Index Score",
                data: trendScores,
                borderColor: "#007b83",
                backgroundColor: "rgba(0, 123, 131, 0.1)",
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
    showToast("Signed out successfully.", "info");
    setTimeout(() => {
        window.location.href = "login.html";
    }, 1000);
}
