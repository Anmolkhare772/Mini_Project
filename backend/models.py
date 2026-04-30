from datetime import datetime, timezone
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import event

db = SQLAlchemy()

# Import analytics helper (creates Kinesis client lazily)
try:
    from backend.services.analytics import publish_event
except ImportError:
    # Fallback stub if analytics module missing
    def publish_event(event_type, payload):
        pass


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password = db.Column(db.String(255), nullable=False)
    phone = db.Column(db.String(20), nullable=True) # User's mobile for SMS alerts
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "created_at": self.created_at.isoformat() + "Z" if self.created_at else None,
        }


class Log(db.Model):
    __tablename__ = "logs"

    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    ip_address = db.Column(db.String(45), nullable=False, index=True)
    event_type = db.Column(db.String(80), nullable=False)
    status = db.Column(db.String(20), nullable=False)  # success / failure
    details = db.Column(db.Text, default="")

    def to_dict(self):
        return {
            "id": self.id,
            "timestamp": self.timestamp.isoformat() + "Z" if self.timestamp else None,
            "ip_address": self.ip_address,
            "event_type": self.event_type,
            "status": self.status,
            "details": self.details,
        }


class Alert(db.Model):
    __tablename__ = "alerts"

    id = db.Column(db.Integer, primary_key=True)
    alert_type = db.Column(db.String(80), nullable=False, index=True)
    severity = db.Column(db.String(20), nullable=False, index=True)  # low / medium / high / critical
    description = db.Column(db.Text, nullable=False)
    source_ip = db.Column(db.String(45), default="")
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    is_read = db.Column(db.Boolean, default=False)

    def to_dict(self):
        return {
            "id": self.id,
            "alert_type": self.alert_type,
            "severity": self.severity,
            "description": self.description,
            "source_ip": self.source_ip,
            "timestamp": self.timestamp.isoformat() + "Z" if self.timestamp else None,
            "is_read": self.is_read,
        }


class IngestedFile(db.Model):
    """Tracks S3 keys already ingested to prevent duplicate log entries."""
    __tablename__ = "ingested_files"

    id = db.Column(db.Integer, primary_key=True)
    s3_key = db.Column(db.String(512), unique=True, nullable=False, index=True)
    ingested_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    log_count = db.Column(db.Integer, default=0)

    def __repr__(self):
        return f"<IngestedFile {self.s3_key}>"


class SystemSettings(db.Model):
    __tablename__ = "system_settings"

    id = db.Column(db.Integer, primary_key=True)
    brute_force_threshold = db.Column(db.Integer, default=5)
    port_scan_threshold = db.Column(db.Integer, default=10)
    email_notifications = db.Column(db.Boolean, default=False)
    sms_notifications = db.Column(db.Boolean, default=False)
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "brute_force_threshold": self.brute_force_threshold,
            "port_scan_threshold": self.port_scan_threshold,
            "email_notifications": self.email_notifications,
            "sms_notifications": self.sms_notifications,
            "updated_at": self.updated_at.isoformat() + "Z" if self.updated_at else None,
        }

    @staticmethod
    def get_settings():
        settings = SystemSettings.query.first()
        if not settings:
            settings = SystemSettings()
            db.session.add(settings)
            db.session.commit()
        return settings

# -------------------------------------------------
# SQLAlchemy event listeners to push data to cloud analytics
# -------------------------------------------------

def _after_insert_log(mapper, connection, target):
    """Called after a Log record is inserted.
    Publishes the log data to the configured analytics stream.
    """
    payload = {
        "id": target.id,
        "timestamp": target.timestamp.isoformat() + "Z" if target.timestamp else None,
        "ip_address": target.ip_address,
        "event_type": target.event_type,
        "status": target.status,
        "details": target.details,
    }
    publish_event("log", payload)


def _after_insert_alert(mapper, connection, target):
    """Called after an Alert record is inserted.
    Publishes the alert data to the analytics stream.
    """
    payload = {
        "id": target.id,
        "alert_type": target.alert_type,
        "severity": target.severity,
        "description": target.description,
        "source_ip": target.source_ip,
        "timestamp": target.timestamp.isoformat() + "Z" if target.timestamp else None,
        "is_read": target.is_read,
    }
    publish_event("alert", payload)

# Attach listeners to the Log and Alert models
event.listen(Log, "after_insert", _after_insert_log)
event.listen(Alert, "after_insert", _after_insert_alert)
