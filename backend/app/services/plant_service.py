from typing import List, Optional
from datetime import datetime, date
from app.config import supabase
from app.models.plant import PlantCreate, PlantUpdate, PlantResponse, PlantCareCreate, PlantCareResponse, UserProgressResponse, CareType
from fastapi import HTTPException

class PlantService:
    
    @staticmethod
    async def create_plant(user_id: str, plant_data: PlantCreate) -> PlantResponse:
        try:
            result = supabase.table("plants").insert({
                "user_id": user_id,
                "name": plant_data.name,
                "plant_type": plant_data.plant_type,
                "position_x": plant_data.position_x,
                "position_y": plant_data.position_y,
                "growth_level": 0,
                "experience_points": 0,
                "is_active": True
            }).execute()
            
            if not result.data:
                raise HTTPException(status_code=400, detail="Failed to create plant")
            
            plant_dict = result.data[0]
            return PlantResponse(**plant_dict)
            
        except Exception as e:
            if "unique constraint" in str(e).lower():
                raise HTTPException(status_code=400, detail="Position already occupied")
            raise HTTPException(status_code=400, detail=f"Failed to create plant: {str(e)}")
    
    @staticmethod
    async def get_user_plants(user_id: str) -> List[PlantResponse]:
        try:
            result = supabase.table("plants").select("*").eq("user_id", user_id).eq("is_active", True).execute()
            
            plants = []
            for plant_dict in result.data:
                plants.append(PlantResponse(**plant_dict))
            
            return plants
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch plants: {str(e)}")
    
    @staticmethod
    async def get_plant_by_id(user_id: str, plant_id: str) -> PlantResponse:
        try:
            result = supabase.table("plants").select("*").eq("id", plant_id).eq("user_id", user_id).execute()
            
            if not result.data:
                raise HTTPException(status_code=404, detail="Plant not found")
            
            plant_dict = result.data[0]
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
    async def care_for_plant(user_id: str, care_data: PlantCareCreate) -> PlantCareResponse:
        try:
            plant = await PlantService.get_plant_by_id(user_id, care_data.plant_id)
            
            experience_gained = PlantService._calculate_care_experience(care_data.care_type)
            
            care_result = supabase.table("plant_care_log").insert({
                "plant_id": care_data.plant_id,
                "user_id": user_id,
                "care_type": care_data.care_type,
                "experience_gained": experience_gained
            }).execute()
            
            if not care_result.data:
                raise HTTPException(status_code=400, detail="Failed to log plant care")
            
            new_experience = plant.experience_points + experience_gained
            new_growth = min(100, (new_experience // 10))
            
            supabase.table("plants").update({
                "experience_points": new_experience,
                "growth_level": new_growth
            }).eq("id", care_data.plant_id).execute()
            
            await PlantService._update_user_progress(user_id, experience_gained)
            
            care_dict = care_result.data[0]
            return PlantCareResponse(**care_dict)
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to care for plant: {str(e)}")
    
    @staticmethod
    def _calculate_care_experience(care_type: CareType) -> int:
        experience_map = {
            CareType.WATER: 5,
            CareType.FERTILIZE: 10,
            CareType.TASK_COMPLETE: 15
        }
        return experience_map.get(care_type, 5)
    
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
    async def get_user_progress(user_id: str) -> UserProgressResponse:
        try:
            result = supabase.table("user_progress").select("*").eq("user_id", user_id).execute()
            
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