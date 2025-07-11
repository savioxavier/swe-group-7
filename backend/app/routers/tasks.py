from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional

from ..models import TaskCreate, TaskUpdate, TaskResponse
from ..services.auth import get_current_user_id
from ..services.task_service import TaskService
from ..routers.users import security

router = APIRouter()

@router.get("/", response_model=List[TaskResponse])
async def get_tasks(credentials = Depends(security)):
    try:
        user_id = await get_current_user_id(credentials)
        return await TaskService.get_user_tasks(user_id)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to fetch tasks")

@router.post("/", response_model=TaskResponse)
async def create_task(task: TaskCreate, plant_id: Optional[str] = None, credentials = Depends(security)):
    try:
        user_id = await get_current_user_id(credentials)
        return await TaskService.create_task(task, user_id, plant_id)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to create task")

@router.put("/{task_id}/complete", response_model=TaskResponse)
async def complete_task(task_id: str, credentials = Depends(security)):
    try:
        user_id = await get_current_user_id(credentials)
        return await TaskService.complete_task(task_id, user_id)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to complete task")

@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(task_id: str, task_update: TaskUpdate, credentials = Depends(security)):
    try:
        user_id = await get_current_user_id(credentials)
        return await TaskService.update_task(task_id, user_id, task_update)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to update task")

@router.delete("/{task_id}")
async def delete_task(task_id: str, credentials = Depends(security)):
    try:
        user_id = await get_current_user_id(credentials)
        success = await TaskService.delete_task(task_id, user_id)
        if success:
            return {"message": "Task deleted successfully"}
        raise HTTPException(status_code=400, detail="Failed to delete task")
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to delete task")
