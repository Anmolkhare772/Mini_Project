import os
import logging
from flask_mail import Mail, Message
from models import SystemSettings
from twilio.rest import Client

logger = logging.getLogger("cybershield")
mail = Mail()

def init_notifications(app):
    """Initialize notification services (Email/SMS)"""
    # 📧 Email Configuration
    app.config['MAIL_SERVER'] = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
    app.config['MAIL_PORT'] = int(os.environ.get('MAIL_PORT', 587))
    app.config['MAIL_USE_TLS'] = os.environ.get('MAIL_USE_TLS', 'true').lower() == 'true'
    app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME')
    app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD')
    app.config['MAIL_DEFAULT_SENDER'] = os.environ.get('MAIL_DEFAULT_SENDER')
    
    mail.init_app(app)
    logger.info("Notification Service initialized")

def dispatch_alert(app, alert):
    """
    Checks user preferences and dispatches alerts via enabled channels.
    Called by the detection engine when a new critical alert is generated.
    """
    settings = SystemSettings.get_settings()
    
    # We only send external notifications for high/critical severity
    if alert.severity not in ['high', 'critical']:
        return

    if settings.email_notifications:
        _send_email(app, alert)
        
    if settings.sms_notifications:
        _send_sms(app, alert)

def _send_email(app, alert):
    """Dispatches an email alert"""
    recipient = os.environ.get('ALERT_RECIPIENT_EMAIL')
    if not recipient:
        logger.warning("Email notifications enabled but ALERT_RECIPIENT_EMAIL not set in .env")
        return

    try:
        with app.app_context():
            msg = Message(
                subject=f"🚨 CyberShield Alert: {alert.severity.upper()} Threat Detected",
                recipients=[recipient],
                body=f"--- CYBERSHIELD TACTICAL ALERT ---\n\n"
                     f"Type: {alert.alert_type}\n"
                     f"Severity: {alert.severity.upper()}\n"
                     f"Source IP: {alert.source_ip}\n"
                     f"Description: {alert.description}\n"
                     f"Timestamp: {alert.timestamp}\n\n"
                     f"Action Required: Please log in to the Command Center to investigate."
            )
            # Only actually send if credentials are provided
            if app.config.get('MAIL_PASSWORD'):
                mail.send(msg)
                logger.info(f"Email dispatch successful for alert {alert.id}")
            else:
                logger.info(f"[MOCK] Email dispatch triggered for alert {alert.id} to {recipient}")
    except Exception as e:
        logger.error(f"Failed to dispatch email alert: {str(e)}")

def _send_sms(app, alert):
    """Dispatches an SMS alert using Twilio to all registered users with phone numbers"""
    account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
    auth_token = os.environ.get('TWILIO_AUTH_TOKEN')
    from_number = os.environ.get('TWILIO_FROM_NUMBER')

    if not all([account_sid, auth_token, from_number]):
        logger.warning("SMS enabled but Twilio credentials (SID/Token/From) missing in .env")
        return
        
    try:
        client = Client(account_sid, auth_token)
        
        # Broadcast to all users with a phone number
        with app.app_context():
            # Use db.session if available, or just query.
            users_with_phones = User.query.filter(User.phone != None, User.phone != '').all()
            
            if not users_with_phones:
                logger.info("SMS Dispatch: No users found with registered phone numbers.")
                return

            for user in users_with_phones:
                try:
                    message = client.messages.create(
                        body=f"🚨 CyberShield Sentinel Alert!\n\n"
                             f"Threat: {alert.alert_type}\n"
                             f"IP: {alert.source_ip}\n"
                             f"Severity: {alert.severity.upper()}\n"
                             f"Time: {alert.timestamp}",
                        from_=from_number,
                        to=user.phone
                    )
                    logger.info(f"SMS dispatch successful to {user.name} ({user.phone}): SID {message.sid}")
                except Exception as user_err:
                    logger.error(f"Failed to send SMS to {user.name}: {str(user_err)}")
                    
    except Exception as e:
        logger.error(f"Twilio Broadcast Error: {str(e)}")
