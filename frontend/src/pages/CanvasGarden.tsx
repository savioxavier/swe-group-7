import React, { useRef, useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Leaf, LogOut, Zap, Info, BarChart3, Trophy } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'
import { PlantCreate, PlantResponse, UserProgressResponse } from '../types'
import { CinematicPlotFocus } from '../components/animations/CinematicPlotFocus'
import { CinematicPlantCreator } from '../components/animations/CinematicPlantCreator'
import { PlantGrowthEffects } from '../components/animations/PlantGrowthEffects'
import { XPGainEffects } from '../components/animations/XPGainEffects'
import { useCinematicPlanting } from '../hooks/useCinematicPlanting'
import { usePlantGrowthAnimations } from '../hooks/usePlantGrowthAnimations'
import { useXPAnimations } from '../hooks/useXPAnimations'

interface Plant {
  id: string
  name: string
  task_description?: string
  type: 'work' | 'study' | 'exercise' | 'creative'
  x: number
  y: number
  stage: number
  experience_points: number
  growth_level: number
  lastWatered: Date
  plantSprite?: string
  decay_status?: 'healthy' | 'slightly_wilted' | 'wilted' | 'severely_wilted' | 'dead'
  current_streak?: number
  task_level?: number
  task_status?: 'active' | 'completed' | 'harvested'
  completion_date?: Date
  animationStage?: number
}

const GRID_WIDTH = 6
const GRID_HEIGHT = 5
const CELL_SIZE = 100 // Reduced from 120 to make garden smaller

const PLANTABLE_POSITIONS = [
  { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 },
  { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }, { x: 4, y: 1 },
  { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 3, y: 2 }, { x: 4, y: 2 },
  { x: 0, y: 3 }, { x: 1, y: 3 }, { x: 2, y: 3 }, { x: 3, y: 3 }, { x: 4, y: 3 },
  { x: 1, y: 4 }, { x: 2, y: 4 }, { x: 3, y: 4 }
]


const CATEGORY_PLANTS: Record<string, string[]> = {
  work: ['corn', 'wheat', 'potato', 'onion'],
  study: ['cabbage', 'spinach', 'salad', 'peas'],
  exercise: ['carrot', 'beet', 'radish', 'cucumber'],
  creative: ['tomat', 'eggplant', 'pepper', 'pumpkin', 'watermelon']
}

const PRODUCTIVITY_CATEGORIES = [
  { value: 'work', label: 'Work', description: 'Professional and business tasks' },
  { value: 'study', label: 'Study', description: 'Learning and education' },
  { value: 'exercise', label: 'Exercise', description: 'Physical fitness and health' },
  { value: 'creative', label: 'Creative', description: 'Arts and creative projects' }
]

const getRandomPlantForCategory = (category: string): string => {
  const plants = CATEGORY_PLANTS[category] || CATEGORY_PLANTS.exercise
  return plants[Math.floor(Math.random() * plants.length)]
}

const isPositionPlantable = (x: number, y: number): boolean => {
  return PLANTABLE_POSITIONS.some(pos => pos.x === x && pos.y === y)
}

const getNextAvailablePosition = (existingPlants: Plant[]): { x: number, y: number } | null => {
  const occupiedPositions = existingPlants.map(plant => ({ x: plant.x, y: plant.y }))
  
  for (const position of PLANTABLE_POSITIONS) {
    const isOccupied = occupiedPositions.some(occupied => 
      occupied.x === position.x && occupied.y === position.y
    )
    if (!isOccupied) {
      return position
    }
  }
  
  return null
}
const getPlantSprite = (plant: Plant, stage: number): string => {
  const spriteType = plant.plantSprite || getRandomPlantForCategory(plant.type)
  
  const stageMap: Record<string, number[]> = {
    carrot: [1, 3, 6, 9, 12, 16],
    beet: [1, 3, 6, 9, 11, 13],
    radish: [1, 2, 3, 5, 6, 8],
    tomat: [1, 4, 8, 12, 16, 20],
    eggplant: [1, 2, 4, 6, 8, 9],
    pepper: [1, 3, 5, 8, 10, 12],
    corn: [1, 4, 8, 12, 16, 20],
    wheat: [1, 2, 3, 4, 6, 7],
    peas: [1, 2, 3, 5, 7, 8],
    potato: [1, 2, 3, 4, 6, 7],
    cabbage: [1, 4, 8, 12, 16, 20],
    salad: [1, 2, 3, 4, 5, 7],
    spinach: [1, 2, 3, 4, 5, 5],
    cucumber: [1, 4, 8, 12, 16, 20],
    pumpkin: [1, 4, 8, 12, 16, 20],
    watermelon: [1, 4, 8, 12, 16, 19],
    onion: [1, 2, 3, 4, 5, 6]
  }
  
  const stages = stageMap[spriteType] || stageMap.carrot
  const spriteStage = stages[Math.min(stage, stages.length - 1)]
  
  return `/assets/Sprites/${spriteType}/${spriteType}_${spriteStage}.png`
}


const convertApiPlantToLocal = (apiPlant: PlantResponse): Plant => ({
    id: apiPlant.id,
    name: apiPlant.name,
    task_description: (apiPlant as any).task_description,
    type: (apiPlant.productivity_category || apiPlant.plant_type || 'work') as Plant['type'],
    x: apiPlant.position_x,
    y: apiPlant.position_y,
    stage: Math.min(5, Math.floor((apiPlant.growth_level || 0) / 20)),
    experience_points: apiPlant.experience_points,
    growth_level: apiPlant.growth_level,
    lastWatered: new Date(apiPlant.updated_at),
    plantSprite: apiPlant.plant_sprite,
    decay_status: apiPlant.decay_status,
    current_streak: apiPlant.current_streak,
    task_level: apiPlant.task_level,
    task_status: (apiPlant as any).task_status || 'active',
    completion_date: (apiPlant as any).completion_date ? new Date((apiPlant as any).completion_date) : undefined
})

export default function CanvasGarden() {
  const { user, logout, token } = useAuth()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [plants, setPlants] = useState<Plant[]>([])
  const [loading, setLoading] = useState(true)
  const [userProgress, setUserProgress] = useState<UserProgressResponse | null>(null)
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null)
  const [mode, setMode] = useState<'plant' | 'info' | 'tasks'>('plant')
  const [mousePos, setMousePos] = useState<{x: number, y: number} | null>(null)
  const [hoveredPlant, setHoveredPlant] = useState<Plant | null>(null)
  const [showPlantCreator, setShowPlantCreator] = useState(false)
  const [pendingPlantPosition, setPendingPlantPosition] = useState<{x: number, y: number} | null>(null)
  const [loadedSprites, setLoadedSprites] = useState<Map<string, HTMLImageElement>>(new Map())
  
  const [submissionMessage, setSubmissionMessage] = useState('')
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  
  const [hasShownDailyPanel, setHasShownDailyPanel] = useState(false)
  const [shouldAutoShowTasks, setShouldAutoShowTasks] = useState(false)
  const [showTaskPanel, setShowTaskPanel] = useState(false)
  const [focusedPlantId, setFocusedPlantId] = useState<string | null>(null)
  const [showWorkDialog, setShowWorkDialog] = useState(false)
  const [workHours, setWorkHours] = useState('')
  const [showTrophyDialog, setShowTrophyDialog] = useState(false)
  
  // Cinematic planting system
  const {
    isCinemaMode,
    focusPosition,
    isAnimating,
    startCinematicPlanting,
    onCinemaAnimationComplete,
    startReturnAnimation,
    exitCinemaMode
  } = useCinematicPlanting({
    onPlantCreated: (position) => {
      setPendingPlantPosition(position)
      setShowPlantCreator(true)
    }
  })

  // Plant growth animation system
  const {
    activeGrowthAnimations,
    triggerGrowthAnimation,
    onGrowthAnimationComplete,
    cleanup: cleanupGrowthAnimations
  } = usePlantGrowthAnimations()

  // XP animation system
  const {
    activeXPAnimations,
    triggerXPAnimation: triggerXPAnimationHook,
    onXPAnimationComplete,
    cleanup: cleanupXPAnimations
  } = useXPAnimations()

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

  const getPlantSpriteImage = useCallback(async (plant: Plant, stage: number): Promise<HTMLImageElement | null> => {
    try {
      const spritePath = getPlantSprite(plant, stage)
      return await loadSprite(spritePath)
    } catch (error) {
      console.warn(`Failed to load sprite for ${plant.type} stage ${stage}:`, error)
      return null
    }
  }, [loadSprite])

  const getPlantColor = (category: string): string => {
    const colors: Record<string, string> = {
      work: '#6b7280',
      study: '#10b981',
      exercise: '#ef4444',
      creative: '#f59e0b'
    }
    return colors[category] || '#6b7280'
  }

  const drawGarden = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    try {
      const grassImg = await loadSprite('/assets/Sprites/terrain/grass.png')
      if (grassImg) {
        for (let x = 0; x < GRID_WIDTH; x++) {
          for (let y = 0; y < GRID_HEIGHT; y++) {
            ctx.drawImage(grassImg, x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE)
            
            const tileX = x * CELL_SIZE
            const tileY = y * CELL_SIZE
            
            ctx.fillStyle = '#2d5016'
            if (x < GRID_WIDTH - 1) {
              for (let i = 8; i < CELL_SIZE - 8; i += 8) {
                ctx.fillRect(tileX + CELL_SIZE - 2, tileY + i, 4, 4)
              }
            }
            if (y < GRID_HEIGHT - 1) {
              for (let i = 8; i < CELL_SIZE - 8; i += 8) {
                ctx.fillRect(tileX + i, tileY + CELL_SIZE - 2, 4, 4)
              }
            }
            if (x < GRID_WIDTH - 1 && y < GRID_HEIGHT - 1) {
              ctx.fillRect(tileX + CELL_SIZE - 2, tileY + CELL_SIZE - 2, 4, 4)
            }
          }
        }
      } else {
        drawFallbackGrass(ctx)
      }
    } catch {
      drawFallbackGrass(ctx)
    }

    if (mode === 'plant') {
      PLANTABLE_POSITIONS.forEach(position => {
        const isOccupied = plants.some(plant => plant.x === position.x && plant.y === position.y)
        if (!isOccupied) {
          const x = position.x * CELL_SIZE
          const y = position.y * CELL_SIZE
          
          ctx.strokeStyle = '#22c55e'
          ctx.lineWidth = 3
          ctx.setLineDash([5, 5])
          ctx.strokeRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4)
          ctx.setLineDash([])
          
          ctx.fillStyle = 'rgba(34, 197, 94, 0.1)'
          ctx.fillRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4)
        }
      })
    }
    try {
      const dirtImg = await loadSprite('/assets/Sprites/terrain/dirt.png')
      if (dirtImg) {
        plants.forEach(plant => {
          const plantX = plant.x * CELL_SIZE
          const plantY = plant.y * CELL_SIZE
          ctx.drawImage(dirtImg, plantX, plantY, CELL_SIZE, CELL_SIZE)
          
          ctx.fillStyle = '#5d4037'
          if (plant.x < GRID_WIDTH - 1) {
            for (let i = 8; i < CELL_SIZE - 8; i += 8) {
              ctx.fillRect(plantX + CELL_SIZE - 2, plantY + i, 4, 4)
            }
          }
          if (plant.y < GRID_HEIGHT - 1) {
            for (let i = 8; i < CELL_SIZE - 8; i += 8) {
              ctx.fillRect(plantX + i, plantY + CELL_SIZE - 2, 4, 4)
            }
          }
          if (plant.x < GRID_WIDTH - 1 && plant.y < GRID_HEIGHT - 1) {
            ctx.fillRect(plantX + CELL_SIZE - 2, plantY + CELL_SIZE - 2, 4, 4)
          }
        })
      }
    } catch {
      drawFallbackDirt(ctx, plants)
    }

    for (const plant of plants) {
      const centerX = plant.x * CELL_SIZE + CELL_SIZE / 2
      const centerY = plant.y * CELL_SIZE + CELL_SIZE / 2

      try {
        const spriteImg = await getPlantSpriteImage(plant, plant.animationStage || plant.stage)
        if (spriteImg) {
          ctx.save()
          
          if (plant.decay_status === 'wilted') {
            ctx.filter = 'contrast(0.8) saturate(0.6) brightness(0.9) sepia(0.3)'
          } else if (plant.decay_status === 'severely_wilted') {
            ctx.filter = 'contrast(0.6) saturate(0.3) brightness(0.7) sepia(0.6)'
          } else if (plant.decay_status === 'dead') {
            ctx.filter = 'contrast(0.4) saturate(0.1) brightness(0.5) grayscale(0.8)'
          } else {
            ctx.filter = 'contrast(1.3) saturate(1.2) brightness(1.1)'
          }
          
          const spriteSize = Math.min(CELL_SIZE - 8, 52)
          ctx.drawImage(
            spriteImg, 
            centerX - spriteSize / 2, 
            centerY - spriteSize / 2, 
            spriteSize, 
            spriteSize
          )
          
          ctx.restore()
        } else {
          drawFallbackPlant(ctx, centerX, centerY, plant)
        }
      } catch {
        drawFallbackPlant(ctx, centerX, centerY, plant)
      }

      if (selectedPlant?.id === plant.id) {
        ctx.strokeStyle = '#fbbf24'
        ctx.lineWidth = 3
        ctx.strokeRect(plant.x * CELL_SIZE + 1, plant.y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2)
      }


      if (hoveredPlant?.id === plant.id && mode === 'info') {
        ctx.strokeStyle = '#06b6d4'
        ctx.lineWidth = 2
        ctx.strokeRect(plant.x * CELL_SIZE + 1, plant.y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2)
      }


      ctx.fillStyle = getPlantColor(plant.type)
      ctx.fillRect(plant.x * CELL_SIZE + 2, plant.y * CELL_SIZE + 2, 8, 8)


      if (mode === 'info' && (hoveredPlant?.id === plant.id || selectedPlant?.id === plant.id)) {
        const cellX = plant.x * CELL_SIZE
        const cellY = plant.y * CELL_SIZE
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
        ctx.fillRect(cellX, cellY, CELL_SIZE, CELL_SIZE)
        
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 10px Arial'
        ctx.textAlign = 'center'
        const plantNameOnly = plant.name.replace(/^(Exercise|Study|Work|Self-care|Creative)\s+/i, '')
        const shortName = plantNameOnly.length > 12 ? plantNameOnly.substring(0, 10) + '...' : plantNameOnly
        ctx.fillText(shortName, cellX + CELL_SIZE/2, cellY + 15)
        ctx.fillStyle = '#00ff88'
        ctx.font = '9px Arial'
        ctx.fillText(`${Math.floor((plant.stage / 5) * 100)}%`, cellX + CELL_SIZE/2, cellY + 30)
        ctx.fillStyle = '#88ccff'
        ctx.fillText(plant.type.toUpperCase(), cellX + CELL_SIZE/2, cellY + 45)
        ctx.textAlign = 'left'
      }
    }

    if (mode === 'plant' && mousePos) {
      const gridX = Math.floor(mousePos.x / CELL_SIZE)
      const gridY = Math.floor(mousePos.y / CELL_SIZE)
      
      if (gridX >= 0 && gridX < GRID_WIDTH && gridY >= 0 && gridY < GRID_HEIGHT && isPositionPlantable(gridX, gridY)) {
        const isOccupied = plants.some(plant => plant.x === gridX && plant.y === gridY)
        if (!isOccupied) {
          ctx.globalAlpha = 0.5
          ctx.fillStyle = '#10b981'
          ctx.fillRect(gridX * CELL_SIZE, gridY * CELL_SIZE, CELL_SIZE, CELL_SIZE)
          ctx.globalAlpha = 1
        }
      }
    }

    if (mode === 'tasks' && hoveredPlant) {
      const plantX = hoveredPlant.x * CELL_SIZE
      const plantY = hoveredPlant.y * CELL_SIZE
      
      // Color-coded overlay based on plant status
      let overlayColor = '#3b82f6' // Blue for healthy
      
      if (hoveredPlant.decay_status === 'dead') {
        overlayColor = '#dc2626' // Red for dead
      } else if (hoveredPlant.decay_status === 'severely_wilted' || hoveredPlant.decay_status === 'wilted') {
        overlayColor = '#f59e0b' // Yellow for wilted
      } else if (hoveredPlant.stage >= 5) {
        overlayColor = '#8b5cf6' // Purple for trophy/completed
      }
      
      ctx.globalAlpha = 0.6
      ctx.fillStyle = overlayColor
      ctx.fillRect(plantX, plantY, CELL_SIZE, CELL_SIZE)
      ctx.globalAlpha = 1
    }
  }, [plants, selectedPlant, mousePos, hoveredPlant, mode, getPlantSpriteImage, loadSprite])

  const drawFallbackGrass = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#4ade80'
    ctx.fillRect(0, 0, GRID_WIDTH * CELL_SIZE, GRID_HEIGHT * CELL_SIZE)
    
    ctx.strokeStyle = '#2d5016'
    ctx.lineWidth = 2
    for (let x = 1; x < GRID_WIDTH; x++) {
      ctx.beginPath()
      ctx.moveTo(x * CELL_SIZE, 0)
      ctx.lineTo(x * CELL_SIZE, GRID_HEIGHT * CELL_SIZE)
      ctx.stroke()
    }
    for (let y = 1; y < GRID_HEIGHT; y++) {
      ctx.beginPath()
      ctx.moveTo(0, y * CELL_SIZE)
      ctx.lineTo(GRID_WIDTH * CELL_SIZE, y * CELL_SIZE)
      ctx.stroke()
    }
  }

  const drawFallbackDirt = (ctx: CanvasRenderingContext2D, plants: Plant[]) => {
    plants.forEach(plant => {
      const plantX = plant.x * CELL_SIZE
      const plantY = plant.y * CELL_SIZE
      ctx.fillStyle = '#8B4513'
      ctx.fillRect(plantX, plantY, CELL_SIZE, CELL_SIZE)
      
      ctx.fillStyle = '#5d4037'
      if (plant.x < GRID_WIDTH - 1) {
        for (let i = 8; i < CELL_SIZE - 8; i += 8) {
          ctx.fillRect(plantX + CELL_SIZE - 2, plantY + i, 4, 4)
        }
      }
      if (plant.y < GRID_HEIGHT - 1) {
        for (let i = 8; i < CELL_SIZE - 8; i += 8) {
          ctx.fillRect(plantX + i, plantY + CELL_SIZE - 2, 4, 4)
        }
      }
      if (plant.x < GRID_WIDTH - 1 && plant.y < GRID_HEIGHT - 1) {
        ctx.fillRect(plantX + CELL_SIZE - 2, plantY + CELL_SIZE - 2, 4, 4)
      }
    })
  }

  const drawFallbackPlant = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, plant: Plant) => {
    ctx.fillStyle = getPlantColor(plant.type)
    ctx.beginPath()
    ctx.arc(centerX, centerY, 16 + (plant.animationStage || plant.stage) * 4, 0, 2 * Math.PI)
    ctx.fill()
  }

  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

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
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    let x: number, y: number
    
    if ('touches' in event && event.touches.length > 0) {
      x = event.touches[0].clientX - rect.left
      y = event.touches[0].clientY - rect.top
    } else if ('clientX' in event) {
      x = event.clientX - rect.left
      y = event.clientY - rect.top
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


  const logWork = async (plantId: string, hours: number) => {
    try {
      const plantBefore = plants.find(p => p.id === plantId)
      const stageBefore = plantBefore?.stage || 0
      
      await api.logTaskWork({
        plant_id: plantId,
        hours_worked: hours
      })
      
      const xpGained = hours * 100
      
      triggerXPAnimation(plantId, xpGained)
      
      const apiPlants = await api.getPlants()
      const updatedPlants = apiPlants.map(convertApiPlantToLocal)
      setPlants(updatedPlants)
      
      const plantAfter = updatedPlants.find(p => p.id === plantId)
      if (plantAfter && plantAfter.stage > stageBefore) {
        setTimeout(() => {
          handleGrowthAnimation(plantId, plantAfter.stage)
        }, 1000)
      }
      
    } catch (error) {
      console.error('Failed to log work:', error)
      alert('Failed to log work. Please try again.')
    }
  }

  const completeTask = async (plantId: string) => {
    try {
      await api.completeTask(plantId)
      await loadPlants()
    } catch (error) {
      console.error('Failed to complete task:', error)
      alert('Failed to complete task. Please try again.')
    }
  }

  const harvestPlant = async () => {
    if (!selectedPlant || selectedPlant.stage < 4) return
    try {
      await api.harvestPlant(selectedPlant.id)
      await loadPlants()
      setSelectedPlant(null)
    } catch (error) {
      console.error('Failed to harvest plant:', error)
      if (error instanceof Error && error.message.includes('Plant not found')) {
        alert('Plant not found. It may have already been harvested.')
      } else if (error instanceof Error && error.message.includes('not mature enough')) {
        alert('Plant is not mature enough to harvest yet.')
      } else {
        alert('Failed to harvest plant. Please try again.')
      }
    }
  }



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
    try {
      setLoading(true)
      const apiPlants = await api.getPlants()
      const localPlants = apiPlants.map(convertApiPlantToLocal)
      setPlants(localPlants)
    } catch (error) {
      console.error('Failed to load plants:', error)
    } finally {
      setLoading(false)
    }
  }, [token])


  useEffect(() => {
    loadPlants()
    loadUserProgress()
  }, [loadPlants, loadUserProgress])

  useEffect(() => {
    if (mode !== 'tasks') {
      setShowWorkDialog(false)
    }
  }, [mode])

  const shouldShowDailyTasks = useCallback(() => {
    if (!user || hasShownDailyPanel) return false
    
    const today = new Date().toDateString()
    const skippedToday = localStorage.getItem(`taskPanelSkipped_${today}`)
    if (skippedToday) return false
    
    const workedToday = plants.some(plant => {
      if (!plant.lastWatered) return false
      return new Date(plant.lastWatered).toDateString() === today
    })
    
    return !workedToday
  }, [user, hasShownDailyPanel, plants])

  useEffect(() => {
    if (user && plants.length > 0 && shouldShowDailyTasks()) {
      setShouldAutoShowTasks(true)
      setShowTaskPanel(true)
      setMode('tasks')
      setHasShownDailyPanel(true)
      setSelectedPlant(null)
      setShowWorkDialog(false)
    }
  }, [user, plants, shouldShowDailyTasks])

  const skipDailyTasks = () => {
    const today = new Date().toDateString()
    localStorage.setItem(`taskPanelSkipped_${today}`, 'true')
    setShouldAutoShowTasks(false)
    setShowTaskPanel(false)
    setMode('plant')
  }

  const triggerXPAnimation = (plantId: string, xpGained: number, showInHeader: boolean = false) => {
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

  const handleGrowthAnimation = (plantId: string, newStage: number) => {
    const plant = plants.find(p => p.id === plantId)
    if (plant) {
      const oldStage = Math.min(5, Math.floor((plant.growth_level || 0) / 20)) // Use same calculation as main stage
      triggerGrowthAnimation(plantId, oldStage, newStage, { x: plant.position_x, y: plant.position_y })
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


  useEffect(() => {
    drawGarden()
  }, [plants, drawGarden])

  useEffect(() => {
    const preloadSprites = async () => {
      const allPlants = Object.values(CATEGORY_PLANTS).flat()
      const stages = [0, 1, 2, 3, 4, 5]
      
      for (const plantSprite of allPlants) {
        for (const stage of stages) {
          try {
            const mockPlant: Plant = { 
              id: 'temp', 
              name: 'temp', 
              type: 'exercise', 
              x: 0, 
              y: 0, 
              stage, 
              experience_points: 0,
              growth_level: 0,
              lastWatered: new Date(),
              plantSprite 
            }
            await getPlantSpriteImage(mockPlant, stage)
          } catch {
            console.warn(`Failed to preload sprite for ${plantSprite} stage ${stage}`)
          }
        }
      }
    }
    
    preloadSprites()
  }, [getPlantSpriteImage])

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
    <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-700 to-green-600">
      <header className="bg-black/30 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between header-content">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Canvas Garden</h1>
                <p className="text-green-100 text-sm">{user?.username || user?.email}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 header-buttons">
              <div className="flex items-center space-x-1 bg-white/10 rounded-lg p-1">
                <button
                  onClick={() => {
                    setMode('plant')
                    setHoveredPlant(null)
                  }}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors plant-button ${
                    mode === 'plant' 
                      ? 'bg-green-600 text-white' 
                      : 'text-white hover:bg-white/20'
                  }`}
                >
                  <Plus className="w-4 h-4 inline mr-1" />
                  Plant
                </button>
                <button
                  onClick={() => {
                    setMode('info')
                    setMousePos(null)
                  }}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors plant-button ${
                    mode === 'info' 
                      ? 'bg-cyan-600 text-white' 
                      : 'text-white hover:bg-white/20'
                  }`}
                >
                  <Info className="w-4 h-4 inline mr-1" />
                  Info
                </button>
                <button
                  onClick={() => {
                    setMode('tasks')
                    setMousePos(null)
                    setHoveredPlant(null)
                    setSelectedPlant(null)
                    setShowWorkDialog(false)
                  }}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors plant-button ${
                    mode === 'tasks' 
                      ? 'bg-purple-600 text-white' 
                      : 'text-white hover:bg-white/20'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 inline mr-1" />
                  Tasks
                </button>
              </div>


              <div className="flex items-center space-x-2 text-white header-stats">
                <div className="bg-white/10 px-3 py-2 rounded flex items-center space-x-1">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm">Level {userProgress?.level || 1}</span>
                </div>
                <div className="bg-white/10 px-3 py-2 rounded">
                  <span className="text-sm">{userProgress?.total_experience_points || 0} XP</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button 
                  onClick={logout}
                  className="p-2 text-green-100 hover:text-red-300 transition-colors bg-white/10 rounded"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="relative h-[calc(100vh-100px)] overflow-hidden">
        <div className="relative z-10 h-full">
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
              <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 flex items-center justify-center garden-canvas" style={{width: `${GRID_WIDTH * CELL_SIZE + 40}px`, height: `${GRID_HEIGHT * CELL_SIZE + 40}px`}}>
                <canvas
                  ref={canvasRef}
                  width={GRID_WIDTH * CELL_SIZE}
                  height={GRID_HEIGHT * CELL_SIZE}
                  onClick={handleCanvasClick}
                  onTouchStart={handleCanvasClick}
                  onMouseMove={handleCanvasMouseMove}
                  className="border-2 border-green-400/30 rounded-lg cursor-pointer bg-green-900/20"
                  style={{ touchAction: 'manipulation' }}
                />
              </div>
            </CinematicPlotFocus>
          </div>
        </div>
      </div>

      {selectedPlant && mode === 'info' && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-[500px] h-auto bg-gradient-to-br from-green-600 to-green-800 rounded-xl shadow-2xl modal-container"
                >
                  <div className="flex justify-between items-center p-4 border-b border-white/20">
                    <h2 className="text-xl font-bold text-white">Plant Details</h2>
                    <button
                      onClick={() => setMode('plant')}
                      className="text-white/70 hover:text-white text-2xl font-bold"
                    >
                      ×
                    </button>
                  </div>
                  <div className="p-4">
                  <div className="text-center mb-4">
                    <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center ${
                      selectedPlant.type === 'exercise' ? 'bg-red-500' :
                      selectedPlant.type === 'study' ? 'bg-blue-500' :
                      selectedPlant.type === 'work' ? 'bg-purple-500' :
                      selectedPlant.type === 'selfcare' ? 'bg-green-500' : 'bg-yellow-500'
                    }`}>
                      <span className="text-lg text-white font-bold">
                        {selectedPlant.name.replace(/^(Exercise|Study|Work|Self-care|Creative)\s+/i, '').charAt(0)}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">
                      {selectedPlant.name.replace(/^(Exercise|Study|Work|Self-care|Creative)\s+/i, '')}
                    </h3>
                    <p className="text-sm text-green-100 capitalize">{selectedPlant.type} Plant</p>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-white">Growth Progress</span>
                      <span className="text-sm text-green-100">{Math.floor((selectedPlant.stage / 5) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          selectedPlant.stage >= 4 ? 'bg-yellow-400' : 'bg-green-400'
                        }`}
                        style={{ width: `${(selectedPlant.stage / 5) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-300 mt-1">
                      {selectedPlant.stage === 0 ? 'Just planted' :
                       selectedPlant.stage === 1 ? 'Sprouting' :
                       selectedPlant.stage === 2 ? 'Growing' :
                       selectedPlant.stage === 3 ? 'Developing' :
                       selectedPlant.stage === 4 ? 'Ready to harvest' : 'Fully grown'}
                    </p>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="bg-white/5 rounded-lg p-4">
                      <h4 className="text-sm font-bold text-white mb-3">Plant Details</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-300">Category:</span>
                          <span className="text-white capitalize">{selectedPlant.type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Task Level:</span>
                          <span className="text-white">{selectedPlant.task_level}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Experience:</span>
                          <span className="text-white">{selectedPlant.experience_points} XP</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Streak:</span>
                          <span className="text-white">{selectedPlant.current_streak} days</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Position:</span>
                          <span className="text-white">({selectedPlant.x}, {selectedPlant.y})</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Last Worked:</span>
                          <span className="text-white">{selectedPlant.lastWatered ? new Date(selectedPlant.lastWatered).toLocaleDateString() : 'Never'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Status:</span>
                          <span className={`font-medium ${
                            selectedPlant.stage >= 4 ? 'text-yellow-400' :
                            selectedPlant.stage >= 2 ? 'text-green-400' : 'text-gray-400'
                          }`}>
                            {selectedPlant.stage >= 4 ? 'Ready to harvest' :
                             selectedPlant.stage >= 2 ? 'Healthy & growing' : 'Young plant'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setMode('plant')}
                    className="w-full px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Close Details
                  </button>
                  </div>
                </motion.div>
        </div>,
        document.body
      )}

      <CinematicPlantCreator
        isOpen={showPlantCreator}
        position={pendingPlantPosition}
        onClose={handlePlantCreatorClose}
        onCreatePlant={createPlant}
      />
      

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
          xpGained={animation.xpGained}
          position={animation.position}
          currentXP={animation.currentXP}
          maxXP={animation.maxXP}
          showInHeader={animation.showInHeader}
          onAnimationComplete={() => onXPAnimationComplete(plantId)}
        />
      ))}
      
      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
          <div className="card">
            <div className="flex items-center space-x-3">
              <div className="loading-spinner"></div>
              <span className="text-white font-medium">Loading your garden...</span>
            </div>
          </div>
        </div>
      )}
      


      {showTaskPanel && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto modal-container"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="text-center flex-1">
                {shouldAutoShowTasks ? (
                  <>
                    <h2 className="text-2xl font-bold text-white mb-2">Good morning!</h2>
                    <p className="text-green-200">Ready to tend your garden? What will you work on today?</p>
                  </>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold text-white mb-2">Your Daily Tasks</h2>
                    <p className="text-green-200">What have you worked on? What are you working on?</p>
                  </>
                )}
              </div>
              <div className="flex items-center space-x-2 ml-4">
                {shouldAutoShowTasks && (
                  <button
                    onClick={skipDailyTasks}
                    className="px-3 py-1 text-sm text-white/70 hover:text-white/90 hover:bg-white/10 rounded transition-colors"
                  >
                    Skip for today
                  </button>
                )}
                <button
                  onClick={() => {
                    setShouldAutoShowTasks(false)
                    setShowTaskPanel(false)
                    setFocusedPlantId(null)
                    setMode('plant')
                  }}
                  className="text-white/70 hover:text-white text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white/10 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-white">{plants.filter(p => p.task_status === 'active').length}</div>
                <div className="text-xs text-green-200">Active Tasks</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-white">
                  {plants.filter(p => {
                    if (!p.lastWatered) return false
                    const today = new Date().toDateString()
                    return new Date(p.lastWatered).toDateString() === today
                  }).length}
                </div>
                <div className="text-xs text-green-200">Worked Today</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-white">
                  {Math.max(...plants.map(p => p.current_streak || 0), 0)}
                </div>
                <div className="text-xs text-green-200">Best Streak</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-white">1</div>
                <div className="text-xs text-green-200">Your Level</div>
              </div>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {plants.map((plant) => (
                <div 
                  key={plant.id} 
                  className={`bg-white/5 rounded-lg p-4 border transition-all duration-300 ${
                    focusedPlantId === plant.id 
                      ? 'border-green-500 bg-green-500/10 shadow-lg shadow-green-500/20' 
                      : 'border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">Plant</span>
                      <h3 className="text-white font-medium">{plant.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        plant.type === 'work' ? 'bg-blue-500/20 text-blue-200' :
                        plant.type === 'study' ? 'bg-green-500/20 text-green-200' :
                        plant.type === 'exercise' ? 'bg-red-500/20 text-red-200' :
                        'bg-purple-500/20 text-purple-200'
                      }`}>
                        {plant.type}
                      </span>
                      <span className="text-sm">
                        {(plant.current_streak || 0) >= 7 ? 'Hot' :
                         (plant.current_streak || 0) >= 3 ? 'Active' :
                         (plant.current_streak || 0) >= 1 ? 'Growing' : 'Dormant'}
                      </span>
                    </div>
                    <div className="text-sm text-green-200">
                      Level {plant.task_level || 1} • {plant.experience_points} XP
                    </div>
                  </div>
                  
                  {plant.task_description && (
                    <p className="text-sm text-green-100/70 mb-3">{plant.task_description}</p>
                  )}
                  
                  <div className="flex items-center space-x-2 text-sm text-green-200 mb-3">
                    <span>Streak: {plant.current_streak || 0} days</span>
                    <span>•</span>
                    <span>Stage: {plant.stage}/5</span>
                  </div>

                  {plant.task_status === 'active' && (
                    <div className="flex space-x-2">
                      <input
                        id={`task-input-${plant.id}`}
                        type="number"
                        step="0.5"
                        min="0"
                        max="24"
                        placeholder="Hours worked today"
                        className={`flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-500 ${
                          focusedPlantId === plant.id ? 'ring-2 ring-green-500' : ''
                        }`}
                        onKeyPress={async (e) => {
                          if (e.key === 'Enter') {
                            const hours = parseFloat((e.target as HTMLInputElement).value)
                            if (hours > 0) {
                              await logWork(plant.id, hours);
                              (e.target as HTMLInputElement).value = ''
                              
                              setFocusedPlantId(null)
                              setSubmissionMessage("Great work! Your task is growing!")
                              setShowSuccessMessage(true)
                              setTimeout(() => {
                                setShowSuccessMessage(false)
                                setSubmissionMessage('')
                              }, 3000)
                            }
                          }
                        }}
                      />
                      <button
                        onClick={() => completeTask(plant.id)}
                        disabled={plant.stage < 4}
                        className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                          plant.stage >= 4 
                            ? 'bg-green-600 hover:bg-green-700 text-white' 
                            : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                        }`}
                        title={plant.stage < 4 ? `Plant needs to reach stage 4 to complete (currently stage ${plant.stage})` : 'Mark task as complete'}
                      >
                        {plant.stage >= 4 ? 'Complete' : `Complete (Stage ${plant.stage}/4)`}
                      </button>
                    </div>
                  )}

                  {plant.task_status === 'completed' && (
                    <div className="text-center py-2">
                      <span className="text-green-400 font-medium">Task Completed!</span>
                      <p className="text-xs text-green-200 mt-1">Will be harvested automatically</p>
                    </div>
                  )}
                </div>
              ))}
              
              {plants.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-white/70 mb-4">No tasks yet!</p>
                  <button
                    onClick={() => {
                      setMode('plant')
                    }}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Create Your First Task
                  </button>
                </div>
              )}
              
              {plants.length > 0 && (
                <div className="text-center pt-4 border-t border-white/10">
                  <button
                    onClick={() => {
                      setMode('plant')
                    }}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2 mx-auto"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Task</span>
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>,
        document.body
      )}

      {showSuccessMessage && createPortal(
        <div className="fixed top-4 right-4 z-50">
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-2"
          >
            <span className="text-2xl">Success!</span>
            <span className="font-medium">{submissionMessage}</span>
          </motion.div>
        </div>,
        document.body
      )}

      {showWorkDialog && selectedPlant && mode === 'tasks' && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 max-w-sm w-full mx-4"
          >
            <h3 className="text-xl font-bold text-white mb-4 text-center">
              {selectedPlant.name}
            </h3>
            <p className="text-green-100 text-sm text-center mb-6">
              How many hours did you work on this?
            </p>
            
            <input
              type="number"
              step="0.5"
              min="0"
              max="24"
              value={workHours}
              onChange={(e) => setWorkHours(e.target.value)}
              placeholder="2"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-500 text-center text-xl mb-4"
              autoFocus
              onKeyPress={async (e) => {
                if (e.key === 'Enter' && workHours && parseFloat(workHours) > 0) {
                  await logWork(selectedPlant.id, parseFloat(workHours))
                  setWorkHours('')
                  setShowWorkDialog(false)
                  setSubmissionMessage("Great work! Your plant is growing!")
                  setShowSuccessMessage(true)
                  setTimeout(() => {
                    setShowSuccessMessage(false)
                    setSubmissionMessage('')
                  }, 3000)
                }
              }}
            />
            
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  if (workHours && parseFloat(workHours) > 0) {
                    await logWork(selectedPlant.id, parseFloat(workHours))
                    setWorkHours('')
                    setShowWorkDialog(false)
                    setSubmissionMessage("Great work! Your plant is growing!")
                    setShowSuccessMessage(true)
                    setTimeout(() => {
                      setShowSuccessMessage(false)
                      setSubmissionMessage('')
                    }, 3000)
                  }
                }}
                disabled={!workHours || parseFloat(workHours) <= 0}
                className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-500 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
              >
                Log Work
              </button>
              <button
                onClick={() => {
                  setWorkHours('')
                  setShowWorkDialog(false)
                }}
                className="px-4 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>,
        document.body
      )}

      {/* Trophy/Completed Plant Dialog */}
      {showTrophyDialog && selectedPlant && mode === 'tasks' && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-xl shadow-2xl border border-white/20 modal-container"
          >
            <div className="flex justify-between items-center p-6 border-b border-white/20">
              <div className="flex items-center space-x-3">
                <Trophy className="w-6 h-6 text-yellow-400" />
                <h2 className="text-xl font-bold text-white">Trophy Plant</h2>
              </div>
              <button
                onClick={() => {
                  setShowTrophyDialog(false)
                  setSelectedPlant(null)
                }}
                className="text-white/70 hover:text-white text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="flex justify-center mb-4">
                  <Trophy className="w-12 h-12 text-yellow-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  {selectedPlant.name}
                </h3>
                <p className="text-green-200 text-sm">Task Completed Successfully!</p>
              </div>

              <div className="bg-white/5 rounded-lg p-4 mb-6">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Status:</span>
                    <span className="text-yellow-400 font-medium">Trophy Plant</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Stage:</span>
                    <span className="text-white">{selectedPlant.stage}/5 (Complete)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Total XP:</span>
                    <span className="text-white">{selectedPlant.experience_points}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Task Level:</span>
                    <span className="text-white">{selectedPlant.task_level || 1}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Best Streak:</span>
                    <span className="text-white">{selectedPlant.current_streak || 0} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Category:</span>
                    <span className="text-white capitalize">{selectedPlant.type}</span>
                  </div>
                </div>
              </div>

              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-2">
                  <Info className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-green-200">
                    <p className="font-medium mb-1">Auto-Harvest Information</p>
                    <p>Trophy plants are automatically harvested after 6 hours of completion or when you sign out. This frees up space for new tasks while preserving your achievement records.</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowTrophyDialog(false)
                  setSelectedPlant(null)
                }}
                className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                Acknowledge Achievement
              </button>
            </div>
          </motion.div>
        </div>,
        document.body
      )}

      {/* Task Mode Hover Info Box */}
      <AnimatePresence>
        {hoveredPlant && mode === 'tasks' && createPortal(
          <motion.div
            key="task-hover-info"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="fixed z-50 pointer-events-none"
            style={{
              left: '50%',
              top: '20%',
              transform: 'translateX(-50%)'
            }}
          >
          <div className="bg-black/80 backdrop-blur-sm rounded-lg p-4 border border-white/20 max-w-sm">
            <div className="flex items-center space-x-3 mb-3">
              <div className={`w-3 h-3 rounded-full ${
                hoveredPlant.decay_status === 'dead' ? 'bg-red-500' :
                hoveredPlant.decay_status === 'severely_wilted' || hoveredPlant.decay_status === 'wilted' ? 'bg-yellow-500' :
                hoveredPlant.stage >= 5 ? 'bg-purple-500' : 'bg-green-500'
              }`} />
              <h3 className="text-white font-semibold text-sm">
                {hoveredPlant.name}
              </h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                hoveredPlant.type === 'work' ? 'bg-blue-500/20 text-blue-200' :
                hoveredPlant.type === 'study' ? 'bg-green-500/20 text-green-200' :
                hoveredPlant.type === 'exercise' ? 'bg-red-500/20 text-red-200' :
                'bg-purple-500/20 text-purple-200'
              }`}>
                {hoveredPlant.type}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-gray-300">
                <span className="text-white font-medium">Stage:</span> {hoveredPlant.stage}/5
              </div>
              <div className="text-gray-300">
                <span className="text-white font-medium">Level:</span> {hoveredPlant.task_level || 1}
              </div>
              <div className="text-gray-300">
                <span className="text-white font-medium">XP:</span> {hoveredPlant.experience_points}
              </div>
              <div className="text-gray-300">
                <span className="text-white font-medium">Streak:</span> {hoveredPlant.current_streak || 0}
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-white/10">
              <div className="text-xs text-gray-300">
                <span className="text-white font-medium">Status:</span>{' '}
                <span className={`${
                  hoveredPlant.decay_status === 'dead' ? 'text-red-400' :
                  hoveredPlant.decay_status === 'severely_wilted' || hoveredPlant.decay_status === 'wilted' ? 'text-yellow-400' :
                  hoveredPlant.stage >= 5 ? 'text-purple-400' : 'text-green-400'
                }`}>
                  {hoveredPlant.decay_status === 'dead' ? 'Dead - Needs attention!' :
                   hoveredPlant.decay_status === 'severely_wilted' ? 'Severely wilted' :
                   hoveredPlant.decay_status === 'wilted' ? 'Wilted' :
                   hoveredPlant.stage >= 5 ? 'Ready to harvest' : 'Healthy & growing'}
                </span>
              </div>
              {hoveredPlant.lastWatered && (
                <div className="text-xs text-gray-400 mt-1">
                  Last worked: {new Date(hoveredPlant.lastWatered).toLocaleDateString()}
                </div>
              )}
            </div>

            <div className="mt-2 text-center">
              <span className="text-xs text-green-300">Click to log work hours</span>
            </div>
          </div>
          </motion.div>,
          document.body
        )}
      </AnimatePresence>
    </div>
  )
}