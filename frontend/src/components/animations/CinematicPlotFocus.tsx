import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSounds } from '../../lib/sounds'

interface CinematicPlotFocusProps {
  isActive: boolean
  focusPosition: { x: number, y: number } | null
  gridWidth: number
  gridHeight: number
  cellSize: number
  onAnimationComplete: () => void
  onReturnComplete?: () => void
  onCancel?: () => void
  children: React.ReactNode
}

export const CinematicPlotFocus: React.FC<CinematicPlotFocusProps> = ({
  isActive,
  focusPosition,
  gridWidth,
  gridHeight,
  cellSize,
  onAnimationComplete,
  onReturnComplete,
  onCancel,
  children
}) => {
  const [animationPhase, setAnimationPhase] = useState<'idle' | 'focusing' | 'focused' | 'returning'>('idle')
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const sounds = useSounds()
  
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    if (isActive && focusPosition && animationPhase === 'idle') {
      setAnimationPhase('focusing')
      // Play zoom-in sound when starting the focus animation
      sounds.play('ui_zoom_in')
      timeoutRef.current = setTimeout(() => {
        setAnimationPhase('focused')
        onAnimationComplete()
      }, 1000)
    } else if (!isActive && (animationPhase === 'focused' || animationPhase === 'focusing')) {
      setAnimationPhase('returning')
      // Play zoom-out sound when starting the return animation
      sounds.play('ui_zoom_out')
      timeoutRef.current = setTimeout(() => {
        setAnimationPhase('idle')
        if (onReturnComplete) {
          onReturnComplete()
        }
      }, 800)
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [isActive, focusPosition, animationPhase, onAnimationComplete, onReturnComplete, sounds])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      setAnimationPhase('idle')
    }
  }, [])

  const focusX = focusPosition ? focusPosition.x * cellSize + cellSize / 2 : 0
  const focusY = focusPosition ? focusPosition.y * cellSize + cellSize / 2 : 0
  const canvasWidth = gridWidth * cellSize
  const canvasHeight = gridHeight * cellSize

  const scale = 1.5
  const translateX = ((canvasWidth / 2) - focusX) / scale
  const translateY = ((canvasHeight / 2) - focusY) / scale

  const getAnimationValues = () => {
    switch (animationPhase) {
      case 'focusing':
      case 'focused':
        return {
          scale: scale,
          x: translateX,
          y: translateY
        }
      case 'returning':
      case 'idle':
      default:
        return {
          scale: 1,
          x: 0,
          y: 0
        }
    }
  }

  const animationValues = getAnimationValues()
  const isAnimating = animationPhase !== 'idle'

  return (
    <div className="relative overflow-hidden">
      {/* Background Dimmer with Escape Hatch */}
      <AnimatePresence>
        {isAnimating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm z-10 cursor-pointer"
            onClick={() => {
              if (onCancel && animationPhase === 'focused') {
                onCancel()
              }
            }}
            title={animationPhase === 'focused' ? 'Click to cancel' : ''}
          />
        )}
      </AnimatePresence>

      {/* Main Canvas with Cinema Transform */}
      <motion.div
        animate={animationValues}
        transition={{
          duration: 0.6,
          ease: [0.25, 0.46, 0.45, 0.94],
          onComplete: () => {
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current)
            }
            
            if (animationPhase === 'focusing') {
              setAnimationPhase('focused')
              onAnimationComplete()
            } else if (animationPhase === 'returning') {
              setAnimationPhase('idle')
              if (onReturnComplete) {
                onReturnComplete()
              }
            }
          }
        }}
        className="relative z-20"
      >
        {children}
      </motion.div>

      {/* Simplified Spotlight Effect */}
      <AnimatePresence>
        {isAnimating && focusPosition && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="absolute z-30 pointer-events-none"
            style={{
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: 120,
              height: 120,
              background: 'radial-gradient(circle, rgba(34, 197, 94, 0.4) 0%, rgba(34, 197, 94, 0.1) 70%, transparent 100%)',
              borderRadius: '50%',
              boxShadow: '0 0 60px rgba(34, 197, 94, 0.6)'
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}