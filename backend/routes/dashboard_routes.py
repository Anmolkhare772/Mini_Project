from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta, timezone
from models import db, Log, Alert
from services.simulation_service import start_user_simulation

dashboard_bp = Blueprint("dashboard", __name__)

@dashboard_bp.route("/api/dashboard/stats", methods=["GET"])
@jwt_required()
def dashboard_stats():
    user_id = get_jwt_identity()
    start_user_simulation(user_id)
    user_logs = Log.objects(user_id=user_id)
    user_alerts = Alert.objects(user_id=user_id)

    total_logs = user_logs.count()
    success_logs = user_logs.filter(status="success").count()
    failure_logs = user_logs.filter(status="failure").count()
    
    total_alerts = user_alerts.count()
    critical_alerts = user_alerts.filter(severity="critical").count()
    high_alerts = user_alerts.filter(severity="high").count()
    medium_alerts = user_alerts.filter(severity="medium").count()
    low_alerts = user_alerts.filter(severity="low").count()
    unread_alerts = user_alerts.filter(is_read=False).count()

    unique_ips = len(user_alerts.filter(source_ip__ne="").distinct("source_ip"))

    # Attacks over time (last 24 hours, grouped by hour)
    since = datetime.now(timezone.utc) - timedelta(hours=24)
    timeline_pipeline = [
        {"$match": {"user_id": user_id, "timestamp": {"$gte": since}}},
        {"$group": {
            "_id": {
                "$dateToString": {"format": "%Y-%m-%d %H:00", "date": "$timestamp"}
            },
            "count": {"$sum": 1}
        }},
        {"$sort": {"_id": 1}}
    ]
    timeline_raw = list(Log.objects.aggregate(timeline_pipeline))
    timeline = [{"time": t["_id"], "count": t["count"]} for t in timeline_raw]

    # Threat type distribution
    type_pipeline = [
        {"$match": {"user_id": user_id}},
        {"$group": {"_id": "$alert_type", "count": {"$sum": 1}}}
    ]
    type_counts = list(Alert.objects.aggregate(type_pipeline))
    threat_types = [{"type": t["_id"], "count": t["count"]} for t in type_counts]
 
    # Top attacker IPs
    top_ips_pipeline = [
        {"$match": {"user_id": user_id, "source_ip": {"$ne": ""}}},
        {"$group": {"_id": "$source_ip", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    top_ips_raw = list(Alert.objects.aggregate(top_ips_pipeline))
    top_ips = [{"ip": t["_id"], "count": t["count"]} for t in top_ips_raw]
 
    # Event type breakdown from logs
    event_pipeline = [
        {"$match": {"user_id": user_id}},
        {"$group": {"_id": "$event_type", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    event_types_raw = list(Log.objects.aggregate(event_pipeline))
    event_types = [{"type": t["_id"], "count": t["count"]} for t in event_types_raw]
 
    # Recent alerts
    recent_alerts = [a.to_dict() for a in user_alerts.order_by('-timestamp').limit(5)]

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
