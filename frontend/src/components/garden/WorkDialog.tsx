import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { Clock, Plus, CheckCircle, Circle, List } from 'lucide-react'
import type { Plant } from './constants'

interface WorkDialogProps {
  plant: Plant | null
  isOpen: boolean
  onClose: () => void
  onLogWork: (plantId: string, hours: number) => Promise<void>
  onCompleteStep?: (plantId: string, stepId: string, hours?: number) => Promise<void>
  onPartialStep?: (plantId: string, stepId: string, hours: number) => Promise<void>
}

export const WorkDialog: React.FC<WorkDialogProps> = ({
  plant,
  isOpen,
  onClose,
  onLogWork,
  onCompleteStep,
  onPartialStep
}) => {
  const [workHours, setWorkHours] = useState('')
  const [selectedMode, setSelectedMode] = useState<'hours' | 'steps'>('hours')
  const [selectedStepAction, setSelectedStepAction] = useState<'complete' | 'partial'>('complete')

  const handleSubmit = async () => {
    if (!plant || !workHours || parseFloat(workHours) <= 0) return
    
    await onLogWork(plant.id, parseFloat(workHours))
    setWorkHours('')
    onClose()
  }

  const handleStepComplete = async (stepId: string) => {
    if (!plant || !onCompleteStep) return
    
    const hours = workHours && parseFloat(workHours) > 0 ? parseFloat(workHours) : undefined
    await onCompleteStep(plant.id, stepId, hours)
    setWorkHours('')
    onClose()
  }

  const handleStepPartial = async (stepId: string) => {
    if (!plant || !onPartialStep || !workHours || parseFloat(workHours) <= 0) return
    
    await onPartialStep(plant.id, stepId, parseFloat(workHours))
    setWorkHours('')
    onClose()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (selectedMode === 'hours') {
        handleSubmit()
      }
    }
  }

  const quickHours = [0.5, 1, 2, 4, 8]
  const incompletedSteps = plant?.task_steps?.filter(step => !step.is_completed) || []

  if (!isOpen || !plant) return null

  // Show step selection for multi-step tasks with incomplete steps
  const showStepMode = plant.is_multi_step && incompletedSteps.length > 0

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl"
      >
        {/* Header with plant name and icon */}
        <div className="flex items-center gap-3 mb-6">
          <motion.div
            initial={{ rotate: -10 }}
            animate={{ rotate: 0 }}
            className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg"
          >
            <Clock className="w-6 h-6 text-white" />
          </motion.div>
          <div>
            <h3 className="text-xl font-bold text-white">
              {plant.is_multi_step ? 'Work Progress' : 'Log Work Time'}
            </h3>
            <p className="text-sm text-emerald-300 font-medium">
              {plant.name}
            </p>
          </div>
        </div>

        {/* Mode Selection (for multi-step tasks) */}
        {showStepMode && (
          <div className="mb-6">
            <div className="flex rounded-xl bg-white/5 p-1 border border-white/10">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedMode('steps')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  selectedMode === 'steps'
                    ? 'bg-purple-500 text-white shadow-lg'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <List className="w-4 h-4" />
                Complete Step
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedMode('hours')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  selectedMode === 'hours'
                    ? 'bg-emerald-500 text-white shadow-lg'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <Clock className="w-4 h-4" />
                Log Hours
              </motion.button>
            </div>
          </div>
        )}

        {/* Step Selection (for multi-step tasks in step mode) */}
        {showStepMode && selectedMode === 'steps' && (
          <div className="mb-6">
            {/* Step Action Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-purple-200 mb-3">
                What would you like to do?
              </label>
              <div className="flex rounded-xl bg-white/5 p-1 border border-white/10">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedStepAction('complete')}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    selectedStepAction === 'complete'
                      ? 'bg-green-500 text-white shadow-lg'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  Complete Step
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedStepAction('partial')}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    selectedStepAction === 'partial'
                      ? 'bg-yellow-500 text-white shadow-lg'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  Add Progress
                </motion.button>
              </div>
            </div>

            {/* Hours input for partial completion */}
            {selectedStepAction === 'partial' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-yellow-200 mb-2">
                  Hours worked on this step:
                </label>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  max="24"
                  value={workHours}
                  onChange={(e) => setWorkHours(e.target.value)}
                  placeholder="Enter hours"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 transition-all text-sm"
                />
              </div>
            )}

            <label className="block text-sm font-medium text-purple-200 mb-3">
              {selectedStepAction === 'complete' ? 'Which step did you complete?' : 'Which step did you work on?'}
            </label>
            
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {incompletedSteps.map((step, index) => (
                <motion.button
                  key={step.id || index}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    if (selectedStepAction === 'complete') {
                      handleStepComplete(step.id || `step-${index}`)
                    } else {
                      handleStepPartial(step.id || `step-${index}`)
                    }
                  }}
                  disabled={selectedStepAction === 'partial' && (!workHours || parseFloat(workHours) <= 0)}
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-left hover:bg-white/10 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 ${step.is_partial ? 'text-yellow-400' : 'text-white/40'} group-hover:text-purple-400`}>
                      {step.is_partial ? (
                        <Circle className="w-4 h-4 fill-yellow-400/30" />
                      ) : (
                        <Circle className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-medium text-sm">
                        {step.title}
                        {step.work_hours && step.work_hours > 0 && (
                          <span className="ml-2 text-xs text-white/60">
                            ({step.work_hours.toFixed(1)}h worked)
                          </span>
                        )}
                      </div>
                      {step.description && (
                        <div className="text-white/60 text-xs mt-1">
                          {step.description}
                        </div>
                      )}
                      {step.is_partial && (
                        <div className="text-xs text-yellow-400/80 mt-1">
                          In Progress
                        </div>
                      )}
                    </div>
                    <CheckCircle className={`w-4 h-4 ${selectedStepAction === 'complete' ? 'text-green-400' : 'text-yellow-400'} opacity-0 group-hover:opacity-100 transition-opacity`} />
                  </div>
                </motion.button>
              ))}
            </div>

            {incompletedSteps.length === 0 && (
              <div className="text-center py-6 text-green-300">
                <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                <p>All steps completed!</p>
              </div>
            )}
          </div>
        )}

        {/* Work hours input */}
        {(!showStepMode || selectedMode === 'hours') && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-emerald-200 mb-3">
              How many hours did you work?
            </label>
            
            {/* Quick selection buttons */}
            <div className="flex gap-2 mb-4">
              {quickHours.map((hours) => (
                <motion.button
                  key={hours}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setWorkHours(hours.toString())}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    workHours === hours.toString()
                      ? 'bg-emerald-500 text-white shadow-lg'
                      : 'bg-white/10 text-white/70 hover:bg-white/15 border border-white/10'
                  }`}
                >
                  {hours}h
                </motion.button>
              ))}
            </div>

            {/* Custom input */}
            <div className="relative">
              <input
                type="number"
                step="0.25"
                min="0"
                max="24"
                value={workHours}
                onChange={(e) => setWorkHours(e.target.value)}
                placeholder="Enter custom hours"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                autoFocus={!showStepMode || selectedMode === 'hours'}
                onKeyPress={handleKeyPress}
                style={{ fontSize: '16px' }}
              />
              {workHours && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400"
                >
                  <Clock className="w-4 h-4" />
                </motion.div>
              )}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          {(!showStepMode || selectedMode === 'hours') && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={!workHours || parseFloat(workHours) <= 0}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 disabled:from-gray-500 disabled:to-gray-600 disabled:opacity-50 text-white rounded-xl font-medium transition-all shadow-lg disabled:shadow-none flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Log Work
            </motion.button>
          )}
          
          {showStepMode && selectedMode === 'steps' && (
            <div className="flex-1 text-center text-purple-200 text-sm">
              {selectedStepAction === 'complete' 
                ? 'Click on a step above to mark it as complete' 
                : 'Enter hours and click on a step to add progress'
              }
            </div>
          )}
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setWorkHours('')
              onClose()
            }}
            className="px-4 py-3 bg-white/10 hover:bg-white/15 text-white rounded-xl font-medium transition-all border border-white/10"
          >
            Cancel
          </motion.button>
        </div>
      </motion.div>
    </div>,
    document.body
  )
}
