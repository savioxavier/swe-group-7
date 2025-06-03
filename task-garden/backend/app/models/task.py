from pydantic import BaseModel
from datetime import datetime
from enum import Enum
from typing import Optional

class PlantType(str, Enum):
    EXERCISE = "exercise"
    STUDY = "study"
    WORK = "work"
    SELFCARE = "selfcare"
    CREATIVE = "creative"

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    plant_type: PlantType

class TaskCreate(TaskBase):
    pass

class Task(TaskBase):
    id: str
    completed: bool = False
    streak: int = 0
    created_at: datetime
    user_id: str

    class Config:
        from_attributes = True
