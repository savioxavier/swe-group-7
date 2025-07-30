import React, { useRef, useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Plus, Leaf, Settings, LogOut, User, Zap, Info, BarChart3 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface Plant {
  id: string
  name: string
  type: 'exercise' | 'study' | 'work' | 'selfcare' | 'creative'
  x: number
  y: number
  stage: number
  lastWatered: Date
}

const mockPlants: Plant[] = [
  { id: '1', name: 'Exercise Carrot', type: 'exercise', x: 0, y: 0, stage: 4, lastWatered: new Date() },
  { id: '2', name: 'Study Tomato', type: 'study', x: 1, y: 0, stage: 3, lastWatered: new Date() },
  { id: '3', name: 'Work Wheat', type: 'work', x: 3, y: 1, stage: 2, lastWatered: new Date() },
  { id: '4', name: 'Self-care Cauliflower', type: 'selfcare', x: 6, y: 1, stage: 5, lastWatered: new Date() },
  { id: '5', name: 'Creative Sunflower', type: 'creative', x: 7, y: 2, stage: 1, lastWatered: new Date() }
]

const GRID_WIDTH = 11
const GRID_HEIGHT = 7  
const CELL_SIZE = 80

const PLANT_SPRITE_MAP: Record<string, string> = {
  exercise: 'carrot',
  study: 'tomat',
  work: 'wheat',
  selfcare: 'salad',
  creative: 'pumpkin'
}

const getPlantSprite = (plantType: string, stage: number): string => {
  const spriteType = PLANT_SPRITE_MAP[plantType] || 'carrot'
  
  const stageMap: Record<string, number[]> = {
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
  const [mode, setMode] = useState<'plant' | 'info' | 'garden'>('plant')
  const [mousePos, setMousePos] = useState<{x: number, y: number} | null>(null)
  const [hoveredPlant, setHoveredPlant] = useState<Plant | null>(null)
  const [showPlantSelector, setShowPlantSelector] = useState(false)
  const [pendingPlantPosition, setPendingPlantPosition] = useState<{x: number, y: number} | null>(null)
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
        ctx.fillText(`Stage ${plant.stage}/5`, cellX + CELL_SIZE/2, cellY + 30)
        
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
            setShowPlantSelector(true)
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

  const createPlant = (type: 'exercise' | 'study' | 'work' | 'selfcare' | 'creative') => {
    if (pendingPlantPosition) {
      const plantNames = {
        exercise: 'Carrot',
        study: 'Tomato',
        work: 'Wheat',
        selfcare: 'Salad',
        creative: 'Pumpkin'
      }

      const newPlant: Plant = {
        id: Date.now().toString(),
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${plantNames[type]}`,
        type: type,
        x: pendingPlantPosition.x,
        y: pendingPlantPosition.y,
        stage: 0,
        lastWatered: new Date()
      }
      
      setPlants([...plants, newPlant])
      setShowPlantSelector(false)
      setPendingPlantPosition(null)
    }
  }

  useEffect(() => {
    drawGarden()
  }, [drawGarden])

  useEffect(() => {
    drawGarden()
  }, [plants, drawGarden])
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
                  <span className="text-sm">Level 5</span>
                </div>
                <div className="bg-white/10 px-3 py-2 rounded">
                  <span className="text-sm">1250 XP</span>
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
                    <div className="text-2xl font-bold text-blue-400">{Math.round((plants.reduce((sum, p) => sum + p.stage, 0) / (plants.length * 5)) * 100)}%</div>
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
                            Stage {plant.stage}/5
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
                      <span className="text-sm text-green-100">{selectedPlant.stage}/5</span>
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

      {showPlantSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 max-w-md w-full mx-4"
          >
            <h3 className="text-xl font-bold text-white mb-4 text-center">Choose Plant Type</h3>
            <p className="text-green-100 text-sm text-center mb-6">
              Select what type of plant to grow at position ({pendingPlantPosition?.x}, {pendingPlantPosition?.y})
            </p>
            
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => createPlant('exercise')}
                className="flex items-center justify-between p-4 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 rounded-lg text-white transition-colors"
              >
                <div className="text-left">
                  <div className="font-medium">Exercise Carrot</div>
                  <div className="text-sm text-red-200">Physical activity tasks</div>
                </div>
                <div className="w-8 h-8 bg-red-500 rounded"></div>
              </button>
              
              <button
                onClick={() => createPlant('study')}
                className="flex items-center justify-between p-4 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg text-white transition-colors"
              >
                <div className="text-left">
                  <div className="font-medium">Study Tomato</div>
                  <div className="text-sm text-blue-200">Learning and education</div>
                </div>
                <div className="w-8 h-8 bg-blue-500 rounded"></div>
              </button>
              
              <button
                onClick={() => createPlant('work')}
                className="flex items-center justify-between p-4 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg text-white transition-colors"
              >
                <div className="text-left">
                  <div className="font-medium">Work Wheat</div>
                  <div className="text-sm text-purple-200">Professional tasks</div>
                </div>
                <div className="w-8 h-8 bg-purple-500 rounded"></div>
              </button>
              
              <button
                onClick={() => createPlant('selfcare')}
                className="flex items-center justify-between p-4 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 rounded-lg text-white transition-colors"
              >
                <div className="text-left">
                  <div className="font-medium">Self-care Salad</div>
                  <div className="text-sm text-green-200">Health and wellness</div>
                </div>
                <div className="w-8 h-8 bg-green-500 rounded"></div>
              </button>
              
              <button
                onClick={() => createPlant('creative')}
                className="flex items-center justify-between p-4 bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-500/30 rounded-lg text-white transition-colors"
              >
                <div className="text-left">
                  <div className="font-medium">Creative Pumpkin</div>
                  <div className="text-sm text-yellow-200">Arts and creativity</div>
                </div>
                <div className="w-8 h-8 bg-yellow-500 rounded"></div>
              </button>
            </div>
            
            <button
              onClick={() => {
                setShowPlantSelector(false)
                setPendingPlantPosition(null)
              }}
              className="w-full mt-4 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </motion.div>
        </div>
      )}
    </div>
  )
}