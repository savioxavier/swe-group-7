from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum

class PlantType(str, Enum):
    WORK = "work"
    STUDY = "study"
    EXERCISE = "exercise"
    CREATIVE = "creative"

class ProductivityCategory(str, Enum):
    WORK = "work"
    STUDY = "study"
    EXERCISE = "exercise"
    CREATIVE = "creative"

class DecayStatus(str, Enum):
    HEALTHY = "healthy"
    SLIGHTLY_WILTED = "slightly_wilted"
    WILTED = "wilted"
    SEVERELY_WILTED = "severely_wilted"
    DEAD = "dead"

class PlantCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    productivity_category: ProductivityCategory
    plant_sprite: str = Field(..., min_length=1, max_length=50)
    position_x: int = Field(..., ge=0, le=10)
    position_y: int = Field(..., ge=0, le=6)

class PlantUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    plant_sprite: Optional[str] = Field(None, min_length=1, max_length=50)
    position_x: Optional[int] = Field(None, ge=0, le=10)
    position_y: Optional[int] = Field(None, ge=0, le=6)
    is_active: Optional[bool] = None

class PlantResponse(BaseModel):
    id: str
    user_id: str
    name: str
    plant_type: Optional[PlantType] = None
    productivity_category: Optional[ProductivityCategory] = None
    plant_sprite: str
    growth_level: int
    experience_points: int
    task_level: Optional[int] = 1
    position_x: int
    position_y: int
    is_active: bool
    decay_status: Optional[DecayStatus] = DecayStatus.HEALTHY
    days_without_care: Optional[int] = 0
    last_worked_date: Optional[datetime] = None
    current_streak: Optional[int] = 0
    created_at: datetime
    updated_at: datetime


class TaskWorkCreate(BaseModel):
    plant_id: str
    hours_worked: float = Field(..., gt=0, le=24)

class TaskWorkResponse(BaseModel):
    id: str
    plant_id: str
    user_id: str
    hours_worked: float
    experience_gained: int
    description: Optional[str] = None
    created_at: datetime

class UserProgressResponse(BaseModel):
    id: str
    user_id: str
    total_experience: int
    level: int
    tasks_completed: int
    plants_grown: int
    longest_streak: int
    current_streak: int
    last_activity_date: Optional[datetime]
    created_at: datetime
    updated_at: datetime