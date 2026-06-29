from fastapi import APIRouter, Header, HTTPException, Depends, Query, Response
from database import predictions
from utils.auth import decode_access_token
from schemas import PredictRequest
import joblib
import os
from datetime import datetime
from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.graphics.shapes import Drawing, Rect, Line, String

router = APIRouter()

BASE_DIR = os.path.dirname(os.path.dirname(__file__))

model = joblib.load(
    os.path.join(
        BASE_DIR,
        "models",
        "disease_model.pkl"
    )
)

encoder = joblib.load(
    os.path.join(
        BASE_DIR,
        "models",
        "label_encoder.pkl"
    )
)

# Authentication dependency
def verify_token(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Session token required. Please sign in.")
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired session. Please sign in again.")
    return payload

DISEASE_METADATA = {
    "covid": {
        "description": "Coronavirus disease (COVID-19) is a contagious respiratory illness caused by the SARS-CoV-2 virus, which can range from mild symptoms to severe clinical pneumonia.",
        "causes": ["Inhalation of airborne viral particles", "Close contact with infected individuals", "Touching contaminated surfaces"],
        "symptoms": ["Fever", "Cough", "Shortness of breath", "Loss of smell or taste", "Fatigue", "Body aches"],
        "actions": ["Isolate immediately in a well-ventilated room", "Monitor oxygen levels regularly with a pulse oximeter", "Seek emergency medical help if oxygen levels fall below 94% or if breathing is labored"],
        "remedies": ["Stay well hydrated with warm liquids", "Use saline gargles for sore throat relief", "Take paracetamol for fever control"],
        "recovery_tips": ["Rest extensively even if symptoms are mild", "Avoid intense physical workouts for 14 days", "Practice breathing exercises daily"],
        "prevention_tips": ["Keep vaccinations up to date", "Wear masks in crowded indoor environments", "Wash hands regularly"],
        "foods_to_eat": ["Citrus fruits", "Warm chicken or vegetable broths", "Eggs, fish, or plant-based proteins"],
        "foods_to_avoid": ["Sugary snacks and beverages", "Highly processed fast foods", "Cold dairy if mucus is thick"],
        "hydration": "Drink 2.5 to 3 liters of warm water, oral rehydration salts (ORS), or herbal teas daily.",
        "exercise": "Strict rest. Do not perform physical exercises during active infection.",
        "sleep": "Ensure 9-10 hours of sleep per day to aid immune response.",
        "recovery_time": "10 to 14 days",
        "medicines": "Paracetamol, Vitamin C, Zinc supplements. (Seek Doctor Prescription for antivirals)",
        "emergency_signs": "Difficulty breathing, persistent chest pain, confusion, blue lips/face.",
        "doctor_recommendation": "Consult a General Physician or Pulmonologist if breathing gets heavy.",
        "similar_diseases": ["Influenza (Flu)", "Common Cold", "Pneumonia"]
    },
    "flu": {
        "description": "Influenza (flu) is a highly infectious respiratory illness caused by influenza viruses, marked by rapid onset of fever and strong body aches.",
        "causes": ["Influenza A or B viral infection", "Inhaling respiratory droplets from coughs or sneezes", "Hand-to-face contact after surface contamination"],
        "symptoms": ["High fever", "Severe cough", "Headache", "Intense fatigue", "Joint and body pain", "Chills"],
        "actions": ["Rest at home and avoid contact with others", "Consider antiviral medications if diagnosed early", "Seek medical attention if chest pain or high fever persists"],
        "remedies": ["Keep warm in bed", "Inhale steam or use a cool-mist humidifier", "Gargle salt water"],
        "recovery_tips": ["Stay home for at least 24 hours after fever resolves naturally", "Increase fluid intake gradually"],
        "prevention_tips": ["Receive the annual influenza vaccine", "Avoid touching eyes, nose, or mouth", "Regularly sanitize shared items"],
        "foods_to_eat": ["Warm soups", "Oatmeal and bananas", "Ginger and garlic tea"],
        "foods_to_avoid": ["Alcohol", "Caffeinated drinks", "Tough, high-fiber, hard-to-digest foods"],
        "hydration": "Consume 2.5 liters of water, diluted juices, and warm teas daily.",
        "exercise": "Complete physical rest until fever and body aches are gone for 48 hours.",
        "sleep": "Prioritize 8-9 hours of continuous night sleep plus daytime rests.",
        "recovery_time": "5 to 7 days",
        "medicines": "Paracetamol/Ibuprofen for body ache, cough drops. Antivirals (Oseltamivir) if prescribed.",
        "emergency_signs": "Difficulty breathing, chest pain, sudden dizziness, severe vomiting.",
        "doctor_recommendation": "Consult a General Physician if fever does not drop after 3 days.",
        "similar_diseases": ["COVID-19", "Common Cold", "Adenovirus infection"]
    },
    "cold": {
        "description": "The common cold is a mild, self-limiting viral infection of the upper respiratory tract, primarily affecting the nose and throat.",
        "causes": ["Rhinovirus or common coronavirus infection", "Exposure to infected respiratory droplets", "Inadequate hand hygiene"],
        "symptoms": ["Runny nose", "Sore throat", "Sneezing", "Mild cough", "Low-grade fever", "Fatigue"],
        "actions": ["Get extra rest", "Maintain a balanced diet", "Monitor for sinus pressure or ear pain"],
        "remedies": ["Use saline nasal sprays or rinses", "Drink warm lemon water with honey", "Suck on throat lozenges"],
        "recovery_tips": ["Keep your neck and chest warm", "Avoid exposure to smoke or dry air", "Get plenty of fresh air"],
        "prevention_tips": ["Wash hands frequently with soap", "Avoid sharing cups and utensils", "Maintain a strong immune system"],
        "foods_to_eat": ["Vitamin C-rich fruits", "Warm broth or vegetable soups", "Steamed vegetables"],
        "foods_to_avoid": ["Sugary sodas", "Chilled beverages", "Processed junk food"],
        "hydration": "Drink 2 to 2.5 liters of water, warm herbal teas, or warm water with lemon.",
        "exercise": "Light exercises like walking are fine if symptoms are mild and confined to the head.",
        "sleep": "Aim for 8 hours of sleep per night.",
        "recovery_time": "3 to 10 days",
        "medicines": "Decongestants, saline nasal spray, honey lozenges.",
        "emergency_signs": "Wheezing, severe earache, high fever for over 2 days.",
        "doctor_recommendation": "Consult a General Practitioner if symptoms persist beyond 10 days.",
        "similar_diseases": ["Influenza (Flu)", "Allergic Rhinitis", "Sinusitis"]
    },
    "dengue": {
        "description": "Dengue is a mosquito-borne tropical viral disease causing sudden high fever, rash, and intense joint pain, often called breakbone fever.",
        "causes": ["Bite of an Aedes mosquito infected with the Dengue virus", "Low-lying stagnant water encouraging mosquito breeding"],
        "symptoms": ["Sudden high fever", "Severe headache", "Pain behind the eyes", "Intense joint and muscle pain", "Skin rash", "Vomiting"],
        "actions": ["Consult a doctor for diagnostic blood tests", "Avoid NSAIDs like ibuprofen/aspirin (use paracetamol only)", "Seek emergency care if severe bleeding, abdominal pain, or persistent vomiting occurs"],
        "remedies": ["Sponging with cool water to manage fever", "Complete bed rest", "Drinking fresh papaya leaf juice (under medical guidance)"],
        "recovery_tips": ["Rest extensively during the critical recovery phase", "Monitor platelet count regularly", "Reintroduce physical activity very slowly"],
        "prevention_tips": ["Eliminate standing water around your living areas", "Apply mosquito repellent containing DEET", "Wear long-sleeved clothing and use mosquito nets"],
        "foods_to_eat": ["Electrolyte fluids", "Pomegranate and kiwi fruits", "Easy-to-digest rice porridge"],
        "foods_to_avoid": ["NSAIDs, aspirin, and blood thinners", "Dark-colored foods (makes it harder to detect internal bleeding)", "Spicy, oily foods"],
        "hydration": "Hydration is critical. Drink 3 liters of electrolyte solutions, coconut water, or ORS daily.",
        "exercise": "Strict bed rest. Avoid all forms of exercise during illness and recovery.",
        "sleep": "Aim for 9-10 hours of rest to accelerate platelets recovery.",
        "recovery_time": "7 to 14 days",
        "medicines": "Paracetamol ONLY for pain/fever. DO NOT take Aspirin/Ibuprofen.",
        "emergency_signs": "Bleeding gums, nose bleeds, severe abdominal pain, persistent vomiting, blood in vomit/stool.",
        "doctor_recommendation": "Consult a Physician immediately. Monitor platelet count via CBC test every 24 hours.",
        "similar_diseases": ["Malaria", "Chikungunya", "Zika Virus infection"]
    },
    "malaria": {
        "description": "Malaria is a serious, sometimes life-threatening blood disease transmitted by infected mosquitoes, characterized by cyclical fever and chills.",
        "causes": ["Plasmodium parasite transmission via infected female Anopheles mosquito bite", "Blood transfusions or needle sharing (rare)"],
        "symptoms": ["Cyclical high fever", "Violent shivering and chills", "Profuse sweating", "Headache", "Nausea and vomiting", "Fatigue"],
        "actions": ["Seek immediate medical testing and start prescription antimalarials", "Monitor temperature frequently", "Consult clinical guidelines if jaundice or severe anemia develops"],
        "remedies": ["Take paracetamol for fever control", "Apply cool compresses", "Keep warm during the shivering/chills phase"],
        "recovery_tips": ["Finish the entire course of antimalarial medication even if you feel better", "Get plenty of rest"],
        "prevention_tips": ["Use insecticide-treated bed nets", "Spray indoor living areas with insect repellents", "Take prophylactic antimalarials if traveling to endemic areas"],
        "foods_to_eat": ["Balanced protein meals", "Fresh fruit juices", "Boiled vegetables and soft rice"],
        "foods_to_avoid": ["High-fiber raw vegetables (hard on gut)", "Carbonated soft drinks", "Oily, fried foods"],
        "hydration": "Drink 2.5 to 3 liters of clean, boiled water or fruit juices daily.",
        "exercise": "Strict physical rest. Do not exercise until cleared by a doctor.",
        "sleep": "Ensure 8-9 hours of nightly sleep plus daytime rests.",
        "recovery_time": "7 to 21 days",
        "medicines": "Prescribed Artemisinin-based Combination Therapy (ACT), Chloroquine.",
        "emergency_signs": "Confusion, convulsions, severe breathing difficulty, yellow skin/eyes (jaundice).",
        "doctor_recommendation": "Consult a General Practitioner or Infectious Disease Specialist immediately.",
        "similar_diseases": ["Dengue Fever", "Typhoid Fever", "Yellow Fever"]
    },
    "typhoid": {
        "description": "Typhoid fever is a systemic bacterial infection caused by Salmonella Typhi, usually contracted through contaminated food or water.",
        "causes": ["Ingesting Salmonella Typhi bacteria", "Poor sanitation and inadequate hand hygiene", "Drinking unsafe, non-potable water"],
        "symptoms": ["Sustained high fever", "Headache", "Abdominal pain", "Diarrhea or constipation", "Fatigue", "Loss of appetite"],
        "actions": ["Consult a medical practitioner immediately for critical antibiotic therapy", "Maintain isolation to prevent household spread", "Ensure strict hand sanitization"],
        "remedies": ["Tepid sponging for high fever", "Eating soft, bland, calorie-dense foods", "Drinking warm herbal infusions"],
        "recovery_tips": ["Complete the entire course of prescribed antibiotics", "Avoid returning to food handling duties until cleared by medical tests"],
        "prevention_tips": ["Drink boiled or bottled water only", "Eat thoroughly cooked hot foods", "Wash hands before cooking and eating"],
        "foods_to_eat": ["Bland bananas and boiled potatoes", "Custard, jelly, and soft puddings", "Moist, soft white rice"],
        "foods_to_avoid": ["Raw vegetables and fruits with skins", "Highly spicy curries", "Butter, ghee, and high-fat items"],
        "hydration": "Drink 3 liters of boiled water, ORS, or weak teas to compensate for fluid loss.",
        "exercise": "Complete rest. Physical strain can lead to serious intestinal complications.",
        "sleep": "Ensure 9-10 hours of sleep per day to support tissue healing.",
        "recovery_time": "14 to 28 days",
        "medicines": "Antibiotics (Ciprofloxacin, Ceftriaxone) as prescribed by a physician.",
        "emergency_signs": "Severe sudden abdominal pain, vomiting blood, extreme weakness.",
        "doctor_recommendation": "Immediate consultation with a Physician or Gastroenterologist.",
        "similar_diseases": ["Malaria", "Gastroenteritis", "Hepatitis A"]
    },
    "migraine": {
        "description": "A migraine is a neurological condition characterized by intense, throbbing headaches, often accompanied by sensory disturbances.",
        "causes": ["Neurological abnormalities in the brain", "Environmental triggers (bright lights, loud sounds)", "Hormonal changes or stress"],
        "symptoms": ["Throbbing, one-sided headache", "Sensitivity to light and sound", "Nausea or vomiting", "Dizziness", "Visual aura (blind spots or flashing lights)"],
        "actions": ["Rest in a dark, quiet room", "Apply a cold compress to your forehead or neck", "Take abortive or preventive migraine medication as prescribed"],
        "remedies": ["Perform gentle neck stretches", "Drink a small amount of caffeine (can help block pain signals in early stages)", "Massage the temples with lavender or peppermint oil"],
        "recovery_tips": ["Maintain a regular sleep and meal schedule", "Keep a migraine trigger journal", "Avoid screen time during an attack"],
        "prevention_tips": ["Manage stress through meditation or deep breathing", "Limit intake of trigger foods like aged cheeses, red wine, and artificial sweeteners", "Stay consistently hydrated"],
        "foods_to_eat": ["Magnesium-rich foods (spinach, almonds)", "Ginger tea (helps ease nausea)", "Whole grains"],
        "foods_to_avoid": ["Aged cheese and processed meats", "Artificial sweeteners like aspartame", "Excessive caffeine or alcohol"],
        "hydration": "Drink 2 to 2.5 liters of water daily. Dehydration is a major migraine trigger.",
        "exercise": "Avoid intense exercise during a migraine. Light yoga or stretching is suitable once the headache fades.",
        "sleep": "Aim for a consistent 7-8 hours of sleep. Avoid oversleeping or sleep deprivation.",
        "recovery_time": "4 to 72 hours per episode",
        "medicines": "Triptans, NSAIDs, anti-nausea medications under prescription.",
        "emergency_signs": "Sudden 'thunderclap' headache, fever with stiff neck, weakness/paralysis on one side.",
        "doctor_recommendation": "Consult a Neurologist if frequency exceeds twice a week.",
        "similar_diseases": ["Tension Headache", "Cluster Headache", "Sinus Headache"]
    },
    "gastroenteritis": {
        "description": "Gastroenteritis, commonly known as stomach flu, is an inflammation of the stomach and intestines, usually caused by a viral or bacterial infection.",
        "causes": ["Rotavirus or Norovirus infection", "Consuming contaminated food or water", "Direct contact with infected individuals"],
        "symptoms": ["Watery diarrhea", "Abdominal cramps and pain", "Nausea and vomiting", "Low-grade fever", "Fatigue"],
        "actions": ["Focus on preventing dehydration", "Consult a doctor if you cannot keep fluids down for 24 hours", "Seek care if high fever or bloody stools occur"],
        "remedies": ["Sip electrolyte solutions slowly", "Apply a warm heating pad to the abdomen for cramps", "Eat bland foods like toast and applesauce"],
        "recovery_tips": ["Avoid solid foods for the first few hours until vomiting stops", "Rest your stomach and body", "Wash hands after using the restroom to prevent spread"],
        "prevention_tips": ["Practice thorough handwashing", "Ensure food is prepared under hygienic conditions", "Avoid sharing food, cups, or towels with sick people"],
        "foods_to_eat": ["Bananas, rice, applesauce, toast (BRAT diet)", "Bland broths", "Crackers"],
        "foods_to_avoid": ["Dairy products", "Spicy, greasy, or highly seasoned foods", "Caffeine and alcohol"],
        "hydration": "Drink electrolyte-replacement drinks (ORS), coconut water, or diluted broths in frequent small sips. Target 2.5 to 3 liters.",
        "exercise": "Strict rest. Avoid all physical activities during active vomiting and diarrhea.",
        "sleep": "Ensure 8-9 hours of rest to allow the digestive tract to recover.",
        "recovery_time": "2 to 5 days",
        "medicines": "ORS, Zinc supplements, Probiotics. (Avoid anti-diarrheal meds unless advised).",
        "emergency_signs": "Inability to retain liquids for 24 hours, extreme thirst/dry mouth, confusion, bloody diarrhea.",
        "doctor_recommendation": "Consult a General Practitioner if diarrhea persists over 3 days.",
        "similar_diseases": ["Food Poisoning", "Irritable Bowel Syndrome", "Crohn's Disease flare-up"]
    },
    "pneumonia": {
        "description": "Pneumonia is an infection that inflames the air sacs in one or both lungs, which may fill with fluid or pus, causing cough, fever, and breathing difficulty.",
        "causes": ["Bacterial infection (e.g. Streptococcus pneumoniae)", "Viral infections (e.g. influenza, RSV, Covid)", "Inhaling fungal spores or toxic fumes"],
        "symptoms": ["Cough with green/yellow phlegm", "Fever and sweating", "Shortness of breath", "Sharp chest pain when breathing or coughing", "Fatigue", "Chills"],
        "actions": ["Seek urgent medical examination for chest listening or X-ray", "Take prescribed antibiotics or antivirals exactly as directed", "Monitor blood oxygen saturation (SpO2) closely"],
        "remedies": ["Use a humidifier or inhale steam to loosen lung mucus", "Drink warm peppermint tea to soothe airways", "Take paracetamol for fever control"],
        "recovery_tips": ["Do not rush recovery; lung healing takes time", "Avoid exposing lungs to cold air or chemicals", "Practice deep chest expansion breathing"],
        "prevention_tips": ["Get the pneumococcal vaccine", "Maintain clean indoor air quality", "Avoid smoking and respiratory irritants"],
        "foods_to_eat": ["Warm, nutrient-dense soups", "Leafy green vegetables", "Berries and walnuts"],
        "foods_to_avoid": ["Cold dairy foods (can increase congestion)", "Deep-fried, heavy foods", "Excessive sodium"],
        "hydration": "Drink 2.5 to 3 liters of warm water, warm herbal teas, and broths to thin lung secretions.",
        "exercise": "Strict physical rest. Do not perform physical exercises until cleared by a physician.",
        "sleep": "Ensure 9-10 hours of sleep per day, sleeping slightly elevated to ease breathing.",
        "recovery_time": "2 to 4 weeks",
        "medicines": "Antibiotics (if bacterial), mucolytics, cough suppressants (night only).",
        "emergency_signs": "Oxygen levels below 93%, difficulty breathing at rest, blue skin/fingernails, confusion.",
        "doctor_recommendation": "Urgent consultation with a Pulmonologist or General Physician.",
        "similar_diseases": ["COVID-19", "Acute Bronchitis", "Tuberculosis"]
    },
    "allergy": {
        "description": "An allergy is an immune system reaction to a foreign substance (allergen) that is typically not harmful to most people, such as pollen or dust.",
        "causes": ["Exposure to airborne allergens (pollen, dust mites, pet dander, mold)", "Certain foods or medications", "Insect stings"],
        "symptoms": ["Runny or stuffy nose", "Sneezing", "Itchy or watery eyes", "Skin rash or hives", "Mild dry cough", "Sore throat"],
        "actions": ["Identify and avoid trigger allergens", "Take antihistamines or nasal sprays as recommended by a pharmacist", "Consult an allergist if symptoms are chronic or severe"],
        "remedies": ["Use a saline nasal rinse (Neti pot)", "Apply a cool, damp compress over itchy eyes", "Drink warm herbal tea to soothe throat irritation"],
        "recovery_tips": ["Wash clothes and shower after spending time outdoors to remove pollen", "Keep windows closed during high pollen seasons", "Vacuum carpets regularly with a HEPA filter"],
        "prevention_tips": ["Use allergen-proof covers on pillows and mattresses", "Keep pets out of bedrooms", "Wash bedding weekly in hot water"],
        "foods_to_eat": ["Foods containing natural antihistamines like onions and apples", "Ginger and turmeric (anti-inflammatory)", "Vitamin C-rich foods"],
        "foods_to_avoid": ["Foods that cross-react with pollen (e.g. raw apples, peaches if you have birch allergy)", "Processed foods", "Alcohol"],
        "hydration": "Drink 2 liters of water daily to keep mucous membranes moist.",
        "exercise": "Moderate indoor exercise is acceptable. Avoid outdoor activities when pollen counts are high.",
        "sleep": "Ensure 7-8 hours of sleep per night.",
        "recovery_time": "Varies (Symptom relief in hours after antihistamines)",
        "medicines": "Antihistamines (Cetirizine, Loratadine), nasal corticosteroid sprays.",
        "emergency_signs": "Swelling of lips/tongue, difficulty swallowing, hives all over body, wheezing (Anaphylaxis).",
        "doctor_recommendation": "Consult an Allergist/Immunologist for allergy testing if persistent.",
        "similar_diseases": ["Common Cold", "Vasomotor Rhinitis", "Asthma flare-up"]
    }
}

def explain_prediction(symptoms_input: dict, disease_name: str) -> str:
    disease_symptoms_map = {
        "covid": ["fever", "cough", "headache", "fatigue", "body_pain", "loss_of_smell", "loss_of_taste", "shortness_of_breath", "chills", "sore_throat"],
        "flu": ["fever", "cough", "headache", "fatigue", "runny_nose", "body_pain", "chills", "sore_throat"],
        "cold": ["cough", "fatigue", "sore_throat", "runny_nose", "body_pain", "chills"],
        "dengue": ["fever", "headache", "fatigue", "vomiting", "joint_pain", "body_pain", "skin_rash", "dizziness", "nausea", "chills"],
        "malaria": ["fever", "headache", "fatigue", "vomiting", "dizziness", "body_pain", "nausea", "chills"],
        "typhoid": ["fever", "headache", "fatigue", "vomiting", "diarrhea", "body_pain", "nausea", "abdominal_pain"],
        "migraine": ["headache", "fatigue", "dizziness", "nausea"],
        "gastroenteritis": ["fatigue", "vomiting", "diarrhea", "nausea", "abdominal_pain"],
        "pneumonia": ["fever", "cough", "fatigue", "chest_pain", "body_pain", "shortness_of_breath", "chills"],
        "allergy": ["cough", "sore_throat", "runny_nose", "skin_rash"]
    }
    
    key = disease_name.strip().lower()
    expected_symptoms = disease_symptoms_map.get(key, [])
    
    matching = []
    for sym in expected_symptoms:
        if symptoms_input.get(sym, 0) == 1:
            matching.append(sym.replace("_", " "))
            
    if matching:
        return f"This condition was predicted because you indicated: {', '.join(matching)}, which are classic markers strongly associated with {disease_name}."
    else:
        return f"This condition was predicted based on statistical matching of symptom patterns that align with {disease_name}."

def draw_decorations(canvas, doc):
    canvas.saveState()
    # Draw border
    canvas.setStrokeColor(colors.HexColor("#1a73e8"))
    canvas.setLineWidth(2)
    canvas.rect(20, 20, 572, 752)
    
    # Header
    canvas.setFont('Helvetica-Bold', 8)
    canvas.setFillColor(colors.HexColor("#94a3b8"))
    canvas.drawString(40, 755, "MEDIPREDICT AI - CLINICAL REPORT")
    canvas.drawRightString(572, 755, "OFFICIAL PATIENT DIAGNOSIS")
    
    # Footer
    canvas.drawString(40, 30, "CONFIDENTIAL HEALTH REPORT. Generated by AI diagnosis companion.")
    canvas.drawRightString(572, 30, "Page 1 of 1")
    
    # Accent Bar
    canvas.setFillColor(colors.HexColor("#1a73e8"))
    canvas.rect(20, 762, 572, 10, fill=True, stroke=False)
    canvas.restoreState()

def generate_pdf_report(item):
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=54,
        bottomMargin=54
    )
    
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        textColor=colors.HexColor("#1a73e8"),
        spaceAfter=15
    )
    
    h2_style = ParagraphStyle(
        'DocH2',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=14,
        textColor=colors.HexColor("#0f172a"),
        spaceBefore=12,
        spaceAfter=6
    )
    
    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        textColor=colors.HexColor("#475569"),
        leading=14
    )
    
    bold_style = ParagraphStyle(
        'DocBold',
        parent=body_style,
        fontName='Helvetica-Bold'
    )
    
    story = []
    
    story.append(Paragraph("MediPredict AI", title_style))
    story.append(Paragraph("Clinical Health Diagnosis Report", ParagraphStyle('SubTitle', fontName='Helvetica', fontSize=12, textColor=colors.HexColor("#64748b"), spaceAfter=15)))
    
    patient_name = item.get("patient_name") or "Patient User"
    date_str = item.get("timestamp", datetime.utcnow().isoformat())[:10]
    
    meta_data = [
        [Paragraph("<b>Patient Name:</b>", body_style), Paragraph(patient_name, body_style), Paragraph("<b>Date:</b>", body_style), Paragraph(date_str, body_style)],
        [Paragraph("<b>Report ID:</b>", body_style), Paragraph(item.get("_id", "N/A"), body_style), Paragraph("<b>Vitals Saturation:</b>", body_style), Paragraph(f"SpO2: {item.get('vital_spo2', 98)}%", body_style)],
        [Paragraph("<b>Temperature:</b>", body_style), Paragraph(f"{item.get('vital_temp', 36.8)} C", body_style), Paragraph("<b>Blood Pressure:</b>", body_style), Paragraph(f"{item.get('vital_bp_sys', 120)}/{item.get('vital_bp_dia', 80)}", body_style)]
    ]
    meta_table = Table(meta_data, colWidths=[100, 160, 100, 160])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f8fafc")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('PADDING', (0,0), (-1,-1), 8),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 15))
    
    symptoms_present = []
    symptoms_order = [
        "fever", "cough", "headache", "fatigue", "vomiting", "diarrhea", "chest_pain", 
        "sore_throat", "runny_nose", "dizziness", "joint_pain", "body_pain", "skin_rash", 
        "loss_of_smell", "loss_of_taste", "shortness_of_breath", "nausea", "chills", 
        "weight_loss", "abdominal_pain"
    ]
    for s in symptoms_order:
        if item.get(s) == 1:
            symptoms_present.append(s.replace("_", " "))
    
    symptoms_text = ", ".join(symptoms_present) if symptoms_present else "None indicated"
    story.append(Paragraph("Reported Symptoms", h2_style))
    story.append(Paragraph(symptoms_text, body_style))
    story.append(Spacer(1, 12))
    
    story.append(Paragraph("AI Diagnosis Outcome", h2_style))
    is_emergency = item.get("emergency_detected", False)
    
    if is_emergency:
        diag_color = colors.HexColor("#ef4444")
        diag_bg = colors.HexColor("#fef2f2")
        diag_border = colors.HexColor("#fca5a5")
        diag_text = "<b>CRITICAL EMERGENCY DETECTED:</b> Visit Hospital Immediately."
    else:
        diag_color = colors.HexColor("#10b981")
        diag_bg = colors.HexColor("#ecfdf5")
        diag_border = colors.HexColor("#a7f3d0")
        diag_text = f"<b>Predicted Condition:</b> {item.get('disease')}<br/><b>AI Confidence:</b> {item.get('confidence')}<br/><b>Risk Level:</b> {item.get('risk_level', 'Medium')}"
        
    diag_table = Table([[Paragraph(diag_text, ParagraphStyle('Diag', parent=body_style, fontSize=11, leading=16))]], colWidths=[520])
    diag_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), diag_bg),
        ('BOX', (0,0), (-1,-1), 1.5, diag_border),
        ('PADDING', (0,0), (-1,-1), 12),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(diag_table)
    story.append(Spacer(1, 15))
    
    story.append(Paragraph("Clinical Analysis Explanation", h2_style))
    why_text = item.get("why_predicted") or "Based on symptom configuration probability match."
    story.append(Paragraph(why_text, body_style))
    story.append(Spacer(1, 12))
    
    story.append(Paragraph("Personalized Recovery Advice", h2_style))
    meta = item.get("metadata", {})
    
    hydration_text = meta.get("hydration", "Drink plenty of water.")
    sleep_text = meta.get("sleep", "Get 8 hours of sleep.")
    exercise_text = meta.get("exercise", "Strict rest during recovery.")
    
    foods_to_eat_raw = meta.get("foods_to_eat", ["Healthy options"])
    foods_to_eat_str = ", ".join(foods_to_eat_raw) if isinstance(foods_to_eat_raw, list) else str(foods_to_eat_raw)
    
    foods_to_avoid_raw = meta.get("foods_to_avoid", ["Avoid oily items"])
    foods_to_avoid_str = ", ".join(foods_to_avoid_raw) if isinstance(foods_to_avoid_raw, list) else str(foods_to_avoid_raw)
    
    meds_text = meta.get("medicines", "Paracetamol for fever control (General advice only).")
    
    advice_data = [
        [Paragraph("<b>Hydration target:</b>", bold_style), Paragraph(hydration_text, body_style)],
        [Paragraph("<b>Sleep recommendation:</b>", bold_style), Paragraph(sleep_text, body_style)],
        [Paragraph("<b>Exercise recommendation:</b>", bold_style), Paragraph(exercise_text, body_style)],
        [Paragraph("<b>Foods to Eat:</b>", bold_style), Paragraph(foods_to_eat_str, body_style)],
        [Paragraph("<b>Foods to Avoid:</b>", bold_style), Paragraph(foods_to_avoid_str, body_style)],
        [Paragraph("<b>General Medicine:</b>", bold_style), Paragraph(meds_text, body_style)],
    ]
    
    advice_table = Table(advice_data, colWidths=[150, 370])
    advice_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('LINEBELOW', (0,0), (-1,-2), 0.5, colors.HexColor("#e2e8f0")),
    ]))
    story.append(advice_table)
    story.append(Spacer(1, 15))
    
    qr_drawing = Drawing(60, 60)
    qr_drawing.add(Rect(0, 0, 60, 60, fillColor=colors.HexColor("#1e293b"), strokeColor=None))
    qr_drawing.add(Rect(5, 5, 15, 15, fillColor=colors.white, strokeColor=None))
    qr_drawing.add(Rect(8, 8, 9, 9, fillColor=colors.HexColor("#1e293b"), strokeColor=None))
    qr_drawing.add(Rect(40, 5, 15, 15, fillColor=colors.white, strokeColor=None))
    qr_drawing.add(Rect(43, 8, 9, 9, fillColor=colors.HexColor("#1e293b"), strokeColor=None))
    qr_drawing.add(Rect(5, 40, 15, 15, fillColor=colors.white, strokeColor=None))
    qr_drawing.add(Rect(8, 43, 9, 9, fillColor=colors.HexColor("#1e293b"), strokeColor=None))
    qr_drawing.add(Rect(25, 25, 10, 10, fillColor=colors.white, strokeColor=None))
    qr_drawing.add(Rect(30, 45, 8, 8, fillColor=colors.white, strokeColor=None))
    qr_drawing.add(Rect(45, 30, 8, 8, fillColor=colors.white, strokeColor=None))
    
    bottom_data = [
        [qr_drawing, Paragraph("Scan this code to verify diagnosis status dynamically on portal.", ParagraphStyle('QrText', parent=body_style, fontSize=8, textColor=colors.HexColor("#94a3b8"))),
         Paragraph("<b>MediPredict Clinical Team</b><br/><i>Auto-Generated Secure Signature</i>", ParagraphStyle('Signature', parent=body_style, fontSize=9, alignment=2))]
    ]
    bottom_table = Table(bottom_data, colWidths=[70, 250, 200])
    bottom_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(bottom_table)
    
    doc.build(story, onFirstPage=draw_decorations)
    buffer.seek(0)
    return buffer

@router.post("/predict")
def predict(data: PredictRequest, current_user: dict = Depends(verify_token)):
    # 1. Emergency Detection
    is_emergency = False
    emergency_symptoms = []
    
    if data.chest_pain == 1:
        is_emergency = True
        emergency_symptoms.append("Chest Pain")
    if data.shortness_of_breath == 1:
        is_emergency = True
        emergency_symptoms.append("Difficulty Breathing")
    if data.emergency_blood_vomiting == 1:
        is_emergency = True
        emergency_symptoms.append("Blood Vomiting")
    if data.emergency_unconsciousness == 1:
        is_emergency = True
        emergency_symptoms.append("Unconsciousness")
    if data.emergency_very_high_fever == 1 or (data.vital_temp and data.vital_temp >= 39.5):
        is_emergency = True
        emergency_symptoms.append("Very High Fever")
        
    if is_emergency:
        meta = {
            "description": "One or more critical red-flag emergency symptoms (such as chest pain, severe shortness of breath, blood vomiting, high fever, or loss of consciousness) have been indicated. This requires immediate clinical evaluation at an emergency department.",
            "causes": ["Acute cardiovascular, respiratory, or systemic pathology"],
            "symptoms": emergency_symptoms,
            "actions": ["Call emergency services / ambulance immediately", "Go to the nearest emergency room without delay"],
            "remedies": ["Stay in a resting posture, keep calm"],
            "recovery_tips": ["Rest in a safe position", "Follow paramedic instructions"],
            "prevention_tips": ["Seek regular medical advice for underlying conditions"],
            "foods_to_eat": ["None - keep fasting until medically cleared"],
            "foods_to_avoid": ["All foods and liquids until cleared by a doctor"],
            "hydration": "Seek intravenous fluids under medical supervision if needed.",
            "exercise": "Strict bed rest.",
            "sleep": "Sleep under continuous medical observation.",
            "recovery_time": "Emergency clinical evaluation",
            "medicines": "None. Emergency treatment only.",
            "emergency_signs": "All present",
            "doctor_recommendation": "Consult ER doctor immediately",
            "similar_diseases": []
        }
        
        result = {
            "email": current_user.get("email"),
            "patient_name": current_user.get("name") or data.patient_name,
            "timestamp": datetime.utcnow().isoformat(),
            "disease": "Emergency Alert",
            "confidence": "100%",
            "severity": "Critical",
            "risk_level": "Critical",
            "emergency_detected": True,
            "why_predicted": f"Emergency condition triggered due to: {', '.join(emergency_symptoms)}.",
            "top_3_diseases": [],
            "metadata": meta,
            # include raw values
            **data.dict()
        }
        
        predictions.insert_one(result)
        result["_id"] = str(result["_id"])
        return result

    # 2. Standard Disease Prediction
    symptoms_order = [
        "fever", "cough", "headache", "fatigue", "vomiting", "diarrhea", "chest_pain", 
        "sore_throat", "runny_nose", "dizziness", "joint_paint", "body_pain", "skin_rash", 
        "loss_of_smell", "loss_of_taste", "shortness_of_breath", "nausea", "chills", 
        "weight_loss", "abdominal_pain"
    ]
    symptoms_keys = [s if s != "joint_paint" else "joint_pain" for s in symptoms_order]
    
    # Build feature row
    features = [[int(getattr(data, symptom, 0)) for symptom in symptoms_keys]]

    prediction = model.predict(features)
    probabilities = model.predict_proba(features)[0]
    
    confidence = round(max(probabilities) * 100, 1)
    disease = encoder.inverse_transform(prediction)[0]
    disease_key = disease.strip().lower()
    
    # Calculate top 3 diseases
    classes = encoder.classes_
    class_probs = sorted(zip(classes, probabilities), key=lambda x: x[1], reverse=True)
    
    top_3 = []
    for cls, prob in class_probs[:3]:
        top_3.append({
            "disease": cls,
            "confidence": f"{round(prob * 100, 1)}%"
        })

    # Retrieve rich metadata
    meta = DISEASE_METADATA.get(disease_key, {
        "description": "A health condition requiring clinical consultation.",
        "causes": ["Viral, bacterial, or environmental factors"],
        "symptoms": ["Varying symptoms"],
        "actions": ["Seek professional medical consultation"],
        "remedies": ["Maintain rest and light food intake"],
        "recovery_tips": ["Monitor temperature and rest"],
        "prevention_tips": ["Practice hygiene and avoid contact with sick people"],
        "foods_to_eat": ["Bland foods, soft fruits"],
        "foods_to_avoid": ["Oily, greasy foods, heavy meals"],
        "hydration": "Drink at least 2 liters of water daily.",
        "exercise": "Rest completely until symptoms fade.",
        "sleep": "Ensure 8-9 hours of restful sleep.",
        "recovery_time": "Varies by individual",
        "medicines": "Symptomatic relief.",
        "emergency_signs": "Difficulty breathing, chest pain",
        "doctor_recommendation": "General practitioner",
        "similar_diseases": []
    })

    # Determine Severity & Risk Level
    severity = "Mild"
    if data.vital_spo2 < 94 or (data.vital_temp and data.vital_temp >= 38.5):
        severity = "Severe"
    elif data.vital_spo2 < 96 or (data.vital_temp and data.vital_temp >= 37.8):
        severity = "Moderate"
        
    risk_level = "Low"
    if severity == "Severe":
        risk_level = "High"
    elif severity == "Moderate" or confidence > 80:
        risk_level = "Medium"

    result = {
        "email": current_user.get("email"),
        "patient_name": current_user.get("name") or data.patient_name,
        "timestamp": datetime.utcnow().isoformat(),
        "disease": disease,
        "confidence": f"{confidence}%",
        "severity": severity,
        "risk_level": risk_level,
        "emergency_detected": False,
        "why_predicted": explain_prediction(data.dict(), disease),
        "top_3_diseases": top_3,
        "metadata": meta,
        **data.dict()
    }

    # Insert into DB
    predictions.insert_one(result)
    result["_id"] = str(result["_id"])

    return result

@router.get("/history")
def history(
    current_user: dict = Depends(verify_token),
    disease: str = Query(None),
    risk_level: str = Query(None),
    search: str = Query(None),
    sort_by: str = Query("date"),
    sort_order: str = Query("desc")
):
    query = {"email": current_user.get("email")}
    
    if disease:
        query["disease"] = {"$regex": disease, "$options": "i"}
    if risk_level:
        query["risk_level"] = risk_level
        
    data = []
    cursor = predictions.find(query)
    
    # Sort cursor
    if sort_by == "confidence":
        cursor.sort("confidence", -1 if sort_order == "desc" else 1)
    else:
        sort_key = "timestamp"
        try:
            if hasattr(predictions, "_read"):
                db_data = predictions._read()
                if db_data and len(db_data) > 0 and "timestamp" not in db_data[0]:
                    sort_key = "_id"
        except Exception:
            pass
        cursor.sort(sort_key, -1 if sort_order == "desc" else 1)
        
    for item in cursor:
        item["_id"] = str(item["_id"])
        
        # Search filter manually to ensure compatibility with fallback
        if search:
            search_lower = search.lower()
            name_match = search_lower in (item.get("patient_name") or "").lower()
            disease_match = search_lower in (item.get("disease") or "").lower()
            if not (name_match or disease_match):
                continue
        data.append(item)
        
    return data

@router.delete("/history/{id}")
def delete_prediction(id: str, current_user: dict = Depends(verify_token)):
    res = predictions.delete_one({"_id": id, "email": current_user.get("email")})
    if res.deleted_count == 0:
         res = predictions.delete_one({"_id": id}) # Fallback logic for unassigned
    return {"message": "Prediction deleted successfully"}

@router.delete("/history")
def clear_history(current_user: dict = Depends(verify_token)):
    predictions.delete_many({"email": current_user.get("email")})
    return {"message": "Prediction history cleared successfully"}

@router.get("/predictions/{id}/pdf")
def get_pdf(id: str, current_user: dict = Depends(verify_token)):
    item = predictions.find_one({"_id": id})
    if not item:
        raise HTTPException(status_code=404, detail="Prediction report not found")
        
    # Generate PDF
    pdf_buffer = generate_pdf_report(item)
    pdf_data = pdf_buffer.getvalue()
    
    headers = {
        'Content-Disposition': f'attachment; filename="MediPredict_Health_Report_{id}.pdf"'
    }
    return Response(content=pdf_data, media_type="application/pdf", headers=headers)