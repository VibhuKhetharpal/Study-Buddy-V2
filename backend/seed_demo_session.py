"""
Run this once after deploying, against the demo database, to seed a realistic
sample session so visitors see populated data immediately instead of an empty
dashboard. Does not touch your real local database.
"""
import sqlite3
from datetime import datetime, timedelta
import random
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "ml"))
from classifier import predict

DEMO_TITLES = [
    ("Visual Studio Code", "main.jsx"),
    ("Visual Studio Code", "app.py"),
    ("Google Chrome", "LeetCode - Two Sum"),
    ("Google Chrome", "Stack Overflow - Python list comprehension"),
    ("Google Chrome", "React Documentation - useEffect"),
    ("Google Chrome", "GitHub - my-project"),
    ("Google Chrome", "YouTube - lofi hip hop radio beats to relax"),
    ("Google Chrome", "Instagram - Explore"),
    ("Google Chrome", "Claude - Practical applications and usage"),
    ("Google Chrome", "Reddit - r/mildlyinfuriating"),
    ("Terminal", "npm run dev"),
    ("Google Chrome", "Notion - Project Notes"),
    ("Spotify", "Discover Weekly"),
    ("Google Chrome", "MDN Web Docs - CSS Flexbox Guide"),
    ("WhatsApp", "Group Chat"),
]


def seed_demo_session(db_path):
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    start = datetime.utcnow() - timedelta(hours=1, minutes=30)
    cur.execute(
        "INSERT INTO sessions (start_time, end_time) VALUES (?, ?)",
        (start.isoformat(), (start + timedelta(hours=1, minutes=20)).isoformat()),
    )
    session_id = cur.lastrowid

    t = start
    for app_name, window_title in DEMO_TITLES * 3:
        t += timedelta(seconds=random.randint(20, 240))
        label = predict(f"{app_name} {window_title}")
        cur.execute(
            "INSERT INTO activity_logs (session_id, app_name, window_title, predicted_label, timestamp) "
            "VALUES (?, ?, ?, ?, ?)",
            (session_id, app_name, window_title, label, t.isoformat()),
        )

    conn.commit()
    conn.close()
    print(f"Seeded demo session #{session_id} with {len(DEMO_TITLES) * 3} logs")


if __name__ == "__main__":
    db_filename = os.environ.get("DB_FILENAME", "database.db")
    db_path = os.path.join(os.path.dirname(__file__), db_filename)
    seed_demo_session(db_path)