from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.detection_engine import run_detection

detect_bp = Blueprint("detect", __name__)

@detect_bp.route("/api/detect", methods=["POST"])
@jwt_required()
def detect():
    user_id = get_jwt_identity()
    new_alerts = run_detection(user_id=user_id)
    return jsonify({
        "message": f"Detection complete. {len(new_alerts)} new alert(s) generated.",
        "alerts": [a.to_dict() for a in new_alerts],
    }), 200
