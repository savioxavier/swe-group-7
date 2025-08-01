import React, { useRef, useEffect, useCallback } from 'react'
import type { Plant } from './constants'
import { GRID_WIDTH, GRID_HEIGHT, CELL_SIZE, PLANTABLE_POSITIONS } from './constants'
import { getPlantSprite, getPlantColor, isPositionPlantable } from './utils'

interface GardenCanvasProps {
  plants: Plant[]
  selectedPlant: Plant | null
  hoveredPlant: Plant | null
  mode: 'plant' | 'info' | 'tasks'
  mousePos: { x: number, y: number } | null
  onCanvasClick: (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => void
  onCanvasMouseMove: (event: React.MouseEvent<HTMLCanvasElement>) => void
  onLoadSprite: (spritePath: string) => Promise<HTMLImageElement>
}

export const GardenCanvas: React.FC<GardenCanvasProps> = ({
  plants,
  selectedPlant,
  hoveredPlant,
  mode,
  mousePos,
  onCanvasClick,
  onCanvasMouseMove,
  onLoadSprite
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const getPlantSpriteImage = useCallback(async (plant: Plant, stage: number): Promise<HTMLImageElement | null> => {
    try {
      const spritePath = getPlantSprite(plant, stage)
      return await onLoadSprite(spritePath)
    } catch (error) {
      console.warn(`Failed to load sprite for ${plant.type} stage ${stage}:`, error)
      return null
    }
  }, [onLoadSprite])

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

  const drawGarden = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Draw grass background
    try {
      const grassImg = await onLoadSprite('/assets/Sprites/terrain/grass.png')
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

    // Draw plantable positions in plant mode
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

    // Draw dirt for planted areas
    try {
      const dirtImg = await onLoadSprite('/assets/Sprites/terrain/dirt.png')
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

    // Draw plants
    for (const plant of plants) {
      const centerX = plant.x * CELL_SIZE + CELL_SIZE / 2
      const centerY = plant.y * CELL_SIZE + CELL_SIZE / 2

      // Draw golden glow effect if plant should glow
      if (plant.shouldGlow) {
        ctx.save()
        
        // Create radial gradient for glow
        const glowRadius = CELL_SIZE * 0.8
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, glowRadius)
        gradient.addColorStop(0, 'rgba(255, 215, 0, 0.6)')
        gradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.3)')
        gradient.addColorStop(0.7, 'rgba(255, 215, 0, 0.1)')
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0)')
        
        // Draw glow background
        ctx.fillStyle = gradient
        ctx.fillRect(centerX - glowRadius, centerY - glowRadius, glowRadius * 2, glowRadius * 2)
        
        // Add shadow effects
        ctx.shadowColor = 'rgba(255, 215, 0, 0.8)'
        ctx.shadowBlur = 20
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 0
        
        // Draw pulsing ring
        const time = Date.now() * 0.003
        const pulseScale = 0.9 + Math.sin(time) * 0.2
        const ringRadius = (CELL_SIZE * 0.5) * pulseScale
        
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)'
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2)
        ctx.stroke()
        
        ctx.restore()
      }

      try {
        const spriteImg = await getPlantSpriteImage(plant, plant.animationStage || plant.stage)
        if (spriteImg) {
          ctx.save()
          
          // Add golden filter if plant should glow
          if (plant.shouldGlow) {
            ctx.filter = 'contrast(1.4) saturate(1.4) brightness(1.3) drop-shadow(0 0 10px rgba(255, 215, 0, 0.8))'
          } else if (plant.decay_status === 'wilted') {
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

      // Plant selection highlight
      if (selectedPlant?.id === plant.id) {
        ctx.strokeStyle = '#fbbf24'
        ctx.lineWidth = 3
        ctx.strokeRect(plant.x * CELL_SIZE + 1, plant.y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2)
      }

      // Plant hover highlight in info mode
      if (hoveredPlant?.id === plant.id && mode === 'info') {
        ctx.strokeStyle = '#06b6d4'
        ctx.lineWidth = 2
        ctx.strokeRect(plant.x * CELL_SIZE + 1, plant.y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2)
      }

      // Plant category indicator
      ctx.fillStyle = getPlantColor(plant.type)
      ctx.fillRect(plant.x * CELL_SIZE + 2, plant.y * CELL_SIZE + 2, 8, 8)

      // Plant info overlay in info mode
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

    // Plant mode hover preview
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

    // Tasks mode hover overlay
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
  }, [plants, selectedPlant, mousePos, hoveredPlant, mode, getPlantSpriteImage, onLoadSprite])

  useEffect(() => {
    drawGarden()
  }, [drawGarden])

  // Animation timer for glow effects
  useEffect(() => {
    const hasGlowingPlants = plants.some(plant => plant.shouldGlow)
    
    if (hasGlowingPlants) {
      const animationInterval = setInterval(() => {
        drawGarden()
      }, 100) // Redraw every 100ms for smooth glow animation
      
      return () => clearInterval(animationInterval)
    }
  }, [plants, drawGarden])

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 flex items-center justify-center garden-canvas" style={{width: `${GRID_WIDTH * CELL_SIZE + 40}px`, height: `${GRID_HEIGHT * CELL_SIZE + 40}px`}}>
      <canvas
        ref={canvasRef}
        width={GRID_WIDTH * CELL_SIZE}
        height={GRID_HEIGHT * CELL_SIZE}
        onClick={onCanvasClick}
        onTouchStart={onCanvasClick}
        onMouseMove={onCanvasMouseMove}
        className="border-2 border-green-400/30 rounded-lg cursor-pointer bg-green-900/20"
        style={{ touchAction: 'manipulation' }}
      />
    </div>
  )
}
