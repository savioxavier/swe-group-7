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
        className="bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-2"
      >
        <span className="text-2xl">Success!</span>
        <span className="font-medium">{message}</span>
      </motion.div>
    </div>,
    document.body
  )
}
