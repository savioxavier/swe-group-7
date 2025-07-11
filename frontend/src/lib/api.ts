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
    
    // Handle token expiration and authentication errors
    if (response.status === 401 || response.status === 403) {
      // Clear stored auth data
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      
      // Redirect to login page
      window.location.href = '/signin'
      
      throw new ApiError(response.status, 'Session expired. Please log in again.')
    }
    
    throw new ApiError(response.status, error.detail || 'Request failed')
  }

  return response.json()
}

function getAuthHeaders() {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
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

  async get<T>(endpoint: string): Promise<T> {
    return apiRequest<T>(`/api${endpoint}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    })
  },

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return apiRequest<T>(`/api${endpoint}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    })
  },

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return apiRequest<T>(`/api${endpoint}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    })
  },

  async delete<T>(endpoint: string): Promise<T> {
    return apiRequest<T>(`/api${endpoint}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })
  },
}

export { ApiError }