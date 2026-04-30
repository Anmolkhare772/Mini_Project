from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from datetime import datetime, timedelta, timezone
from models import db, Log, Alert
from sqlalchemy import func

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.route("/api/dashboard/stats", methods=["GET"])
@jwt_required()
def dashboard_stats():
    total_logs = Log.query.count()
    success_logs = Log.query.filter_by(status="success").count()
    failure_logs = Log.query.filter_by(status="failure").count()
    total_alerts = Alert.query.count()
    critical_alerts = Alert.query.filter_by(severity="critical").count()
    high_alerts = Alert.query.filter_by(severity="high").count()
    medium_alerts = Alert.query.filter_by(severity="medium").count()
    low_alerts = Alert.query.filter_by(severity="low").count()
    unread_alerts = Alert.query.filter_by(is_read=False).count()

    # Unique attacker IPs from alerts
    unique_ips = db.session.query(func.count(func.distinct(Alert.source_ip))).scalar() or 0

    # Attacks over time (last 24 hours, grouped by hour)

    since = datetime.now(timezone.utc) - timedelta(hours=24)
    timeline_raw = db.session.query(
        func.strftime('%Y-%m-%d %H:00', Log.timestamp),
        func.count(Log.id)
    ).filter(Log.timestamp >= since).group_by(
        func.strftime('%Y-%m-%d %H:00', Log.timestamp)
    ).order_by(func.strftime('%Y-%m-%d %H:00', Log.timestamp)).all()
    timeline = [{"time": t, "count": c} for t, c in timeline_raw]

    # Threat type distribution
    type_counts = db.session.query(
        Alert.alert_type, func.count(Alert.id)
    ).group_by(Alert.alert_type).all()
    threat_types = [{"type": t, "count": c} for t, c in type_counts]

    # Top attacker IPs
    top_ips_raw = db.session.query(
        Alert.source_ip, func.count(Alert.id)
    ).filter(Alert.source_ip != "").group_by(Alert.source_ip).order_by(
        func.count(Alert.id).desc()
    ).limit(10).all()
    top_ips = [{"ip": ip, "count": c} for ip, c in top_ips_raw]

    # Event type breakdown from logs
    event_types_raw = db.session.query(
        Log.event_type, func.count(Log.id)
    ).group_by(Log.event_type).order_by(func.count(Log.id).desc()).limit(10).all()
    event_types = [{"type": t, "count": c} for t, c in event_types_raw]

    # Recent alerts
    recent_alerts = [a.to_dict() for a in Alert.query.order_by(Alert.timestamp.desc()).limit(5).all()]

    return jsonify({
        "total_logs": total_logs,
        "success_logs": success_logs,
        "failure_logs": failure_logs,
        "total_alerts": total_alerts,
        "critical_alerts": critical_alerts,
        "high_alerts": high_alerts,
        "medium_alerts": medium_alerts,
        "low_alerts": low_alerts,
        "unread_alerts": unread_alerts,
        "unique_attacker_ips": unique_ips,
        "timeline": timeline,
        "threat_types": threat_types,
        "top_ips": top_ips,
        "event_types": event_types,
        "recent_alerts": recent_alerts,
    }), 200
