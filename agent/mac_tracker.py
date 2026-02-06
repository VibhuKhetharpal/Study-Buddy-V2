import time
import requests
from Quartz import (
    CGWindowListCopyWindowInfo,
    kCGWindowListOptionOnScreenOnly,
    kCGNullWindowID
)
from AppKit import NSWorkspace

def get_active_window():
    ws = NSWorkspace.sharedWorkspace()
    active_app = ws.frontmostApplication()
    app_name = active_app.localizedName()

    windows = CGWindowListCopyWindowInfo(
        kCGWindowListOptionOnScreenOnly,
        kCGNullWindowID
    )

    for w in windows:
        if (
            w.get("kCGWindowLayer") == 0
            and w.get("kCGWindowOwnerName") == app_name
        ):
            title = w.get("kCGWindowName", "")
            return title, app_name

    return "", app_name



if __name__ == "__main__":
    while True:
        title, app = get_active_window()
        print(f"APP: {app} | TITLE: {title}")
        payload= {
            "app_name": app,
            "window_title": title
        }
        try:
            requests.post("http://127.0.0.1:5000/log",json=payload,timeout=1)
        except:
            pass
        time.sleep(2)


