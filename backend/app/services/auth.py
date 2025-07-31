from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from supabase import create_client
import os

from ..config import supabase, SUPABASE_URL, SUPABASE_KEY

def get_supabase_with_auth(jwt_token: str):
    client = create_client(SUPABASE_URL, SUPABASE_KEY)
    client.postgrest.auth(jwt_token)
    return client

async def get_current_user_id(credentials: HTTPAuthorizationCredentials) -> str:
    try:
        user_response = supabase.auth.get_user(credentials.credentials)
        if not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_response.user.id
    except Exception as e:
        raise HTTPException(status_code=401, detail="Authentication failed")

async def get_authenticated_supabase(credentials: HTTPAuthorizationCredentials):
    user_id = await get_current_user_id(credentials)
    auth_supabase = get_supabase_with_auth(credentials.credentials)
    return auth_supabase, user_id