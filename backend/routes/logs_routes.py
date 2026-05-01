from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required
from datetime import datetime, timezone
from models import db, Log
from services.detection_engine import run_detection

logs_bp = Blueprint("logs", __name__)


@logs_bp.route("/api/logs/sync", methods=["POST"])
@jwt_required()
def sync_from_s3():
    """Manually trigger an immediate S3 ingestion cycle."""
    if not current_app.config.get("S3_BUCKET_NAME"):
        return jsonify({"message": "S3 not configured on this server.", "new_logs": 0}), 200
    from services.s3_ingester import ingest_from_s3
    count = ingest_from_s3(current_app._get_current_object())
    return jsonify({"message": f"S3 sync complete. {count} new log(s) ingested.", "new_logs": count}), 200




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
    log.save()

    # Auto-run detection after inserting a log
    new_alerts = run_detection()

    return jsonify({
        "message": "Log added successfully",
        "log": log.to_dict(),
        "new_alerts": len(new_alerts),
    }), 201

@logs_bp.route("/api/logs/raw", methods=["POST"])
@jwt_required()
def add_raw_log():
    data = request.get_json() or {}
    raw_text = data.get("raw_log", "").strip()
    
    if not raw_text:
        return jsonify({"error": "No log data provided"}), 400
        
    # Attempt to extract an IP address
    import re
    ip_match = re.search(r'\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b', raw_text)
    ip_address = ip_match.group(0) if ip_match else "Unknown IP"
    
    log = Log(
        ip_address=ip_address,
        event_type="Manual Analysis",
        status="success", # default
        details=raw_text,
        timestamp=datetime.now(timezone.utc),
    )
    log.save()
    
    # Run detection on this new entry
    new_alerts = run_detection()
    
    return jsonify({
        "message": "Log processed",
        "log": log.to_dict(),
        "alerts_triggered": [a.to_dict() for a in new_alerts]
    }), 201


@logs_bp.route("/api/logs", methods=["GET"])
@jwt_required()
def get_logs():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    status_filter = request.args.get("status", "").strip().lower()
    event_filter = request.args.get("event_type", "").strip()
    ip_filter = request.args.get("ip_address", "").strip()

    query = Log.objects

    if status_filter in ("success", "failure"):
        query = query.filter(status=status_filter)
    if event_filter:
        query = query.filter(event_type__icontains=event_filter)
    if ip_filter:
        query = query.filter(ip_address__icontains=ip_filter)

    total = query.count()
    items = query.order_by('-timestamp').skip((page - 1) * per_page).limit(per_page)

    return jsonify({
        "logs": [log.to_dict() for log in items],
        "total": total,
        "pages": (total + per_page - 1) // per_page,
        "page": page,
    }), 200


@logs_bp.route("/api/logs/<log_id>", methods=["GET"])
@jwt_required()
def get_log(log_id):
    log = Log.objects(id=log_id).first()
    if not log:
        return jsonify({"error": "Log not found"}), 404
    return jsonify({"log": log.to_dict()}), 200
