import React, { useEffect } from 'react'
import { motion } from 'framer-motion'

interface PlantGlowEffectsProps {
  plantId: string
  isGlowing: boolean
  position: { x: number, y: number }
  cellSize: number
  onAnimationComplete: () => void
}

export const PlantGlowEffects: React.FC<PlantGlowEffectsProps> = ({
  plantId,
  isGlowing,
  position,
  cellSize,
  onAnimationComplete
}) => {
  useEffect(() => {
    if (isGlowing) {
      const timer = setTimeout(() => {
        onAnimationComplete()
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [isGlowing, plantId, onAnimationComplete, position])

  if (!isGlowing || !position || typeof position.x !== 'number' || typeof position.y !== 'number') {
    return null
  }

  const canvas = document.querySelector('canvas')
  const canvasRect = canvas?.getBoundingClientRect()
  
  let leftPos, topPos
  
  if (canvasRect) {
    const canvasOffsetX = canvasRect.left
    const canvasOffsetY = canvasRect.top
    const plantCenterX = (position.x * cellSize) + (cellSize / 2)
    const plantCenterY = (position.y * cellSize) + (cellSize / 2)
    
    leftPos = canvasOffsetX + plantCenterX
    topPos = canvasOffsetY + plantCenterY
  } else {
    leftPos = position.x * cellSize + cellSize / 2
    topPos = position.y * cellSize + cellSize / 2
  }

  return (
    <div 
      className="fixed pointer-events-none z-50"
      style={{
        left: leftPos,
        top: topPos,
        transform: 'translate(-50%, -50%)'
      }}
    >
      <motion.div
        className="absolute rounded-full"
        style={{
          width: cellSize * 1.3,
          height: cellSize * 1.3,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(255, 215, 0, 0.4) 0%, rgba(255, 215, 0, 0.2) 50%, rgba(255, 215, 0, 0.1) 70%, transparent 100%)',
          boxShadow: '0 0 20px rgba(255, 215, 0, 0.6)'
        }}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
    </div>
  )
}
