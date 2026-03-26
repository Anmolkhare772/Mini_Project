# CyberShield Sentinel 🛡️

CyberShield Sentinel is a full-stack, rule-based cybersecurity threat detection laboratory designed to monitor live system logs, analyze heuristic behavioral patterns, and immediately raise alerts on detecting malicious activity.

## Features
* **Live Telemetry Dashboard**: A high-tech "Sentinel" aesthetic dashboard built in React using deep dark tones, Tailwind CSS, & Recharts.
* **Intelligent Threat Engine**: Capable of flagging Brute Force Attacks, Suspicious IP locations, SQL Injections, and Port Scanning anomalies.
* **REST API Backend**: Driven by Python Flask, SQLAlchemy, and SQLite.
* **JWT Authentication**: Secured end-to-end with operator clearance levels.
* **Embedded Log Simulation**: Comes with a continuous background log generator to continuously stress-test the threat models.

## Project Structure
```
Cyber_Shield/
├── backend/            # Flask API, SQLite DB, ML Threat Engine
├── frontend/           # React + Vite UI, TailwindCSS
├── legacy/             # Original monolithic prototype scripts
└── README.md           # Documentation
```

## Running the Project

### 1. Start the Backend API
1. Navigate to the `backend` folder: `cd backend`
2. Setup a virtual environment: `python -m venv venv`
3. Activate it: 
   - Windows: `.\venv\Scripts\activate`
   - Mac/Linux: `source venv/bin/activate`
4. Install dependencies: `pip install -r requirements.txt`
5. Run the server: `python app.py`
*(The backend will run on http://localhost:5000)*

### 2. Start the Frontend Dashboard
1. Open a new terminal and navigate to the `frontend` folder: `cd frontend`
2. Install npm dependencies: `npm install`
3. Launch the Vite dev server: `npm run dev`
*(The UI will be accessible at http://localhost:5173/)*

---

*Academic Project | GLA University | B.Tech CSE 2024-25*
