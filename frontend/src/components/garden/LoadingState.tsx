import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Leaf, Sprout, TreePine, Award, RefreshCw, Target, Zap } from 'lucide-react'

const LOADING_MESSAGES = [
  "Growing your garden...",
  "Nurturing your plants...", 
  "Checking plant health...",
  "Calculating growth progress...",
  "Loading your achievements...",
  "Refreshing your productivity...",
  "Synchronizing your streaks...",
  "Preparing your daily tasks..."
]

const MOTIVATIONAL_QUOTES = [
  "Every small step counts towards your goals!",
  "Consistency beats perfection every time!", 
  "Your plants are cheering you on!",
  "Progress is progress, no matter how small!",
  "You're building amazing habits!",
  "Keep growing, you're doing great!",
  "Your dedication is inspiring!"
]

const getMessageIcon = (index: number) => {
  const icons = [
    <Leaf className="w-5 h-5 text-green-500" />,
    <Sprout className="w-5 h-5 text-green-600" />,
    <TreePine className="w-5 h-5 text-green-700" />,
    <Zap className="w-5 h-5 text-yellow-500" />,
    <Award className="w-5 h-5 text-yellow-600" />,
    <RefreshCw className="w-5 h-5 text-blue-500" />,
    <Target className="w-5 h-5 text-purple-500" />,
    <Leaf className="w-5 h-5 text-green-500" />
  ]
  return icons[index] || icons[0]
}

interface LoadingStateProps {
  isLoading: boolean
}

export function LoadingState({ isLoading }: LoadingStateProps) {
  const [currentMessage, setCurrentMessage] = useState(0)
  const [showQuote, setShowQuote] = useState(false)

  useEffect(() => {
    if (!isLoading) return

    const messageInterval = setInterval(() => {
      setCurrentMessage(prev => (prev + 1) % LOADING_MESSAGES.length)
    }, 1500)

    // Show motivational quote after 2 seconds
    const quoteTimeout = setTimeout(() => {
      setShowQuote(true)
    }, 2000)

    return () => {
      clearInterval(messageInterval)
      clearTimeout(quoteTimeout)
      setShowQuote(false)
    }
  }, [isLoading])

  if (!isLoading) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl"
      >
        {/* Animated loading spinner */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 mx-auto mb-6"
        >
          <div className="w-full h-full rounded-full border-4 border-green-100 border-t-green-500"></div>
        </motion.div>

        {/* Loading message with icon */}
        <motion.div
          key={currentMessage}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-center space-x-3 text-lg font-medium text-gray-800 mb-4"
        >
          {getMessageIcon(currentMessage)}
          <span>{LOADING_MESSAGES[currentMessage]}</span>
        </motion.div>

        {/* Progress dots */}
        <div className="flex justify-center space-x-2 mb-6">
          {[0, 1, 2].map((dot) => (
            <motion.div
              key={dot}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 1, 0.3]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: dot * 0.2
              }}
              className="w-2 h-2 bg-green-500 rounded-full"
            />
          ))}
        </div>

        {/* Motivational quote */}
        {showQuote && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-gray-600 italic border-t pt-4"
          >
            {MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]}
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  )
}
