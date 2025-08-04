const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

import type {
  LoginData,
  RegisterData,
  AuthResponse,
  RegistrationResponse,
  PlantCreate,
  PlantResponse,
  TaskWorkCreate,
  TaskWorkResponse,
  UserProgressResponse,
  AdminUser,
  SystemStats,
  TaskStepComplete,
  TaskStepPartial,
  PlantConvertToMultiStep,
  Friendship,
  UserProfile,
  LeaderboardEntry,
  UserProfileUpdate,
} from "../types";

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: "Network error" }));
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/signin";
      throw new ApiError(
        response.status,
        "Session expired. Please log in again."
      );
    }
    if (response.status === 422) {
      const errorMessage = error.detail
        ? Array.isArray(error.detail)
          ? error.detail
              .map(
                (e: { loc?: string[]; msg: string }) =>
                  `Field '${e.loc?.join(".")}': ${e.msg}`
              )
              .join(", ")
          : error.detail
        : "Validation failed";
      throw new ApiError(response.status, errorMessage);
    }
    const errorMessage =
      error.detail ||
      error.message ||
      JSON.stringify(error) ||
      `HTTP ${response.status} error`;
    throw new ApiError(response.status, errorMessage);
  }

  return response.json();
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  async register(
    data: RegisterData
  ): Promise<AuthResponse | RegistrationResponse> {
    return apiRequest<AuthResponse | RegistrationResponse>(
      "/api/users/register",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  },

  async login(data: LoginData): Promise<AuthResponse> {
    return apiRequest<AuthResponse>("/api/users/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async logout(): Promise<{ message: string }> {
    return apiRequest<{ message: string }>("/api/users/logout", {
      method: "POST",
      headers: getAuthHeaders(),
    });
  },

  async getCurrentUser(token: string): Promise<AuthResponse["user"]> {
    return apiRequest<AuthResponse["user"]>("/api/users/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  async get<T>(endpoint: string): Promise<T> {
    return apiRequest<T>(`/api${endpoint}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
  },

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return apiRequest<T>(`/api${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return apiRequest<T>(`/api${endpoint}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  async delete<T>(endpoint: string): Promise<T> {
    return apiRequest<T>(`/api${endpoint}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
  },

  async createPlant(plantData: PlantCreate): Promise<PlantResponse> {
    return this.post<PlantResponse>("/plants", plantData);
  },

  async getPlants(): Promise<PlantResponse[]> {
    return this.get<PlantResponse[]>("/plants");
  },

  async getPlant(plantId: string): Promise<PlantResponse> {
    return this.get<PlantResponse>(`/plants/${plantId}`);
  },

  async deletePlant(plantId: string): Promise<{ message: string }> {
    return this.delete<{ message: string }>(`/plants/${plantId}`);
  },

  async logTaskWork(workData: TaskWorkCreate): Promise<TaskWorkResponse> {
    return this.post<TaskWorkResponse>("/plants/work", workData);
  },

  async getUserProgress(): Promise<UserProgressResponse> {
    return this.get<UserProgressResponse>("/plants/progress/me");
  },

  async harvestPlant(
    plantId: string
  ): Promise<{ message: string; experience_gained: number }> {
    return this.post<{ message: string; experience_gained: number }>(
      `/plants/${plantId}/harvest`
    );
  },

  async getAdminUsers(): Promise<AdminUser[]> {
    return this.get<AdminUser[]>("/admin/users");
  },

  async promoteUserToAdmin(userId: string): Promise<{ message: string }> {
    return this.post<{ message: string }>(`/admin/users/${userId}/promote`);
  },

  async getSystemStats(): Promise<SystemStats> {
    return this.get<SystemStats>("/admin/stats");
  },

  async deleteUser(userId: string): Promise<{ message: string }> {
    return this.delete<{ message: string }>(`/admin/users/${userId}`);
  },

  async runManualDecay(): Promise<{ message: string }> {
    return this.post<{ message: string }>("/admin/decay/run");
  },

  async getTodaysWorkLogs(): Promise<TaskWorkResponse[]> {
    return this.get<TaskWorkResponse[]>("/plants/work/today");
  },

  async applyDailyDecay(): Promise<{
    decay_applied?: number;
    level?: number;
    streak?: number;
    base_decay?: number;
    streak_protection?: number;
    message?: string;
  }> {
    return this.post("/users/apply-daily-decay");
  },

  async completeTask(plantId: string): Promise<{ message: string }> {
    return this.post<{ message: string }>(`/plants/${plantId}/complete`);
  },

  async harvestUserTrophies(): Promise<{
    message: string;
    harvested_count: number;
  }> {
    return this.post<{ message: string; harvested_count: number }>(
      "/plants/harvest/user"
    );
  },

  async completeTaskStep(stepData: TaskStepComplete): Promise<{
    success: boolean;
    completed_steps: number;
    total_steps: number;
    new_growth_stage: number;
    experience_gained: number;
    task_completed: boolean;
  }> {
    return this.post<{
      success: boolean;
      completed_steps: number;
      total_steps: number;
      new_growth_stage: number;
      experience_gained: number;
      task_completed: boolean;
    }>("/plants/steps/complete", stepData);
  },

  async updateTaskStepPartial(stepData: TaskStepPartial): Promise<{
    success: boolean;
    experience_gained: number;
    new_growth_level: number;
    hours_added: number;
  }> {
    return this.post<{
      success: boolean;
      experience_gained: number;
      new_growth_level: number;
      hours_added: number;
    }>("/plants/steps/partial", stepData);
  },

  async convertToMultiStep(
    conversionData: PlantConvertToMultiStep
  ): Promise<{ success: boolean; message: string; total_steps: number }> {
    return this.post<{
      success: boolean;
      message: string;
      total_steps: number;
    }>("/plants/convert-to-multi-step", conversionData);
  },

  // Friend Management
  async sendFriendRequest(email: string): Promise<Friendship> {
    return this.post<Friendship>("/friends/request", { email });
  },

  async getIncomingFriendRequests(): Promise<Friendship[]> {
    return this.get<Friendship[]>("/friends/requests/incoming");
  },

  async getOutgoingFriendRequests(): Promise<Friendship[]> {
    return this.get<Friendship[]>("/friends/requests/outgoing");
  },

  async acceptFriendRequest(requestId: string): Promise<Friendship> {
    return this.put<Friendship>(`/friends/request/${requestId}/accept`);
  },

  async declineFriendRequest(requestId: string): Promise<Friendship> {
    return this.put<Friendship>(`/friends/request/${requestId}/decline`);
  },

  async removeFriend(friendId: string): Promise<void> {
    return this.delete<void>(`/friends/${friendId}`);
  },

  async getFriends(): Promise<UserProfile[]> {
    return this.get<UserProfile[]>("/friends");
  },

  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    return this.get<LeaderboardEntry[]>("/friends/leaderboard");
  },

  async getUserProfile(userId: string): Promise<UserProfile> {
    return this.get<UserProfile>(`/friends/profile/${userId}`);
  },

  async updateProfile(data: UserProfileUpdate): Promise<UserProfile> {
    return this.put<UserProfile>("/friends/profile", data);
  },
};

export { ApiError };
