import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'ml'))
from classifier import predict,retrain
from flask import Flask, request, jsonify,render_template
from db import insert_activity,create_session,end_session,update_user_label,get_stats,get_sessions,get_session_logs,get_latest_session_id



app = Flask(__name__)
@app.route("/start", methods=["POST"])
def start_session():

    session_id = create_session()

    return jsonify({
        "session_id": session_id
    })

DATA_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'seed_data.csv')

@app.route('/retrain', methods=['POST'])
def retrain_model():
    count = retrain(DATA_PATH)
    return jsonify({"status": "ok", "user_labels_used": count})


@app.route("/log", methods=["POST"])
def log_activity():
    data = request.json
    session_id = data.get("session_id")
    app_name = data.get("app_name")
    window_title = data.get("window_title")

    if not window_title or window_title.strip() == "":
        return jsonify({"status": "skipped"}), 200

    if session_id is None:
        return jsonify({"error": "session_id required"}), 400

    app_window = app_name + " " + window_title
    prediction = predict(app_window)
    insert_activity(session_id, app_name, window_title, prediction)

    return jsonify({"status": "ok", "predicted_label": prediction})

@app.route("/label",methods=["PATCH"])
def label():
    data=request.get_json()
    log_id=data.get("id")
    user_label=data.get("label")

    if not log_id or not user_label:
        return jsonify({"error":"id or label missing"}), 400
    
    if user_label.lower() not in {"study","distract"}:
        return jsonify({"error":"invalid label input"}),400
    
    update_user_label(log_id,user_label)
    
    return jsonify({"success":True}),200


@app.route("/stop", methods=["POST"])
def stop_session():
    data = request.json
    session_id = data.get("session_id")
    if session_id is None:
        return jsonify({"error": "session_id required"}), 400
    summary = end_session(session_id)
    total = summary["study"] + summary["distract"]
    focus_pct = round((summary["study"] / total * 100)) if total > 0 else 0
    return jsonify({
        "status": "stopped",
        "session_id": session_id,
        "study": summary["study"],
        "distract": summary["distract"],
        "focus_percentage": focus_pct
    })
    
@app.route("/sessions")
def sessions():
    return jsonify(get_sessions())

@app.route("/history")
def history():
    return render_template("history.html")



@app.route('/stats')
def stats():
    return jsonify(get_stats())

@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

@app.route('/session/<int:session_id>/logs')
def session_logs(session_id):
    return jsonify(get_session_logs(session_id))

@app.route('/latest_session')
def latest_session():
    sid = get_latest_session_id()
    return jsonify({"session_id": sid})

    



if __name__ == "__main__":
    app.run(debug=True)   


                                          
