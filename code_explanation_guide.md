# 🕵️‍♂️ Code-Level Explanation Guide (File-by-File)

If the interviewer opens a file and asks, **"What have you done in this code?"**, here is exactly how to answer for each major file.

---

## 1. `backend/app.py` (The Heart of the Server)

**What you did here:** "I set up the main Flask server and connected all the individual components."

**Key pieces of code to point out:**
*   **`Flask(__name__)` & `CORS(app)`:** "I initialized the Flask app and enabled CORS (Cross-Origin Resource Sharing) so our React frontend (running on port 5173) is allowed to talk to this backend (on port 5000)."
*   **`connect(db=...)`:** "I used MongoEngine to establish a connection to our MongoDB database. I load the URI securely from the `.env` file."
*   **`JWTManager(app)`:** "I initialized the JSON Web Token manager to handle user authentication sessions."
*   **`app.register_blueprint(...)`:** "Instead of writing 1000 lines in one file, I used Flask Blueprints to modularize my code. I registered separate routes for authentication, logs, alerts, and the dashboard."

---

## 2. `backend/models.py` (The Database Schema)

**What you did here:** "I defined the structure of the data stored in MongoDB using MongoEngine."

**Key pieces of code to point out:**
*   **`class User(db.Document):`**: "This defines the user table. It stores the name, email, and the strictly hashed password."
*   **`class Log(db.Document):` and `class Alert(db.Document):`**: "These define our network logs and security alerts. The most important field I added here is `user_id`."
*   **Why `user_id` is important:** "By attaching a `user_id` to every single Log and Alert, I achieved **multi-tenancy**. When User A logs in, the database queries only return data where `user_id == User A's ID`."
*   **`meta = {'indexes': [...]}`**: "I added indexes on `timestamp` and `user_id` to make database queries extremely fast, even if we have millions of logs."

---

## 3. `backend/services/detection_engine.py` (The AI Brain)

**What you did here:** "I wrote the logic that takes raw logs, extracts features, and passes them to the Machine Learning models to predict threats."

**Key pieces of code to point out:**
*   **`joblib.load(...)`**: "At the top of the file, I load the pre-trained Random Forest and Isolation Forest models."
*   **`Log.objects(timestamp__gte=since_time).filter(user_id=user_id)`**: "I query only the logs from the last 5 minutes for the specific user who is logged in."
*   **Feature Extraction (Pandas)**: "I convert the logs into a Pandas DataFrame. I calculate features like `failed_login_count` because ML models need numerical data, not raw text."
*   **`predictions = rf_classifier.predict(df)`**: "I feed the DataFrame into the Random Forest model. If it outputs a '1', it means it recognized a known attack signature."
*   **`anomalies = iso_forest.predict(df)`**: "I run the Isolation Forest. If it outputs '-1', it means the traffic is highly unusual (a zero-day anomaly)."
*   **Alert Generation**: "If either model flags a threat, I create a new `Alert` object in the database with a severity of Critical, High, or Medium based on the attack type."

---

## 4. `backend/services/simulation_service.py` (The Traffic Generator)

**What you did here:** "I built a background worker that simulates realistic network traffic so the dashboard has live data."

**Key pieces of code to point out:**
*   **`threading.Thread(target=simulation_worker, daemon=True)`**: "I used Python threading so the traffic generation runs in the background. `daemon=True` ensures the thread dies safely when the server shuts down."
*   **`pd.read_csv(...)`**: "I load a subset of the actual UNSW-NB15 Kaggle dataset into memory."
*   **`while not stop_event.is_set():`**: "This is an infinite loop that runs while the user is logged in. It randomly picks a log from the Kaggle dataset (either normal or an attack) and saves it to MongoDB."
*   **`run_detection(user_id=user_id)`**: "Immediately after saving a log, I call the detection engine to analyze it instantly."

---

## 5. `backend/routes/auth_routes.py` (Login & Security)

**What you did here:** "I handled user registration, secure login, and session management."

**Key pieces of code to point out:**
*   **`bcrypt.generate_password_hash(password)`**: "In the register route, I never save plain-text passwords. I hash them using Bcrypt."
*   **`create_access_token(identity=str(user.id))`**: "Upon successful login, I generate a JWT. The frontend uses this token to prove who the user is on every subsequent request."
*   **`start_user_simulation(str(user.id))`**: "This is a crucial line. Exactly when the user logs in, I trigger their personal background simulation thread."

---

## 6. `frontend/src/pages/Dashboard.jsx` (The React UI)

**What you did here:** "I built the main user interface that automatically fetches and displays real-time security telemetry."

**Key pieces of code to point out:**
*   **`useEffect` and `setInterval`**: "I used React's `useEffect` hook to set up a polling mechanism. Every 5 seconds, it calls `fetchStats()` to get the latest data from the backend without the user needing to refresh."
*   **`<AreaChart>` and `<PieChart>`**: "I used the `Recharts` library to visualize the `stats.timeline` and `stats.threat_types` arrays returned by the API."
*   **State Management (`useState`)**: "I store the fetched API data in the `stats` state variable. When `stats` updates, React automatically re-renders the charts and the 'Live Vector Stream' to show the newest alerts."
