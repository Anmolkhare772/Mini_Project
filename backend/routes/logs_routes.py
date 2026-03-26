from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from datetime import datetime, timezone
from models import db, Log
from services.detection_engine import run_detection

logs_bp = Blueprint("logs", __name__)


@logs_bp.route("/api/logs/add", methods=["POST"])
@jwt_required()
def add_log():
    data = request.get_json() or {}
    ip_address = data.get("ip_address", "").strip()
    event_type = data.get("event_type", "").strip()
    status = data.get("status", "").strip().lower()
    details = data.get("details", "")

    if not ip_address or not event_type or status not in ("success", "failure"):
        return jsonify({"error": "ip_address, event_type, and status (success/failure) are required"}), 400

    log = Log(
        ip_address=ip_address,
        event_type=event_type,
        status=status,
        details=details,
        timestamp=datetime.now(timezone.utc),
    )
    db.session.add(log)
    db.session.commit()

    # Auto-run detection after inserting a log
    new_alerts = run_detection()

    return jsonify({
        "message": "Log added successfully",
        "log": log.to_dict(),
        "new_alerts": len(new_alerts),
    }), 201


@logs_bp.route("/api/logs", methods=["GET"])
@jwt_required()
def get_logs():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    status_filter = request.args.get("status", "").strip().lower()
    event_filter = request.args.get("event_type", "").strip()
    ip_filter = request.args.get("ip_address", "").strip()

    query = Log.query

    if status_filter in ("success", "failure"):
        query = query.filter_by(status=status_filter)
    if event_filter:
        query = query.filter(Log.event_type.ilike(f"%{event_filter}%"))
    if ip_filter:
        query = query.filter(Log.ip_address.ilike(f"%{ip_filter}%"))

    query = query.order_by(Log.timestamp.desc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        "logs": [log.to_dict() for log in pagination.items],
        "total": pagination.total,
        "pages": pagination.pages,
        "page": pagination.page,
    }), 200


@logs_bp.route("/api/logs/<int:log_id>", methods=["GET"])
@jwt_required()
def get_log(log_id):
    log = Log.query.get(log_id)
    if not log:
        return jsonify({"error": "Log not found"}), 404
    return jsonify({"log": log.to_dict()}), 200
