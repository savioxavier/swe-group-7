import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Leaf, Sparkles, X, Briefcase, BookOpen, Dumbbell, Palette } from 'lucide-react'

interface CinematicPlantCreatorProps {
  isOpen: boolean
  position: { x: number, y: number } | null
  onClose: () => void
  onCreatePlant: (plantData: {
    name: string
    description: string
    category: string
  }) => void
}

const CATEGORIES = [
  { value: 'work', label: 'Work', description: 'Professional tasks', icon: Briefcase },
  { value: 'study', label: 'Study', description: 'Learning & education', icon: BookOpen },
  { value: 'exercise', label: 'Exercise', description: 'Fitness & health', icon: Dumbbell },
  { value: 'creative', label: 'Creative', description: 'Arts & projects', icon: Palette }
]

export const CinematicPlantCreator: React.FC<CinematicPlantCreatorProps> = ({
  isOpen,
  position,
  onClose,
  onCreatePlant
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: ''
  })
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const formSteps = [
    { field: 'category', title: 'Choose Your Plant Type', type: 'category' },
    { field: 'name', title: 'Name Your Task', type: 'text', placeholder: 'e.g. "Daily Reading", "Morning Workout"' },
    { field: 'description', title: 'Describe Your Goal', type: 'textarea', placeholder: 'What do you want to achieve?' }
  ]

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0)
      setFormData({ name: '', description: '', category: '' })
      setIsSubmitting(false)
    }
  }, [isOpen])

  const handleNext = () => {
    if (currentStep < formSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleSubmit()
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    await new Promise(resolve => setTimeout(resolve, 800))
    onCreatePlant(formData)
    onClose()
  }

  const currentStepData = formSteps[currentStep]
  const isStepValid = formData[currentStepData.field as keyof typeof formData]?.trim() !== ''

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{ 
              type: "spring",
              stiffness: 300,
              damping: 30,
              mass: 0.8
            }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <div className="w-full max-w-[90vw] sm:max-w-md bg-gradient-to-br from-green-700 via-green-600 to-emerald-600 rounded-2xl shadow-2xl border border-green-400/30">
              {/* Header */}
              <div className="relative p-6 text-center border-b border-green-400/20">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-green-200 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
                
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center justify-center space-x-2 mb-2"
                >
                  <Sparkles className="text-yellow-300" size={20} />
                  <h2 className="text-xl font-bold text-white">
                    {currentStepData.title}
                  </h2>
                  <Sparkles className="text-yellow-300" size={20} />
                </motion.div>
                
                {position && (
                  <p className="text-green-200 text-sm">
                    Planting at position ({position.x + 1}, {position.y + 1})
                  </p>
                )}
                
                {/* Progress Indicator */}
                <div className="flex justify-center space-x-2 mt-4">
                  {formSteps.map((_, index) => (
                    <motion.div
                      key={index}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index <= currentStep ? 'bg-yellow-300' : 'bg-green-400/30'
                      }`}
                      animate={{
                        scale: index === currentStep ? 1.2 : 1
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Form Content */}
              <div className="p-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {currentStepData.type === 'category' && (
                      <div className="grid grid-cols-2 gap-3">
                        {CATEGORIES.map((category) => (
                          <motion.button
                            key={category.value}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setFormData({ ...formData, category: category.value })}
                            className={`p-4 rounded-xl border-2 transition-all ${
                              formData.category === category.value
                                ? 'border-yellow-300 bg-yellow-300/20 text-white'
                                : 'border-green-400/30 bg-green-800/30 text-green-100 hover:border-green-300'
                            }`}
                          >
                            <div className="flex justify-center items-center text-2xl mb-2">
                              <category.icon size={24} className="text-current" />
                            </div>
                            <div className="font-semibold text-sm">{category.label}</div>
                            <div className="text-xs opacity-80">{category.description}</div>
                          </motion.button>
                        ))}
                      </div>
                    )}

                    {currentStepData.type === 'text' && (
                      <input
                        type="text"
                        placeholder={currentStepData.placeholder}
                        value={formData[currentStepData.field as keyof typeof formData]}
                        onChange={(e) => setFormData({ ...formData, [currentStepData.field]: e.target.value })}
                        className="w-full p-4 bg-green-800/30 border border-green-400/30 rounded-xl text-white placeholder-green-300 focus:border-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-300/20"
                        autoFocus
                      />
                    )}

                    {currentStepData.type === 'textarea' && (
                      <textarea
                        placeholder={currentStepData.placeholder}
                        value={formData[currentStepData.field as keyof typeof formData]}
                        onChange={(e) => setFormData({ ...formData, [currentStepData.field]: e.target.value })}
                        className="w-full p-4 bg-green-800/30 border border-green-400/30 rounded-xl text-white placeholder-green-300 focus:border-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-300/20 h-24 resize-none"
                        autoFocus
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="p-6 pt-0 flex justify-between">
                <button
                  onClick={() => currentStep > 0 ? setCurrentStep(currentStep - 1) : onClose()}
                  className="px-4 py-2 text-green-200 hover:text-white transition-colors"
                >
                  {currentStep > 0 ? 'Back' : 'Cancel'}
                </button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleNext}
                  disabled={!isStepValid || isSubmitting}
                  className="px-6 py-2 bg-yellow-300 text-green-800 font-semibold rounded-lg hover:bg-yellow-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-green-800/30 border-t-green-800 rounded-full"
                      />
                      <span>Planting...</span>
                    </>
                  ) : (
                    <>
                      <span>{currentStep === formSteps.length - 1 ? 'Plant Seed' : 'Next'}</span>
                      <Leaf size={16} />
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}