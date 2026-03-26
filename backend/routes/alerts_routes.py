from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from datetime import datetime, timezone
from models import db, Alert

alerts_bp = Blueprint("alerts", __name__)


@alerts_bp.route("/api/alerts", methods=["GET"])
@jwt_required()
def get_alerts():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    severity = request.args.get("severity", "").strip().lower()
    alert_type = request.args.get("alert_type", "").strip()

    query = Alert.query

    if severity in ("low", "medium", "high", "critical"):
        query = query.filter_by(severity=severity)
    if alert_type:
        query = query.filter(Alert.alert_type.ilike(f"%{alert_type}%"))

    query = query.order_by(Alert.timestamp.desc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        "alerts": [a.to_dict() for a in pagination.items],
        "total": pagination.total,
        "pages": pagination.pages,
        "page": pagination.page,
    }), 200


@alerts_bp.route("/api/alerts/create", methods=["POST"])
@jwt_required()
def create_alert():
    data = request.get_json() or {}
    alert_type = data.get("alert_type", "").strip()
    severity = data.get("severity", "").strip().lower()
    description = data.get("description", "").strip()
    source_ip = data.get("source_ip", "")

    if not alert_type or severity not in ("low", "medium", "high", "critical") or not description:
        return jsonify({"error": "alert_type, severity (low/medium/high/critical), and description are required"}), 400

    alert = Alert(
        alert_type=alert_type,
        severity=severity,
        description=description,
        source_ip=source_ip,
        timestamp=datetime.now(timezone.utc),
    )
    db.session.add(alert)
    db.session.commit()
    return jsonify({"message": "Alert created", "alert": alert.to_dict()}), 201


@alerts_bp.route("/api/alerts/stats", methods=["GET"])
@jwt_required()
def alert_stats():
    total = Alert.query.count()
    critical = Alert.query.filter_by(severity="critical").count()
    high = Alert.query.filter_by(severity="high").count()
    medium = Alert.query.filter_by(severity="medium").count()
    low = Alert.query.filter_by(severity="low").count()

    # Attack type breakdown
    from sqlalchemy import func
    type_counts = db.session.query(
        Alert.alert_type, func.count(Alert.id)
    ).group_by(Alert.alert_type).all()

    return jsonify({
        "total": total,
        "critical": critical,
        "high": high,
        "medium": medium,
        "low": low,
        "by_type": {t: c for t, c in type_counts},
    }), 200
