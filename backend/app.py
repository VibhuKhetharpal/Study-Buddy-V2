import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'ml'))
from classifier import predict
from flask import Flask, request, jsonify
from db import insert_activity,create_session,end_session


app = Flask(__name__)
@app.route("/start", methods=["POST"])
def start_session():

    session_id = create_session()

    return jsonify({
        "session_id": session_id
    })
@app.route("/log", methods=["POST"])
def log_activity():

    data = request.json

    session_id = data.get("session_id")
    app_name = data.get("app_name")
    window_title = data.get("window_title")

    if session_id is None:
        return jsonify({"error": "session_id required"}), 400

    app_window = app_name+" "+window_title
    prediction = predict(app_window)

   

    insert_activity(session_id, app_name, window_title,prediction)

    return jsonify({"status": "ok"})
@app.route("/stop", methods=["POST"])

def stop_session():

    data = request.json

    session_id = data.get("session_id")

    if session_id is None:
        return jsonify({"error": "session_id required"}), 400

    end_session(session_id)

    return jsonify({"status": "stopped"})
    



if __name__ == "__main__":
    app.run(debug=True)   


                                          
