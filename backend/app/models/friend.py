from enum import Enum
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, UUID4, validator, Field


class FriendshipStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    BLOCKED = "blocked"
    CANCELLED = "cancelled"


class UserProfile(BaseModel):
    user_id: UUID4
    email: EmailStr
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    is_public: bool = False
    created_at: datetime
    updated_at: datetime


class UserProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    is_public: Optional[bool] = None

    @validator("display_name")
    def validate_display_name(cls, v):
        if v is not None:
            if len(v.strip()) == 0:
                raise ValueError("Display name cannot be empty")
            if len(v) > 50:
                raise ValueError("Display name must be 50 characters or less")
        return v


class Friendship(BaseModel):
    # id: UUID4
    user_one_id: UUID4
    user_two_id: UUID4
    action_user_id: UUID4
    status: FriendshipStatus
    created_at: datetime
    updated_at: datetime


class FriendRequest(BaseModel):
    email: EmailStr


class LeaderboardEntry(BaseModel):
    rank: int
    user_id: UUID4
    display_name: Optional[str] = None
    email: str
    total_experience: int = Field(default=0)
    level: int = Field(default=1)
    tasks_completed: int = Field(default=0)
    plants_grown: int = Field(default=0)
    longest_streak: int = Field(default=0)
    current_streak: int = Field(default=0)
