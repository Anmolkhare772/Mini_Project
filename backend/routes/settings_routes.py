from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from models import db, SystemSettings, Log, Alert

settings_bp = Blueprint('settings', __name__, url_prefix='/api/settings')

@settings_bp.route('/', methods=['GET'])
@jwt_required()
def get_settings():
    settings = SystemSettings.get_settings()
    return jsonify(settings.to_dict()), 200

@settings_bp.route('/', methods=['PATCH'])
@jwt_required()
def update_settings():
    data = request.json
    settings = SystemSettings.get_settings()
    
    if 'brute_force_threshold' in data:
        settings.brute_force_threshold = data['brute_force_threshold']
    if 'port_scan_threshold' in data:
        settings.port_scan_threshold = data['port_scan_threshold']
    if 'email_notifications' in data:
        settings.email_notifications = data['email_notifications']
    if 'sms_notifications' in data:
        settings.sms_notifications = data['sms_notifications']
        
    settings.save()
    return jsonify(settings.to_dict()), 200

@settings_bp.route('/flush', methods=['POST'])
@jwt_required()
def flush_telemetry():
    try:
        Log.objects.delete()
        Alert.objects.delete()
        return jsonify({"message": "All telemetry flushed successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
