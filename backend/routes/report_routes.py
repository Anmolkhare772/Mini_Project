import io
from flask import Blueprint, send_file, request, jsonify
from flask_jwt_extended import jwt_required
from models import Alert, Log
import pandas as pd
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from datetime import datetime

report_bp = Blueprint('report', __name__)

@report_bp.route('/api/reports/csv', methods=['GET'])
@jwt_required()
def export_csv():
    alerts = Alert.query.all()
    data = []
    for a in alerts:
        data.append({
            "ID": a.id,
            "Type": a.alert_type,
            "Severity": a.severity,
            "IP": a.source_ip,
            "Timestamp": a.timestamp,
            "Description": a.description
        })
    
    df = pd.DataFrame(data)
    output = io.BytesIO()
    df.to_csv(output, index=False)
    output.seek(0)
    
    return send_file(
        output,
        mimetype='text/csv',
        as_attachment=True,
        download_name=f"cybershield_report_{datetime.now().strftime('%Y%m%d_%H%M')}.csv"
    )

@report_bp.route('/api/reports/pdf', methods=['GET'])
@jwt_required()
def export_pdf():
    alerts = Alert.query.order_by(Alert.timestamp.desc()).limit(50).all()
    
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter

    # 🛡️ Header
    c.setFillColor(colors.black)
    c.rect(0, height - 80, width, 80, fill=1)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 24)
    c.drawString(40, height - 50, "CYBERSHIELD SENTINEL")
    c.setFont("Helvetica", 10)
    c.drawString(40, height - 65, f"EXECUTIVE THREAT REPORT // GENERATED: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    # 📊 Summary Section
    c.setFillColor(colors.black)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(40, height - 120, "SYSTEM STATUS SUMMARY")
    c.line(40, height - 125, 200, height - 125)
    
    c.setFont("Helvetica", 11)
    c.drawString(40, height - 150, f"Total Critical Threats: {len([a for a in alerts if a.severity == 'critical'])}")
    c.drawString(40, height - 165, f"Total High Risk: {len([a for a in alerts if a.severity == 'high'])}")
    c.drawString(40, height - 180, f"Scope: Latest 50 Security Events")

    # 📑 Table Header
    y = height - 220
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(colors.grey)
    c.rect(40, y, width - 80, 20, fill=1)
    c.setFillColor(colors.white)
    c.drawString(45, y + 5, "TIMESTAMP")
    c.drawString(160, y + 5, "THREAT TYPE")
    c.drawString(300, y + 5, "SOURCE IP")
    c.drawString(420, y + 5, "SEVERITY")

    # 📄 Table Rows
    y -= 25
    c.setFillColor(colors.black)
    c.setFont("Helvetica", 9)
    
    for alert in alerts:
        if y < 50:
            c.showPage()
            y = height - 50
            c.setFont("Helvetica", 9)

        c.drawString(45, y, alert.timestamp.strftime('%Y-%m-%d %H:%M'))
        c.drawString(160, y, alert.alert_type[:25])
        c.drawString(300, y, str(alert.source_ip))
        
        # Color code severity
        if alert.severity == 'critical':
            c.setFillColor(colors.red)
        elif alert.severity == 'high':
            c.setFillColor(colors.orange)
        else:
            c.setFillColor(colors.black)
            
        c.drawString(420, y, alert.severity.upper())
        c.setFillColor(colors.black)
        
        y -= 20

    c.save()
    buffer.seek(0)
    return send_file(
        buffer,
        mimetype='application/pdf',
        as_attachment=True,
        download_name=f"cybershield_executive_report_{datetime.now().strftime('%Y%m%d')}.pdf"
    )
