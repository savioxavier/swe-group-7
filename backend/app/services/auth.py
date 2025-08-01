from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from supabase import create_client
import os
import time
from typing import Dict, Tuple

from ..config import supabase, SUPABASE_URL, SUPABASE_KEY
from ..models.user import UserRole

# PERFORMANCE OPTIMIZATION: Simple in-memory cache for auth results
_auth_cache: Dict[str, Tuple[str, float]] = {}
_cache_ttl = 300  # 5 minutes cache for auth tokens

def get_supabase_with_auth(jwt_token: str):
    client = create_client(SUPABASE_URL, SUPABASE_KEY)
    client.postgrest.auth(jwt_token)
    return client

async def get_current_user_id(credentials: HTTPAuthorizationCredentials) -> str:
    try:
        token = credentials.credentials
        current_time = time.time()
        
        # PERFORMANCE OPTIMIZATION: Check cache first
        if token in _auth_cache:
            user_id, cached_time = _auth_cache[token]
            if current_time - cached_time < _cache_ttl:
                return user_id
        
        # Not in cache or expired, validate with Supabase
        user_response = supabase.auth.get_user(token)
        if not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user_id = user_response.user.id
        
        # Cache the result for future requests
        _auth_cache[token] = (user_id, current_time)
        
        # Clean old cache entries (simple cleanup)
        if len(_auth_cache) > 1000:  # Prevent memory bloat
            expired_keys = [k for k, (_, t) in _auth_cache.items() if current_time - t > _cache_ttl]
            for k in expired_keys[:100]:  # Remove oldest 100 entries
                _auth_cache.pop(k, None)
        
        return user_id
    except Exception as e:
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