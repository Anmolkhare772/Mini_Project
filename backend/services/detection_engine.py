import os
from datetime import datetime, timedelta, timezone
from models import db, Log, Alert, SystemSettings
from flask import current_app
from services.notification_service import dispatch_alert

# Setup model paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR = os.path.join(BASE_DIR, 'ml_engine', 'models')
RF_MODEL_PATH = os.path.join(MODEL_DIR, 'rf_classifier.pkl')
IF_MODEL_PATH = os.path.join(MODEL_DIR, 'isolation_forest.pkl')

ML_ENABLED = False
rf_classifier = None
iso_forest = None

try:
    import joblib
    import pandas as pd
    if os.path.exists(RF_MODEL_PATH) and os.path.exists(IF_MODEL_PATH):
        rf_classifier = joblib.load(RF_MODEL_PATH)
        iso_forest = joblib.load(IF_MODEL_PATH)
        ML_ENABLED = True
        print("[+] Trinetra ML Threat Detection Engine Loaded.")
except ImportError:
    print("[!] pandas/joblib not installed. ML Engine disabled.")
except Exception as e:
    print(f"[!] Warning: ML models not found. Falling back to rule-based engine. ({e})")


def run_detection(user_id=None):
    """
    Analyzes recent logs to detect security threats.
    Uses Machine Learning models if available, otherwise falls back to heuristics.
    Returns a list of newly created Alert objects.
    """
    new_alerts = []
    since_time = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(minutes=5)
    
    # Filter logs by user if provided
    query = Log.objects(timestamp__gte=since_time)
    if user_id:
        query = query.filter(user_id=user_id)
    
    recent_logs = query
    if not recent_logs:
        return new_alerts

    # 1. Feature Engineering: Calculate failed login counts per IP
    failed_logs = [log for log in recent_logs if log.status == "failure"]
    ip_failure_counts = {}
    for log in failed_logs:
        ip = log.ip_address
        ip_failure_counts[ip] = ip_failure_counts.get(ip, 0) + 1

    if ML_ENABLED:
        # Prepare data for ML inference
        ml_data = []
        for log in recent_logs:
            ml_data.append({
                'log_id': log.id,
                'ip_address': log.ip_address,
                'details': log.details,
                'failed_login_count_5m': ip_failure_counts.get(log.ip_address, 0)
            })
        
        df = pd.DataFrame(ml_data)
        
        # 1. Random Forest Classification (Threat vs Normal)
        predictions = rf_classifier.predict(df)
        
        # 2. Isolation Forest (Anomaly Detection)
        # Returns 1 for normal, -1 for anomaly
        anomalies = iso_forest.predict(df)

        for idx, row in df.iterrows():
            is_threat = predictions[idx] == 1
            is_anomaly = anomalies[idx] == -1
            
            if is_threat or is_anomaly:
                ip = row['ip_address']
                alert_type = "ML_THREAT_DETECTED" if is_threat else "ML_ANOMALY_DETECTED"
                
                # Check if we already alerted this IP for this specific threat type in the last 5 mins
                alert_query = Alert.objects(
                    source_ip=ip,
                    alert_type=alert_type,
                    timestamp__gte=since_time
                )
                if user_id:
                    alert_query = alert_query.filter(user_id=user_id)
                
                recent_alert = alert_query.first()
                
                if not recent_alert:
                    desc = f"ML Engine Flagged Activity: '{row['details'][:60]}...'"
                    if is_anomaly and not is_threat:
                        desc = f"Zero-Day Anomaly Detected: Traffic from {ip} deviated from baseline."
                        
                    # Nuanced Severity based on Kaggle Attack Category
                    if is_threat:
                        details_lower = str(row['details']).lower()
                        if any(k in details_lower for k in ['dos', 'exploits', 'backdoor', 'analysis']):
                            assigned_severity = "critical"
                        elif any(k in details_lower for k in ['reconnaissance', 'fuzzers']):
                            assigned_severity = "medium"
                        else:
                            assigned_severity = "high"
                    else:
                        assigned_severity = "high" # Anomalies default to High
                        
                    alert = Alert(
                        user_id=user_id or "system", # Default to system if no user context
                        alert_type=alert_type,
                        severity=assigned_severity,
                        description=desc,
                        source_ip=ip,
                        timestamp=datetime.now(timezone.utc)
                    )
                    alert.save()
                    try:
                        dispatch_alert(current_app._get_current_object(), alert)
                    except:
                        pass
                    new_alerts.append(alert)
        
        return new_alerts

    # -------------------------------------------------------------
    # FALLBACK RULE-BASED ENGINE (If ML models are not compiled yet)
    # -------------------------------------------------------------
    settings = SystemSettings.get_settings()
    for ip, count in ip_failure_counts.items():
        if count >= settings.brute_force_threshold:
            alert_query = Alert.objects(
                source_ip=ip,
                alert_type="REPEATED_FAILURES",
                timestamp__gte=since_time
            )
            if user_id:
                alert_query = alert_query.filter(user_id=user_id)
            
            recent_alert = alert_query.first()
            if not recent_alert:
                alert = Alert(
                    user_id=user_id or "system",
                    alert_type="REPEATED_FAILURES",
                    severity="high",
                    description=f"Rule-Based Detection: {count} failed continuous actions detected from IP {ip}.",
                    source_ip=ip,
                    timestamp=datetime.now(timezone.utc)
                )
                alert.save()
                try:
                    dispatch_alert(current_app._get_current_object(), alert)
                except:
                    pass
                new_alerts.append(alert)

    # Keyword-Based Threats with Severity Levels
    threat_rules = [
        {"keywords": ["sql", "union select", "drop table", "select * from"], "severity": "critical", "type": "SQL_INJECTION"},
        {"keywords": ["ddos", "flood", "10,000 requests"], "severity": "critical", "type": "DOS_ATTACK"},
        {"keywords": ["failed", "attack", "unauthorized"], "severity": "high", "type": "ACCESS_ATTEMPT"},
        {"keywords": ["scan", "nmap"], "severity": "medium", "type": "RECONNAISSANCE"}
    ]

    for log in recent_logs:
        log_details_lower = log.details.lower()
        for rule in threat_rules:
            if any(kw in log_details_lower for kw in rule["keywords"]):
                alert_type = rule["type"]
                alert_query = Alert.objects(
                    source_ip=log.ip_address,
                    alert_type=alert_type,
                    timestamp__gte=since_time
                )
                if user_id:
                    alert_query = alert_query.filter(user_id=user_id)
                
                recent_alert = alert_query.first()
                
                if not recent_alert:
                    alert = Alert(
                        user_id=user_id or "system",
                        alert_type=alert_type,
                        severity=rule["severity"],
                        description=f"Rule-Based Match: '{log.details[:50]}' detected as {alert_type}.",
                        source_ip=log.ip_address,
                        timestamp=datetime.now(timezone.utc)
                    )
                    alert.save()
                    try:
                        dispatch_alert(current_app._get_current_object(), alert)
                    except:
                        pass
                    new_alerts.append(alert)
                    break # Only one alert type per log entry

    return new_alerts
