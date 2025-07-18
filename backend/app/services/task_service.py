from typing import List, Optional
from datetime import datetime

from ..config import supabase
from ..models import TaskCreate, TaskUpdate, TaskResponse, TaskStatus
from .plant_service import PlantService

class TaskService:
    @staticmethod
    async def get_user_tasks(user_id: str) -> List[TaskResponse]:
        response = supabase.table("tasks").select("*").eq("user_id", user_id).execute()
        
        tasks = []
        for task_data in response.data:
            tasks.append(TaskResponse(
                id=task_data["id"],
                title=task_data["title"],
                description=task_data.get("description"),
                category=task_data["category"],
                status=task_data["status"],
                due_date=datetime.fromisoformat(task_data["due_date"]) if task_data.get("due_date") else None,
                completed_at=datetime.fromisoformat(task_data["completed_at"]) if task_data.get("completed_at") else None,
                created_at=datetime.fromisoformat(task_data["created_at"]),
                user_id=task_data["user_id"],
                plant_id=task_data.get("plant_id")
            ))
        
        return tasks

    @staticmethod
    async def create_task(task: TaskCreate, user_id: str, plant_id: Optional[str] = None) -> TaskResponse:
        task_data = {
            "title": task.title,
            "description": task.description,
            "category": task.category.value,
            "status": TaskStatus.PENDING.value,
            "due_date": task.due_date.isoformat() if task.due_date else None,
            "user_id": user_id,
            "plant_id": plant_id,
            "created_at": datetime.now().isoformat()
        }
        
        response = supabase.table("tasks").insert(task_data).execute()
        
        if not response.data:
            raise Exception("Failed to create task")
        
        created_task = response.data[0]
        return TaskResponse(
            id=created_task["id"],
            title=created_task["title"],
            description=created_task.get("description"),
            category=created_task["category"],
            status=created_task["status"],
            due_date=datetime.fromisoformat(created_task["due_date"]) if created_task.get("due_date") else None,
            completed_at=None,
            created_at=datetime.fromisoformat(created_task["created_at"]),
            user_id=created_task["user_id"],
            plant_id=created_task.get("plant_id")
        )

    @staticmethod
    async def complete_task(task_id: str, user_id: str) -> TaskResponse:
        update_data = {
            "status": TaskStatus.COMPLETED.value,
            "completed_at": datetime.now().isoformat()
        }
        
        response = supabase.table("tasks").update(update_data).eq("id", task_id).eq("user_id", user_id).execute()
        
        if not response.data:
            raise Exception("Task not found")
        
        updated_task = response.data[0]
        
        plant_id = updated_task.get("plant_id")
        if plant_id:
            try:
                await PlantService.award_task_completion_experience(user_id, plant_id)
            except Exception:
                pass
        
        try:
            await PlantService.update_user_streak(user_id)
        except Exception:
            pass
        
        return TaskResponse(
            id=updated_task["id"],
            title=updated_task["title"],
            description=updated_task.get("description"),
            category=updated_task["category"],
            status=updated_task["status"],
            due_date=datetime.fromisoformat(updated_task["due_date"]) if updated_task.get("due_date") else None,
            completed_at=datetime.fromisoformat(updated_task["completed_at"]) if updated_task.get("completed_at") else None,
            created_at=datetime.fromisoformat(updated_task["created_at"]),
            user_id=updated_task["user_id"],
            plant_id=updated_task.get("plant_id")
        )
    
    @staticmethod
    async def update_task(task_id: str, user_id: str, task_update: TaskUpdate) -> TaskResponse:
        update_data = {}
        
        if task_update.title is not None:
            update_data["title"] = task_update.title
        if task_update.description is not None:
            update_data["description"] = task_update.description
        if task_update.category is not None:
            update_data["category"] = task_update.category.value
        if task_update.due_date is not None:
            update_data["due_date"] = task_update.due_date.isoformat()
        if task_update.status is not None:
            update_data["status"] = task_update.status.value
            if task_update.status == TaskStatus.COMPLETED:
                update_data["completed_at"] = datetime.now().isoformat()
        
        if not update_data:
            raise Exception("No data to update")
        
        response = supabase.table("tasks").update(update_data).eq("id", task_id).eq("user_id", user_id).execute()
        
        if not response.data:
            raise Exception("Task not found")
        
        updated_task = response.data[0]
        
        if task_update.status == TaskStatus.COMPLETED:
            plant_id = updated_task.get("plant_id")
            if plant_id:
                try:
                    await PlantService.award_task_completion_experience(user_id, plant_id)
                except Exception:
                    pass
            
            try:
                await PlantService.update_user_streak(user_id)
            except Exception:
                pass
        
        return TaskResponse(
            id=updated_task["id"],
            title=updated_task["title"],
            description=updated_task.get("description"),
            category=updated_task["category"],
            status=updated_task["status"],
            due_date=datetime.fromisoformat(updated_task["due_date"]) if updated_task.get("due_date") else None,
            completed_at=datetime.fromisoformat(updated_task["completed_at"]) if updated_task.get("completed_at") else None,
            created_at=datetime.fromisoformat(updated_task["created_at"]),
            user_id=updated_task["user_id"],
            plant_id=updated_task.get("plant_id")
        )
    
    @staticmethod
    async def delete_task(task_id: str, user_id: str) -> bool:
        response = supabase.table("tasks").delete().eq("id", task_id).eq("user_id", user_id).execute()
        
        if not response.data:
            raise Exception("Task not found")
        
        return True