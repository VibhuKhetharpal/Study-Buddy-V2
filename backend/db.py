import sqlite3
import os
from datetime import datetime, timezone

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_NAME = os.path.join(BASE_DIR, "database.db")

def get_connection():
    return sqlite3.connect(DB_NAME)
def insert_activity(session_id, app_name, window_title):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO activity_logs (
            session_id,
            timestamp,
            window_title,
            app_name
        )
        VALUES (?, ?, ?, ?)
    """, (
        session_id,
        datetime.utcnow().isoformat(),
        window_title,
        app_name
    ))

    conn.commit()
    conn.close()


def create_tables():
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
    CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        start_time TEXT,
        end_time TEXT,
        total_study INTEGER DEFAULT 0,
        total_distract INTEGER DEFAULT 0
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS activity_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER,
        timestamp TEXT,
        window_title TEXT,
        app_name TEXT,
        predicted_label TEXT,
        user_label TEXT
    )
    """)

    conn.commit()
    conn.close()

if __name__ == "__main__":
    create_tables()
    print("DB Ready")
def create_session():
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO sessions (start_time)
        VALUES (?)
    """, (datetime.now(timezone.utc).isoformat(),))

    session_id = cur.lastrowid

    conn.commit()
    conn.close()

    return session_id

def end_session(session_id):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        UPDATE sessions
        SET end_time = ?
        WHERE id = ?
    """, (
        datetime.now(timezone.utc).isoformat(),
        session_id
    ))

    conn.commit()
    conn.close()
create_tables()




