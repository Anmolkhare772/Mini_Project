import os
import json
import logging

try:
    import boto3
except ImportError:
    boto3 = None  # boto3 may not be installed in dev environment

logger = logging.getLogger(__name__)

# Environment configuration
CLOUD_ANALYTICS_ENABLED = os.getenv("CLOUD_ANALYTICS_ENABLED", "false").lower() == "true"
STREAM_NAME = os.getenv("CLOUD_ANALYTICS_STREAM")  # e.g., "cybershield-analytics"

def _get_client():
    if not boto3:
        logger.warning("boto3 not installed – cloud analytics disabled.")
        return None
    return boto3.client("firehose")

def publish_event(event_type: str, payload: dict):
    """Publish a JSON event to the configured Kinesis Firehose stream.

    The payload is enriched with a top‑level ``event_type`` field.
    Errors are logged but never raise – analytics should never break the core app.
    """
    if not CLOUD_ANALYTICS_ENABLED:
        return
    if not STREAM_NAME:
        logger.error("CLOUD_ANALYTICS_STREAM not set – cannot send analytics.")
        return
    client = _get_client()
    if not client:
        return
    record = {"event_type": event_type, "payload": payload}
    try:
        client.put_record(
            DeliveryStreamName=STREAM_NAME,
            Record={"Data": json.dumps(record).encode("utf-8")}
        )
    except Exception as e:
        logger.exception(f"Failed to publish analytics event {event_type}: {e}")
