from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

from ..config import supabase

async def get_current_user_id(credentials: HTTPAuthorizationCredentials) -> str:
    try:
        user_response = supabase.auth.get_user(credentials.credentials)
        if not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_response.user.id
    except Exception:
        raise HTTPException(status_code=401, detail="Authentication failed")