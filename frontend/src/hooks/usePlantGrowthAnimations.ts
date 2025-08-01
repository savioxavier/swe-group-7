import { useState, useCallback, useRef } from 'react'

interface GrowthAnimation {
  plantId: string
  newStage: number
  position: { x: number, y: number }
}

export const usePlantGrowthAnimations = () => {
  const [activeGrowthAnimations, setActiveGrowthAnimations] = useState<Map<string, GrowthAnimation>>(new Map())
  const animationTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map())

  const triggerGrowthAnimation = useCallback((
    plantId: string, 
    oldStage: number, 
    newStage: number, 
    position: { x: number, y: number }
  ) => {
    // Only animate if stage actually increased
    if (newStage <= oldStage) {
      return
    }

    // Clear any existing timeout for this plant
    const existingTimeout = animationTimeouts.current.get(plantId)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
    }

    // Add growth animation
    setActiveGrowthAnimations(prev => {
      const newMap = new Map(prev)
      newMap.set(plantId, {
        plantId,
        newStage,
        position
      })
      return newMap
    })

    // Set timeout to remove animation
    const timeout = setTimeout(() => {
      setActiveGrowthAnimations(prev => {
        const newMap = new Map(prev)
        newMap.delete(plantId)
        return newMap
      })
      animationTimeouts.current.delete(plantId)
    }, 3000) // Allow 3 seconds for animation to complete

    animationTimeouts.current.set(plantId, timeout)
  }, [])

  const onGrowthAnimationComplete = useCallback((plantId: string) => {
    // Remove animation immediately when complete
    setActiveGrowthAnimations(prev => {
      const newMap = new Map(prev)
      newMap.delete(plantId)
      return newMap
    })

    // Clear timeout
    const timeout = animationTimeouts.current.get(plantId)
    if (timeout) {
      clearTimeout(timeout)
      animationTimeouts.current.delete(plantId)
    }
  }, [])

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    animationTimeouts.current.forEach(timeout => clearTimeout(timeout))
    animationTimeouts.current.clear()
    setActiveGrowthAnimations(new Map())
  }, [])

  return {
    activeGrowthAnimations,
    triggerGrowthAnimation,
    onGrowthAnimationComplete,
    cleanup
  }
}