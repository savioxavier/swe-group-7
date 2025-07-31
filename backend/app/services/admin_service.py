from typing import List
from datetime import datetime
from fastapi import HTTPException
from ..config import supabase
from ..models.user import AdminUserListResponse, UserRole

class AdminService:
    @staticmethod
    async def get_all_users() -> List[AdminUserListResponse]:
        try:
            result = supabase.table("profiles").select("""
                id, email, username, role, created_at,
                user_progress(total_experience, level, last_activity_date)
            """).execute()
            
            users = []
            for user_data in result.data:
                progress = user_data.get("user_progress", [{}])[0] if user_data.get("user_progress") else {}
                
                plants_result = supabase.table("plants").select("id").eq("user_id", user_data["id"]).eq("is_active", True).execute()
                total_plants = len(plants_result.data)
                
                users.append(AdminUserListResponse(
                    id=user_data["id"],
                    email=user_data["email"],
                    username=user_data.get("username"),
                    role=user_data.get("role", UserRole.USER),
                    total_plants=total_plants,
                    total_experience=progress.get("total_experience", 0),
                    current_level=progress.get("level", 1),
                    last_activity=datetime.fromisoformat(progress["last_activity_date"]) if progress.get("last_activity_date") else None,
                    created_at=datetime.fromisoformat(user_data["created_at"])
                ))
            
            return users
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch users: {str(e)}")

    @staticmethod
    async def promote_user_to_admin(user_id: str) -> bool:
        try:
            result = supabase.table("profiles").update({
                "role": UserRole.ADMIN.value
            }).eq("id", user_id).execute()
            
            return len(result.data) > 0
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to promote user: {str(e)}")

    @staticmethod
    async def get_system_stats() -> dict:
        try:
            users_result = supabase.table("profiles").select("id").execute()
            plants_result = supabase.table("plants").select("id").eq("is_active", True).execute()
            tasks_result = supabase.table("tasks").select("id").execute()
            
            total_xp_result = supabase.table("user_progress").select("total_experience").execute()
            total_xp = sum(row.get("total_experience", 0) for row in total_xp_result.data)
            
            return {
                "total_users": len(users_result.data),
                "total_plants": len(plants_result.data),
                "total_tasks": len(tasks_result.data),
                "total_experience": total_xp,
                "avg_experience_per_user": total_xp / max(len(users_result.data), 1),
                "last_updated": datetime.now().isoformat()
            }
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch system stats: {str(e)}")

    @staticmethod
    async def delete_user(user_id: str) -> bool:
        try:
            supabase.table("plants").update({"is_active": False}).eq("user_id", user_id).execute()
            supabase.table("tasks").delete().eq("user_id", user_id).execute()
            supabase.table("user_progress").delete().eq("user_id", user_id).execute()
            
            result = supabase.auth.admin.delete_user(user_id)
            return True
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to delete user: {str(e)}")