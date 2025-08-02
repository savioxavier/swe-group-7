import React, { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../lib/api'
import { User, LoginData, RegisterData } from '../types'

interface AuthContextType {
  user: User | null
  token: string | null
  login: (data: LoginData) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    const tokenExpiry = localStorage.getItem('tokenExpiry')
    
    if (storedToken && storedUser) {
      const now = Date.now()
      const expiryTime = tokenExpiry ? parseInt(tokenExpiry) : 0
      
      if (expiryTime > now && expiryTime < now + (30 * 24 * 60 * 60 * 1000)) {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
        setLoading(false)
      } else {
        validateToken(storedToken)
          .then(() => {
            setToken(storedToken)
            setUser(JSON.parse(storedUser))
            const newExpiry = now + (24 * 60 * 60 * 1000)
            localStorage.setItem('tokenExpiry', newExpiry.toString())
          })
          .catch(() => {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            localStorage.removeItem('tokenExpiry')
          })
          .finally(() => {
            setLoading(false)
          })
      }
    } else {
      setLoading(false)
    }
  }, [])

  const validateToken = async (token: string): Promise<void> => {
    try {
      await api.getCurrentUser(token)
    } catch {
      throw new Error('Invalid token')
    }
  }

  const login = async (data: LoginData) => {
    const response = await api.login(data)
    const expiry = Date.now() + (24 * 60 * 60 * 1000)
    
    setToken(response.access_token)
    setUser(response.user)
    localStorage.setItem('token', response.access_token)
    localStorage.setItem('user', JSON.stringify(response.user))
    localStorage.setItem('tokenExpiry', expiry.toString())
  }

  const register = async (data: RegisterData) => {
    const response = await api.register(data)
    
    if ('access_token' in response) {
      const expiry = Date.now() + (24 * 60 * 60 * 1000)
      
      setToken(response.access_token)
      setUser(response.user)
      localStorage.setItem('token', response.access_token)
      localStorage.setItem('user', JSON.stringify(response.user))
      localStorage.setItem('tokenExpiry', expiry.toString())
    } else {
      throw new Error(response.message)
    }
  }

  const logout = async () => {
    try {
      const currentToken = token
      setToken(null)
      setUser(null)
      
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('tokenExpiry')
      localStorage.removeItem('lastDailyPanelDate')
      const today = new Date().toDateString()
      localStorage.removeItem(`taskPanelSkipped_${today}`)
      
      if (currentToken) {
        Promise.all([
          api.harvestUserTrophies().catch(error => 
            console.error('Auto-harvest failed during logout:', error)
          ),
          api.logout().catch(error => 
            console.error('Backend logout failed:', error)
          )
        ]).catch(error => {
          console.error('Background logout cleanup failed:', error)
        })
      }
    } catch (error) {
      console.error('Error during logout:', error)
      setToken(null)
      setUser(null)
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('tokenExpiry')
      localStorage.removeItem('lastDailyPanelDate')
      const today = new Date().toDateString()
      localStorage.removeItem(`taskPanelSkipped_${today}`)
    }
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

function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export { useAuth, AuthProvider }