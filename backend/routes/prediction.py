from fastapi import APIRouter, Header, HTTPException, Depends
from database import predictions
from utils.auth import decode_access_token
import joblib
import os

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
        "sleep": "Ensure 9-10 hours of sleep per day to aid immune response."
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
        "sleep": "Prioritize 8-9 hours of continuous night sleep plus daytime rests."
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
        "sleep": "Aim for 8 hours of sleep per night."
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
        "sleep": "Aim for 9-10 hours of rest to accelerate platelets recovery."
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
        "sleep": "Ensure 8-9 hours of nightly sleep plus daytime rests."
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
        "sleep": "Ensure 9-10 hours of sleep per day to support tissue healing."
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
        "sleep": "Aim for a consistent 7-8 hours of sleep. Avoid oversleeping or sleep deprivation."
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
        "sleep": "Ensure 8-9 hours of rest to allow the digestive tract to recover."
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
        "sleep": "Ensure 9-10 hours of sleep per day, sleeping slightly elevated to ease breathing."
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
        "sleep": "Ensure 7-8 hours of sleep per night."
    }
}

@router.post("/predict")
def predict(data: dict, current_user: dict = Depends(verify_token)):
    # 20 symptoms in training order
    symptoms_order = [
        "fever", "cough", "headache", "fatigue", "vomiting", "diarrhea", "chest_pain", 
        "sore_throat", "runny_nose", "dizziness", "joint_paint", "body_pain", "skin_rash", 
        "loss_of_smell", "loss_of_taste", "shortness_of_breath", "nausea", "chills", 
        "weight_loss", "abdominal_pain"
    ]
    # Note: check if there's any typo in column name in dataset
    # In CSV: fever,cough,headache,fatigue,vomiting,diarrhea,chest_pain,sore_throat,runny_nose,dizziness,joint_pain,body_pain,skin_rash,loss_of_smell,loss_of_taste,shortness_of_breath,nausea,chills,weight_loss,abdominal_pain,disease
    # The symptom column in CSV is 'joint_pain'. Let's make sure it matches.
    symptoms_keys = [s if s != "joint_paint" else "joint_pain" for s in symptoms_order]
    
    features = [[int(data.get(symptom, 0)) for symptom in symptoms_keys]]

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
        "symptoms": ["Varying systemic symptoms"],
        "actions": ["Seek professional medical consultation"],
        "remedies": ["Maintain rest and light food intake"],
        "recovery_tips": ["Monitor temperature and rest"],
        "prevention_tips": ["Practice hygiene and avoid contact with sick people"],
        "foods_to_eat": ["Bland foods, soft fruits"],
        "foods_to_avoid": ["Oily, greasy foods, heavy meals"],
        "hydration": "Drink at least 2 liters of water daily.",
        "exercise": "Rest completely until symptoms fade.",
        "sleep": "Ensure 8-9 hours of restful sleep."
    })

    result = {
        **data,
        "disease": disease,
        "confidence": f"{confidence}%",
        "top_3_diseases": top_3,
        "metadata": meta
    }

    # Insert into DB and convert _id to string for JSON serialization
    predictions.insert_one(result)
    result["_id"] = str(result["_id"])

    return result

@router.get("/history")
def history(current_user: dict = Depends(verify_token)):
    data = []
    # Sort predictions by _id descending to show latest first
    for item in predictions.find().sort("_id", -1):
        item["_id"] = str(item["_id"])
        data.append(item)
    return data