import React, { useRef, useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Plus, Leaf, Settings, LogOut, User, Zap } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface Plant {
  id: string
  name: string
  type: 'exercise' | 'study' | 'work' | 'selfcare' | 'creative'
  x: number
  y: number
  stage: number // 0-5 (seed to fully grown)
  lastWatered: Date
}

const mockPlants: Plant[] = [
  { id: '1', name: 'Exercise Carrot', type: 'exercise', x: 0, y: 0, stage: 4, lastWatered: new Date() },
  { id: '2', name: 'Study Tomato', type: 'study', x: 1, y: 0, stage: 3, lastWatered: new Date() },
  { id: '3', name: 'Work Wheat', type: 'work', x: 3, y: 1, stage: 2, lastWatered: new Date() },
  { id: '4', name: 'Self-care Cauliflower', type: 'selfcare', x: 6, y: 1, stage: 5, lastWatered: new Date() },
  { id: '5', name: 'Creative Sunflower', type: 'creative', x: 7, y: 2, stage: 1, lastWatered: new Date() }
]

const GRID_WIDTH = 9
const GRID_HEIGHT = 7  
const CELL_SIZE = 80

const PLANT_SPRITE_MAP = {
  exercise: 'carrot',
  study: 'tomat',
  work: 'wheat',
  selfcare: 'salad',
  creative: 'pumpkin'
}

const getPlantSprite = (plantType: string, stage: number): string => {
  const spriteType = PLANT_SPRITE_MAP[plantType] || 'carrot'
  
  const stageMap = {
    carrot: [1, 3, 6, 9, 12, 16],
    tomat: [1, 4, 8, 12, 16, 20],
    wheat: [1, 2, 3, 4, 6, 7],
    salad: [1, 2, 3, 4, 5, 7],
    pumpkin: [1, 4, 8, 12, 16, 20]
  }
  
  const stages = stageMap[spriteType] || stageMap.carrot
  const spriteStage = stages[Math.min(stage, stages.length - 1)]
  
  return `/assets/Sprites/${spriteType}/${spriteType}_${spriteStage}.png`
}

export default function CanvasGarden() {
  const { user, logout } = useAuth()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [plants, setPlants] = useState<Plant[]>(mockPlants)
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null)
  const [isPlanting, setIsPlanting] = useState(false)
  const [mousePos, setMousePos] = useState<{x: number, y: number} | null>(null)
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

  const getPlantSpriteImage = useCallback(async (type: string, stage: number): Promise<HTMLImageElement | null> => {
    try {
      const spritePath = getPlantSprite(type, stage)
      return await loadSprite(spritePath)
    } catch (error) {
      console.warn(`Failed to load sprite for ${type} stage ${stage}:`, error)
      return null
    }
  }, [loadSprite])

  const getPlantColor = (type: string): string => {
    const colors = {
      exercise: '#ef4444', // red
      study: '#3b82f6',   // blue
      work: '#8b5cf6',    // purple
      selfcare: '#10b981', // green
      creative: '#f59e0b'  // yellow
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
    } catch (error) {
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
    } catch (error) {
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
        const spriteImg = await getPlantSpriteImage(plant.type, plant.stage)
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
      } catch (error) {
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

      ctx.fillStyle = getPlantColor(plant.type)
      ctx.fillRect(plant.x * CELL_SIZE + 2, plant.y * CELL_SIZE + 2, 8, 8)
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
  }, [plants, selectedPlant, isPlanting, mousePos, getPlantSpriteImage, loadSprite])

  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPlanting) return
    
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    setMousePos({ x, y })
  }

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    const gridX = Math.floor(x / CELL_SIZE)
    const gridY = Math.floor(y / CELL_SIZE)

    // Allow planting anywhere on the grass grid
    if (gridX >= 0 && gridX < GRID_WIDTH && gridY >= 0 && gridY < GRID_HEIGHT) {
      if (isPlanting) {
        // Plant new seed only in garden plots
        const existingPlant = plants.find(p => p.x === gridX && p.y === gridY)
        if (!existingPlant) {
          const plantTypes = ['exercise', 'study', 'work', 'selfcare', 'creative']
          const randomType = plantTypes[Math.floor(Math.random() * plantTypes.length)]
          const newPlant: Plant = {
            id: Date.now().toString(),
            name: `${randomType.charAt(0).toUpperCase() + randomType.slice(1)} Plant`,
            type: randomType,
            x: gridX,
            y: gridY,
            stage: 0,
            lastWatered: new Date()
          }
          setPlants([...plants, newPlant])
        }
        setIsPlanting(false)
      } else {
        // Select existing plant
        const clickedPlant = plants.find(p => p.x === gridX && p.y === gridY)
        setSelectedPlant(clickedPlant || null)
      }
    } else if (!isPlanting) {
      // Deselect if clicking outside garden plots
      setSelectedPlant(null)
    }
  }

  const waterPlant = () => {
    if (selectedPlant) {
      setPlants(plants.map(p => 
        p.id === selectedPlant.id 
          ? { ...p, stage: Math.min(5, p.stage + 1), lastWatered: new Date() }
          : p
      ))
      setSelectedPlant({ ...selectedPlant, stage: Math.min(5, selectedPlant.stage + 1) })
    }
  }

  const harvestPlant = () => {
    if (selectedPlant && selectedPlant.stage >= 4) {
      setPlants(plants.filter(p => p.id !== selectedPlant.id))
      setSelectedPlant(null)
    }
  }

  useEffect(() => {
    drawGarden()
  }, [drawGarden])

  // Force redraw when plants change
  useEffect(() => {
    drawGarden()
  }, [plants, drawGarden])

  // Preload sprites for better performance
  useEffect(() => {
    const preloadSprites = async () => {
      const plantTypes = ['exercise', 'study', 'work', 'selfcare', 'creative']
      const stages = [0, 1, 2, 3, 4, 5]
      
      for (const type of plantTypes) {
        for (const stage of stages) {
          try {
            await getPlantSpriteImage(type, stage)
          } catch (error) {
            console.warn(`Failed to preload sprite for ${type} stage ${stage}`)
          }
        }
      }
    }
    
    preloadSprites()
  }, [getPlantSpriteImage])

  // Auto-grow plants over time (simulated)
  useEffect(() => {
    const interval = setInterval(() => {
      setPlants(prevPlants => 
        prevPlants.map(plant => {
          if (plant.stage < 5 && Math.random() < 0.1) {
            return { ...plant, stage: plant.stage + 1 }
          }
          return plant
        })
      )
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-700 to-green-600">
      <header className="bg-black/30 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Canvas Garden</h1>
              <p className="text-green-100 text-xs">{user?.username || user?.email}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2 text-white">
              <div className="bg-white/10 px-2 py-1 rounded flex items-center space-x-1">
                <Zap className="w-3 h-3 text-yellow-400" />
                <span className="text-sm">Level 5</span>
              </div>
              <div className="bg-white/10 px-2 py-1 rounded">
                <span className="text-sm">1250 XP</span>
              </div>
            </div>
            
            <button className="p-1 text-green-100 hover:text-white transition-colors bg-white/10 rounded">
              <Settings className="w-4 h-4" />
            </button>
            <button className="p-1 text-green-100 hover:text-white transition-colors bg-white/10 rounded">
              <User className="w-4 h-4" />
            </button>
            <button 
              onClick={logout}
              className="p-1 text-green-100 hover:text-red-300 transition-colors bg-white/10 rounded"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="relative h-[calc(100vh-60px)] overflow-hidden">
        <div className="relative z-10 h-full">
          <div className="flex gap-6 h-full p-4">
              {/* Left Panel - Controls and Stats */}
              <div className="w-64 space-y-4">
                {/* Garden Controls */}
                <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20">
                  <h3 className="text-md font-bold text-white mb-3">Controls</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => setIsPlanting(!isPlanting)}
                      className={`w-full px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        isPlanting 
                          ? 'bg-green-600 text-white' 
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      <Plus className="w-4 h-4 inline mr-1" />
                      {isPlanting ? 'Cancel' : 'Plant'}
                    </button>
                    
                    <button
                      onClick={waterPlant}
                      disabled={!selectedPlant}
                      className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:opacity-50 text-white rounded-md text-sm font-medium transition-colors"
                    >
                      Water
                    </button>
                    
                    <button
                      onClick={harvestPlant}
                      disabled={!selectedPlant || selectedPlant.stage < 4}
                      className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:opacity-50 text-white rounded-md text-sm font-medium transition-colors"
                    >
                      Harvest
                    </button>
                  </div>
                </div>

                {/* Plant Info Panel */}
                {selectedPlant && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20"
                  >
                    <h3 className="text-md font-bold text-white mb-2">{selectedPlant.name}</h3>
                    <div className="space-y-1 text-green-100 text-sm">
                      <p>Type: <span className="capitalize">{selectedPlant.type}</span></p>
                      <p>Stage: {selectedPlant.stage}/5</p>
                      <p>Position: ({selectedPlant.x}, {selectedPlant.y})</p>
                    </div>
                  </motion.div>
                )}

                {/* Garden Stats */}
                <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20">
                  <h3 className="text-md font-bold text-white mb-3">Stats</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center">
                      <div className="text-lg font-bold text-white">{plants.length}</div>
                      <div className="text-green-100 text-xs">Plants</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-white">{plants.filter(p => p.stage >= 4).length}</div>
                      <div className="text-green-100 text-xs">Ready</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-white">{plants.filter(p => p.stage === 5).length}</div>
                      <div className="text-green-100 text-xs">Grown</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-white">{Math.round((plants.reduce((sum, p) => sum + p.stage, 0) / (plants.length * 5)) * 100)}%</div>
                      <div className="text-green-100 text-xs">Progress</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Panel - Canvas */}
              <div className="flex-1 bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
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
        </div>
      </div>
    </div>
  )
}