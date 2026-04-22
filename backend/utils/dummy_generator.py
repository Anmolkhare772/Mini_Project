import random
import time
from datetime import datetime, timezone
from faker import Faker
from models import db, Log
from services.detection_engine import run_detection
import threading

fake = Faker()

NORMAL_IPS = ["192.168.1.10", "192.168.1.22", "10.0.0.5", "10.0.0.14", "172.16.0.3"]
ATTACKER_IPS = ["45.33.32.156", "198.51.100.23", "203.0.113.99", "91.195.240.117"]
SERVICES = ["SSH", "FTP", "HTTP", "HTTPS", "MySQL", "RDP"]

def seed_database_with_logs(app):
    """
    Seeds the database with a mix of normal and malicious logs for demonstration.
    Must be called within an app context.
    """
    if Log.query.count() > 0:
        return # Already seeded
        
    print("Seeding database with initial logs...")
    
    # Generate some normal traffic
    for _ in range(50):
        log = Log(
            timestamp=datetime.now(timezone.utc),
            ip_address=random.choice(NORMAL_IPS),
            event_type=f"{random.choice(SERVICES)} Connection",
            status="success",
            details="Normal connection established"
        )
        db.session.add(log)
        
    # Generate an "Optimal" repeated failure event
    attacker_ip = random.choice(ATTACKER_IPS)
    for _ in range(8):
        log = Log(
            timestamp=datetime.now(timezone.utc),
            ip_address=attacker_ip,
            event_type="Authentication Attempt",
            status="failure",
            details="Invalid credentials provided"
        )
        db.session.add(log)
        
    # Generate a SQL Injection attempt
    log = Log(
        timestamp=datetime.now(timezone.utc),
        ip_address=random.choice(ATTACKER_IPS),
        event_type="HTTP Requests",
        status="success",
        details="POST /login username=' OR 1=1--"
    )
    db.session.add(log)
    
    db.session.commit()
    print("Initial logs seeded.")
    
    # Run detection on initial seed
    run_detection()

def generate_background_logs(app):
    """
    Continuously generates logs in the background.
    """
    with app.app_context():
        while True:
            try:
                # 90% normal, 10% attacker
                is_attacker = random.random() < 0.1
                ip = random.choice(ATTACKER_IPS) if is_attacker else random.choice(NORMAL_IPS)
                
                # Attacker is more likely to fail
                status = "failure" if is_attacker and random.random() < 0.7 else "success"
                
                event_type = f"{random.choice(SERVICES)} Action"
                details = f"Action {status} from {ip}"
                
                # Occasionally insert SQLi if attacker
                if is_attacker and random.random() < 0.2:
                    event_type = "HTTP Request"
                    details = "SELECT * FROM users WHERE name = 'admin' AND '1'='1'"
                    status = "success"

                log = Log(
                    timestamp=datetime.now(timezone.utc),
                    ip_address=ip,
                    event_type=event_type,
                    status=status,
                    details=details
                )
                db.session.add(log)
                db.session.commit()
                
                # Every 5 seconds, run detection
                if random.random() < 0.2:
                    run_detection()
                    
                time.sleep(random.uniform(1, 5)) # Pause 1-5 seconds between logs
            except Exception as e:
                print(f"Error in background log generation: {e}")
                time.sleep(10)

def tail_logs_file(app):
    """
    Tails the local logs.txt file and ingests new lines into the database
    so they appear on the dashboard in real-time.
    """
    import os
    log_path = r"C:\Users\anmol\OneDrive\Desktop\Cyber_Shield\backend\logs.txt"
    if not os.path.exists(log_path):
        open(log_path, 'a').close()

    with app.app_context():
        with open(log_path, "r", encoding='utf-8') as file:
            # Go to the end of the file to only ingest NEW logs, or start from beginning?
            # Let's start from end to simulate typical tail behavior
            file.seek(0, 2)
            while True:
                line = file.readline()
                if not line:
                    time.sleep(1)
                    continue
                
                # Ingest the log
                try:
                    # simple parsing: assume format is raw text, IP might be inside
                    ip = "Unknown IP"
                    import re
                    ip_match = re.search(r'\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b', line)
                    if ip_match:
                        ip = ip_match.group(0)

                    log = Log(
                        timestamp=datetime.now(timezone.utc),
                        ip_address=ip,
                        event_type="File Ingestion",
                        status="success", # default
                        details=line.strip()
                    )
                    db.session.add(log)
                    db.session.commit()
                    
                    # Instantly run detection so dashboard sees it!
                    run_detection()
                except Exception as e:
                    print(f"Error ingesting log line: {e}")

def start_background_generator(app):
    """
    Starts the log generator and file tailer in background threads.
    """
    thread = threading.Thread(target=generate_background_logs, args=(app,), daemon=True)
    thread.start()
    
    tailer = threading.Thread(target=tail_logs_file, args=(app,), daemon=True)
    tailer.start()
    
    print("Background log generator and external file monitor started.")

