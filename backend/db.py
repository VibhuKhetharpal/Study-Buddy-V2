import sqlite3
from datetime import datetime 

DB_NAME = "backend/database.db"

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


