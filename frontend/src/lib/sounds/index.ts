// Re-export everything from the modular sound system
export * from './types'
export { SoundManager } from './soundManager'

// Create singleton instance
import { SoundManager } from './soundManager'
export const soundManager = new SoundManager()

// Global sound controls for development/debugging
const createGlobalSoundControls = () => {
  if (typeof window === 'undefined') return {}

  return {
    enableDebug: () => soundManager.enableDebugMode(true),
    disableDebug: () => soundManager.enableDebugMode(false),
    setVolume: (volume: number) => soundManager.setMasterVolume(volume),
    testUI: () => soundManager.playUI('click'),
    testPlant: () => soundManager.playPlant('click'),
    testAchievement: () => soundManager.playAchievement('xp_gain'),
    initializeAudio: () => soundManager.initializeAudio(),
    startBackgroundMusic: () => soundManager.startBackgroundMusic(),
    stopBackgroundMusic: () => soundManager.stopBackgroundMusic(),
    testBackgroundMusic: () => {
      console.log('Testing background music...')
      const music = soundManager.getBackgroundMusic()
      if (music) {
        console.log('Background music found:', {
          playing: music.playing(),
          volume: music.volume(),
          state: music.state ? music.state() : 'unknown'
        })
        soundManager.startBackgroundMusic()
      } else {
        console.log('Background music not found in sound manager')
        console.log('Available sounds:', soundManager.getDebugInfo().availableSounds)
      }
    },
    testAllSounds: () => {
      console.log('Testing all sound categories...')
      soundManager.playUI('click')
      setTimeout(() => soundManager.playPlant('water'), 200)
      setTimeout(() => soundManager.playAchievement('xp_gain'), 400)
      setTimeout(() => soundManager.playPlant('grow'), 600)
    },
    getDebugInfo: () => soundManager.getDebugInfo()
  }
}

// Make global controls available
if (typeof window !== 'undefined') {
  ;(window as unknown as { TaskGardenSounds: ReturnType<typeof createGlobalSoundControls> }).TaskGardenSounds = createGlobalSoundControls()
}

// Hook for React components
export const useSounds = () => {
  return {
    playUI: soundManager.playUI.bind(soundManager),
    playPlant: soundManager.playPlant.bind(soundManager),
    playAchievement: soundManager.playAchievement.bind(soundManager),
    playGrowthSequence: soundManager.playGrowthSequence.bind(soundManager),
    playXPGainSequence: soundManager.playXPGainSequence.bind(soundManager),
    startBackgroundMusic: soundManager.startBackgroundMusic.bind(soundManager),
    stopBackgroundMusic: soundManager.stopBackgroundMusic.bind(soundManager),
    playBackgroundMusic: soundManager.startBackgroundMusic.bind(soundManager),
    setMasterVolume: soundManager.setMasterVolume.bind(soundManager),
    getMasterVolume: soundManager.getMasterVolume.bind(soundManager),
    setEnabled: soundManager.setEnabled.bind(soundManager),
    isAudioEnabled: soundManager.isAudioEnabled.bind(soundManager),
    setBackgroundMusicVolume: soundManager.setBackgroundMusicVolume.bind(soundManager),
    play: soundManager.play.bind(soundManager),
    enableDebugMode: soundManager.enableDebugMode.bind(soundManager),
    getDebugInfo: soundManager.getDebugInfo.bind(soundManager)
  }
}

// Main export for backward compatibility
export const sounds = {
  playUI: soundManager.playUI.bind(soundManager),
  playPlant: soundManager.playPlant.bind(soundManager),
  playAchievement: soundManager.playAchievement.bind(soundManager),
  playGrowthSequence: soundManager.playGrowthSequence.bind(soundManager),
  playXPGainSequence: soundManager.playXPGainSequence.bind(soundManager),
  startBackgroundMusic: soundManager.startBackgroundMusic.bind(soundManager),
  stopBackgroundMusic: soundManager.stopBackgroundMusic.bind(soundManager),
  playBackgroundMusic: soundManager.startBackgroundMusic.bind(soundManager),
  setMasterVolume: soundManager.setMasterVolume.bind(soundManager),
  getMasterVolume: soundManager.getMasterVolume.bind(soundManager),
  setEnabled: soundManager.setEnabled.bind(soundManager),
  isAudioEnabled: soundManager.isAudioEnabled.bind(soundManager),
  setBackgroundMusicVolume: soundManager.setBackgroundMusicVolume.bind(soundManager),
  play: soundManager.play.bind(soundManager),
  enableDebugMode: soundManager.enableDebugMode.bind(soundManager),
  getDebugInfo: soundManager.getDebugInfo.bind(soundManager)
}

// Default export for compatibility
export default sounds

// Auto-enable audio on first user interaction
if (typeof window !== 'undefined') {
  const enableAudioOnInteraction = async () => {
    try {
      await soundManager.initializeAudio()
      
      const backgroundMusicEnabled = localStorage.getItem('taskgarden_background_music') === 'true'
      if (backgroundMusicEnabled) {
        setTimeout(() => {
          soundManager.startBackgroundMusic()
        }, 500)
      }
    } catch {
      // Audio context initialization failed - this is expected in some browsers
    }
  }

  const events = ['click', 'touchstart', 'keydown']
  
  const handleInteraction = () => {
    enableAudioOnInteraction()
    events.forEach(event => {
      document.removeEventListener(event, handleInteraction)
    })
  }

  events.forEach(event => {
    document.addEventListener(event, handleInteraction, { once: true })
  })
}
