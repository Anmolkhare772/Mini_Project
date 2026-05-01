import io
import logging
from flask import Blueprint, send_file, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Alert, User
import pandas as pd
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from datetime import datetime
from services.notification_service import mail, Message

# Setup logging
logger = logging.getLogger("trinetra.reports")

report_bp = Blueprint('report', __name__)

def generate_pdf_buffer(alerts):
    """Helper to generate PDF bytes from alert list"""
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter

    # ─── HEADER ───────────────────────────────────────────────
    c.setFillColor(colors.HexColor("#020617"))
    c.rect(0, height - 100, width, 100, fill=1)
    
    c.setFillColor(colors.HexColor("#00CFFF"))
    c.setFont("Helvetica-Bold", 28)
    c.drawString(40, height - 50, "TRINETRA SENTINEL")
    
    c.setFillColor(colors.white)
    c.setFont("Helvetica", 10)
    c.drawString(40, height - 70, f"EXECUTIVE THREAT INTELLIGENCE REPORT")
    c.drawRightString(width - 40, height - 70, f"GENERATED: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} UTC")
    c.setStrokeColor(colors.HexColor("#00CFFF"))
    c.setLineWidth(2)
    c.line(40, height - 80, width - 40, height - 80)

    # ─── SUMMARY BOX ──────────────────────────────────────────
    y = height - 140
    c.setFillColor(colors.black)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(40, y, "VULNERABILITY ASSESSMENT SUMMARY")
    y -= 30
    c.setFont("Helvetica", 11)
    critical_count = len([a for a in alerts if (a.severity or "").lower() == 'critical'])
    high_count = len([a for a in alerts if (a.severity or "").lower() == 'high'])
    c.drawString(50, y, f"• Total Security Events Analyzed: {len(alerts)}")
    y -= 20
    c.setFillColor(colors.red if critical_count > 0 else colors.black)
    c.drawString(50, y, f"• Critical Threat Signatures: {critical_count}")
    y -= 20
    c.setFillColor(colors.orange if high_count > 0 else colors.black)
    c.drawString(50, y, f"• High Risk Anomalies: {high_count}")
    c.setFillColor(colors.black)

    # ─── TABLE ───────────────────────────────────────────────
    y -= 50
    c.setFillColor(colors.HexColor("#f1f5f9"))
    c.rect(40, y - 5, width - 80, 25, fill=1, stroke=0)
    c.setFillColor(colors.HexColor("#475569"))
    c.setFont("Helvetica-Bold", 10)
    c.drawString(45, y + 5, "TIMESTAMP (UTC)")
    c.drawString(160, y + 5, "THREAT CLASSIFICATION")
    c.drawString(340, y + 5, "SOURCE IP")
    c.drawString(460, y + 5, "SEVERITY")

    y -= 30
    c.setFont("Helvetica", 9)
    c.setFillColor(colors.black)
    
    if not alerts:
        c.setFont("Helvetica-Oblique", 10)
        c.drawCentredString(width/2, y - 20, "NO ACTIVE THREATS DETECTED")
    else:
        for alert in alerts:
            if y < 60:
                c.showPage()
                y = height - 60
                c.setFont("Helvetica-Bold", 12)
                c.drawString(40, height - 30, "TRINETRA SENTINEL - CONTINUED")
                c.setFont("Helvetica", 9)

            ts = alert.timestamp.strftime('%Y-%m-%d %H:%M') if alert.timestamp else "N/A"
            c.drawString(45, y, ts)
            c.drawString(160, y, (alert.alert_type or "Unknown")[:35])
            c.drawString(340, y, str(alert.source_ip or "0.0.0.0"))
            sev = (alert.severity or "low").upper()
            if sev == 'CRITICAL': c.setFillColor(colors.red)
            elif sev == 'HIGH': c.setFillColor(colors.orange)
            else: c.setFillColor(colors.black)
            c.drawString(460, y, sev)
            c.setFillColor(colors.black)
            y -= 22

    c.save()
    buffer.seek(0)
    return buffer

@report_bp.route('/api/reports/csv', methods=['GET'])
@jwt_required()
def export_csv():
    try:
        alerts = Alert.objects.all().order_by('-timestamp')
        data = []
        for a in alerts:
            data.append({
                "ID": str(a.id),
                "Type": a.alert_type or "Unknown",
                "Severity": (a.severity or "medium").upper(),
                "Source_IP": a.source_ip or "0.0.0.0",
                "Timestamp": a.timestamp.strftime('%Y-%m-%d %H:%M:%S') if a.timestamp else "N/A",
                "Description": a.description or "No description"
            })
        df = pd.DataFrame(data) if data else pd.DataFrame(columns=["ID", "Type", "Severity", "Source_IP", "Timestamp", "Description"])
        csv_string = df.to_csv(index=False)
        output = io.BytesIO(csv_string.encode('utf-8'))
        return send_file(output, mimetype='text/csv', as_attachment=True, download_name=f"trinetra_alerts_{datetime.now().strftime('%Y%m%d')}.csv")
    except Exception as e:
        logger.error(f"CSV Error: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500

@report_bp.route('/api/reports/pdf', methods=['GET'])
@jwt_required()
def export_pdf():
    try:
        alerts = list(Alert.objects.order_by('-timestamp').limit(50))
        buffer = generate_pdf_buffer(alerts)
        return send_file(buffer, mimetype='application/pdf', as_attachment=True, download_name=f"trinetra_report_{datetime.now().strftime('%Y%m%d')}.pdf")
    except Exception as e:
        logger.error(f"PDF Error: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500

@report_bp.route('/api/reports/email', methods=['POST'])
@jwt_required()
def email_report():
    try:
        user_id = get_jwt_identity()  # This is the user's ObjectId string
        user = User.objects(id=user_id).first()
        
        if not user:
            return jsonify({"error": "User not found"}), 404

        recipient_email = user.email
        logger.info(f"Generating email report for user {user.name} <{recipient_email}>")
        alerts = list(Alert.objects.order_by('-timestamp').limit(50))
        buffer = generate_pdf_buffer(alerts)
        
        msg = Message(
            subject=f"📊 Trinetra Sentinel: Executive Security Report",
            recipients=[recipient_email],
            body=f"Hello {user.name},\n\nAttached is the latest Executive Security Report from your Trinetra Sentinel node.\n\nGenerated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} UTC\nTotal Events: {len(alerts)}\n\n--- Trinetra Sentinel Security Operations ---"
        )
        
        msg.attach(
            f"trinetra_report_{datetime.now().strftime('%Y%m%d')}.pdf",
            "application/pdf",
            buffer.getvalue()
        )

        if current_app.config.get('MAIL_PASSWORD'):
            mail.send(msg)
            return jsonify({"message": f"Report delivered successfully to {recipient_email}"})
        else:
            return jsonify({"message": "MAIL_PASSWORD not set in .env — cannot send email."}), 500

    except Exception as e:
        logger.error(f"Email Export Error: {e}", exc_info=True)
        return jsonify({"error": f"SMTP Error: {str(e)}"}), 500
