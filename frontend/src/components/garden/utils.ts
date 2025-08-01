import type { Plant } from './constants'
import { CATEGORY_PLANTS, PLANTABLE_POSITIONS } from './constants'
import type { PlantResponse } from '../../types'

export const getRandomPlantForCategory = (category: string): string => {
  const plants = CATEGORY_PLANTS[category] || CATEGORY_PLANTS.exercise
  return plants[Math.floor(Math.random() * plants.length)]
}

export const isPositionPlantable = (x: number, y: number): boolean => {
  return PLANTABLE_POSITIONS.some(pos => pos.x === x && pos.y === y)
}

export const getNextAvailablePosition = (existingPlants: Plant[]): { x: number, y: number } | null => {
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

export const getPlantSprite = (plant: Plant, stage: number): string => {
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

export const getPlantColor = (category: string): string => {
  const colors: Record<string, string> = {
    work: '#6b7280',
    study: '#10b981',
    exercise: '#ef4444',
    creative: '#f59e0b'
  }
  return colors[category] || '#6b7280'
}

export const convertApiPlantToLocal = (apiPlant: PlantResponse): Plant => ({
    id: apiPlant.id,
    name: apiPlant.name,
    task_description: (apiPlant as PlantResponse & { task_description?: string }).task_description,
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
    task_status: ((apiPlant as PlantResponse & { task_status?: string }).task_status as Plant['task_status']) || 'active',
    completion_date: (apiPlant as PlantResponse & { completion_date?: string }).completion_date ? new Date((apiPlant as PlantResponse & { completion_date?: string }).completion_date!) : undefined
})
