import sqlite3
import os
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(os.path.join(BASE_DIR, "ml"))
from classifier import predict

DB_PATH = os.path.join(BASE_DIR, "backend", os.environ.get("DB_FILENAME", "database.db"))


def main():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute(
        "SELECT app_name, window_title, user_label FROM activity_logs "
        "WHERE user_label IS NOT NULL"
    )
    rows = cur.fetchall()
    conn.close()

    total = len(rows)
    if total == 0:
        print("No human-labeled entries found in database.")
        return

    correct = 0
    wrong = []

    print(f"Re-predicting {total} entries with current model...\n")

    for app, title, true_label in rows:
        fresh_prediction = predict(f"{app} {title}")
        if fresh_prediction == true_label:
            correct += 1
        else:
            wrong.append((app, title, fresh_prediction, true_label))

    acc = round(100 * correct / total, 1)
    print("--- RESULTS ---")
    print(f"Tested: {total} human-labeled entries")
    print(f"Accuracy: {correct}/{total} ({acc}%)\n")

    if wrong:
        print(f"Sample misclassifications ({min(10, len(wrong))} of {len(wrong)}):")
        for app, title, pred, actual in wrong[:10]:
            print(f"  [{app}] {title} — predicted {pred}, actual {actual}")


if __name__ == "__main__":
    main()
