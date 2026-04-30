import os
from datetime import datetime, timedelta, timezone
from models import db, Log, Alert, SystemSettings
from flask import current_app
from services.notification_service import dispatch_alert

# Load ML Models
MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'ml_engine', 'models')
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
        print("[✔] Machine Learning Threat Detection Engine Loaded.")
except ImportError:
    print("[!] pandas/joblib not installed. ML Engine disabled.")
except Exception as e:
    print(f"[!] Warning: ML models not found. Falling back to rule-based engine. ({e})")


def run_detection():
    """
    Analyzes recent logs to detect security threats.
    Uses Machine Learning models if available, otherwise falls back to heuristics.
    Returns a list of newly created Alert objects.
    """
    new_alerts = []
    since_time = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(minutes=5)
    
    recent_logs = Log.query.filter(Log.timestamp >= since_time).all()
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
                recent_alert = Alert.query.filter(
                    Alert.source_ip == ip,
                    Alert.alert_type == alert_type,
                    Alert.timestamp >= since_time
                ).first()
                
                if not recent_alert:
                    desc = f"ML Engine Flagged Activity: '{row['details'][:60]}...'"
                    if is_anomaly and not is_threat:
                        desc = f"Zero-Day Anomaly Detected: Traffic from {ip} deviated from baseline."
                        
                    alert = Alert(
                        alert_type=alert_type,
                        severity="critical" if is_threat else "high",
                        description=desc,
                        source_ip=ip,
                        timestamp=datetime.now(timezone.utc).replace(tzinfo=None)
                    )
                    db.session.add(alert)
                    db.session.flush()
                    try:
                        dispatch_alert(current_app._get_current_object(), alert)
                    except:
                        pass
                    new_alerts.append(alert)
        
        if new_alerts:
            db.session.commit()
        return new_alerts

    # -------------------------------------------------------------
    # FALLBACK RULE-BASED ENGINE (If ML models are not compiled yet)
    # -------------------------------------------------------------
    settings = SystemSettings.get_settings()
    for ip, count in ip_failure_counts.items():
        if count >= settings.brute_force_threshold:
            recent_alert = Alert.query.filter(
                Alert.source_ip == ip,
                Alert.alert_type == "REPEATED_FAILURES",
                Alert.timestamp >= since_time
            ).first()
            if not recent_alert:
                alert = Alert(
                    alert_type="REPEATED_FAILURES",
                    severity="high",
                    description=f"Rule-Based Detection: {count} failed continuous actions detected from IP {ip}.",
                    source_ip=ip,
                    timestamp=datetime.now(timezone.utc).replace(tzinfo=None)
                )
                db.session.add(alert)
                db.session.flush()
                try:
                    dispatch_alert(current_app._get_current_object(), alert)
                except:
                    pass
                new_alerts.append(alert)

    # Generic Keyword Threats
    generic_keywords = ["failed", "attack", "sql", "scan", "union select"]
    for log in recent_logs:
        log_details_lower = log.details.lower()
        if any(keyword in log_details_lower for keyword in generic_keywords):
             recent_alert = Alert.query.filter(
                Alert.source_ip == log.ip_address,
                Alert.alert_type == "KEYWORD_MATCH",
                Alert.timestamp >= since_time
             ).first()
             if not recent_alert:
                 alert = Alert(
                     alert_type="KEYWORD_MATCH",
                     severity="high",
                     description=f"Rule-Based Text Match: '{log.details[:50]}' contained flagged keywords.",
                     source_ip=log.ip_address,
                     timestamp=datetime.now(timezone.utc).replace(tzinfo=None)
                 )
                 db.session.add(alert)
                 db.session.flush()
                 try:
                    dispatch_alert(current_app._get_current_object(), alert)
                 except:
                    pass
                 new_alerts.append(alert)

    if new_alerts:
        db.session.commit()
        
    return new_alerts
