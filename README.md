# MediPredict AI - Clinical Diagnosis & Prediction Suite

MediPredict AI is a production-level, machine learning-powered medical classification system designed to predict clinical conditions based on patient symptom vectors. The application integrates data science, FastAPI, and robust session security to serve medical professionals with diagnostic insights and clinical recovery guidance.

---

## 🎨 Premium Visual Features

- **Poppins & Outfit Typography**: Modern font systems applied across all user interfaces, input groups, charts, alerts, and sidebars.
- **Unified Developer Theme**: Sleek light-themed dashboard featuring crisp white cards, subtle borders, and smooth shadows styled around professional brand accents.
- **Premium Glassmorphic Sidebar**: Sidebar navigation uses a professional dark gradient aesthetic (`#070a13` to `#0c1122`) with smooth micro-interactions, custom scrollbars, active indicators, and typography.
- **Iconography**: Entirely clean, using Font Awesome 6 icons (e.g., stethoscope, pulse, lock, brain, checklist, triangle-exclamation).

---

## 🔐 Advanced Security

- **JWT Route Protection**: Backend routes verify client session signatures via standard `Bearer` tokens. Unauthenticated requests are rejected with a `401 Unauthorized` status.
- **Instant Session Verification**: Dashboard pages verify session validation before rendering. Unauthenticated visitors are instantly redirected to `login.html`, preventing flashing UI bypasses.
- **Password Hashing**: User credentials are encrypted at registration using Bcrypt hashing before storage.
- **API Rate Limiting**: Built-in sliding-window memory rate limiting on auth endpoints (20 req/min), diagnostic prediction endpoints (15 req/min), and general API routes (120 req/min) to prevent brute force and DDoS attacks.
- **Input Validation**: Robust Pydantic request validation and runtime schema constraints.

---

## 🗄️ Resilient Hybrid Database & Indexing

- **MongoDB Atlas Connection**: Default primary data layer connects securely to MongoDB Atlas.
- **Automatic Startup Indexing**: The backend automatically builds ascending indexes on startup for key search parameters (`users.email`, `predictions.email`, `predictions.timestamp`, etc.) to optimize query speeds.
- **Resilient Fallback Local Database**: If MongoDB Atlas is unreachable, the system automatically redirects read/write operations to local persistent JSON databases with a thread-safe global lock to prevent write corruption. The fallback wrapper includes native support for MongoDB operators such as `$regex` and `$options` to support search filter behaviors offline.

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
│   ├── db/                        # Persistent local database JSON stores (offline fallback)
│   ├── logs/                      # Rotated system logs
│   │
│   ├── models/                    # Serialized Machine Learning artifacts
│   │   ├── disease_model.pkl      # Trained RandomForestClassifier model
│   │   ├── label_encoder.pkl      # Output label encoder
│   │   └── model_metrics.json     # Pre-calculated model accuracy/precision metrics
│   │
│   ├── routes/                    # API endpoints
│   │   ├── auth.py                # Practitioner authentication (/register, /login)
│   │   └── prediction.py          # Secure diagnostics (/predict, /history)
│   │
│   └── utils/                     # Encryption & logging helpers
│       ├── auth.py                # JWT creation and decoding
│       ├── security.py            # Password hashing (Bcrypt)
│       └── logging_config.py      # Standardized system logger config
│
├── dataset/                       # Diagnostic training CSV data
├── frontend/                      # User Interface assets
│   ├── login.html                 # Sign-in / sign-up entrypoint
│   ├── dashboard.html             # Main portal dashboard
│   ├── css/                       # Dashboard, login and landing styles
│   └── js/                        # Auth logic and interactive dashboard utilities
│
├── training/
│   └── train_model.py             # Random Forest classifier training script
│
├── .gitignore                     # Git configuration
└── README.md                      # Documentation
```

---

## 🚀 Setup & Execution (Local Machine)

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
python -m venv venv

# Activate (Windows)
.\venv\Scripts\activate

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
python -m uvicorn app:app --reload
```

- **Secure Web Application**: [http://127.0.0.1:8000/login.html](http://127.0.0.1:8000/login.html)
- **Interactive OpenAPI/Swagger Documentation**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
