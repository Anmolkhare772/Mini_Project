import time
import threading
import random
import os
import json
import pandas as pd
import numpy as np
from datetime import datetime, timezone
from models import Log, Alert, User
from services.detection_engine import run_detection
from flask import current_app

# Global dictionary to keep track of active simulation threads per user
# user_id -> threading.Event (used to stop the thread)
active_simulations = {}

def get_kaggle_dataset():
    """Loads a small sample from the Kaggle dataset for realistic log generation."""
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    dataset_path = os.path.join(base_dir, 'ml_engine', 'datasets', 'security_dataset.csv')
    
    if not os.path.exists(dataset_path):
        return None
    
    try:
        columns = [
            'id', 'dur', 'proto', 'service', 'state', 'spkts', 'dpkts', 'sbytes', 'dbytes', 'rate', 
            'sttl', 'dttl', 'sload', 'dload', 'sloss', 'dloss', 'sinpkt', 'dinpkt', 'sjit', 'djit', 
            'swin', 'stcpb', 'dtcpb', 'dwin', 'tcprtt', 'synack', 'ackdat', 'smean', 'dmean', 
            'trans_depth', 'res_bdy_len', 'ct_srv_src', 'ct_state_ttl', 'ct_dst_ltm', 'ct_src_dport_ltm', 
            'ct_dst_sport_ltm', 'ct_dst_src_ltm', 'is_ftp_login', 'ct_ftp_cmd', 'ct_flw_http_mthd', 
            'ct_src_ltm', 'ct_srv_dst', 'is_sm_ips_ports', 'attack_cat', 'label'
        ]
        # Only read a portion to save memory
        df = pd.read_csv(dataset_path, names=columns, header=0, low_memory=False, nrows=5000)
        return df
    except Exception as e:
        print(f"Error loading dataset for simulation: {e}")
        return None

def simulation_worker(app, user_id, stop_event):
    """
    Background worker thread that generates logs for a specific user.
    """
    with app.app_context():
        print(f"[*] Starting background simulation for User: {user_id}")
        print(f"[DEBUG] User {user_id} - Attempting to load dataset...")
        df = get_kaggle_dataset()
        if df is not None:
             print(f"[DEBUG] User {user_id} - Dataset loaded successfully: {len(df)} rows")
        else:
             print(f"[DEBUG] User {user_id} - Dataset load failed, using fallback.")
        
        counter = 0
        while not stop_event.is_set():
            try:
                counter += 1
                
                # 1. Choose log type: Normal (60%) or Attack (40%)
                is_attack = random.random() < 0.4
                
                log_entry = None
                if df is not None:
                    # Sample from real Kaggle data
                    target_label = 1 if is_attack else 0
                    subset = df[df['label'] == target_label]
                    
                    if not subset.empty:
                        sample = subset.sample(n=1).iloc[0]
                        cat_str = f" | Type: {sample['attack_cat']}" if is_attack and pd.notna(sample.get('attack_cat')) else ""
                        log_entry = Log(
                            user_id=user_id,
                            ip_address=f"10.0.{random.randint(1,255)}.{random.randint(1,255)}",
                            event_type="Kaggle Traffic Sample",
                            status="failure" if is_attack else "success",
                            details=f"Proto: {sample['proto']} | Service: {sample['service']} | State: {sample['state']} | Pkts: {sample['spkts']}{cat_str}",
                            timestamp=datetime.now(timezone.utc)
                        )
                
                # Fallback to simple synthetic logs if dataset missing or label subset empty
                if log_entry is None:
                    synth_cats = ["dos", "exploits", "reconnaissance", "fuzzers", "generic"]
                    cat_str = f" - Type: {random.choice(synth_cats)}" if is_attack else ""
                    log_entry = Log(
                        user_id=user_id,
                        ip_address=f"192.168.1.{random.randint(1,255)}",
                        event_type="Synthetic Access",
                        status="failure" if is_attack else "success",
                        details=f"Simulated brute force attempt{cat_str}" if is_attack else "Standard user browsing",
                        timestamp=datetime.now(timezone.utc)
                    )
                
                log_entry.save()
                print(f"[DEBUG] User {user_id} - Generated Log #{counter} (is_attack={is_attack})")
                
                # 2. Run detection
                run_detection(user_id=user_id)
                print(f"[DEBUG] User {user_id} - Alert check complete")
                
            except Exception as e:
                print(f"[ERROR] Simulation worker error for user {user_id}: {e}")
            
            # 3. Sleep
            time.sleep(random.randint(1, 3))

def start_user_simulation(user_id):
    """Starts a background simulation thread for the given user."""
    print(f"[DEBUG] start_user_simulation called for {user_id}")
    if user_id in active_simulations:
        print(f"[!] Simulation already running for user {user_id}")
        return

    stop_event = threading.Event()
    thread = threading.Thread(
        target=simulation_worker, 
        args=(current_app._get_current_object(), user_id, stop_event),
        daemon=True
    )
    thread.start()
    active_simulations[user_id] = stop_event
    print(f"[+] Active simulation started for {user_id}")

def stop_user_simulation(user_id):
    """Stops the background simulation thread for the given user."""
    stop_event = active_simulations.pop(user_id, None)
    if stop_event:
        stop_event.set()
        print(f"[-] Stopped simulation for {user_id}")
