# mac_tracker.py
# Tracks active window/tab titles on macOS using a multi-layer strategy:
# 1. Zero-permission frontmost app detection (lsappinfo)
# 2. Direct browser tab queries for Chrome, Safari, Arc, Brave, Edge
# 3. System Events accessibility query for desktop apps (VS Code, Slack, etc.)
# 4. Automatic app-name fallback so tracking never stalls on empty titles
#
# Triggers a desktop notification after DISTRACT_THRESHOLD_SECONDS of
# continuous distraction, with NOTIFY_COOLDOWN_SECONDS between alerts.

import os
import re
import sys
import time
import json
import subprocess
import urllib.request
import urllib.error

try:
    import requests
except ImportError:
    requests = None

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

BROWSER_SCRIPTS = {
    "Google Chrome": 'tell application "Google Chrome" to if (count of windows) > 0 then return title of active tab of front window',
    "Safari": 'tell application "Safari" to if (count of windows) > 0 then return name of current tab of front window',
    "Arc": 'tell application "Arc" to if (count of windows) > 0 then return title of active tab of front window',
    "Brave Browser": 'tell application "Brave Browser" to if (count of windows) > 0 then return title of active tab of front window',
    "Microsoft Edge": 'tell application "Microsoft Edge" to if (count of windows) > 0 then return title of active tab of front window',
}


def get_frontmost_app():
    """Returns the name of the frontmost application.
    First tries lsappinfo (built into macOS, requires 0 privacy permissions),
    then falls back to System Events."""
    # Method 1: lsappinfo (fast, zero permissions required)
    try:
        res = subprocess.run(['lsappinfo', 'front'], capture_output=True, text=True, timeout=1)
        if res.returncode == 0 and res.stdout.strip():
            asn = res.stdout.strip()
            res2 = subprocess.run(['lsappinfo', 'info', '-only', 'name', asn], capture_output=True, text=True, timeout=1)
            if res2.returncode == 0:
                match = re.search(r'="([^"]+)"', res2.stdout)
                if match:
                    name = match.group(1).strip().strip('\u200e\u200f')
                    if name:
                        return name
    except Exception:
        pass

    # Method 2: System Events via osascript
    try:
        script = 'tell application "System Events" to get name of first application process whose frontmost is true'
        res = subprocess.run(['osascript', '-e', script], capture_output=True, text=True, timeout=2)
        if res.returncode == 0 and res.stdout.strip():
            return res.stdout.strip()
    except Exception:
        pass

    return "Unknown"


def get_window_or_tab_title(app_name):
    """Retrieves the active window or tab title for the frontmost application.
    1. For known browsers: asks the browser directly for the active tab title.
    2. For other applications: asks System Events for window 1 title.
    3. Fallback: returns app_name if no title is available."""
    if not app_name or app_name == "Unknown":
        return "", None

    # 1. Direct browser tab query
    if app_name in BROWSER_SCRIPTS:
        try:
            res = subprocess.run(['osascript', '-e', BROWSER_SCRIPTS[app_name]], capture_output=True, text=True, timeout=2)
            if res.returncode == 0 and res.stdout.strip():
                return res.stdout.strip(), None
        except Exception:
            pass

    # 2. Desktop applications: query System Events for window 1
    # Escape quotes in app name to prevent AppleScript syntax errors
    escaped_app = app_name.replace('"', '\\"')
    generic_script = f'''
    tell application "System Events"
        tell process "{escaped_app}"
            if exists window 1 then
                return name of window 1
            end if
        end tell
    end tell
    '''
    err = None
    try:
        res = subprocess.run(['osascript', '-e', generic_script], capture_output=True, text=True, timeout=2)
        if res.returncode == 0 and res.stdout.strip():
            return res.stdout.strip(), None
        if res.returncode != 0:
            err = res.stderr.strip()
    except Exception as e:
        err = str(e)

    # 3. Fallback: return app_name so logs are never dropped
    return app_name, err


def get_active_window():
    """Returns (title, app, error). Never returns empty app or title."""
    app = get_frontmost_app()
    title, err = get_window_or_tab_title(app)
    if not title:
        title = app
    return title, app, err


def check_permissions():
    """Checks whether System Events / AppleScript is allowed, and prints clear
    actionable guidance if permissions are missing."""
    test_script = 'tell application "System Events" to get name of first application process whose frontmost is true'
    try:
        result = subprocess.run(['osascript', '-e', test_script], capture_output=True, text=True, timeout=2)
        if result.returncode != 0:
            err = result.stderr.strip()
            low = err.lower()
            if any(k in low for k in ["not allowed", "assistive access", "-1743", "not authorized"]):
                print("\n" + "=" * 64)
                print("STUDY BUDDY PERMISSION NOTICE (macOS):")
                print("macOS is restricting accessibility/automation for this terminal.")
                print("To unlock full window-title inspection:")
                print("  1. Open System Settings > Privacy & Security > Accessibility")
                print("     -> Turn ON the toggle for your terminal (Terminal, iTerm, VS Code).")
                print("  2. Open System Settings > Privacy & Security > Automation")
                print("     -> Expand your terminal and check 'System Events'.")
                print("  (Note: Study Buddy will still track active apps using its fallback system!)")
                print("=" * 64 + "\n")
                return False
    except Exception:
        pass
    return True


def notify(message):
    try:
        subprocess.run([
            'osascript', '-e',
            f'display notification "{message}" with title "Study Buddy"'
        ], timeout=2)
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
    print("\n" + "=" * 50)
    print("      STUDY BUDDY — MAC TRACKER DIAGNOSTICS")
    print("=" * 50)
    
    # 1. App & Window Detection
    app = get_frontmost_app()
    title, err = get_window_or_tab_title(app)
    print(f"• Frontmost App:       {app}")
    print(f"• Window / Tab Title:  {title}")
    if err:
        print(f"• System Events Note:  {err}")

    # 2. Permissions Check
    has_perm = check_permissions()
    print(f"• Permissions:         {'✓ Granted' if has_perm else '⚠ Needs Permission (Fallback Active)'}")

    # 3. Backend Connection
    try:
        status, _ = _http_get_json(f"{SERVER}/latest_session", timeout=2)
        print(f"• Backend ({SERVER}): ✓ Connected (Status {status})")
    except Exception:
        print(f"• Backend ({SERVER}): ✗ Not running! Run 'python backend/app.py' first.")
    
    print("=" * 50 + "\n")


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] in ("--test", "-t", "diagnose"):
        run_diagnostics()
        sys.exit(0)

    session_id = start_session()
    if session_id is None:
        print(f"Failed to start session. Make sure backend is running on {SERVER}.")
        sys.exit(1)

    print(f"Study Buddy started session #{session_id}")
    print("Tracking active windows... (Press Ctrl+C to stop)\n")

    check_permissions()

    last_title = None
    last_app = None
    current_label = None
    distract_start = None
    last_notify = None

    try:
        while True:
            title, app, _ = get_active_window()

            # Trigger log when either the window title or application changes
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