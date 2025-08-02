from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from supabase import create_client
import os

from ..config import supabase, SUPABASE_URL, SUPABASE_KEY
from ..models.user import UserRole


def get_supabase_with_auth(jwt_token: str):
    client = create_client(SUPABASE_URL, SUPABASE_KEY)
    client.postgrest.auth(jwt_token)
    return client


async def get_current_user_id(credentials: HTTPAuthorizationCredentials) -> str:
    try:
        token = credentials.credentials
        user_response = supabase.auth.get_user(token)

        if not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid token")

        # Set the auth token for subsequent database calls
        # (was not there earlier)
        supabase.postgrest.auth(token)

        return user_response.user.id

    except Exception:
        # clear the auth token is something goes wrong
        supabase.postgrest.auth(None)
        raise HTTPException(status_code=401, detail="Authentication failed")


async def get_authenticated_supabase(credentials: HTTPAuthorizationCredentials):
    user_id = await get_current_user_id(credentials)
    auth_supabase = get_supabase_with_auth(credentials.credentials)
    return auth_supabase, user_id


async def get_current_user_role(credentials: HTTPAuthorizationCredentials) -> UserRole:
    try:
        user_id = await get_current_user_id(credentials)
        result = supabase.table("profiles").select("role").eq("id", user_id).execute()

        if not result.data:
            return UserRole.USER

        role = result.data[0].get("role", UserRole.USER.value)
        return UserRole(role)
    except Exception:
        return UserRole.USER


async def require_admin(credentials: HTTPAuthorizationCredentials):
    role = await get_current_user_role(credentials)
    if role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
