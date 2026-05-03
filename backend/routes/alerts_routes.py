from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timezone
from models import db, Alert

alerts_bp = Blueprint("alerts", __name__)

@alerts_bp.route("/api/alerts", methods=["GET"])
@jwt_required()
def get_alerts():
    user_id = get_jwt_identity()
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    severity = request.args.get("severity", "").strip().lower()
    alert_type = request.args.get("alert_type", "").strip()

    query = Alert.objects(user_id=user_id)

    if severity in ("low", "medium", "high", "critical"):
        query = query.filter(severity=severity)
    if alert_type:
        query = query.filter(alert_type__icontains=alert_type)

    total = query.count()
    items = query.order_by('-timestamp').skip((page - 1) * per_page).limit(per_page)

    return jsonify({
        "alerts": [a.to_dict() for a in items],
        "total": total,
        "pages": (total + per_page - 1) // per_page,
        "page": page,
    }), 200


@alerts_bp.route("/api/alerts/create", methods=["POST"])
@jwt_required()
def create_alert():
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    alert_type = data.get("alert_type", "").strip()
    severity = data.get("severity", "").strip().lower()
    description = data.get("description", "").strip()
    source_ip = data.get("source_ip", "")

    if not alert_type or severity not in ("low", "medium", "high", "critical") or not description:
        return jsonify({"error": "alert_type, severity (low/medium/high/critical), and description are required"}), 400

    alert = Alert(
        user_id=user_id,
        alert_type=alert_type,
        severity=severity,
        description=description,
        source_ip=source_ip,
        timestamp=datetime.now(timezone.utc),
    )
    alert.save()
    return jsonify({"message": "Alert created", "alert": alert.to_dict()}), 201


@alerts_bp.route("/api/alerts/stats", methods=["GET"])
@jwt_required()
def alert_stats():
    user_id = get_jwt_identity()
    user_alerts = Alert.objects(user_id=user_id)
    
    total = user_alerts.count()
    critical = user_alerts.filter(severity="critical").count()
    high = user_alerts.filter(severity="high").count()
    medium = user_alerts.filter(severity="medium").count()
    low = user_alerts.filter(severity="low").count()

    # Attack type breakdown using aggregation
    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$group": {"_id": "$alert_type", "count": {"$sum": 1}}}
    ]
    type_counts = list(Alert.objects.aggregate(pipeline))

    return jsonify({
        "total": total,
        "critical": critical,
        "high": high,
        "medium": medium,
        "low": low,
        "by_type": {t["_id"]: t["count"] for t in type_counts},
    }), 200
