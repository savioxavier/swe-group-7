import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Info, BarChart3, Zap, Trophy } from 'lucide-react'
import type { UserProgressResponse } from '../../types'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  userProgress: UserProgressResponse | null
  longestPlantStreak: number
  mode: 'plant' | 'info' | 'tasks'
  onModeChange: (mode: 'plant' | 'info' | 'tasks') => void
}

/**
 * Mobile-optimized overlay menu component
 * Features:
 * - Overlay design (mobile app standard)
 * - Stats displayed at top
 * - Mode buttons with icons
 * - Smooth animations
 * - Touch-optimized sizing
 */
export const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  onClose,
  userProgress,
  longestPlantStreak,
  mode,
  onModeChange
}) => {
  /**
   * Handle mode change and auto-close menu for better UX
   * Also provide haptic feedback on supported devices
   */
  const handleModeChange = (newMode: 'plant' | 'info' | 'tasks') => {
    // Provide haptic feedback on mobile devices
    if ('vibrate' in navigator) {
      navigator.vibrate(50) // Short vibration for feedback
    }
    
    onModeChange(newMode)
    onClose() // Auto-close for seamless interaction
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />
          
          {/* Mobile menu panel */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed top-0 left-0 h-full w-full max-w-[320px] sm:max-w-[85vw] bg-gradient-to-b from-green-900/95 to-green-800/95 backdrop-blur-md border-r border-white/20 z-50 overflow-y-auto"
          >
            {/* Header with close button */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/20">
              <h2 className="text-lg sm:text-xl font-bold text-white">Menu</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors flex-shrink-0"
                aria-label="Close menu"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Stats section at top */}
            <div className="p-4 sm:p-6 border-b border-white/10">
              <h3 className="text-xs sm:text-sm font-medium text-green-200 mb-3 sm:mb-4 uppercase tracking-wide">
                Your Progress
              </h3>
              
              <div className="space-y-2 sm:space-y-3">
                {/* Level display */}
                <div className="bg-white/10 rounded-lg p-3 sm:p-4 flex items-center space-x-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-400/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-white font-medium text-sm sm:text-base truncate">Level {userProgress?.level || 1}</div>
                    <div className="text-green-200 text-xs sm:text-sm">Current Level</div>
                  </div>
                </div>

                {/* XP display */}
                <div className="bg-white/10 rounded-lg p-3 sm:p-4 flex items-center space-x-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-400/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-400 font-bold text-xs sm:text-sm">XP</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-white font-medium text-sm sm:text-base truncate">{userProgress?.total_experience || 0}</div>
                    <div className="text-green-200 text-xs sm:text-sm">Total Experience</div>
                  </div>
                </div>

                {/* Streak display */}
                <div className="bg-white/10 rounded-lg p-3 sm:p-4 flex items-center space-x-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-400/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-white font-medium text-sm sm:text-base truncate">{longestPlantStreak} days</div>
                    <div className="text-green-200 text-xs sm:text-sm">Best Streak</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mode selection buttons */}
            <div className="p-4 sm:p-6">
              <h3 className="text-xs sm:text-sm font-medium text-green-200 mb-3 sm:mb-4 uppercase tracking-wide">
                Garden Modes
              </h3>
              
              <div className="space-y-2">
                {/* Plant mode button */}
                <button
                  onClick={() => handleModeChange('plant')}
                  className={`w-full p-3 sm:p-4 rounded-lg flex items-center space-x-3 transition-colors min-h-[48px] sm:min-h-[56px] ${
                    mode === 'plant'
                      ? 'bg-green-600 text-white'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  <Plus className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                  <div className="text-left min-w-0 flex-1">
                    <div className="font-medium text-sm sm:text-base">Plant Mode</div>
                    <div className="text-xs sm:text-sm opacity-75">Add new plants</div>
                  </div>
                </button>

                {/* Info mode button */}
                <button
                  onClick={() => handleModeChange('info')}
                  className={`w-full p-3 sm:p-4 rounded-lg flex items-center space-x-3 transition-colors min-h-[48px] sm:min-h-[56px] ${
                    mode === 'info'
                      ? 'bg-cyan-600 text-white'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  <Info className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                  <div className="text-left min-w-0 flex-1">
                    <div className="font-medium text-sm sm:text-base">Info Mode</div>
                    <div className="text-xs sm:text-sm opacity-75">View plant details</div>
                  </div>
                </button>

                {/* Tasks mode button */}
                <button
                  onClick={() => handleModeChange('tasks')}
                  className={`w-full p-3 sm:p-4 rounded-lg flex items-center space-x-3 transition-colors min-h-[48px] sm:min-h-[56px] ${
                    mode === 'tasks'
                      ? 'bg-purple-600 text-white'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                  <div className="text-left min-w-0 flex-1">
                    <div className="font-medium text-sm sm:text-base">Tasks Mode</div>
                    <div className="text-xs sm:text-sm opacity-75">Log work & complete tasks</div>
                  </div>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}