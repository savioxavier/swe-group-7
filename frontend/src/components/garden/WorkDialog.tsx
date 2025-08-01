import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import type { Plant } from './constants'

interface WorkDialogProps {
  plant: Plant | null
  isOpen: boolean
  onClose: () => void
  onLogWork: (plantId: string, hours: number) => Promise<void>
}

export const WorkDialog: React.FC<WorkDialogProps> = ({
  plant,
  isOpen,
  onClose,
  onLogWork
}) => {
  const [workHours, setWorkHours] = useState('')

  const handleSubmit = async () => {
    if (!plant || !workHours || parseFloat(workHours) <= 0) return
    
    await onLogWork(plant.id, parseFloat(workHours))
    setWorkHours('')
    onClose()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit()
    }
  }

  if (!isOpen || !plant) return null

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 max-w-sm w-full mx-4"
      >
        <h3 className="text-xl font-bold text-white mb-4 text-center">
          {plant.name}
        </h3>
        <p className="text-green-100 text-sm text-center mb-6">
          How many hours did you work on this?
        </p>
        
        <input
          type="number"
          step="0.5"
          min="0"
          max="24"
          value={workHours}
          onChange={(e) => setWorkHours(e.target.value)}
          placeholder="2"
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-500 text-center text-xl mb-4"
          autoFocus
          onKeyPress={handleKeyPress}
        />
        
        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={!workHours || parseFloat(workHours) <= 0}
            className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-500 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
          >
            Log Work
          </button>
          <button
            onClick={() => {
              setWorkHours('')
              onClose()
            }}
            className="px-4 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  )
}
