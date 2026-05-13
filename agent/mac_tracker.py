# mac_tracker.py
# Tracks active window titles on macOS using osascript.
# Sends logs to the Flask backend every time the window changes.
# Triggers a desktop notification after 30 seconds of continuous distraction.
# Not being updated as of right now windows tracker is a priority 


import time
import requests
import subprocess

SERVER = "http://127.0.0.1:5000"
distract_streak = 0
DISTRACT_THRESHOLD = 15

def get_active_window():
    script = '''
    tell application "System Events"
        set frontApp to name of first application process whose frontmost is true
        set frontWindow to ""
        tell process frontApp
            if exists window 1 then
                set frontWindow to name of window 1
            end if
        end tell
    end tell
    return frontApp & "|" & frontWindow
    '''
    try:
        result = subprocess.run(['osascript', '-e', script], capture_output=True, text=True, timeout=2)
        parts = result.stdout.strip().split('|')
        app = parts[0] if len(parts) > 0 else "Unknown"
        title = parts[1] if len(parts) > 1 else ""
        return title, app
    except:
        return "", "Unknown"

def notify(message):
    subprocess.run([
        'osascript', '-e',
        f'display notification "{message}" with title "Study Buddy"'
    ])

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
                    notify("You've been distracted for 30 seconds. Get back to work!")
                    distract_streak = 0
            else:
                distract_streak = 0

            time.sleep(2)
    except KeyboardInterrupt:
        stop_session(session_id)
        print("Session stopped.")