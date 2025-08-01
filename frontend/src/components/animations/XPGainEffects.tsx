import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Plus } from 'lucide-react'

interface XPGainEffectsProps {
  plantId: string
  isAnimating: boolean
  xpGained: number
  position: { x: number, y: number }
  cellSize: number
  currentXP: number
  maxXP: number
  showInHeader?: boolean
  onAnimationComplete: () => void
}

export const XPGainEffects: React.FC<XPGainEffectsProps> = ({
  plantId,
  isAnimating,
  xpGained,
  position,
  cellSize,
  currentXP,
  maxXP,
  showInHeader = false,
  onAnimationComplete
}) => {
  const [showFloatingNumber, setShowFloatingNumber] = useState(false)
  const [showXPBar, setShowXPBar] = useState(false)

  useEffect(() => {
    if (isAnimating) {
      // Show floating number immediately
      setShowFloatingNumber(true)
      
      // Show XP bar slightly delayed
      setTimeout(() => {
        setShowXPBar(true)
      }, 300)

      // Complete animation after effects finish
      setTimeout(() => {
        setShowFloatingNumber(false)
        setShowXPBar(false)
        onAnimationComplete()
      }, 2000)
    }
  }, [isAnimating, onAnimationComplete, xpGained, plantId])

  if (!isAnimating) return null

  const xpPercentage = Math.min((currentXP / maxXP) * 100, 100)
  const previousXPPercentage = Math.max((currentXP - xpGained) / maxXP * 100, 0)

  // Header XP Bar Component (Centered to avoid collisions)
  if (showInHeader) {
    return (
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
        <AnimatePresence>
          {showXPBar && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              transition={{ 
                duration: 0.4,
                ease: "easeOut"
              }}
              className="bg-black/60 backdrop-blur-sm rounded-lg p-3 border border-green-400/20 w-48"
            >
              {/* Compact XP Gained */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-1">
                  <Plus size={12} className="text-blue-400" />
                  <span className="text-white font-medium text-sm">{xpGained} XP</span>
                </div>
                <Zap size={12} className="text-yellow-400" />
              </div>

              {/* Compact Progress Bar */}
              <div className="relative">
                <div className="bg-gray-700/50 rounded-full h-2 overflow-hidden">
                  {/* Previous XP Level */}
                  <div 
                    className="bg-gray-500/50 h-full transition-all duration-300"
                    style={{ width: `${previousXPPercentage}%` }}
                  />
                  
                  {/* Animated XP Gain */}
                  <motion.div
                    initial={{ width: `${previousXPPercentage}%` }}
                    animate={{ width: `${xpPercentage}%` }}
                    transition={{ 
                      duration: 1.2,
                      delay: 0.2,
                      ease: [0.25, 0.46, 0.45, 0.94]
                    }}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-full absolute top-0 left-0"
                    style={{
                      boxShadow: '0 0 8px rgba(99, 102, 241, 0.4)'
                    }}
                  />
                  
                  {/* Subtle Shine Effect */}
                  <motion.div
                    initial={{ x: '-100%', opacity: 0 }}
                    animate={{ x: '200%', opacity: [0, 0.6, 0] }}
                    transition={{ 
                      duration: 1,
                      delay: 0.4,
                      ease: "easeInOut"
                    }}
                    className="absolute top-0 left-0 h-full w-1/4"
                    style={{ 
                      background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)'
                    }}
                  />
                </div>
                
                {/* Small XP Text */}
                <div className="text-right mt-1">
                  <span className="text-xs text-gray-300">
                    {currentXP} / {maxXP}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // Plant Position XP Effects (Original)
  return (
    <div 
      className="absolute pointer-events-none z-40"
      style={{
        left: position.x * cellSize + cellSize / 2,
        top: position.y * cellSize + cellSize / 2,
        transform: 'translate(-50%, -50%)'
      }}
    >
      {/* Floating XP Number */}
      <AnimatePresence>
        {showFloatingNumber && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 0 }}
            animate={{ 
              opacity: [0, 1, 1, 0],
              scale: [0.5, 1.2, 1, 0.8],
              y: [0, -30, -50, -70]
            }}
            transition={{ 
              duration: 1.5,
              times: [0, 0.3, 0.7, 1],
              ease: [0.25, 0.46, 0.45, 0.94]
            }}
            className="absolute z-50"
            style={{
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          >
            <div className="flex items-center space-x-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 rounded-full font-bold text-sm shadow-lg border-2 border-white/30">
              <Plus size={12} />
              <span>{xpGained}</span>
              <Zap size={12} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* XP Progress Bar */}
      <AnimatePresence>
        {showXPBar && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 10 }}
            exit={{ opacity: 0, scale: 0.8, y: 30 }}
            transition={{ 
              duration: 0.5,
              ease: "easeOut"
            }}
            className="absolute z-45"
            style={{
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: cellSize + 20,
              marginTop: cellSize / 2 + 10
            }}
          >
            {/* XP Bar Background */}
            <div className="bg-gray-800/80 rounded-full h-3 border border-gray-600/50 backdrop-blur-sm overflow-hidden">
              {/* Previous XP Level */}
              <div 
                className="bg-gray-600 h-full transition-all duration-300"
                style={{ width: `${previousXPPercentage}%` }}
              />
              
              {/* Animated XP Gain */}
              <motion.div
                initial={{ width: `${previousXPPercentage}%` }}
                animate={{ width: `${xpPercentage}%` }}
                transition={{ 
                  duration: 1.2,
                  delay: 0.3,
                  ease: [0.25, 0.46, 0.45, 0.94]
                }}
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-full absolute top-0 left-0"
                style={{
                  boxShadow: '0 0 10px rgba(99, 102, 241, 0.5)'
                }}
              />
              
              {/* Shine Effect */}
              <motion.div
                initial={{ x: '-100%', opacity: 0 }}
                animate={{ x: '200%', opacity: [0, 1, 0] }}
                transition={{ 
                  duration: 1,
                  delay: 0.5,
                  ease: "easeInOut"
                }}
                className="absolute top-0 left-0 h-full w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                style={{ 
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)'
                }}
              />
            </div>
            
            {/* XP Text */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.3 }}
              className="text-center mt-1"
            >
              <span className="text-xs font-medium text-white bg-black/50 px-2 py-0.5 rounded backdrop-blur-sm">
                {currentXP} / {maxXP} XP
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Radial Pulse Effect */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0.8 }}
        animate={{ 
          scale: [0.8, 1.4, 1.2], 
          opacity: [0.8, 0.3, 0] 
        }}
        transition={{ 
          duration: 1.5,
          times: [0, 0.6, 1],
          ease: "easeOut"
        }}
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          width: cellSize * 1.2,
          height: cellSize * 1.2,
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%)',
          transform: 'translate(-50%, -50%)'
        }}
      />

      {/* Energy Particles */}
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.div
          key={`energy-${i}`}
          initial={{ 
            x: 0, 
            y: 0, 
            scale: 0, 
            opacity: 0 
          }}
          animate={{ 
            x: Math.cos(i * Math.PI / 3) * (cellSize * 0.8),
            y: Math.sin(i * Math.PI / 3) * (cellSize * 0.8),
            scale: [0, 1, 0.8, 0],
            opacity: [0, 1, 0.7, 0]
          }}
          transition={{ 
            duration: 1.2,
            delay: 0.2 + i * 0.1,
            ease: [0.25, 0.46, 0.45, 0.94]
          }}
          className="absolute w-2 h-2 bg-blue-400 rounded-full"
          style={{
            boxShadow: '0 0 6px rgba(96, 165, 250, 0.8)'
          }}
        />
      ))}
    </div>
  )
}