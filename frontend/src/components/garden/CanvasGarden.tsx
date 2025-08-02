import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../lib/api'
import type { PlantCreate, UserProgressResponse } from '../../types'
import { CinematicPlotFocus } from '../animations/CinematicPlotFocus'
import { CinematicPlantCreator } from '../animations/CinematicPlantCreator'
import { PlantGrowthEffects } from '../animations/PlantGrowthEffects'
import { XPGainEffects } from '../animations/XPGainEffects'
import { useCinematicPlanting } from '../../hooks/useCinematicPlanting'
import { usePlantGrowthAnimations } from '../../hooks/usePlantGrowthAnimations'
import { useXPAnimations } from '../../hooks/useXPAnimations'
import { usePerformanceMonitoring } from '../../hooks/usePerformanceMonitoring'
import {
  GardenCanvas,
  GardenHeader,
  PlantDetailsModal,
  WorkDialog,
  TrophyDialog,
  SuccessMessage,
  TaskPanel,
  LoadingState,
  GRID_WIDTH,
  GRID_HEIGHT,
  CELL_SIZE,
  CATEGORY_PLANTS,
  convertApiPlantToLocal,
  getRandomPlantForCategory,
  isPositionPlantable
} from './'
import type { Plant } from './'

export default function CanvasGarden() {
  const { user, logout, token } = useAuth()
  
  // Performance monitoring
  const { trackOperation } = usePerformanceMonitoring()
  
  // Plant and UI state
  const [plants, setPlants] = useState<Plant[]>([])
  const [loading, setLoading] = useState(true)
  const [userProgress, setUserProgress] = useState<UserProgressResponse | null>(null)
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null)
  const [mode, setMode] = useState<'plant' | 'info' | 'tasks'>('plant')
  const [mousePos, setMousePos] = useState<{x: number, y: number} | null>(null)
  const [hoveredPlant, setHoveredPlant] = useState<Plant | null>(null)
  
  // Modal states
  const [showPlantCreator, setShowPlantCreator] = useState(false)
  const [pendingPlantPosition, setPendingPlantPosition] = useState<{x: number, y: number} | null>(null)
  const [showWorkDialog, setShowWorkDialog] = useState(false)
  const [showTrophyDialog, setShowTrophyDialog] = useState(false)
  const [showTaskPanel, setShowTaskPanel] = useState(false)
  
  // Check if any blocking modal is open to pause animations
  // Note: Task panel is not blocking, it's just a side display
  const isBlockingModalOpen = showPlantCreator || showWorkDialog || showTrophyDialog || (mode === 'info' && selectedPlant !== null)
  
  // Task panel states
  const [hasShownDailyPanel, setHasShownDailyPanel] = useState(false)
  const [shouldAutoShowTasks, setShouldAutoShowTasks] = useState(false)
  const [focusedPlantId, setFocusedPlantId] = useState<string | null>(null)
  
  // Success message states
  const [submissionMessage, setSubmissionMessage] = useState('')
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  
  // Sprite loading
  const [loadedSprites, setLoadedSprites] = useState<Map<string, HTMLImageElement>>(new Map())

  // Cinematic planting system
  const {
    isCinemaMode,
    focusPosition,
    startCinematicPlanting,
    onCinemaAnimationComplete,
    startReturnAnimation,
    exitCinemaMode
  } = useCinematicPlanting({
    onPlantCreated: (position: { x: number, y: number }) => {
      setPendingPlantPosition(position)
      setShowPlantCreator(true)
    }
  })

  // Plant growth animation system
  const {
    activeGrowthAnimations,
    triggerGrowthAnimation,
    onGrowthAnimationComplete
  } = usePlantGrowthAnimations()

  // XP animation system
  const {
    activeXPAnimations,
    triggerXPAnimation: triggerXPAnimationHook,
    onXPAnimationComplete
  } = useXPAnimations()

  // Sprite loading utilities
  const loadSprite = useCallback((spritePath: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      if (loadedSprites.has(spritePath)) {
        resolve(loadedSprites.get(spritePath)!)
        return
      }

      const img = new Image()
      img.onload = () => {
        setLoadedSprites(prev => new Map(prev).set(spritePath, img))
        resolve(img)
      }
      img.onerror = () => {
        reject(new Error(`Failed to load sprite: ${spritePath}`))
      }
      img.src = spritePath
    })
  }, [loadedSprites])

  // Canvas event handlers
  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = event.currentTarget
    const rect = canvas.getBoundingClientRect()
    
    // More precise coordinate calculation accounting for device pixel ratio and borders
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = (event.clientX - rect.left) * scaleX
    const y = (event.clientY - rect.top) * scaleY

    if (mode === 'plant') {
      setMousePos({ x, y })
    }

    if (mode === 'info' || mode === 'tasks') {
      const gridX = Math.floor(x / CELL_SIZE)
      const gridY = Math.floor(y / CELL_SIZE)
      const hoveredPlant = plants.find(p => p.x === gridX && p.y === gridY)
      setHoveredPlant(hoveredPlant || null)
    }
  }

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = event.currentTarget
    const rect = canvas.getBoundingClientRect()
    
    // More precise coordinate calculation accounting for device pixel ratio and borders
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    
    let x: number, y: number
    
    if ('touches' in event && event.touches.length > 0) {
      x = (event.touches[0].clientX - rect.left) * scaleX
      y = (event.touches[0].clientY - rect.top) * scaleY
    } else if ('clientX' in event) {
      x = (event.clientX - rect.left) * scaleX
      y = (event.clientY - rect.top) * scaleY
    } else {
      return
    }

    const gridX = Math.floor(x / CELL_SIZE)
    const gridY = Math.floor(y / CELL_SIZE)

    if (gridX >= 0 && gridX < GRID_WIDTH && gridY >= 0 && gridY < GRID_HEIGHT) {
      const clickedPlant = plants.find(p => p.x === gridX && p.y === gridY)

      if (mode === 'plant') {
        if (clickedPlant) {
          setSelectedPlant(clickedPlant)
        } else {
          setSelectedPlant(null)
          if (isPositionPlantable(gridX, gridY)) {
            startCinematicPlanting({ x: gridX, y: gridY })
          }
        }
      } else if (mode === 'info') {
        setSelectedPlant(clickedPlant || null)
      } else if (mode === 'tasks' && clickedPlant) {
        setSelectedPlant(clickedPlant)
        if (clickedPlant.stage >= 5) {
          setShowTrophyDialog(true)
        } else {
          setShowWorkDialog(true)
        }
      }
    } else if (mode === 'plant') {
      setSelectedPlant(null)
    }
  }

  // Mode change handlers
  const handleModeChange = (newMode: 'plant' | 'info' | 'tasks') => {
    setMode(newMode)
    
    if (newMode === 'plant') {
      setHoveredPlant(null)
    } else if (newMode === 'info') {
      setMousePos(null)
    } else if (newMode === 'tasks') {
      setMousePos(null)
      setHoveredPlant(null)
      setSelectedPlant(null)
      setShowWorkDialog(false)
    }
  }

  // Plant management functions
  const loadUserProgress = useCallback(async () => {
    if (!token) return
    try {
      const progress = await api.getUserProgress()
      setUserProgress(progress)
    } catch (error) {
      console.error('Failed to load user progress:', error)
    }
  }, [token])

  const loadPlants = useCallback(async () => {
    if (!token) return
    
    await trackOperation('Load Plants', async () => {
      // IMMEDIATE FEEDBACK: Show skeleton loading state right away
      setLoading(true)
      
      // Show skeleton plants immediately while loading
      const skeletonPlants: Plant[] = Array.from({ length: 6 }, (_, i) => ({
        id: `skeleton-${i}`,
        name: 'Loading...',
        task_description: 'Loading your plants...',
        type: 'work' as const,
        x: (i % 6) * 100 + 50,
        y: Math.floor(i / 6) * 100 + 150,
        stage: 0,
        experience_points: 0,
        growth_level: 0,
        lastWatered: new Date(),
        plantSprite: 'carrot',
        decay_status: 'healthy' as const,
        current_streak: 0,
        task_level: 1,
        task_status: 'active' as const,
        shouldGlow: true // Gentle glow to show they're loading
      }))
      setPlants(skeletonPlants)
      
      // Load actual plants
      const apiPlants = await api.getPlants()
      const localPlants = apiPlants.map(convertApiPlantToLocal)
      setPlants(localPlants)
      setLoading(false)
      
      // Auto-show task panel after successful load to help users get started immediately
      // This makes the app feel more guided and actionable
      setTimeout(() => {
        setShouldAutoShowTasks(true)
        setShowTaskPanel(true)
      }, 800) // Small delay to let the garden settle first
    })
  }, [token, trackOperation])

  // Plant glow management (canvas-based)
  const startPlantGlow = (plantId: string) => {
    // Set shouldGlow to true for the plant
    setPlants(prevPlants => 
      prevPlants.map(plant => 
        plant.id === plantId 
          ? { ...plant, shouldGlow: true }
          : plant
      )
    )
    
    // Remove glow after 5 seconds to match the circling dots
    setTimeout(() => {
      setPlants(prevPlants => 
        prevPlants.map(plant => 
          plant.id === plantId 
            ? { ...plant, shouldGlow: false }
            : plant
        )
      )
    }, 5000)
  }

  // Performance optimization: Use returned API data instead of refetching

  const logWork = async (plantId: string, hours: number) => {
    await trackOperation('Log Work', async () => {
      const plantBefore = plants.find(p => p.id === plantId)
      const stageBefore = plantBefore?.stage || 0
      
      // IMMEDIATE FEEDBACK: Show visual changes right away
      const xpGained = hours * 100
      
      // 1. Update plant optimistically with glow effect
      setPlants(prevPlants => 
        prevPlants.map(plant => {
          if (plant.id === plantId) {
            const newXP = plant.experience_points + xpGained
            const newStage = Math.min(5, Math.floor(newXP / 100))
            return { 
              ...plant, 
              experience_points: newXP, 
              stage: newStage,
              shouldGlow: true // Immediate visual feedback
            }
          }
          return plant
        })
      )
      
      // 2. Trigger XP animation immediately
      triggerXPAnimation(plantId, xpGained)
      
      // 3. Show success message immediately
      setSubmissionMessage(`Great work! +${xpGained} XP gained!`)
      setShowSuccessMessage(true)
      
      // 4. Close work dialog for better UX
      setShowWorkDialog(false)
      
      // 5. Background API call - use returned data instead of refetching
      try {
        const workResult = await api.logTaskWork({
          plant_id: plantId,
          hours_worked: hours
        })
        
        // 6. Use the returned data to update the plant (no second API call needed!)
        setPlants(prevPlants => 
          prevPlants.map(plant => {
            if (plant.id === plantId) {
              return {
                ...plant,
                experience_points: workResult.new_growth_level ? (workResult.new_growth_level / 20) * 100 : plant.experience_points,
                stage: workResult.new_task_level || plant.stage,
                growth_level: workResult.new_growth_level || plant.growth_level,
                current_streak: workResult.current_streak || plant.current_streak,
                shouldGlow: false // Remove optimistic glow, show real state
              }
            }
            return plant
          })
        )
        
        // 7. Check for growth and trigger animations using returned data
        const stageAfter = workResult.new_task_level || stageBefore
        
        if (stageAfter > stageBefore) {
          const plantAfter = plants.find(p => p.id === plantId)
          if (plantAfter) {
            triggerGrowthAnimation(plantId, stageBefore, stageAfter, { x: plantAfter.x, y: plantAfter.y })
            
            // Trigger canvas glow after a delay
            setTimeout(() => {
              startPlantGlow(plantId)
            }, 2800)
          }
        }
        
        // 8. Update user progress without waiting
        loadUserProgress()
        
      } catch (error) {
        console.error('Failed to log work:', error)
        // If API fails, revert optimistic update
        setPlants(prevPlants => 
          prevPlants.map(plant => 
            plant.id === plantId ? { ...plant, shouldGlow: false } : plant
          )
        )
        setSubmissionMessage('Failed to save work. Please try again.')
        setShowSuccessMessage(true)
      }
    })
  }

  const completeTask = async (plantId: string) => {
    try {
      // Optimistic update - mark as completed immediately
      setPlants(prevPlants => 
        prevPlants.map(plant => 
          plant.id === plantId 
            ? { ...plant, task_status: 'completed', shouldGlow: true }
            : plant
        )
      )
      
      // Background API call
      const result = await api.completeTask(plantId)
      
      // Update with real data and remove glow
      setPlants(prevPlants => 
        prevPlants.map(plant => 
          plant.id === plantId 
            ? { ...plant, task_status: 'completed', shouldGlow: false }
            : plant
        )
      )
      
      // Show success message
      setSubmissionMessage('Task completed! It will be auto-harvested in 6 hours.')
      setShowSuccessMessage(true)
      
    } catch (error) {
      console.error('Failed to complete task:', error)
      
      // Revert optimistic update on error
      setPlants(prevPlants => 
        prevPlants.map(plant => 
          plant.id === plantId 
            ? { ...plant, shouldGlow: false } // Revert to original state
            : plant
        )
      )
      
      // Don't show alert for already completed tasks, just log it
      if (error instanceof Error && error.message.includes('already completed')) {
        setSubmissionMessage('Task was already completed!')
        setShowSuccessMessage(true)
      } else {
        setSubmissionMessage('Failed to complete task. Please try again.')
        setShowSuccessMessage(true)
      }
    }
  }

  const createPlant = async (plantData: { name: string, description: string, category: string }) => {
    if (pendingPlantPosition) {
      try {
        const selectedSprite = getRandomPlantForCategory(plantData.category)
        const apiPlantData: PlantCreate = {
          name: plantData.name.trim(),
          productivity_category: plantData.category as 'work' | 'study' | 'exercise' | 'creative',
          plant_sprite: selectedSprite,
          position_x: pendingPlantPosition.x,
          position_y: pendingPlantPosition.y
        }
        const apiPlant = await api.createPlant(apiPlantData)
        const newPlant = convertApiPlantToLocal(apiPlant)
        setPlants([...plants, newPlant])
        
        setShowPlantCreator(false)
        startReturnAnimation()
        setPendingPlantPosition(null)
      } catch (error) {
        console.error('Failed to create plant:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        alert(`Failed to create task: ${errorMessage}`)
      }
    }
  }

  const handlePlantCreatorClose = () => {
    setShowPlantCreator(false)
    startReturnAnimation()
  }

  // Animation helpers
  const triggerXPAnimation = (plantId: string, xpGained: number, showInHeader: boolean = false) => {
    // Don't trigger animations if any blocking modal is open
    if (isBlockingModalOpen) return
    
    const plant = plants.find(p => p.id === plantId)
    if (plant) {
      const maxXP = 2000
      triggerXPAnimationHook(
        plantId,
        xpGained,
        { x: plant.x, y: plant.y },
        plant.experience_points,
        maxXP,
        showInHeader
      )
    }
  }

  // Success message handler
  const showSuccessMsg = (message: string) => {
    setSubmissionMessage(message)
    setShowSuccessMessage(true)
    setTimeout(() => {
      setShowSuccessMessage(false)
      setSubmissionMessage('')
    }, 3000)
  }

  // Daily task panel logic
  const shouldShowDailyTasks = useCallback(() => {
    if (!user) return false
    
    const today = new Date().toDateString()
    const skippedToday = localStorage.getItem(`taskPanelSkipped_${today}`)
    if (skippedToday) return false
    
    // Reset hasShownDailyPanel for new days
    const lastShownDate = localStorage.getItem('lastDailyPanelDate')
    if (lastShownDate !== today) {
      setHasShownDailyPanel(false)
      localStorage.setItem('lastDailyPanelDate', today)
    }
    
    if (hasShownDailyPanel && lastShownDate === today) return false
    
    // Check if user has any active plants
    if (plants.length === 0) return false
    
    // Show daily tasks if user hasn't worked in the last 2 hours
    // This allows the panel to show multiple times per day if there's a gap
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
    const recentWork = plants.some(plant => {
      if (!plant.lastWatered) return false
      const lastWorked = new Date(plant.lastWatered)
      return lastWorked > twoHoursAgo
    })
    
    return !recentWork
  }, [user, hasShownDailyPanel, plants])

  const skipDailyTasks = () => {
    const today = new Date().toDateString()
    localStorage.setItem(`taskPanelSkipped_${today}`, 'true')
    setShouldAutoShowTasks(false)
    setShowTaskPanel(false)
    setMode('plant')
  }

  // Effects
  useEffect(() => {
    loadPlants()
    loadUserProgress()
  }, [loadPlants, loadUserProgress])

  useEffect(() => {
    if (mode !== 'tasks') {
      setShowWorkDialog(false)
    }
  }, [mode])

  useEffect(() => {
    if (user && plants.length > 0) {
      const shouldShow = shouldShowDailyTasks()
      
      if (shouldShow) {
        setShouldAutoShowTasks(true)
        setShowTaskPanel(true)
        setMode('tasks')
        setHasShownDailyPanel(true)
        setSelectedPlant(null)
        setShowWorkDialog(false)
      }
    }
  }, [user, plants, shouldShowDailyTasks, hasShownDailyPanel])

  // Preload sprites
  useEffect(() => {
    const preloadSprites = async () => {
      const allPlants = Object.values(CATEGORY_PLANTS).flat()
      const stages = [0, 1, 2, 3, 4, 5]
      
      for (const plantSprite of allPlants) {
        for (const stage of stages) {
          try {
            // We'll implement sprite preloading later if needed
          } catch {
            console.warn(`Failed to preload sprite for ${plantSprite} stage ${stage}`)
          }
        }
      }
    }
    
    preloadSprites()
  }, [])

  useEffect(() => {
    if (focusedPlantId && mode === 'tasks') {
      const timer = setTimeout(() => {
        const taskInput = document.getElementById(`task-input-${focusedPlantId}`)
        if (taskInput) {
          taskInput.focus()
          taskInput.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 300)
      
      return () => clearTimeout(timer)
    }
  }, [focusedPlantId, mode])

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-green-800 via-green-700 to-green-600"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <GardenHeader
          user={user}
          userProgress={userProgress}
          mode={mode}
          onModeChange={handleModeChange}
          onLogout={logout}
          plants={plants}
        />
      </motion.div>

      <div className="relative h-[calc(100vh-100px)] overflow-hidden">
        <motion.div 
          className="relative z-10 h-full"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.4, ease: "easeOut" }}
        >
          <div className="flex h-full p-4 justify-center items-center">
            <CinematicPlotFocus
              isActive={isCinemaMode}
              focusPosition={focusPosition}
              cellSize={CELL_SIZE}
              gridWidth={GRID_WIDTH}
              gridHeight={GRID_HEIGHT}
              onAnimationComplete={onCinemaAnimationComplete}
              onReturnComplete={exitCinemaMode}
              onCancel={exitCinemaMode}
            >
              <GardenCanvas
                plants={plants}
                selectedPlant={selectedPlant}
                hoveredPlant={hoveredPlant}
                mode={mode}
                mousePos={mousePos}
                onCanvasClick={handleCanvasClick}
                onCanvasMouseMove={handleCanvasMouseMove}
                onLoadSprite={loadSprite}
              />
            </CinematicPlotFocus>
          </div>
        </motion.div>
      </div>

      {/* Modals and UI Components */}
      <AnimatePresence>
        {mode === 'info' && selectedPlant !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <PlantDetailsModal
              plant={selectedPlant}
              isOpen={true}
              onClose={() => setMode('plant')}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPlantCreator && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <CinematicPlantCreator
              isOpen={true}
              position={pendingPlantPosition}
              onClose={handlePlantCreatorClose}
              onCreatePlant={createPlant}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <WorkDialog
        plant={selectedPlant}
        isOpen={showWorkDialog}
        onClose={() => setShowWorkDialog(false)}
        onLogWork={logWork}
      />

      <TrophyDialog
        plant={selectedPlant}
        isOpen={showTrophyDialog}
        onClose={() => {
          setShowTrophyDialog(false)
          setSelectedPlant(null)
        }}
        onCompleteTask={completeTask}
      />

      <TaskPanel
        plants={plants}
        isOpen={showTaskPanel}
        shouldAutoShow={shouldAutoShowTasks}
        onClose={() => {
          setShouldAutoShowTasks(false)
          setShowTaskPanel(false)
          setFocusedPlantId(null)
          setMode('plant')
        }}
        onSkipDaily={skipDailyTasks}
        onLogWork={logWork}
        onCompleteTask={completeTask}
        onCreateNew={() => setMode('plant')}
        onSuccess={showSuccessMsg}
        focusedPlantId={focusedPlantId}
        onSetFocusedPlant={setFocusedPlantId}
      />

      <SuccessMessage
        message={submissionMessage}
        isVisible={showSuccessMessage}
      />

      {/* Animation Effects */}
      {Array.from(activeGrowthAnimations.entries()).map(([plantId, animation]) => (
        <PlantGrowthEffects
          key={plantId}
          plantId={plantId}
          isGrowing={true}
          newStage={animation.newStage}
          position={animation.position}
          cellSize={CELL_SIZE}
          onAnimationComplete={() => onGrowthAnimationComplete(plantId)}
        />
      ))}

      {Array.from(activeXPAnimations.entries()).map(([plantId, animation]) => (
        <XPGainEffects
          key={plantId}
          plantId={plantId}
          isAnimating={true}
          xpGained={animation.xpGained}
          position={animation.position}
          currentXP={animation.currentXP}
          maxXP={animation.maxXP}
          showInHeader={animation.showInHeader}
          cellSize={CELL_SIZE}
          onAnimationComplete={() => onXPAnimationComplete(plantId)}
        />
      ))}
      
      <LoadingState isLoading={loading} />
    </motion.div>
  )
}
