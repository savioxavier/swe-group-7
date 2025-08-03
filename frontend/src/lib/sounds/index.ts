// Re-export everything from the modular sound system
export * from './types'
export { SoundManager } from './soundManager'

// Create singleton instance
import { SoundManager } from './soundManager'
export const soundManager = new SoundManager()

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
    getBackgroundMusicVolume: soundManager.getBackgroundMusicVolume.bind(soundManager),
    setSoundEffectsVolume: soundManager.setSoundEffectsVolume.bind(soundManager),
    getSoundEffectsVolume: soundManager.getSoundEffectsVolume.bind(soundManager),
    setIsBackgroundMusicEnabled: soundManager.setIsBackgroundMusicEnabled.bind(soundManager),
    getIsBackgroundMusicEnabled: soundManager.getIsBackgroundMusicEnabled.bind(soundManager),
    setIsSoundEffectsEnabled: soundManager.setIsSoundEffectsEnabled.bind(soundManager),
    getIsSoundEffectsEnabled: soundManager.getIsSoundEffectsEnabled.bind(soundManager),
    setAudioVariationsEnabled: soundManager.setAudioVariationsEnabled.bind(soundManager),
    getAudioVariationsEnabled: soundManager.getAudioVariationsEnabled.bind(soundManager),
    play: soundManager.play.bind(soundManager)
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
  play: soundManager.play.bind(soundManager)
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
