import React, { useState } from 'react'
import { Plus, Leaf, LogOut, Zap, Info, BarChart3, Trophy, Loader2, Menu } from 'lucide-react'
import type { UserProgressResponse } from '../../types'
import { MobileMenu } from './MobileMenu'

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

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
    <>
      {/* Main Header - Responsive Design */}
      <header className="bg-black/30 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            
            {/* Left Section - Logo & User Info */}
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-white truncate">Canvas Garden</h1>
                <p className="text-green-100 text-xs sm:text-sm truncate">{user?.username || user?.email}</p>
              </div>
            </div>

            {/* Desktop Mode Controls - Hidden on Mobile */}
            <div className="hidden md:flex items-center space-x-3">
              {/* Mode Buttons */}
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

              {/* Stats Display */}
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
              </div>
            </div>

            {/* Right Section - Mobile/Desktop Actions */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              
              {/* Mobile Menu Button - Only on Mobile/Tablet */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors min-h-[44px] min-w-[44px]"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5 text-white" />
              </button>

              {/* Logout Button - Always Visible */}
              <button 
                onClick={handleLogout}
                disabled={isLoggingOut}
                className={`p-2 sm:px-3 sm:py-2 transition-colors bg-white/10 rounded-lg flex items-center justify-center min-h-[44px] min-w-[44px] ${
                  isLoggingOut 
                    ? 'text-orange-300 cursor-not-allowed' 
                    : 'text-green-100 hover:text-red-300'
                }`}
                aria-label={isLoggingOut ? 'Logging out...' : 'Logout'}
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
      </header>

      {/* Mobile Menu Component */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        userProgress={userProgress}
        longestPlantStreak={longestPlantStreak}
        mode={mode}
        onModeChange={onModeChange}
      />
    </>
  )
}
