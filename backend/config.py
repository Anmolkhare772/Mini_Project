import os
from datetime import timedelta
from dotenv import load_dotenv

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

# Load .env file so all os.environ.get() calls below can read it
load_dotenv(os.path.join(BASE_DIR, ".env"))


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "cybershield-super-secret-key-2025")
    
    # 🗄️ Database Configuration (SQLite default, PostgreSQL for Prod)
    _db_url = os.environ.get("DATABASE_URL")
    if _db_url and _db_url.startswith("postgres://"):
        # Fix for Heroku/older AWS versions which use 'postgres://' instead of 'postgresql://'
        _db_url = _db_url.replace("postgres://", "postgresql://", 1)
    
    SQLALCHEMY_DATABASE_URI = _db_url or ("sqlite:///" + os.path.join(BASE_DIR, "app.db"))
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "jwt-cybershield-secret-2025")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)

    # ── AWS S3 Configuration ──────────────────────────────────────
    AWS_ACCESS_KEY_ID     = os.environ.get("AWS_ACCESS_KEY_ID")
    AWS_SECRET_ACCESS_KEY = os.environ.get("AWS_SECRET_ACCESS_KEY")
    AWS_REGION            = os.environ.get("AWS_REGION", "us-east-1")
    S3_BUCKET_NAME        = os.environ.get("S3_BUCKET_NAME")       # e.g. "cybershield-logs"
    S3_KEY_PREFIX         = os.environ.get("S3_KEY_PREFIX", "logs/") # prefix where Lambda writes
