import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Volume2, VolumeX, Settings } from 'lucide-react'

interface FloatingSoundButtonProps {
  sounds: {
    getMasterVolume: () => number
    setMasterVolume: (volume: number) => void
    isAudioEnabled: () => boolean
    setEnabled: (enabled: boolean) => void
  }
  onOpenFullSettings: () => void
}

export const FloatingSoundButton: React.FC<FloatingSoundButtonProps> = ({ 
  sounds, 
  onOpenFullSettings 
}) => {
  const [showQuickControls, setShowQuickControls] = useState(false)
  const [volume, setVolume] = useState(sounds.getMasterVolume())
  const [isEnabled, setIsEnabled] = useState(sounds.isAudioEnabled())
  const [isInteracting, setIsInteracting] = useState(false)

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume)
    sounds.setMasterVolume(newVolume)
    if (newVolume > 0 && !isEnabled) {
      setIsEnabled(true)
      sounds.setEnabled(true)
    }
  }

  const toggleMute = () => {
    const newEnabled = !isEnabled
    setIsEnabled(newEnabled)
    sounds.setEnabled(newEnabled)
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <div 
        className="relative"
        onMouseLeave={() => {
          // Only close if not actively interacting
          if (!isInteracting) {
            setTimeout(() => setShowQuickControls(false), 300)
          }
        }}
      >
        {/* Main Sound Button */}
        <motion.button
          onClick={() => setShowQuickControls(!showQuickControls)}
          className="w-12 h-12 bg-green-600/80 hover:bg-green-500/90 backdrop-blur-sm rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-200"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Sound settings"
        >
          {isEnabled ? (
            <Volume2 className="w-5 h-5" />
          ) : (
            <VolumeX className="w-5 h-5" />
          )}
        </motion.button>

        {/* Quick Controls Panel */}
        <AnimatePresence>
          {showQuickControls && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: 20 }}
              className="absolute right-0 top-14 bg-green-800/95 backdrop-blur-sm rounded-lg p-4 shadow-xl border border-green-400/30 min-w-[200px]"
              onMouseEnter={() => setShowQuickControls(true)}
              onMouseLeave={() => {
                // Only close if not actively interacting with controls
                if (!isInteracting) {
                  setTimeout(() => setShowQuickControls(false), 200)
                }
              }}
            >
              {/* Quick Volume Control */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-white text-sm font-medium">Volume</span>
                  <button
                    onClick={toggleMute}
                    className="p-1 hover:bg-green-700/50 rounded transition-colors"
                    aria-label={isEnabled ? "Mute" : "Unmute"}
                  >
                    {isEnabled ? (
                      <Volume2 className="w-4 h-4 text-white" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-red-300" />
                    )}
                  </button>
                </div>

                {/* Volume Slider */}
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    onMouseDown={() => setIsInteracting(true)}
                    onMouseUp={() => setIsInteracting(false)}
                    onTouchStart={() => setIsInteracting(true)}
                    onTouchEnd={() => setIsInteracting(false)}
                    className="flex-1 h-2 bg-green-700 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #10b981 0%, #10b981 ${volume * 100}%, #374151 ${volume * 100}%, #374151 100%)`
                    }}
                    disabled={!isEnabled}
                  />
                  <span className="text-white text-xs w-8 text-right">
                    {Math.round(volume * 100)}
                  </span>
                </div>

                {/* Full Settings Button */}
                <button
                  onClick={() => {
                    setShowQuickControls(false)
                    onOpenFullSettings()
                  }}
                  className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-green-700/50 hover:bg-green-600/60 rounded-lg transition-colors text-white text-sm"
                >
                  <Settings className="w-4 h-4" />
                  <span>More Settings</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
