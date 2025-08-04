export type FriendshipStatus = "pending" | "accepted" | "declined" | "blocked";

export interface UserProfile {
  user_id: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface Friendship {
  user_one_id: string;
  user_two_id: string;
  action_user_id: string;
  status: FriendshipStatus;
  created_at: string;
  updated_at: string;
  profile?: UserProfile; // Joined from user_profiles
}

export interface FriendRequest {
  email: string;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  display_name?: string;
  email: string;
  total_experience: number;
  level: number;
  tasks_completed: number;
  plants_grown: number;
  longest_streak: number;
  current_streak: number;
}

export interface UserProfileUpdate {
  display_name?: string;
  avatar_url?: string;
  is_public?: boolean;
}
