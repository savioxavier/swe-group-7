import { useState, useCallback, useRef } from 'react'

interface XPAnimation {
  plantId: string
  xpGained: number
  position: { x: number, y: number }
  currentXP: number
  maxXP: number
  showInHeader: boolean
}

export const useXPAnimations = () => {
  const [activeXPAnimations, setActiveXPAnimations] = useState<Map<string, XPAnimation>>(new Map())
  const animationTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map())

  const triggerXPAnimation = useCallback((
    plantId: string,
    xpGained: number,
    position: { x: number, y: number },
    currentXP: number,
    maxXP: number = 2000, // Default max XP per level
    showInHeader: boolean = false
  ) => {
    // Clear any existing timeout for this plant
    const existingTimeout = animationTimeouts.current.get(plantId)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
    }

    // Add XP animation
    setActiveXPAnimations(prev => {
      const newMap = new Map(prev)
      newMap.set(plantId, {
        plantId,
        xpGained,
        position,
        currentXP,
        maxXP,
        showInHeader
      })
      return newMap
    })

    // Set timeout to remove animation
    const timeout = setTimeout(() => {
      setActiveXPAnimations(prev => {
        const newMap = new Map(prev)
        newMap.delete(plantId)
        return newMap
      })
      animationTimeouts.current.delete(plantId)
    }, 2500) // Allow 2.5 seconds for animation to complete

    animationTimeouts.current.set(plantId, timeout)
  }, [])

  const onXPAnimationComplete = useCallback((plantId: string) => {
    // Remove animation immediately when complete
    setActiveXPAnimations(prev => {
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
    setActiveXPAnimations(new Map())
  }, [])

  return {
    activeXPAnimations,
    triggerXPAnimation,
    onXPAnimationComplete,
    cleanup
  }
}