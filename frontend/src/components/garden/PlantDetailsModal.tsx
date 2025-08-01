import React from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import type { Plant } from './constants'

interface PlantDetailsModalProps {
  plant: Plant | null
  isOpen: boolean
  onClose: () => void
}

export const PlantDetailsModal: React.FC<PlantDetailsModalProps> = ({
  plant,
  isOpen,
  onClose
}) => {
  if (!isOpen || !plant) return null

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-[500px] h-auto bg-gradient-to-br from-green-600 to-green-800 rounded-xl shadow-2xl modal-container"
      >
        <div className="flex justify-between items-center p-4 border-b border-white/20">
          <h2 className="text-xl font-bold text-white">Plant Details</h2>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white text-2xl font-bold"
          >
            ×
          </button>
        </div>
        <div className="p-4">
          <div className="text-center mb-4">
            <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center ${
              plant.type === 'exercise' ? 'bg-red-500' :
              plant.type === 'study' ? 'bg-blue-500' :
              plant.type === 'work' ? 'bg-purple-500' :
              plant.type === 'creative' ? 'bg-yellow-500' : 'bg-green-500'
            }`}>
              <span className="text-lg text-white font-bold">
                {plant.name.replace(/^(Exercise|Study|Work|Self-care|Creative)\s+/i, '').charAt(0)}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mb-1">
              {plant.name.replace(/^(Exercise|Study|Work|Self-care|Creative)\s+/i, '')}
            </h3>
            <p className="text-sm text-green-100 capitalize">{plant.type} Plant</p>
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-white">Growth Progress</span>
              <span className="text-sm text-green-100">{Math.floor((plant.stage / 5) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  plant.stage >= 4 ? 'bg-yellow-400' : 'bg-green-400'
                }`}
                style={{ width: `${(plant.stage / 5) * 100}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-300 mt-1">
              {plant.stage === 0 ? 'Just planted' :
               plant.stage === 1 ? 'Sprouting' :
               plant.stage === 2 ? 'Growing' :
               plant.stage === 3 ? 'Developing' :
               plant.stage === 4 ? 'Ready to harvest' : 'Fully grown'}
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="text-sm font-bold text-white mb-3">Plant Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Category:</span>
                  <span className="text-white capitalize">{plant.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Task Level:</span>
                  <span className="text-white">{plant.task_level}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Experience:</span>
                  <span className="text-white">{plant.experience_points} XP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Streak:</span>
                  <span className="text-white">{plant.current_streak} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Position:</span>
                  <span className="text-white">({plant.x}, {plant.y})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Last Worked:</span>
                  <span className="text-white">{plant.lastWatered ? new Date(plant.lastWatered).toLocaleDateString() : 'Never'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Status:</span>
                  <span className={`font-medium ${
                    plant.stage >= 4 ? 'text-yellow-400' :
                    plant.stage >= 2 ? 'text-green-400' : 'text-gray-400'
                  }`}>
                    {plant.stage >= 4 ? 'Ready to harvest' :
                     plant.stage >= 2 ? 'Healthy & growing' : 'Young plant'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Close Details
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  )
}
