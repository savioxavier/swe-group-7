import React, { useRef, useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Plus, Leaf, Settings, LogOut, User, Zap, Info, BarChart3 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'
import { PlantCreate, PlantResponse, PlantCareCreate, UserProgressResponse } from '../types'

interface Plant {
  id: string
  name: string
  type: 'exercise' | 'study' | 'work' | 'selfcare' | 'creative'
  x: number
  y: number
  stage: number
  lastWatered: Date
  plantSprite?: string
}

const GRID_WIDTH = 11
const GRID_HEIGHT = 7
const CELL_SIZE = 80

const CATEGORY_PLANTS: Record<string, string[]> = {
  exercise: ['carrot', 'beet', 'radish'],
  study: ['tomat', 'eggplant', 'pepper'],
  work: ['corn', 'wheat', 'peas', 'potato'],
  selfcare: ['cabbage', 'salad', 'spinach'],
  creative: ['cucumber', 'pumpkin', 'watermelon', 'onion']
}

const PLANT_CATEGORIES = [
  { value: 'exercise', label: 'Exercise', description: 'Physical activity tasks' },
  { value: 'study', label: 'Study', description: 'Learning and education' },
  { value: 'work', label: 'Work', description: 'Professional tasks' },
  { value: 'selfcare', label: 'Self-care', description: 'Health and wellness' },
  { value: 'creative', label: 'Creative', description: 'Arts and creativity' }
]

const getRandomPlantForCategory = (category: string): string => {
  const plants = CATEGORY_PLANTS[category] || CATEGORY_PLANTS.exercise
  return plants[Math.floor(Math.random() * plants.length)]
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
  type: apiPlant.plant_type,
  x: apiPlant.position_x,
  y: apiPlant.position_y,
  stage: Math.floor(apiPlant.growth_level / 20),
  lastWatered: new Date(apiPlant.updated_at),
  plantSprite: apiPlant.plant_sprite
})

export default function CanvasGarden() {
  const { user, logout, token } = useAuth()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [plants, setPlants] = useState<Plant[]>([])
  const [loading, setLoading] = useState(true)
  const [userProgress, setUserProgress] = useState<UserProgressResponse | null>(null)
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null)
  const [isPlanting, setIsPlanting] = useState(false)
  const [mode, setMode] = useState<'plant' | 'info' | 'garden'>('plant')
  const [mousePos, setMousePos] = useState<{x: number, y: number} | null>(null)
  const [hoveredPlant, setHoveredPlant] = useState<Plant | null>(null)
  const [showPlantCreator, setShowPlantCreator] = useState(false)
  const [pendingPlantPosition, setPendingPlantPosition] = useState<{x: number, y: number} | null>(null)
  const [plantForm, setPlantForm] = useState({
    name: '',
    category: ''
  })
  const [loadedSprites, setLoadedSprites] = useState<Map<string, HTMLImageElement>>(new Map())

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

  const getPlantColor = (type: string): string => {
    const colors: Record<string, string> = {
      exercise: '#ef4444',
      study: '#3b82f6',
      work: '#8b5cf6',
      selfcare: '#10b981',
      creative: '#f59e0b'
    }
    return colors[type] || '#6b7280'
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
    } catch {
      ctx.fillStyle = '#4ade80'
      ctx.fillRect(0, 0, GRID_WIDTH * CELL_SIZE, GRID_HEIGHT * CELL_SIZE)
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

    for (const plant of plants) {
      const centerX = plant.x * CELL_SIZE + CELL_SIZE / 2
      const centerY = plant.y * CELL_SIZE + CELL_SIZE / 2

      try {
        const spriteImg = await getPlantSpriteImage(plant, plant.stage)
        if (spriteImg) {
          ctx.save()
          ctx.filter = 'contrast(1.3) saturate(1.2) brightness(1.1)'
          
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
          ctx.fillStyle = getPlantColor(plant.type)
          ctx.beginPath()
          ctx.arc(centerX, centerY, 16 + plant.stage * 4, 0, 2 * Math.PI)
          ctx.fill()
        }
      } catch {
        ctx.fillStyle = getPlantColor(plant.type)
        ctx.beginPath()
        ctx.arc(centerX, centerY, 16 + plant.stage * 4, 0, 2 * Math.PI)
        ctx.fill()
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

      // Draw plant info overlay directly on the plant in info mode
      if (mode === 'info' && (hoveredPlant?.id === plant.id || selectedPlant?.id === plant.id)) {
        const cellX = plant.x * CELL_SIZE
        const cellY = plant.y * CELL_SIZE
        
        // Semi-transparent overlay on the entire cell
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
        ctx.fillRect(cellX, cellY, CELL_SIZE, CELL_SIZE)
        
        // Plant name at the top (remove type prefix)
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 10px Arial'
        ctx.textAlign = 'center'
        
        const plantNameOnly = plant.name.replace(/^(Exercise|Study|Work|Self-care|Creative)\s+/i, '')
        const shortName = plantNameOnly.length > 12 ? plantNameOnly.substring(0, 10) + '...' : plantNameOnly
        ctx.fillText(shortName, cellX + CELL_SIZE/2, cellY + 15)
        
        // Stage info
        ctx.fillStyle = '#00ff88'
        ctx.font = '9px Arial'
        ctx.fillText(`${Math.floor((plant.stage / 5) * 100)}%`, cellX + CELL_SIZE/2, cellY + 30)
        
        // Type info at the bottom
        ctx.fillStyle = '#88ccff'
        ctx.fillText(plant.type.toUpperCase(), cellX + CELL_SIZE/2, cellY + 45)
        
        // Reset text alignment
        ctx.textAlign = 'left'
      }
    }

    if (isPlanting && mousePos) {
      const gridX = Math.floor(mousePos.x / CELL_SIZE)
      const gridY = Math.floor(mousePos.y / CELL_SIZE)
      
      if (gridX >= 0 && gridX < GRID_WIDTH && gridY >= 0 && gridY < GRID_HEIGHT) {
        ctx.globalAlpha = 0.5
        ctx.fillStyle = '#10b981'
        ctx.fillRect(gridX * CELL_SIZE, gridY * CELL_SIZE, CELL_SIZE, CELL_SIZE)
        ctx.globalAlpha = 1
      }
    }
  }, [plants, selectedPlant, isPlanting, mousePos, hoveredPlant, mode, getPlantSpriteImage, loadSprite])

  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    if (isPlanting) {
      setMousePos({ x, y })
    }

    if (mode === 'info') {
      const gridX = Math.floor(x / CELL_SIZE)
      const gridY = Math.floor(y / CELL_SIZE)
      const hoveredPlant = plants.find(p => p.x === gridX && p.y === gridY)
      setHoveredPlant(hoveredPlant || null)
    }
  }

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    const gridX = Math.floor(x / CELL_SIZE)
    const gridY = Math.floor(y / CELL_SIZE)

    if (gridX >= 0 && gridX < GRID_WIDTH && gridY >= 0 && gridY < GRID_HEIGHT) {
      const clickedPlant = plants.find(p => p.x === gridX && p.y === gridY)

      if (mode === 'plant') {
        if (isPlanting) {
          if (!clickedPlant) {
            setPendingPlantPosition({ x: gridX, y: gridY })
            setShowPlantCreator(true)
            setPlantForm({ name: '', category: '' })
          }
          setIsPlanting(false)
        } else if (clickedPlant) {
          setSelectedPlant(clickedPlant)
        } else {
          setSelectedPlant(null)
        }
      } else if (mode === 'info') {
        setSelectedPlant(clickedPlant || null)
      }
    } else if (!isPlanting) {
      setSelectedPlant(null)
    }
  }

  const waterPlant = async () => {
    if (!selectedPlant) return
    
    try {
      const careData: PlantCareCreate = {
        plant_id: selectedPlant.id,
        care_type: 'water'
      }
      
      await api.careForPlant(careData)
      
      await loadPlants()
      await loadUserProgress()
      const updatedPlant = plants.find(p => p.id === selectedPlant.id)
      if (updatedPlant) {
        setSelectedPlant(updatedPlant)
      }
    } catch (error) {
      console.error('Failed to water plant:', error)
      alert('Failed to water plant. Please try again.')
    }
  }

  const harvestPlant = async () => {
    if (!selectedPlant || selectedPlant.stage < 4) return
    
    try {
      const careData: PlantCareCreate = {
        plant_id: selectedPlant.id,
        care_type: 'task_complete'
      }
      
      await api.careForPlant(careData)
      await api.deletePlant(selectedPlant.id)
      await loadPlants()
      await loadUserProgress()
      
      setSelectedPlant(null)
    } catch (error) {
      console.error('Failed to harvest plant:', error)
      alert('Failed to harvest plant. Please try again.')
    }
  }

  const createPlant = async () => {
    if (pendingPlantPosition && plantForm.name && plantForm.category) {
      try {
        const selectedSprite = getRandomPlantForCategory(plantForm.category)
        const plantData: PlantCreate = {
          name: plantForm.name.trim(),
          plant_type: plantForm.category as 'exercise' | 'study' | 'work' | 'selfcare' | 'creative',
          plant_sprite: selectedSprite,
          position_x: pendingPlantPosition.x,
          position_y: pendingPlantPosition.y
        }
        
        const apiPlant = await api.createPlant(plantData)
        const newPlant = convertApiPlantToLocal(apiPlant)
        
        setPlants([...plants, newPlant])
        setShowPlantCreator(false)
        setPendingPlantPosition(null)
        setPlantForm({ name: '', category: '' })
      } catch (error) {
        console.error('Failed to create plant:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        alert(`Failed to create plant: ${errorMessage}`)
      }
    }
  }

  const cancelPlantCreation = () => {
    setShowPlantCreator(false)
    setPendingPlantPosition(null)
    setPlantForm({ name: '', category: '' })
  }

  const isFormValid = plantForm.name.trim() && plantForm.category

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

  const loadUserProgress = useCallback(async () => {
    if (!token) return
    try {
      const progress = await api.getUserProgress()
      setUserProgress(progress)
    } catch (error) {
      console.error('Failed to load user progress:', error)
    }
  }, [token])

  useEffect(() => {
    loadPlants()
    loadUserProgress()
  }, [loadPlants, loadUserProgress])

  useEffect(() => {
    drawGarden()
  }, [drawGarden])

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
              id: 'temp', name: 'temp', type: 'exercise', 
              x: 0, y: 0, stage, lastWatered: new Date(),
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


  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-700 to-green-600">
      <header className="bg-black/30 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Canvas Garden</h1>
                <p className="text-green-100 text-sm">{user?.username || user?.email}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1 bg-white/10 rounded-lg p-1">
                <button
                  onClick={() => {
                    setMode('plant')
                    setIsPlanting(false)
                    setHoveredPlant(null)
                  }}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
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
                    setIsPlanting(false)
                    setMousePos(null)
                  }}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
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
                    setMode('garden')
                    setIsPlanting(false)
                    setMousePos(null)
                    setHoveredPlant(null)
                  }}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    mode === 'garden' 
                      ? 'bg-purple-600 text-white' 
                      : 'text-white hover:bg-white/20'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 inline mr-1" />
                  Garden
                </button>
              </div>

              {mode === 'plant' && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsPlanting(!isPlanting)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isPlanting 
                        ? 'bg-green-600 text-white' 
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {isPlanting ? 'Cancel' : 'Add Plant'}
                  </button>
                  
                  <button
                    onClick={waterPlant}
                    disabled={!selectedPlant}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:opacity-50 text-white rounded-md text-sm font-medium transition-colors"
                  >
                    Water
                  </button>
                  
                  <button
                    onClick={harvestPlant}
                    disabled={!selectedPlant || selectedPlant.stage < 4}
                    className="px-3 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:opacity-50 text-white rounded-md text-sm font-medium transition-colors"
                  >
                    Harvest
                  </button>
                </div>
              )}

              <div className="flex items-center space-x-2 text-white">
                <div className="bg-white/10 px-3 py-2 rounded flex items-center space-x-1">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm">Level {userProgress?.level || 1}</span>
                </div>
                <div className="bg-white/10 px-3 py-2 rounded">
                  <span className="text-sm">{userProgress?.total_experience || 0} XP</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-1">
                <button className="p-2 text-green-100 hover:text-white transition-colors bg-white/10 rounded">
                  <Settings className="w-4 h-4" />
                </button>
                <button className="p-2 text-green-100 hover:text-white transition-colors bg-white/10 rounded">
                  <User className="w-4 h-4" />
                </button>
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
          {mode === 'garden' ? (
            <div className="flex h-full p-4 space-x-6 justify-center">
              {/* Garden Stats Panel */}
              <div className="w-80 bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 overflow-y-auto">
                <h2 className="text-xl font-bold text-white mb-4">Garden Overview</h2>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-white/10 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-white">{plants.length}</div>
                    <div className="text-green-100 text-sm">Total Plants</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-yellow-400">{plants.filter(p => p.stage >= 4).length}</div>
                    <div className="text-green-100 text-sm">Ready to Harvest</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-green-400">{plants.filter(p => p.stage === 5).length}</div>
                    <div className="text-green-100 text-sm">Fully Grown</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-blue-400">{plants.length > 0 ? Math.round((plants.reduce((sum, p) => sum + p.stage, 0) / (plants.length * 5)) * 100) : 0}%</div>
                    <div className="text-green-100 text-sm">Progress</div>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-white mb-3">All Plants</h3>
                <div className="space-y-2">
                  {plants.map((plant) => (
                    <motion.div
                      key={plant.id}
                      className="bg-white/10 rounded-lg p-3 border border-white/20 hover:bg-white/20 transition-colors cursor-pointer"
                      onClick={() => setSelectedPlant(plant)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-white">
                            {plant.name.replace(/^(Exercise|Study|Work|Self-care|Creative)\s+/i, '')}
                          </h4>
                          <p className="text-xs text-green-100 capitalize">{plant.type}</p>
                          <p className="text-xs text-gray-300">Position: ({plant.x}, {plant.y})</p>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-bold ${
                            plant.stage >= 4 ? 'text-yellow-400' : 
                            plant.stage >= 2 ? 'text-green-400' : 'text-gray-400'
                          }`}>
                            {Math.floor((plant.stage / 5) * 100)}% grown
                          </div>
                          <div className="text-xs text-gray-300">
                            {plant.stage >= 4 ? 'Ready!' : 
                             plant.stage >= 2 ? 'Growing' : 'Young'}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 flex items-center justify-center" style={{width: `${GRID_WIDTH * CELL_SIZE + 40}px`, height: `${GRID_HEIGHT * CELL_SIZE + 40}px`}}>
                <canvas
                  ref={canvasRef}
                  width={GRID_WIDTH * CELL_SIZE}
                  height={GRID_HEIGHT * CELL_SIZE}
                  onClick={handleCanvasClick}
                  onMouseMove={handleCanvasMouseMove}
                  className="border-2 border-green-400/30 rounded-lg cursor-pointer bg-green-900/20"
                />
              </div>
            </div>
          ) : (
            <div className={`flex h-full p-4 transition-all duration-300 justify-center ${selectedPlant && mode === 'info' ? 'pr-2' : ''}`}>
              {selectedPlant && mode === 'info' && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="w-80 mr-6 bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 overflow-y-auto"
                >
                  <div className="text-center mb-6">
                    <div className={`w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center ${
                      selectedPlant.type === 'exercise' ? 'bg-red-500' :
                      selectedPlant.type === 'study' ? 'bg-blue-500' :
                      selectedPlant.type === 'work' ? 'bg-purple-500' :
                      selectedPlant.type === 'selfcare' ? 'bg-green-500' : 'bg-yellow-500'
                    }`}>
                      <span className="text-2xl text-white font-bold">
                        {selectedPlant.name.replace(/^(Exercise|Study|Work|Self-care|Creative)\s+/i, '').charAt(0)}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">
                      {selectedPlant.name.replace(/^(Exercise|Study|Work|Self-care|Creative)\s+/i, '')}
                    </h3>
                    <p className="text-sm text-green-100 capitalize">{selectedPlant.type} Plant</p>
                  </div>

                  <div className="mb-6">
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
                          <span className="text-gray-300">Position:</span>
                          <span className="text-white">({selectedPlant.x}, {selectedPlant.y})</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Last Watered:</span>
                          <span className="text-white">{selectedPlant.lastWatered.toLocaleDateString()}</span>
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

                    <div className="bg-white/5 rounded-lg p-4">
                      <h4 className="text-sm font-bold text-white mb-3">Care Tips</h4>
                      <div className="space-y-2 text-xs text-gray-300">
                        {selectedPlant.stage < 4 ? (
                          <>
                            <p>• Water regularly to help growth</p>
                            <p>• Plant will grow automatically over time</p>
                            <p>• Each stage brings new visual changes</p>
                          </>
                        ) : (
                          <>
                            <p>• This plant is ready for harvest!</p>
                            <p>• Harvesting will give you rewards</p>
                            <p>• Use Plant Mode to harvest</p>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4">
                      <h4 className="text-sm font-bold text-white mb-3">Similar Plants</h4>
                      <div className="text-xs text-gray-300">
                        <p>{plants.filter(p => p.type === selectedPlant.type && p.id !== selectedPlant.id).length} other {selectedPlant.type} plants in garden</p>
                        <p>{plants.filter(p => p.stage === selectedPlant.stage && p.id !== selectedPlant.id).length} plants at same growth stage</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedPlant(null)}
                    className="w-full px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Close Details
                  </button>
                </motion.div>
              )}


              <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 flex items-center justify-center" style={{width: `${GRID_WIDTH * CELL_SIZE + 40}px`, height: `${GRID_HEIGHT * CELL_SIZE + 40}px`}}>
                <canvas
                  ref={canvasRef}
                  width={GRID_WIDTH * CELL_SIZE}
                  height={GRID_HEIGHT * CELL_SIZE}
                  onClick={handleCanvasClick}
                  onMouseMove={handleCanvasMouseMove}
                  className="border-2 border-green-400/30 rounded-lg cursor-pointer bg-green-900/20"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {showPlantCreator && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 max-w-md w-full mx-4"
          >
            <h3 className="text-xl font-bold text-white mb-4 text-center">Create New Plant</h3>
            <p className="text-green-100 text-sm text-center mb-6">
              Position: ({pendingPlantPosition?.x}, {pendingPlantPosition?.y})
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">Plant Name</label>
                <input
                  type="text"
                  value={plantForm.name}
                  onChange={(e) => setPlantForm({...plantForm, name: e.target.value})}
                  placeholder="Enter plant name..."
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-500"
                  maxLength={100}
                />
              </div>
              
              <div>
                <label className="block text-white text-sm font-medium mb-2">Category</label>
                <select
                  value={plantForm.category}
                  onChange={(e) => setPlantForm({...plantForm, category: e.target.value})}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="" className="bg-gray-800">Select category...</option>
                  {PLANT_CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value} className="bg-gray-800">
                      {cat.label} - {cat.description}
                    </option>
                  ))}
                </select>
                {plantForm.category && (
                  <p className="text-green-200 text-xs mt-1">
                    A random {PLANT_CATEGORIES.find(c => c.value === plantForm.category)?.label.toLowerCase()} plant will be chosen
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={cancelPlantCreation}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createPlant}
                disabled={!isFormValid}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isFormValid 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                }`}
              >
                Create Plant
              </button>
            </div>
          </motion.div>
        </div>
      )}
      
      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-400"></div>
              <span className="text-white">Loading plants...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}