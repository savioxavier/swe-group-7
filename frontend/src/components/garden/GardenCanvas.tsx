import React, { useRef, useEffect, useCallback, useState } from 'react'
import type { Plant } from './constants'
import { GRID_WIDTH, GRID_HEIGHT, CELL_SIZE, PLANTABLE_POSITIONS } from './constants'
import { getPlantSprite, getPlantColor, isPositionPlantable } from './utils'

interface GardenCanvasProps {
  plants: Plant[]
  selectedPlant: Plant | null
  hoveredPlant: Plant | null
  mousePos: { x: number, y: number } | null
  onCanvasClick: (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => void
  onCanvasMouseMove: (event: React.MouseEvent<HTMLCanvasElement>) => void
  onLoadSprite: (spritePath: string) => Promise<HTMLImageElement>
}

interface Dimensions {
  containerWidth: number
  containerHeight: number
  canvasWidth: number
  canvasHeight: number
  scale: number
}

export const GardenCanvas: React.FC<GardenCanvasProps> = ({
  plants,
  selectedPlant,
  hoveredPlant,
  mousePos,
  onCanvasClick,
  onCanvasMouseMove,
  onLoadSprite
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number | undefined>(undefined)
  
  const [dimensions, setDimensions] = useState<Dimensions>({
    containerWidth: GRID_WIDTH * CELL_SIZE + 40,
    containerHeight: GRID_HEIGHT * CELL_SIZE + 40,
    canvasWidth: GRID_WIDTH * CELL_SIZE,
    canvasHeight: GRID_HEIGHT * CELL_SIZE,
    scale: 1
  })

  const calculateResponsiveDimensions = useCallback(() => {
    if (typeof window === 'undefined') return

    const originalCanvasWidth = GRID_WIDTH * CELL_SIZE
    const originalCanvasHeight = GRID_HEIGHT * CELL_SIZE
    const containerPadding = 40
    
    const containerWidth = originalCanvasWidth + containerPadding
    const containerHeight = originalCanvasHeight + containerPadding
    
    const availableWidth = window.innerWidth - 32
    const availableHeight = window.innerHeight - 140
    
    const scaleForWidth = availableWidth / containerWidth
    const scaleForHeight = availableHeight / containerHeight
    const scale = Math.min(scaleForWidth, scaleForHeight, 1)
    
    const finalScale = Math.max(scale, 0.4)
    
    setDimensions({
      containerWidth: containerWidth * finalScale,
      containerHeight: containerHeight * finalScale,
      canvasWidth: originalCanvasWidth,
      canvasHeight: originalCanvasHeight,
      scale: finalScale
    })
  }, [])

  const getPlantSpriteImage = useCallback(async (plant: Plant, stage: number): Promise<HTMLImageElement | null> => {
    try {
      const spritePath = getPlantSprite(plant, stage)
      return await onLoadSprite(spritePath)
    } catch (error) {
      console.warn(`Failed to load sprite for ${plant.type} stage ${stage}:`, error)
      return null
    }
  }, [onLoadSprite])

  const drawGrassBackground = useCallback(async (ctx: CanvasRenderingContext2D) => {
    try {
      const grassImg = await onLoadSprite('/assets/Sprites/terrain/grass.png')
      if (!grassImg) throw new Error('Grass image failed to load')

      for (let x = 0; x < GRID_WIDTH; x++) {
        for (let y = 0; y < GRID_HEIGHT; y++) {
          ctx.drawImage(grassImg, x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE)
          
          // Add grid lines for visual separation
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
    } catch {
      // Fallback grass pattern
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
  }, [onLoadSprite])

  const drawPlantablePositions = useCallback((ctx: CanvasRenderingContext2D) => {
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
  }, [plants])

  const drawDirtAreas = useCallback(async (ctx: CanvasRenderingContext2D) => {
    try {
      const dirtImg = await onLoadSprite('/assets/Sprites/terrain/dirt.png')
      if (!dirtImg) throw new Error('Dirt image failed to load')

      plants.forEach(plant => {
        const plantX = plant.x * CELL_SIZE
        const plantY = plant.y * CELL_SIZE
        ctx.drawImage(dirtImg, plantX, plantY, CELL_SIZE, CELL_SIZE)
        
        // Add dirt texture details
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
    } catch {
      // Fallback dirt pattern
      plants.forEach(plant => {
        const plantX = plant.x * CELL_SIZE
        const plantY = plant.y * CELL_SIZE
        ctx.fillStyle = '#8B4513'
        ctx.fillRect(plantX, plantY, CELL_SIZE, CELL_SIZE)
      })
    }
  }, [plants, onLoadSprite])

  const drawPlantGlowEffect = useCallback((ctx: CanvasRenderingContext2D, centerX: number, centerY: number) => {
    ctx.save()
    
    const glowRadius = CELL_SIZE * 0.8
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, glowRadius)
    gradient.addColorStop(0, 'rgba(255, 215, 0, 0.6)')
    gradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.3)')
    gradient.addColorStop(0.7, 'rgba(255, 215, 0, 0.1)')
    gradient.addColorStop(1, 'rgba(255, 215, 0, 0)')
    
    ctx.fillStyle = gradient
    ctx.fillRect(centerX - glowRadius, centerY - glowRadius, glowRadius * 2, glowRadius * 2)
    
    // Animated pulsing ring
    const time = Date.now() * 0.003
    const pulseScale = 0.9 + Math.sin(time) * 0.2
    const ringRadius = (CELL_SIZE * 0.5) * pulseScale
    
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)'
    ctx.lineWidth = 3
    ctx.shadowColor = 'rgba(255, 215, 0, 0.8)'
    ctx.shadowBlur = 20
    ctx.beginPath()
    ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2)
    ctx.stroke()
    
    ctx.restore()
  }, [])

  const drawPlant = useCallback(async (ctx: CanvasRenderingContext2D, plant: Plant) => {
    const centerX = plant.x * CELL_SIZE + CELL_SIZE / 2
    const centerY = plant.y * CELL_SIZE + CELL_SIZE / 2

    // Draw glow effect for glowing plants
    if (plant.shouldGlow) {
      drawPlantGlowEffect(ctx, centerX, centerY)
    }

    try {
      const spriteImg = await getPlantSpriteImage(plant, plant.animationStage || plant.stage)
      if (spriteImg) {
        ctx.save()
        
        // Apply visual filters based on plant state
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
        // Fallback plant rendering
        ctx.fillStyle = getPlantColor(plant.type)
        ctx.beginPath()
        ctx.arc(centerX, centerY, 16 + (plant.animationStage || plant.stage) * 4, 0, 2 * Math.PI)
        ctx.fill()
      }
    } catch {
      // Fallback plant rendering
      ctx.fillStyle = getPlantColor(plant.type)
      ctx.beginPath()
      ctx.arc(centerX, centerY, 16 + (plant.animationStage || plant.stage) * 4, 0, 2 * Math.PI)
      ctx.fill()
    }

    // Plant category indicator
    ctx.fillStyle = getPlantColor(plant.type)
    ctx.fillRect(plant.x * CELL_SIZE + 2, plant.y * CELL_SIZE + 2, 8, 8)
  }, [getPlantSpriteImage, drawPlantGlowEffect])

  const drawPlantOverlays = useCallback((ctx: CanvasRenderingContext2D) => {
    plants.forEach(plant => {
      // Selection highlight
      if (selectedPlant?.id === plant.id) {
        ctx.strokeStyle = '#fbbf24'
        ctx.lineWidth = 3
        ctx.strokeRect(plant.x * CELL_SIZE + 1, plant.y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2)
      }

      // Hover highlight
      if (hoveredPlant?.id === plant.id) {
        ctx.strokeStyle = '#06b6d4'
        ctx.lineWidth = 2
        ctx.strokeRect(plant.x * CELL_SIZE + 1, plant.y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2)
      }
    })
  }, [plants, selectedPlant, hoveredPlant])

  const drawInteractionOverlays = useCallback((ctx: CanvasRenderingContext2D) => {
    // Hover preview for planting
    if (mousePos) {
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
  }, [mousePos, plants])

  const drawGarden = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Draw all garden layers in order
    await drawGrassBackground(ctx)
    drawPlantablePositions(ctx)
    await drawDirtAreas(ctx)
    
    // Draw all plants
    for (const plant of plants) {
      await drawPlant(ctx, plant)
    }
    
    drawPlantOverlays(ctx)
    drawInteractionOverlays(ctx)
  }, [drawGrassBackground, drawPlantablePositions, drawDirtAreas, drawPlant, drawPlantOverlays, drawInteractionOverlays, plants])

  // Resize handler
  useEffect(() => {
    calculateResponsiveDimensions()
    
    const handleResize = () => calculateResponsiveDimensions()
    
    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)
    
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
    }
  }, [calculateResponsiveDimensions])

  // Garden redraw effect
  useEffect(() => {
    drawGarden()
  }, [drawGarden, dimensions])

  // Smooth animation loop for glowing plants
  useEffect(() => {
    const hasGlowingPlants = plants.some(plant => plant.shouldGlow)
    
    if (hasGlowingPlants) {
      const animate = () => {
        drawGarden()
        animationFrameRef.current = requestAnimationFrame(animate)
      }
      animationFrameRef.current = requestAnimationFrame(animate)
      
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
      }
    }
  }, [plants, drawGarden])

  return (
    <div 
      className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 flex items-center justify-center transition-all duration-300 mx-auto"
      style={{
        width: `${dimensions.containerWidth}px`, 
        height: `${dimensions.containerHeight}px`,
        maxWidth: '100vw',
        maxHeight: '100vh'
      }}
    >
      <canvas
        ref={canvasRef}
        width={dimensions.canvasWidth}
        height={dimensions.canvasHeight}
        onClick={onCanvasClick}
        onTouchStart={onCanvasClick}
        onMouseMove={onCanvasMouseMove}
        className="border-2 border-green-400/30 rounded-lg cursor-pointer bg-green-900/20"
        style={{ 
          touchAction: 'manipulation',
          width: `${dimensions.canvasWidth * dimensions.scale}px`,
          height: `${dimensions.canvasHeight * dimensions.scale}px`,
          transform: 'translateZ(0)',
          imageRendering: dimensions.scale < 1 ? 'auto' : 'pixelated',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none'
        }}
      />
    </div>
  )
}