import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
import joblib

df = pd.read_csv("../dataset/disease_dataset.csv")

X = df.drop("disease", axis=1)

y = df["disease"]

encoder = LabelEncoder()

y_encoded = encoder.fit_transform(y)

model = RandomForestClassifier(
    n_estimators=100,
    random_state=42
)

model.fit(X, y_encoded)

joblib.dump(model,
            "../backend/models/disease_model.pkl")

joblib.dump(encoder,
            "../backend/models/label_encoder.pkl")

print("Model Trained Successfully")