import os
import logging
from flask_mail import Mail, Message
from models import SystemSettings, User
try:
    from twilio.rest import Client
except ImportError:
    Client = None
    logger.warning("Twilio library not installed. SMS notifications disabled.")

logger = logging.getLogger("cybershield")
mail = Mail()

def init_notifications(app):
    """Initialize notification services (Email/SMS)"""
    # 📧 Email Configuration
    app.config['MAIL_SERVER'] = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
    app.config['MAIL_PORT'] = int(os.environ.get('MAIL_PORT', 587))
    app.config['MAIL_USE_TLS'] = os.environ.get('MAIL_USE_TLS', 'false').lower() == 'true'
    app.config['MAIL_USE_SSL'] = os.environ.get('MAIL_USE_SSL', 'true').lower() == 'true'
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
    """Dispatches an email alert to the specific user involved"""
    recipient = None
    
    # Try to get the user's email if alert is tied to a user
    if alert.user_id and alert.user_id != "system":
        user = User.objects(id=alert.user_id).first()
        if user:
            recipient = user.email

    # Fallback to global recipient if no user email found
    if not recipient:
        recipient = os.environ.get('ALERT_RECIPIENT_EMAIL')

    if not recipient:
        logger.warning("Email notifications enabled but no recipient email found")
        return

    try:
        with app.app_context():
            msg = Message(
                subject=f"🚨 Trinetra Alert: {alert.severity.upper()} Threat Detected",
                recipients=[recipient],
                body=f"--- TRINETRA TACTICAL ALERT ---\n\n"
                     f"Type: {alert.alert_type}\n"
                     f"Severity: {alert.severity.upper()}\n"
                     f"Source IP: {alert.source_ip}\n"
                     f"Description: {alert.description}\n"
                     f"Timestamp: {alert.timestamp}\n\n"
                     f"Action Required: Please log in to your Command Center to investigate."
            )
            # Only actually send if credentials are provided
            if app.config.get('MAIL_PASSWORD'):
                mail.send(msg)
                logger.info(f"Email dispatch successful for alert {alert.id} to {recipient}")
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
        if not Client:
            logger.error("SMS Dispatch Failed: Twilio library not available.")
            return
            
        client = Client(account_sid, auth_token)
        
        # Broadcast to all users with a phone number
        with app.app_context():
            # Use db.session if available, or just query.
            users_with_phones = User.objects(phone__nin=[None, ''])
            
            if not users_with_phones:
                logger.info("SMS Dispatch: No users found with registered phone numbers.")
                return

            for user in users_with_phones:
                try:
                    message = client.messages.create(
                        body=f"🚨 Trinetra Sentinel Alert!\n\n"
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
