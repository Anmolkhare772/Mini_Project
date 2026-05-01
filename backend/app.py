import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from models import db, Log
from config import Config
from datetime import datetime, timezone
from services.detection_engine import run_detection

import logging
from pythonjsonlogger import jsonlogger

# 📝 Structured Logging Configuration
logger = logging.getLogger("cybershield")
logger.setLevel(logging.INFO)
logHandler = logging.StreamHandler()
formatter = jsonlogger.JsonFormatter('%(timestamp)s %(level)s %(name)s %(message)s')
logHandler.setFormatter(formatter)
logger.addHandler(logHandler)

API_KEY = "mysecret123"

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # 🛡️ Production CORS Hardening
    allowed_origins = os.environ.get("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:5174").split(",")
    CORS(app, resources={r"/api/*": {"origins": allowed_origins}}, supports_credentials=True)
    db.init_app(app)
    JWTManager(app)
    from services.notification_service import init_notifications
    init_notifications(app)

    # 🛡️ Production Security: Rate Limiting
    from flask_limiter import Limiter
    from flask_limiter.util import get_remote_address
    limiter = Limiter(
        app=app,
        key_func=get_remote_address,
        default_limits=["10000 per day", "2000 per hour"],
        storage_uri="memory://",
    )

    @app.route('/')
    def index():
        return jsonify({
            "status": "online",
            "version": "1.0.0",
            "product": "Trinetra Sentinel",
            "message": "Security Telemetry API Operational"
        }), 200

    @app.route('/api/health')
    @limiter.exempt
    def health_check():
        return jsonify({"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}), 200

    # 🔗 Dedicated AWS Lambda Endpoint
    # We use /api/aws/logs so it does not conflict with the React Frontend paths that require JWT
    @app.route('/api/aws/logs', methods=['POST'])
    def aws_add_log():
        # 🔐 Check API Key
        key = request.headers.get('x-api-key')
        if key != API_KEY:
            return jsonify({"error": "Unauthorized"}), 403

        # 📥 Get raw log data from Lambda
        log_text = request.json.get('log', '')
        logger.info("Received log from AWS", extra={"payload": log_text})

        # 💾 Setup data for Database storage
        import re
        ip_match = re.search(r'\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b', log_text)
        ip_address = ip_match.group(0) if ip_match else "Unknown AWS IP"
        
        status = "failure" if "failed login" in log_text.lower() else "success"

        new_log = Log(
            ip_address=ip_address,
            event_type="AWS CloudWatch Log",
            status=status,
            details=log_text,
            timestamp=datetime.now(timezone.utc)
        )
        new_log.save()
        
        # 🧠 Run detection to populate Alerts for the Frontend dashboard
        run_detection()
        
        return jsonify({"message": "Log securely received, saved, and processed!"})

    # Register all original API blueprints so the React Frontend works again
    from routes.auth_routes import auth_bp
    from routes.logs_routes import logs_bp
    from routes.alerts_routes import alerts_bp
    from routes.detect_routes import detect_bp
    from routes.dashboard_routes import dashboard_bp
    from routes.report_routes import report_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(logs_bp)
    app.register_blueprint(alerts_bp)
    app.register_blueprint(detect_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(report_bp)
    from routes.settings_routes import settings_bp
    app.register_blueprint(settings_bp)

    # Setup background services
    with app.app_context():

        import threading

        # Watch logs.txt for real manually-added logs
        from utils.dummy_generator import tail_logs_file
        tailer = threading.Thread(target=tail_logs_file, args=(app,), daemon=True)
        tailer.start()
        logger.info("Real-time log file monitor started")

        # Start S3 poller only if bucket is configured in .env
        if app.config.get("S3_BUCKET_NAME"):
            from services.s3_ingester import start_s3_poller
            start_s3_poller(app)
        else:
            logger.info("S3_BUCKET_NAME not set -- S3 poller disabled. Add it to .env to enable.")

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000, use_reloader=False)