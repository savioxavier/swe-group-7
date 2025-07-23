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
  
  const [testResponse, setTestResponse] = useState<string>('')
  const [tasks, setTasks] = useState<any[]>([])
  const [testHours, setTestHours] = useState<number>(1)
  const [taskTitle, setTaskTitle] = useState<string>('')
  const [taskDescription, setTaskDescription] = useState<string>('')
  const [taskCategory, setTaskCategory] = useState<string>('study')
  const [plantName, setPlantName] = useState<string>('')  
  const [plantType, setPlantType] = useState<string>('study')

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

  const testCreateTask = async () => {
    if (!taskTitle.trim()) {
      setTestResponse('Please enter a task title')
      return
    }
    try {
      const newTask = {
        title: taskTitle,
        description: taskDescription || null,
        category: taskCategory,
        due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }
      
      const response = await api.post('/tasks/', newTask)
      setTestResponse(`Created: "${response.title}" (${response.category})`)
      setTaskTitle('')
      setTaskDescription('')
      fetchTasks()
    } catch (error) {
      setTestResponse(`Error creating task: ${error}`)
    }
  }

  const testLogTime = async () => {
    if (tasks.length === 0) {
      setTestResponse('No tasks available. Create a task first!')
      return
    }
    try {
      const task = tasks[0]
      const timeLog = { hours: parseFloat(testHours.toString()) }
      const response = await api.post(`/tasks/${task.id}/log-time`, timeLog)
      setTestResponse(`Logged ${testHours}h on "${task.title}" - gained ${response.xp_gained} XP`)
      fetchUserProgressNew()
    } catch (error) {
      setTestResponse(`Error logging time: ${error}`)
    }
  }

  const fetchTasks = async () => {
    try {
      const response = await api.get('/tasks/')
      setTasks(response)
      const taskList = response.map(t => `${t.title} (${t.category}${t.status === 'completed' ? ' - completed' : ''})`).join('\n')
      setTestResponse(`Found ${response.length} tasks:\n${taskList}`)
    } catch (error) {
      setTestResponse(`Error fetching tasks: ${error}`)
    }
  }

  const fetchUserProgressNew = async () => {
    try {
      const response = await api.get('/users/progress')
      setTestResponse(`Level ${response.level} | ${response.total_experience} XP | ${response.current_streak} day streak\nNext level: ${response.experience_to_next_level} XP needed`)
    } catch (error) {
      setTestResponse(`Error fetching progress: ${error}`)
    }
  }

  const testApplyDecay = async () => {
    try {
      const response = await api.post('/users/apply-daily-decay', {})
      if (response.decay_applied) {
        setTestResponse(`Daily decay: -${response.decay_applied} XP (Level ${response.level} decay: ${response.base_decay}, Streak protection: -${response.streak_protection})`)
      } else {
        setTestResponse(`No decay applied - fully protected by streak`)
      }
      fetchUserProgressNew()
    } catch (error) {
      setTestResponse(`Error applying decay: ${error}`)
    }
  }

  const testCreatePlant = async () => {
    if (!plantName.trim()) {
      setTestResponse('Please enter a plant name')
      return
    }
    try {
      const newPlant = {
        name: plantName,
        plant_type: plantType,
        position_x: Math.floor(Math.random() * 11),
        position_y: Math.floor(Math.random() * 11)
      }
      const response = await api.post('/plants/', newPlant)
      setTestResponse(`Planted "${response.name}" (${response.plant_type}) at (${response.position_x}, ${response.position_y})`)
      setPlantName('')
    } catch (error) {
      setTestResponse(`Error creating plant: ${error}`)
    }
  }

  const testGetPlants = async () => {
    try {
      const response = await api.get('/plants/')
      const plantList = response.map(p => `${p.name} (${p.plant_type}) - Level ${p.growth_level} | ${p.experience_points} XP`).join('\n')
      setTestResponse(`Garden has ${response.length} plants:\n${plantList}`)
    } catch (error) {
      setTestResponse(`Error fetching plants: ${error}`)
    }
  }

  const testCompleteTask = async () => {
    if (tasks.length === 0) {
      setTestResponse('No tasks available. Create a task first!')
      return
    }
    try {
      const task = tasks[0]
      const response = await api.put(`/tasks/${task.id}/complete`, {})
      setTestResponse(`Completed "${response.title}" - Streak updated and plant XP gained`)
      fetchTasks()
      fetchUserProgressNew()
    } catch (error) {
      setTestResponse(`Error completing task: ${error}`)
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

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 bg-red-900/20 backdrop-blur-md rounded-xl p-6 border border-red-500/30"
            >
              <h3 className="text-xl font-bold text-red-300 mb-4 text-center">Backend Testing Panel</h3>
              
              <div className="mb-6">
                <h4 className="text-lg text-white mb-3">Task Management</h4>
                
                <div className="mb-4 p-4 bg-white/5 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <input 
                      type="text" 
                      placeholder="Task title..." 
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      className="px-3 py-2 rounded bg-white/20 text-white text-sm placeholder-gray-300"
                    />
                    <select 
                      value={taskCategory} 
                      onChange={(e) => setTaskCategory(e.target.value)}
                      className="px-3 py-2 rounded bg-white/20 text-white text-sm"
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        color: 'white'
                      }}
                    >
                      <option value="exercise" style={{ backgroundColor: '#374151', color: 'white' }}>Exercise</option>
                      <option value="study" style={{ backgroundColor: '#374151', color: 'white' }}>Study</option>
                      <option value="work" style={{ backgroundColor: '#374151', color: 'white' }}>Work</option>
                      <option value="selfcare" style={{ backgroundColor: '#374151', color: 'white' }}>Self Care</option>
                      <option value="creative" style={{ backgroundColor: '#374151', color: 'white' }}>Creative</option>
                    </select>
                  </div>
                  <input 
                    type="text" 
                    placeholder="Task description (optional)..." 
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-white/20 text-white text-sm placeholder-gray-300 mb-3"
                  />
                  <button 
                    onClick={testCreateTask}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm transition-colors"
                  >
                    Create Task
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <button 
                    onClick={fetchTasks}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm transition-colors"
                  >
                    Get Tasks
                  </button>
                  <button 
                    onClick={testCompleteTask}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm transition-colors"
                  >
                    Complete Task
                  </button>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="number" 
                      value={testHours} 
                      onChange={(e) => setTestHours(Number(e.target.value))}
                      className="w-16 px-2 py-1 rounded bg-white/20 text-white text-sm"
                      step="0.5"
                      min="0.1"
                    />
                    <button 
                      onClick={testLogTime}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded text-sm transition-colors"
                    >
                      Log Time
                    </button>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-lg text-white mb-3">XP System</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <button 
                    onClick={fetchUserProgressNew}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded text-sm transition-colors"
                  >
                    Get XP Progress
                  </button>
                  <button 
                    onClick={testApplyDecay}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm transition-colors"
                  >
                    Apply Daily Decay
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-lg text-white mb-3">Plant System</h4>
                
                <div className="mb-4 p-4 bg-white/5 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <input 
                      type="text" 
                      placeholder="Plant name..." 
                      value={plantName}
                      onChange={(e) => setPlantName(e.target.value)}
                      className="px-3 py-2 rounded bg-white/20 text-white text-sm placeholder-gray-300"
                    />
                    <select 
                      value={plantType} 
                      onChange={(e) => setPlantType(e.target.value)}
                      className="px-3 py-2 rounded bg-white/20 text-white text-sm"
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        color: 'white'
                      }}
                    >
                      <option value="exercise" style={{ backgroundColor: '#374151', color: 'white' }}>Exercise</option>
                      <option value="study" style={{ backgroundColor: '#374151', color: 'white' }}>Study</option>
                      <option value="work" style={{ backgroundColor: '#374151', color: 'white' }}>Work</option>
                      <option value="selfcare" style={{ backgroundColor: '#374151', color: 'white' }}>Self Care</option>
                      <option value="creative" style={{ backgroundColor: '#374151', color: 'white' }}>Creative</option>
                    </select>
                  </div>
                  <button 
                    onClick={testCreatePlant}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm transition-colors"
                  >
                    Create Plant
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <button 
                    onClick={testGetPlants}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm transition-colors"
                  >
                    Get Plants
                  </button>
                </div>
              </div>

              <div className="bg-black/30 p-4 rounded-lg">
                <h4 className="text-sm text-gray-300 mb-2">API Response:</h4>
                <pre className="text-xs text-green-400 font-mono overflow-auto max-h-40">
                  {testResponse || 'Click buttons above to test backend APIs...'}
                </pre>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}