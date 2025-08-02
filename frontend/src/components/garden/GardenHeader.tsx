import React, { useState } from 'react'
import { Plus, Leaf, LogOut, Zap, Info, BarChart3, Trophy, Loader2 } from 'lucide-react'
import type { UserProgressResponse } from '../../types'

interface GardenHeaderProps {
  user: { username?: string; email?: string } | null
  userProgress: UserProgressResponse | null
  mode: 'plant' | 'info' | 'tasks'
  onModeChange: (mode: 'plant' | 'info' | 'tasks') => void
  onLogout: () => void
  plants?: Array<{ current_streak?: number }>
}

export const GardenHeader: React.FC<GardenHeaderProps> = ({
  user,
  userProgress,
  mode,
  onModeChange,
  onLogout,
  plants = []
}) => {
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const longestPlantStreak = plants.reduce((max, plant) => {
    const streak = plant.current_streak || 0
    return Math.max(max, streak)
  }, 0)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    setTimeout(() => {
      onLogout()
    }, 200)
  }
  return (
    <header className="bg-black/30 backdrop-blur-sm border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between flex-wrap gap-4 header-content">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Canvas Garden</h1>
              <p className="text-green-100 text-sm">{user?.username || user?.email}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1 bg-white/10 rounded-lg p-1">
              <button
                onClick={() => onModeChange('plant')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  mode === 'plant' 
                    ? 'bg-green-600 text-white' 
                    : 'text-white hover:bg-white/20'
                }`}
              >
                <Plus className="w-4 h-4 inline mr-1" />
                Plant
              </button>
              <button
                onClick={() => onModeChange('info')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  mode === 'info' 
                    ? 'bg-cyan-600 text-white' 
                    : 'text-white hover:bg-white/20'
                }`}
              >
                <Info className="w-4 h-4 inline mr-1" />
                Info
              </button>
              <button
                onClick={() => onModeChange('tasks')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  mode === 'tasks' 
                    ? 'bg-purple-600 text-white' 
                    : 'text-white hover:bg-white/20'
                }`}
              >
                <BarChart3 className="w-4 h-4 inline mr-1" />
                Tasks
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <div className="bg-white/10 px-3 py-2 rounded-lg flex items-center space-x-1 w-[85px] justify-center h-[36px]">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-medium text-white">Lvl {userProgress?.level || 1}</span>
              </div>
              <div className="bg-white/10 px-3 py-2 rounded-lg w-[85px] text-center h-[36px] flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {userProgress?.total_experience || 0} XP
                </span>
              </div>
              
              <div className="bg-white/10 px-3 py-2 rounded-lg flex items-center space-x-1 border border-yellow-400/30 w-[85px] justify-center h-[36px]">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-medium text-yellow-100">
                  {longestPlantStreak}d
                </span>
              </div>
              
              <button 
                onClick={handleLogout}
                disabled={isLoggingOut}
                className={`px-3 py-2 transition-colors bg-white/10 rounded-lg flex items-center w-[50px] justify-center ${
                  isLoggingOut 
                    ? 'text-orange-300 cursor-not-allowed' 
                    : 'text-green-100 hover:text-red-300'
                }`}
              >
                {isLoggingOut ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LogOut className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
