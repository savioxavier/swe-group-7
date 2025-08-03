from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer
from typing import List
from app.services.auth import get_current_user_id, get_authenticated_supabase
from app.services.plant_service import PlantService
from app.services.auto_harvest_service import AutoHarvestService
from app.models.plant import PlantCreate, PlantUpdate, PlantResponse, TaskWorkCreate, TaskWorkResponse, UserProgressResponse, TaskStepComplete, TaskStepPartial, PlantConvertToMultiStep

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

@router.get("/work/today", response_model=List[TaskWorkResponse])
async def get_todays_work_logs(credentials = Depends(security)):
    auth_supabase, user_id = await get_authenticated_supabase(credentials)
    return await PlantService.get_todays_work_logs(user_id, auth_supabase)

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
    return await AutoHarvestService.manual_harvest(user_id, plant_id, auth_supabase)

@router.post("/{plant_id}/complete")
async def complete_task(
    plant_id: str,
    credentials = Depends(security)
):
    auth_supabase, user_id = await get_authenticated_supabase(credentials)
    return await AutoHarvestService.complete_task(user_id, plant_id, auth_supabase)

@router.post("/harvest/user")
async def harvest_user_trophies(credentials = Depends(security)):
    """Harvest all trophy plants for the current user"""
    auth_supabase, user_id = await get_authenticated_supabase(credentials)
    return await AutoHarvestService.check_and_harvest_completed_tasks(user_id, auth_supabase, force_harvest=True)

@router.post("/steps/complete")
async def complete_task_step(
    step_data: TaskStepComplete,
    credentials = Depends(security)
):
    """Complete a task step using milestone-based growth"""
    auth_supabase, user_id = await get_authenticated_supabase(credentials)
    return await PlantService.complete_task_step(user_id, step_data, auth_supabase)

@router.post("/steps/partial")
async def update_task_step_partial(
    step_data: TaskStepPartial,
    credentials = Depends(security)
):
    """Add work hours to a task step and mark as partial"""
    auth_supabase, user_id = await get_authenticated_supabase(credentials)
    return await PlantService.update_task_step_partial(user_id, step_data, auth_supabase)

@router.post("/convert-to-multi-step")
async def convert_plant_to_multi_step(
    conversion_data: PlantConvertToMultiStep,
    credentials = Depends(security)
):
    """Convert a single-step task to a multi-step task"""
    auth_supabase, user_id = await get_authenticated_supabase(credentials)
    return await PlantService.convert_to_multi_step(user_id, conversion_data.plant_id, conversion_data.task_steps, auth_supabase)

