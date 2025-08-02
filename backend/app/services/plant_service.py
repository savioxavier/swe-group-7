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
            # First, clear any inactive plants at this position to avoid conflicts
            client.table("plants").delete().eq("user_id", user_id).eq("position_x", plant_data.position_x).eq("position_y", plant_data.position_y).eq("is_active", False).execute()
            
            # Handle both old plant_type and new productivity_category
            insert_data = {
                "user_id": user_id,
                "name": plant_data.name,
                "task_name": plant_data.name,  # Task name is the same as plant name
                "task_description": plant_data.task_description,
                "task_status": "active",  # Default status for new tasks
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
            # PERFORMANCE OPTIMIZATION: Select only necessary fields to reduce data transfer
            result = client.table("plants").select(
                "id, user_id, name, task_name, task_description, task_status, plant_type, plant_sprite, "
                "position_x, position_y, growth_level, experience_points, current_streak, "
                "last_worked_date, days_without_care, decay_status, is_active, "
                "created_at, updated_at, completion_date"
            ).eq("user_id", user_id).eq("is_active", True).order("position_x", desc=False).order("position_y", desc=False).execute()
            
            plants = []
            for plant_dict in result.data:
                # Set defaults only for missing fields (faster than checking each time)
                plant_dict.setdefault('decay_status', DecayStatus.HEALTHY.value)
                plant_dict.setdefault('days_without_care', 0)
                plant_dict.setdefault('plant_sprite', 'carrot')
                plant_dict.setdefault('task_name', plant_dict.get('name', 'Unnamed Task'))
                plant_dict.setdefault('task_description', None)
                plant_dict.setdefault('task_status', 'active')
                plant_dict.setdefault('plant_type', PlantType.WORK.value)
                
                # Pre-calculate derived fields once (faster than multiple calculations)
                experience_points = plant_dict.get('experience_points', 0)
                plant_dict['task_level'] = PlantService._calculate_task_level(experience_points)
                plant_dict['current_streak'] = plant_dict.get('current_streak', 0) or 0
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
                update_data["task_name"] = plant_data.name  # Keep task_name in sync with name
            if plant_data.task_description is not None:
                update_data["task_description"] = plant_data.task_description
            if plant_data.task_status is not None:
                update_data["task_status"] = plant_data.task_status
                # If marking as completed, set completion date
                if plant_data.task_status == "completed":
                    from datetime import datetime
                    update_data["completion_date"] = datetime.now()
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
            # PERFORMANCE OPTIMIZATION: Single query to get current plant values and update atomically
            # First get current plant state efficiently
            plant_result = client.table("plants").select("experience_points, current_streak, updated_at").eq("id", work_data.plant_id).eq("user_id", user_id).eq("is_active", True).single().execute()
            
            if not plant_result.data:
                raise HTTPException(status_code=404, detail="Plant not found")
            
            plant = plant_result.data
            experience_gained = int(work_data.hours_worked * 100)
            new_experience = plant["experience_points"] + experience_gained
            new_task_level = PlantService._calculate_task_level(new_experience)
            new_growth = new_task_level * 20
            
            from datetime import date
            today = date.today()
            
            # Calculate new streak based on last work date
            if plant["updated_at"]:
                last_work_date = date.fromisoformat(plant["updated_at"].split('T')[0]) if isinstance(plant["updated_at"], str) else plant["updated_at"].date()
                days_since_work = (today - last_work_date).days
                
                if days_since_work == 0:
                    new_streak = plant["current_streak"] or 1
                elif days_since_work == 1:
                    new_streak = (plant["current_streak"] or 0) + 1
                else:
                    new_streak = 1
            else:
                new_streak = 1
            
            # PERFORMANCE OPTIMIZATION: Single atomic update
            update_result = client.table("plants").update({
                "experience_points": new_experience,
                "growth_level": min(100, new_growth),
                "current_streak": new_streak,
                "last_worked_date": today.isoformat(),
                "days_without_care": 0,
                "decay_status": DecayStatus.HEALTHY.value,
                "is_active": True
            }).eq("id", work_data.plant_id).eq("user_id", user_id).execute()
            
            if not update_result.data:
                raise HTTPException(status_code=400, detail="Failed to update plant")
            
            # PERFORMANCE OPTIMIZATION: Async user progress update (non-blocking)
            try:
                await PlantService._update_user_progress_fast(user_id, experience_gained)
            except Exception:
                # Don't fail the main operation if progress update fails
                pass
            
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
                "current_streak": new_streak,
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
                # Handle new plants that have never been worked on
                if not plant.last_worked_date:
                    # New plants start decaying after 1 day of creation
                    created_date = plant.created_at.date() if isinstance(plant.created_at, datetime) else date.fromisoformat(str(plant.created_at))
                    days_since_work = (today - created_date).days
                    if days_since_work <= 0:
                        continue  # Created today, no decay yet
                else:
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
                new_growth = min(100, new_task_level * 20)
                
                # Additional visual decay based on neglect
                new_days_without_care = (plant.days_without_care or 0) + days_since_work
                decay_status = PlantService._calculate_decay_status(new_days_without_care)
                
                # Apply additional visual decay penalty
                if decay_status == DecayStatus.WILTED:
                    new_growth = max(0, new_growth - 20)  # Reduce by 1 stage
                elif decay_status == DecayStatus.SEVERELY_WILTED:
                    new_growth = max(0, new_growth - 40)  # Reduce by 2 stages
                elif decay_status == DecayStatus.DEAD:
                    new_growth = 0  # Plant appears dead
                
                # Reduce streak by number of missed days (but not below 0)
                current_streak = plant.current_streak or 0
                new_streak = max(0, current_streak - max(0, days_since_work - 1))
                
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
    async def _update_user_progress_fast(user_id: str, experience_gained: int):
        """Optimized user progress update for better performance"""
        try:
            from datetime import date
            today = date.today().isoformat()
            
            # PERFORMANCE OPTIMIZATION: Single upsert operation
            supabase.table("user_progress").upsert({
                "user_id": user_id,
                "total_experience": experience_gained,  # Will be calculated via SQL trigger if exists
                "last_activity_date": today
            }, on_conflict="user_id").execute()
                
        except Exception:
            # Fallback to original method if upsert fails
            await PlantService._update_user_progress(user_id, experience_gained)
    
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
    
    @staticmethod
    async def get_todays_work_logs(user_id: str, auth_supabase=None) -> List[TaskWorkResponse]:
        from app.config import supabase
        from datetime import datetime, timezone
        
        client = auth_supabase or supabase
        today = datetime.now(timezone.utc).date()
        
        try:
            # Since there's no task_time_logs table with relationship to plants,
            # we'll calculate today's work from the plants' last_worked_date
            result = client.table("plants").select("*").eq("user_id", user_id).eq("is_active", True).execute()
            
            work_logs = []
            for plant_dict in result.data:
                # Check if plant was worked on today by comparing last_worked_date
                last_worked = plant_dict.get("last_worked_date")
                if last_worked:
                    try:
                        if isinstance(last_worked, str):
                            last_worked_date = date.fromisoformat(last_worked.split('T')[0])
                        else:
                            last_worked_date = last_worked.date() if hasattr(last_worked, 'date') else last_worked
                        
                        # If worked today, create a mock work log entry
                        if last_worked_date == today:
                            work_logs.append(TaskWorkResponse(
                                id=f"today_{plant_dict['id']}",
                                plant_id=plant_dict["id"],
                                user_id=plant_dict["user_id"],
                                hours_worked=1.0,  # Default placeholder
                                experience_gained=100,  # Default placeholder
                                description=f"Work on {plant_dict.get('name', 'Task')}",
                                created_at=plant_dict.get("updated_at", datetime.now())
                            ))
                    except:
                        continue
            
            return work_logs
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to get today's work logs: {str(e)}")
