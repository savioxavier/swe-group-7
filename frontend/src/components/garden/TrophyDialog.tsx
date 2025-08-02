import React from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { Trophy } from 'lucide-react'
import type { Plant } from './constants'

interface TrophyDialogProps {
  plant: Plant | null
  isOpen: boolean
  onClose: () => void
  onCompleteTask?: (plantId: string) => Promise<void>
}

export const TrophyDialog: React.FC<TrophyDialogProps> = ({
  plant,
  isOpen,
  onClose,
  onCompleteTask
}) => {
  if (!isOpen || !plant) return null

  const handleAcknowledge = async () => {
    onClose()
    
    if (onCompleteTask && plant.id && plant.task_status !== 'completed') {
      try {
        await onCompleteTask(plant.id)
      } catch (error) {
        console.error('Failed to complete task:', error)
      }
    }
  }

  const handleClose = async () => {
    onClose()
    
    if (onCompleteTask && plant.id && plant.task_status !== 'completed') {
      try {
        await onCompleteTask(plant.id)
      } catch (error) {
        console.error('Failed to complete task:', error)
      }
    }
  }

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm bg-white/10 backdrop-blur-md rounded-xl shadow-2xl border border-white/20 modal-container"
      >
        <div className="flex justify-between items-center p-4 border-b border-white/20">
          <div className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <h2 className="text-lg font-bold text-white">Ready to Harvest</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-white/70 hover:text-white text-xl font-bold"
          >
            ×
          </button>
        </div>
        
        <div className="p-4">
          <div className="text-center mb-4">
            <div className="flex justify-center mb-3">
              <Trophy className="w-8 h-8 text-yellow-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              {plant.name}
            </h3>
            <p className="text-green-200 text-sm">Task Completed Successfully!</p>
          </div>

          <div className="bg-white/5 rounded-lg p-3 mb-4">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-center">
                <div className="text-white font-medium">{plant.experience_points}</div>
                <div className="text-gray-400">Total XP</div>
              </div>
              <div className="text-center">
                <div className="text-white font-medium">{plant.current_streak || 0} days</div>
                <div className="text-gray-400">Streak</div>
              </div>
            </div>
          </div>

          <button
            onClick={handleAcknowledge}
            className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors text-sm"
          >
            Harvest Trophy
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  )
}
