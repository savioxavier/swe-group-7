export type SoundType = 
  | 'ui_click'
  | 'ui_button'
  | 'ui_modal_open'
  | 'ui_modal_close'
  | 'ui_success'
  | 'ui_error'
  | 'ui_notification'
  | 'ui_hover'
  | 'ui_tab_switch'
  | 'ui_dropdown_open'
  | 'ui_dropdown_close'
  | 'ui_zoom_in'
  | 'ui_zoom_out'
  | 'plant_click'
  | 'plant_water'
  | 'plant_grow'
  | 'plant_stage_up'
  | 'plant_harvest'
  | 'plant_wilt'
  | 'task_complete'
  | 'task_create'
  | 'task_delete'
  | 'xp_gain'
  | 'achievement'
  | 'streak_milestone'
  | 'level_up'
  | 'plant_create'
  | 'background_music'

export interface AdvancedSoundConfig {
  type: string
  frequency?: number
  frequencies?: number[]
  endFrequency?: number
  duration: number
  volume: number
}

export interface SoundManager {
  playUI(type: 'click' | 'button' | 'modal_open' | 'modal_close' | 'success'): void
  playPlant(type: 'click' | 'water' | 'grow' | 'stage_up' | 'create'): void
  playAchievement(type: 'task_complete' | 'xp_gain' | 'achievement' | 'streak_milestone'): void
  startBackgroundMusic(): Promise<void>
  stopBackgroundMusic(): void
  setMasterVolume(volume: number): void
  enableDebugMode(enabled?: boolean): void
  getDebugInfo(): {
    soundCount: number
    availableSounds: string[]
    masterVolume: number
    audioEnabled: boolean
    debugMode: boolean
  }
}
