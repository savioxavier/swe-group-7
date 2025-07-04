import os
from dotenv import load_dotenv
from supabase import create_client, Client
import httpx

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")  
JWT_SECRET = os.getenv("JWT_SECRET")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing Supabase credentials in environment variables")

try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("Supabase client initialized successfully")
    
except Exception as e:
    print(f"Failed to initialize Supabase client: {e}")
    print(f"Error type: {type(e)}")
    
    supabase = None