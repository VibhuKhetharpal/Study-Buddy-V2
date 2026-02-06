from flask import Flask, request, jsonify
from db import insert_activity

app = Flask(__name__)

@app.route("/log", methods=["POST"])
def log_activity():
    data = request.json

    app_name = data.get("app_name")
    window_title = data.get("window_title")

    insert_activity(None, app_name, window_title)

    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(debug=True)                                             
