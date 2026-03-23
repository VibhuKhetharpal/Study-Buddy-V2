import time
import requests
import win32gui
import win32process
import psutil

SERVER = "http://127.0.0.1:5000"


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

        data = response.json()

        return data["session_id"]

    except:
        return None

def stop_session(session_id):

    try:
        requests.post(
            f"{SERVER}/stop",
            json={"session_id": session_id}
        )
    except:
        pass


def send_log(session_id, app_name, window_title):

    payload = {
        "session_id": session_id,
        "app_name": app_name,
        "window_title": window_title
    }

    try:    
        requests.post(
            f"{SERVER}/log",
            json=payload,
            timeout=1
        )
    except:
        pass


if __name__ == "__main__":
    session_id = start_session()
    if session_id is None:
        print("Failed to start session. Check Backend is running.")
        exit()
    print(f"Session started: {session_id}")
    try:
        while True:
            title, app = get_active_window()
            send_log(session_id, app, title)
            time.sleep(2)
    except KeyboardInterrupt:
        stop_session(session_id)
        print("Session stopped.")
