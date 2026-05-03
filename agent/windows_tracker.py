import time
import requests
import win32gui
import win32process
import psutil
from win10toast import Win10Toast

SERVER = "http://127.0.0.1:5000"
toaster = Win10Toast()
distract_streak = 0
DISTRACT_THRESHOLD = 15

def get_active_window():
    hwnd = win32gui.GetForegroundWindow()
    title = win32gui.GetWindowText(hwnd)
    _, pid = win32process.GetWindowThreadProcessId(hwnd)
    try:
        app = psutil.Process(pid).name()
    except:
        app = "Unknown"
    return title, app

def start_session():
    try:
        response = requests.post(f"{SERVER}/start")
        return response.json()["session_id"]
    except:
        return None

def stop_session(session_id):
    try:
        requests.post(f"{SERVER}/stop", json={"session_id": session_id})
    except:
        pass

def send_log(session_id, app_name, window_title):
    payload = {
        "session_id": session_id,
        "app_name": app_name,
        "window_title": window_title
    }
    try:
        response = requests.post(f"{SERVER}/log", json=payload, timeout=1)
        return response.json().get("predicted_label")
    except:
        return None

if __name__ == "__main__":
    session_id = start_session()
    if session_id is None:
        print("Failed to start session. Check backend is running.")
        exit()
    print(f"Session started: {session_id}")

    last_title = None

    try:
        while True:
            title, app = get_active_window()

            if title == last_title:
                time.sleep(2)
                continue

            last_title = title
            label = send_log(session_id, app, title)

            if label == "distract":
                distract_streak += 1
                if distract_streak == DISTRACT_THRESHOLD:
                    toaster.show_toast(
                        "Study Buddy",
                        "You've been distracted for 30 seconds. Get back to work!",
                        duration=5,
                        threaded=True
                    )
                    distract_streak = 0
            else:
                distract_streak = 0

            time.sleep(2)
    except KeyboardInterrupt:
        stop_session(session_id)
        print("Session stopped.")