from fastapi import APIRouter
from typing import List

router = APIRouter()

@router.get("/")
async def get_plants():
    return {"message": "Plants endpoint working"}

@router.post("/")
async def create_plant():
    return {"message": "Plant created successfully"}
