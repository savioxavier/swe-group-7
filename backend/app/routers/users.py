from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Union
from datetime import datetime
import jwt
import os

from ..config import supabase
from ..models import UserRegister, UserLogin, Token, UserResponse, RegistrationResponse
from ..services.auth import get_current_user_id, get_authenticated_supabase
from ..services.xp_service import XPService
from ..services.auto_harvest_service import AutoHarvestService

router = APIRouter()
security = HTTPBearer()

@router.post("/register", response_model=Union[Token, RegistrationResponse])
async def register(user: UserRegister):
    try:
        if supabase is None:
            raise HTTPException(status_code=500, detail="Database connection failed")
            
        try:
            auth_response = supabase.auth.sign_up({
                "email": user.email,
                "password": user.password
            })
        except Exception as network_error:
            error_msg = str(network_error)
            
            raise HTTPException(status_code=500, detail="Service temporarily unavailable")
        
        if auth_response.user is None:
            raise HTTPException(status_code=400, detail="Registration failed")
        
        if auth_response.session is None:
            return RegistrationResponse(
                message="Registration successful. Please check your email for confirmation.",
                user_id=auth_response.user.id,
                email=auth_response.user.email,
                requires_confirmation=True
            )
        
        user_data = UserResponse(
            id=auth_response.user.id,
            email=auth_response.user.email,
            username=user.username or "",
            created_at=auth_response.user.created_at if isinstance(auth_response.user.created_at, datetime) else datetime.now()
        )
        
        return Token(
            access_token=auth_response.session.access_token,
            user=user_data
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail="Registration failed")

@router.post("/login", response_model=Token)
async def login(user: UserLogin):
    try:
        if supabase is None:
            raise HTTPException(status_code=500, detail="Database connection failed")
            
        try:
            auth_response = supabase.auth.sign_in_with_password({
                "email": user.email,
                "password": user.password
            })
        except Exception as network_error:
            raise HTTPException(status_code=500, detail="Service temporarily unavailable")
        
        if auth_response.user is None:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        if auth_response.session is None:
            raise HTTPException(status_code=401, detail="Authentication failed")
        
        user_id = auth_response.user.id
        
        # Trigger auto-harvest check on login (respects 6-hour timer, doesn't force)
        try:
            await AutoHarvestService.check_and_harvest_completed_tasks(user_id, force_harvest=False)
        except Exception as e:
            # Don't fail login if auto-harvest fails, just log it
            print(f"Auto-harvest failed during login for user {user_id}: {str(e)}")
        
        user_data = UserResponse(
            id=auth_response.user.id,
            email=auth_response.user.email,
            username=auth_response.user.user_metadata.get("username", ""),
            created_at=auth_response.user.created_at if isinstance(auth_response.user.created_at, datetime) else datetime.now()
        )
        
        return Token(
            access_token=auth_response.session.access_token,
            user=user_data
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid credentials")

@router.get("/me", response_model=UserResponse)
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(
            credentials.credentials,
            os.getenv("JWT_SECRET"),
            algorithms=["HS256"]
        )
        
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user_response = supabase.auth.get_user(credentials.credentials)
        
        if not user_response.user:
            raise HTTPException(status_code=401, detail="User not found")
        
        return UserResponse(
            id=user_response.user.id,
            email=user_response.user.email,
            username=user_response.user.user_metadata.get("username"),
            created_at=datetime.fromisoformat(user_response.user.created_at.replace('Z', '+00:00'))
        )
        
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        raise HTTPException(status_code=401, detail="Authentication failed")

@router.get("/progress")
async def get_user_progress(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get user's XP progress including level, total XP, and streaks"""
    try:
        user_id = await get_current_user_id(credentials)
        
        # Get user progress from database
        progress_result = supabase.table("user_progress").select("*").eq("user_id", user_id).execute()
        
        if not progress_result.data:
            # Create initial progress record
            initial_progress = await XPService.update_user_xp(user_id, 0)
            return initial_progress
        
        progress = progress_result.data[0]
        
        # Calculate level breakdown
        level, current_level_xp, xp_to_next = XPService.calculate_level_from_xp(progress["total_experience"])
        
        return {
            "user_id": user_id,
            "total_experience": progress["total_experience"],
            "level": level,
            "current_level_experience": current_level_xp,
            "experience_to_next_level": xp_to_next,
            "current_streak": progress.get("current_streak", 0),
            "longest_streak": progress.get("longest_streak", 0),
            "tasks_completed": progress.get("tasks_completed", 0),
            "plants_grown": progress.get("plants_grown", 0)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get user progress: {str(e)}")

@router.post("/apply-daily-decay")
async def apply_daily_decay(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Manually apply daily XP decay (normally would be scheduled)"""
    try:
        user_id = await get_current_user_id(credentials)
        result = await XPService.apply_daily_decay(user_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to apply daily decay: {str(e)}")

@router.post("/logout")
async def logout(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Logout user without auto-harvesting plants"""
    try:
        auth_supabase, user_id = await get_authenticated_supabase(credentials)
        
        # Sign out the user
        auth_supabase.auth.sign_out()
        
        return {"message": "Logged out successfully."}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Logout failed: {str(e)}")
