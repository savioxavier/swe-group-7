from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from supabase import create_client
import os

from ..config import supabase, SUPABASE_URL, SUPABASE_KEY

def get_supabase_with_auth(jwt_token: str):
    """Create a Supabase client with JWT token for RLS"""
    client = create_client(SUPABASE_URL, SUPABASE_KEY)
    # Set the JWT token for RLS context
    client.postgrest.auth(jwt_token)
    return client

async def get_current_user_id(credentials: HTTPAuthorizationCredentials) -> str:
    try:
        print(f"Authenticating with token: {credentials.credentials[:20]}...")
        
        user_response = supabase.auth.get_user(credentials.credentials)
        if not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        print(f"Authenticated user ID: {user_response.user.id}")
        return user_response.user.id
    except Exception as e:
        print(f"Auth error: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")

async def get_authenticated_supabase(credentials: HTTPAuthorizationCredentials):
    """Get Supabase client with JWT context and return user_id"""
    user_id = await get_current_user_id(credentials)
    auth_supabase = get_supabase_with_auth(credentials.credentials)
    return auth_supabase, user_id