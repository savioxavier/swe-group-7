from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import UUID4

from ..models.friend import (
    FriendshipStatus,
    UserProfile,
    UserProfileUpdate,
    Friendship,
    FriendRequest,
    LeaderboardEntry,
)
from ..services.friend_service import FriendService
from ..services.auth import get_current_user_id

router = APIRouter()
security = HTTPBearer()


@router.post("/request", response_model=Friendship)
async def send_friend_request(
    request: FriendRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    user_id = await get_current_user_id(credentials)
    print(f"Attempting to find friend with email: |{request.email}|")
    return await FriendService.send_friend_request(user_id, request.email)


@router.get("/requests/incoming", response_model=List[Friendship])
async def get_incoming_requests(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    user_id = await get_current_user_id(credentials)
    return await FriendService.get_friend_requests(user_id, outgoing=False)


@router.get("/requests/outgoing", response_model=List[Friendship])
async def get_outgoing_requests(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    user_id = await get_current_user_id(credentials)
    return await FriendService.get_friend_requests(user_id, outgoing=True)


@router.put("/request/{other_user_id}/accept", response_model=Friendship)
async def accept_friend_request(
    other_user_id: Any, credentials: HTTPAuthorizationCredentials = Depends(security)
):
    current_user_id = await get_current_user_id(credentials)

    # Sort the IDs to find the composite key
    user_ids = sorted([str(other_user_id), str(current_user_id)])
    user_one = user_ids[0]
    user_two = user_ids[1]

    return await FriendService.update_friend_request(
        user_one_id=user_one,
        user_two_id=user_two,
        current_user_id=current_user_id,
        new_status=FriendshipStatus.ACCEPTED,
    )


@router.put("/request/{other_user_id}/decline", response_model=Friendship)
async def decline_friend_request(
    other_user_id: Any, credentials: HTTPAuthorizationCredentials = Depends(security)
):
    current_user_id = await get_current_user_id(credentials)

    # Sort the IDs to find the composite key
    user_ids = sorted([str(other_user_id), str(current_user_id)])
    user_one = user_ids[0]
    user_two = user_ids[1]

    return await FriendService.update_friend_request(
        user_one_id=user_one,
        user_two_id=user_two,
        current_user_id=current_user_id,
        new_status=FriendshipStatus.DECLINED,
    )


@router.delete("/{friend_id}")
async def remove_friend(
    friend_id: str, credentials: HTTPAuthorizationCredentials = Depends(security)
):
    user_id = await get_current_user_id(credentials)
    await FriendService.remove_friend(user_id, friend_id)
    return {"message": "Friend removed successfully"}


@router.get("", response_model=List[UserProfile])
async def get_friends(credentials: HTTPAuthorizationCredentials = Depends(security)):
    user_id = await get_current_user_id(credentials)
    return await FriendService.get_friends(user_id)


# NOTE: look here later lol
@router.get("/leaderboard", response_model=List[LeaderboardEntry])
async def get_leaderboard(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    user_id = await get_current_user_id(credentials)
    return FriendService.get_leaderboard(user_id)


@router.get("/profile/{user_id}", response_model=UserProfile)
async def get_user_profile(
    user_id: str, credentials: HTTPAuthorizationCredentials = Depends(security)
):
    await get_current_user_id(credentials)  # Verify authentication
    profile = await FriendService.get_user_profile(user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.put("/profile", response_model=UserProfile)
async def update_profile(
    profile_update: UserProfileUpdate,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    user_id = await get_current_user_id(credentials)
    return await FriendService.update_user_profile(user_id, profile_update)
