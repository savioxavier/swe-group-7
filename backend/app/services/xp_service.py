from typing import Dict, Tuple
from datetime import datetime
from ..config import supabase

class XPService:
    
    @staticmethod
    def hours_to_xp(hours: float) -> int:
        return int(hours * 100)
    
    @staticmethod
    def calculate_level_up_requirement(current_level: int) -> int:
        return 100 + (20 * current_level)
    
    @staticmethod
    def calculate_daily_decay(current_level: int) -> int:
        return 20 * current_level
    
    @staticmethod
    def calculate_streak_protection(streak_days: int) -> int:
        return streak_days * 20
    
    @staticmethod
    def calculate_net_daily_decay(current_level: int, streak_days: int) -> int:
        base_decay = XPService.calculate_daily_decay(current_level)
        protection = XPService.calculate_streak_protection(streak_days)
        return max(0, base_decay - protection)
    
    @staticmethod
    def calculate_level_from_xp(total_xp: int) -> Tuple[int, int, int]:
        if total_xp < 0:
            return 0, 0, 100
        current_level = 0
        xp_used = 0
        while True:
            xp_needed = XPService.calculate_level_up_requirement(current_level)
            if xp_used + xp_needed > total_xp:
                break
            xp_used += xp_needed
            current_level += 1
        current_level_xp = total_xp - xp_used
        xp_to_next_level = XPService.calculate_level_up_requirement(current_level) - current_level_xp
        return current_level, current_level_xp, xp_to_next_level
    
    @staticmethod
    async def log_time_for_task(task_id: str, user_id: str, hours: float, date: datetime = None) -> Dict:
        if date is None:
            date = datetime.now()
        xp_gained = XPService.hours_to_xp(hours)
        
        try:
            time_log_result = supabase.table("task_time_logs").insert({
                "task_id": task_id,
                "user_id": user_id,
                "hours": hours,
                "experience_gained": xp_gained,
                "date": date.isoformat(),
                "created_at": datetime.now().isoformat()
            }).execute()
            if not time_log_result.data:
                raise Exception("Failed to create time log")
            task_result = supabase.table("tasks").select("total_hours, total_experience").eq("id", task_id).execute()
            if task_result.data:
                current_hours = task_result.data[0].get("total_hours", 0) or 0
                current_xp = task_result.data[0].get("total_experience", 0) or 0
                supabase.table("tasks").update({
                    "total_hours": current_hours + hours,
                    "total_experience": current_xp + xp_gained
                }).eq("id", task_id).execute()
            await XPService.update_user_xp(user_id, xp_gained)
            
            return {
                "time_log_id": time_log_result.data[0]["id"],
                "hours": hours,
                "xp_gained": xp_gained,
                "date": date
            }
            
        except Exception as e:
            raise Exception(f"Failed to log time: {str(e)}")
    
    @staticmethod
    async def update_user_xp(user_id: str, xp_change: int) -> Dict:
        try:
            progress_result = supabase.table("user_progress").select("*").eq("user_id", user_id).execute()
            
            if not progress_result.data:
                current_xp = max(0, xp_change)
                level, current_level_xp, xp_to_next = XPService.calculate_level_from_xp(current_xp)
                result = supabase.table("user_progress").insert({
                    "user_id": user_id,
                    "total_experience": current_xp,
                    "level": level,
                    "current_level_experience": current_level_xp,
                    "experience_to_next_level": xp_to_next,
                    "updated_at": datetime.now().isoformat()
                }).execute()
                return result.data[0] if result.data else {}
            current_progress = progress_result.data[0]
            new_total_xp = max(0, current_progress["total_experience"] + xp_change)
            level, current_level_xp, xp_to_next = XPService.calculate_level_from_xp(new_total_xp)
            result = supabase.table("user_progress").update({
                "total_experience": new_total_xp,
                "level": level,
                "current_level_experience": current_level_xp,
                "experience_to_next_level": xp_to_next,
                "updated_at": datetime.now().isoformat()
            }).eq("user_id", user_id).execute()
            return result.data[0] if result.data else {}
            
        except Exception as e:
            raise Exception(f"Failed to update user XP: {str(e)}")
    
    @staticmethod
    async def apply_daily_decay(user_id: str) -> Dict:
        try:
            progress_result = supabase.table("user_progress").select("*").eq("user_id", user_id).execute()
            if not progress_result.data:
                return {"message": "No progress found for user"}
            progress = progress_result.data[0]
            current_level = progress["level"]
            current_streak = progress.get("current_streak", 0)
            net_decay = XPService.calculate_net_daily_decay(current_level, current_streak)
            if net_decay > 0:
                await XPService.update_user_xp(user_id, -net_decay)
                return {
                    "decay_applied": net_decay,
                    "level": current_level,
                    "streak": current_streak,
                    "base_decay": XPService.calculate_daily_decay(current_level),
                    "streak_protection": XPService.calculate_streak_protection(current_streak)
                }
            return {"message": "No decay applied due to streak protection"}
            
        except Exception as e:
            raise Exception(f"Failed to apply daily decay: {str(e)}")