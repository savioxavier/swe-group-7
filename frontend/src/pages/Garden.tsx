import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Leaf, Plus, Settings, LogOut, User, Zap } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'

export default function Garden() {
  const { user, logout } = useAuth()
  const [selectedPlot, setSelectedPlot] = useState<number | null>(null)
  const [userProgress, setUserProgress] = useState<{
    current_streak: number;
    level: number;
    total_experience: number;
  } | null>(null)

  const gardenPlots = [
    { id: 1, x: 2, y: 1, plant: { name: 'Exercise Oak', growth: 75, type: 'exercise' }, hasPlant: true },
    { id: 2, x: 4, y: 1, plant: { name: 'Study Rose', growth: 60, type: 'study' }, hasPlant: true },
    { id: 3, x: 6, y: 2, plant: { name: 'Work Willow', growth: 45, type: 'work' }, hasPlant: true },
    { id: 4, x: 1, y: 3, plant: null, hasPlant: false },
    { id: 5, x: 3, y: 3, plant: { name: 'Self-care Sage', growth: 30, type: 'selfcare' }, hasPlant: true },
    { id: 6, x: 5, y: 3, plant: null, hasPlant: false },
    { id: 7, x: 7, y: 3, plant: null, hasPlant: false },
    { id: 8, x: 2, y: 4, plant: { name: 'Creative Cactus', growth: 20, type: 'creative' }, hasPlant: true },
    { id: 9, x: 4, y: 4, plant: null, hasPlant: false },
    { id: 10, x: 6, y: 4, plant: null, hasPlant: false },
  ]

  const getPlantIcon = (type: string, growth: number) => {
    const icons = {
      exercise: growth > 50 ? '🌳' : growth > 20 ? '🌲' : '🌱',
      study: growth > 50 ? '🌹' : growth > 20 ? '🌸' : '🌱',
      work: growth > 50 ? '🌾' : growth > 20 ? '🌿' : '🌱',
      selfcare: growth > 50 ? '🌺' : growth > 20 ? '🌼' : '🌱',
      creative: growth > 50 ? '🌵' : growth > 20 ? '🌿' : '🌱',
    }
    return icons[type] || '🌱'
  }

  const handleLogout = () => {
    logout()
  }

  const fetchUserProgress = async () => {
    try {
      const response = await api.get('/plants/progress/me')
      setUserProgress(response)
    } catch (error) {
      console.error('Failed to fetch user progress:', error)
    }
  }

  useEffect(() => {
    fetchUserProgress()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-700 to-green-600">
      <header className="bg-black/30 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Task Garden</h1>
              <p className="text-green-100 text-sm">{user?.username || user?.email}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="p-2 text-green-100 hover:text-white transition-colors bg-white/10 rounded-lg">
              <Settings className="w-5 h-5" />
            </button>
            <button className="p-2 text-green-100 hover:text-white transition-colors bg-white/10 rounded-lg">
              <User className="w-5 h-5" />
            </button>
            <button 
              onClick={handleLogout}
              className="p-2 text-green-100 hover:text-red-300 transition-colors bg-white/10 rounded-lg"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="relative min-h-[calc(100vh-80px)] overflow-hidden">
        <div 
          className="absolute inset-0 bg-gradient-to-b from-green-400/20 to-green-800/40"
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 30%, #22c55e33 0%, transparent 50%),
              radial-gradient(circle at 80% 70%, #10b98126 0%, transparent 50%),
              linear-gradient(45deg, transparent 49%, #ffffff08 50%, transparent 51%)
            `
          }}
        />

        <div className="relative z-10 p-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Your Garden</h2>
              <p className="text-green-100">Tap on plots to plant or tend to your plants</p>
              
              {userProgress && (
                <div className="mt-4 flex justify-center space-x-6 text-white">
                  <div className="bg-white/10 px-4 py-2 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Zap className="w-4 h-4 text-yellow-400" />
                      <span>Streak: {userProgress.current_streak} days</span>
                    </div>
                  </div>
                  <div className="bg-white/10 px-4 py-2 rounded-lg">
                    <span>Level: {userProgress.level}</span>
                  </div>
                  <div className="bg-white/10 px-4 py-2 rounded-lg">
                    <span>EXP: {userProgress.total_experience}</span>
                  </div>
                </div>
              )}

            </div>

            <div 
              className="relative bg-green-900/30 rounded-3xl p-12 border-4 border-green-600/30 backdrop-blur-sm"
              style={{ 
                minHeight: '600px',
                backgroundImage: `
                  repeating-linear-gradient(
                    0deg,
                    transparent,
                    transparent 60px,
                    #22c55e1a 60px,
                    #22c55e1a 61px
                  ),
                  repeating-linear-gradient(
                    90deg,
                    transparent,
                    transparent 60px,
                    #22c55e1a 60px,
                    #22c55e1a 61px
                  )
                `
              }}
            >
              {gardenPlots.map((plot) => (
                <motion.div
                  key={plot.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: plot.id * 0.1 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedPlot(plot.id)}
                  className={`absolute cursor-pointer transition-all duration-200 ${
                    selectedPlot === plot.id ? 'z-20' : 'z-10'
                  }`}
                  style={{
                    left: `${plot.x * 12}%`,
                    top: `${plot.y * 15}%`,
                    width: '80px',
                    height: '80px',
                  }}
                >
                  <div
                    className={`w-full h-full rounded-full flex items-center justify-center transition-all duration-200 ${
                      plot.hasPlant
                        ? 'bg-green-600/40 border-2 border-green-400/60 shadow-lg shadow-green-500/20'
                        : 'bg-amber-700/60 border-2 border-amber-500/60 border-dashed hover:bg-amber-600/60'
                    } ${
                      selectedPlot === plot.id
                        ? 'ring-4 ring-yellow-400 ring-opacity-75 scale-110'
                        : ''
                    }`}
                  >
                    {plot.hasPlant ? (
                      <div className="text-center">
                        <div className="text-3xl mb-1">
                          {getPlantIcon(plot.plant.type, plot.plant.growth)}
                        </div>
                        <div className="w-12 bg-gray-700 rounded-full h-1 mx-auto">
                          <div
                            className="bg-green-400 h-1 rounded-full transition-all duration-300"
                            style={{ width: `${plot.plant.growth}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <Plus className="w-8 h-8 text-amber-300" />
                    )}
                  </div>

                  {plot.hasPlant && (
                    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black/70 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      {plot.plant.name}
                    </div>
                  )}
                </motion.div>
              ))}

              <motion.div
                className="absolute bottom-4 right-4"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <button className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-full shadow-lg shadow-green-500/30 transition-all duration-200">
                  <Plus className="w-6 h-6" />
                </button>
              </motion.div>
            </div>

            {selectedPlot && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20"
              >
                {gardenPlots.find(p => p.id === selectedPlot)?.hasPlant ? (
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-white mb-2">
                      {gardenPlots.find(p => p.id === selectedPlot)?.plant?.name}
                    </h3>
                    <p className="text-green-200 mb-4">
                      Growth: {gardenPlots.find(p => p.id === selectedPlot)?.plant?.growth}%
                    </p>
                    <div className="flex justify-center space-x-4">
                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                        Water Plant
                      </button>
                      <button className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors">
                        Complete Task
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-white mb-2">Empty Plot</h3>
                    <p className="text-green-200 mb-4">Plant a new seed here!</p>
                    <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors">
                      Plant Seed
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}