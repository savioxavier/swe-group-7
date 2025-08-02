import React from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import type { Plant } from './constants'
import { useSounds } from '../../lib/sounds'

interface TaskPanelProps {
  plants: Plant[]
  isOpen: boolean
  shouldAutoShow: boolean
  onClose: () => void
  onLogWork: (plantId: string, hours: number) => Promise<void>
  onCompleteTask: (plantId: string) => Promise<void>
  onCreateNew: () => void
  onSuccess: (message: string) => void
  focusedPlantId: string | null
  onSetFocusedPlant: (plantId: string | null) => void
}

export const TaskPanel: React.FC<TaskPanelProps> = ({
  plants,
  isOpen,
  shouldAutoShow,
  onClose,
  onLogWork,
  onCompleteTask,
  onCreateNew,
  onSuccess,
  focusedPlantId,
  onSetFocusedPlant
}) => {
  const sounds = useSounds()
  
  if (!isOpen) return null

  const handleWorkSubmit = async (plantId: string, hours: number) => {
    await onLogWork(plantId, hours)
    onSetFocusedPlant(null)
    onSuccess("Great work! Your task is growing!")
  }

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 w-full max-w-[95vw] sm:max-w-4xl h-[90vh] flex flex-col"
      >
        {/* Fixed Header */}
        <div className="p-4 sm:p-6 pb-4 border-b border-white/10">
          <div className="text-center">
            {shouldAutoShow ? (
              <>
                <h2 className="text-2xl font-bold text-white mb-2">Good morning!</h2>
                <p className="text-green-200">Ready to tend your garden? What will you work on today?</p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-white mb-2">Your Daily Tasks</h2>
                <p className="text-green-200">What have you worked on? What are you working on?</p>
              </>
            )}
          </div>
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
                <div className="flex space-x-2">
                  <input
                    id={`task-input-${plant.id}`}
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    placeholder="Hours worked today"
                    className={`flex-1 px-3 py-3 bg-white/10 border border-white/20 rounded text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[44px] ${
                      focusedPlantId === plant.id ? 'ring-2 ring-green-500' : ''
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
                <button
                  onClick={() => {
                    sounds.playUI('button')
                    onCreateNew()
                  }}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                >
                  Create Your First Task
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="p-4 sm:p-6 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between">
            {plants.length > 0 && (
              <button
                onClick={() => {
                  sounds.playUI('button')
                  onCreateNew()
                }}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Task</span>
              </button>
            )}
            
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
    </div>,
    document.body
  )
}
