const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

import { LoginData, RegisterData, AuthResponse, RegistrationResponse, PlantCreate, PlantResponse, TaskWorkCreate, TaskWorkResponse, UserProgressResponse, AdminUser, SystemStats } from '../types'

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
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/signin'
      throw new ApiError(response.status, 'Session expired. Please log in again.')
    }
    if (response.status === 422) {
      const errorMessage = error.detail ? 
        (Array.isArray(error.detail) ? 
          error.detail.map(e => `Field '${e.loc?.join('.')}': ${e.msg}`).join(', ') : 
          error.detail) : 
        'Validation failed'
      throw new ApiError(response.status, errorMessage)
    }
    const errorMessage = error.detail || error.message || JSON.stringify(error) || `HTTP ${response.status} error`
    throw new ApiError(response.status, errorMessage)
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
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: data ? JSON.stringify(data) : undefined,
    })
  },

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return apiRequest<T>(`/api${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: data ? JSON.stringify(data) : undefined,
    })
  },

  async delete<T>(endpoint: string): Promise<T> {
    return apiRequest<T>(`/api${endpoint}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })
  },

  async createPlant(plantData: PlantCreate): Promise<PlantResponse> {
    return this.post<PlantResponse>('/plants', plantData)
  },

  async getPlants(): Promise<PlantResponse[]> {
    return this.get<PlantResponse[]>('/plants')
  },

  async getPlant(plantId: string): Promise<PlantResponse> {
    return this.get<PlantResponse>(`/plants/${plantId}`)
  },

  async deletePlant(plantId: string): Promise<{message: string}> {
    return this.delete<{message: string}>(`/plants/${plantId}`)
  },

  async logTaskWork(workData: TaskWorkCreate): Promise<TaskWorkResponse> {
    return this.post<TaskWorkResponse>('/plants/work', workData)
  },

  async getUserProgress(): Promise<UserProgressResponse> {
    return this.get<UserProgressResponse>('/plants/progress/me')
  },

  async harvestPlant(plantId: string): Promise<{message: string, experience_gained: number}> {
    return this.post<{message: string, experience_gained: number}>(`/plants/${plantId}/harvest`)
  },

  async getAdminUsers(): Promise<AdminUser[]> {
    return this.get<AdminUser[]>('/admin/users')
  },

  async promoteUserToAdmin(userId: string): Promise<{message: string}> {
    return this.post<{message: string}>(`/admin/users/${userId}/promote`)
  },

  async getSystemStats(): Promise<SystemStats> {
    return this.get<SystemStats>('/admin/stats')
  },

  async deleteUser(userId: string): Promise<{message: string}> {
    return this.delete<{message: string}>(`/admin/users/${userId}`)
  },

  async runManualDecay(): Promise<{message: string}> {
    return this.post<{message: string}>('/admin/decay/run')
  },

  async getTodaysWorkLogs(): Promise<TaskWorkResponse[]> {
    return this.get<TaskWorkResponse[]>('/plants/work/today')
  },

  async completeTask(plantId: string): Promise<{message: string}> {
    return this.post<{message: string}>(`/plants/${plantId}/complete`)
  },
}

export { ApiError }