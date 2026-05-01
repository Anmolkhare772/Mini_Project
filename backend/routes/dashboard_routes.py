from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from datetime import datetime, timedelta, timezone
from models import db, Log, Alert

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.route("/api/dashboard/stats", methods=["GET"])
@jwt_required()
def dashboard_stats():
    total_logs = Log.objects.count()
    success_logs = Log.objects(status="success").count()
    failure_logs = Log.objects(status="failure").count()
    total_alerts = Alert.objects.count()
    critical_alerts = Alert.objects(severity="critical").count()
    high_alerts = Alert.objects(severity="high").count()
    medium_alerts = Alert.objects(severity="medium").count()
    low_alerts = Alert.objects(severity="low").count()
    unread_alerts = Alert.objects(is_read=False).count()

    unique_ips = len(Alert.objects(source_ip__ne="").distinct("source_ip"))

    # Attacks over time (last 24 hours, grouped by hour)
    since = datetime.now(timezone.utc) - timedelta(hours=24)
    timeline_pipeline = [
        {"$match": {"timestamp": {"$gte": since}}},
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
        {"$group": {"_id": "$alert_type", "count": {"$sum": 1}}}
    ]
    type_counts = list(Alert.objects.aggregate(type_pipeline))
    threat_types = [{"type": t["_id"], "count": t["count"]} for t in type_counts]
 
    # Top attacker IPs
    top_ips_pipeline = [
        {"$match": {"source_ip": {"$ne": ""}}},
        {"$group": {"_id": "$source_ip", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    top_ips_raw = list(Alert.objects.aggregate(top_ips_pipeline))
    top_ips = [{"ip": t["_id"], "count": t["count"]} for t in top_ips_raw]
 
    # Event type breakdown from logs
    event_pipeline = [
        {"$group": {"_id": "$event_type", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    event_types_raw = list(Log.objects.aggregate(event_pipeline))
    event_types = [{"type": t["_id"], "count": t["count"]} for t in event_types_raw]
 
    # Recent alerts
    recent_alerts = [a.to_dict() for a in Alert.objects.order_by('-timestamp').limit(5)]

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
