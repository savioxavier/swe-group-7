from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class TaskStep(BaseModel):
    id: Optional[str] = None
    title: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=200)
    is_completed: bool = False
    is_partial: bool = False  # For partial completion tracking
    completed_at: Optional[datetime] = None
    work_hours: float = Field(default=0.0, ge=0.0)  # Hours worked on this step

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
    name: str = Field(..., min_length=1, max_length=100)  # This is now the task name
    task_description: Optional[str] = Field(None, max_length=500)  # Optional task description
    productivity_category: ProductivityCategory
    plant_sprite: str = Field(..., min_length=1, max_length=50)
    position_x: int = Field(..., ge=0, le=8)  # Updated for 9x7 grid (0-8)
    position_y: int = Field(..., ge=0, le=6)  # Updated for 9x7 grid (0-6)
    task_steps: Optional[List[TaskStep]] = Field(default=[], description="Steps for multi-step tasks")
    is_multi_step: bool = Field(default=False, description="Whether this is a multi-step task")

class PlantUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    task_description: Optional[str] = Field(None, max_length=500)
    task_status: Optional[str] = Field(None, pattern="^(active|completed|harvested)$")
    plant_sprite: Optional[str] = Field(None, min_length=1, max_length=50)
    position_x: Optional[int] = Field(None, ge=0, le=8)  # Updated for 9x7 grid
    position_y: Optional[int] = Field(None, ge=0, le=6)
    is_active: Optional[bool] = None
    task_steps: Optional[List[TaskStep]] = None

class PlantResponse(BaseModel):
    id: str
    user_id: str
    name: str  # This is now the task name
    task_description: Optional[str] = None  # Task description
    task_status: Optional[str] = "active"  # active, completed, harvested
    completion_date: Optional[datetime] = None  # When task was completed
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
    task_steps: Optional[List[TaskStep]] = Field(default=[], description="Steps for multi-step tasks")
    is_multi_step: bool = Field(default=False, description="Whether this is a multi-step task")
    completed_steps: Optional[int] = Field(default=0, description="Number of completed steps")
    total_steps: Optional[int] = Field(default=0, description="Total number of steps")


class TaskWorkCreate(BaseModel):
    plant_id: str
    hours_worked: float = Field(..., gt=0, le=24)

class TaskStepComplete(BaseModel):
    plant_id: str
    step_id: str
    hours_worked: Optional[float] = Field(None, gt=0, le=24)

class TaskStepPartial(BaseModel):
    plant_id: str
    step_id: str
    hours_worked: float = Field(..., gt=0, le=24)
    mark_partial: bool = Field(default=True, description="Mark step as partially complete")

class PlantConvertToMultiStep(BaseModel):
    plant_id: str
    task_steps: List[TaskStep] = Field(..., min_items=1, description="Steps to add to the task")

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