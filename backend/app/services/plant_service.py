from typing import List, Optional
from datetime import datetime, date
from app.config import supabase
from app.models.plant import PlantCreate, PlantUpdate, PlantResponse, TaskWorkCreate, TaskWorkResponse, UserProgressResponse, ProductivityCategory, PlantType, DecayStatus
from fastapi import HTTPException

class PlantService:
    
    @staticmethod
    async def create_plant(user_id: str, plant_data: PlantCreate, auth_supabase=None) -> PlantResponse:
        client = auth_supabase or supabase
        try:
            # Handle both old plant_type and new productivity_category
            insert_data = {
                "user_id": user_id,
                "name": plant_data.name,
                "plant_sprite": plant_data.plant_sprite,
                "position_x": plant_data.position_x,
                "position_y": plant_data.position_y,
                "growth_level": 0,
                "experience_points": 0,
                "is_active": True,
                "decay_status": DecayStatus.HEALTHY.value,
                "days_without_care": 0
            }
            
            if hasattr(plant_data, 'productivity_category') and plant_data.productivity_category:
                insert_data["plant_type"] = plant_data.productivity_category
            elif hasattr(plant_data, 'plant_type') and plant_data.plant_type:
                insert_data["plant_type"] = plant_data.plant_type
                
            result = client.table("plants").insert(insert_data).execute()
            
            if not result.data:
                raise HTTPException(status_code=400, detail="Failed to create plant")
            
            plant_dict = result.data[0]
            return PlantResponse(**plant_dict)
            
        except Exception as e:
            if "unique constraint" in str(e).lower():
                raise HTTPException(status_code=400, detail="Position already occupied")
            raise HTTPException(status_code=400, detail=f"Failed to create plant: {str(e)}")
    
    @staticmethod
    async def get_user_plants(user_id: str, auth_supabase=None) -> List[PlantResponse]:
        client = auth_supabase or supabase
        try:
            result = client.table("plants").select("*").eq("user_id", user_id).eq("is_active", True).execute()
            
            plants = []
            for plant_dict in result.data:
                if 'decay_status' not in plant_dict:
                    plant_dict['decay_status'] = DecayStatus.HEALTHY.value
                if 'days_without_care' not in plant_dict:
                    plant_dict['days_without_care'] = 0
                if 'plant_sprite' not in plant_dict:
                    plant_dict['plant_sprite'] = 'carrot'
                
                if 'productivity_category' not in plant_dict and 'plant_type' not in plant_dict:
                    plant_dict['plant_type'] = PlantType.WORK.value
                
                plant_dict['task_level'] = PlantService._calculate_task_level(plant_dict.get('experience_points', 0))
                plant_dict['current_streak'] = PlantService._calculate_streak_from_updated_at_dict(plant_dict)
                plant_dict['last_worked_date'] = plant_dict.get('updated_at')
                    
                plants.append(PlantResponse(**plant_dict))
            
            return plants
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch plants: {str(e)}")
    
    @staticmethod
    async def get_plant_by_id(user_id: str, plant_id: str, auth_supabase=None) -> PlantResponse:
        client = auth_supabase or supabase
        try:
            result = client.table("plants").select("*").eq("id", plant_id).eq("user_id", user_id).execute()
            
            if not result.data:
                raise HTTPException(status_code=404, detail="Plant not found")
            
            plant_dict = result.data[0]
            # Handle missing fields for backwards compatibility
            if 'decay_status' not in plant_dict:
                plant_dict['decay_status'] = DecayStatus.HEALTHY.value
            if 'days_without_care' not in plant_dict:
                plant_dict['days_without_care'] = 0
            if 'plant_sprite' not in plant_dict:
                plant_dict['plant_sprite'] = 'carrot'  # Default sprite
            return PlantResponse(**plant_dict)
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch plant: {str(e)}")
    
    @staticmethod
    async def update_plant(user_id: str, plant_id: str, plant_data: PlantUpdate) -> PlantResponse:
        try:
            update_data = {}
            if plant_data.name is not None:
                update_data["name"] = plant_data.name
            if plant_data.plant_sprite is not None:
                update_data["plant_sprite"] = plant_data.plant_sprite
            if plant_data.position_x is not None:
                update_data["position_x"] = plant_data.position_x
            if plant_data.position_y is not None:
                update_data["position_y"] = plant_data.position_y
            if plant_data.is_active is not None:
                update_data["is_active"] = plant_data.is_active
            
            if not update_data:
                raise HTTPException(status_code=400, detail="No data to update")
            
            result = supabase.table("plants").update(update_data).eq("id", plant_id).eq("user_id", user_id).execute()
            
            if not result.data:
                raise HTTPException(status_code=404, detail="Plant not found")
            
            plant_dict = result.data[0]
            return PlantResponse(**plant_dict)
            
        except HTTPException:
            raise
        except Exception as e:
            if "unique constraint" in str(e).lower():
                raise HTTPException(status_code=400, detail="Position already occupied")
            raise HTTPException(status_code=400, detail=f"Failed to update plant: {str(e)}")
    
    @staticmethod
    async def delete_plant(user_id: str, plant_id: str) -> bool:
        try:
            result = supabase.table("plants").update({"is_active": False}).eq("id", plant_id).eq("user_id", user_id).execute()
            
            if not result.data:
                raise HTTPException(status_code=404, detail="Plant not found")
            
            return True
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to delete plant: {str(e)}")
    
    
    @staticmethod
    async def log_task_work(user_id: str, work_data: TaskWorkCreate, auth_supabase=None) -> dict:
        client = auth_supabase or supabase
        try:
            plant = await PlantService.get_plant_by_id(user_id, work_data.plant_id, auth_supabase)
            if not plant:
                raise HTTPException(status_code=404, detail="Plant not found")
            
            experience_gained = int(work_data.hours_worked * 100)
            new_experience = plant.experience_points + experience_gained
            new_task_level = PlantService._calculate_task_level(new_experience)
            new_growth = new_task_level * 20
            
            from datetime import date
            today = date.today()
            current_streak = PlantService._calculate_streak_from_updated_at(plant, today)
            update_result = client.table("plants").update({
                "experience_points": new_experience,
                "growth_level": min(100, new_growth)
            }).eq("id", work_data.plant_id).eq("user_id", user_id).execute()
            
            if not update_result.data:
                raise HTTPException(status_code=400, detail="Failed to update plant")
            
            await PlantService._update_user_progress(user_id, experience_gained)
            
            from datetime import datetime
            now = datetime.now()
            return {
                "id": f"work_{work_data.plant_id}_{now.isoformat()}",
                "plant_id": work_data.plant_id,
                "user_id": user_id,
                "hours_worked": work_data.hours_worked,
                "experience_gained": experience_gained,
                "new_task_level": new_task_level,
                "new_growth_level": min(100, new_growth),
                "current_streak": current_streak,
                "last_worked_date": today.isoformat(),
                "created_at": now.isoformat()
            }
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to log task work: {str(e)}")
    
    @staticmethod
    def _calculate_task_level(experience_points: int) -> int:
        if experience_points <= 0:
            return 1
        
        level = 1
        xp_needed = 100
        total_xp_used = 0
        
        while total_xp_used + xp_needed <= experience_points:
            total_xp_used += xp_needed
            level += 1
            xp_needed = 100 + (20 * level)
        
        return level
    
    @staticmethod
    def _calculate_streak_from_updated_at(plant, today):
        if not plant.updated_at:
            return 1
        
        try:
            if isinstance(plant.updated_at, str):
                last_update_date = date.fromisoformat(plant.updated_at.split('T')[0])
            else:
                last_update_date = plant.updated_at.date() if hasattr(plant.updated_at, 'date') else plant.updated_at
            
            days_diff = (today - last_update_date).days
            
            if days_diff == 0:
                return 1
            elif days_diff == 1:
                return 2
            else:
                return 1
        except:
            return 1
    
    @staticmethod
    def _calculate_streak_from_updated_at_dict(plant_dict):
        updated_at = plant_dict.get('updated_at')
        if not updated_at:
            return 0
        
        try:
            from datetime import date
            today = date.today()
            if isinstance(updated_at, str):
                last_update_date = date.fromisoformat(updated_at.split('T')[0])
            else:
                last_update_date = updated_at.date() if hasattr(updated_at, 'date') else updated_at
            
            days_diff = (today - last_update_date).days
            
            if days_diff == 0:
                return 1
            elif days_diff == 1:
                return 1
            else:
                return 0
        except:
            return 0
    
    @staticmethod
    async def apply_daily_decay(user_id: str, auth_supabase=None):
        """Apply daily XP decay: 20 * task_level per day, reduced by streak protection"""
        client = auth_supabase or supabase
        try:
            plants = await PlantService.get_user_plants(user_id, auth_supabase)
            today = date.today()
            
            for plant in plants:
                if not plant.last_worked_date:
                    continue
                
                last_worked = plant.last_worked_date.date() if isinstance(plant.last_worked_date, datetime) else date.fromisoformat(str(plant.last_worked_date))
                days_since_work = (today - last_worked).days
                
                if days_since_work <= 0:
                    continue  # Worked today, no decay
                
                # Calculate daily decay: 20 * task_level
                daily_decay = 20 * plant.task_level
                
                # Streak protection: each streak day prevents 20 XP loss
                streak_protection = min(plant.current_streak or 0, plant.task_level) * 20
                actual_decay = max(0, daily_decay - streak_protection)
                
                # Apply decay for each missed day
                total_decay = actual_decay * days_since_work
                new_experience = max(0, plant.experience_points - total_decay)
                new_task_level = PlantService._calculate_task_level(new_experience)
                new_growth = min(100, (new_experience // 50))
                
                # Update decay status
                new_days_without_care = (plant.days_without_care or 0) + days_since_work
                decay_status = PlantService._calculate_decay_status(new_days_without_care)
                
                # Reset streak if more than 1 day missed
                new_streak = 0 if days_since_work > 1 else plant.current_streak
                
                client.table("plants").update({
                    "experience_points": new_experience,
                    "task_level": new_task_level,
                    "growth_level": new_growth,
                    "days_without_care": new_days_without_care,
                    "decay_status": decay_status.value,
                    "current_streak": new_streak,
                    "is_active": decay_status != DecayStatus.DEAD
                }).eq("id", plant.id).execute()
                
        except Exception as e:
            print(f"Error applying daily decay: {str(e)}")
    
    @staticmethod
    async def _update_user_progress(user_id: str, experience_gained: int):
        try:
            result = supabase.table("user_progress").select("*").eq("user_id", user_id).execute()
            
            if not result.data:
                supabase.table("user_progress").insert({
                    "user_id": user_id,
                    "total_experience": experience_gained,
                    "level": 1,
                    "tasks_completed": 0,
                    "plants_grown": 0,
                    "longest_streak": 0,
                    "current_streak": 0,
                    "last_activity_date": date.today().isoformat()
                }).execute()
            else:
                progress = result.data[0]
                new_total_exp = progress["total_experience"] + experience_gained
                new_level = max(1, (new_total_exp // 100) + 1)
                
                supabase.table("user_progress").update({
                    "total_experience": new_total_exp,
                    "level": new_level,
                    "last_activity_date": date.today().isoformat()
                }).eq("user_id", user_id).execute()
                
        except Exception:
            pass
    
    @staticmethod
    async def update_user_streak(user_id: str) -> dict:
        """Update user streak based on daily task completion"""
        try:
            result = supabase.table("user_progress").select("*").eq("user_id", user_id).execute()
            
            if not result.data:
                await PlantService._update_user_progress(user_id, 0)
                return {"current_streak": 1, "longest_streak": 1, "streak_updated": True}
            
            progress = result.data[0]
            today = date.today()
            last_activity = progress.get("last_activity_date")
            
            if last_activity:
                last_date = date.fromisoformat(last_activity)
                days_diff = (today - last_date).days
                
                if days_diff == 0:
                    return {"current_streak": progress["current_streak"], "longest_streak": progress["longest_streak"], "streak_updated": False}
                elif days_diff == 1:
                    new_streak = progress["current_streak"] + 1
                    new_longest = max(progress["longest_streak"], new_streak)
                else:
                    new_streak = 1
                    new_longest = progress["longest_streak"]
                    await PlantService._apply_streak_penalty(user_id, days_diff)
            else:
                new_streak = 1
                new_longest = max(progress["longest_streak"], 1)
            
            supabase.table("user_progress").update({
                "current_streak": new_streak,
                "longest_streak": new_longest,
                "last_activity_date": today.isoformat()
            }).eq("user_id", user_id).execute()
            
            return {"current_streak": new_streak, "longest_streak": new_longest, "streak_updated": True}
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to update streak: {str(e)}")
    
    @staticmethod
    async def _apply_streak_penalty(user_id: str, days_missed: int):
        """Apply penalties for missed days - implements plant decay logic"""
        try:
            penalty_severity = min(days_missed, 7)
            
            # Get all user's active plants
            plants_result = supabase.table("plants").select("*").eq("user_id", user_id).eq("is_active", True).execute()
            
            for plant_data in plants_result.data:
                plant_id = plant_data["id"]
                current_growth = plant_data["growth_level"]
                current_exp = plant_data["experience_points"]
                current_days_without_care = plant_data.get("days_without_care", 0)
                
                # Calculate decay effects
                new_days_without_care = current_days_without_care + days_missed
                growth_decay = min(penalty_severity * 5, current_growth // 2)  # Max 50% growth loss
                exp_penalty = min(penalty_severity * 10, current_exp // 4)     # Max 25% exp loss
                
                new_growth = max(0, current_growth - growth_decay)
                new_exp = max(0, current_exp - exp_penalty)
                
                # Determine decay status based on days without care
                decay_status = PlantService._calculate_decay_status(new_days_without_care)
                
                # Apply decay to plant
                supabase.table("plants").update({
                    "growth_level": new_growth,
                    "experience_points": new_exp,
                    "days_without_care": new_days_without_care,
                    "decay_status": decay_status.value,
                    "is_active": decay_status != DecayStatus.DEAD
                }).eq("id", plant_id).execute()
            
            # Apply experience penalty to user progress
            await PlantService._apply_user_experience_penalty(user_id, penalty_severity)
            
        except Exception as e:
            print(f"Error applying streak penalty: {str(e)}")
    
    @staticmethod
    def _calculate_decay_status(days_without_care: int) -> DecayStatus:
        """Calculate plant decay status based on days without care"""
        if days_without_care <= 1:
            return DecayStatus.HEALTHY
        elif days_without_care <= 3:
            return DecayStatus.SLIGHTLY_WILTED
        elif days_without_care <= 5:
            return DecayStatus.WILTED
        elif days_without_care <= 7:
            return DecayStatus.SEVERELY_WILTED
        else:
            return DecayStatus.DEAD
    
    @staticmethod
    async def _apply_user_experience_penalty(user_id: str, penalty_severity: int):
        """Apply experience penalty to user progress"""
        try:
            result = supabase.table("user_progress").select("*").eq("user_id", user_id).execute()
            
            if result.data:
                progress = result.data[0]
                current_exp = progress["total_experience"]
                exp_penalty = min(penalty_severity * 20, current_exp // 10)  # Max 10% exp loss
                new_exp = max(0, current_exp - exp_penalty)
                new_level = max(1, (new_exp // 100) + 1)
                
                supabase.table("user_progress").update({
                    "total_experience": new_exp,
                    "level": new_level
                }).eq("user_id", user_id).execute()
                
        except Exception:
            pass
    
    @staticmethod
    async def reset_plant_decay(user_id: str, plant_id: str):
        """Reset plant decay when user completes tasks - called on plant care"""
        try:
            supabase.table("plants").update({
                "days_without_care": 0,
                "decay_status": DecayStatus.HEALTHY.value
            }).eq("id", plant_id).eq("user_id", user_id).execute()
            
        except Exception:
            pass
    
    @staticmethod
    async def check_and_update_daily_streaks():
        """Check all users for missed streaks and apply penalties - daily cron job"""
        try:
            today = date.today()
            yesterday = today.replace(day=today.day - 1)
            
            # Get all users who haven't been active today
            result = supabase.table("user_progress").select("*").lt("last_activity_date", today.isoformat()).execute()
            
            for user_progress in result.data:
                user_id = user_progress["user_id"]
                last_activity = user_progress.get("last_activity_date")
                
                if last_activity:
                    last_date = date.fromisoformat(last_activity)
                    days_missed = (today - last_date).days
                    
                    if days_missed > 0:
                        # Reset current streak and apply penalties
                        supabase.table("user_progress").update({
                            "current_streak": 0
                        }).eq("user_id", user_id).execute()
                        
                        # Apply decay penalties to plants
                        await PlantService._apply_streak_penalty(user_id, days_missed)
                        
                        # Update plants' days_without_care for gradual decay
                        await PlantService._update_plants_daily_decay(user_id, days_missed)
            
        except Exception as e:
            print(f"Error in daily streak check: {str(e)}")
    
    @staticmethod
    async def _update_plants_daily_decay(user_id: str, days_missed: int):
        """Update plants daily decay counter for gradual visual decay"""
        try:
            plants_result = supabase.table("plants").select("*").eq("user_id", user_id).eq("is_active", True).execute()
            
            for plant_data in plants_result.data:
                plant_id = plant_data["id"]
                current_days = plant_data.get("days_without_care", 0)
                new_days = current_days + days_missed
                new_decay_status = PlantService._calculate_decay_status(new_days)
                
                supabase.table("plants").update({
                    "days_without_care": new_days,
                    "decay_status": new_decay_status.value,
                    "is_active": new_decay_status != DecayStatus.DEAD
                }).eq("id", plant_id).execute()
                
        except Exception as e:
            print(f"Error updating daily plant decay: {str(e)}")
    
    @staticmethod
    async def get_user_progress(user_id: str, auth_supabase=None) -> UserProgressResponse:
        client = auth_supabase or supabase
        try:
            result = client.table("user_progress").select("*").eq("user_id", user_id).execute()
            
            if not result.data:
                default_progress = {
                    "id": "",
                    "user_id": user_id,
                    "total_experience": 0,
                    "level": 1,
                    "tasks_completed": 0,
                    "plants_grown": 0,
                    "longest_streak": 0,
                    "current_streak": 0,
                    "last_activity_date": None,
                    "created_at": datetime.now(),
                    "updated_at": datetime.now()
                }
                return UserProgressResponse(**default_progress)
            
            progress_dict = result.data[0]
            return UserProgressResponse(**progress_dict)
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch user progress: {str(e)}")
    
    @staticmethod
    async def award_task_completion_experience(user_id: str, plant_id: Optional[str] = None) -> int:
        try:
            experience_gained = 20
            
            if plant_id:
                care_data = PlantCareCreate(plant_id=plant_id, care_type=CareType.TASK_COMPLETE)
                await PlantService.care_for_plant(user_id, care_data)
            
            result = supabase.table("user_progress").select("*").eq("user_id", user_id).execute()
            
            if result.data:
                progress = result.data[0]
                supabase.table("user_progress").update({
                    "tasks_completed": progress["tasks_completed"] + 1,
                    "last_activity_date": date.today().isoformat()
                }).eq("user_id", user_id).execute()
            
            return experience_gained
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to award experience: {str(e)}")
    
    @staticmethod
    async def harvest_plant(user_id: str, plant_id: str, auth_supabase=None) -> dict:
        """Harvest a mature plant - removes the plant"""
        client = auth_supabase or supabase
        try:
            # Get the plant first to verify it exists and can be harvested
            plant = await PlantService.get_plant_by_id(user_id, plant_id, auth_supabase)
            
            # Check if plant is mature enough to harvest (stage 4+)
            plant_stage = min(5, plant.growth_level // 20)
            if plant_stage < 4:
                raise HTTPException(status_code=400, detail="Plant is not mature enough to harvest")
            
            # Remove the plant (soft delete)
            result = client.table("plants").update({"is_active": False}).eq("id", plant_id).eq("user_id", user_id).execute()
            
            if not result.data:
                raise HTTPException(status_code=404, detail="Plant not found")
            
            return {"message": "Plant harvested successfully", "experience_gained": 0}
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to harvest plant: {str(e)}")
    
