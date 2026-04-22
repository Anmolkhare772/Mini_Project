from datetime import datetime, timedelta, timezone
from models import db, Log, Alert

def run_detection():
    """
    Analyzes recent logs to detect security threats.
    Returns a list of newly created Alert objects.
    """
    new_alerts = []
    
    # 1. OPTIMAL Threat Detection: Repeated Failures (formerly Brute Force)
    # Check for > 5 failed logins within the last 5 minutes from the same IP.
    five_mins_ago = datetime.now(timezone.utc) - timedelta(minutes=5)
    
    # Group by IP for failed logins in the last 5 minutes
    failed_logs = Log.query.filter(
        Log.status == "failure",
        Log.timestamp >= five_mins_ago
    ).all()
    
    ip_failure_counts = {}
    for log in failed_logs:
        ip = log.ip_address
        ip_failure_counts[ip] = ip_failure_counts.get(ip, 0) + 1
        
    for ip, count in ip_failure_counts.items():
        if count > 5:
            # Check if an alert for this IP was recently created to avoid spam
            recent_alert = Alert.query.filter(
                Alert.source_ip == ip,
                Alert.alert_type == "REPEATED_FAILURES",
                Alert.timestamp >= five_mins_ago
            ).first()
            
            if not recent_alert:
                alert = Alert(
                    alert_type="REPEATED_FAILURES",
                    severity="high",
                    description=f"Optimal Detection: {count} failed continuous actions detected from IP {ip} in the last 5 minutes.",
                    source_ip=ip,
                    timestamp=datetime.now(timezone.utc)
                )
                db.session.add(alert)
                new_alerts.append(alert)

    # 2. Suspicious IP / Location / Activity
    # Check if the IP is known to be an attacker (mock list for demonstration)
    ATTACKER_IPS = ["45.33.32.156", "198.51.100.23", "203.0.113.99", "91.195.240.117", "185.220.101.45"]
    
    suspicious_logs = Log.query.filter(
        Log.ip_address.in_(ATTACKER_IPS),
        Log.timestamp >= five_mins_ago
    ).all()
    
    suspicious_ips = set([log.ip_address for log in suspicious_logs])
    
    for ip in suspicious_ips:
        recent_alert = Alert.query.filter(
            Alert.source_ip == ip,
            Alert.alert_type == "SUSPICIOUS_IP",
            Alert.timestamp >= five_mins_ago
        ).first()
        
        if not recent_alert:
            alert = Alert(
                alert_type="SUSPICIOUS_IP",
                severity="medium",
                description=f"Activity detected from a known suspicious IP address: {ip}.",
                source_ip=ip,
                timestamp=datetime.now(timezone.utc)
            )
            db.session.add(alert)
            new_alerts.append(alert)
            
    # 3. SQL Injection Attempts
    sql_keywords = ["UNION SELECT", "DROP TABLE", "OR 1=1", "SLEEP(", "WAITFOR"]
    for log in Log.query.filter(Log.timestamp >= five_mins_ago).all():
        log_details_upper = log.details.upper()
        if any(keyword in log_details_upper for keyword in sql_keywords):
             recent_alert = Alert.query.filter(
                Alert.source_ip == log.ip_address,
                Alert.alert_type == "SQL_INJECTION",
                Alert.timestamp >= five_mins_ago
             ).first()
             
             if not recent_alert:
                 alert = Alert(
                     alert_type="SQL_INJECTION",
                     severity="critical",
                     description=f"Potential SQL Injection payload detected from IP {log.ip_address}: {log.details[:50]}...",
                     source_ip=log.ip_address,
                     timestamp=datetime.now(timezone.utc)
                 )
                 db.session.add(alert)
                 new_alerts.append(alert)
                 
    # 4. Port Scanning Detection (Too many different event/port access attempts)
    # This checks if a single IP triggered many different unique event types
    recent_logs = Log.query.filter(Log.timestamp >= five_mins_ago).all()
    ip_events = {}
    for log in recent_logs:
        ip = log.ip_address
        if ip not in ip_events:
            ip_events[ip] = set()
        ip_events[ip].add(log.event_type)
        
    for ip, events in ip_events.items():
        if len(events) >= 10: # 10 unique events in 5 minutes
             recent_alert = Alert.query.filter(
                Alert.source_ip == ip,
                Alert.alert_type == "BEHAVIORAL_ANOMALY",
                Alert.timestamp >= five_mins_ago
             ).first()
             
             if not recent_alert:
                 alert = Alert(
                     alert_type="BEHAVIORAL_ANOMALY",
                     severity="high",
                     description=f"Optimal Behavioral Anomaly: IP {ip} triggered {len(events)} different event types in a short time, potential scanning.",
                     source_ip=ip,
                     timestamp=datetime.now(timezone.utc)
                 )
                 db.session.add(alert)
                 new_alerts.append(alert)
                 
    # 5. Generic Keyword Threats (from uploaded detect (1).py)
    generic_keywords = ["failed", "attack", "sql", "scan"]
    for log in Log.query.filter(Log.timestamp >= five_mins_ago).all():
        log_details_lower = log.details.lower()
        # Ensure we don't duplicate alerts for the same log line
        if any(keyword in log_details_lower for keyword in generic_keywords):
             recent_alert = Alert.query.filter(
                Alert.source_ip == log.ip_address,
                Alert.alert_type == "KEYWORD_MATCH",
                Alert.timestamp >= five_mins_ago
             ).first()
             
             if not recent_alert:
                 alert = Alert(
                     alert_type="KEYWORD_MATCH",
                     severity="high",
                     description=f"Rule-Based Text Match: '{log.details[:50]}' contained flagged keywords.",
                     source_ip=log.ip_address,
                     timestamp=datetime.now(timezone.utc)
                 )
                 db.session.add(alert)
                 new_alerts.append(alert)

    # 6. Brute Force Login Detection (from ChatGPT detect_threat() logic)
    # Detects any log containing "failed login" phrase — maps directly to ChatGPT's rule
    brute_force_logs = Log.query.filter(Log.timestamp >= five_mins_ago).all()
    for log in brute_force_logs:
        if "failed login" in log.details.lower():
            recent_alert = Alert.query.filter(
                Alert.source_ip == log.ip_address,
                Alert.alert_type == "BRUTE_FORCE_LOGIN",
                Alert.timestamp >= five_mins_ago
            ).first()
            if not recent_alert:
                alert = Alert(
                    alert_type="BRUTE_FORCE_LOGIN",
                    severity="high",
                    description=f"⚠️ Brute Force Login Detected from IP {log.ip_address}: '{log.details[:60]}'",
                    source_ip=log.ip_address,
                    timestamp=datetime.now(timezone.utc)
                )
                db.session.add(alert)
                new_alerts.append(alert)
                print(f"⚠️ Brute force detected from {log.ip_address}")

    if new_alerts:
        db.session.commit()
        
    return new_alerts

