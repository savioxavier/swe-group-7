const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

import { LoginData, RegisterData, AuthResponse, RegistrationResponse } from '../types'

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Network error' }))
    throw new ApiError(response.status, error.detail || 'Request failed')
  }

  return response.json()
}

export const api = {
  async register(data: RegisterData): Promise<AuthResponse | RegistrationResponse> {
    return apiRequest<AuthResponse | RegistrationResponse>('/api/users/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async login(data: LoginData): Promise<AuthResponse> {
    return apiRequest<AuthResponse>('/api/users/login', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async getCurrentUser(token: string): Promise<AuthResponse['user']> {
    return apiRequest<AuthResponse['user']>('/api/users/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  },
}

export { ApiError }