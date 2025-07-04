from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def get_plants():
    return {"plants": []}

@router.post("/")
async def create_plant():
    return {"message": "Plant created"}
