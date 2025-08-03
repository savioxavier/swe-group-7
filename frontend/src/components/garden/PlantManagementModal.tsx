import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { Edit3, Trash2, Plus, X, Circle } from 'lucide-react'
import type { Plant } from './constants'
import { useSounds } from '../../lib/sounds'

interface PlantManagementModalProps {
  plant: Plant | null
  isOpen: boolean
  onClose: () => void
  onDeletePlant: (plantId: string) => Promise<void>
  onRenamePlant: (plantId: string, newName: string) => Promise<void>
  onConvertToMultiStep?: (plantId: string, steps: Array<{title: string, description?: string}>) => Promise<void>
}

export const PlantManagementModal: React.FC<PlantManagementModalProps> = ({
  plant,
  isOpen,
  onClose,
  onDeletePlant,
  onRenamePlant,
  onConvertToMultiStep
}) => {
  const { playUI } = useSounds()
  const wasOpenRef = useRef(false)
  const [newName, setNewName] = useState('')
  const [showRename, setShowRename] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showConversionForm, setShowConversionForm] = useState(false)
  const [newSteps, setNewSteps] = useState([{ title: '', description: '' }])
  const [isLoading, setIsLoading] = useState(false)

  // Track modal state changes and play appropriate sounds
  useEffect(() => {
    if (!wasOpenRef.current && isOpen) {
      // Modal is opening - play open sound
      playUI('modal_open')
    } else if (wasOpenRef.current && !isOpen) {
      // Modal was open and is now closing - play close sound
      playUI('modal_close')
    }
    wasOpenRef.current = isOpen
  }, [isOpen, playUI])

  const handleRename = async () => {
    if (!plant || !newName.trim()) return
    
    setIsLoading(true)
    try {
      await onRenamePlant(plant.id, newName.trim())
      setNewName('')
      setShowRename(false)
      onClose()
    } catch (error) {
      console.error('Failed to rename plant:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!plant) return
    
    setIsLoading(true)
    try {
      await onDeletePlant(plant.id)
      setShowDeleteConfirm(false)
      onClose()
    } catch (error) {
      console.error('Failed to delete plant:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddStep = () => {
    setNewSteps([...newSteps, { title: '', description: '' }])
  }

  const handleRemoveStep = (index: number) => {
    if (newSteps.length > 1) {
      setNewSteps(newSteps.filter((_, i) => i !== index))
    }
  }

  const handleStepChange = (index: number, field: 'title' | 'description', value: string) => {
    const updated = newSteps.map((step, i) => 
      i === index ? { ...step, [field]: value } : step
    )
    setNewSteps(updated)
  }

  const handleConvert = async () => {
    if (!onConvertToMultiStep || !plant) return
    
    const validSteps = newSteps.filter(step => step.title.trim() !== '')
    if (validSteps.length === 0) return
    
    setIsLoading(true)
    try {
      await onConvertToMultiStep(plant.id, validSteps)
      setShowConversionForm(false)
      setNewSteps([{ title: '', description: '' }])
      onClose()
    } catch (error) {
      console.error('Failed to convert to multi-step:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const resetModal = () => {
    setShowRename(false)
    setShowDeleteConfirm(false)
    setShowConversionForm(false)
    setNewName('')
    setNewSteps([{ title: '', description: '' }])
    setIsLoading(false)
  }

  const handleClose = () => {
    playUI('click')
    resetModal()
    onClose()
  }

  if (!isOpen || !plant) return null

  return createPortal(
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={handleClose}
    >
      <motion.div
        className={`bg-black/90 backdrop-blur-sm rounded-2xl border border-white/20 w-full ${
          showConversionForm ? 'max-w-4xl max-h-[85vh]' : 'max-w-md max-h-[90vh]'
        } overflow-hidden flex flex-col`}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white text-xl font-bold mb-1">
                {showConversionForm ? (
                  <span className="flex items-center gap-2">
                    <Edit3 className="w-5 h-5 text-purple-400" />
                    {plant.is_multi_step ? 'Add More Steps' : 'Convert to Multi-Step'}
                  </span>
                ) : showRename ? 'Rename Plant' 
                : showDeleteConfirm ? 'Delete Plant' 
                : 'Plant Management'}
              </h2>
              <p className="text-white/70 text-sm">
                {showConversionForm ? (
                  plant.is_multi_step 
                    ? 'Add additional steps to this multi-step task.' 
                    : 'Break down your task into smaller, manageable steps.'
                ) : plant.name}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors group"
              disabled={isLoading}
            >
              <X className="w-4 h-4 text-white/70 group-hover:text-white" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Default Management View */}
          {!showRename && !showDeleteConfirm && !showConversionForm && (
            <div className="space-y-4">
              {/* Plant Info */}
              <div className="bg-white/10 rounded-lg p-4">
                <h3 className="text-white font-medium mb-3">Plant Information</h3>
                <div className="text-white text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-white/70">Stage:</span>
                    <span>{plant.stage}/5</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Type:</span>
                    <span className="capitalize">{plant.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Experience:</span>
                    <span>{plant.experience_points} XP</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Position:</span>
                    <span>({plant.x}, {plant.y})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Task Type:</span>
                    <span>{plant.is_multi_step ? 'Multi-Step Task' : 'Single-Step Task'}</span>
                  </div>
                  {plant.current_streak && (
                    <div className="flex justify-between">
                      <span className="text-white/70">Streak:</span>
                      <span>{plant.current_streak} days</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Management Actions */}
              <div className="space-y-3">
                <button
                  onClick={() => setShowRename(true)}
                  className="w-full text-left px-4 py-3 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg transition-colors flex items-center space-x-3"
                  disabled={isLoading}
                >
                  <Edit3 className="w-5 h-5 text-blue-400" />
                  <div>
                    <div className="text-white font-medium">Rename Plant</div>
                    <div className="text-white/60 text-sm">Change the plant's display name</div>
                  </div>
                </button>

                {/* Convert to Multi-Step Button - Only show for single-step tasks */}
                {!plant.is_multi_step && onConvertToMultiStep && (
                  <button
                    onClick={() => setShowConversionForm(true)}
                    className="w-full text-left px-4 py-3 bg-purple-600/20 hover:bg-purple-600/30 rounded-lg transition-colors flex items-center space-x-3"
                    disabled={isLoading}
                  >
                    <Edit3 className="w-5 h-5 text-purple-400" />
                    <div>
                      <div className="text-white font-medium">Convert to Multi-Step Task</div>
                      <div className="text-white/60 text-sm">Break down into smaller, trackable steps</div>
                    </div>
                  </button>
                )}

                {/* Add More Steps Button - Only show for multi-step tasks */}
                {plant.is_multi_step && onConvertToMultiStep && (
                  <button
                    onClick={() => setShowConversionForm(true)}
                    className="w-full text-left px-4 py-3 bg-purple-600/20 hover:bg-purple-600/30 rounded-lg transition-colors flex items-center space-x-3"
                    disabled={isLoading}
                  >
                    <Plus className="w-5 h-5 text-purple-400" />
                    <div>
                      <div className="text-white font-medium">Add More Steps</div>
                      <div className="text-white/60 text-sm">Add additional steps to this task</div>
                    </div>
                  </button>
                )}

                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full text-left px-4 py-3 bg-red-600/20 hover:bg-red-600/30 rounded-lg transition-colors flex items-center space-x-3"
                  disabled={isLoading}
                >
                  <Trash2 className="w-5 h-5 text-red-400" />
                  <div>
                    <div className="text-white font-medium">Delete Plant</div>
                    <div className="text-white/60 text-sm">Permanently remove this plant</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Multi-Step Conversion Form */}
          {showConversionForm && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-purple-600/10 to-blue-600/10 rounded-lg p-4 border border-purple-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <Edit3 className="w-5 h-5 text-purple-400" />
                  <h3 className="text-white font-medium">Task Steps</h3>
                </div>
                <p className="text-white/70 text-sm mb-4">
                  Each step will contribute to your plant's growth. Complete steps to advance through growth stages!
                </p>
                
                {/* Steps Container with better scrolling */}
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {newSteps.map((step, index) => (
                    <motion.div 
                      key={index} 
                      className="bg-white/5 rounded-lg p-4 border border-white/10"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <Circle className="w-4 h-4 text-purple-300" />
                        <span className="text-sm font-medium text-purple-300">
                          Step {index + 1}
                        </span>
                        {newSteps.length > 1 && (
                          <button
                            onClick={() => handleRemoveStep(index)}
                            className="ml-auto text-red-400 hover:text-red-300 transition-colors p-1 rounded hover:bg-red-400/10"
                            disabled={isLoading}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder="Step title (required)..."
                          value={step.title}
                          onChange={(e) => handleStepChange(index, 'title', e.target.value)}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 text-sm transition-all"
                          disabled={isLoading}
                        />
                        
                        <textarea
                          placeholder="Optional description..."
                          value={step.description}
                          onChange={(e) => handleStepChange(index, 'description', e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 text-sm resize-none transition-all"
                          disabled={isLoading}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>

                <button
                  onClick={handleAddStep}
                  className="w-full mt-4 py-3 bg-gradient-to-r from-purple-500/20 to-purple-600/20 hover:from-purple-500/30 hover:to-purple-600/30 text-white rounded-lg font-medium transition-all border border-purple-500/30 hover:border-purple-500/50 flex items-center justify-center gap-2"
                  disabled={isLoading}
                >
                  <Plus className="w-4 h-4" />
                  Add Another Step
                </button>
              </div>
            </div>
          )}

          {/* Rename Form */}
          {showRename && (
            <div className="space-y-4">
              <div className="bg-blue-600/10 rounded-lg p-4 border border-blue-500/20">
                <label className="block text-white text-sm font-medium mb-3">
                  New Plant Name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={plant.name}
                  className="w-full px-3 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  maxLength={50}
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* Delete Confirmation */}
          {showDeleteConfirm && (
            <div className="space-y-4">
              <div className="bg-red-600/20 border border-red-600/30 rounded-lg p-4">
                <h3 className="text-red-400 font-medium mb-2">Confirm Deletion</h3>
                <p className="text-white/80 text-sm">
                  Are you sure you want to delete <strong>"{plant.name}"</strong>? This action cannot be undone.
                  All progress and work logged for this plant will be permanently lost.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 pt-4 border-t border-white/10 flex-shrink-0">
          {showConversionForm && (
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConversionForm(false)
                  setNewSteps([{ title: '', description: '' }])
                }}
                className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleConvert}
                disabled={newSteps.every(step => step.title.trim() === '') || isLoading}
                className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:opacity-50 rounded-lg text-white transition-colors flex items-center justify-center gap-2 font-medium"
              >
                <Edit3 className="w-4 h-4" />
                {isLoading ? 'Converting...' : (plant.is_multi_step ? 'Add Steps' : 'Convert Task')}
              </button>
            </div>
          )}

          {showRename && (
            <div className="flex gap-3">
              <button
                onClick={() => setShowRename(false)}
                className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleRename}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors disabled:opacity-50 font-medium"
                disabled={!newName.trim() || isLoading}
              >
                {isLoading ? 'Renaming...' : 'Rename'}
              </button>
            </div>
          )}

          {showDeleteConfirm && (
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-colors disabled:opacity-50 font-medium"
                disabled={isLoading}
              >
                {isLoading ? 'Deleting...' : 'Delete Plant'}
              </button>
            </div>
          )}

          {!showRename && !showDeleteConfirm && !showConversionForm && (
            <button
              onClick={handleClose}
              className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors font-medium"
              disabled={isLoading}
            >
              Close
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>,
    document.body
  )
}
