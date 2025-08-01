import React from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import type { Plant } from './constants'

interface TaskHoverInfoProps {
  plant: Plant | null
  isVisible: boolean
}

export const TaskHoverInfo: React.FC<TaskHoverInfoProps> = ({
  plant,
  isVisible
}) => {
  if (!isVisible || !plant) return null

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="task-hover-info"
        initial={{ opacity: 0, x: 20, scale: 0.9 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 20, scale: 0.9 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="fixed z-50 pointer-events-none
                   right-2 md:right-5
                   bottom-4 md:bottom-auto md:top-1/2 md:-translate-y-1/2
                   w-auto md:w-70
                   max-w-[calc(100vw-16px)] md:max-w-80"
      >
        <div className="bg-black/90 backdrop-blur-md rounded-lg p-3 md:p-4 border border-white/30 shadow-2xl">
          <div className="flex items-center space-x-2 md:space-x-3 mb-2 md:mb-3">
            <div className={`w-2 h-2 md:w-3 md:h-3 rounded-full ${
              plant.decay_status === 'dead' ? 'bg-red-500' :
              plant.decay_status === 'severely_wilted' || plant.decay_status === 'wilted' ? 'bg-yellow-500' :
              plant.stage >= 5 ? 'bg-purple-500' : 'bg-green-500'
            }`} />
            <h3 className="text-white font-semibold text-xs md:text-sm truncate">
              {plant.name}
            </h3>
          </div>
          
          <div className="mb-2 md:mb-3">
            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
              plant.type === 'work' ? 'bg-blue-500/20 text-blue-200' :
              plant.type === 'study' ? 'bg-green-500/20 text-green-200' :
              plant.type === 'exercise' ? 'bg-red-500/20 text-red-200' :
              'bg-purple-500/20 text-purple-200'
            }`}>
              {plant.type}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-gray-300">
              <span className="text-white font-medium">Stage:</span> {plant.stage}/5
            </div>
            <div className="text-gray-300">
              <span className="text-white font-medium">Level:</span> {plant.task_level || 1}
            </div>
            <div className="text-gray-300">
              <span className="text-white font-medium">XP:</span> {plant.experience_points}
            </div>
            <div className="text-gray-300">
              <span className="text-white font-medium">Streak:</span> {plant.current_streak || 0}
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-white/10">
            <div className="text-xs text-gray-300">
              <span className="text-white font-medium">Status:</span>{' '}
              <span className={`${
                plant.decay_status === 'dead' ? 'text-red-400' :
                plant.decay_status === 'severely_wilted' || plant.decay_status === 'wilted' ? 'text-yellow-400' :
                plant.stage >= 5 ? 'text-purple-400' : 'text-green-400'
              }`}>
                {plant.decay_status === 'dead' ? 'Dead - Needs attention!' :
                 plant.decay_status === 'severely_wilted' ? 'Severely wilted' :
                 plant.decay_status === 'wilted' ? 'Wilted' :
                 plant.stage >= 5 ? 'Ready to harvest' : 'Healthy & growing'}
              </span>
            </div>
            {plant.lastWatered && (
              <div className="text-xs text-gray-400 mt-1">
                Last worked: {new Date(plant.lastWatered).toLocaleDateString()}
              </div>
            )}
          </div>

          <div className="mt-2 text-center">
            <span className="text-xs text-green-300">Click to log work hours</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}
