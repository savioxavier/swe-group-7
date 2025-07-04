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
