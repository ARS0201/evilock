import sys
import os

# Add backend directory to sys.path so 'app' can be resolved by Vercel serverless runtime
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend"))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Ensure Vercel serverless environment flag is set
os.environ["VERCEL"] = "1"

# Import FastAPI application
from app.main import app

# Vercel Serverless Function entrypoint
