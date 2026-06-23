# MediPredict AI - Medical Diagnosis System

## 📌 Project Overview

MediPredict AI is a Machine Learning-powered Medical Diagnosis System that predicts possible diseases based on patient symptoms. The application provides a modern web dashboard, patient prediction history, user authentication, analytics, and MongoDB integration.

This project demonstrates the implementation of Data Science, Machine Learning, Web Development, Database Management, and REST API development in a single healthcare solution.

---

# 🚀 Features

### Authentication

* User Registration
* User Login
* Password Hashing using Bcrypt
* JWT Authentication
* Role-Based Access

### Disease Prediction

* Predict diseases from symptoms
* Confidence Score Calculation
* Machine Learning Model Integration
* Symptom-Based Diagnosis

### Dashboard

* Total Predictions
* Accuracy Metrics
* Disease Statistics
* User Analytics

### History Management

* Store Prediction Records
* View Prediction History
* Search Patient Records

### Admin Panel

* Total Users
* Total Predictions
* System Analytics

### Database

* MongoDB Atlas Integration
* User Collection
* Prediction Collection

---

# 🏗️ System Architecture

```text
Frontend
    |
    v
FastAPI Backend
    |
    v
Machine Learning Model
    |
    v
MongoDB Atlas
```

---

# 📂 Project Structure

```text
Disease predict/
│
├── backend/
│   │
│   ├── app.py
│   ├── database.py
│   ├── requirements.txt
│   ├── .env
│   │
│   ├── models/
│   │   ├── disease_model.pkl
│   │   └── label_encoder.pkl
│   │
│   ├── routes/
│   │   ├── auth.py
│   │   ├── prediction.py
│   │   └── admin.py
│   │
│   └── utils/
│       ├── auth.py
│       └── security.py
│
├── dataset/
│   └── disease_dataset.csv
│
├── frontend/
│   │
│   ├── login.html
│   ├── register.html
│   ├── dashboard.html
│   ├── predict.html
│   ├── history.html
│   └── admin.html
│
│   ├── css/
│   │   ├── style.css
│   │   └── dashboard.css
│   │
│   └── js/
│       ├── login.js
│       ├── register.js
│       ├── dashboard.js
│       ├── predict.js
│       ├── history.js
│       └── admin.js
│
├── training/
│   └── train_model.py
│
├── reports/
│
└── README.md
```

---

# ⚙️ Technologies Used

## Frontend

* HTML5
* CSS3
* JavaScript
* Chart.js

## Backend

* FastAPI
* Python

## Database

* MongoDB Atlas

## Machine Learning

* Scikit-Learn
* Pandas
* NumPy
* Joblib

## Security

* JWT Authentication
* Passlib Bcrypt

---

# 🧠 Machine Learning Model

The disease prediction model is trained using:

### Input Features

* Fever
* Cough
* Headache
* Fatigue
* Vomiting

### Output

* Flu
* Cold
* Covid
* Dengue
* Malaria
* Typhoid
* Migraine

### Algorithm

```python
RandomForestClassifier
```

---

# 🗄️ Database Collections

## Users Collection

```json
{
  "_id": "...",
  "name": "Kishore",
  "email": "kishore@gmail.com",
  "password": "hashed_password",
  "role": "user"
}
```

## Predictions Collection

```json
{
  "_id": "...",
  "patient_name": "John",
  "disease": "Flu",
  "confidence": "95%"
}
```

---

# 🔐 Environment Variables

Create:

```text
backend/.env
```

```env
MONGO_URI=your_mongodb_connection_string
DATABASE_NAME=medipredict
SECRET_KEY=medipredict_super_secret_key
ALGORITHM=HS256
```

---

# 📦 Installation

## Clone Project

```bash
git clone https://github.com/yourusername/medipredict-ai.git
```

---

## Create Virtual Environment

```bash
python -m venv venv
```

### Activate

Windows

```bash
venv\Scripts\activate
```

Linux/Mac

```bash
source venv/bin/activate
```

---

## Install Dependencies

```bash
pip install -r requirements.txt
```

---

# 🚀 Run Model Training

Navigate:

```bash
cd training
```

Run:

```bash
python train_model.py
```

Output:

```text
Model Trained Successfully
```

---

# 🚀 Run Backend

Navigate:

```bash
cd backend
```

Run:

```bash
python -m uvicorn app:app --reload
```

Server:

```text
http://127.0.0.1:8000
```

Swagger Docs:

```text
http://127.0.0.1:8000/docs
```

---

# 🖥️ Frontend Setup

Open:

```text
frontend/login.html
```

Register a user and login.

---

# 📈 API Endpoints

## Register

```http
POST /register
```

## Login

```http
POST /login
```

## Predict Disease

```http
POST /predict
```

## Prediction History

```http
GET /history
```

## Admin Statistics

```http
GET /admin/stats
```

---

# 🎯 Future Improvements

* 100+ Disease Dataset
* Symptom Auto Complete
* Doctor Recommendation
* PDF Report Generation
* Email Notifications
* Appointment Booking
* AI Chatbot
* Voice Input
* Multi Language Support
* React Frontend
* Docker Deployment
* CI/CD Pipeline
* Cloud Hosting

---

# 📊 Expected Results

* Disease Prediction Accuracy: 90%+
* Secure Authentication
* Fast API Response
* Real-Time Dashboard
* MongoDB Data Storage

---

# 👨‍💻 Author

**Kishore**

Student | Data Science Enthusiast | Full Stack Developer

---

# 📄 License

This project is developed for educational and portfolio purposes.

Copyright © 2026 MediPredict AI.
