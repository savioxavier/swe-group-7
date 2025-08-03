import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Zap, Trophy } from 'lucide-react'
import type { UserProgressResponse } from '../../types'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  userProgress: UserProgressResponse | null
  longestPlantStreak: number
}

/**
 * Mobile-optimized overlay menu component
 * Features:
 * - Overlay design (mobile app standard)
 * - Stats displayed at top
 * - Smooth animations
 * - Touch-optimized sizing
 */
export const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  onClose,
  userProgress,
  longestPlantStreak
}) => {

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

            {/* Simple menu information */}
            <div className="p-4 sm:p-6">
              <h3 className="text-xs sm:text-sm font-medium text-green-200 mb-3 sm:mb-4 uppercase tracking-wide">
                TaskGarden
              </h3>
              
              <div className="text-sm text-green-100/80">
                Right-click any plant to access all available actions:
                <ul className="mt-2 space-y-1 text-xs text-green-100/60">
                  <li>• View plant details and analytics</li>
                  <li>• Log work hours or harvest mature plants</li>
                  <li>• Manage plants (rename/delete)</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}