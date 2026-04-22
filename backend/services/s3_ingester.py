import time
import json
import re
import threading
from datetime import datetime, timezone

# ──────────────────────────────────────────────────────────────────────────────
# S3 Ingester Service
# Polls your S3 bucket every POLL_INTERVAL seconds for new log files written
# by Lambda. Each file is parsed, stored in the DB, and run through detection.
# The IngestedFile table guarantees zero duplicate entries.
# ──────────────────────────────────────────────────────────────────────────────

POLL_INTERVAL = 30  # seconds between S3 checks

_lock = threading.Lock()  # prevents concurrent ingestion runs


def _get_s3_client(app):
    """Build a boto3 S3 client using config from Flask app."""
    import boto3
    return boto3.client(
        "s3",
        region_name=app.config.get("AWS_REGION", "us-east-1"),
        aws_access_key_id=app.config.get("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=app.config.get("AWS_SECRET_ACCESS_KEY"),
    )


def _parse_log_line(line: str):
    """
    Parse a single log line from the S3 file.
    Supports two formats:
      1. JSON  → {"ip": "...", "event": "...", "status": "...", "details": "..."}
      2. Plain text → extracts IP via regex, treats full line as details
    Returns a dict with keys: ip_address, event_type, status, details, timestamp
    """
    line = line.strip()
    if not line:
        return None

    try:
        data = json.loads(line)
        return {
            "ip_address": data.get("ip", data.get("ip_address", "Unknown")),
            "event_type": data.get("event", data.get("event_type", "CloudWatch Log")),
            "status":     data.get("status", "success"),
            "details":    data.get("details", data.get("message", line[:500])),
        }
    except (json.JSONDecodeError, ValueError):
        # Plain text fallback
        ip_match = re.search(r"\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b", line)
        ip = ip_match.group(0) if ip_match else "Unknown"
        return {
            "ip_address": ip,
            "event_type": "CloudWatch Log",
            "status":     "failure" if any(k in line.lower() for k in ["fail", "error", "attack", "deny"]) else "success",
            "details":    line[:500],
        }


def ingest_from_s3(app):
    """
    Single ingestion run — called by the background thread and the manual
    /api/logs/sync endpoint.
    Returns the count of new logs inserted.
    """
    from models import db, Log, IngestedFile
    from services.detection_engine import run_detection

    bucket = app.config.get("S3_BUCKET_NAME")
    prefix = app.config.get("S3_KEY_PREFIX", "logs/")

    if not bucket:
        print("[WARN] S3_BUCKET_NAME not set -- skipping S3 ingestion.")
        return 0

    with _lock:
        try:
            s3 = _get_s3_client(app)

            # List all objects under the prefix
            paginator = s3.get_paginator("list_objects_v2")
            pages = paginator.paginate(Bucket=bucket, Prefix=prefix)

            new_log_count = 0

            for page in pages:
                for obj in page.get("Contents", []):
                    key = obj["Key"]

                    # Skip if already ingested
                    if IngestedFile.query.filter_by(s3_key=key).first():
                        continue

                    print(f"[S3] Ingesting new file: {key}")

                    # Download the file content
                    response = s3.get_object(Bucket=bucket, Key=key)
                    body = response["Body"].read().decode("utf-8", errors="replace")

                    # Parse each line
                    lines_inserted = 0
                    for line in body.splitlines():
                        parsed = _parse_log_line(line)
                        if not parsed:
                            continue
                        log = Log(
                            timestamp=datetime.now(timezone.utc),
                            ip_address=parsed["ip_address"],
                            event_type=parsed["event_type"],
                            status=parsed["status"],
                            details=parsed["details"],
                        )
                        db.session.add(log)
                        lines_inserted += 1

                    # Mark file as ingested
                    ingested = IngestedFile(s3_key=key, log_count=lines_inserted)
                    db.session.add(ingested)
                    db.session.commit()

                    new_log_count += lines_inserted
                    print(f"  [OK] {lines_inserted} logs inserted from {key}")

            # Run detection once after all new logs are in
            if new_log_count > 0:
                alerts = run_detection()
                print(f"  [ALERT] Detection complete: {len(alerts)} new alert(s)")

            return new_log_count

        except Exception as e:
            print(f"[ERROR] S3 ingestion error: {e}")
            db.session.rollback()
            return 0


def start_s3_poller(app):
    """
    Starts the S3 polling loop as a background daemon thread.
    Polls every POLL_INTERVAL seconds.
    """
    def _poll_loop():
        with app.app_context():
            print(f"[S3] Poller started -- polling every {POLL_INTERVAL}s "
                  f"(bucket: {app.config.get('S3_BUCKET_NAME', 'NOT SET')})")
            while True:
                ingest_from_s3(app)
                time.sleep(POLL_INTERVAL)

    thread = threading.Thread(target=_poll_loop, daemon=True, name="S3Poller")
    thread.start()
