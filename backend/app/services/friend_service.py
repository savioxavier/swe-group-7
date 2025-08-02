from typing import List, Optional
from fastapi import HTTPException
from pydantic import UUID4, EmailStr

from ..models.friend import (
    FriendshipRequest,
    FriendshipStatus,
    UserProfile,
    UserProfileUpdate,
    Friendship,
    LeaderboardEntry,
)
from ..config import supabase


class FriendService:
    @staticmethod
    async def get_user_profile(user_id: UUID4) -> Optional[UserProfile]:
        result = (
            supabase.table("user_profiles")
            .select("*")
            .eq("user_id", str(user_id))
            .execute()
        )
        if not result.data:
            return None
        return UserProfile(**result.data[0])

    @staticmethod
    async def update_user_profile(
        user_id: UUID4, profile_update: UserProfileUpdate
    ) -> UserProfile:
        update_data = profile_update.dict(exclude_unset=True)
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")

        result = (
            supabase.table("user_profiles")
            .update(update_data)
            .eq("user_id", str(user_id))
            .execute()
        )
        if not result.data:
            raise HTTPException(status_code=404, detail="Profile not found")
        return UserProfile(**result.data[0])

    @staticmethod
    async def send_friend_request(
        requester_id: UUID4, friend_email: EmailStr
    ) -> Friendship:
        # Get addressee user_id from email
        profile_result = (
            supabase.table("user_profiles")
            .select("user_id")
            .eq("email", friend_email)
            .execute()
        )
        if not profile_result.data:
            raise HTTPException(status_code=404, detail="User not found")

        addressee_id = profile_result.data[0]["user_id"]

        user_pair = [str(requester_id), str(addressee_id)]

        existing = (
            supabase.table("friendships")
            .select("*")
            .in_("user_one_id", user_pair)
            .in_("user_two_id", user_pair)
            .execute()
        )

        if existing.data:
            friendship = existing.data[0]
            status = FriendshipStatus(friendship["status"])
            if status == FriendshipStatus.PENDING.value:
                raise HTTPException(
                    status_code=400, detail="Friend request already pending"
                )
            elif status == FriendshipStatus.ACCEPTED.value:
                raise HTTPException(status_code=400, detail="Already friends")
            elif status == FriendshipStatus.BLOCKED.value:
                raise HTTPException(
                    status_code=403, detail="Cannot send friend request"
                )

        # Create new friendship
        user_ids = sorted([str(requester_id), str(addressee_id)])

        result = (
            supabase.table("friendships")
            .insert(
                {
                    "user_one_id": user_ids[0],
                    "user_two_id": user_ids[1],
                    "action_user_id": str(
                        requester_id
                    ),  # The person sending the request
                    "status": FriendshipStatus.PENDING.value,
                }
            )
            .execute()
        )

        return Friendship(**result.data[0])

    @staticmethod
    async def get_friend_requests(
        user_id: UUID4, outgoing: bool = False
    ) -> List[FriendshipRequest]:
        user_id_str = str(user_id)

        if outgoing:
            # --- OUTGOING REQUESTS ---
            # We need the profiles of BOTH users in the friendship to determine who the recipient is.
            # Select all friendship data, and nest the full profiles for user_one and user_two.
            query = (
                supabase.from_("friendships")
                .select(
                    "*, user_one:user_profiles!user_one_id(email, display_name), user_two:user_profiles!user_two_id(email, display_name)"
                )
                .eq("status", "pending")
                .eq("action_user_id", user_id_str)
            )

            result = query.execute()

            # Post-process to create the desired `profile` field for the recipient
            processed_data = []
            for item in result.data:
                # The recipient is the user who is NOT the action_user_id (me)
                if item["user_one"]["email"] and item["user_one_id"] != user_id_str:
                    item["profile"] = item["user_one"]
                else:
                    item["profile"] = item["user_two"]

                del item["user_one"]  # Clean up extra fields
                del item["user_two"]
                processed_data.append(item)

            print(f"Processed data: {processed_data}")

            return [FriendshipRequest(**item) for item in processed_data]

        else:
            # --- INCOMING REQUESTS ---
            # This is simpler. The sender is the 'action_user_id'.
            # We can directly join their profile and alias it as 'profile'.
            query = (
                supabase.from_("friendships")
                .select("*, profile:user_profiles!action_user_id(email, display_name)")
                .eq("status", "pending")
                .neq("action_user_id", user_id_str)
                .or_(f"user_one_id.eq.{user_id_str},user_two_id.eq.{user_id_str}")
            )

            result = query.execute()
            return [FriendshipRequest(**item) for item in result.data]

    @staticmethod
    async def update_friendship_status(
        user_one_id: UUID4,
        user_two_id: UUID4,
        current_user_id: UUID4,  # The user performing the action
        new_status: FriendshipStatus,
    ) -> Friendship:
        """
        Accepts a friend request by updating its status.
        The user performing this action must be the recipient, not the original sender.
        """
        result = (
            supabase.from_("friendships")
            .update(
                {
                    "status": new_status.value,
                    "action_user_id": str(current_user_id),
                }
            )
            .match(
                {
                    "user_one_id": str(user_one_id),
                    "user_two_id": str(user_two_id),
                    "status": FriendshipStatus.PENDING.value,
                }
            )
            .neq("action_user_id", str(current_user_id))
            .execute()
        )

        if not result.data:
            raise HTTPException(
                status_code=404,
                detail="Pending friend request not found or you are not authorized to accept it.",
            )

        return Friendship(**result.data[0])

    @staticmethod
    async def delete_friendship(
        user_one_id: UUID4, user_two_id: UUID4, current_user_id: UUID4
    ) -> Friendship:
        """
        Declines/cancels a friend request by deleting the row.
        The user performing this action must be the recipient.
        """
        result = (
            supabase.from_("friendships")
            .delete()
            .match(
                {
                    "user_one_id": str(user_one_id),
                    "user_two_id": str(user_two_id),
                    "status": FriendshipStatus.PENDING.value,
                }
            )
            .neq("action_user_id", str(current_user_id))
            .execute()
        )

        if not result.data:
            raise HTTPException(
                status_code=404,
                detail="Pending friend request not found or you are not authorized to decline it.",
            )

        return Friendship(**result.data[0])

    @staticmethod
    async def remove_friend(user_id: UUID4, friend_id: UUID4) -> None:
        # Create a list of the two user IDs involved in the friendship
        user_pair = [str(user_id), str(friend_id)]

        result = (
            supabase.table("friendships")
            .delete()
            .in_("user_one_id", user_pair)
            .in_("user_two_id", user_pair)
            .eq("status", FriendshipStatus.ACCEPTED.value)
            .execute()
        )

        # The result of a delete operation contains the deleted data.
        # If the list is empty, it means no rows matched the filters.
        if not result.data:
            raise HTTPException(status_code=404, detail="Friendship not found")

    @staticmethod
    async def get_friends(user_id: UUID4) -> List[UserProfile]:
        result = supabase.rpc("get_user_friends", {"p_user_id": str(user_id)}).execute()

        return [UserProfile(**item) for item in result.data]

    @staticmethod
    def get_leaderboard(user_id: UUID4) -> List[LeaderboardEntry]:
        """
        Generates a leaderboard for a user and their accepted friends.

        This function fetches data from multiple tables without using an RPC call:
        1.  Fetches all 'accepted' friendships for the given user_id from 'friendships'.
        2.  Extracts the user IDs of all friends.
        3.  Fetches the email for each user from 'user_profiles'.
        4.  Fetches the corresponding progress data from 'user_progress'.
        5.  Merges the profile (for email) and progress data.
        6.  Sorts the progress data by 'total_experience' to establish ranks.
        7.  Constructs and returns a list of LeaderboardEntry objects.

        Args:
            user_id: The UUID of the currently logged-in user.
            supabase: The initialized Supabase client instance.

        Returns:
            A list of LeaderboardEntry objects, sorted by rank.
        """
        try:
            current_user_id_str = str(user_id)

            # 1. Get all accepted friendships involving the current user
            friendships_response = (
                supabase.table("friendships")
                .select("user_one_id, user_two_id")
                .or_(
                    f"user_one_id.eq.{current_user_id_str},user_two_id.eq.{current_user_id_str}"
                )
                .eq("status", "accepted")
                .execute()
            )

            # 2. Collect the unique IDs of all friends
            friend_ids = set()
            if friendships_response.data:
                for friendship in friendships_response.data:
                    if friendship["user_one_id"] == current_user_id_str:
                        friend_ids.add(friendship["user_two_id"])
                    else:
                        friend_ids.add(friendship["user_one_id"])

            # Create a list of all user IDs to fetch, including the current user
            all_user_ids = list(friend_ids)
            all_user_ids.append(current_user_id_str)

            # 3. Fetch user profiles (for email) and progress data sequentially
            profiles_response = (
                supabase.table("user_profiles")
                .select("user_id, email")
                .in_("user_id", all_user_ids)
                .execute()
            )
            print(f"Profiles Reponse data: {profiles_response.data}")

            print(f"All user ids: {all_user_ids}")

            progress_response = supabase.table("user_progress").select("*").execute()
            print(f"Progress Response data: {progress_response.data}")

            if not progress_response.data:
                return []

            # 4. Create lookup maps for efficient merging
            profiles_map = {
                profile["user_id"]: profile for profile in profiles_response.data
            }

            # 5. Sort the progress data by total_experience
            sorted_progress_data = sorted(
                progress_response.data,
                key=lambda p: p.get("total_experience", 0),
                reverse=True,
            )

            # 6. Build the final list of LeaderboardEntry objects, merging data
            leaderboard_entries = []
            for rank, progress_data in enumerate(sorted_progress_data, 1):
                user_uuid_str = progress_data["user_id"]
                profile_data = profiles_map.get(user_uuid_str)

                # Ensure we have an email, otherwise skip or handle as an error
                if not profile_data or not profile_data.get("email"):
                    # You might want to log this case, as it indicates inconsistent data
                    continue

                entry = LeaderboardEntry(
                    rank=rank,
                    user_id=user_uuid_str,
                    display_name=None,  # Still not fetching display_name
                    email=profile_data["email"],
                    total_experience=progress_data.get("total_experience", 0),
                    level=progress_data.get("level", 1),
                    tasks_completed=progress_data.get("tasks_completed", 0),
                    plants_grown=progress_data.get("plants_grown", 0),
                    longest_streak=progress_data.get("longest_streak", 0),
                    current_streak=progress_data.get("current_streak", 0),
                )
                leaderboard_entries.append(entry)

            return leaderboard_entries

        except Exception as e:
            # Proper error logging should be implemented here
            print(f"An error occurred while generating the leaderboard: {e}")
            return []
