import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Star } from 'lucide-react'

interface Particle {
  id: string
  x: number
  y: number
  color: string
  size: number
  duration: number
  delay: number
}

interface PlantGrowthEffectsProps {
  plantId: string
  isGrowing: boolean
  newStage: number
  position: { x: number, y: number }
  cellSize: number
  onAnimationComplete: () => void
}

export const PlantGrowthEffects: React.FC<PlantGrowthEffectsProps> = ({
  plantId,
  isGrowing,
  newStage,
  position,
  cellSize,
  onAnimationComplete
}) => {
  const [particles, setParticles] = useState<Particle[]>([])
  const [showStageText, setShowStageText] = useState(false)

  useEffect(() => {
    if (isGrowing) {
      // Create sparkle particles
      const stage = Math.floor(Number(newStage))
      const particleCount = Math.min(12 + stage * 2, 20) // More particles for higher stages
      const newParticles: Particle[] = []

      for (let i = 0; i < particleCount; i++) {
        // Distribute particles in a circle around the plant
        const angle = (i / particleCount) * Math.PI * 2
        const radius = cellSize * 0.6 + Math.random() * cellSize * 0.4
        const x = Math.cos(angle) * radius
        const y = Math.sin(angle) * radius

        newParticles.push({
          id: `${plantId}-particle-${i}`,
          x,
          y,
          color: getParticleColor(stage),
          size: 4 + Math.random() * 6,
          duration: 1.5 + Math.random() * 1,
          delay: Math.random() * 0.5
        })
      }

      setParticles(newParticles)
      setShowStageText(true)

      // Clear particles after animation
      setTimeout(() => {
        setParticles([])
        setShowStageText(false)
        onAnimationComplete()
      }, 2500)
    }
  }, [isGrowing, plantId, newStage, cellSize, onAnimationComplete])

  const getParticleColor = (stage: number): string => {
    const colors = [
      '#fbbf24', // Yellow for early stages
      '#10b981', // Green for mid stages
      '#3b82f6', // Blue for high stages
      '#8b5cf6', // Purple for mature stages
      '#f59e0b'  // Gold for max stages
    ]
    return colors[Math.min(stage - 1, colors.length - 1)] || colors[0]
  }

  const getStageMessage = (stage: number): string => {
    const messages = [
      'Sprouting!',
      'Growing!', 
      'Flourishing!',
      'Thriving!',
      'Mastered!'
    ]
    return messages[Math.min(stage - 1, messages.length - 1)] || 'Growing!'
  }

  const getStageDescription = (stage: number): string => {
    const descriptions = [
      'Your task is just beginning to take root',
      'Making steady progress on your goal',
      'Building momentum and good habits',
      'Showing real expertise and consistency', 
      'Complete mastery achieved!'
    ]
    return descriptions[Math.min(stage - 1, descriptions.length - 1)] || 'Keep growing!'
  }

  if (!isGrowing || !position || typeof position.x !== 'number' || typeof position.y !== 'number' || typeof newStage !== 'number') return null

  return (
    <div 
      className="absolute pointer-events-none z-50"
      style={{
        left: position.x * cellSize + cellSize / 2,
        top: position.y * cellSize + cellSize / 2,
        transform: 'translate(-50%, -50%)'
      }}
    >
      {/* Stage Level Up Text */}
      <AnimatePresence>
        {showStageText && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -40 }}
            transition={{ 
              duration: 0.8,
              ease: [0.25, 0.46, 0.45, 0.94]
            }}
            className="absolute z-60 whitespace-nowrap"
            style={{
              left: '50%',
              top: '120%', // Move below the plant instead of above
              transform: 'translate(-50%, 0)'
            }}
          >
            <div className="text-center">
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-full font-bold text-lg shadow-lg border-2 border-white/30 mb-2">
                Stage {Math.floor(Number(newStage))}! {getStageMessage(Math.floor(Number(newStage)))}
              </div>
              <div className="bg-black/70 text-white px-3 py-1 rounded-lg text-xs max-w-xs backdrop-blur-sm">
                {getStageDescription(Math.floor(Number(newStage)))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Growth Pulse Effect */}
      <motion.div
        initial={{ scale: 1, opacity: 0.8 }}
        animate={{ 
          scale: [1, 1.3, 1.1], 
          opacity: [0.8, 0.4, 0] 
        }}
        transition={{ 
          duration: 1.2,
          times: [0, 0.4, 1],
          ease: "easeOut"
        }}
        className="absolute inset-0 rounded-full"
        style={{
          width: cellSize,
          height: cellSize,
          background: `radial-gradient(circle, ${getParticleColor(Math.floor(Number(newStage)))}40 0%, transparent 70%)`,
          transform: 'translate(-50%, -50%)'
        }}
      />

      {/* Sparkle Particles */}
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            initial={{ 
              x: 0, 
              y: 0, 
              scale: 0, 
              opacity: 0,
              rotate: 0
            }}
            animate={{ 
              x: particle.x, 
              y: particle.y, 
              scale: [0, 1, 0.8, 0], 
              opacity: [0, 1, 0.8, 0],
              rotate: 360
            }}
            transition={{ 
              duration: particle.duration,
              delay: particle.delay,
              ease: [0.25, 0.46, 0.45, 0.94]
            }}
            className="absolute"
            style={{
              width: particle.size,
              height: particle.size,
              left: -particle.size / 2,
              top: -particle.size / 2
            }}
          >
            {/* Sparkle Shape */}
            <div
              className="w-full h-full rounded-full"
              style={{
                background: particle.color,
                boxShadow: `0 0 ${particle.size * 2}px ${particle.color}80`
              }}
            />
            
            {/* Star Shape for Higher Stages */}
            {Math.floor(Number(newStage)) >= 3 && (
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: particle.duration, ease: "linear" }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <Star 
                  size={particle.size} 
                  className="text-white drop-shadow-lg"
                  fill="currentColor"
                />
              </motion.div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Confetti Burst for Max Stage */}
      {Math.floor(Number(newStage)) >= 5 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.5, 1] }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="absolute z-70"
          style={{
            transform: 'translate(-50%, -50%)'
          }}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={`confetti-${i}`}
              initial={{ 
                x: 0, 
                y: 0, 
                rotate: 0, 
                opacity: 1 
              }}
              animate={{ 
                x: Math.cos(i * Math.PI / 4) * (cellSize + 20),
                y: Math.sin(i * Math.PI / 4) * (cellSize + 20),
                rotate: 720,
                opacity: 0
              }}
              transition={{ 
                duration: 1.5,
                delay: 0.3 + i * 0.1,
                ease: "easeOut"
              }}
              className="absolute w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded"
            />
          ))}
        </motion.div>
      )}
    </div>
  )
}