export interface User {
  id: string
  email: string
  username?: string
  created_at: string
}

export interface LoginData {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  username: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: User
}

export interface RegistrationResponse {
  message: string
  user_id: string
  email: string
  requires_confirmation: boolean
}

export interface PlantCreate {
  name: string
  plant_type: 'exercise' | 'study' | 'work' | 'selfcare' | 'creative'
  plant_sprite: string
  position_x: number
  position_y: number
}

export interface PlantResponse {
  id: string
  user_id: string
  name: string
  plant_type: 'exercise' | 'study' | 'work' | 'selfcare' | 'creative'
  plant_sprite: string
  growth_level: number
  experience_points: number
  position_x: number
  position_y: number
  is_active: boolean
  decay_status?: string
  days_without_care?: number
  created_at: string
  updated_at: string
}

export interface PlantCareCreate {
  plant_id: string
  care_type: 'water' | 'fertilize' | 'task_complete'
}

export interface PlantCareResponse {
  id: string
  plant_id: string
  user_id: string
  care_type: string
  experience_gained: number
  created_at: string
}

export interface UserProgressResponse {
  id: string
  user_id: string
  total_experience: number
  level: number
  tasks_completed: number
  plants_grown: number
  longest_streak: number
  current_streak: number
  last_activity_date: string | null
  created_at: string
  updated_at: string
}
