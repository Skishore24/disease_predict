import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
import joblib
import json

df = pd.read_csv("../dataset/disease_dataset.csv")

X = df.drop("disease", axis=1)
y = df["disease"]

encoder = LabelEncoder()
y_encoded = encoder.fit_transform(y)

# Perform stratified split to keep 1 test sample and 3 training samples for each of the 10 classes
X_train, X_test, y_train, y_test = train_test_split(
    X, y_encoded, test_size=0.25, random_state=42, stratify=y_encoded
)

model = RandomForestClassifier(
    n_estimators=100,
    random_state=42
)

model.fit(X_train, y_train)

# Evaluate metrics
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
precision = precision_score(y_test, y_pred, average="weighted", zero_division=0)
recall = recall_score(y_test, y_pred, average="weighted", zero_division=0)
f1 = f1_score(y_test, y_pred, average="weighted", zero_division=0)
conf_matrix = confusion_matrix(y_test, y_pred).tolist()

metrics = {
    "accuracy": round(accuracy, 4),
    "precision": round(precision, 4),
    "recall": round(recall, 4),
    "f1_score": round(f1, 4),
    "confusion_matrix": conf_matrix
}

with open("../backend/models/model_metrics.json", "w") as f:
    json.dump(metrics, f, indent=4)

joblib.dump(model, "../backend/models/disease_model.pkl")
joblib.dump(encoder, "../backend/models/label_encoder.pkl")

print("Model Trained and Evaluated Successfully. Metrics saved.")