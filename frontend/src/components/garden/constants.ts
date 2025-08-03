import type { TaskStep } from '../../types'

// Garden configuration - optimized for all screen sizes
export const GRID_WIDTH = 6
export const GRID_HEIGHT = 5  
export const CELL_SIZE = 120

export const PLANTABLE_POSITIONS = [
  { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 },
  { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }, { x: 4, y: 1 }, { x: 5, y: 1 },
  { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 }, { x: 4, y: 2 }, { x: 5, y: 2 },
  { x: 0, y: 3 }, { x: 1, y: 3 }, { x: 2, y: 3 }, { x: 3, y: 3 }, { x: 4, y: 3 }, { x: 5, y: 3 },
  { x: 1, y: 4 }, { x: 2, y: 4 }, { x: 3, y: 4 }, { x: 4, y: 4 }
]

export const CATEGORY_PLANTS: Record<string, string[]> = {
  work: ['corn', 'wheat', 'potato', 'onion'],
  study: ['cabbage', 'spinach', 'salad', 'peas'],
  exercise: ['carrot', 'beet', 'radish', 'cucumber'],
  creative: ['tomat', 'eggplant', 'pepper', 'pumpkin', 'watermelon']
}

export const PRODUCTIVITY_CATEGORIES = [
  { value: 'work', label: 'Work', description: 'Professional and business tasks' },
  { value: 'study', label: 'Study', description: 'Learning and education' },
  { value: 'exercise', label: 'Exercise', description: 'Physical fitness and health' },
  { value: 'creative', label: 'Creative', description: 'Arts and creative projects' }
]

export interface Plant {
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
  shouldGlow?: boolean
  task_steps?: TaskStep[]
  is_multi_step?: boolean
  completed_steps?: number
  total_steps?: number
}
