import sqlite3
import os
from datetime import datetime, timezone

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_NAME = os.path.join(BASE_DIR, "database.db")

def get_connection():
    return sqlite3.connect(DB_NAME)
def insert_activity(session_id, app_name, window_title,predicted_label):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO activity_logs (
            session_id,
            timestamp,
            window_title,
            app_name,
            predicted_label
        )
        VALUES (?, ?, ?, ?, ?)
    """, (
        session_id,
        datetime.utcnow().isoformat(),
        window_title,
        app_name,
        predicted_label
    ))

    conn.commit()
    conn.close()

def update_user_label(log_id, user_label):
    conn = get_connection()
    
    # get the window_title and session_id of this log
    row = conn.execute(
        "SELECT window_title, session_id FROM activity_logs WHERE id=?",
        (log_id,)
    ).fetchone()
    
    if row:
        window_title, session_id = row
        # update ALL rows with same window_title in same session
        conn.execute("""
            UPDATE activity_logs 
            SET user_label=?
            WHERE window_title=? AND session_id=?
        """, (user_label, window_title, session_id))
    
    conn.commit()
    conn.close()

def get_labelled_data():
    conn = get_connection()
    rows = conn.execute(
        "SELECT window_title, user_label FROM activity_logs WHERE user_label IS NOT NULL"
    ).fetchall()
    conn.close()
    return [{"text": row[0], "label": row[1]} for row in rows]


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
        UPDATE sessions SET end_time=? WHERE id=?
    """, (datetime.now(timezone.utc).isoformat(), session_id))
    conn.commit()

    study = conn.execute(
        "SELECT COUNT(*) FROM activity_logs WHERE session_id=? AND predicted_label='study'",
        (session_id,)
    ).fetchone()[0]
    distract = conn.execute(
        "SELECT COUNT(*) FROM activity_logs WHERE session_id=? AND predicted_label='distract'",
        (session_id,)
    ).fetchone()[0]
    conn.close()
    return {"study": study, "distract": distract}
create_tables()

def get_stats():
    conn = get_connection()
    conn.row_factory = sqlite3.Row
    
    total = conn.execute("SELECT COUNT(*) FROM activity_logs").fetchone()[0]
    study = conn.execute("SELECT COUNT(*) FROM activity_logs WHERE predicted_label='study'").fetchone()[0]
    distract = conn.execute("SELECT COUNT(*) FROM activity_logs WHERE predicted_label='distract'").fetchone()[0]
    corrected = conn.execute("SELECT COUNT(*) FROM activity_logs WHERE user_label IS NOT NULL").fetchone()[0]
    mistakes = conn.execute(
        "SELECT COUNT(*) FROM activity_logs WHERE user_label IS NOT NULL AND user_label != predicted_label"
    ).fetchone()[0]
    recent = conn.execute(
        "SELECT id, app_name, window_title, predicted_label, user_label FROM activity_logs ORDER BY id DESC LIMIT 20"
    ).fetchall()

    conn.close()
    return {
        "total": total,
        "study": study,
        "distract": distract,
        "corrected": corrected,
        "mistakes": mistakes,
        "recent": [dict(r) for r in recent]
    }

def get_sessions():
    conn = get_connection()
    conn.row_factory = sqlite3.Row
    sessions = conn.execute("""
        SELECT 
            s.id,
            s.start_time,
            s.end_time,
            COUNT(a.id) as total,
            SUM(CASE WHEN a.predicted_label='study' THEN 1 ELSE 0 END) as study,
            SUM(CASE WHEN a.predicted_label='distract' THEN 1 ELSE 0 END) as distract
        FROM sessions s
        LEFT JOIN activity_logs a ON a.session_id = s.id
        GROUP BY s.id
        ORDER BY s.id DESC
    """).fetchall()
    conn.close()
    return [dict(s) for s in sessions]

def get_session_logs(session_id):
    conn = get_connection()
    conn.row_factory = sqlite3.Row
    rows = conn.execute("""
        SELECT id, app_name, window_title, predicted_label, user_label, timestamp
        FROM activity_logs 
        WHERE session_id=? AND predicted_label IS NOT NULL
        ORDER BY id ASC
    """, (session_id,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_latest_session_id():
    conn = get_connection()
    row = conn.execute("SELECT id FROM sessions ORDER BY id DESC LIMIT 1").fetchone()
    conn.close()
    return row[0] if row else None

def bulk_label_window(session_id, window_title, user_label):
    conn = get_connection()
    conn.execute("""
        UPDATE activity_logs
        SET user_label=?
        WHERE session_id=? AND window_title=?
    """, (user_label, session_id, window_title))
    conn.commit()
    conn.close()



