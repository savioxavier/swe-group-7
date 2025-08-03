import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { Calendar, X, Hammer } from 'lucide-react'
import type { Plant } from './constants'
import { useSounds } from '../../lib/sounds'
import { CalendarExportService } from '../../lib/calendarExport'
import { DailyWorkService } from '../../lib/dailyWork'
import { GoogleCalendarAPI } from '../../lib/googleCalendar'

interface TaskPanelProps {
  plants: Plant[]
  isOpen: boolean
  shouldAutoShow: boolean
  onClose: () => void
  onLogWork: (plantId: string, hours: number) => Promise<void>
  onCompleteTask: (plantId: string) => Promise<void>
  onSuccess: (message: string) => void
  focusedPlantId: string | null
  onSetFocusedPlant: (plantId: string | null) => void
  dailyDecayInfo?: {
    decay_applied?: number;
    level?: number;
    streak?: number;
    base_decay?: number;
    streak_protection?: number;
    message?: string;
  } | null
}

export const TaskPanel: React.FC<TaskPanelProps> = ({
  plants,
  isOpen,
  shouldAutoShow,
  onClose,
  onLogWork,
  onCompleteTask,
  onSuccess,
  focusedPlantId,
  onSetFocusedPlant,
  dailyDecayInfo
}) => {
  const sounds = useSounds()
  const [showCalendarModal, setShowCalendarModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState('')
  const [taskExportSettings, setTaskExportSettings] = useState<{[key: string]: {time: string, duration: number, enabled: boolean}}>({})
  const [debugMode, setDebugMode] = useState(DailyWorkService.isDebugModeEnabled())
  const [showDebugPanel, setShowDebugPanel] = useState(false)
  
  // Clean up old logs and sync debug mode on component mount
  useEffect(() => {
    DailyWorkService.clearOldLogs()
    setDebugMode(DailyWorkService.isDebugModeEnabled())
  }, [])
  
  if (!isOpen) return null

  const handleExportToGoogleCalendar = () => {
    // Get active tasks to export
    const activeTasks = plants.filter(p => p.task_status === 'active')
    
    if (activeTasks.length === 0) {
      onSuccess("No active tasks to export!")
      return
    }

    // Set default values when opening modal
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    setSelectedDate(tomorrow.toISOString().split('T')[0])

    // Open the modal to select date and tasks
    setShowCalendarModal(true)
    sounds.playUI('button')
  }

  const handleCalendarExportSubmit = async () => {
    if (!selectedDate) {
      onSuccess("Please select a date!")
      return
    }

    const activeTasks = plants.filter(p => p.task_status === 'active')
    
    // Get enabled tasks from settings
    const enabledTasks = activeTasks.filter(plant => 
      taskExportSettings[plant.id]?.enabled
    )

    if (enabledTasks.length === 0) {
      onSuccess("Please select at least one task to export.")
      return
    }

    // Check if all enabled tasks have time set
    const missingTime = enabledTasks.some(plant => 
      !taskExportSettings[plant.id]?.time
    )
    
    if (missingTime) {
      onSuccess("Please set time for all selected tasks!")
      return
    }
    
    try {
      // Show loading message
      onSuccess("Connecting to Google Calendar...")

      // Initialize Google Calendar API
      const initialized = await GoogleCalendarAPI.initialize()
      if (!initialized) {
        onSuccess("❌ Failed to initialize Google Calendar API. Check console for details and ensure your API keys are set correctly.")
        return
      }

      // Check if user is signed in, and sign them in if not
      const isSignedIn = await GoogleCalendarAPI.isSignedIn()
      if (!isSignedIn) {
        onSuccess("📝 Please sign in to Google Calendar...")
        const signInSuccess = await GoogleCalendarAPI.signIn()
        if (!signInSuccess) {
          onSuccess("❌ Failed to sign in to Google Calendar. Make sure pop-ups are allowed and your OAuth settings are correct.")
          return
        }
        onSuccess("✅ Signed in to Google Calendar! Exporting tasks...")
      }

      let exportedCount = 0
      let failedCount = 0

      // Export each enabled task to Google Calendar
      for (const plant of enabledTasks) {
        const settings = taskExportSettings[plant.id]
        if (!settings) continue

        const success = await GoogleCalendarAPI.exportTaskToCalendar(
          plant.name,
          plant.type || 'general',
          plant.task_description || plant.name,
          selectedDate,
          settings.time,
          settings.duration
        )

        if (success) {
          exportedCount++
          // Also save to local storage for backup
          CalendarExportService.saveExport({
            taskId: plant.id,
            taskName: plant.name,
            taskDescription: plant.task_description || plant.name,
            selectedDate,
            selectedTime: settings.time,
            duration: settings.duration
          })
        } else {
          failedCount++
        }

        // Small delay between exports to avoid rate limiting
        if (plant !== enabledTasks[enabledTasks.length - 1]) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }

      // Close modal and reset form
      setShowCalendarModal(false)
      setSelectedDate('')
      setTaskExportSettings({})
      
      // Show results
      if (exportedCount > 0 && failedCount === 0) {
        sounds.playUI('success')
        onSuccess(`Successfully exported ${exportedCount} task(s) to Google Calendar!`)
      } else if (exportedCount > 0 && failedCount > 0) {
        sounds.playUI('success')
        onSuccess(`Exported ${exportedCount} task(s), ${failedCount} failed. Check console for details.`)
      } else {
        onSuccess("Failed to export tasks to Google Calendar. Please try again.")
      }

    } catch (error) {
      console.error('Calendar export error:', error)
      onSuccess("Error exporting to Google Calendar. Please try again.")
    }
  }

  const handleCloseCalendarModal = () => {
    setShowCalendarModal(false)
    setSelectedDate('')
    setTaskExportSettings({})
    sounds.playUI('modal_close')
  }

  const handleTaskToggle = (plantId: string, enabled: boolean) => {
    setTaskExportSettings(prev => ({
      ...prev,
      [plantId]: {
        ...prev[plantId],
        enabled,
        time: prev[plantId]?.time || '09:00',
        duration: prev[plantId]?.duration || 2
      }
    }))
  }

  const handleTaskTimeChange = (plantId: string, time: string) => {
    setTaskExportSettings(prev => ({
      ...prev,
      [plantId]: {
        ...prev[plantId],
        time,
        enabled: prev[plantId]?.enabled || false,
        duration: prev[plantId]?.duration || 2
      }
    }))
  }

  const handleTaskDurationChange = (plantId: string, duration: number) => {
    setTaskExportSettings(prev => ({
      ...prev,
      [plantId]: {
        ...prev[plantId],
        duration,
        enabled: prev[plantId]?.enabled || false,
        time: prev[plantId]?.time || '09:00'
      }
    }))
  }

  const handleWorkSubmit = async (plantId: string, hours: number) => {
    // Check if user has already logged work for THIS SPECIFIC TASK today (unless in debug mode)
    const hasLoggedForThisTask = DailyWorkService.hasLoggedWorkToday(plantId)
    const isDebugEnabled = DailyWorkService.isDebugModeEnabled()
    
    if (hasLoggedForThisTask && !isDebugEnabled) {
      onSuccess("You can only log work once per day for each task! Enable debug mode to override this limit.")
      return
    }
    
    // Log the work attempt
    DailyWorkService.logWork(plantId, hours)
    
    // Proceed with normal work logging
    await onLogWork(plantId, hours)
    onSetFocusedPlant(null)
    onSuccess("Great work! Your task is growing!")
  }

  const toggleDebugMode = () => {
    const newDebugMode = !debugMode
    setDebugMode(newDebugMode)
    DailyWorkService.setDebugMode(newDebugMode)
    sounds.playUI('button')
    onSuccess(`Debug mode ${newDebugMode ? 'enabled' : 'disabled'}!`)
  }

  const handleDebugPanelToggle = () => {
    setShowDebugPanel(!showDebugPanel)
    sounds.playUI('button')
  }

  return createPortal(
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-hidden"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 w-full max-w-[95vw] sm:max-w-4xl h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fixed Header */}
        <div className="p-4 sm:p-6 pb-4 border-b border-white/10">
          <div className="text-center">
            {shouldAutoShow ? (
              <>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <h2 className="text-2xl font-bold text-white">Good morning!</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={handleExportToGoogleCalendar}
                      className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 hover:text-blue-100 rounded-lg font-medium transition-colors text-sm"
                      title="Export tasks to Google Calendar"
                    >
                      <Calendar size={16} />
                      Export to Calendar
                    </button>
                    <button
                      onClick={handleDebugPanelToggle}
                      className="p-1.5 bg-gray-600/20 hover:bg-gray-600/30 text-gray-300 hover:text-gray-200 rounded transition-colors"
                      title="Debug Mode"
                    >
                      <Hammer size={12} />
                    </button>
                  </div>
                </div>
                <p className="text-green-200">Ready to tend your garden? What will you work on today?</p>
              </>
            ) : (
              <>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <h2 className="text-2xl font-bold text-white">Your Daily Tasks</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={handleExportToGoogleCalendar}
                      className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 hover:text-blue-100 rounded-lg font-medium transition-colors text-sm"
                      title="Export tasks to Google Calendar"
                    >
                      <Calendar size={16} />
                      Export to Calendar
                    </button>
                    <button
                      onClick={handleDebugPanelToggle}
                      className="p-1.5 bg-gray-600/20 hover:bg-gray-600/30 text-gray-300 hover:text-gray-200 rounded transition-colors"
                      title="Debug Mode"
                    >
                      <Hammer size={12} />
                    </button>
                  </div>
                </div>
                <p className="text-green-200">What have you worked on? What are you working on?</p>
              </>
            )}
          </div>

          {/* Daily Decay Notification - Only show if there was decay */}
          {dailyDecayInfo && dailyDecayInfo.decay_applied && dailyDecayInfo.decay_applied > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 p-2 bg-orange-500/20 border border-orange-400/30 rounded-lg"
            >
              <div className="flex items-center justify-center gap-2 text-orange-200">
                <span className="text-orange-400 text-sm">⚠️</span>
                <span className="font-medium text-sm">Daily XP Decay Applied</span>
              </div>
              <div className="text-center text-xs text-orange-300 mt-1">
                Lost {dailyDecayInfo.decay_applied} XP (Base: {dailyDecayInfo.base_decay}, Protected: {dailyDecayInfo.streak_protection})
              </div>
              {dailyDecayInfo.streak && dailyDecayInfo.streak > 0 && (
                <div className="text-center text-xs text-green-300 mt-1">
                  Your {dailyDecayInfo.streak}-day streak protected you from losing more XP!
                </div>
              )}
            </motion.div>
          )}

          {/* Debug Panel */}
          {showDebugPanel && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 p-3 bg-gray-800/40 border border-gray-600/30 rounded-lg"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-white text-sm">Debug Settings</span>
                <span className={`text-xs px-2 py-1 rounded ${debugMode ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                  {debugMode ? 'ON' : 'OFF'}
                </span>
              </div>
              
              <div className="space-y-2">
                <button
                  onClick={toggleDebugMode}
                  className={`w-full px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                    debugMode 
                      ? 'bg-red-500/20 hover:bg-red-500/30 text-red-200 hover:text-red-100' 
                      : 'bg-green-500/20 hover:bg-green-500/30 text-green-200 hover:text-green-100'
                  }`}
                >
                  {debugMode ? 'Disable Debug Mode' : 'Enable Debug Mode'}
                </button>
                
                <button
                  onClick={() => {
                    DailyWorkService.clearAllLogs()
                    sounds.playUI('success')
                    onSuccess('Work logs cleared!')
                  }}
                  className="w-full px-3 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-200 hover:text-orange-100 rounded-lg font-medium transition-colors text-sm"
                >
                  Clear All Work Logs
                </button>
              </div>
            </motion.div>
          )}

          {/* Streak Protection Message - Only show if no decay due to streak */}
          {dailyDecayInfo && dailyDecayInfo.message && dailyDecayInfo.message.includes('No decay applied due to streak protection') && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 p-2 bg-green-500/20 border border-green-400/30 rounded-lg"
            >
              <div className="flex items-center justify-center gap-2 text-green-200">
                <span className="text-green-400 text-sm">🛡️</span>
                <span className="font-medium text-sm">Streak Protection Active!</span>
              </div>
              <div className="text-center text-xs text-green-300 mt-1">
                Your {dailyDecayInfo.streak}-day streak fully protected you from XP decay
              </div>
            </motion.div>
          )}
        </div>

        {/* Fixed Stats Section */}
        <div className="px-4 sm:px-6 py-4 border-b border-white/10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-white">{plants.filter(p => p.task_status === 'active').length}</div>
              <div className="text-xs text-green-200">Active Tasks</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-white">
                {plants.filter(p => {
                  if (!p.lastWatered) return false
                  const today = new Date().toDateString()
                  return new Date(p.lastWatered).toDateString() === today
                }).length}
              </div>
              <div className="text-xs text-green-200">Worked Today</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-white">
                {Math.max(...plants.map(p => p.current_streak || 0), 0)}
              </div>
              <div className="text-xs text-green-200">Best Streak</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-white">1</div>
              <div className="text-xs text-green-200">Your Level</div>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
          <div className="space-y-4">
          {plants.map((plant) => (
            <div 
              key={plant.id} 
              className={`bg-white/5 rounded-lg p-4 border transition-all duration-300 ${
                focusedPlantId === plant.id 
                  ? 'border-green-500 bg-green-500/10 shadow-lg shadow-green-500/20' 
                  : 'border-white/10'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">Plant</span>
                  <h3 className="text-white font-medium">{plant.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    plant.type === 'work' ? 'bg-blue-500/20 text-blue-200' :
                    plant.type === 'study' ? 'bg-green-500/20 text-green-200' :
                    plant.type === 'exercise' ? 'bg-red-500/20 text-red-200' :
                    'bg-purple-500/20 text-purple-200'
                  }`}>
                    {plant.type}
                  </span>
                  {DailyWorkService.hasLoggedWorkToday(plant.id) && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-200">
                      ✓ Worked Today
                    </span>
                  )}
                  <span className="text-sm">
                    {(plant.current_streak || 0) >= 7 ? 'Hot' :
                     (plant.current_streak || 0) >= 3 ? 'Active' :
                     (plant.current_streak || 0) >= 1 ? 'Growing' : 'Dormant'}
                  </span>
                </div>
                <div className="text-sm text-green-200">
                  Level {plant.task_level || 1} • {plant.experience_points} XP
                </div>
              </div>
              
              {plant.task_description && (
                <p className="text-sm text-green-100/70 mb-3">{plant.task_description}</p>
              )}
              
              <div className="flex items-center space-x-2 text-sm text-green-200 mb-3">
                <span>Streak: {plant.current_streak || 0} days</span>
                <span>•</span>
                <span>Stage: {plant.stage}/5</span>
              </div>

              {plant.task_status === 'active' && (
                <>
                  {/* Daily limit warning */}
                  {DailyWorkService.hasLoggedWorkToday(plant.id) && !DailyWorkService.isDebugModeEnabled() && (
                    <div className="mb-2 p-2 bg-yellow-500/20 border border-yellow-400/30 rounded-lg">
                      <div className="flex items-center gap-2 text-yellow-200 text-sm">
                        <span>⚠️</span>
                        <span>Already logged work for this task today. Enable debug mode to continue.</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex space-x-2">
                    <input
                      id={`task-input-${plant.id}`}
                      type="number"
                      step="0.5"
                      min="0"
                      max="24"
                      placeholder={DailyWorkService.hasLoggedWorkToday(plant.id) && !DailyWorkService.isDebugModeEnabled() ? "Already logged today" : "Hours worked today"}
                      disabled={DailyWorkService.hasLoggedWorkToday(plant.id) && !DailyWorkService.isDebugModeEnabled()}
                      className={`flex-1 px-3 py-3 border rounded text-white placeholder-white/50 focus:outline-none min-h-[44px] ${
                        DailyWorkService.hasLoggedWorkToday(plant.id) && !DailyWorkService.isDebugModeEnabled()
                          ? 'bg-gray-500/20 border-gray-500/30 cursor-not-allowed text-gray-400'
                          : `bg-white/10 border-white/20 focus:ring-2 focus:ring-green-500 ${
                              focusedPlantId === plant.id ? 'ring-2 ring-green-500' : ''
                            }`
                      }`}
                      style={{ fontSize: '16px' }} // Prevents zoom on iOS
                      onKeyPress={async (e) => {
                        if (e.key === 'Enter') {
                          const hours = parseFloat((e.target as HTMLInputElement).value)
                          if (hours > 0) {
                            await handleWorkSubmit(plant.id, hours);
                            (e.target as HTMLInputElement).value = ''
                          }
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        sounds.playUI('button')
                        onCompleteTask(plant.id)
                      }}
                      disabled={plant.stage < 4}
                      className={`px-4 py-3 rounded text-sm font-medium transition-colors min-h-[44px] ${
                        plant.stage >= 4 
                          ? 'bg-green-600 hover:bg-green-700 text-white' 
                          : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                      }`}
                      title={plant.stage < 4 ? `Plant needs to reach stage 4 to complete (currently stage ${plant.stage})` : 'Mark task as complete'}
                    >
                      {plant.stage >= 4 ? 'Complete' : `Complete (Stage ${plant.stage}/4)`}
                    </button>
                  </div>
                </>
              )}

              {plant.task_status === 'completed' && (
                <div className="text-center py-2">
                  <span className="text-green-400 font-medium">Task Completed!</span>
                  <p className="text-xs text-green-200 mt-1">Will be harvested automatically</p>
                </div>
              )}
            </div>
          ))}
          
            {plants.length === 0 && (
              <div className="text-center py-8">
                <p className="text-white/70 mb-4">No tasks yet!</p>
                <p className="text-white/50 text-sm">Click on empty spots in the garden to create new tasks</p>
              </div>
            )}
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="p-4 sm:p-6 pt-4 border-t border-white/10">
          <div className="flex items-center justify-end">
            <button
              onClick={() => {
                sounds.playUI('button')
                onClose()
              }}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors ml-auto"
            >
              Close Tasks
            </button>
          </div>
        </div>
      </motion.div>

      {/* Calendar Export Modal */}
      {showCalendarModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4"
          onClick={(e) => {
            // Only close if clicking the backdrop, not the modal content
            if (e.target === e.currentTarget) {
              handleCloseCalendarModal()
            }
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-gradient-to-b from-green-800/90 to-green-900/90 rounded-lg border border-white/20 backdrop-blur-sm p-6 w-full max-w-md"
            onClick={(e) => {
              // Prevent clicks inside the modal from bubbling up
              e.stopPropagation()
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Export to Google Calendar</h3>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleCloseCalendarModal()
                }}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={20} className="text-white" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-white/90 text-sm font-medium mb-2">
                  Select Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    e.stopPropagation()
                    setSelectedDate(e.target.value)
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-400"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <label className="block text-white/90 text-sm font-medium mb-3">
                  Select Tasks to Export
                </label>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {plants.filter(p => p.task_status === 'active').map((plant) => {
                    const settings = taskExportSettings[plant.id] || { enabled: false, time: '09:00', duration: 2 }
                    return (
                      <div key={plant.id} className="p-3 bg-white/5 rounded-lg border border-white/10">
                        <div className="flex items-center justify-between mb-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.enabled}
                              onChange={(e) => {
                                e.stopPropagation()
                                handleTaskToggle(plant.id, e.target.checked)
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="w-4 h-4 rounded border-white/20 bg-white/10 text-green-500 focus:ring-green-400 focus:ring-2"
                            />
                            <span className="text-white font-medium truncate">{plant.name}</span>
                          </label>
                        </div>
                        
                        {settings.enabled && (
                          <div className="flex gap-2 mt-2">
                            <div className="flex-1">
                              <label className="block text-white/70 text-xs mb-1">Time</label>
                              <input
                                type="time"
                                value={settings.time}
                                onChange={(e) => {
                                  e.stopPropagation()
                                  handleTaskTimeChange(plant.id, e.target.value)
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-green-400"
                              />
                            </div>
                            <div className="flex-1">
                              <label className="block text-white/70 text-xs mb-1">Duration</label>
                              <select
                                value={settings.duration}
                                onChange={(e) => {
                                  e.stopPropagation()
                                  handleTaskDurationChange(plant.id, Number(e.target.value))
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-green-400"
                              >
                                <option value={0.5} className="bg-green-800 text-white">30m</option>
                                <option value={1} className="bg-green-800 text-white">1h</option>
                                <option value={1.5} className="bg-green-800 text-white">1.5h</option>
                                <option value={2} className="bg-green-800 text-white">2h</option>
                                <option value={3} className="bg-green-800 text-white">3h</option>
                                <option value={4} className="bg-green-800 text-white">4h</option>
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleCloseCalendarModal()
                  }}
                  className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleCalendarExportSubmit()
                  }}
                  className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                  disabled={!Object.values(taskExportSettings).some(s => s.enabled)}
                >
                  Export Selected
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>,
    document.body
  )
}
