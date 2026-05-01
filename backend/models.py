from datetime import datetime, timezone
from mongoengine import connect, Document, StringField, DateTimeField, IntField, BooleanField, signals

class MongoEngineMock:
    def __init__(self):
        self.Document = Document
        self.StringField = StringField
        self.DateTimeField = DateTimeField
        self.IntField = IntField
        self.BooleanField = BooleanField

    def init_app(self, app):
        # Initialize connection using the URI in config
        connect(host=app.config['MONGODB_SETTINGS']['host'])

db = MongoEngineMock()

# Import analytics helper (creates Kinesis client lazily)
try:
    from services.analytics import publish_event
except ImportError:
    # Fallback stub if analytics module missing
    def publish_event(event_type, payload):
        pass


class User(db.Document):
    meta = {'collection': 'users'}
    
    name = db.StringField(required=True, max_length=120)
    email = db.StringField(required=True, unique=True, max_length=120)
    password = db.StringField(required=True, max_length=255)
    phone = db.StringField(max_length=20) # User's mobile for SMS alerts
    created_at = db.DateTimeField(default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": str(self.id),
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "created_at": self.created_at.isoformat() + "Z" if self.created_at else None,
        }


class Log(db.Document):
    meta = {'collection': 'logs', 'indexes': ['timestamp', 'ip_address']}

    timestamp = db.DateTimeField(default=lambda: datetime.now(timezone.utc))
    ip_address = db.StringField(required=True, max_length=45)
    event_type = db.StringField(required=True, max_length=80)
    status = db.StringField(required=True, max_length=20)  # success / failure
    details = db.StringField(default="")

    def to_dict(self):
        return {
            "id": str(self.id),
            "timestamp": self.timestamp.isoformat() + "Z" if self.timestamp else None,
            "ip_address": self.ip_address,
            "event_type": self.event_type,
            "status": self.status,
            "details": self.details,
        }


class Alert(db.Document):
    meta = {'collection': 'alerts', 'indexes': ['alert_type', 'severity', 'timestamp']}

    alert_type = db.StringField(required=True, max_length=80)
    severity = db.StringField(required=True, max_length=20)  # low / medium / high / critical
    description = db.StringField(required=True)
    source_ip = db.StringField(default="")
    timestamp = db.DateTimeField(default=lambda: datetime.now(timezone.utc))
    is_read = db.BooleanField(default=False)

    def to_dict(self):
        return {
            "id": str(self.id),
            "alert_type": self.alert_type,
            "severity": self.severity,
            "description": self.description,
            "source_ip": self.source_ip,
            "timestamp": self.timestamp.isoformat() + "Z" if self.timestamp else None,
            "is_read": self.is_read,
        }


class IngestedFile(db.Document):
    """Tracks S3 keys already ingested to prevent duplicate log entries."""
    meta = {'collection': 'ingested_files'}

    s3_key = db.StringField(required=True, unique=True, max_length=512)
    ingested_at = db.DateTimeField(default=lambda: datetime.now(timezone.utc))
    log_count = db.IntField(default=0)


class SystemSettings(db.Document):
    meta = {'collection': 'system_settings'}

    brute_force_threshold = db.IntField(default=5)
    port_scan_threshold = db.IntField(default=10)
    email_notifications = db.BooleanField(default=False)
    sms_notifications = db.BooleanField(default=False)
    updated_at = db.DateTimeField(default=lambda: datetime.now(timezone.utc))

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
        settings = SystemSettings.objects.first()
        if not settings:
            settings = SystemSettings().save()
        return settings

# -------------------------------------------------
# MongoEngine signals to push data to cloud analytics
# -------------------------------------------------

def _after_save_log(sender, document, **kwargs):
    if kwargs.get('created', False):
        payload = document.to_dict()
        publish_event("log", payload)

def _after_save_alert(sender, document, **kwargs):
    if kwargs.get('created', False):
        payload = document.to_dict()
        publish_event("alert", payload)

signals.post_save.connect(_after_save_log, sender=Log)
signals.post_save.connect(_after_save_alert, sender=Alert)
