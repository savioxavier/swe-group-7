import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Volume2, Settings, Music } from 'lucide-react'

interface AudioSettingsProps {
  isOpen: boolean
  onToggle: () => void
  sounds: {
    getMasterVolume: () => number
    setMasterVolume: (volume: number) => void
    getBackgroundMusicVolume: () => number
    setBackgroundMusicVolume: (volume: number) => void
    getSoundEffectsVolume: () => number
    setSoundEffectsVolume: (volume: number) => void
    getIsBackgroundMusicEnabled: () => boolean
    setIsBackgroundMusicEnabled: (enabled: boolean) => void
    getIsSoundEffectsEnabled: () => boolean
    setIsSoundEffectsEnabled: (enabled: boolean) => void
    getAudioVariationsEnabled: () => boolean
    setAudioVariationsEnabled: (enabled: boolean) => void
  }
}

export const AudioSettings: React.FC<AudioSettingsProps> = ({ isOpen, onToggle, sounds }) => {
  const [masterVolume, setMasterVolume] = useState(sounds.getMasterVolume())
  const [backgroundMusicVolume, setBackgroundMusicVolume] = useState(sounds.getBackgroundMusicVolume())
  const [soundEffectsVolume, setSoundEffectsVolume] = useState(sounds.getSoundEffectsVolume())
  const [masterVolumeEnabled, setMasterVolumeEnabled] = useState(true)
  const [backgroundMusicEnabled, setBackgroundMusicEnabled] = useState(sounds.getIsBackgroundMusicEnabled())
  const [soundEffectsEnabled, setSoundEffectsEnabled] = useState(sounds.getIsSoundEffectsEnabled())
  const [audioVariationsEnabled, setAudioVariationsEnabled] = useState(sounds.getAudioVariationsEnabled())

  // Update local state when sound settings change
  useEffect(() => {
    const interval = setInterval(() => {
      setMasterVolume(sounds.getMasterVolume())
      setBackgroundMusicVolume(sounds.getBackgroundMusicVolume())
      setSoundEffectsVolume(sounds.getSoundEffectsVolume())
      setBackgroundMusicEnabled(sounds.getIsBackgroundMusicEnabled())
      setSoundEffectsEnabled(sounds.getIsSoundEffectsEnabled())
      setAudioVariationsEnabled(sounds.getAudioVariationsEnabled())
    }, 1000)

    return () => clearInterval(interval)
  }, [sounds])

  const handleMasterVolumeChange = (value: number) => {
    setMasterVolume(value)
    sounds.setMasterVolume(value)
  }

  const handleMasterVolumeToggle = () => {
    const newEnabled = !masterVolumeEnabled
    setMasterVolumeEnabled(newEnabled)
    if (!newEnabled) {
      sounds.setMasterVolume(0)
    } else {
      sounds.setMasterVolume(masterVolume)
    }
  }

  const handleBackgroundMusicVolumeChange = (value: number) => {
    setBackgroundMusicVolume(value)
    sounds.setBackgroundMusicVolume(value)
  }

  const handleSoundEffectsVolumeChange = (value: number) => {
    setSoundEffectsVolume(value)
    sounds.setSoundEffectsVolume(value)
  }

  const handleBackgroundMusicToggle = () => {
    const newEnabled = !backgroundMusicEnabled
    setBackgroundMusicEnabled(newEnabled)
    sounds.setIsBackgroundMusicEnabled(newEnabled)
  }

  const handleSoundEffectsToggle = () => {
    const newEnabled = !soundEffectsEnabled
    setSoundEffectsEnabled(newEnabled)
    sounds.setIsSoundEffectsEnabled(newEnabled)
  }

  const handleAudioVariationsToggle = () => {
    const newEnabled = !audioVariationsEnabled
    setAudioVariationsEnabled(newEnabled)
    sounds.setAudioVariationsEnabled(newEnabled)
  }

  const VolumeSlider = ({ 
    label, 
    icon: Icon, 
    value, 
    onChange, 
    enabled = true,
    onToggle
  }: {
    label: string
    icon: React.ComponentType<{ className?: string }>
    value: number
    onChange: (value: number) => void
    enabled?: boolean
    onToggle?: () => void
  }) => {
    const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      if (!enabled) return
      const newValue = Math.max(0, Math.min(100, parseInt(e.target.value) || 0))
      onChange(newValue / 100)
    }, [enabled, onChange])

    return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1.5">
          <Icon className="w-3.5 h-3.5 text-white/80" />
          <span className="text-xs text-white/90 font-medium">{label}</span>
        </div>
        {onToggle && (
          <button
            onClick={onToggle}
            className={`w-7 h-3.5 rounded-full transition-colors ${
              enabled ? 'bg-green-500' : 'bg-white/20'
            }`}
          >
            <div
              className={`w-2.5 h-2.5 rounded-full bg-white transition-transform ${
                enabled ? 'translate-x-3.5' : 'translate-x-0.5'
              }`}
            />
          </button>
        )}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1.5">
          <input
            type="number"
            min="0"
            max="100"
            value={Math.round(value * 100)}
            onChange={handleSliderChange}
            disabled={!enabled}
            className="w-12 px-1.5 py-0.5 bg-white/10 border border-white/20 rounded text-white text-center text-xs disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <span className="text-xs text-white/60">%</span>
        </div>
      </div>
    </div>
    )
  }

  return (
    <div className="relative z-50">
      {/* Toggle Button */}
      <motion.button
        onClick={onToggle}
        className="bg-white/10 hover:bg-white/20 rounded-lg p-2 border border-white/20 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Settings className="w-5 h-5 text-white" />
      </motion.button>

      {/* Settings Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Invisible overlay to close on outside click */}
            <div 
              className="fixed inset-0 z-40"
              onClick={onToggle}
            />
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute top-12 right-0 bg-black/90 backdrop-blur-sm rounded-xl border border-white/20 p-3 w-72 shadow-2xl z-50"
              onClick={(e) => e.stopPropagation()}
            >
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-center space-x-2 border-b border-white/20 pb-2">
                <Settings className="w-4 h-4 text-white" />
                <h3 className="text-white font-semibold text-sm">Audio Settings</h3>
              </div>

              {/* Master Volume */}
              <VolumeSlider
                label="Master Volume"
                icon={Volume2}
                value={masterVolume}
                onChange={handleMasterVolumeChange}
                enabled={masterVolumeEnabled}
                onToggle={handleMasterVolumeToggle}
              />

              {/* Background Music */}
              <VolumeSlider
                label="Background Music"
                icon={Music}
                value={backgroundMusicVolume}
                onChange={handleBackgroundMusicVolumeChange}
                enabled={backgroundMusicEnabled}
                onToggle={handleBackgroundMusicToggle}
              />

              {/* Sound Effects */}
              <VolumeSlider
                label="Sound Effects"
                icon={Volume2}
                value={soundEffectsVolume}
                onChange={handleSoundEffectsVolumeChange}
                enabled={soundEffectsEnabled}
                onToggle={handleSoundEffectsToggle}
              />

              {/* Audio Variations */}
              <div className="space-y-1.5 pt-2 border-t border-white/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <Music className="w-3.5 h-3.5 text-white/80" />
                    <span className="text-xs text-white/90 font-medium">Audio Variations</span>
                  </div>
                  <button
                    onClick={handleAudioVariationsToggle}
                    className={`w-7 h-3.5 rounded-full transition-colors ${
                      audioVariationsEnabled ? 'bg-green-500' : 'bg-white/20'
                    }`}
                  >
                    <div
                      className={`w-2.5 h-2.5 rounded-full bg-white transition-transform ${
                        audioVariationsEnabled ? 'translate-x-3.5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-xs text-white/50 leading-tight">
                  Randomize pitch, bass, and effects on each loop
                </p>
              </div>

              {/* Quick Actions */}
              <div className="pt-2 border-t border-white/20">
                <button
                  onClick={() => {
                    handleMasterVolumeChange(0.7)
                    setMasterVolumeEnabled(true)
                    setBackgroundMusicEnabled(true)
                    sounds.setIsBackgroundMusicEnabled(true)
                    setSoundEffectsEnabled(true)
                    sounds.setIsSoundEffectsEnabled(true)
                  }}
                  className="w-full px-2 py-1.5 bg-green-500/20 hover:bg-green-500/30 rounded text-green-200 text-xs font-medium transition-colors"
                >
                  Reset to Default
                </button>
              </div>
            </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}