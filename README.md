# Study Buddy

A productivity tracker that monitors your active window titles, classifies activity as study or distraction using a machine learning classifier, and lets you correct mislabels to improve the model over time.

**[Live Demo](https://studybuddyvk.netlify.app)**

## Features

- Automatic activity tracking — logs active window titles every time you switch apps
- ML classification — sentence-transformer embeddings (`all-MiniLM-L6-v2`) + Logistic Regression classify each window as study or distract
- Human-in-the-loop correction — correct mislabels via the dashboard; one correction updates all matching entries in the session
- Retraining pipeline — retrain the model on your corrections to improve accuracy over time
- AI session summaries — natural-language recap of each session via the Gemini API
- Heatbar timeline — visual session timeline showing study/distract activity at a glance
- Distraction notifications — desktop notification fires after a continuous distraction streak
- Session history — view past sessions with study/distract breakdown and focus percentage
- Live dashboard — real-time view of current session activity with label correction UI

## Tech Stack

- **Backend:** Python, Flask, SQLite
- **ML:** sentence-transformers (`all-MiniLM-L6-v2`) + Logistic Regression, joblib
- **AI Summaries:** Google Gemini API (`gemini-2.5-flash`)
- **Frontend:** React (Vite)
- **Agent:** pywin32, psutil (Windows) / osascript (Mac)

## Project Structure

```
Study-Buddy-V2/
├── agent/
│   ├── mac_tracker.py          # macOS window tracker
│   └── windows_tracker.py      # Windows window tracker
├── backend/
│   ├── app.py                  # Flask API
│   ├── db.py                   # SQLite database layer
│   ├── seed_demo_session.py    # Seeds a sample session for the public demo
│   └── templates/
│       ├── dashboard.html
│       └── history.html
├── data/
│   └── seed_data.csv           # Training data
├── frontend/
│   ├── src/
│   │   ├── App.jsx             # Nav tabs, routing
│   │   ├── Dashboard.jsx       # Live session view
│   │   ├── History.jsx         # Past sessions view
│   │   ├── api.js              # Backend API base URL + calls
│   │   ├── utils.js
│   │   └── components/
│   │       ├── ActionButton.jsx
│   │       ├── Badge.jsx
│   │       ├── Heatbar.jsx     # Session timeline visualization
│   │       ├── LabelButtons.jsx
│   │       └── LogTree.jsx     # Collapsible log hierarchy
│   └── vite.config.js
└── ml/
    ├── classifier.py           # Embedding + LR train/predict/retrain
    ├── model.pkl                # Trained model
    ├── train_embeddings.npy
    ├── train_labels.npy
    └── demo/                   # Separate model trained on curated demo data
        ├── model.pkl
        ├── train_embeddings.npy
        └── train_labels.npy
```

## Setup

```bash
git clone https://github.com/VibhuKhetharpal/Study-Buddy-V2.git
cd Study-Buddy-V2

python -m venv .venv
source .venv/bin/activate   # Mac
.venv\Scripts\activate      # Windows

pip install -r backend/requirements.txt

# Windows only
pip install pywin32 win10toast

# Train the initial model
cd ml
python classifier.py
```

Frontend:
```bash
cd frontend
npm install
```

## Usage

Terminal 1 — backend:
```bash
cd backend
python app.py
```

Terminal 2 — frontend:
```bash
cd frontend
npm run dev
```

Terminal 3 — tracker:
```bash
cd agent
python mac_tracker.py       # Mac
python windows_tracker.py   # Windows
```

Open the Vite dev URL (typically `http://localhost:5173`) to see your session live.

## API Endpoints

| Method | Route | Description |
|---|---|---|
| POST | `/start` | Start a new session |
| POST | `/stop` | End session, returns summary |
| POST | `/log` | Log a window title, returns prediction |
| PATCH | `/label` | Correct a prediction |
| PATCH | `/label/bulk` | Correct all matching window titles in a session |
| POST | `/retrain` | Retrain model on user corrections |
| GET | `/stats` | Aggregate stats across all sessions |
| GET | `/sessions` | List all sessions with per-session stats |
| GET | `/session/<id>/logs` | Logs for a specific session |
| GET | `/summary/<id>` | AI-generated natural-language session summary (Gemini) |
| GET | `/latest_session` | Most recent session ID |

## Retraining

After correcting several mislabels on the dashboard, hit this endpoint:

```bash
curl -X POST http://localhost:5000/retrain
```

The model retrains on seed data + all corrections and immediately uses the updated model.

## Demo Deployment

The live demo runs against an isolated database and a separately-trained model (curated dataset), controlled via environment variables (`DEMO_MODE`, `DB_FILENAME`, `MODEL_SUBDIR`, `SEED_FILENAME`) — your personal data and model are never touched by the public deployment.