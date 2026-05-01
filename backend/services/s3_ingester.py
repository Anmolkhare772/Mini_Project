import time
import json
import re
import threading
import logging
from datetime import datetime, timezone

logger = logging.getLogger("cybershield")

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
            "timestamp":  data.get("timestamp")
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
    from models import Log, IngestedFile
    from services.detection_engine import run_detection

    bucket = app.config.get("S3_BUCKET_NAME")
    prefix = app.config.get("S3_KEY_PREFIX", "logs/")

    if not bucket:
        logger.warning("S3_BUCKET_NAME not set -- skipping S3 ingestion.")
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
                    if IngestedFile.objects(s3_key=key).first():
                        continue

                    logger.info(f"Ingesting new S3 file: {key}")

                    # Download the file content
                    response = s3.get_object(Bucket=bucket, Key=key)
                    body = response["Body"].read().decode("utf-8", errors="replace")

                    # Parse each line
                    lines_inserted = 0
                    for line in body.splitlines():
                        parsed = _parse_log_line(line)
                        if not parsed:
                            continue
                        # Parse timestamp from log if available, otherwise use now
                        log_ts = None
                        if parsed.get("timestamp"):
                            try:
                                # Handle ISO format from simulate_attack.py
                                log_ts = datetime.fromisoformat(parsed["timestamp"].replace('Z', '+00:00')).replace(tzinfo=None)
                            except:
                                pass
                        
                        if not log_ts:
                            log_ts = datetime.now(timezone.utc)

                        log = Log(
                            timestamp=log_ts,
                            ip_address=parsed["ip_address"],
                            event_type=parsed["event_type"],
                            status=parsed["status"],
                            details=parsed["details"],
                        )
                        log.save()
                        lines_inserted += 1

                    # Mark file as ingested
                    ingested = IngestedFile(s3_key=key, log_count=lines_inserted, ingested_at=datetime.now(timezone.utc))
                    ingested.save()

                    new_log_count += lines_inserted
                    logger.info(f"S3 ingestion successful: {lines_inserted} logs from {key}")

            # Run detection once after all new logs are in
            if new_log_count > 0:
                alerts = run_detection()
                logger.info(f"Detection complete: {len(alerts)} new alert(s)")

            return new_log_count

        except Exception as e:
            logger.error(f"S3 ingestion error: {e}")
            return 0


def start_s3_poller(app):
    """
    Starts the S3 polling loop as a background daemon thread.
    Polls every POLL_INTERVAL seconds.
    """
    def _poll_loop():
        with app.app_context():
            logger.info(f"S3 Poller started (bucket: {app.config.get('S3_BUCKET_NAME', 'NOT SET')})")
            while True:
                ingest_from_s3(app)
                time.sleep(POLL_INTERVAL)

    thread = threading.Thread(target=_poll_loop, daemon=True, name="S3Poller")
    thread.start()
