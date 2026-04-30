"""
CyberShield Attack Simulator
Uploads realistic attack log files to:
  1. S3 bucket       -- for backend S3 poller ingestion
  2. CloudWatch Logs -- so you can view them in the AWS console
"""

import boto3
import json
import os
from datetime import datetime, timezone
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# AWS Config
BUCKET      = os.environ.get("S3_BUCKET_NAME", "cyber-threat-logs-anmol")
PREFIX      = os.environ.get("S3_KEY_PREFIX", "logs/")
REGION      = os.environ.get("AWS_REGION", "ap-southeast-2")
ACCESS_KEY  = os.environ.get("AWS_ACCESS_KEY_ID")
SECRET_KEY  = os.environ.get("AWS_SECRET_ACCESS_KEY")

CW_LOG_GROUP  = "cyber-logs"     # Your existing log group in ap-southeast-2
CW_LOG_STREAM = f"cybershield-simulation-{datetime.now().strftime('%Y-%m-%d_%H-%M-%S')}"

ATTACK_LOGS = [
    {"ip": "45.33.32.156",   "event": "SSH Authentication", "status": "failure",
     "details": "failed login attempt on root account from 45.33.32.156"},
    {"ip": "45.33.32.156",   "event": "SSH Authentication", "status": "failure",
     "details": "failed login attempt on admin account, invalid credentials"},
    {"ip": "45.33.32.156",   "event": "SSH Authentication", "status": "failure",
     "details": "failed login attempt on admin account, brute force detected"},
    {"ip": "45.33.32.156",   "event": "SSH Authentication", "status": "failure",
     "details": "failed login attempt on admin account, brute force detected"},
    {"ip": "45.33.32.156",   "event": "SSH Authentication", "status": "failure",
     "details": "failed login attempt on admin account, brute force detected"},
    {"ip": "198.51.100.23",  "event": "HTTP Request",       "status": "failure",
     "details": "POST /login payload: ' OR 1=1 -- SQL injection attempt detected"},
    {"ip": "198.51.100.23",  "event": "HTTP Request",       "status": "failure",
     "details": "GET /users?id=1 UNION SELECT username,password FROM users"},
    {"ip": "203.0.113.99",   "event": "Database Query",     "status": "failure",
     "details": "Malicious SQL: DROP TABLE users; -- attack blocked"},
    {"ip": "91.195.240.117", "event": "Port Scan",          "status": "failure",
     "details": "nmap port scan detected across 65535 ports from 91.195.240.117"},
    {"ip": "91.195.240.117", "event": "FTP Connection",     "status": "failure",
     "details": "scan attack: unauthorized FTP connection attempt"},
    {"ip": "91.195.240.117", "event": "RDP Connection",     "status": "failure",
     "details": "scan attack: unauthorized RDP access attempt"},
    {"ip": "91.195.240.117", "event": "Telnet Connection",  "status": "failure",
     "details": "scan attack: Telnet probe from known scanner IP"},
    {"ip": "91.195.240.117", "event": "SMTP Connection",    "status": "failure",
     "details": "scan attack: SMTP probe on port 25"},
    {"ip": "91.195.240.117", "event": "MySQL Connection",   "status": "failure",
     "details": "scan attack: MySQL probe on port 3306"},
    {"ip": "91.195.240.117", "event": "SSH Connection",     "status": "failure",
     "details": "scan attack: SSH probe from scanner"},
    {"ip": "185.220.101.45", "event": "HTTP Request",       "status": "failure",
     "details": "XSS attack detected: <script>document.cookie</script> in POST body"},
    {"ip": "185.220.101.45", "event": "HTTP Request",       "status": "failure",
     "details": "XSS payload: javascript:alert(1) in referer header"},
    {"ip": "5.188.206.14",   "event": "HTTP Flood",         "status": "failure",
     "details": "DDoS attack signature: 10,000 requests/sec from botnet node"},
    {"ip": "5.188.206.14",   "event": "SYN Flood",          "status": "failure",
     "details": "DDoS SYN flood attack detected on port 80"},
    {"ip": "203.0.113.99",   "event": "HTTP Request",       "status": "failure",
     "details": "Directory traversal: GET /../../../../etc/passwd HTTP/1.1"}
]


def get_clients():
    kwargs = dict(region_name=REGION,
                  aws_access_key_id=ACCESS_KEY,
                  aws_secret_access_key=SECRET_KEY)
    return boto3.client("s3", **kwargs), boto3.client("logs", **kwargs)


def upload_to_s3(s3, now, lines):
    key = f"{PREFIX}attack_simulation_{now.strftime('%Y-%m-%d_%H-%M-%S')}.json"
    s3.put_object(Bucket=BUCKET, Key=key,
                  Body="\n".join(lines).encode("utf-8"),
                  ContentType="application/json")
    print(f"[S3]  Uploaded {len(lines)} logs -> s3://{BUCKET}/{key}")


def upload_to_cloudwatch(cw, now, entries):
    # Create log group if missing
    try:
        cw.create_log_group(logGroupName=CW_LOG_GROUP)
        print(f"[CW]  Created log group : {CW_LOG_GROUP}")
    except cw.exceptions.ResourceAlreadyExistsException:
        print(f"[CW]  Log group exists  : {CW_LOG_GROUP}")

    # Create log stream for this run
    try:
        cw.create_log_stream(logGroupName=CW_LOG_GROUP, logStreamName=CW_LOG_STREAM)
        print(f"[CW]  Created log stream: {CW_LOG_STREAM}")
    except cw.exceptions.ResourceAlreadyExistsException:
        pass

    # Build events (timestamp must be epoch ms, must be strictly increasing)
    base_ts = int(now.timestamp() * 1000)
    events = [
        {
            "timestamp": base_ts + i,
            "message": (f"[{e['status'].upper()}] "
                        f"IP={e['ip']}  Event={e['event']}  | {e['details']}")
        }
        for i, e in enumerate(entries)
    ]

    cw.put_log_events(logGroupName=CW_LOG_GROUP,
                      logStreamName=CW_LOG_STREAM,
                      logEvents=events)
    print(f"[CW]  Published {len(events)} events to CloudWatch")
    print(f"[CW]  Stream   : {CW_LOG_STREAM}")


def simulate():
    now = datetime.now(timezone.utc)
    s3, cw = get_clients()

    for entry in ATTACK_LOGS:
        entry["timestamp"] = now.isoformat()
    lines = [json.dumps(e) for e in ATTACK_LOGS]

    print("=" * 60)
    print("  CyberShield Attack Simulator")
    print("=" * 60)

    upload_to_s3(s3, now, lines)
    upload_to_cloudwatch(cw, now, ATTACK_LOGS)

    print()
    print("Attack types simulated:")
    print("  - SSH Brute Force     (5 failed login attempts)")
    print("  - SQL Injection       (3 payloads)")
    print("  - Port Scanning       (7 service probes)")
    print("  - XSS Attack          (2 payloads)")
    print("  - DDoS / SYN Flood    (2 signatures)")
    print("  - Directory Traversal (1 payload)")
    print()
    print("To view logs on AWS CloudWatch:")
    print(f"  console.aws.amazon.com -> CloudWatch -> Log Groups -> {CW_LOG_GROUP}")
    print(f"  Stream: {CW_LOG_STREAM}")
    print()
    print("Dashboard auto-updates in ~30s at http://localhost:5175")


if __name__ == "__main__":
    simulate()
