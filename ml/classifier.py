import pandas as pd 
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
import joblib
import os

BASE_DIR=os.path.dirname(os.path.abspath(__file__))
MODEL_PATH=os.path.join(BASE_DIR,"model.pkl")
VECTORIZER_PATH=os.path.join(BASE_DIR,"vectorizer.pkl")

def train(data_path):
    df=pd.read_csv(data_path)
    X=df['text']
    Y=df['label']
    tfidf_Vectorizer=TfidfVectorizer()#initialise
    tfidf_matrix=tfidf_Vectorizer.fit_transform(X)#Converted Text to Numbers

    model=LogisticRegression()
    model.fit(tfidf_matrix,Y)#train on label

    joblib.dump(model,MODEL_PATH)
    joblib.dump(tfidf_Vectorizer,VECTORIZER_PATH)

def predict(X):
    tfidf_vectorizer=joblib.load(VECTORIZER_PATH)
    model=joblib.load(MODEL_PATH)
    tfidf_matrix=tfidf_vectorizer.transform([X])
    return model.predict(tfidf_matrix)[0]

if __name__ == "__main__":
    data_path=os.path.join(BASE_DIR,"..","data","seed_data.csv")
    train(data_path)
    print("Model Trained and saved")




    
