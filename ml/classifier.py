import os
import joblib
import numpy as np
import pandas as pd
from sentence_transformers import SentenceTransformer
from sklearn.linear_model import LogisticRegression

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, os.environ.get("MODEL_SUBDIR", ""))
MODEL_PATH = os.path.join(MODEL_DIR, "model.pkl")
EMBEDDINGS_PATH = os.path.join(MODEL_DIR, "train_embeddings.npy")
LABELS_PATH = os.path.join(MODEL_DIR, "train_labels.npy")

EMBED_MODEL = SentenceTransformer("all-MiniLM-L6-v2")


def train(data_path):
    df = pd.read_csv(data_path)
    x = df['text'].tolist()
    y = df['label'].tolist()

    embeddings = EMBED_MODEL.encode(x, show_progress_bar=False)

    model = LogisticRegression(max_iter=1000)
    model.fit(embeddings, y)

    os.makedirs(MODEL_DIR, exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    np.save(EMBEDDINGS_PATH, embeddings)
    np.save(LABELS_PATH, np.array(y))
    return model


def predict(text):
    if not os.path.exists(MODEL_PATH):
        data_path = os.path.join(BASE_DIR, "..", "data", "seed_data.csv")
        model = train(data_path)
    else:
        model = joblib.load(MODEL_PATH)

    embedding = EMBED_MODEL.encode([text])
    return model.predict(embedding)[0]


def retrain(data_path):
    import sys
    sys.path.append(os.path.join(BASE_DIR, '..', 'backend'))
    from db import get_labelled_data

    if not os.path.exists(EMBEDDINGS_PATH) or not os.path.exists(LABELS_PATH):
        train(data_path)

    seed_embeddings = np.load(EMBEDDINGS_PATH)
    seed_labels = np.load(LABELS_PATH)

    user_data = get_labelled_data()
    if user_data:
        df_user = pd.DataFrame(user_data).drop_duplicates(subset=['text'], keep='last')
        user_texts = df_user['text'].tolist()
        user_labels = df_user['label'].tolist()

        user_embeddings = EMBED_MODEL.encode(user_texts, show_progress_bar=False)
        all_embeddings = np.vstack([seed_embeddings, user_embeddings])
        all_labels = np.concatenate([seed_labels, np.array(user_labels)])
    else:
        all_embeddings = seed_embeddings
        all_labels = seed_labels

    model = LogisticRegression(max_iter=1000)
    model.fit(all_embeddings, all_labels)
    joblib.dump(model, MODEL_PATH)

    return len(user_data) if user_data else 0


if __name__ == "__main__":
    data_path = os.path.join(BASE_DIR, "..", "data", "seed_data.csv")
    train(data_path)
    print("Model trained and saved")