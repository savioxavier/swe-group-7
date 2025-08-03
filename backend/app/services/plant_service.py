from typing import List, Optional
from datetime import datetime, date
import uuid
from app.config import supabase
from app.models.plant import PlantCreate, PlantUpdate, PlantResponse, TaskWorkCreate, TaskWorkResponse, UserProgressResponse, ProductivityCategory, PlantType, DecayStatus
from fastapi import HTTPException
from app.services.xp_service import XPService

class PlantService:
    
    @staticmethod
    async def create_plant(user_id: str, plant_data: PlantCreate, auth_supabase=None) -> PlantResponse:
        client = auth_supabase or supabase
        try:
            # First, clear any inactive plants at this position to avoid conflicts
            client.table("plants").delete().eq("user_id", user_id).eq("position_x", plant_data.position_x).eq("position_y", plant_data.position_y).eq("is_active", False).execute()
            
            # Ensure all task steps have proper UUIDs
            task_steps_with_ids = []
            if plant_data.task_steps:
                for step in plant_data.task_steps:
                    step_dict = step.dict()
                    if not step_dict.get('id'):
                        step_dict['id'] = str(uuid.uuid4())
                    task_steps_with_ids.append(step_dict)
            
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
                "days_without_care": 0,
                # Multi-step task fields
                "is_multi_step": plant_data.is_multi_step,
                "task_steps": task_steps_with_ids,
                "completed_steps": 0,
                "total_steps": len(task_steps_with_ids)
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
            # IMPORTANT: Include multi-step task fields for proper task step display
            result = client.table("plants").select(
                "id, user_id, name, task_name, task_description, task_status, plant_type, plant_sprite, "
                "position_x, position_y, growth_level, experience_points, current_streak, "
                "last_worked_date, days_without_care, decay_status, is_active, "
                "created_at, updated_at, completion_date, "
                "is_multi_step, task_steps, completed_steps, total_steps"
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
                
                # Set defaults for multi-step task fields (backwards compatibility)
                plant_dict.setdefault('is_multi_step', False)
                plant_dict.setdefault('task_steps', [])
                plant_dict.setdefault('completed_steps', 0)
                plant_dict.setdefault('total_steps', 0)
                
                # Fix task steps with null IDs by generating UUIDs
                if plant_dict.get('task_steps'):
                    fixed_steps = []
                    for step in plant_dict['task_steps']:
                        if not step.get('id'):
                            step['id'] = str(uuid.uuid4())
                        fixed_steps.append(step)
                    plant_dict['task_steps'] = fixed_steps
                
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
            
            # Fix task steps with null IDs by generating UUIDs
            if plant_dict.get('task_steps'):
                fixed_steps = []
                for step in plant_dict['task_steps']:
                    if not step.get('id'):
                        step['id'] = str(uuid.uuid4())
                    fixed_steps.append(step)
                plant_dict['task_steps'] = fixed_steps
                
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
            plant_result = client.table("plants").select("experience_points, current_streak, updated_at, is_multi_step, task_name, task_level, task_status, completed_steps, total_steps").eq("id", work_data.plant_id).eq("user_id", user_id).eq("is_active", True).single().execute()
            
            if not plant_result.data:
                raise HTTPException(status_code=404, detail="Plant not found")
            
            plant = plant_result.data
            experience_gained = int(work_data.hours_worked * 100)
            
            if plant.get("is_multi_step"):
                
                from datetime import date
                today = date.today()
                
                # Calculate streak but don't change task completion
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
                
                # Multi-step update: PRESERVE all task completion fields, only update timestamps and streak
                update_result = client.table("plants").update({
                    "current_streak": new_streak,
                    "last_worked_date": today.isoformat(),
                    "days_without_care": 0,
                    "decay_status": DecayStatus.HEALTHY.value,
                    "is_active": True
                }).eq("id", work_data.plant_id).eq("user_id", user_id).execute()
                
                if not update_result.data:
                    raise HTTPException(status_code=400, detail="Failed to update plant")
                
                # Update user XP separately (they still get XP for time worked)
                try:
                    await PlantService._update_user_progress_fast(user_id, experience_gained)
                except Exception:
                    pass
                
                from datetime import datetime
                now = datetime.now()
                return {
                    "id": f"work_{work_data.plant_id}_{now.isoformat()}",
                    "plant_id": work_data.plant_id,
                    "user_id": user_id,
                    "hours_worked": work_data.hours_worked,
                    "experience_gained": experience_gained,
                    "new_task_level": plant.get("task_level"),  # Keep current task_level unchanged
                    "new_growth_level": plant.get("task_level", 1) * 20,  # Based on current task_level, not updated
                    "current_streak": new_streak,
                    "last_worked_date": today.isoformat(),
                    "created_at": now.isoformat(),
                    "task_completed": False,  # Multi-step tasks never complete from time logging
                    "message": "Multi-step task: time logged, XP gained, task state preserved"
                }
            
            else:
                
                # For single-step: proceed with normal completion logic
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
                
                # Single-step update: Normal completion logic
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
                
                # Update user XP
                try:
                    await PlantService._update_user_progress_fast(user_id, experience_gained)
                except Exception:
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
                
        except Exception:
            pass
    
    @staticmethod
    async def _update_user_progress(user_id: str, experience_gained: int):
        """Update user progress using XP service (fallback method)"""
        try:
            # Use XP service to properly calculate and update user progress
            await XPService.update_user_xp(user_id, experience_gained)
        except Exception:
            pass

    @staticmethod
    async def _update_user_progress_fast(user_id: str, experience_gained: int):
        """Update user progress using XP service"""
        try:
            # Use XP service to properly calculate and update user progress
            await XPService.update_user_xp(user_id, experience_gained)
        except Exception:
            pass
    
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

    @staticmethod
    async def complete_task_step(user_id: str, step_data, auth_supabase=None):
        """Complete a task step and update plant growth based on milestone-based system"""
        client = auth_supabase or supabase
        try:
            # Validate UUIDs before making database call
            import re
            uuid_pattern = r'^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
            
            if not re.match(uuid_pattern, step_data.plant_id, re.IGNORECASE):
                raise HTTPException(status_code=400, detail=f"Invalid plant ID format: {step_data.plant_id}")
                
            if not re.match(uuid_pattern, step_data.step_id, re.IGNORECASE):
                raise HTTPException(status_code=400, detail=f"Invalid step ID format: {step_data.step_id}")
            
            # Get plant with current steps
            plant_result = client.table("plants").select(
                "id, user_id, name, task_name, task_description, task_status, plant_type, plant_sprite, "
                "position_x, position_y, growth_level, experience_points, current_streak, "
                "last_worked_date, days_without_care, decay_status, is_active, "
                "created_at, updated_at, completion_date, "
                "is_multi_step, task_steps, completed_steps, total_steps"
            ).eq("id", step_data.plant_id).eq("user_id", user_id).single().execute()
            
            if not plant_result.data:
                raise HTTPException(status_code=404, detail="Plant not found")
            
            plant = plant_result.data
            
            # Fix task steps with null IDs by generating UUIDs (same as in get_user_plants)
            if plant.get('task_steps'):
                fixed_steps = []
                for step in plant['task_steps']:
                    if not step.get('id'):
                        step['id'] = str(uuid.uuid4())
                    fixed_steps.append(step)
                plant['task_steps'] = fixed_steps
            
            # Update task steps
            task_steps = plant.get("task_steps", [])
            step_found = False
            completed_steps = 0
            
            
            for i, step in enumerate(task_steps):
                if step.get("id") == step_data.step_id:
                    step["is_completed"] = True
                    step["completed_at"] = datetime.now().isoformat()
                    if hasattr(step_data, 'hours_worked') and step_data.hours_worked is not None:
                        step["work_hours"] = step.get("work_hours", 0) + step_data.hours_worked
                    step_found = True
                
                if step.get("is_completed"):
                    completed_steps += 1
            
            if not step_found:
                raise HTTPException(status_code=404, detail="Task step not found")
            
            
            # Calculate milestone-based growth
            total_steps = len(task_steps)
            
            # Each completed step = 1 growth stage (up to stage 5)
            new_growth_stage = min(5, completed_steps)
            new_growth_level = new_growth_stage * 20  # Convert stage to 0-100 scale
            
            # Calculate experience (bonus for completing steps + optional hours)
            experience_bonus = 50 if completed_steps == total_steps else 25
            # Only add hours XP if hours were actually worked (allow step completion without time tracking)
            hours_xp = int((step_data.hours_worked or 0) * 100) if step_data.hours_worked else 0
            total_experience_gained = hours_xp + experience_bonus
            
            
            # Update plant
            update_data = {
                "task_steps": task_steps,
                "completed_steps": completed_steps,
                "total_steps": total_steps,
                "task_level": new_growth_stage,  # Update task level for each completed step
                "growth_level": new_growth_level,
                "experience_points": plant["experience_points"] + total_experience_gained,
                "last_worked_date": datetime.now().date().isoformat(),
                "days_without_care": 0,
                "decay_status": DecayStatus.HEALTHY.value,
            }
            
            # Mark as completed if all steps done
            if completed_steps == total_steps:
                update_data["task_status"] = "completed"
                update_data["completion_date"] = datetime.now().isoformat()
            
            update_result = client.table("plants").update(update_data).eq("id", step_data.plant_id).eq("user_id", user_id).execute()
            
            if not update_result.data:
                raise HTTPException(status_code=400, detail="Failed to update plant")
            
            # Update user progress
            try:
                await PlantService._update_user_progress_fast(user_id, total_experience_gained)
            except Exception:
                pass
            
            return {
                "success": True,
                "completed_steps": completed_steps,
                "total_steps": total_steps,
                "new_growth_stage": new_growth_stage,
                "new_task_level": new_growth_stage,  # Add this for frontend compatibility
                "experience_gained": total_experience_gained,
                "task_completed": completed_steps == total_steps
            }
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to complete task step: {str(e)}")

    @staticmethod
    async def update_task_step_partial(user_id: str, step_data, auth_supabase=None):
        """Mark a task step as partially complete and add work hours"""
        client = auth_supabase or supabase
        try:
            # Get plant with current steps
            plant_result = client.table("plants").select("*").eq("id", step_data.plant_id).eq("user_id", user_id).single().execute()
            
            if not plant_result.data:
                raise HTTPException(status_code=404, detail="Plant not found")
            
            plant = plant_result.data
            task_steps = plant.get("task_steps", [])
            step_found = False
            
            for step in task_steps:
                if step.get("id") == step_data.step_id:
                    step["is_partial"] = step_data.mark_partial
                    step["work_hours"] = step.get("work_hours", 0) + step_data.hours_worked
                    step_found = True
                    break
            
            if not step_found:
                raise HTTPException(status_code=404, detail="Task step not found")
            
            # Calculate experience for work done
            experience_gained = int(step_data.hours_worked * 100)
            
            # For single-step tasks or partial work, give small growth boost
            current_growth = plant.get("growth_level", 0)
            growth_boost = min(5, step_data.hours_worked * 2)  # Small visual progress
            new_growth = min(100, current_growth + growth_boost)
            
            # Update plant
            update_result = client.table("plants").update({
                "task_steps": task_steps,
                "growth_level": new_growth,
                "experience_points": plant["experience_points"] + experience_gained,
                "last_worked_date": datetime.now().date().isoformat(),
                "days_without_care": 0,
                "decay_status": DecayStatus.HEALTHY.value,
            }).eq("id", step_data.plant_id).eq("user_id", user_id).execute()
            
            if not update_result.data:
                raise HTTPException(status_code=400, detail="Failed to update plant")
            
            # Update user progress
            try:
                await PlantService._update_user_progress_fast(user_id, experience_gained)
            except Exception:
                pass
            
            return {
                "success": True,
                "experience_gained": experience_gained,
                "new_growth_level": new_growth,
                "hours_added": step_data.hours_worked
            }
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to update task step: {str(e)}")

    @staticmethod
    def calculate_milestone_growth_stage(completed_steps: int, total_steps: int) -> int:
        """Calculate growth stage based on milestone-based system"""
        if total_steps == 0:
            return 0
        
        # Each completed step = 1 growth stage (max 5)
        return min(5, completed_steps)

    @staticmethod
    def calculate_single_task_growth_stage(hours_worked: float, experience_points: int) -> int:
        """Calculate growth stage for single-step tasks based on work hours and experience"""
        # Single-step tasks grow based on accumulated work and experience
        task_level = PlantService._calculate_task_level(experience_points)
        return min(5, task_level)

    @staticmethod
    async def convert_to_multi_step(user_id: str, plant_id: str, task_steps: List, auth_supabase=None):
        """Convert a single-step task to a multi-step task"""
        client = auth_supabase or supabase
        try:
            # Get the current plant
            plant_result = client.table("plants").select("*").eq("id", plant_id).eq("user_id", user_id).single().execute()
            
            if not plant_result.data:
                raise HTTPException(status_code=404, detail="Plant not found")
            
            plant = plant_result.data
            
            # Check if it's already multi-step
            if plant.get("is_multi_step", False):
                raise HTTPException(status_code=400, detail="Plant is already a multi-step task")
            
            # Add unique IDs to steps
            from uuid import uuid4
            steps_with_ids = []
            for step in task_steps:
                step_dict = {
                    "id": str(uuid4()),
                    "title": step.get("title", ""),
                    "description": step.get("description", ""),
                    "is_completed": False,
                    "is_partial": False,
                    "work_hours": 0.0,
                    "completed_at": None
                }
                steps_with_ids.append(step_dict)
            
            # Update the plant to be multi-step
            update_result = client.table("plants").update({
                "is_multi_step": True,
                "task_steps": steps_with_ids,
                "total_steps": len(steps_with_ids),
                "completed_steps": 0
            }).eq("id", plant_id).eq("user_id", user_id).execute()
            
            if not update_result.data:
                raise HTTPException(status_code=400, detail="Failed to convert plant to multi-step")
            
            return {
                "success": True,
                "message": "Task converted to multi-step successfully",
                "total_steps": len(steps_with_ids)
            }
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to convert task: {str(e)}")
