export interface ModeSystemBenefits {
  plantMode: {
    name: string
    description: string
    bonuses: {
      growthRateMultiplier: number
      xpBonusPercentage: number
      specialAbilities: string[]
    }
  }
  infoMode: {
    name: string
    description: string
    features: {
      advancedAnalytics: boolean
      predictiveInsights: boolean
      detailedMetrics: string[]
    }
  }
  tasksMode: {
    name: string
    description: string
    enhancements: {
      quickActions: boolean
      streamlinedWorkflow: boolean
      focusFeatures: string[]
    }
  }
}

export const MODE_SYSTEM: ModeSystemBenefits = {
  plantMode: {
    name: "Garden Mode",
    description: "Enhanced planting with growth bonuses & advanced breeding",
    bonuses: {
      growthRateMultiplier: 1.25,
      xpBonusPercentage: 15,
      specialAbilities: [
        "25% faster plant growth",
        "15% bonus XP from all activities",
        "Access to rare plant varieties",
        "Plant breeding combinations",
        "Auto-water nearby plants"
      ]
    }
  },
  infoMode: {
    name: "Analytics Mode", 
    description: "Deep insights, growth analytics & performance metrics",
    features: {
      advancedAnalytics: true,
      predictiveInsights: true,
      detailedMetrics: [
        "Growth prediction timelines",
        "Productivity heat maps",
        "Optimal planting suggestions",
        "Performance trend analysis",
        "Garden efficiency scoring"
      ]
    }
  },
  tasksMode: {
    name: "Focus Mode",
    description: "Streamlined productivity & enhanced task management",
    enhancements: {
      quickActions: true,
      streamlinedWorkflow: true,
      focusFeatures: [
        "One-click task logging",
        "Distraction-free interface", 
        "Smart task suggestions",
        "Progress streak tracking",
        "Pomodoro timer integration"
      ]
    }
  }
}

export function getPlantGrowthMultiplier(mode: 'plant' | 'info' | 'tasks'): number {
  return mode === 'plant' ? MODE_SYSTEM.plantMode.bonuses.growthRateMultiplier : 1.0
}

export function getXPMultiplier(mode: 'plant' | 'info' | 'tasks'): number {
  return mode === 'plant' ? 1 + (MODE_SYSTEM.plantMode.bonuses.xpBonusPercentage / 100) : 1.0
}

export function getModeFeatures(mode: 'plant' | 'info' | 'tasks'): string[] {
  switch (mode) {
    case 'plant':
      return MODE_SYSTEM.plantMode.bonuses.specialAbilities
    case 'info':
      return MODE_SYSTEM.infoMode.features.detailedMetrics
    case 'tasks':
      return MODE_SYSTEM.tasksMode.enhancements.focusFeatures
    default:
      return []
  }
}

export function shouldShowAdvancedAnalytics(mode: 'plant' | 'info' | 'tasks'): boolean {
  return mode === 'info'
}

export function shouldShowQuickActions(mode: 'plant' | 'info' | 'tasks'): boolean {
  return mode === 'tasks'
}

export function getModeSpecificPlantActions(mode: 'plant' | 'info' | 'tasks'): string[] {
  switch (mode) {
    case 'plant':
      return [
        'Plant nearby',
        'Breed new variety',
        'Auto-water setup',
        'Growth boost'
      ]
    case 'info':
      return [
        'View analytics',
        'Growth predictions',
        'Performance metrics',
        'Optimization tips'
      ]
    case 'tasks':
      return [
        'Quick log work',
        'Mark milestone',
        'Set reminder',
        'Track progress'
      ]
    default:
      return []
  }
}
