# Study Buddy

A productivity tracker that monitors your active window titles, classifies activity as study or distraction using a machine learning classifier, and lets you correct mislabels to improve the model over time.

## Features

- Automatic activity tracking — logs active window titles every time you switch apps
- ML classification — TF-IDF + Logistic Regression classifies each window as study or distract
- Human-in-the-loop correction — correct mislabels via the dashboard; one correction updates all matching entries in the session
- Retraining pipeline — retrain the model on your corrections to improve accuracy over time
- Distraction notifications — desktop notification fires after 30 seconds of continuous distraction
- Session history — view past sessions with study/distract breakdown and focus percentage
- Live dashboard — real-time view of current session activity with label correction UI

## Tech Stack

- Backend: Python, Flask, SQLite
- ML: scikit-learn (TF-IDF + Logistic Regression), joblib
- Frontend: HTML, CSS, vanilla JavaScript
- Agent: pywin32, psutil (Windows) / osascript (Mac)

## Project Structure

```
Study-Buddy-V2/
├── agent/
│   ├── mac_tracker.py        # macOS window tracker
│   └── windows_tracker.py    # Windows window tracker
├── backend/
│   ├── app.py                # Flask API
│   ├── db.py                 # SQLite database layer
│   └── templates/
│       ├── dashboard.html    # Live session dashboard
│       └── history.html      # Session history page
├── data/
│   └── seed_data.csv         # Initial training data
└── ml/
    ├── classifier.py         # TF-IDF + LR train/predict/retrain
    ├── model.pkl             # Trained model
    └── vectorizer.pkl        # Trained vectorizer
```
## Setup

git clone https://github.com/yourusername/Study-Buddy-V2.git
cd Study-Buddy-V2

python -m venv .venv
source .venv/bin/activate   # Mac
.venv\Scripts\activate      # Windows

pip install -r requirements.txt

# Windows only
pip install pywin32 win10toast

# Train the initial model
cd ml
python classifier.py

## Usage

Terminal 1 — start the backend:
cd backend
python app.py

Terminal 2 — start the tracker:
cd agent
python mac_tracker.py       # Mac
python windows_tracker.py   # Windows

Open http://localhost:5000/dashboard to see your session live.

## API Endpoints

POST   /start      Start a new session
POST   /stop       End session, returns summary
POST   /log        Log a window title, returns prediction
PATCH  /label      Correct a prediction (bulk updates matching entries)
POST   /retrain    Retrain model on user corrections
GET    /stats      Aggregate stats across all sessions
GET    /sessions   List all sessions with per-session stats
GET    /dashboard  Dashboard UI
GET    /history    Session history UI

## Retraining

After correcting several mislabels on the dashboard, hit this endpoint:

curl -X POST http://localhost:5000/retrain

The model retrains on seed data + all corrections and immediately uses the updated model.