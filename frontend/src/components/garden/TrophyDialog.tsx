import React from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { Trophy, Info } from 'lucide-react'
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
    if (onCompleteTask && plant.id && plant.task_status !== 'completed') {
      try {
        await onCompleteTask(plant.id)
      } catch (error) {
        console.error('Failed to complete task:', error)
      }
    }
    onClose()
  }

  const handleClose = async () => {
    if (onCompleteTask && plant.id && plant.task_status !== 'completed') {
      try {
        await onCompleteTask(plant.id)
      } catch (error) {
        console.error('Failed to complete task:', error)
      }
    }
    onClose()
  }

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-xl shadow-2xl border border-white/20 modal-container"
      >
        <div className="flex justify-between items-center p-6 border-b border-white/20">
          <div className="flex items-center space-x-3">
            <Trophy className="w-6 h-6 text-yellow-400" />
            <h2 className="text-xl font-bold text-white">Trophy Plant</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-white/70 hover:text-white text-2xl font-bold"
          >
            ×
          </button>
        </div>
        
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <Trophy className="w-12 h-12 text-yellow-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              {plant.name}
            </h3>
            <p className="text-green-200 text-sm">Task Completed Successfully!</p>
          </div>

          <div className="bg-white/5 rounded-lg p-4 mb-6">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300">Status:</span>
                <span className="text-yellow-400 font-medium">Trophy Plant</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Stage:</span>
                <span className="text-white">{plant.stage}/5 (Complete)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Total XP:</span>
                <span className="text-white">{plant.experience_points}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Task Level:</span>
                <span className="text-white">{plant.task_level || 1}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Best Streak:</span>
                <span className="text-white">{plant.current_streak || 0} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Category:</span>
                <span className="text-white capitalize">{plant.type}</span>
              </div>
            </div>
          </div>

          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-2">
              <Info className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-green-200">
                <p className="font-medium mb-1">Auto-Harvest Information</p>
                <p>Trophy plants are automatically harvested after 6 hours of completion or when you sign out. This frees up space for new tasks while preserving your achievement records.</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleAcknowledge}
            className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
          >
            Acknowledge Achievement
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  )
}
