import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Info, BarChart3, X } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../lib/api'
import { useSounds } from '../../lib/sounds'
import type { PlantCreate, UserProgressResponse, TaskStep } from '../../types'
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
  PlantManagementModal,
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
  const { user, logout, token, isNewLogin } = useAuth()
  
  // Performance monitoring
  const { trackOperation } = usePerformanceMonitoring()
  
  // Sound effects
  const sounds = useSounds()
  
  // Plant and UI state
  const [plants, setPlants] = useState<Plant[]>([])
  const [loading, setLoading] = useState(true)
  const [userProgress, setUserProgress] = useState<UserProgressResponse | null>(null)
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null)
  const [mousePos, setMousePos] = useState<{x: number, y: number} | null>(null)
  const [hoveredPlant, setHoveredPlant] = useState<Plant | null>(null)
  
  // Modal states
  const [showPlantCreator, setShowPlantCreator] = useState(false)
  const [pendingPlantPosition, setPendingPlantPosition] = useState<{x: number, y: number} | null>(null)
  const [showWorkDialog, setShowWorkDialog] = useState(false)
  const [showTrophyDialog, setShowTrophyDialog] = useState(false)
  const [showTaskPanel, setShowTaskPanel] = useState(false)
  const [showAudioSettings, setShowAudioSettings] = useState(false)
  
  // Task panel states
  const [shouldAutoShowTasks, setShouldAutoShowTasks] = useState(false)
  const [focusedPlantId, setFocusedPlantId] = useState<string | null>(null)
  const [taskPanelClosedThisSession, setTaskPanelClosedThisSession] = useState(false)
  
  // Success message states
  const [submissionMessage, setSubmissionMessage] = useState('')
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  
  // Sprite loading
  const [loadedSprites, setLoadedSprites] = useState<Map<string, HTMLImageElement>>(new Map())
  const [plantContextMenu, setPlantContextMenu] = useState<{plant: Plant, x: number, y: number} | null>(null)
  const [showPlantDetails, setShowPlantDetails] = useState(false)
  const [showPlantManagement, setShowPlantManagement] = useState(false)

  const isBlockingModalOpen = showPlantCreator || showWorkDialog || showTrophyDialog

  // Helper function to close all modals except the specified one
  const closeAllModalsExcept = (keepOpen: string[] = []) => {
    if (!keepOpen.includes('taskPanel')) setShowTaskPanel(false)
    if (!keepOpen.includes('audioSettings')) setShowAudioSettings(false)
    if (!keepOpen.includes('plantDetails')) setShowPlantDetails(false)
    if (!keepOpen.includes('plantManagement')) setShowPlantManagement(false)
    if (!keepOpen.includes('plantContextMenu')) setPlantContextMenu(null)
  }

  // Audio settings toggle function
  const toggleAudioSettings = () => {
    if (showAudioSettings) {
      setShowAudioSettings(false)
    } else {
      closeAllModalsExcept(['audioSettings'])
      setShowAudioSettings(true)
    }
  }

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

  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = event.currentTarget
    const rect = canvas.getBoundingClientRect()
    
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = (event.clientX - rect.left) * scaleX
    const y = (event.clientY - rect.top) * scaleY

    // Always show mouse position for visual feedback
    setMousePos({ x, y })

    // Check for hovered plants
    const gridX = Math.floor(x / CELL_SIZE)
    const gridY = Math.floor(y / CELL_SIZE)
    const hoveredPlant = plants.find(p => p.x === gridX && p.y === gridY)
    setHoveredPlant(hoveredPlant || null)
  }

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = event.currentTarget
    const rect = canvas.getBoundingClientRect()
    
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

      if (clickedPlant) {
        // Plant exists - show context menu with all available actions
        sounds.playPlant('click')
        
        setSelectedPlant(clickedPlant)
        closeAllModalsExcept(['plantContextMenu']) // Close all modals except context menu
        
        setPlants(prevPlants => 
          prevPlants.map(plant => 
            plant.id === clickedPlant.id 
              ? { ...plant, shouldGlow: true }
              : plant
          )
        )
        
        setTimeout(() => {
          setPlants(prevPlants => 
            prevPlants.map(plant => 
              plant.id === clickedPlant.id 
                ? { ...plant, shouldGlow: false }
                : plant
            )
          )
        }, 600)

        // Show context menu with all options
        setPlantContextMenu({
          plant: clickedPlant,
          x: gridX * CELL_SIZE + CELL_SIZE / 2,
          y: gridY * CELL_SIZE + CELL_SIZE / 2
        })
      } else {
        // Empty space - planting
        setSelectedPlant(null)
        closeAllModalsExcept() // Close all modals when clicking on empty space
        if (isPositionPlantable(gridX, gridY)) {
          sounds.playUI('click')
          showSuccessMsg('Perfect spot for a new plant!')
          startCinematicPlanting({ x: gridX, y: gridY })
        }
      }
    } else {
      setSelectedPlant(null)
      closeAllModalsExcept() // Close all modals when clicking outside grid
    }
  }

  // Plant management functions
  const deletePlant = async (plantId: string) => {
    try {
      await api.deletePlant(plantId)
      setPlants(prevPlants => prevPlants.filter(p => p.id !== plantId))
      showSuccessMsg('🗑️ Plant deleted successfully')
    } catch (error) {
      console.error('Failed to delete plant:', error)
      showSuccessMsg('❌ Failed to delete plant')
    }
  }

  const renamePlant = async (plantId: string, newName: string) => {
    try {
      setPlants(prevPlants => 
        prevPlants.map(p => 
          p.id === plantId 
            ? { ...p, name: newName }
            : p
        )
      )
      showSuccessMsg(`✏️ Plant renamed to "${newName}" (local only)`)
    } catch (error) {
      console.error('Failed to rename plant:', error)
      showSuccessMsg('❌ Failed to rename plant')
    }
  }

  // Plant context menu actions
  const handlePlantAction = (action: 'info' | 'tasks' | 'manage' | 'harvest', plant: Plant) => {
    setPlantContextMenu(null)
    setFocusedPlantId(plant.id)
    
    switch (action) {
      case 'info': {
        // Show detailed plant info modal (PlantDetailsModal)
        setSelectedPlant(plant)
        closeAllModalsExcept(['plantDetails'])
        setShowPlantDetails(true)
        setPlantContextMenu(null) // Close context menu
        showSuccessMsg(`📊 Viewing ${plant.name} analytics and details`)
        break
      }
        
      case 'tasks':
        // Dynamic: Log work hours OR harvest if mature
        setPlantContextMenu(null) // Close context menu
        if (plant.stage >= 5) {
          // Plant is ready to harvest
          setShowTrophyDialog(true)
          showSuccessMsg(`🏆 Harvesting ${plant.name}!`)
        } else {
          // Plant needs more work - show work dialog
          setShowWorkDialog(true)
          showSuccessMsg(`⏰ How many hours did you work on ${plant.name}?`)
        }
        break
        
      case 'manage':
        // Plant management - show management modal
        setSelectedPlant(plant)
        closeAllModalsExcept(['plantManagement'])
        setShowPlantManagement(true)
        setPlantContextMenu(null) // Close context menu
        showSuccessMsg(`Managing ${plant.name}`)
        break
        
      case 'harvest':
        // Force harvest (for mature plants)
        setShowTrophyDialog(true)
        showSuccessMsg(`🏆 Harvesting ${plant.name}!`)
        break
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
      setLoading(true)
      
      const skeletonPlants: Plant[] = Array.from({ length: 6 }, (_, i) => ({
        id: `skeleton-${i}`,
        name: 'Loading...',
        task_description: 'Loading your plants...',
        type: 'work' as const,
        x: i % GRID_WIDTH,
        y: Math.floor(i / GRID_WIDTH) + 1,
        stage: 0,
        experience_points: 0,
        growth_level: 0,
        lastWatered: new Date(),
        plantSprite: 'carrot',
        decay_status: 'healthy' as const,
        current_streak: 0,
        task_level: 1,
        task_status: 'active' as const,
        shouldGlow: true
      }))
      setPlants(skeletonPlants)
      
      const apiPlants = await api.getPlants()
      const localPlants = apiPlants.map(convertApiPlantToLocal)
      setPlants(localPlants)
      setLoading(false)
      
      // Remove automatic task panel opening - only show on actual login
    })
  }, [token, trackOperation])

  const startPlantGlow = (plantId: string) => {
    setPlants(prevPlants => 
      prevPlants.map(plant => 
        plant.id === plantId 
          ? { ...plant, shouldGlow: true }
          : plant
      )
    )
    
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
      
      // Play water/work sound immediately
      sounds.playPlant('water')
      
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
      
      // 2. Trigger XP animation immediately with sound
      triggerXPAnimation(plantId, xpGained)
      sounds.playXPGainSequence(xpGained)
      
      // 3. Show success message immediately
      setSubmissionMessage(`Great work! +${xpGained} XP gained!`)
      setShowSuccessMessage(true)
      
      // 4. Background API call - use returned data instead of refetching
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
            
            // Play growth sound sequence based on stage
            sounds.playGrowthSequence(stageAfter)
            
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
      // Play task completion sound immediately
      sounds.playAchievement('task_complete')
      
      // Optimistic update - mark as completed immediately
      setPlants(prevPlants => 
        prevPlants.map(plant => 
          plant.id === plantId 
            ? { ...plant, task_status: 'completed', shouldGlow: true }
            : plant
        )
      )
      
      // Background API call
      await api.completeTask(plantId)
      
      // Update with real data and remove glow
      setPlants(prevPlants => 
        prevPlants.map(plant => 
          plant.id === plantId 
            ? { ...plant, task_status: 'completed', shouldGlow: false }
            : plant
        )
      )
      
      // Show success message with additional sound
      setSubmissionMessage('Task completed! It will be auto-harvested in 6 hours.')
      setShowSuccessMessage(true)
      sounds.playUI('success')
      
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

  const completeTaskStep = async (plantId: string, stepId: string, hours?: number) => {
    await trackOperation('Complete Step', async () => {
      const plantBefore = plants.find(p => p.id === plantId)
      const stageBefore = plantBefore?.stage || 0
      
      // Play milestone completion sound
      sounds.playAchievement('achievement')
      
      // Optimistic update - mark step as completed
      setPlants(prevPlants => 
        prevPlants.map(plant => {
          if (plant.id === plantId && plant.task_steps) {
            const updatedSteps = plant.task_steps.map(step => 
              step.id === stepId 
                ? { ...step, is_completed: true, completed_at: new Date().toISOString() }
                : step
            )
            const completedSteps = updatedSteps.filter(s => s.is_completed).length
            const newStage = Math.min(5, completedSteps) // Milestone-based growth
            
            return { 
              ...plant, 
              task_steps: updatedSteps,
              completed_steps: completedSteps,
              stage: newStage,
              shouldGlow: true
            }
          }
          return plant
        })
      )
      
      try {
        // API call for step completion
        const stepResult = await api.completeTaskStep({
          plant_id: plantId,
          step_id: stepId,
          hours_worked: hours
        })
        
        // Update with API response
        setPlants(prevPlants => 
          prevPlants.map(plant => {
            if (plant.id === plantId) {
              return {
                ...plant,
                stage: stepResult.new_growth_stage,
                experience_points: plant.experience_points + stepResult.experience_gained,
                shouldGlow: false
              }
            }
            return plant
          })
        )
        
        // Trigger XP animation
        triggerXPAnimation(plantId, stepResult.experience_gained)
        sounds.playXPGainSequence(stepResult.experience_gained)
        
        // Check for growth animation
        const stageAfter = stepResult.new_growth_stage
        if (stageAfter > stageBefore) {
          const plantAfter = plants.find(p => p.id === plantId)
          if (plantAfter) {
            triggerGrowthAnimation(plantId, stageBefore, stageAfter, { x: plantAfter.x, y: plantAfter.y })
            sounds.playGrowthSequence(stageAfter)
            setTimeout(() => startPlantGlow(plantId), 2800)
          }
        }
        
        // Show completion message
        if (stepResult.task_completed) {
          setSubmissionMessage('🎉 All steps completed! Task finished!')
          sounds.playAchievement('task_complete')
        } else {
          setSubmissionMessage(`Step completed! ${stepResult.completed_steps}/${stepResult.total_steps} done`)
        }
        setShowSuccessMessage(true)
        
        loadUserProgress()
        
      } catch (error) {
        console.error('Failed to complete step:', error)
        // Revert optimistic update
        setPlants(prevPlants => 
          prevPlants.map(plant => 
            plant.id === plantId ? { ...plant, shouldGlow: false } : plant
          )
        )
        setSubmissionMessage('Failed to complete step. Please try again.')
        setShowSuccessMessage(true)
      }
    })
  }

  const updateTaskStepPartial = async (plantId: string, stepId: string, hours: number) => {
    await trackOperation('Partial Step Work', async () => {
      // Play work sound
      sounds.playPlant('water')
      
      // Optimistic update - mark step as partial and add hours
      setPlants(prevPlants => 
        prevPlants.map(plant => {
          if (plant.id === plantId && plant.task_steps) {
            const updatedSteps = plant.task_steps.map(step => 
              step.id === stepId 
                ? { 
                    ...step, 
                    is_partial: true, 
                    work_hours: (step.work_hours || 0) + hours 
                  }
                : step
            )
            
            return { 
              ...plant, 
              task_steps: updatedSteps,
              shouldGlow: true
            }
          }
          return plant
        })
      )
      
      try {
        // API call for partial work
        const partialResult = await api.updateTaskStepPartial({
          plant_id: plantId,
          step_id: stepId,
          hours_worked: hours,
          mark_partial: true
        })
        
        // Update with API response
        setPlants(prevPlants => 
          prevPlants.map(plant => {
            if (plant.id === plantId) {
              return {
                ...plant,
                experience_points: plant.experience_points + partialResult.experience_gained,
                growth_level: partialResult.new_growth_level,
                shouldGlow: false
              }
            }
            return plant
          })
        )
        
        // Trigger XP animation (smaller for partial work)
        triggerXPAnimation(plantId, partialResult.experience_gained)
        sounds.playXPGainSequence(partialResult.experience_gained)
        
        // Show progress message
        setSubmissionMessage(`Progress added! +${partialResult.experience_gained} XP, ${hours}h logged`)
        setShowSuccessMessage(true)
        
        loadUserProgress()
        
      } catch (error) {
        console.error('Failed to log partial work:', error)
        // Revert optimistic update
        setPlants(prevPlants => 
          prevPlants.map(plant => 
            plant.id === plantId ? { ...plant, shouldGlow: false } : plant
          )
        )
        setSubmissionMessage('Failed to log progress. Please try again.')
        setShowSuccessMessage(true)
      }
    })
  }

  const convertToMultiStep = async (plantId: string, steps: Array<{title: string, description?: string}>) => {
    await trackOperation('Convert to Multi-Step', async () => {
      try {
        // Optimistic update
        setPlants(prevPlants => 
          prevPlants.map(plant => 
            plant.id === plantId 
              ? { 
                  ...plant, 
                  is_multi_step: true,
                  task_steps: steps.map((step, index) => ({
                    id: `temp-${index}`,
                    title: step.title,
                    description: step.description || '',
                    is_completed: false,
                    is_partial: false,
                    work_hours: 0
                  })),
                  total_steps: steps.length,
                  completed_steps: 0,
                  shouldGlow: true
                }
              : plant
          )
        )

        // API call
        const result = await api.convertToMultiStep({
          plant_id: plantId,
          task_steps: steps
        })

        // Show success message
        setSubmissionMessage(`Task converted! Now has ${result.total_steps} steps to complete.`)
        setShowSuccessMessage(true)
        sounds.playUI('success')

        // Remove glow and refresh data
        setTimeout(() => {
          setPlants(prevPlants => 
            prevPlants.map(plant => 
              plant.id === plantId ? { ...plant, shouldGlow: false } : plant
            )
          )
          loadPlants() // Refresh with server data
        }, 1000)

      } catch (error) {
        console.error('Failed to convert to multi-step:', error)
        
        // Revert optimistic update
        setPlants(prevPlants => 
          prevPlants.map(plant => 
            plant.id === plantId ? { ...plant, shouldGlow: false } : plant
          )
        )
        
        setSubmissionMessage('Failed to convert task. Please try again.')
        setShowSuccessMessage(true)
      }
    })
  }

  const createPlant = async (plantData: { 
    name: string, 
    description: string, 
    category: string,
    isMultiStep: boolean,
    taskSteps: TaskStep[]
  }) => {
    if (pendingPlantPosition) {
      try {
        const selectedSprite = getRandomPlantForCategory(plantData.category)
        const apiPlantData: PlantCreate = {
          name: plantData.name.trim(),
          task_description: plantData.description.trim() || undefined,
          productivity_category: plantData.category as 'work' | 'study' | 'exercise' | 'creative',
          plant_sprite: selectedSprite,
          position_x: pendingPlantPosition.x,
          position_y: pendingPlantPosition.y,
          is_multi_step: plantData.isMultiStep,
          task_steps: plantData.isMultiStep ? plantData.taskSteps : undefined
        }
        
        const apiPlant = await api.createPlant(apiPlantData)
        const newPlant = convertApiPlantToLocal(apiPlant)
        setPlants([...plants, newPlant])
        
        // Play plant creation sound
        sounds.playPlant('create')
        
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

  // Daily task panel logic - only show once per login session
  const shouldShowDailyTasks = useCallback(() => {
    if (!user) return false
    
    // Don't show if user manually closed it this session
    if (taskPanelClosedThisSession) return false
    
    const today = new Date().toDateString()
    
    // Check if panel was already shown today
    const shownToday = localStorage.getItem(`taskPanelShown_${today}`)
    if (shownToday) return false
    
    // Check if user has any active plants
    if (plants.length === 0) return false
    
    // Simply show once per day on login - no time-based conditions
    return true
  }, [user, plants, taskPanelClosedThisSession])


  // Effects
  useEffect(() => {
    loadPlants()
    loadUserProgress()
  }, [loadPlants, loadUserProgress])

  // Background music initialization
  useEffect(() => {
    const bgMusicSetting = localStorage.getItem('taskgarden_background_music')
    const backgroundMusicEnabled = bgMusicSetting === null ? true : bgMusicSetting === 'true' // Default to true
    const soundEnabled = localStorage.getItem('taskgarden_sound_enabled') !== 'false'
    
    if (backgroundMusicEnabled && soundEnabled) {
      // Small delay to ensure audio context is ready after user interaction
      const timer = setTimeout(() => {
        sounds.startBackgroundMusic()
      }, 2000)
      
      return () => clearTimeout(timer)
    }
  }, [sounds])

  useEffect(() => {
    // Only show task panel on actual login, not on refresh/reload
    if (user && plants.length > 0 && isNewLogin) {
      const shouldShow = shouldShowDailyTasks()
      
      if (shouldShow) {
        setShouldAutoShowTasks(true)
        setShowTaskPanel(true)
        setSelectedPlant(null)
        
        // Mark as shown in localStorage to prevent showing again today
        const today = new Date().toDateString()
        localStorage.setItem(`taskPanelShown_${today}`, 'true')
      }
    }
  }, [user, plants, isNewLogin, shouldShowDailyTasks])

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
    if (focusedPlantId) {
      // Enhanced auto-focus with better timing and visual feedback
      const timer = setTimeout(() => {
        const taskInput = document.getElementById(`task-input-${focusedPlantId}`)
        if (taskInput) {
          // Smooth focus with visual highlight
          taskInput.focus()
          taskInput.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          })
          
          // Add a subtle pulse effect to draw attention
          taskInput.style.animation = 'pulse 0.5s ease-in-out'
          
          // Clean up animation after it completes
          setTimeout(() => {
            if (taskInput) {
              taskInput.style.animation = ''
            }
          }, 500)
        }
      }, 200) // Reduced delay for snappier feel
      
      return () => clearTimeout(timer)
    }
  }, [focusedPlantId])

  // Close context menu on escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setPlantContextMenu(null)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-green-800 via-green-700 to-green-600 flex flex-col relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="relative z-20"
      >
        <GardenHeader
          user={user}
          userProgress={userProgress}
          onLogout={logout}
          plants={plants}
          showAudioSettings={showAudioSettings}
          onToggleAudioSettings={toggleAudioSettings}
          sounds={sounds}
        />
      </motion.div>

      <div className="relative flex-1 min-h-0 overflow-hidden">
        <motion.div 
          className="relative z-10 h-full"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.4, ease: "easeOut" }}
        >
          <div className="flex h-full p-2 sm:p-4 justify-center items-center">
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
        {(showPlantDetails && selectedPlant) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <PlantDetailsModal
              plant={selectedPlant}
              isOpen={true}
              onClose={() => {
                setShowPlantDetails(false)
                setSelectedPlant(null)
              }}
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
        onCompleteStep={completeTaskStep}
        onPartialStep={updateTaskStepPartial}
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

      <PlantManagementModal
        plant={selectedPlant}
        isOpen={showPlantManagement}
        onClose={() => {
          setShowPlantManagement(false)
          setSelectedPlant(null)
        }}
        onDeletePlant={deletePlant}
        onRenamePlant={renamePlant}
        onConvertToMultiStep={convertToMultiStep}
      />

      <TaskPanel
        plants={plants}
        isOpen={showTaskPanel}
        shouldAutoShow={shouldAutoShowTasks}
        onClose={() => {
          // Play modal close sound
          sounds.playUI('modal_close')
          
          setShouldAutoShowTasks(false)
          setShowTaskPanel(false)
          setFocusedPlantId(null)
          
          // Mark that user manually closed the panel this session
          setTaskPanelClosedThisSession(true)
        }}
        onLogWork={logWork}
        onCompleteTask={completeTask}
        onCreateNew={() => {}}
        onSuccess={showSuccessMsg}
        focusedPlantId={focusedPlantId}
        onSetFocusedPlant={setFocusedPlantId}
      />

      {/* Plant Context Menu */}
      <AnimatePresence>
        {plantContextMenu && (
          <motion.div
            className="absolute z-50 bg-black/90 backdrop-blur-sm rounded-xl border border-white/20 p-2 min-w-48"
            style={{
              left: plantContextMenu.x,
              top: plantContextMenu.y,
              transform: 'translate(-50%, -50%)'
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="text-white text-sm font-medium">
                {plantContextMenu.plant.name}
              </div>
              <button
                onClick={() => setPlantContextMenu(null)}
                className="text-white/60 hover:text-white transition-colors p-1"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-1">
              {/* View Info Action */}
              <button
                onClick={() => handlePlantAction('info', plantContextMenu.plant)}
                className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center space-x-2 hover:bg-white/10 text-white"
              >
                <Info className="w-4 h-4" />
                <span>View Details & Analytics</span>
              </button>

              {/* Log Work/Harvest Action - Dynamic based on plant stage */}
              <button
                onClick={() => handlePlantAction('tasks', plantContextMenu.plant)}
                className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center space-x-2 hover:bg-white/10 text-white"
              >
                <BarChart3 className="w-4 h-4" />
                <span>
                  {plantContextMenu.plant.stage >= 5 ? 'Harvest Plant' : 'Log Work Hours'}
                </span>
              </button>

              {/* Plant Management Action */}
              <button
                onClick={() => handlePlantAction('manage', plantContextMenu.plant)}
                className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center space-x-2 hover:bg-white/10 text-white"
              >
                <Plus className="w-4 h-4" />
                <span>Plant Management</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
