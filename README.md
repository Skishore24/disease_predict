# MediPredict AI - Clinical Diagnosis & Prediction Suite

MediPredict AI is a production-level, machine learning-powered medical classification system designed to predict clinical conditions based on patient symptom vectors. The application integrates data science, FastAPI, and robust session security to serve medical professionals with diagnostic insights and clinical recovery guidance.

---

## 🎨 Premium Visual Features

* **Poppins Typography**: Modern Poppins font applied across all user interfaces, input groups, alerts, and sidebars.
* **Unified Developer Theme**: Main section designed in a sleek light theme featuring crisp white cards, light-grey backgrounds (`#f8f9fa`), and thin borders (`#dadce0`) styled around **Google Blue** (`#1a73e8`) accents.
* **Slate Sidebar Separation**: Left sidebar navigation utilizes a professional dark-slate aesthetic (`#0f172a`) to match enterprise-level developer consoles.
* **No Emojis**: Emojis have been entirely removed and replaced with Font Awesome 6 icons (e.g., stethoscope, pulse, lock, brain, checklist).

---

## 🔐 Advanced Security

* **JWT Route Protection**: Backend routes (`/predict` and `/history`) verify client session signatures via standard `Bearer` tokens. Unauthenticated direct HTTP requests are rejected with a `401 Unauthorized` status.
* **Instant Session Verification**: Dashboard pages run a script in the HTML `<head>` tag. Unauthenticated visitors are instantly redirected to `login.html` before any page content is parsed or rendered, preventing flashing UI bypasses.
* **Password Hashing**: User credentials are encrypted at registration using Bcrypt hashing before storage.

---

## 🗄️ Resilient Hybrid Database

* **MongoDB Atlas Connection**: Default primary data layer connects securely to MongoDB Atlas.
* **Local Fallback Database**: If Atlas is unreachable (e.g. network timeout or SSL handshake issues), the system automatically redirects read/write operations to local persistent JSON databases (`backend/users_db.json` and `backend/predictions_db.json`), ensuring zero runtime crashes.

---

## 📂 Project Structure

```text
Disease predict/
│
├── backend/
│   ├── app.py                     # Main FastAPI server (services API + hosts frontend)
│   ├── database.py                # Database connector (Atlas with Local JSON Fallback)
│   ├── requirements.txt           # Python backend dependencies
│   ├── .env                       # Environment configuration
│   │
│   ├── models/                    # Serialized Machine Learning artifacts
│   │   ├── disease_model.pkl      # Trained RandomForestClassifier model
│   │   └── label_encoder.pkl      # Output label encoder
│   │
│   ├── routes/                    # API endpoints
│   │   ├── auth.py                # Practitioner authentication (/register, /login)
│   │   └── prediction.py          # Secure diagnostics (/predict, /history)
│   │
│   └── utils/                     # Encryption & security helpers
│       ├── auth.py                # JWT creation and decoding
│       └── security.py            # Password hashing (Bcrypt)
│
├── dataset/
│   └── disease_dataset.csv        # Diagnostic training data
│
├── frontend/                      # User Interface assets (served as static files)
│   ├── login.html                 # Unified sign-in and sign-up card
│   ├── dashboard.html             # Practitioner workspace (Predictor & Search Database)
│   │
│   ├── css/
│   │   ├── auth.css               # Portal styles (dark theme)
│   │   └── dashboard.css          # Workspace styles (light theme with dark sidebar)
│   │
│   └── js/
│       ├── auth.js                # Token management & login forms
│       └── dashboard.js           # Diagnostics, history search & typewriter effects
│
├── training/
│   └── train_model.py             # Random Forest classifier training script
│
├── .gitignore                     # Git configuration
└── README.md                      # Documentation
```

---

## 🚀 Setup & Execution

### 1. Configure Environment Variables
Create a `.env` file in the `backend/` directory:
```env
MONGO_URI=your_mongodb_connection_string
DATABASE_NAME=medipredict
SECRET_KEY=medipredict_super_secret_key
ALGORITHM=HS256
```

### 2. Create and Activate Virtual Environment
```bash
# Navigate to backend directory
cd backend

# Create environment
py -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Mac/Linux)
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Run the Full-Stack Server
FastAPI automatically serves the API and mounts the static frontend files on a single port.
```bash
python -m uvicorn app:app
```
* **Secure Web Application**: [http://127.0.0.1:8000/login.html](http://127.0.0.1:8000/login.html)
* **Interactive OpenAPI/Swagger Documentation**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
