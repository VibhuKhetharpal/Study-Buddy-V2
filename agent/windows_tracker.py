import os
import sys
import time
import json
import urllib.request
import urllib.error

try:
    import requests
except ImportError:
    requests = None

try:
    import win32gui
    import win32process
    import psutil
except ImportError:
    win32gui = None
    win32process = None
    psutil = None

SERVER = os.environ.get("STUDY_BUDDY_SERVER", "http://127.0.0.1:5000")
DISTRACT_THRESHOLD_SECONDS = 30
NOTIFY_COOLDOWN_SECONDS = 30


def _http_get_json(url, timeout=2):
    if requests:
        r = requests.get(url, timeout=timeout)
        return r.status_code, r.json()
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.status, json.loads(resp.read().decode("utf-8"))


def _http_post_json(url, payload=None, timeout=2):
    if requests:
        r = requests.post(url, json=payload, timeout=timeout)
        return r.status_code, r.json()
    data = json.dumps(payload or {}).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.status, json.loads(resp.read().decode("utf-8"))


def get_active_window():
    if not win32gui or not win32process or not psutil:
        return "Unknown", "Unknown"

    hwnd = win32gui.GetForegroundWindow()
    if not hwnd:
        return "Unknown", "Unknown"

    title = win32gui.GetWindowText(hwnd).strip()
    _, pid = win32process.GetWindowThreadProcessId(hwnd)

    app = "Unknown"
    try:
        proc = psutil.Process(pid)
        app = proc.name()
        if app.lower().endswith(".exe"):
            app = app[:-4]
    except Exception:
        pass

    if not title:
        title = app

    return title, app


def notify(message):
    try:
        from win10toast import Win10Toast
        toaster = Win10Toast()
        toaster.show_toast("Study Buddy", message, duration=5, threaded=True)
    except Exception:
        pass


def start_session():
    try:
        status, data = _http_post_json(f"{SERVER}/start", timeout=3)
        if status == 200:
            return data.get("session_id")
    except Exception:
        pass
    return None


def stop_session(session_id):
    try:
        _http_post_json(f"{SERVER}/stop", {"session_id": session_id}, timeout=3)
    except Exception:
        pass


def send_log(session_id, app_name, window_title):
    payload = {
        "session_id": session_id,
        "app_name": app_name,
        "window_title": window_title
    }
    try:
        status, data = _http_post_json(f"{SERVER}/log", payload, timeout=2)
        if status == 200:
            return data.get("predicted_label")
    except Exception:
        pass
    return None


def run_diagnostics():
    if not win32gui:
        print("Missing dependencies. Run: pip install pywin32 psutil win10toast")
        return

    title, app = get_active_window()
    print(f"App: {app}")
    print(f"Title: {title}")

    try:
        status, _ = _http_get_json(f"{SERVER}/latest_session", timeout=2)
        print(f"Backend ({SERVER}): HTTP {status}")
    except Exception:
        print(f"Backend ({SERVER}): Not reachable")


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] in ("--test", "-t", "diagnose"):
        run_diagnostics()
        sys.exit(0)

    if not win32gui:
        print("Missing dependencies. Run: pip install pywin32 psutil win10toast")
        sys.exit(1)

    session_id = start_session()
    if session_id is None:
        print(f"Failed to connect to backend at {SERVER}")
        sys.exit(1)

    print(f"Session #{session_id} started")

    last_title = None
    last_app = None
    current_label = None
    distract_start = None
    last_notify = None

    try:
        while True:
            title, app = get_active_window()

            if title != last_title or app != last_app:
                last_title = title
                last_app = app
                current_label = send_log(session_id, app, title)
                tag = f"[{current_label.upper()}]" if current_label else "[...]"
                print(f"{tag:12} {app} — {title}")

            now = time.time()
            if current_label == "distract":
                if distract_start is None:
                    distract_start = now
                elapsed = now - distract_start
                if elapsed >= DISTRACT_THRESHOLD_SECONDS and (
                    last_notify is None or now - last_notify >= NOTIFY_COOLDOWN_SECONDS
                ):
                    notify(f"You've been distracted for {int(elapsed)}s. Get back to work!")
                    last_notify = now
            else:
                distract_start = None
                last_notify = None

            time.sleep(2)
    except KeyboardInterrupt:
        stop_session(session_id)
        print(f"\nSession #{session_id} stopped.")