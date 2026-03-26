"""
╔══════════════════════════════════════════════════════════╗
║   CYBERSECURITY THREAT DETECTION LAB                     ║
║   GLA University, Mathura | B.Tech CSE 2024-25           ║
║   Mentor: Mr. Sachin Upadhyay                            ║
╚══════════════════════════════════════════════════════════╝

Run:   python app.py
Open:  http://localhost:5000

Backend auto-runs on startup — no manual steps needed!
"""

import os, json, csv, random, threading, time
from datetime import datetime, timedelta
from collections import defaultdict
from flask import Flask, jsonify, render_template_string, request

import pandas as pd
try:
    from sklearn.ensemble import IsolationForest
    from sklearn.preprocessing import LabelEncoder
    ML_OK = True
except ImportError:
    ML_OK = False

app = Flask(__name__)
os.makedirs("logs", exist_ok=True)

# ═══════════════════════════════════════════════════════════
#  BACKEND — Log Generator (Phase 1)
# ═══════════════════════════════════════════════════════════
NORMAL_IPS   = ["192.168.1.10","192.168.1.22","10.0.0.5","10.0.0.14",
                 "172.16.0.3","192.168.2.8","10.10.1.7","192.168.1.50",
                 "192.168.3.15","10.0.0.99"]
ATTACKER_IPS = ["45.33.32.156","198.51.100.23","203.0.113.99",
                 "91.195.240.117","185.220.101.45","104.244.72.115",
                 "77.88.55.60","5.188.206.26"]
USERNAMES = ["admin","root","alice","bob","charlie","sysadmin","test","user1"]
SERVICES  = ["SSH","FTP","HTTP","HTTPS","MySQL","RDP","SMTP","Telnet"]
HTTP_PATHS= ["/login","/dashboard","/api/data","/admin","/index.html",
             "/api/users","/health","/metrics","/logout","/upload",
             "/wp-admin","/phpmyadmin","/api/v1/auth"]
SQL_PAYLOADS=["' OR '1'='1","'; DROP TABLE users;--",
              "1 UNION SELECT * FROM passwords","admin'--",
              "' OR 1=1--","1; SELECT sleep(5)--"]
HTTP_METHODS=["GET","POST","PUT","DELETE"]
HTTP_CODES  =[200,200,200,200,301,400,401,403,404,500]
PORTS       =[22,80,443,3306,3389,21,8080,8443,5432,6379,27017,9200]
PROTOCOLS   =["TCP","UDP","ICMP"]
APP_EVENTS  =["User login successful","User login failed","File accessed",
              "Config changed","Database query executed","API rate limit hit",
              "Session expired","Permission denied","Large file download",
              "Admin panel accessed","Firewall rule modified"]

def rtime(base,spread=120):
    return base+timedelta(seconds=random.randint(0,spread*60))
def rip(p=0.12):
    return random.choice(ATTACKER_IPS) if random.random()<p else random.choice(NORMAL_IPS)
def wcsv(path,rows):
    with open(path,"w",newline="",encoding="utf-8") as f:
        w=csv.DictWriter(f,fieldnames=list(rows[0].keys()))
        w.writeheader();w.writerows(rows)

def generate_logs():
    base=datetime.now()-timedelta(hours=2)
    # Auth logs
    rows=[]
    for brute_ip,svc,count in [(random.choice(ATTACKER_IPS),"SSH",random.randint(25,50)),
                                (random.choice(ATTACKER_IPS),"RDP",random.randint(15,35))]:
        bt=base+timedelta(minutes=random.randint(15,90))
        for i in range(count):
            rows.append({"timestamp":(bt+timedelta(seconds=i*3)).strftime("%Y-%m-%d %H:%M:%S"),
                         "source_ip":brute_ip,"username":"admin","service":svc,
                         "action":"LOGIN_FAILED","status":"FAILURE","attempts":i+1,
                         "severity":"HIGH","label":"BRUTE_FORCE"})
    for _ in range(600):
        ip=rip(0.08);ok=random.random()>0.12
        rows.append({"timestamp":rtime(base).strftime("%Y-%m-%d %H:%M:%S"),
                     "source_ip":ip,"username":random.choice(USERNAMES),
                     "service":random.choice(SERVICES),
                     "action":"LOGIN_SUCCESS" if ok else "LOGIN_FAILED",
                     "status":"SUCCESS" if ok else "FAILURE","attempts":1,
                     "severity":"LOW" if ok else "MEDIUM","label":"NORMAL"})
    random.shuffle(rows);wcsv("logs/auth_logs.csv",rows)
    # Network logs
    rows=[]
    scan_ip=random.choice(ATTACKER_IPS)
    st_=base+timedelta(minutes=random.randint(10,80))
    for i,port in enumerate(range(20,130)):
        rows.append({"timestamp":(st_+timedelta(seconds=i*0.4)).strftime("%Y-%m-%d %H:%M:%S"),
                     "source_ip":scan_ip,"dest_ip":random.choice(NORMAL_IPS),
                     "source_port":random.randint(40000,60000),"dest_port":port,
                     "protocol":"TCP","bytes_sent":random.randint(40,80),"bytes_recv":0,
                     "duration_ms":random.randint(1,8),"action":"BLOCKED",
                     "severity":"HIGH","label":"PORT_SCAN"})
    ddos_ip=random.choice([ip for ip in ATTACKER_IPS if ip!=scan_ip])
    dt_=base+timedelta(minutes=random.randint(5,40))
    for i in range(300):
        rows.append({"timestamp":(dt_+timedelta(seconds=i*0.1)).strftime("%Y-%m-%d %H:%M:%S"),
                     "source_ip":ddos_ip,"dest_ip":NORMAL_IPS[0],
                     "source_port":random.randint(1024,65535),"dest_port":80,
                     "protocol":"UDP","bytes_sent":random.randint(500,1500),"bytes_recv":0,
                     "duration_ms":1,"action":"BLOCKED","severity":"CRITICAL","label":"DDOS"})
    for _ in range(800):
        ip=rip(0.10);is_atk=ip in ATTACKER_IPS
        rows.append({"timestamp":rtime(base).strftime("%Y-%m-%d %H:%M:%S"),
                     "source_ip":ip,"dest_ip":random.choice(NORMAL_IPS),
                     "source_port":random.randint(1024,65535),
                     "dest_port":random.choice(PORTS),"protocol":random.choice(PROTOCOLS),
                     "bytes_sent":random.randint(64,65535),
                     "bytes_recv":0 if is_atk else random.randint(0,65535),
                     "duration_ms":random.randint(1,5000),
                     "action":"BLOCKED" if is_atk else "ALLOWED",
                     "severity":"MEDIUM" if is_atk else "LOW",
                     "label":"SUSPICIOUS" if is_atk else "NORMAL"})
    random.shuffle(rows);wcsv("logs/network_logs.csv",rows)
    # App logs
    rows=[]
    sqli_ip=random.choice(ATTACKER_IPS)
    for i in range(random.randint(12,25)):
        pl=random.choice(SQL_PAYLOADS)
        rows.append({"timestamp":rtime(base).strftime("%Y-%m-%d %H:%M:%S"),
                     "source_ip":sqli_ip,"method":"POST","path":"/login",
                     "query_string":f"username={pl}&password=abc",
                     "status_code":403,"response_ms":random.randint(5,40),
                     "user_agent":"sqlmap/1.7.8#stable",
                     "event":"SQL injection detected","log_level":"ERROR",
                     "severity":"CRITICAL","label":"SQL_INJECTION"})
    trav_ip=random.choice(ATTACKER_IPS)
    for i in range(random.randint(8,15)):
        rows.append({"timestamp":rtime(base).strftime("%Y-%m-%d %H:%M:%S"),
                     "source_ip":trav_ip,"method":"GET","path":f"/../../etc/passwd{i}",
                     "query_string":"","status_code":403,"response_ms":random.randint(2,20),
                     "user_agent":"Nikto/2.1.6","event":"Directory traversal",
                     "log_level":"ERROR","severity":"HIGH","label":"DIR_TRAVERSAL"})
    for _ in range(500):
        ip=rip(0.06)
        rows.append({"timestamp":rtime(base).strftime("%Y-%m-%d %H:%M:%S"),
                     "source_ip":ip,"method":random.choice(HTTP_METHODS),
                     "path":random.choice(HTTP_PATHS),"query_string":"",
                     "status_code":random.choice(HTTP_CODES),
                     "response_ms":random.randint(20,2000),
                     "user_agent":"Mozilla/5.0","event":random.choice(APP_EVENTS),
                     "log_level":"INFO","severity":"LOW","label":"NORMAL"})
    random.shuffle(rows);wcsv("logs/app_logs.csv",rows)
    return True

# ═══════════════════════════════════════════════════════════
#  BACKEND — Threat Detector (Phase 2+3)
# ═══════════════════════════════════════════════════════════
def detect_threats():
    ALERTS=[]
    def alert(source,ip,atype,severity,detail):
        ALERTS.append({"timestamp":datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                        "source":source,"source_ip":ip,"attack_type":atype,
                        "severity":severity,"detail":detail})
    def ldf(p):
        if not os.path.exists(p): return pd.DataFrame()
        return pd.read_csv(p,parse_dates=["timestamp"])

    auth=ldf("logs/auth_logs.csv")
    network=ldf("logs/network_logs.csv")
    app_df=ldf("logs/app_logs.csv")
    if auth.empty and network.empty: return False

    # Brute force
    if not auth.empty:
        fails=auth[auth["status"]=="FAILURE"].sort_values("timestamp")
        seen=set()
        for ip,grp in fails.groupby("source_ip"):
            times=list(grp["timestamp"])
            for i in range(len(times)-4):
                if (times[i+4]-times[i]).total_seconds()<=60 and ip not in seen:
                    alert("auth_logs",ip,"BRUTE_FORCE","HIGH",
                          f"{len(times)} failures in {(times[i+4]-times[i]).total_seconds():.0f}s")
                    seen.add(ip)

    # Port scan
    if not network.empty:
        tcp=network[network["protocol"]=="TCP"].sort_values("timestamp")
        seen=set()
        for ip,grp in tcp.groupby("source_ip"):
            times=list(grp["timestamp"]);ports=list(grp["dest_port"])
            for i in range(len(times)):
                j=i
                while j<len(times) and (times[j]-times[i]).total_seconds()<=60: j+=1
                if len(set(ports[i:j]))>=15 and ip not in seen:
                    alert("network_logs",ip,"PORT_SCAN","HIGH",
                          f"{len(set(ports[i:j]))} ports in {(times[j-1]-times[i]).total_seconds():.0f}s")
                    seen.add(ip)

    # SQL injection
    if not app_df.empty:
        keys=["'or","union select","drop table","1=1","sleep(","'--"]
        sus=app_df[app_df["query_string"].astype(str).str.lower().apply(
            lambda q:any(k in q for k in keys))]
        seen=set()
        for ip,grp in sus.groupby("source_ip"):
            if ip not in seen:
                alert("app_logs",ip,"SQL_INJECTION","CRITICAL",
                      f"{len(grp)} requests with injection payloads")
                seen.add(ip)

    # Dir traversal
    if not app_df.empty:
        sus=app_df[app_df["path"].astype(str).str.contains(r"\.\.",regex=True,na=False)]
        seen=set()
        for ip,grp in sus.groupby("source_ip"):
            if ip not in seen:
                alert("app_logs",ip,"DIR_TRAVERSAL","HIGH",
                      f"{len(grp)} directory traversal attempts")
                seen.add(ip)

    # DDoS
    if not network.empty:
        net=network.sort_values("timestamp");seen=set()
        for ip,grp in net.groupby("source_ip"):
            times=list(grp["timestamp"])
            for i in range(len(times)):
                j=i
                while j<len(times) and (times[j]-times[i]).total_seconds()<=60: j+=1
                if (j-i)>=200 and ip not in seen:
                    alert("network_logs",ip,"DDOS_ATTACK","CRITICAL",
                          f"{j-i} packets in 60s window")
                    seen.add(ip)

    # ML
    if ML_OK and not network.empty:
        le_p=LabelEncoder();le_a=LabelEncoder()
        df=network.copy()
        df["pe"]=le_p.fit_transform(df["protocol"].astype(str))
        df["ae"]=le_a.fit_transform(df["action"].astype(str))
        X=df[["source_port","dest_port","bytes_sent","bytes_recv","duration_ms","pe","ae"]]
        X=X.apply(pd.to_numeric,errors="coerce").fillna(0)
        model=IsolationForest(contamination=0.05,random_state=42,n_estimators=100)
        preds=model.fit_predict(X);scores=model.decision_function(X)
        anom=df[preds==-1].copy();anom["score"]=scores[preds==-1]
        anom=anom.nsmallest(12,"score");seen=set()
        for _,row in anom.iterrows():
            ip=row["source_ip"]
            if ip not in seen:
                alert("ml_isolation_forest",ip,"ML_ANOMALY","MEDIUM",
                      f"score={row['score']:.3f} port={int(row['dest_port'])} {row['action']}")
                seen.add(ip)

    with open("logs/alerts.json","w") as f:
        json.dump(ALERTS,f,indent=2,default=str)
    return True

# Auto-run on startup
def auto_setup():
    print("  ⚙  Auto-generating logs...")
    generate_logs()
    print("  🔍 Running threat detection...")
    detect_threats()
    print("  ✅ Backend ready!\n")

# ═══════════════════════════════════════════════════════════
#  FLASK API ROUTES
# ═══════════════════════════════════════════════════════════
def load_alerts():
    try:
        with open("logs/alerts.json") as f: return json.load(f)
    except: return []

def load_df(p):
    try: return pd.read_csv(p,parse_dates=["timestamp"])
    except: return pd.DataFrame()

@app.route("/")
def index():
    return render_template_string(DASHBOARD_HTML)

@app.route("/api/stats")
def api_stats():
    al=load_alerts()
    auth=load_df("logs/auth_logs.csv")
    net=load_df("logs/network_logs.csv")
    apdf=load_df("logs/app_logs.csv")
    by_t=defaultdict(int);by_s=defaultdict(int);by_src=defaultdict(int);tl=defaultdict(int)
    for a in al:
        by_t[a["attack_type"]]+=1;by_s[a["severity"]]+=1
        by_src[a["source_ip"]]+=1;tl[a["timestamp"][:16]]+=1
    return jsonify({
        "total_alerts":len(al),"critical":by_s.get("CRITICAL",0),
        "high":by_s.get("HIGH",0),"medium":by_s.get("MEDIUM",0),
        "low":by_s.get("LOW",0),"unique_ips":len(set(a["source_ip"] for a in al)),
        "total_logs":len(auth)+len(net)+len(apdf),
        "auth_count":len(auth),"network_count":len(net),"app_count":len(apdf),
        "by_type":dict(sorted(by_t.items(),key=lambda x:-x[1])),
        "by_sev":dict(by_s),"top_ips":dict(sorted(by_src.items(),key=lambda x:-x[1])[:10]),
        "timeline":dict(sorted(tl.items())),"alerts":al,
        "ml_enabled":ML_OK
    })

@app.route("/api/alerts")
def api_alerts():
    pg=int(request.args.get("page",1));per=int(request.args.get("per_page",15))
    sf=request.args.get("severity","ALL");tf=request.args.get("type","ALL")
    al=load_alerts()
    if sf!="ALL": al=[a for a in al if a["severity"]==sf]
    if tf!="ALL": al=[a for a in al if a["attack_type"]==tf]
    al.sort(key=lambda x:x["timestamp"],reverse=True)
    total=len(al);start=(pg-1)*per
    return jsonify({"alerts":al[start:start+per],"total":total,
                    "pages":(total+per-1)//per if total else 1,"page":pg})

@app.route("/api/network")
def api_network():
    df=load_df("logs/network_logs.csv")
    if df.empty: return jsonify({})
    return jsonify({"total":int(len(df)),"blocked":int((df["action"]=="BLOCKED").sum()),
        "allowed":int((df["action"]=="ALLOWED").sum()),
        "protocols":df["protocol"].value_counts().to_dict(),
        "top_ports":{str(k):int(v) for k,v in df["dest_port"].value_counts().head(12).items()},
        "labels":df["label"].value_counts().to_dict()})

@app.route("/api/auth")
def api_auth():
    df=load_df("logs/auth_logs.csv")
    if df.empty: return jsonify({})
    fails=df[df["status"]=="FAILURE"]
    return jsonify({"total":int(len(df)),"success":int((df["status"]=="SUCCESS").sum()),
        "failures":int((df["status"]=="FAILURE").sum()),
        "success_rate":round((df["status"]=="SUCCESS").mean()*100,1),
        "by_service":df["service"].value_counts().to_dict(),
        "top_fail_ips":fails["source_ip"].value_counts().head(10).to_dict(),
        "by_username":fails["username"].value_counts().head(8).to_dict()})

@app.route("/api/app_logs")
def api_app():
    df=load_df("logs/app_logs.csv")
    if df.empty: return jsonify({})
    return jsonify({"total":int(len(df)),
        "by_method":df["method"].value_counts().to_dict(),
        "by_status":{str(k):int(v) for k,v in df["status_code"].value_counts().items()},
        "by_label":df["label"].value_counts().to_dict(),
        "top_paths":df["path"].value_counts().head(10).to_dict(),
        "avg_response":round(float(df["response_ms"].mean()),1)})

@app.route("/api/refresh",methods=["POST"])
def api_refresh():
    try:
        generate_logs()
        detect_threats()
        return jsonify({"ok":True,"message":"New logs generated & threats re-detected!"})
    except Exception as e:
        return jsonify({"ok":False,"error":str(e)})

# ═══════════════════════════════════════════════════════════
#  PROFESSIONAL DASHBOARD HTML
# ═══════════════════════════════════════════════════════════
DASHBOARD_HTML = r"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>CyberShield — Threat Detection Lab</title>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<style>
:root{
  --bg:#060912;--bg1:#0b0f1a;--bg2:#0f1420;--bg3:#141926;--bg4:#1a2030;
  --border:#1e2738;--border2:#253048;
  --text:#e2e8f8;--text2:#8896b3;--text3:#4a5568;
  --red:#ff3b5c;--red2:#ff6b85;--redbg:#1a0810;
  --orange:#ff7a35;--orangebg:#1a1008;
  --yellow:#f5c842;--yellowbg:#1a1a08;
  --green:#00e57a;--greenbg:#081a12;
  --blue:#3d8bff;--blue2:#6aaeff;--bluebg:#081225;
  --purple:#a855f7;--purplebg:#110825;
  --teal:#00d4c8;--tealbg:#081a1a;
  --accent:#3d8bff;
  --font:'Space Grotesk',sans-serif;
  --mono:'JetBrains Mono',monospace;
}
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;font-family:var(--font);background:var(--bg);color:var(--text);overflow:hidden}

/* Scanline overlay */
body::before{content:'';position:fixed;inset:0;background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,.03) 2px,rgba(0,0,0,.03) 4px);pointer-events:none;z-index:9999}

/* ── HEADER ── */
.hdr{height:56px;background:var(--bg1);border-bottom:1px solid var(--border);
     display:flex;align-items:center;justify-content:space-between;
     padding:0 24px;position:relative;z-index:10;flex-shrink:0}
.hdr-left{display:flex;align-items:center;gap:14px}
.logo{display:flex;align-items:center;gap:10px}
.logo-icon{width:32px;height:32px;background:linear-gradient(135deg,#1a3a6e,#0f2044);
            border:1px solid var(--blue);border-radius:8px;display:flex;
            align-items:center;justify-content:center;font-size:16px;
            box-shadow:0 0 12px rgba(61,139,255,.3)}
.logo-text{font-size:16px;font-weight:700;letter-spacing:.5px;color:var(--text)}
.logo-sub{font-size:10px;color:var(--text2);font-weight:400;letter-spacing:1px;text-transform:uppercase}
.hdr-center{position:absolute;left:50%;transform:translateX(-50%);
            font-size:11px;color:var(--text3);font-family:var(--mono);letter-spacing:.5px}
.hdr-right{display:flex;align-items:center;gap:12px}
.live-pill{display:flex;align-items:center;gap:6px;background:rgba(0,229,122,.08);
           border:1px solid rgba(0,229,122,.25);color:var(--green);
           padding:4px 12px;border-radius:20px;font-size:11px;font-weight:500;
           letter-spacing:.5px}
.live-dot{width:6px;height:6px;background:var(--green);border-radius:50%;
          box-shadow:0 0 6px var(--green);animation:pulse 2s ease-in-out infinite}
@keyframes pulse{0%,100%{opacity:1;box-shadow:0 0 6px var(--green)}50%{opacity:.4;box-shadow:0 0 2px var(--green)}}
.btn-refresh{background:var(--bg3);border:1px solid var(--border2);color:var(--text2);
             padding:6px 14px;border-radius:6px;font-size:12px;cursor:pointer;
             font-family:var(--font);display:flex;align-items:center;gap:6px;
             transition:.2s;font-weight:500}
.btn-refresh:hover{background:var(--bg4);color:var(--text);border-color:var(--blue)}
.btn-refresh:disabled{opacity:.4;cursor:not-allowed}
.spin-anim{animation:sp .7s linear infinite}
@keyframes sp{to{transform:rotate(360deg)}}

/* ── LAYOUT ── */
.shell{display:flex;height:calc(100vh - 56px);overflow:hidden}

/* ── SIDEBAR ── */
.side{width:200px;background:var(--bg1);border-right:1px solid var(--border);
      padding:16px 0;flex-shrink:0;display:flex;flex-direction:column;overflow-y:auto}
.nav-grp{font-size:9px;font-weight:600;color:var(--text3);letter-spacing:1.5px;
         text-transform:uppercase;padding:10px 18px 6px}
.nav-item{display:flex;align-items:center;gap:10px;padding:9px 18px;
          cursor:pointer;font-size:13px;color:var(--text2);font-weight:500;
          border-left:2px solid transparent;transition:.15s;user-select:none}
.nav-item:hover{background:var(--bg2);color:var(--text)}
.nav-item.active{background:rgba(61,139,255,.07);color:var(--blue2);
                  border-left-color:var(--blue)}
.nav-icon{font-size:14px;width:18px;text-align:center;flex-shrink:0}
.nav-badge{margin-left:auto;background:rgba(255,59,92,.15);color:var(--red2);
           border:1px solid rgba(255,59,92,.3);font-size:9px;font-family:var(--mono);
           padding:1px 6px;border-radius:10px;font-weight:600}
.side-footer{margin-top:auto;padding:12px 18px;border-top:1px solid var(--border)}
.side-footer p{font-size:10px;color:var(--text3);line-height:1.6}

/* ── MAIN ── */
.main{flex:1;overflow-y:auto;padding:20px 24px;background:var(--bg)}

/* Custom scrollbar */
.main::-webkit-scrollbar,.side::-webkit-scrollbar{width:4px}
.main::-webkit-scrollbar-track,.side::-webkit-scrollbar-track{background:transparent}
.main::-webkit-scrollbar-thumb,.side::-webkit-scrollbar-thumb{background:var(--border2);border-radius:2px}

/* ── PAGES ── */
.page{display:none;animation:fadeIn .2s ease}
.page.active{display:block}
@keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}

/* ── PAGE HEADER ── */
.ph{margin-bottom:20px}
.ph-title{font-size:20px;font-weight:700;letter-spacing:-.3px}
.ph-sub{font-size:12px;color:var(--text2);margin-top:3px;font-family:var(--mono)}

/* ── KPI GRID ── */
.kgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(148px,1fr));gap:10px;margin-bottom:18px}
.kpi{background:var(--bg1);border:1px solid var(--border);border-radius:10px;
     padding:14px 16px;position:relative;overflow:hidden;cursor:default;transition:.2s}
.kpi::after{content:'';position:absolute;top:0;left:0;right:0;height:2px;border-radius:10px 10px 0 0}
.kpi:hover{border-color:var(--border2);transform:translateY(-1px)}
.kpi.red::after{background:linear-gradient(90deg,var(--red),transparent)}
.kpi.orange::after{background:linear-gradient(90deg,var(--orange),transparent)}
.kpi.yellow::after{background:linear-gradient(90deg,var(--yellow),transparent)}
.kpi.green::after{background:linear-gradient(90deg,var(--green),transparent)}
.kpi.blue::after{background:linear-gradient(90deg,var(--blue),transparent)}
.kpi.purple::after{background:linear-gradient(90deg,var(--purple),transparent)}
.kpi.teal::after{background:linear-gradient(90deg,var(--teal),transparent)}
.kl{font-size:10px;color:var(--text2);font-weight:500;letter-spacing:.5px;text-transform:uppercase;margin-bottom:6px}
.kv{font-size:28px;font-weight:700;line-height:1;font-family:var(--mono);letter-spacing:-1px}
.kpi.red .kv{color:var(--red)}
.kpi.orange .kv{color:var(--orange)}
.kpi.yellow .kv{color:var(--yellow)}
.kpi.green .kv{color:var(--green)}
.kpi.blue .kv{color:var(--blue2)}
.kpi.purple .kv{color:var(--purple)}
.kpi.teal .kv{color:var(--teal)}
.ks{font-size:10px;color:var(--text3);margin-top:4px}

/* ── CARDS ── */
.card{background:var(--bg1);border:1px solid var(--border);border-radius:10px;
      padding:16px;margin-bottom:14px;transition:.2s}
.card:hover{border-color:var(--border2)}
.ct{font-size:12px;font-weight:600;color:var(--text2);letter-spacing:.8px;
    text-transform:uppercase;margin-bottom:14px;display:flex;align-items:center;gap:8px}
.ct-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0}
.ct-dot.red{background:var(--red);box-shadow:0 0 6px var(--red)}
.ct-dot.blue{background:var(--blue);box-shadow:0 0 6px var(--blue)}
.ct-dot.green{background:var(--green);box-shadow:0 0 6px var(--green)}
.ct-dot.orange{background:var(--orange);box-shadow:0 0 6px var(--orange)}
.ct-dot.purple{background:var(--purple);box-shadow:0 0 6px var(--purple)}
.ct-dot.teal{background:var(--teal);box-shadow:0 0 6px var(--teal)}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
.cw{height:200px;position:relative}
.cwl{height:240px;position:relative}

/* ── ALERTS TABLE ── */
.filters{display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;align-items:center}
.fsel{background:var(--bg2);border:1px solid var(--border);color:var(--text2);
      padding:6px 12px;border-radius:6px;font-size:11px;font-family:var(--font);
      cursor:pointer;transition:.15s}
.fsel:hover,.fsel:focus{border-color:var(--border2);outline:none;color:var(--text)}
.tbl-wrap{overflow-x:auto}
table{width:100%;border-collapse:collapse;font-size:12px}
thead tr{border-bottom:1px solid var(--border2)}
th{padding:10px 14px;color:var(--text3);font-weight:500;font-size:10px;
   text-transform:uppercase;letter-spacing:.8px;text-align:left;white-space:nowrap;
   font-family:var(--mono)}
td{padding:10px 14px;border-bottom:1px solid var(--border);vertical-align:middle;
   transition:.15s}
tbody tr:last-child td{border:none}
tbody tr:hover td{background:rgba(255,255,255,.015)}
.sev{display:inline-flex;align-items:center;gap:5px;padding:3px 9px;
     border-radius:4px;font-size:10px;font-weight:600;font-family:var(--mono);
     letter-spacing:.5px;white-space:nowrap}
.sev::before{content:'';width:5px;height:5px;border-radius:50%}
.sCRITICAL{background:rgba(255,59,92,.1);color:var(--red2);border:1px solid rgba(255,59,92,.2)}
.sCRITICAL::before{background:var(--red);box-shadow:0 0 4px var(--red)}
.sHIGH{background:rgba(255,122,53,.1);color:var(--orange);border:1px solid rgba(255,122,53,.2)}
.sHIGH::before{background:var(--orange)}
.sMEDIUM{background:rgba(245,200,66,.1);color:var(--yellow);border:1px solid rgba(245,200,66,.2)}
.sMEDIUM::before{background:var(--yellow)}
.sLOW{background:rgba(0,229,122,.08);color:var(--green);border:1px solid rgba(0,229,122,.15)}
.sLOW::before{background:var(--green)}
.type-badge{background:var(--bg3);border:1px solid var(--border2);color:var(--text2);
            padding:2px 8px;border-radius:4px;font-size:10px;font-family:var(--mono)}
.ip{color:var(--blue2);font-family:var(--mono);font-size:11px}

/* ── PAGINATION ── */
.pag{display:flex;align-items:center;gap:8px;padding:12px 0 0;justify-content:center}
.pgb{background:var(--bg2);border:1px solid var(--border);color:var(--text2);
     padding:5px 14px;border-radius:6px;cursor:pointer;font-size:11px;
     font-family:var(--font);transition:.15s}
.pgb:hover:not(:disabled){background:var(--bg3);color:var(--text);border-color:var(--border2)}
.pgb:disabled{opacity:.3;cursor:not-allowed}
.pgi{color:var(--text3);font-size:11px;font-family:var(--mono)}

/* ── PROGRESS BARS ── */
.pb-row{margin:7px 0}
.pb-label{display:flex;justify-content:space-between;font-size:11px;margin-bottom:4px}
.pb-label span:first-child{color:var(--blue2);font-family:var(--mono)}
.pb-label span:last-child{color:var(--text3);font-family:var(--mono)}
.pb-track{height:4px;background:var(--bg3);border-radius:2px;overflow:hidden}
.pb-fill{height:100%;border-radius:2px;transition:width .6s cubic-bezier(.4,0,.2,1)}

/* ── STAT ROW ── */
.stat-row{display:flex;align-items:center;justify-content:space-between;
          padding:8px 0;border-bottom:1px solid var(--border)}
.stat-row:last-child{border:none}
.stat-key{font-size:11px;color:var(--text2);font-family:var(--mono)}
.stat-val{font-size:13px;font-weight:600;font-family:var(--mono)}

/* ── EMPTY ── */
.empty{text-align:center;padding:48px;color:var(--text3)}
.empty-icon{font-size:32px;margin-bottom:10px;opacity:.5}

/* ── ML CARDS ── */
.ml-card{background:var(--bg2);border:1px solid var(--border);border-radius:8px;
         padding:12px;margin-bottom:8px;border-left:2px solid var(--purple)}
.ml-card:hover{border-color:var(--border2)}

/* ── INFO BOXES ── */
.info-box{background:var(--bg2);border:1px solid var(--border);border-radius:8px;
          padding:14px;border-left:3px solid;margin-bottom:10px}

/* ── TOAST ── */
#toast{position:fixed;bottom:20px;right:20px;background:var(--bg2);
       border:1px solid var(--border2);border-radius:8px;padding:12px 18px;
       font-size:12px;font-family:var(--mono);z-index:9999;
       opacity:0;transform:translateY(8px);transition:.25s;pointer-events:none}
#toast.show{opacity:1;transform:none}
#toast.ok{border-color:rgba(0,229,122,.4);color:var(--green)}
#toast.err{border-color:rgba(255,59,92,.4);color:var(--red2)}

/* ── GLOW TEXT ── */
.glow-red{color:var(--red);text-shadow:0 0 10px rgba(255,59,92,.5)}
.glow-green{color:var(--green);text-shadow:0 0 10px rgba(0,229,122,.4)}

/* Team cards */
.team-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px}
.team-card{background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:14px;
           transition:.2s;position:relative;overflow:hidden}
.team-card:hover{border-color:var(--border2);transform:translateY(-2px)}
.team-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px}
.tc1::before{background:var(--blue)}.tc2::before{background:var(--purple)}
.tc3::before{background:var(--green)}.tc4::before{background:var(--red)}
.tc5::before{background:var(--yellow)}
.tc-name{font-size:13px;font-weight:600;margin-bottom:3px}
.tc-id{font-size:10px;color:var(--text3);font-family:var(--mono)}
.tc-role{font-size:11px;color:var(--text2);margin-top:6px}

code{background:var(--bg3);border:1px solid var(--border);padding:1px 6px;
     border-radius:4px;font-family:var(--mono);font-size:11px;color:var(--blue2)}
</style>
</head>
<body>

<!-- HEADER -->
<div class="hdr">
  <div class="hdr-left">
    <div class="logo">
      <div class="logo-icon">🛡️</div>
      <div>
        <div class="logo-text">CyberShield</div>
        <div class="logo-sub">Threat Detection Lab</div>
      </div>
    </div>
  </div>
  <div class="hdr-center" id="hdr-time">—</div>
  <div class="hdr-right">
    <div class="live-pill"><div class="live-dot"></div>LIVE</div>
    <button class="btn-refresh" id="btn-ref" onclick="doRefresh()">
      <span id="ref-icon">↻</span> Refresh
    </button>
  </div>
</div>

<div class="shell">

<!-- SIDEBAR -->
<div class="side">
  <div class="nav-grp">Monitor</div>
  <div class="nav-item active" onclick="nav('overview',this)">
    <span class="nav-icon">◈</span> Overview
  </div>
  <div class="nav-item" onclick="nav('alerts',this)">
    <span class="nav-icon">◉</span> Alerts
    <span class="nav-badge" id="nb">0</span>
  </div>
  <div class="nav-grp">Analysis</div>
  <div class="nav-item" onclick="nav('network',this)">
    <span class="nav-icon">◎</span> Network
  </div>
  <div class="nav-item" onclick="nav('auth',this)">
    <span class="nav-icon">◐</span> Auth Logs
  </div>
  <div class="nav-item" onclick="nav('app',this)">
    <span class="nav-icon">◑</span> App Logs
  </div>
  <div class="nav-item" onclick="nav('ml',this)">
    <span class="nav-icon">◆</span> ML Engine
  </div>
  <div class="nav-grp">Project</div>
  <div class="nav-item" onclick="nav('team',this)">
    <span class="nav-icon">◇</span> Team
  </div>
  <div class="side-footer">
    <p>GLA University<br>B.Tech CSE 2024-25<br>Mr. Sachin Upadhyay</p>
  </div>
</div>

<!-- MAIN -->
<div class="main">

<!-- ══ OVERVIEW ══ -->
<div class="page active" id="page-overview">
  <div class="ph">
    <div class="ph-title">Security Overview</div>
    <div class="ph-sub" id="upd-sub">Initializing...</div>
  </div>
  <div class="kgrid">
    <div class="kpi red"><div class="kl">Total Alerts</div><div class="kv" id="k0">—</div><div class="ks">All threats detected</div></div>
    <div class="kpi red"><div class="kl">Critical</div><div class="kv" id="k1">—</div><div class="ks">Immediate action</div></div>
    <div class="kpi orange"><div class="kl">High</div><div class="kv" id="k2">—</div><div class="ks">Priority response</div></div>
    <div class="kpi yellow"><div class="kl">Medium</div><div class="kv" id="k3">—</div><div class="ks">Monitor closely</div></div>
    <div class="kpi green"><div class="kl">Low</div><div class="kv" id="k4">—</div><div class="ks">Informational</div></div>
    <div class="kpi blue"><div class="kl">Attacker IPs</div><div class="kv" id="k5">—</div><div class="ks">Unique sources</div></div>
    <div class="kpi teal"><div class="kl">Events Processed</div><div class="kv" id="k6">—</div><div class="ks">Total log entries</div></div>
  </div>
  <div class="g2">
    <div class="card">
      <div class="ct"><span class="ct-dot red"></span>Attack Type Distribution</div>
      <div class="cw"><canvas id="cType"></canvas></div>
    </div>
    <div class="card">
      <div class="ct"><span class="ct-dot orange"></span>Severity Breakdown</div>
      <div class="cw"><canvas id="cSev"></canvas></div>
    </div>
  </div>
  <div class="card">
    <div class="ct"><span class="ct-dot blue"></span>Alert Timeline</div>
    <div class="cwl"><canvas id="cTime"></canvas></div>
  </div>
  <div class="g2">
    <div class="card">
      <div class="ct"><span class="ct-dot red"></span>Top Attacker IPs</div>
      <div id="top-ips"></div>
    </div>
    <div class="card">
      <div class="ct"><span class="ct-dot teal"></span>Log Source Split</div>
      <div class="cw"><canvas id="cSrc"></canvas></div>
    </div>
  </div>
</div>

<!-- ══ ALERTS ══ -->
<div class="page" id="page-alerts">
  <div class="ph">
    <div class="ph-title">Live Security Alerts</div>
    <div class="ph-sub">Real-time threat feed · sorted by timestamp</div>
  </div>
  <div class="card">
    <div class="filters">
      <select class="fsel" id="fs" onchange="loadAlerts(1)">
        <option value="ALL">All Severities</option>
        <option value="CRITICAL">⛔ Critical</option>
        <option value="HIGH">🔴 High</option>
        <option value="MEDIUM">🟡 Medium</option>
        <option value="LOW">🟢 Low</option>
      </select>
      <select class="fsel" id="ft" onchange="loadAlerts(1)">
        <option value="ALL">All Attack Types</option>
        <option value="BRUTE_FORCE">Brute Force</option>
        <option value="PORT_SCAN">Port Scan</option>
        <option value="SQL_INJECTION">SQL Injection</option>
        <option value="DIR_TRAVERSAL">Dir Traversal</option>
        <option value="DDOS_ATTACK">DDoS Attack</option>
        <option value="ML_ANOMALY">ML Anomaly</option>
      </select>
    </div>
    <div class="tbl-wrap">
      <table>
        <thead><tr>
          <th>Timestamp</th><th>Source IP</th><th>Attack Type</th>
          <th>Severity</th><th>Detection Source</th><th>Detail</th>
        </tr></thead>
        <tbody id="atb">
          <tr><td colspan="6"><div class="empty"><div class="empty-icon">⏳</div></div></td></tr>
        </tbody>
      </table>
    </div>
    <div class="pag" id="pag"></div>
  </div>
</div>

<!-- ══ NETWORK ══ -->
<div class="page" id="page-network">
  <div class="ph">
    <div class="ph-title">Network Traffic Analysis</div>
    <div class="ph-sub">Flows · Port scans · DDoS detection · Protocol analysis</div>
  </div>
  <div class="kgrid">
    <div class="kpi blue"><div class="kl">Total Flows</div><div class="kv" id="n0">—</div></div>
    <div class="kpi red"><div class="kl">Blocked</div><div class="kv" id="n1">—</div></div>
    <div class="kpi green"><div class="kl">Allowed</div><div class="kv" id="n2">—</div></div>
  </div>
  <div class="g2">
    <div class="card">
      <div class="ct"><span class="ct-dot teal"></span>Protocol Distribution</div>
      <div class="cw"><canvas id="cProto"></canvas></div>
    </div>
    <div class="card">
      <div class="ct"><span class="ct-dot orange"></span>Top Destination Ports</div>
      <div class="cw"><canvas id="cPorts"></canvas></div>
    </div>
  </div>
  <div class="card">
    <div class="ct"><span class="ct-dot purple"></span>Traffic Classification</div>
    <div class="cw"><canvas id="cNL"></canvas></div>
  </div>
</div>

<!-- ══ AUTH ══ -->
<div class="page" id="page-auth">
  <div class="ph">
    <div class="ph-title">Authentication Analysis</div>
    <div class="ph-sub">Login attempts · Brute force patterns · User behavior</div>
  </div>
  <div class="kgrid">
    <div class="kpi blue"><div class="kl">Total Events</div><div class="kv" id="a0">—</div></div>
    <div class="kpi green"><div class="kl">Success</div><div class="kv" id="a1">—</div></div>
    <div class="kpi red"><div class="kl">Failures</div><div class="kv" id="a2">—</div></div>
    <div class="kpi yellow"><div class="kl">Success Rate</div><div class="kv" id="a3">—</div></div>
  </div>
  <div class="g2">
    <div class="card">
      <div class="ct"><span class="ct-dot blue"></span>Auth by Service</div>
      <div class="cw"><canvas id="cSvc"></canvas></div>
    </div>
    <div class="card">
      <div class="ct"><span class="ct-dot purple"></span>Targeted Usernames</div>
      <div class="cw"><canvas id="cUsr"></canvas></div>
    </div>
  </div>
  <div class="card">
    <div class="ct"><span class="ct-dot red"></span>Top Failing IPs — Brute Force Candidates</div>
    <div id="afip"></div>
  </div>
</div>

<!-- ══ APP ══ -->
<div class="page" id="page-app">
  <div class="ph">
    <div class="ph-title">Application Log Analysis</div>
    <div class="ph-sub">HTTP requests · SQL injection · Directory traversal · Status codes</div>
  </div>
  <div class="kgrid">
    <div class="kpi blue"><div class="kl">Total Requests</div><div class="kv" id="ap0">—</div></div>
    <div class="kpi yellow"><div class="kl">Avg Response</div><div class="kv" id="ap1">—</div><div class="ks">milliseconds</div></div>
  </div>
  <div class="g2">
    <div class="card">
      <div class="ct"><span class="ct-dot teal"></span>HTTP Methods</div>
      <div class="cw"><canvas id="cMeth"></canvas></div>
    </div>
    <div class="card">
      <div class="ct"><span class="ct-dot orange"></span>Response Status Codes</div>
      <div class="cw"><canvas id="cStat"></canvas></div>
    </div>
  </div>
  <div class="card">
    <div class="ct"><span class="ct-dot green"></span>Top Requested Paths</div>
    <div id="plist"></div>
  </div>
</div>

<!-- ══ ML ══ -->
<div class="page" id="page-ml">
  <div class="ph">
    <div class="ph-title">ML Detection Engine</div>
    <div class="ph-sub">Isolation Forest · Unsupervised anomaly detection · 5% contamination threshold</div>
  </div>
  <div class="g2" style="margin-bottom:14px">
    <div class="info-box" style="border-color:var(--blue)">
      <div style="font-size:11px;font-weight:600;color:var(--blue2);letter-spacing:.5px;margin-bottom:6px;text-transform:uppercase">Algorithm</div>
      <div style="font-size:12px;color:var(--text2);line-height:1.6">Isolation Forest builds random decision trees. Points needing <em>fewer splits</em> to isolate are flagged — these are anomalies.</div>
    </div>
    <div class="info-box" style="border-color:var(--purple)">
      <div style="font-size:11px;font-weight:600;color:var(--purple);letter-spacing:.5px;margin-bottom:6px;text-transform:uppercase">Configuration</div>
      <div style="font-size:12px;color:var(--text2);line-height:1.6">Trees: 100 · Contamination: 5% · Features: src_port, dst_port, bytes_sent, bytes_recv, duration, protocol, action</div>
    </div>
    <div class="info-box" style="border-color:var(--green)">
      <div style="font-size:11px;font-weight:600;color:var(--green);letter-spacing:.5px;margin-bottom:6px;text-transform:uppercase">Advantage</div>
      <div style="font-size:12px;color:var(--text2);line-height:1.6">Detects <strong>zero-day threats</strong> and novel attack patterns that signature-based rules completely miss.</div>
    </div>
    <div class="info-box" style="border-color:var(--orange)">
      <div style="font-size:11px;font-weight:600;color:var(--orange);letter-spacing:.5px;margin-bottom:6px;text-transform:uppercase">MITRE ATT&CK</div>
      <div style="font-size:12px;color:var(--text2);line-height:1.6">Covers TA0043 Reconnaissance, TA0011 C2, TA0040 Impact, TA0010 Exfiltration tactics.</div>
    </div>
  </div>
  <div class="card">
    <div class="ct"><span class="ct-dot purple"></span>ML-Flagged Anomalies</div>
    <div id="mllist"><div class="empty"><div class="empty-icon">🤖</div><p>Loading...</p></div></div>
  </div>
  <div class="card">
    <div class="ct"><span class="ct-dot blue"></span>Detection Method Comparison</div>
    <div class="tbl-wrap"><table>
      <thead><tr><th>Feature</th><th>Rule-Based</th><th>ML Isolation Forest</th></tr></thead>
      <tbody>
        <tr><td style="color:var(--text2)">Known attacks</td><td><span style="color:var(--green)">✓ Excellent</span></td><td><span style="color:var(--yellow)">~ Training needed</span></td></tr>
        <tr><td style="color:var(--text2)">Zero-day / novel</td><td><span style="color:var(--red2)">✗ Cannot detect</span></td><td><span style="color:var(--green)">✓ Detects anomalies</span></td></tr>
        <tr><td style="color:var(--text2)">False positive rate</td><td><span style="color:var(--green)">Low — explicit rules</span></td><td><span style="color:var(--yellow)">Higher — statistical</span></td></tr>
        <tr><td style="color:var(--text2)">Explainability</td><td><span style="color:var(--green)">✓ Fully transparent</span></td><td><span style="color:var(--yellow)">Partially explainable</span></td></tr>
        <tr><td style="color:var(--text2)">Scalability</td><td><span style="color:var(--yellow)">Manual rule updates</span></td><td><span style="color:var(--green)">✓ Learns from data</span></td></tr>
      </tbody>
    </table></div>
  </div>
</div>

<!-- ══ TEAM ══ -->
<div class="page" id="page-team">
  <div class="ph">
    <div class="ph-title">Project Team</div>
    <div class="ph-sub">GLA University, Mathura · B.Tech CSE · Academic Year 2024-25</div>
  </div>
  <div class="team-grid" style="margin-bottom:14px">
    <div class="team-card tc1">
      <div class="tc-name">Anmol Khare</div>
      <div class="tc-id">2415000248</div>
      <div class="tc-role">Cloud Setup · IAM · VPC · Architecture</div>
    </div>
    <div class="team-card tc2">
      <div class="tc-name">Anshika Saxena</div>
      <div class="tc-id">2415000263</div>
      <div class="tc-role">Data Collection · Snort · Log Agents</div>
    </div>
    <div class="team-card tc3">
      <div class="tc-name">Ankita Singh</div>
      <div class="tc-id">2415000239</div>
      <div class="tc-role">Cloud Storage · Preprocessing · S3</div>
    </div>
    <div class="team-card tc4">
      <div class="tc-name">Ayushi Singh</div>
      <div class="tc-id">2415000425</div>
      <div class="tc-role">Threat Detection · ML Engine · Alerts</div>
    </div>
    <div class="team-card tc5">
      <div class="tc-name">Anmol Agrawal</div>
      <div class="tc-id">2415000246</div>
      <div class="tc-role">Dashboard · Visualization · Testing</div>
    </div>
  </div>
  <div class="g2">
    <div class="card">
      <div class="ct"><span class="ct-dot blue"></span>Technology Stack</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
        <div class="stat-row" style="grid-column:span 2"><span class="stat-key">Language</span><span class="stat-val" style="color:var(--blue2)">Python 3.x</span></div>
        <div class="stat-row"><span class="stat-key">Web Framework</span><span class="stat-val" style="color:var(--orange)">Flask</span></div>
        <div class="stat-row"><span class="stat-key">Data Analysis</span><span class="stat-val" style="color:var(--yellow)">pandas</span></div>
        <div class="stat-row"><span class="stat-key">ML Library</span><span class="stat-val" style="color:var(--purple)">scikit-learn</span></div>
        <div class="stat-row"><span class="stat-key">Charts</span><span class="stat-val" style="color:var(--red2)">Chart.js</span></div>
        <div class="stat-row"><span class="stat-key">Cloud Target</span><span class="stat-val" style="color:var(--teal)">AWS S3 + Lambda</span></div>
        <div class="stat-row"><span class="stat-key">Stream</span><span class="stat-val" style="color:var(--green)">Apache Kafka</span></div>
      </div>
    </div>
    <div class="card">
      <div class="ct"><span class="ct-dot purple"></span>Security Frameworks</div>
      <div class="info-box" style="border-color:var(--blue);margin-bottom:8px">
        <div style="font-size:11px;font-weight:600;color:var(--blue2);margin-bottom:4px">NIST CSF v2.0</div>
        <div style="font-size:11px;color:var(--text2)">Identify · Protect · Detect · Respond · Recover</div>
      </div>
      <div class="info-box" style="border-color:var(--red)">
        <div style="font-size:11px;font-weight:600;color:var(--red2);margin-bottom:4px">MITRE ATT&CK</div>
        <div style="font-size:11px;color:var(--text2)">Reconnaissance · C&C · Lateral Movement · Exfiltration</div>
      </div>
    </div>
  </div>
  <div class="card">
    <div class="ct"><span class="ct-dot teal"></span>System Architecture</div>
    <div style="font-family:var(--mono);font-size:11px;line-height:2.2;color:var(--text2);
                background:var(--bg2);padding:16px;border-radius:8px;border:1px solid var(--border)">
<span style="color:var(--blue2)">Phase 1</span>  log_generator.py  →  <span style="color:var(--green)">logs/auth_logs.csv · network_logs.csv · app_logs.csv</span>
              ↓  <span style="color:var(--text3)">(auto-runs on startup)</span>
<span style="color:var(--purple)">Phase 2</span>  pandas preprocessing  →  normalize · dedupe · timestamp · severity
              ↓
<span style="color:var(--orange)">Phase 3a</span> Rule-based  →  Brute Force · Port Scan · SQL Injection · DDoS · Dir Traversal
<span style="color:var(--purple)">Phase 3b</span> ML Engine   →  Isolation Forest · 100 trees · 5% contamination
              ↓
<span style="color:var(--yellow)">Phase 4</span>  Flask server  →  REST APIs  →  <span style="color:var(--blue2)">http://localhost:5000</span>
    </div>
  </div>
</div>

</div><!-- /main -->
</div><!-- /shell -->
<div id="toast"></div>

<script>
const MONO='JetBrains Mono,monospace';
const C=['#3d8bff','#ff3b5c','#ff7a35','#f5c842','#00e57a','#a855f7','#00d4c8','#ff6b85'];
const charts={};

// Clock
setInterval(()=>{
  document.getElementById('hdr-time').textContent=new Date().toLocaleString('en-IN',
    {weekday:'short',year:'numeric',month:'short',day:'numeric',
     hour:'2-digit',minute:'2-digit',second:'2-digit'});
},1000);

// Nav
function nav(name,el){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  document.getElementById('page-'+name).classList.add('active');
  el.classList.add('active');
  ({overview:loadOverview,alerts:()=>loadAlerts(1),network:loadNetwork,
    auth:loadAuth,app:loadApp,ml:loadML}[name]||Function())();
}

// Chart factory
function mc(id,type,labels,data,opts={}){
  if(charts[id])charts[id].destroy();
  const ctx=document.getElementById(id);if(!ctx)return;
  const isDoughnut=type==='doughnut'||type==='pie';
  charts[id]=new Chart(ctx,{type,
    data:{labels,datasets:[{data,
      backgroundColor:opts.bg||C,
      borderColor:isDoughnut?'#0b0f1a':(opts.bc||C[0]),
      borderWidth:isDoughnut?2:1,
      fill:type==='line'?{target:'origin',above:'rgba(61,139,255,.08)'}:false,
      tension:.4,pointRadius:type==='line'?3:0,
      pointBackgroundColor:C[0],...(opts.ds||{})}]},
    options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{display:isDoughnut,
        labels:{color:'#8896b3',font:{size:11,family:MONO},boxWidth:10,padding:14}},
        tooltip:{backgroundColor:'#0f1420',borderColor:'#1e2738',borderWidth:1,
          titleColor:'#e2e8f8',bodyColor:'#8896b3',
          titleFont:{family:MONO,size:11},bodyFont:{family:MONO,size:11},padding:10,
          callbacks:{label:c=>`  ${c.label}: ${c.raw}`}}},
      scales:isDoughnut?{}:{
        x:{ticks:{color:'#4a5568',font:{size:10,family:MONO},maxRotation:45},
           grid:{color:'rgba(30,39,56,.8)'}},
        y:{ticks:{color:'#4a5568',font:{size:10,family:MONO}},
           grid:{color:'rgba(30,39,56,.8)'},beginAtZero:true}
      }}});
}

// Overview
async function loadOverview(){
  const d=await fetch('/api/stats').then(r=>r.json());
  document.getElementById('k0').textContent=d.total_alerts;
  document.getElementById('k1').textContent=d.critical;
  document.getElementById('k2').textContent=d.high;
  document.getElementById('k3').textContent=d.medium;
  document.getElementById('k4').textContent=d.low;
  document.getElementById('k5').textContent=d.unique_ips;
  document.getElementById('k6').textContent=(d.total_logs||0).toLocaleString();
  document.getElementById('nb').textContent=d.total_alerts;
  document.getElementById('upd-sub').textContent=
    `Last updated ${new Date().toLocaleTimeString()} · Auth: ${d.auth_count} · Net: ${d.network_count} · App: ${d.app_count}${d.ml_enabled?' · ML: Active':''}`;

  mc('cType','bar',Object.keys(d.by_type),Object.values(d.by_type),
    {bg:['#ff3b5c','#ff7a35','#f5c842','#a855f7','#00d4c8','#3d8bff'],
     ds:{borderRadius:4,borderSkipped:false}});

  if(charts['cSev'])charts['cSev'].destroy();
  charts['cSev']=new Chart(document.getElementById('cSev'),{type:'doughnut',
    data:{labels:['Critical','High','Medium','Low'],
          datasets:[{data:[d.critical,d.high,d.medium,d.low],
            backgroundColor:['#ff3b5c','#ff7a35','#f5c842','#00e57a'],
            borderColor:'#0b0f1a',borderWidth:3,hoverOffset:4}]},
    options:{responsive:true,maintainAspectRatio:false,cutout:'68%',
      plugins:{legend:{labels:{color:'#8896b3',font:{size:11,family:MONO},boxWidth:10,padding:14}},
        tooltip:{backgroundColor:'#0f1420',borderColor:'#1e2738',borderWidth:1,
          titleColor:'#e2e8f8',bodyColor:'#8896b3',
          titleFont:{family:MONO,size:11},bodyFont:{family:MONO,size:11},padding:10}}}});

  mc('cTime','line',Object.keys(d.timeline),Object.values(d.timeline),
    {bc:'#3d8bff',ds:{borderColor:'#3d8bff',borderWidth:2,pointBackgroundColor:'#3d8bff'}});

  const ips=Object.entries(d.top_ips);
  const mx=ips.length?ips[0][1]:1;
  document.getElementById('top-ips').innerHTML=ips.map(([ip,c])=>`
    <div class="pb-row">
      <div class="pb-label"><span>${ip}</span><span>${c}</span></div>
      <div class="pb-track"><div class="pb-fill" style="width:${(c/mx*100).toFixed(0)}%;background:linear-gradient(90deg,#ff3b5c,#ff7a35)"></div></div>
    </div>`).join('');

  mc('cSrc','doughnut',['Auth Logs','Network Logs','App Logs'],
    [d.auth_count,d.network_count,d.app_count],
    {bg:['#3d8bff','#ff3b5c','#00e57a']});
}

// Alerts
async function loadAlerts(pg=1){
  const sf=document.getElementById('fs').value;
  const tf=document.getElementById('ft').value;
  const r=await fetch(`/api/alerts?page=${pg}&per_page=15&severity=${sf}&type=${tf}`).then(r=>r.json());
  const tb=document.getElementById('atb');
  if(!r.alerts||!r.alerts.length){
    tb.innerHTML=`<tr><td colspan="6"><div class="empty"><div class="empty-icon">📭</div><p style="font-size:12px">No alerts found</p></div></td></tr>`;
    document.getElementById('pag').innerHTML='';return;
  }
  tb.innerHTML=r.alerts.map(a=>`<tr>
    <td style="font-family:var(--mono);font-size:10px;color:var(--text3);white-space:nowrap">${a.timestamp}</td>
    <td class="ip">${a.source_ip}</td>
    <td><span class="type-badge">${a.attack_type}</span></td>
    <td><span class="sev s${a.severity}">${a.severity}</span></td>
    <td style="font-size:10px;color:var(--text3);font-family:var(--mono)">${a.source}</td>
    <td style="font-size:11px;color:var(--text2);max-width:260px">${a.detail}</td></tr>`).join('');
  document.getElementById('pag').innerHTML=`
    <button class="pgb" onclick="loadAlerts(${pg-1})" ${pg<=1?'disabled':''}>← Prev</button>
    <span class="pgi">${r.page} / ${r.pages} (${r.total})</span>
    <button class="pgb" onclick="loadAlerts(${pg+1})" ${pg>=r.pages?'disabled':''}>Next →</button>`;
}

// Network
async function loadNetwork(){
  const d=await fetch('/api/network').then(r=>r.json());if(!d.total)return;
  document.getElementById('n0').textContent=(d.total||0).toLocaleString();
  document.getElementById('n1').textContent=(d.blocked||0).toLocaleString();
  document.getElementById('n2').textContent=(d.allowed||0).toLocaleString();
  mc('cProto','doughnut',Object.keys(d.protocols),Object.values(d.protocols));
  const pts=Object.entries(d.top_ports).sort((a,b)=>b[1]-a[1]).slice(0,12);
  mc('cPorts','bar',pts.map(p=>p[0]),pts.map(p=>p[1]),
    {bg:'#ff7a35',ds:{borderRadius:3,borderSkipped:false}});
  mc('cNL','bar',Object.keys(d.labels),Object.values(d.labels),
    {bg:['#3d8bff','#ff3b5c','#f5c842','#00e57a'],ds:{borderRadius:3,borderSkipped:false}});
}

// Auth
async function loadAuth(){
  const d=await fetch('/api/auth').then(r=>r.json());if(!d.total)return;
  document.getElementById('a0').textContent=(d.total||0).toLocaleString();
  document.getElementById('a1').textContent=(d.success||0).toLocaleString();
  document.getElementById('a2').textContent=(d.failures||0).toLocaleString();
  document.getElementById('a3').textContent=(d.success_rate||0)+'%';
  mc('cSvc','bar',Object.keys(d.by_service),Object.values(d.by_service),
    {bg:'#3d8bff',ds:{borderRadius:3,borderSkipped:false}});
  mc('cUsr','bar',Object.keys(d.by_username),Object.values(d.by_username),
    {bg:'#a855f7',ds:{borderRadius:3,borderSkipped:false}});
  const ips=Object.entries(d.top_fail_ips||{});const mx=ips.length?ips[0][1]:1;
  document.getElementById('afip').innerHTML=ips.map(([ip,c])=>`
    <div class="pb-row">
      <div class="pb-label"><span>${ip}</span><span>${c} failures</span></div>
      <div class="pb-track"><div class="pb-fill" style="width:${(c/mx*100).toFixed(0)}%;background:linear-gradient(90deg,#ff7a35,#ff3b5c)"></div></div>
    </div>`).join('');
}

// App
async function loadApp(){
  const d=await fetch('/api/app_logs').then(r=>r.json());if(!d.total)return;
  document.getElementById('ap0').textContent=(d.total||0).toLocaleString();
  document.getElementById('ap1').textContent=d.avg_response||'—';
  mc('cMeth','doughnut',Object.keys(d.by_method),Object.values(d.by_method));
  const sc=Object.entries(d.by_status).sort((a,b)=>+a[0]-+b[0]);
  mc('cStat','bar',sc.map(x=>x[0]),sc.map(x=>x[1]),
    {bg:sc.map(([k])=>+k<300?'#00e57a':+k<400?'#3d8bff':+k<500?'#f5c842':'#ff3b5c'),
     ds:{borderRadius:3,borderSkipped:false}});
  const ps=Object.entries(d.top_paths||{});const mx=ps.length?ps[0][1]:1;
  document.getElementById('plist').innerHTML=ps.map(([p,c])=>`
    <div class="pb-row">
      <div class="pb-label"><span style="color:var(--green);font-family:var(--mono)">${p}</span><span>${c}</span></div>
      <div class="pb-track"><div class="pb-fill" style="width:${(c/mx*100).toFixed(0)}%;background:var(--green)"></div></div>
    </div>`).join('');
}

// ML
async function loadML(){
  const r=await fetch('/api/alerts?type=ML_ANOMALY&per_page=50').then(r=>r.json());
  const el=document.getElementById('mllist');
  if(!r.alerts||!r.alerts.length){
    el.innerHTML=`<div class="empty"><div class="empty-icon">🤖</div><p style="font-size:12px">No ML anomalies detected</p></div>`;return;
  }
  el.innerHTML=r.alerts.map(a=>`
    <div class="ml-card">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:5px">
        <span class="ip">${a.source_ip}</span>
        <span class="sev s${a.severity}">${a.severity}</span>
      </div>
      <div style="font-size:11px;color:var(--text2);font-family:var(--mono)">${a.detail}</div>
      <div style="font-size:10px;color:var(--text3);margin-top:4px;font-family:var(--mono)">${a.timestamp}</div>
    </div>`).join('');
}

// Refresh
async function doRefresh(){
  const btn=document.getElementById('btn-ref');
  const icon=document.getElementById('ref-icon');
  btn.disabled=true;icon.className='spin-anim';
  try{
    const r=await fetch('/api/refresh',{method:'POST'}).then(r=>r.json());
    if(r.ok){toast('✓ '+r.message,'ok');loadOverview();}
    else toast('✗ '+r.error,'err');
  }catch(e){toast('✗ Connection error','err');}
  btn.disabled=false;icon.className='';icon.textContent='↻';
}

function toast(msg,type='ok'){
  const t=document.getElementById('toast');
  t.textContent=msg;t.className='show '+(type||'');
  setTimeout(()=>t.className='',3000);
}

// Init
loadOverview();
setInterval(loadOverview,30000);
</script>
</body>
</html>"""

# ═══════════════════════════════════════════════════════════
#  STARTUP
# ═══════════════════════════════════════════════════════════
if __name__ == "__main__":
    print("\n" + "╔"+"═"*52+"╗")
    print("║  🛡️  CYBERSHIELD — Threat Detection Lab         ║")
    print("║      GLA University, Mathura                   ║")
    print("╚"+"═"*52+"╝")
    print()
    auto_setup()
    print("  🌐 Dashboard → http://localhost:5000")
    print("  Press Ctrl+C to stop\n")
    app.run(debug=False, port=5000, threaded=True)
