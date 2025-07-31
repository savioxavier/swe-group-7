from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer
from typing import List
from app.services.auth import get_current_user_id, get_authenticated_supabase
from app.services.plant_service import PlantService
from app.models.plant import PlantCreate, PlantUpdate, PlantResponse, TaskWorkCreate, TaskWorkResponse, UserProgressResponse

router = APIRouter()
security = HTTPBearer()

@router.post("/", response_model=PlantResponse)
async def create_plant(
    plant_data: PlantCreate,
    credentials = Depends(security)
):
    auth_supabase, user_id = await get_authenticated_supabase(credentials)
    return await PlantService.create_plant(user_id, plant_data, auth_supabase)

@router.get("/", response_model=List[PlantResponse])
async def get_plants(credentials = Depends(security)):
    auth_supabase, user_id = await get_authenticated_supabase(credentials)
    return await PlantService.get_user_plants(user_id, auth_supabase)

@router.get("/{plant_id}", response_model=PlantResponse)
async def get_plant(
    plant_id: str,
    credentials = Depends(security)
):
    auth_supabase, user_id = await get_authenticated_supabase(credentials)
    return await PlantService.get_plant_by_id(user_id, plant_id, auth_supabase)

@router.put("/{plant_id}", response_model=PlantResponse)
async def update_plant(
    plant_id: str,
    plant_data: PlantUpdate,
    credentials = Depends(security)
):
    user_id = await get_current_user_id(credentials)
    return await PlantService.update_plant(user_id, plant_id, plant_data)

@router.delete("/{plant_id}")
async def delete_plant(
    plant_id: str,
    credentials = Depends(security)
):
    user_id = await get_current_user_id(credentials)
    success = await PlantService.delete_plant(user_id, plant_id)
    if success:
        return {"message": "Plant deleted successfully"}
    raise HTTPException(status_code=400, detail="Failed to delete plant")

@router.post("/work")
async def log_task_work(
    work_data: TaskWorkCreate,
    credentials = Depends(security)
):
    auth_supabase, user_id = await get_authenticated_supabase(credentials)
    return await PlantService.log_task_work(user_id, work_data, auth_supabase)

@router.get("/progress/me", response_model=UserProgressResponse)
async def get_user_progress(credentials = Depends(security)):
    auth_supabase, user_id = await get_authenticated_supabase(credentials)
    return await PlantService.get_user_progress(user_id, auth_supabase)

@router.post("/{plant_id}/harvest")
async def harvest_plant(
    plant_id: str,
    credentials = Depends(security)
):
    auth_supabase, user_id = await get_authenticated_supabase(credentials)
    return await PlantService.harvest_plant(user_id, plant_id, auth_supabase)

