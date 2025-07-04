from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Union
from datetime import datetime
import jwt
import os

from ..config import supabase
from ..models import UserRegister, UserLogin, Token, UserResponse, RegistrationResponse

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
