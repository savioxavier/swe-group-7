import { useState, useCallback, useRef } from 'react'

interface UseCinematicPlantingProps {
  onPlantCreated: (position: { x: number, y: number }) => void
}

export const useCinematicPlanting = ({ onPlantCreated }: UseCinematicPlantingProps) => {
  const [isCinemaMode, setIsCinemaMode] = useState(false)
  const [focusPosition, setFocusPosition] = useState<{ x: number, y: number } | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const startCinematicPlanting = useCallback((position: { x: number, y: number }) => {
    // Clear any existing timeout
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current)
    }
    
    setFocusPosition(position)
    setIsCinemaMode(true)
    setIsAnimating(true)
  }, [])

  const onCinemaAnimationComplete = useCallback(() => {
    setIsAnimating(false)
    // Small delay to ensure modal opens smoothly
    animationTimeoutRef.current = setTimeout(() => {
      if (focusPosition) {
        onPlantCreated(focusPosition)
      }
    }, 100)
  }, [focusPosition, onPlantCreated])

  const startReturnAnimation = useCallback(() => {
    // This will trigger the return animation by setting isActive to false
    setIsCinemaMode(false)
  }, [])

  const exitCinemaMode = useCallback(() => {
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current)
    }
    setIsCinemaMode(false)
    setFocusPosition(null)
    setIsAnimating(false)
  }, [])

  return {
    isCinemaMode,
    focusPosition,
    isAnimating,
    startCinematicPlanting,
    onCinemaAnimationComplete,
    startReturnAnimation,
    exitCinemaMode
  }
}