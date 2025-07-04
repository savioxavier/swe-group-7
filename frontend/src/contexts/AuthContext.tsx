import React, { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../lib/api'
import { User, AuthResponse, RegistrationResponse, LoginData, RegisterData } from '../types'

interface AuthContextType {
  user: User | null
  token: string | null
  login: (data: LoginData) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    
    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  const login = async (data: LoginData) => {
    try {
      const response = await api.login(data)
      setToken(response.access_token)
      setUser(response.user)
      localStorage.setItem('token', response.access_token)
      localStorage.setItem('user', JSON.stringify(response.user))
    } catch (error) {
      throw error
    }
  }

  const register = async (data: RegisterData) => {
    try {
      const response = await api.register(data)
      
      if ('access_token' in response) {
        setToken(response.access_token)
        setUser(response.user)
        localStorage.setItem('token', response.access_token)
        localStorage.setItem('user', JSON.stringify(response.user))
      } else {
        throw new Error(response.message)
      }
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    loading,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}