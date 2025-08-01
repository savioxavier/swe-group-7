from typing import List
from datetime import datetime, date, timedelta
from app.config import supabase
from app.models.plant import PlantResponse, DecayStatus
from app.services.plant_service import PlantService
from fastapi import HTTPException

class AutoHarvestService:
    
    @staticmethod
    async def check_and_harvest_completed_tasks(user_id: str = None, auth_supabase=None, force_harvest: bool = False):
        """Check for completed tasks that should be auto-harvested after 6 hours or immediately if forced"""
        client = auth_supabase or supabase
        harvested_count = 0
        
        try:
            # Get all completed plants OR plants at stage 5 (trophy plants)
            query = client.table("plants").select("*").eq("is_active", True)
            if user_id:
                query = query.eq("user_id", user_id)
            
            result = query.execute()
            
            for plant_dict in result.data:
                # Check if this is a trophy plant (stage 5) or completed task
                plant_stage = min(5, plant_dict.get('growth_level', 0) // 20)
                is_trophy = plant_stage >= 5
                is_completed = plant_dict.get('task_status') == 'completed'
                completion_date = plant_dict.get('completion_date')
                
                # For manual harvest (force_harvest=True), only harvest completed tasks
                # For automatic harvest (force_harvest=False), harvest based on time since completion
                if force_harvest:
                    # Only harvest if the task is completed
                    if not is_completed:
                        continue
                else:
                    # Skip if neither trophy nor completed
                    if not (is_trophy or is_completed):
                        continue
                
                should_harvest = force_harvest
                
                if not should_harvest and completion_date:
                    # Parse completion date
                    if isinstance(completion_date, str):
                        completion_dt = datetime.fromisoformat(completion_date.replace('Z', '+00:00'))
                    else:
                        completion_dt = completion_date
                    
                    # Check if it's been 6 hours since completion
                    hours_since_completion = (datetime.now() - completion_dt).total_seconds() / 3600
                    should_harvest = hours_since_completion >= 6
                elif not should_harvest and is_trophy and not completion_date:
                    # For trophy plants without completion date, only harvest if it's an automatic check (not manual)
                    should_harvest = False
                
                if should_harvest:
                    # Auto-harvest this plant
                    client.table("plants").update({
                        "task_status": "harvested",
                        "is_active": False  # Remove from garden
                    }).eq("id", plant_dict["id"]).execute()
                    harvested_count += 1
            
            return {
                "message": f"Auto-harvest completed! {harvested_count} trophy plants cleared.",
                "harvested_count": harvested_count
            }
                    
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to run auto-harvest: {str(e)}")
    
    @staticmethod
    async def complete_task(user_id: str, plant_id: str, auth_supabase=None) -> dict:
        """Mark a task as completed"""
        client = auth_supabase or supabase
        try:
            # Get the plant first
            plant = await PlantService.get_plant_by_id(user_id, plant_id, auth_supabase)
            
            if plant.task_status == "completed":
                raise HTTPException(status_code=400, detail="Task is already completed")
            
            # Check if plant has reached stage 4+ (80+ growth_level) before allowing completion
            plant_stage = min(5, plant.growth_level // 20)
            if plant_stage < 4:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Plant needs to reach stage 4 to complete (currently stage {plant_stage})"
                )
            
            # Mark as completed
            completion_date = datetime.now()
            result = client.table("plants").update({
                "task_status": "completed",
                "completion_date": completion_date.isoformat(),
                "decay_status": DecayStatus.HEALTHY.value,  # Completed tasks are healthy
            }).eq("id", plant_id).eq("user_id", user_id).execute()
            
            if not result.data:
                raise HTTPException(status_code=404, detail="Plant not found")
            
            return {
                "message": "Task completed successfully! It will be auto-harvested in 6 hours.",
                "completion_date": completion_date.isoformat(),
                "auto_harvest_date": (completion_date + timedelta(hours=6)).isoformat()
            }
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to complete task: {str(e)}")
    
    @staticmethod
    async def manual_harvest(user_id: str, plant_id: str, auth_supabase=None) -> dict:
        """Manually harvest a completed task before auto-harvest"""
        client = auth_supabase or supabase
        try:
            # Get the plant first
            plant = await PlantService.get_plant_by_id(user_id, plant_id, auth_supabase)
            
            if plant.task_status != "completed":
                raise HTTPException(status_code=400, detail="Task must be completed before harvesting")
            
            # Harvest the plant
            result = client.table("plants").update({
                "task_status": "harvested",
                "is_active": False
            }).eq("id", plant_id).eq("user_id", user_id).execute()
            
            if not result.data:
                raise HTTPException(status_code=404, detail="Plant not found")
            
            return {
                "message": "Task harvested successfully! Great job completing your task.",
                "harvest_date": datetime.now().isoformat()
            }
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to harvest task: {str(e)}")