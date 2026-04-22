from datetime import datetime, timezone

from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "created_at": self.created_at.isoformat() if self.created_at else None,
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
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
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
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
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
