import { useState, useCallback } from 'react'

interface GlowAnimation {
  position: { x: number, y: number }
  stage: number
}

export const usePlantGlowAnimations = () => {
  const [activeGlowAnimations, setActiveGlowAnimations] = useState<Map<string, GlowAnimation>>(new Map())

  const triggerGlowAnimation = useCallback((plantId: string, position: { x: number, y: number }, stage: number) => {
    setActiveGlowAnimations(prev => {
      const newMap = new Map(prev)
      newMap.set(plantId, { position, stage })
      return newMap
    })
  }, [])

  const onGlowAnimationComplete = useCallback((plantId: string) => {
    setActiveGlowAnimations(prev => {
      const newMap = new Map(prev)
      newMap.delete(plantId)
      return newMap
    })
  }, [])

  return {
    activeGlowAnimations,
    triggerGlowAnimation,
    onGlowAnimationComplete
  }
}