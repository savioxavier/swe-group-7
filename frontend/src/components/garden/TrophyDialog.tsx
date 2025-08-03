import React from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { Trophy, Sparkles, Award, TrendingUp, X, Dumbbell, BookOpen, Briefcase, Palette, Target } from 'lucide-react'
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

  const getPlantTypeIcon = (type: string) => {
    switch (type) {
      case 'exercise': return <Dumbbell className="w-6 h-6 text-orange-400" />
      case 'study': return <BookOpen className="w-6 h-6 text-blue-400" />
      case 'work': return <Briefcase className="w-6 h-6 text-purple-400" />
      case 'creative': return <Palette className="w-6 h-6 text-pink-400" />
      default: return <Target className="w-6 h-6 text-green-400" />
    }
  }

  return createPortal(
    <motion.div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={handleClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 50 }}
        transition={{ type: "spring", duration: 0.6, bounce: 0.3 }}
        className="w-full max-w-sm bg-gradient-to-br from-yellow-500/10 via-orange-500/10 to-red-500/10 backdrop-blur-xl rounded-3xl border border-yellow-400/30 shadow-2xl overflow-hidden relative"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute -top-10 -right-10 w-20 h-20 bg-yellow-400/20 rounded-full"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute -bottom-6 -left-6 w-16 h-16 bg-orange-400/20 rounded-full"
            animate={{ 
              scale: [1.2, 1, 1.2],
              opacity: [0.4, 0.2, 0.4]
            }}
            transition={{ 
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1.5
            }}
          />
        </div>

        {/* Header */}
        <div className="relative p-6 pb-4">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors group"
          >
            <X className="w-4 h-4 text-white/70 group-hover:text-white" />
          </button>
          
          <div className="text-center">
            {/* Animated Trophy */}
            <motion.div
              className="relative inline-block mb-4"
              initial={{ rotateY: 0 }}
              animate={{ rotateY: [0, 20, -20, 0] }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Trophy className="w-16 h-16 text-yellow-400 mx-auto" />
              <motion.div
                className="absolute -top-2 -right-2"
                animate={{ 
                  scale: [1, 1.3, 1],
                  rotate: [0, 360]
                }}
                transition={{ 
                  duration: 1.5,
                  repeat: Infinity,
                }}
              >
                <Sparkles className="w-6 h-6 text-yellow-300" />
              </motion.div>
            </motion.div>
            
            <motion.h2 
              className="text-2xl font-bold text-white mb-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Ready to Harvest!
            </motion.h2>
            
            <motion.div
              className="flex items-center justify-center space-x-2 text-yellow-300 mb-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center justify-center">{getPlantTypeIcon(plant.type)}</div>
              <span className="text-lg font-semibold">
                {plant.name.replace(/^(Exercise|Study|Work|Self-care|Creative)\s+/i, '')}
              </span>
            </motion.div>
            
            <motion.p 
              className="text-sm text-white/80"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              Your {plant.type} task is complete and ready for harvest!
            </motion.p>
          </div>
        </div>

        {/* Rewards Preview */}
        <motion.div 
          className="px-6 pb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <div className="flex items-center space-x-2 mb-3">
              <Award className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium text-white">Harvest Rewards</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-lg font-bold text-white">{plant.experience_points}</span>
                </div>
                <div className="text-xs text-white/60">Experience Points</div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span className="text-lg font-bold text-white">{plant.current_streak || 0}</span>
                </div>
                <div className="text-xs text-white/60">Day Streak</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action Button */}
        <motion.div 
          className="px-6 pb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
        >
          <motion.button
            onClick={handleAcknowledge}
            className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-xl font-bold transition-all duration-200 shadow-lg relative overflow-hidden"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.div
              className="absolute inset-0 bg-white/20"
              initial={{ x: '-100%' }}
              whileHover={{ x: '100%' }}
              transition={{ duration: 0.5 }}
            />
            <span className="relative flex items-center justify-center space-x-2">
              <Trophy className="w-5 h-5" />
              <span>Claim Harvest</span>
            </span>
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>,
    document.body
  )
}
