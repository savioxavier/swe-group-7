from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer
from typing import List
from app.services.auth import get_current_user_id
from app.services.plant_service import PlantService
from app.models.plant import PlantCreate, PlantUpdate, PlantResponse, PlantCareCreate, PlantCareResponse, UserProgressResponse

router = APIRouter()
security = HTTPBearer()

@router.post("/", response_model=PlantResponse)
async def create_plant(
    plant_data: PlantCreate,
    credentials = Depends(security)
):
    user_id = await get_current_user_id(credentials)
    return await PlantService.create_plant(user_id, plant_data)

@router.get("/", response_model=List[PlantResponse])
async def get_plants(credentials = Depends(security)):
    user_id = await get_current_user_id(credentials)
    return await PlantService.get_user_plants(user_id)

@router.get("/{plant_id}", response_model=PlantResponse)
async def get_plant(
    plant_id: str,
    credentials = Depends(security)
):
    user_id = await get_current_user_id(credentials)
    return await PlantService.get_plant_by_id(user_id, plant_id)

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

@router.post("/care", response_model=PlantCareResponse)
async def care_for_plant(
    care_data: PlantCareCreate,
    credentials = Depends(security)
):
    user_id = await get_current_user_id(credentials)
    return await PlantService.care_for_plant(user_id, care_data)

@router.get("/progress/me", response_model=UserProgressResponse)
async def get_user_progress(credentials = Depends(security)):
    user_id = await get_current_user_id(credentials)
    return await PlantService.get_user_progress(user_id)