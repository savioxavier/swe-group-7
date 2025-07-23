from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum

class TaskCategory(str, Enum):
    EXERCISE = "exercise"
    STUDY = "study" 
    WORK = "work"
    SELFCARE = "selfcare"
    CREATIVE = "creative"

class TaskStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    OVERDUE = "overdue"

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: TaskCategory
    due_date: Optional[datetime] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[TaskCategory] = None
    due_date: Optional[datetime] = None
    status: Optional[TaskStatus] = None

class TimeLogCreate(BaseModel):
    hours: float
    date: Optional[datetime] = None

class TimeLogResponse(BaseModel):
    id: str
    task_id: str
    user_id: str
    hours: float
    experience_gained: int
    date: datetime
    created_at: datetime

class TaskResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    category: TaskCategory
    status: TaskStatus
    due_date: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    user_id: str
    plant_id: Optional[str] = None
    total_hours: Optional[float] = 0.0
    total_experience: Optional[int] = 0
    current_level: Optional[int] = 0