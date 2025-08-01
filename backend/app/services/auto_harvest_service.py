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
        
        try:
            # Get all completed plants
            query = client.table("plants").select("*").eq("task_status", "completed").eq("is_active", True)
            if user_id:
                query = query.eq("user_id", user_id)
            
            result = query.execute()
            
            for plant_dict in result.data:
                completion_date = plant_dict.get('completion_date')
                if not completion_date:
                    continue
                
                should_harvest = force_harvest
                
                if not should_harvest:
                    # Parse completion date
                    if isinstance(completion_date, str):
                        completion_dt = datetime.fromisoformat(completion_date.replace('Z', '+00:00'))
                    else:
                        completion_dt = completion_date
                    
                    # Check if it's been 6 hours since completion
                    hours_since_completion = (datetime.now() - completion_dt).total_seconds() / 3600
                    should_harvest = hours_since_completion >= 6
                
                if should_harvest:
                    # Auto-harvest this plant
                    client.table("plants").update({
                        "task_status": "harvested",
                        "is_active": False  # Remove from garden
                    }).eq("id", plant_dict["id"]).execute()
                    
        except Exception as e:
            print(f"Error in auto-harvest check: {str(e)}")
    
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