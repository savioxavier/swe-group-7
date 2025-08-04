import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { X, Calendar, TrendingUp, MapPin, Zap, Award, Activity, Dumbbell, BookOpen, Briefcase, Palette, Sprout, TreePine, Flower2, Target, CheckCircle, Circle, List } from 'lucide-react'
import type { Plant } from './constants'
import { useSounds } from '../../lib/sounds'

interface PlantDetailsModalProps {
  plant: Plant | null
  isOpen: boolean
  onClose: () => void
}

export const PlantDetailsModal: React.FC<PlantDetailsModalProps> = ({
  plant,
  isOpen,
  onClose
}) => {
  const { playUI } = useSounds()
  const wasOpenRef = useRef(false)

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

  if (!isOpen || !plant) return null

  const getPlantTypeIcon = (type: string) => {
    switch (type) {
      case 'exercise': return <Dumbbell className="w-8 h-8 text-orange-400" />
      case 'study': return <BookOpen className="w-8 h-8 text-blue-400" />
      case 'work': return <Briefcase className="w-8 h-8 text-purple-400" />
      case 'creative': return <Palette className="w-8 h-8 text-pink-400" />
      default: return <Target className="w-8 h-8 text-green-400" />
    }
  }

  const getStageInfo = (stage: number) => {
    if (stage === 0) return { name: 'Seed', color: 'text-gray-400', icon: <Target className="w-4 h-4 text-gray-400" /> }
    if (stage === 1) return { name: 'Sprout', color: 'text-green-400', icon: <Sprout className="w-4 h-4 text-green-400" /> }
    if (stage === 2) return { name: 'Seedling', color: 'text-green-500', icon: <Sprout className="w-4 h-4 text-green-500" /> }
    if (stage === 3) return { name: 'Growing', color: 'text-green-600', icon: <TreePine className="w-4 h-4 text-green-600" /> }
    if (stage === 4) return { name: 'Mature', color: 'text-yellow-400', icon: <TreePine className="w-4 h-4 text-yellow-400" /> }
    return { name: 'Blooming', color: 'text-yellow-500', icon: <Flower2 className="w-4 h-4 text-yellow-500" /> }
  }

  // Calculate progress based on milestone-based growth system
  const getTaskProgress = () => {
    if (plant.is_multi_step && plant.task_steps) {
      const totalSteps = plant.task_steps.length
      const completedSteps = plant.task_steps.filter(step => step.is_completed).length
      return totalSteps > 0 ? Math.floor((completedSteps / totalSteps) * 100) : 0
    }
    // For single-step tasks, show growth progress with visual feedback
    return Math.floor((plant.stage / 5) * 100)
  }
  
  const getGrowthStage = () => {
    if (plant.is_multi_step && plant.task_steps) {
      const completedSteps = plant.task_steps.filter(step => step.is_completed).length
      return Math.min(5, completedSteps) // Each completed step = 1 growth stage
    }
    return plant.stage // Single-step tasks use existing stage system
  }
  
  const taskProgress = getTaskProgress()
  const growthStage = getGrowthStage()
  const progressLabel = plant.is_multi_step ? 'Milestone Progress' : 'Growth Progress'
  const stageInfo = getStageInfo(growthStage)

  return createPortal(
    <motion.div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="w-full max-w-2xl max-h-[90vh] bg-black/40 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden overflow-y-auto"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <div className="relative p-6 pb-0">
          <button
            onClick={() => {
              playUI('click')
              onClose()
            }}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors group"
          >
            <X className="w-4 h-4 text-white/70 group-hover:text-white" />
          </button>
          
          <div className="text-center">
            <div className="mb-3 flex justify-center">{getPlantTypeIcon(plant.type)}</div>
            <h2 className="text-xl font-bold text-white mb-1">
              {plant.name.replace(/^(Exercise|Study|Work|Self-care|Creative)\s+/i, '')}
            </h2>
            <div className="flex items-center justify-center space-x-2 text-sm text-white/70">
              <span className="capitalize">{plant.type}</span>
              <span>•</span>
              <div className="flex items-center space-x-1">
                <span className={stageInfo.color}>{stageInfo.name}</span>
                {stageInfo.icon}
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4">
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-sm font-medium text-white">{progressLabel}</span>
              </div>
              <span className="text-sm font-bold text-green-400">{taskProgress}%</span>
            </div>
            
            <div className="relative">
              <div className="w-full bg-white/10 rounded-full h-3">
                <motion.div 
                  className="h-3 rounded-full bg-gradient-to-r from-green-400 to-green-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${taskProgress}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
              <div className="flex justify-between text-xs text-white/60 mt-2">
                <span>{plant.is_multi_step ? 'Started' : 'Planted'}</span>
                <span>{plant.is_multi_step ? 'All Steps Complete' : 'Ready to Harvest'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 pb-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center space-x-2 mb-2">
                <Award className="w-4 h-4 text-yellow-400" />
                <span className="text-xs font-medium text-white/70">Experience</span>
              </div>
              <div className="text-lg font-bold text-white">{plant.experience_points}</div>
              <div className="text-xs text-white/50">XP earned</div>
            </div>
            
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center space-x-2 mb-2">
                <Activity className="w-4 h-4 text-orange-400" />
                <span className="text-xs font-medium text-white/70">Streak</span>
              </div>
              <div className="text-lg font-bold text-white">{plant.current_streak}</div>
              <div className="text-xs text-white/50">days active</div>
            </div>
            
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center space-x-2 mb-2">
                <Zap className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-medium text-white/70">Level</span>
              </div>
              <div className="text-lg font-bold text-white">{plant.task_level}</div>
              <div className="text-xs text-white/50">task level</div>
            </div>
            
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center space-x-2 mb-2">
                <MapPin className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-medium text-white/70">Position</span>
              </div>
              <div className="text-lg font-bold text-white">{plant.x}, {plant.y}</div>
              <div className="text-xs text-white/50">garden plot</div>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6">
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center space-x-2 mb-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-medium text-white">Last Activity</span>
            </div>
            <div className="text-white/80">
              {plant.lastWatered 
                ? new Date(plant.lastWatered).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })
                : 'No activity recorded'
              }
            </div>
          </div>
        </div>

        {plant.is_multi_step && (
          <div className="px-6 pb-6">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <List className="w-5 h-5 text-purple-400" />
                  <span className="text-lg font-bold text-white">Task Steps & Progress</span>
                </div>
                <div className="text-sm text-white/60 bg-white/10 px-3 py-1 rounded-full">
                  {plant.completed_steps || 0} of {plant.total_steps || (plant.task_steps?.length || 0)} completed
                </div>
              </div>

              {plant.task_steps && plant.task_steps.length > 0 ? (
                <>
                  <div className="mb-6 p-4 bg-white/10 rounded-lg border border-white/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-white">Overall Progress</span>
                      <span className="text-sm font-bold text-purple-400">{taskProgress}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-3 mb-3">
                      <motion.div 
                        className="h-3 rounded-full bg-gradient-to-r from-purple-400 to-purple-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${taskProgress}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </div>
                    <div className="text-xs text-white/60">
                      Each completed step grows your plant by 1 stage • Milestone-based growth system
                    </div>
                  </div>
                  
                  <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                    <h4 className="text-md font-bold text-white mb-3 flex items-center gap-2">
                      <Target className="w-4 h-4 text-blue-400" />
                      All Steps Breakdown
                    </h4>
                    
                    {plant.task_steps.map((step, index) => (
                      <motion.div
                        key={step.id || index}
                        className={`p-4 rounded-lg border transition-all ${
                          step.is_completed 
                            ? 'bg-green-600/20 border-green-500/40 shadow-green-500/10 shadow-lg' 
                            : step.is_partial
                            ? 'bg-yellow-600/20 border-yellow-500/40 shadow-yellow-500/10 shadow-lg'
                            : 'bg-white/5 border-white/20 hover:bg-white/10'
                        }`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                      >
                        <div className="flex items-start space-x-3 mb-3">
                          <div className="flex-shrink-0 mt-1">
                            {step.is_completed ? (
                              <div className="relative">
                                <CheckCircle className="w-6 h-6 text-green-400" />
                                <motion.div
                                  className="absolute inset-0 w-6 h-6 bg-green-400/30 rounded-full"
                                  animate={{ scale: [1, 1.2, 1] }}
                                  transition={{ duration: 2, repeat: Infinity }}
                                />
                              </div>
                            ) : step.is_partial ? (
                              <div className="relative">
                                <Circle className="w-6 h-6 text-yellow-400 fill-yellow-400/20" />
                                <motion.div
                                  className="absolute inset-0 w-6 h-6 bg-yellow-400/20 rounded-full"
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                />
                              </div>
                            ) : (
                              <Circle className="w-6 h-6 text-white/40" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <div className={`font-bold text-lg leading-tight ${
                                step.is_completed ? 'text-green-200' : 
                                step.is_partial ? 'text-yellow-200' : 'text-white'
                              }`}>
                                Step {index + 1}: {step.title}
                              </div>
                              
                              <div className="flex items-center space-x-2 ml-2">
                                {step.is_completed && (
                                  <span className="px-2 py-1 bg-green-500/30 text-green-200 text-xs font-medium rounded-full whitespace-nowrap">
                                    ✓ Complete
                                  </span>
                                )}
                                {step.is_partial && !step.is_completed && (
                                  <span className="px-2 py-1 bg-yellow-500/30 text-yellow-200 text-xs font-medium rounded-full whitespace-nowrap">
                                    ⏳ In Progress
                                  </span>
                                )}
                                {!step.is_completed && !step.is_partial && (
                                  <span className="px-2 py-1 bg-white/10 text-white/60 text-xs font-medium rounded-full whitespace-nowrap">
                                    ⭕ Pending
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {step.description && (
                              <div className="text-sm text-white/80 mb-3 p-3 bg-white/5 rounded-lg border border-white/10">
                                <div className="font-medium text-white/60 text-xs mb-1">DESCRIPTION:</div>
                                {step.description}
                              </div>
                            )}
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {step.work_hours && step.work_hours > 0 && (
                                <div className="flex items-center space-x-2 text-sm p-2 bg-blue-500/20 rounded-lg">
                                  <Award className="w-4 h-4 text-blue-400" />
                                  <div>
                                    <div className="text-blue-200 font-medium">{step.work_hours.toFixed(1)} hours</div>
                                    <div className="text-blue-400/80 text-xs">Time invested</div>
                                  </div>
                                </div>
                              )}
                              
                              {step.is_completed && step.completed_at && (
                                <div className="flex items-center space-x-2 text-sm p-2 bg-green-500/20 rounded-lg">
                                  <CheckCircle className="w-4 h-4 text-green-400" />
                                  <div>
                                    <div className="text-green-200 font-medium">
                                      {new Date(step.completed_at).toLocaleDateString()}
                                    </div>
                                    <div className="text-green-400/80 text-xs">Completed</div>
                                  </div>
                                </div>
                              )}
                              
                              {step.is_partial && !step.is_completed && (
                                <div className="flex items-center space-x-2 text-sm p-2 bg-yellow-500/20 rounded-lg">
                                  <Activity className="w-4 h-4 text-yellow-400" />
                                  <div>
                                    <div className="text-yellow-200 font-medium">Working on it</div>
                                    <div className="text-yellow-400/80 text-xs">Partial progress</div>
                                  </div>
                                </div>
                              )}
                              
                              {!step.is_completed && !step.is_partial && (
                                <div className="flex items-center space-x-2 text-sm p-2 bg-white/5 rounded-lg border border-white/10">
                                  <Circle className="w-4 h-4 text-white/40" />
                                  <div>
                                    <div className="text-white/60 font-medium">Ready to start</div>
                                    <div className="text-white/40 text-xs">Not started</div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="mt-6 p-4 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-lg border border-purple-500/30">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-green-400">{plant.task_steps.filter(s => s.is_completed).length}</div>
                        <div className="text-xs text-white/60">Completed</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-yellow-400">{plant.task_steps.filter(s => s.is_partial && !s.is_completed).length}</div>
                        <div className="text-xs text-white/60">In Progress</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-white/60">{plant.task_steps.filter(s => !s.is_completed && !s.is_partial).length}</div>
                        <div className="text-xs text-white/60">Remaining</div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <Circle className="w-12 h-12 text-white/40 mx-auto mb-4" />
                  <p className="text-white/70 mb-2">This multi-step task has no steps yet</p>
                  <p className="text-white/50 text-sm">Use Plant Management to add steps</p>
                </div>
              )}
            </div>
          </div>
        )}

        {!plant.is_multi_step && (
          <div className="px-6 pb-6">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center space-x-2 mb-4">
                <Target className="w-5 h-5 text-green-400" />
                <span className="text-lg font-bold text-white">Single-Step Task</span>
              </div>
              
              <div className="text-center py-6">
                <Target className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <p className="text-white/80 mb-2">This is a simple, single-step task</p>
                <p className="text-white/60 text-sm mb-4">Complete it by logging work hours to grow your plant</p>
                
                <div className="bg-white/10 p-3 rounded-lg">
                  <div className="text-sm text-white/70">
                    Want to break this down into smaller steps?<br />
                    Use <strong className="text-purple-400">Plant Management</strong> to convert to multi-step!
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="px-6 pb-6">
          <motion.button
            onClick={() => {
              playUI('click')
              onClose()
            }}
            className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Close Details
          </motion.button>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  )
}
