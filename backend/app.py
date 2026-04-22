import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from models import db, Log
from config import Config
from datetime import datetime, timezone
from services.detection_engine import run_detection

API_KEY = "mysecret123"

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Initialize extensions
    CORS(app)
    db.init_app(app)
    JWTManager(app)

    @app.route('/')
    def index():
        return jsonify({
            "status": "online",
            "message": "CyberShield Sentinel API is running successfully!",
            "warning": "If you are using ngrok, add the 'ngrok-skip-browser-warning': 'true' header to your requests."
        }), 200

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
        print("Received log from AWS:", log_text)

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
        db.session.add(new_log)
        db.session.commit()
        
        # 🧠 Run detection to populate Alerts for the Frontend dashboard
        run_detection()
        
        return jsonify({"message": "Log securely received, saved, and processed!"})

    # Register all original API blueprints so the React Frontend works again
    from routes.auth_routes import auth_bp
    from routes.logs_routes import logs_bp
    from routes.alerts_routes import alerts_bp
    from routes.detect_routes import detect_bp
    from routes.dashboard_routes import dashboard_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(logs_bp)
    app.register_blueprint(alerts_bp)
    app.register_blueprint(detect_bp)
    app.register_blueprint(dashboard_bp)

    # Setup database + background services
    with app.app_context():
        db.create_all()

        import threading

        # Watch logs.txt for real manually-added logs
        from utils.dummy_generator import seed_database_with_logs, tail_logs_file
        seed_database_with_logs(app)
        tailer = threading.Thread(target=tail_logs_file, args=(app,), daemon=True)
        tailer.start()
        print("[OK] Real-time log file monitor started.")

        # Start S3 poller only if bucket is configured in .env
        if app.config.get("S3_BUCKET_NAME"):
            from services.s3_ingester import start_s3_poller
            start_s3_poller(app)
        else:
            print("[INFO] S3_BUCKET_NAME not set -- S3 poller disabled. Add it to .env to enable.")

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000, use_reloader=False)