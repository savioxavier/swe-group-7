import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, X, Briefcase, BookOpen, Dumbbell, Palette, Plus, Trash2, List, Sprout } from 'lucide-react'
import { useSounds } from '../../lib/sounds'
import type { TaskStep } from '../../types'

interface CinematicPlantCreatorProps {
  isOpen: boolean
  position: { x: number, y: number } | null
  onClose: () => void
  onCreatePlant: (plantData: {
    name: string
    description: string
    category: string
    isMultiStep: boolean
    taskSteps: TaskStep[]
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
    category: '',
    isMultiStep: false,
    taskSteps: [] as TaskStep[]
  })
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newStepTitle, setNewStepTitle] = useState('')
  const sounds = useSounds()
  const hasPlayedOpenSound = useRef(false)

  const formSteps = [
    { field: 'category', title: 'Choose Your Plant Type', type: 'category' },
    { field: 'name', title: 'Name Your Task', type: 'text', placeholder: 'e.g. "Daily Reading", "Morning Workout"' },
    { field: 'description', title: 'Describe Your Goal', type: 'textarea', placeholder: 'What do you want to achieve?' },
    { field: 'taskType', title: 'Task Structure', type: 'task-type' },
    { field: 'steps', title: 'Define Task Steps', type: 'steps', conditional: 'isMultiStep' }
  ]

  useEffect(() => {
    if (isOpen && !hasPlayedOpenSound.current) {
      setCurrentStep(0)
      setFormData({ 
        name: '', 
        description: '', 
        category: '', 
        isMultiStep: false, 
        taskSteps: [] 
      })
      setNewStepTitle('')
      setIsSubmitting(false)
      // Play modal open sound only once
      sounds.play('ui_modal_open')
      hasPlayedOpenSound.current = true
    } else if (!isOpen) {
      // Reset the flag when modal closes
      hasPlayedOpenSound.current = false
    }
  }, [isOpen, sounds])

  const handleNext = () => {
    sounds.play('ui_button')
    
    // Skip steps that shouldn't be shown
    let nextStep = currentStep + 1
    while (nextStep < formSteps.length) {
      const step = formSteps[nextStep]
      if (step.conditional === 'isMultiStep' && !formData.isMultiStep) {
        nextStep++
        continue
      }
      break
    }
    
    if (nextStep < formSteps.length) {
      setCurrentStep(nextStep)
      sounds.play('ui_tab_switch')
    } else {
      handleSubmit()
    }
  }

  const handlePrevious = () => {
    sounds.play('ui_button')
    
    // Skip steps that shouldn't be shown when going back
    let prevStep = currentStep - 1
    while (prevStep >= 0) {
      const step = formSteps[prevStep]
      if (step.conditional === 'isMultiStep' && !formData.isMultiStep) {
        prevStep--
        continue
      }
      break
    }
    
    if (prevStep >= 0) {
      setCurrentStep(prevStep)
      sounds.play('ui_tab_switch')
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    sounds.play('ui_success')
    await new Promise(resolve => setTimeout(resolve, 800))
    onCreatePlant({
      name: formData.name,
      description: formData.description,
      category: formData.category,
      isMultiStep: formData.isMultiStep,
      taskSteps: formData.taskSteps
    })
    onClose()
  }

  const addTaskStep = () => {
    if (newStepTitle.trim()) {
      const newStep: TaskStep = {
        title: newStepTitle.trim(),
        is_completed: false
      }
      setFormData(prev => ({
        ...prev,
        taskSteps: [...prev.taskSteps, newStep]
      }))
      setNewStepTitle('')
      sounds.play('ui_success')
    }
  }

  const removeTaskStep = (index: number) => {
    setFormData(prev => ({
      ...prev,
      taskSteps: prev.taskSteps.filter((_, i) => i !== index)
    }))
    sounds.play('ui_button')
  }

  const handleClose = () => {
    sounds.play('ui_modal_close')
    onClose()
  }

  const currentStepData = formSteps[currentStep]
  
  const getStepValidation = () => {
    switch (currentStepData.type) {
      case 'category':
        return formData.category !== ''
      case 'text':
      case 'textarea':
        return (formData[currentStepData.field as keyof Pick<typeof formData, 'name' | 'description' | 'category'>] as string)?.trim() !== ''
      case 'task-type':
        return true // Always valid, just selection
      case 'steps':
        return !formData.isMultiStep || formData.taskSteps.length > 0
      default:
        return true
    }
  }
  
  const isStepValid = getStepValidation()

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
                  onClick={handleClose}
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
                  {formSteps.map((step, index) => {
                    // Skip conditional steps that shouldn't be shown
                    if (step.conditional === 'isMultiStep' && !formData.isMultiStep) {
                      return null
                    }
                    
                    return (
                      <motion.div
                        key={index}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index <= currentStep ? 'bg-yellow-300' : 'bg-green-400/30'
                        }`}
                        animate={{
                          scale: index === currentStep ? 1.2 : 1
                        }}
                      />
                    )
                  })}
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
                            onClick={() => {
                              sounds.play('ui_click')
                              setFormData({ ...formData, category: category.value })
                            }}
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
                        value={formData[currentStepData.field as keyof Pick<typeof formData, 'name'>] as string}
                        onChange={(e) => setFormData({ ...formData, [currentStepData.field]: e.target.value })}
                        className="w-full p-4 bg-green-800/30 border border-green-400/30 rounded-xl text-white placeholder-green-300 focus:border-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-300/20"
                        autoFocus
                      />
                    )}

                    {currentStepData.type === 'textarea' && (
                      <textarea
                        placeholder={currentStepData.placeholder}
                        value={formData[currentStepData.field as keyof Pick<typeof formData, 'description'>] as string}
                        onChange={(e) => setFormData({ ...formData, [currentStepData.field]: e.target.value })}
                        className="w-full p-4 bg-green-800/30 border border-green-400/30 rounded-xl text-white placeholder-green-300 focus:border-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-300/20 h-24 resize-none"
                        autoFocus
                      />
                    )}

                    {currentStepData.type === 'task-type' && (
                      <div className="space-y-4">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            sounds.play('ui_click')
                            setFormData({ ...formData, isMultiStep: false, taskSteps: [] })
                          }}
                          className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                            !formData.isMultiStep
                              ? 'border-yellow-300 bg-yellow-300/20 text-white'
                              : 'border-green-400/30 bg-green-800/30 text-green-100 hover:border-green-300'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                              <Sprout className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                              <div className="font-semibold">Simple Task</div>
                              <div className="text-sm opacity-80">One goal, track progress with work hours</div>
                            </div>
                          </div>
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            sounds.play('ui_click')
                            setFormData({ ...formData, isMultiStep: true })
                          }}
                          className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                            formData.isMultiStep
                              ? 'border-yellow-300 bg-yellow-300/20 text-white'
                              : 'border-green-400/30 bg-green-800/30 text-green-100 hover:border-green-300'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                              <List className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                              <div className="font-semibold">Multi-Step Task</div>
                              <div className="text-sm opacity-80">Break down complex projects into steps</div>
                            </div>
                          </div>
                        </motion.button>
                      </div>
                    )}

                    {currentStepData.type === 'steps' && formData.isMultiStep && (
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2 mb-4">
                          <input
                            type="text"
                            placeholder="Add a step (e.g. 'Research topic', 'Write outline')"
                            value={newStepTitle}
                            onChange={(e) => setNewStepTitle(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && addTaskStep()}
                            className="flex-1 p-3 bg-green-800/30 border border-green-400/30 rounded-lg text-white placeholder-green-300 focus:border-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-300/20"
                          />
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={addTaskStep}
                            disabled={!newStepTitle.trim()}
                            className="p-3 bg-yellow-300 text-green-800 rounded-lg hover:bg-yellow-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Plus size={16} />
                          </motion.button>
                        </div>

                        {formData.taskSteps.length > 0 && (
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {formData.taskSteps.map((step, index) => (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center space-x-3 p-3 bg-green-800/20 rounded-lg border border-green-400/20"
                              >
                                <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                                  {index + 1}
                                </div>
                                <div className="flex-1 text-white text-sm">
                                  {step.title}
                                </div>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => removeTaskStep(index)}
                                  className="text-red-400 hover:text-red-300 transition-colors"
                                >
                                  <Trash2 size={14} />
                                </motion.button>
                              </motion.div>
                            ))}
                          </div>
                        )}

                        {formData.taskSteps.length === 0 && (
                          <div className="text-center py-8 text-green-300 opacity-60">
                            <List className="w-8 h-8 mx-auto mb-2" />
                            <p>Add steps to break down your task</p>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="p-6 pt-0 flex justify-between">
                <button
                  onClick={() => currentStep > 0 ? handlePrevious() : onClose()}
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
                      <span>
                        {(() => {
                          let finalStep = formSteps.length - 1
                          if (formSteps[finalStep]?.conditional === 'isMultiStep' && !formData.isMultiStep) {
                            finalStep--
                          }
                          return currentStep >= finalStep ? 'Plant Seed' : 'Next'
                        })()}
                      </span>
                      <Sprout size={16} />
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