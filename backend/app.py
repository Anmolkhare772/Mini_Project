import os
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from models import db
from config import Config

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Initialize extensions
    CORS(app)
    db.init_app(app)
    JWTManager(app)

    # Register blueprints
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

    # Setup database and initial data
    with app.app_context():
        db.create_all()
        
        # Un-comment the next lines to auto-seed and generate logs continuously
        from utils.dummy_generator import seed_database_with_logs, start_background_generator
        seed_database_with_logs(app)
        start_background_generator(app)

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000, use_reloader=False)
