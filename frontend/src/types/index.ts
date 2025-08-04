export interface User {
  id: string;
  email: string;
  username?: string;
  role?: "user" | "admin";
  created_at: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  username: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface RegistrationResponse {
  message: string;
  user_id: string;
  email: string;
  requires_confirmation: boolean;
}

export interface TaskStep {
  id?: string;
  title: string;
  description?: string;
  is_completed: boolean;
  is_partial?: boolean; // For partial completion tracking
  completed_at?: string;
  work_hours?: number; // Hours worked on this step
}

export interface PlantCreate {
  name: string;
  task_description?: string;
  productivity_category: "work" | "study" | "exercise" | "creative";
  plant_sprite: string;
  position_x: number;
  position_y: number;
  task_steps?: TaskStep[];
  is_multi_step?: boolean;
}

export interface PlantResponse {
  id: string;
  user_id: string;
  name: string;
  task_description?: string;
  task_status?: "active" | "completed" | "harvested";
  completion_date?: string;
  plant_type?: "exercise" | "study" | "work" | "selfcare" | "creative";
  productivity_category?: "work" | "study" | "exercise" | "creative";
  plant_sprite: string;
  growth_level: number;
  experience_points: number;
  task_level?: number;
  position_x: number;
  position_y: number;
  is_active: boolean;
  decay_status?:
    | "healthy"
    | "slightly_wilted"
    | "wilted"
    | "severely_wilted"
    | "dead";
  days_without_care?: number;
  last_worked_date?: string;
  current_streak?: number;
  created_at: string;
  updated_at: string;
  task_steps?: TaskStep[];
  is_multi_step?: boolean;
  completed_steps?: number;
  total_steps?: number;
}

export interface TaskWorkCreate {
  plant_id: string;
  hours_worked: number;
}

export interface TaskWorkResponse {
  id: string;
  plant_id: string;
  user_id: string;
  hours_worked: number;
  experience_gained: number;
  new_task_level?: number;
  new_growth_level?: number;
  current_streak?: number;
  last_worked_date?: string;
  description?: string;
  created_at: string;
}

export interface UserProgressResponse {
  id: string;
  user_id: string;
  total_experience: number;
  level: number;
  tasks_completed: number;
  plants_grown: number;
  longest_streak: number;
  current_streak: number;
  last_activity_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  username?: string;
  role: "user" | "admin";
  total_plants: number;
  total_experience: number;
  current_level: number;
  last_activity?: string;
  created_at: string;
}

export interface SystemStats {
  total_users: number;
  total_plants: number;
  total_tasks: number;
  total_experience: number;
  avg_experience_per_user: number;
  last_updated: string;
}

export interface TaskStepComplete {
  plant_id: string;
  step_id: string;
  hours_worked?: number;
}

export interface TaskStepPartial {
  plant_id: string;
  step_id: string;
  hours_worked: number;
  mark_partial?: boolean;
}

export interface PlantConvertToMultiStep {
  plant_id: string;
  task_steps: Array<{
    title: string;
    description?: string;
  }>;
}

// Friend system types
export * from "./friend";
