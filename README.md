# Trinetra Sentinel 🛡️

Trinetra Sentinel is a full-stack, AI-powered cybersecurity threat detection laboratory designed to monitor live system logs, analyze heuristic behavioral patterns, and immediately raise alerts on detecting malicious activity.

## 🚀 Core Features
- **Real-Time Telemetry:** Live ingestion of system logs via file tailing and AWS S3/CloudWatch.
- **AI/ML Threat Engine:** Uses Random Forest and Isolation Forest models for predictive anomaly detection.
- **Instant SMS Alerts:** Critical threats are broadcasted instantly via Twilio to all registered security operators.
- **Tactical Dashboard:** Premium, dark-mode visualization of system health, attack vectors, and geolocation telemetry.
- **Automated Reporting:** Generate Executive PDF/CSV reports for security audits.

## 🍃 Database Architecture
The project utilizes **MongoDB Atlas** for high-performance, NoSQL document storage, ensuring scalability for massive telemetry datasets.

## ☁️ AWS Integration
Trinetra supports real-time streaming of alerts and logs directly into an AWS Kinesis Firehose delivery stream for cloud-scale analytics and data warehousing.

## 🛠️ Tech Stack
- **Frontend:** React, Tailwind CSS, Recharts, Lucide Icons
- **Backend:** Flask, Flask-MongoEngine, Flask-JWT-Extended
- **ML:** Scikit-Learn, Pandas, Joblib
- **Comms:** Twilio API, Flask-Mail
- **Cloud:** AWS S3, CloudWatch, Kinesis Firehose

---
*Created by Anmol Khare — B.Tech CSE (2024-25)*
