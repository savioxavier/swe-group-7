from fastapi import APIRouter
from typing import List
from datetime import datetime

router = APIRouter()

# Simple in-memory storage for testing
tasks_db = []

@router.get("/")
async def get_tasks():
    return {"tasks": tasks_db}

@router.post("/")
async def create_task(task_data: dict):
    new_task = {
        "id": f"task_{len(tasks_db) + 1}",
        "title": task_data.get("title", "New Task"),
        "completed": False,
        "created_at": datetime.now().isoformat()
    }
    tasks_db.append(new_task)
    return new_task

@router.put("/{task_id}/complete")
async def complete_task(task_id: str):
    for task in tasks_db:
        if task["id"] == task_id:
            task["completed"] = True
            return task
    return {"error": "Task not found"}
