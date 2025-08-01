import React from 'react'
import { Plus, Leaf, LogOut, Zap, Info, BarChart3 } from 'lucide-react'
import type { UserProgressResponse } from '../../types'

interface GardenHeaderProps {
  user: { username?: string; email?: string } | null
  userProgress: UserProgressResponse | null
  mode: 'plant' | 'info' | 'tasks'
  onModeChange: (mode: 'plant' | 'info' | 'tasks') => void
  onLogout: () => void
}

export const GardenHeader: React.FC<GardenHeaderProps> = ({
  user,
  userProgress,
  mode,
  onModeChange,
  onLogout
}) => {
  return (
    <header className="bg-black/30 backdrop-blur-sm border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between header-content">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Canvas Garden</h1>
              <p className="text-green-100 text-sm">{user?.username || user?.email}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 header-buttons">
            <div className="flex items-center space-x-1 bg-white/10 rounded-lg p-1">
              <button
                onClick={() => onModeChange('plant')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors plant-button ${
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
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors plant-button ${
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
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors plant-button ${
                  mode === 'tasks' 
                    ? 'bg-purple-600 text-white' 
                    : 'text-white hover:bg-white/20'
                }`}
              >
                <BarChart3 className="w-4 h-4 inline mr-1" />
                Tasks
              </button>
            </div>

            <div className="flex items-center space-x-2 text-white header-stats">
              <div className="bg-white/10 px-3 py-2 rounded flex items-center space-x-1">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-sm">Level {userProgress?.level || 1}</span>
              </div>
              <div className="bg-white/10 px-3 py-2 rounded">
                <span className="text-sm">{userProgress?.total_experience || 0} XP</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button 
                onClick={onLogout}
                className="p-2 text-green-100 hover:text-red-300 transition-colors bg-white/10 rounded"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
