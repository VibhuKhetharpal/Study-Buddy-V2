"""
Evaluates the Study Buddy classifier against test_set_1000.csv -- a
held-out set of 1000 unique, labeled window titles that were NOT used
during training. Reports overall accuracy plus a per-class breakdown.

Run from inside ml/ (or adjust sys.path below to match your setup):
    python evaluate_model.py
"""
import csv
import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from classifier import predict

TEST_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "test_set_1000.csv")


def evaluate():
    with open(TEST_FILE) as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    total = len(rows)
    correct = 0
    study_total = 0
    study_correct = 0
    distract_total = 0
    distract_correct = 0
    misclassified = []

    for row in rows:
        text = row["text"]
        true_label = row["label"]
        predicted = predict(text)

        is_correct = predicted == true_label
        if is_correct:
            correct += 1
        else:
            misclassified.append((text, true_label, predicted))

        if true_label == "study":
            study_total += 1
            if is_correct:
                study_correct += 1
        else:
            distract_total += 1
            if is_correct:
                distract_correct += 1

    accuracy = correct / total * 100
    study_acc = (study_correct / study_total * 100) if study_total else 0
    distract_acc = (distract_correct / distract_total * 100) if distract_total else 0

    print(f"\n{'='*50}")
    print(f"Overall Accuracy: {correct}/{total} = {accuracy:.2f}%")
    print(f"{'='*50}")
    print(f"Study accuracy:    {study_correct}/{study_total} = {study_acc:.2f}%")
    print(f"Distract accuracy: {distract_correct}/{distract_total} = {distract_acc:.2f}%")
    print(f"{'='*50}\n")

    if misclassified:
        print(f"Sample misclassifications (showing up to 15 of {len(misclassified)}):")
        for text, true_label, predicted in misclassified[:15]:
            print(f"  '{text}' -> predicted: {predicted}, actual: {true_label}")

    return accuracy


if __name__ == "__main__":
    evaluate()
