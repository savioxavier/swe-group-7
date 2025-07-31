from pydantic import BaseModel, EmailStr, validator
from typing import Optional
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    username: Optional[str] = None
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    username: Optional[str] = None
    role: UserRole = UserRole.USER
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class RegistrationResponse(BaseModel):
    message: str
    user_id: str
    email: str
    requires_confirmation: bool = True

class UserProgressResponse(BaseModel):
    user_id: str
    total_experience: int
    level: int
    current_level_experience: int
    experience_to_next_level: int
    current_streak: int
    longest_streak: int
    tasks_completed: int
    plants_grown: int
    last_activity_date: Optional[datetime] = None
    updated_at: datetime

class AdminUserListResponse(BaseModel):
    id: str
    email: str
    username: Optional[str] = None
    role: UserRole
    total_plants: int
    total_experience: int
    current_level: int
    last_activity: Optional[datetime] = None
    created_at: datetime