import React from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'

interface SuccessMessageProps {
  message: string
  isVisible: boolean
}

export const SuccessMessage: React.FC<SuccessMessageProps> = ({
  message,
  isVisible
}) => {
  if (!isVisible) return null

  return createPortal(
    <div className="fixed top-4 right-4 z-50">
      <motion.div
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 300 }}
        className="bg-green-500/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg shadow-lg max-w-sm"
      >
        <div className="flex items-center space-x-2">
          <span className="text-green-100 text-sm">✓</span>
          <span className="text-sm font-medium">{message}</span>
        </div>
      </motion.div>
    </div>,
    document.body
  )
}
