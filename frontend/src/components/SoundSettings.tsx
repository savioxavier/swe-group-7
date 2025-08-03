import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Volume2, VolumeX, Settings } from 'lucide-react'
import { useSounds } from '../lib/sounds'

interface SoundSettingsProps {
  isOpen: boolean
  onClose: () => void
}

export const SoundSettings: React.FC<SoundSettingsProps> = ({ isOpen, onClose }) => {
  const sounds = useSounds()
  const [volume, setVolume] = useState(sounds.getMasterVolume())
  const [isEnabled, setIsEnabled] = useState(sounds.isAudioEnabled())
  const [backgroundMusicEnabled, setBackgroundMusicEnabled] = useState(true)
  const [backgroundMusicVolume, setBackgroundMusicVolume] = useState(0.2)

  useEffect(() => {
    const savedVolume = localStorage.getItem('taskgarden_sound_volume')
    const savedEnabled = localStorage.getItem('taskgarden_sound_enabled')
    const bgMusicSetting = localStorage.getItem('taskgarden_background_music')
    const savedBgMusic = bgMusicSetting === null ? true : bgMusicSetting === 'true'
    const savedBgMusicVolume = localStorage.getItem('taskgarden_background_music_volume')
    
    if (savedVolume) {
      const vol = parseFloat(savedVolume)
      setVolume(vol)
      sounds.setMasterVolume(vol)
    }
    
    if (savedEnabled !== null) {
      const enabled = savedEnabled === 'true'
      setIsEnabled(enabled)
      sounds.setEnabled(enabled)
    }
    
    setBackgroundMusicEnabled(savedBgMusic)
    
    if (bgMusicSetting === null) {
      localStorage.setItem('taskgarden_background_music', 'true')
    }
    
    if (savedBgMusicVolume) {
      const bgVol = parseFloat(savedBgMusicVolume)
      setBackgroundMusicVolume(bgVol)
      sounds.setBackgroundMusicVolume(bgVol)
    }
    
    // Auto-start background music if enabled
    if (savedBgMusic && savedEnabled !== 'false') {
      setTimeout(() => sounds.startBackgroundMusic(), 1000) // Small delay to ensure audio context is ready
    }
  }, [sounds])

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume)
    sounds.setMasterVolume(newVolume)
    localStorage.setItem('taskgarden_sound_volume', newVolume.toString())
  }

  const handleEnabledChange = (enabled: boolean) => {
    setIsEnabled(enabled)
    sounds.setEnabled(enabled)
    localStorage.setItem('taskgarden_sound_enabled', enabled.toString())
    
    if (enabled) {
      sounds.playUI('success')
    }
  }

  const testSounds = () => {
    sounds.playUI('click')
    setTimeout(() => sounds.playPlant('water'), 200)
    setTimeout(() => sounds.playAchievement('xp_gain'), 400)
    setTimeout(() => sounds.playPlant('grow'), 600)
  }

  const handleBackgroundMusicToggle = () => {
    const newEnabled = !backgroundMusicEnabled
    setBackgroundMusicEnabled(newEnabled)
    
    if (newEnabled && isEnabled) {
      sounds.startBackgroundMusic()
    } else {
      sounds.stopBackgroundMusic()
    }
    
    localStorage.setItem('taskgarden_background_music', newEnabled.toString())
  }

  const handleBackgroundMusicVolumeChange = (newVolume: number) => {
    setBackgroundMusicVolume(newVolume)
    sounds.setBackgroundMusicVolume(newVolume)
    localStorage.setItem('taskgarden_background_music_volume', newVolume.toString())
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center space-x-2 mb-6">
          <Settings className="w-5 h-5 text-white" />
          <h2 className="text-xl font-bold text-white">Sound Settings</h2>
        </div>

        <div className="space-y-6">
          {/* Enable/Disable Audio */}
          <div className="flex items-center justify-between">
            <label className="text-white font-medium">Sound Effects</label>
            <button
              onClick={() => handleEnabledChange(!isEnabled)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                isEnabled 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-600 text-gray-300'
              }`}
            >
              {isEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span>{isEnabled ? 'On' : 'Off'}</span>
            </button>
          </div>

          {/* Volume Control */}
          <div className="space-y-2">
            <label className="text-white font-medium">Volume</label>
            <div className="flex items-center space-x-3">
              <VolumeX className="w-4 h-4 text-gray-400" />
              <div className="flex-1 flex items-center space-x-2">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={Math.round(volume * 100)}
                  onChange={(e) => {
                    const value = Math.max(0, Math.min(100, parseInt(e.target.value) || 0))
                    handleVolumeChange(value / 100)
                  }}
                  disabled={!isEnabled}
                  className="w-20 px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-center disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <span className="text-white text-sm">%</span>
              </div>
              <Volume2 className="w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Test Sounds */}
          <div className="text-center">
            <button
              onClick={testSounds}
              disabled={!isEnabled || volume === 0}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              Test Sounds
            </button>
          </div>

          {/* Background Music Controls */}
          <div className="space-y-4 border-t border-white/10 pt-4">
            <div className="flex items-center justify-between">
              <label className="text-white font-medium">Background Music</label>
              <button
                onClick={handleBackgroundMusicToggle}
                disabled={!isEnabled}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  backgroundMusicEnabled 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-600 text-gray-300'
                }`}
              >
                <Volume2 className="w-4 h-4" />
                <span>{backgroundMusicEnabled ? 'On' : 'Off'}</span>
              </button>
            </div>
            
            {backgroundMusicEnabled && (
                  <div className="space-y-2">
                <label className="text-white font-medium text-sm">Music Volume</label>
                <div className="flex items-center space-x-3">
                  <VolumeX className="w-4 h-4 text-gray-400" />
                  <div className="flex-1 flex items-center space-x-2">
                    <input
                      type="number"
                      min={0}
                      max={50}
                      value={Math.round((backgroundMusicVolume / 0.5) * 50)}
                      onChange={(e) => {
                        const value = Math.max(0, Math.min(50, parseInt(e.target.value) || 0))
                        handleBackgroundMusicVolumeChange((value / 50) * 0.5)
                      }}
                      disabled={!isEnabled || !backgroundMusicEnabled}
                      className="w-20 px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-center disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span className="text-white text-sm">%</span>
                  </div>
                  <Volume2 className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            )}
          </div>

          {isEnabled && volume > 0 && (
            <div className="space-y-3">
              <h3 className="text-white font-medium text-sm">Sound Categories:</h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => sounds.playUI('button')}
                  className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs rounded transition-colors"
                >
                  UI Sounds
                </button>
                <button
                  onClick={() => sounds.playPlant('water')}
                  className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs rounded transition-colors"
                >
                  Plant Actions
                </button>
                <button
                  onClick={() => sounds.playAchievement('xp_gain')}
                  className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs rounded transition-colors"
                >
                  XP & Growth
                </button>
                <button
                  onClick={() => sounds.playAchievement('achievement')}
                  className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs rounded transition-colors"
                >
                  Achievements
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Close Button */}
        <div className="flex justify-end mt-6 pt-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// Quick sound toggle component for header
export const SoundToggle: React.FC = () => {
  const sounds = useSounds()
  const [isEnabled, setIsEnabled] = useState(sounds.isAudioEnabled())

  const toggle = () => {
    const newState = !isEnabled
    setIsEnabled(newState)
    sounds.setEnabled(newState)
    localStorage.setItem('taskgarden_sound_enabled', newState.toString())
    
    if (newState) {
      sounds.playUI('success')
    }
  }

  return (
    <button
      onClick={toggle}
      className={`p-2 rounded-lg transition-colors ${
        isEnabled 
          ? 'text-green-400 hover:bg-green-400/10' 
          : 'text-gray-400 hover:bg-gray-400/10'
      }`}
      title={isEnabled ? 'Disable sound effects' : 'Enable sound effects'}
    >
      {isEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
    </button>
  )
}
