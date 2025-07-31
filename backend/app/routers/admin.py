from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer
from typing import List
from ..services.auth import require_admin, get_current_user_id
from ..services.admin_service import AdminService
from ..models.user import AdminUserListResponse

router = APIRouter()
security = HTTPBearer()

@router.get("/users", response_model=List[AdminUserListResponse])
async def get_all_users(credentials = Depends(security)):
    await require_admin(credentials)
    return await AdminService.get_all_users()

@router.post("/users/{user_id}/promote")
async def promote_user_to_admin(
    user_id: str,
    credentials = Depends(security)
):
    await require_admin(credentials)
    success = await AdminService.promote_user_to_admin(user_id)
    if success:
        return {"message": f"User {user_id} promoted to admin"}
    raise HTTPException(status_code=400, detail="Failed to promote user")

@router.get("/stats")
async def get_system_stats(credentials = Depends(security)):
    await require_admin(credentials)
    return await AdminService.get_system_stats()

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    credentials = Depends(security)
):
    await require_admin(credentials)
    current_user_id = await get_current_user_id(credentials)
    
    if user_id == current_user_id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    success = await AdminService.delete_user(user_id)
    if success:
        return {"message": f"User {user_id} deleted successfully"}
    raise HTTPException(status_code=400, detail="Failed to delete user")

@router.post("/decay/run")
async def manually_run_decay(credentials = Depends(security)):
    await require_admin(credentials)
    from ..services.scheduler_service import scheduler_service
    try:
        await scheduler_service.run_daily_decay()
        return {"message": "Daily decay process completed manually"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to run decay: {str(e)}")