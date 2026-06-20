"""
Computes model accuracy across ALL logged entries that already have a
confirmed user_label (real ground truth from your own corrections), plus
re-predicts every entry fresh using the CURRENT model (in case the model
was retrained after some entries were logged, so predicted_label in the
DB might be stale).

This gives you the most honest, defensible number: "current model accuracy
against all human-confirmed real usage data."

Run from inside backend/ folder:
    python ../accuracy_test.py
"""
import sqlite3
import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "ml"))
from classifier import predict

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "backend", "database.db")

def main():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute(
        "SELECT app_name, window_title, user_label FROM activity_logs "
        "WHERE user_label IS NOT NULL"
    )
    rows = cur.fetchall()
    conn.close()

    total = len(rows)
    correct = 0
    wrong = []

    print(f"Re-predicting {total} entries with CURRENT model...\n")

    for app, title, true_label in rows:
        fresh_prediction = predict(f"{app} {title}")
        if fresh_prediction == true_label:
            correct += 1
        else:
            wrong.append((app, title, fresh_prediction, true_label))

    print(f"--- RESULTS ---")
    print(f"Tested against: {total} human-confirmed real entries")
    print(f"Current model accuracy: {correct}/{total} ({round(100*correct/total, 1)}%)\n")

    if wrong:
        print(f"Sample misclassifications ({min(10, len(wrong))} of {len(wrong)}):")
        for app, title, pred, actual in wrong[:10]:
            print(f"  [{app}] {title} — predicted {pred}, actual {actual}")

if __name__ == "__main__":
    main()
