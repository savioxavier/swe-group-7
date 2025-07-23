from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional

from ..models import TaskCreate, TaskUpdate, TaskResponse, TimeLogCreate, TimeLogResponse
from ..services.auth import get_current_user_id
from ..services.task_service import TaskService
from ..services.xp_service import XPService
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
async def create_task(task: TaskCreate, credentials = Depends(security), plant_id: Optional[str] = None):
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

@router.post("/{task_id}/log-time")
async def log_time_for_task(task_id: str, time_log: TimeLogCreate, credentials = Depends(security)):
    """Log time spent on a task and award XP according to the formula: 1 hour = 100 XP"""
    try:
        user_id = await get_current_user_id(credentials)
        
        # Verify task belongs to user
        task = await TaskService.get_task_by_id(task_id, user_id)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        result = await XPService.log_time_for_task(task_id, user_id, time_log.hours, time_log.date)
        return {
            "message": f"Logged {time_log.hours} hours for task",
            "xp_gained": result["xp_gained"],
            "time_log_id": result["time_log_id"]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to log time: {str(e)}")

@router.get("/{task_id}/time-logs", response_model=List[TimeLogResponse])
async def get_task_time_logs(task_id: str, credentials = Depends(security)):
    """Get all time logs for a specific task"""
    try:
        user_id = await get_current_user_id(credentials)
        
        # Verify task belongs to user
        task = await TaskService.get_task_by_id(task_id, user_id)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        return await TaskService.get_task_time_logs(task_id)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch time logs: {str(e)}")
