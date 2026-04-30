"""
Shows all log files stored in your S3 bucket and their contents.
"""
import boto3
import json

import os
BUCKET     = os.environ.get("S3_BUCKET_NAME", "cyber-threat-logs-anmol")
PREFIX     = os.environ.get("S3_KEY_PREFIX", "logs/")
ACCESS_KEY = os.environ.get("AWS_ACCESS_KEY_ID")
SECRET_KEY = os.environ.get("AWS_SECRET_ACCESS_KEY")
REGION     = os.environ.get("AWS_REGION", "us-east-1")

s3 = boto3.client("s3", region_name=REGION,
                  aws_access_key_id=ACCESS_KEY,
                  aws_secret_access_key=SECRET_KEY)

print("=" * 65)
print(f"  S3 Bucket : {BUCKET}")
print(f"  Prefix    : {PREFIX}")
print("=" * 65)

resp = s3.list_objects_v2(Bucket=BUCKET, Prefix=PREFIX)
files = resp.get("Contents", [])

if not files:
    print("  No log files found yet.")
else:
    print(f"  Total files : {len(files)}\n")
    for i, obj in enumerate(files, 1):
        key  = obj["Key"]
        size = obj["Size"]
        mod  = obj["LastModified"].strftime("%Y-%m-%d %H:%M:%S UTC")
        print(f"  [{i}] {key}")
        print(f"       Size: {size} bytes | Last Modified: {mod}")

        # Print the contents of each file
        body = s3.get_object(Bucket=BUCKET, Key=key)["Body"].read().decode("utf-8")
        lines = [l for l in body.splitlines() if l.strip()]
        print(f"       Log entries inside: {len(lines)}")
        print()
        for j, line in enumerate(lines, 1):
            try:
                entry = json.loads(line)
                status_icon = "[THREAT]" if entry.get("status") == "failure" else "[OK]    "
                print(f"    {status_icon} IP: {entry.get('ip','?'):<18} "
                      f"Event: {entry.get('event','?'):<25} "
                      f"| {entry.get('details','')[:60]}")
            except Exception:
                print(f"    [RAW] {line[:80]}")
        print("-" * 65)
