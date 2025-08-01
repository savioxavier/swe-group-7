import React from 'react'
import { motion } from 'framer-motion'

interface HoverButtonProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'success' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

export const HoverButton: React.FC<HoverButtonProps> = ({
  children,
  className = '',
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'md'
}) => {
  const baseClasses = 'font-medium rounded-lg transition-all duration-200 flex items-center justify-center'
  
  const variantClasses = {
    primary: 'bg-green-600 hover:bg-green-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    success: 'bg-blue-600 hover:bg-blue-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white'
  }
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }

  const disabledClasses = disabled 
    ? 'opacity-50 cursor-not-allowed bg-gray-500' 
    : 'cursor-pointer'

  return (
    <motion.button
      whileHover={!disabled ? { 
        scale: 1.05,
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
        filter: 'brightness(1.1)'
      } : {}}
      whileTap={!disabled ? { 
        scale: 0.98,
        boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)'
      } : {}}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 20 
      }}
      onClick={disabled ? undefined : onClick}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`}
      disabled={disabled}
    >
      {children}
    </motion.button>
  )
}

interface FloatingCardProps {
  children: React.ReactNode
  className?: string
  intensity?: 'subtle' | 'medium' | 'strong'
}

export const FloatingCard: React.FC<FloatingCardProps> = ({
  children,
  className = '',
  intensity = 'medium'
}) => {
  const intensityConfig = {
    subtle: {
      hover: { y: -2, boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)' },
      transition: { duration: 0.2 }
    },
    medium: {
      hover: { y: -5, boxShadow: '0 15px 35px rgba(0, 0, 0, 0.2)' },
      transition: { duration: 0.3 }
    },
    strong: {
      hover: { y: -8, boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)' },
      transition: { duration: 0.3 }
    }
  }

  const config = intensityConfig[intensity]

  return (
    <motion.div
      whileHover={config.hover}
      transition={config.transition}
      className={`transition-colors duration-200 ${className}`}
    >
      {children}
    </motion.div>
  )
}

interface PulseElementProps {
  children: React.ReactNode
  className?: string
  isActive?: boolean
  pulseColor?: string
}

export const PulseElement: React.FC<PulseElementProps> = ({
  children,
  className = '',
  isActive = false,
  pulseColor = 'rgba(34, 197, 94, 0.4)'
}) => {
  return (
    <motion.div
      animate={isActive ? {
        boxShadow: [
          `0 0 0 0 ${pulseColor}`,
          `0 0 0 10px transparent`,
          `0 0 0 0 transparent`
        ]
      } : {}}
      transition={{
        duration: 1.5,
        repeat: isActive ? Infinity : 0,
        ease: "easeOut"
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface ShimmerEffectProps {
  children: React.ReactNode
  className?: string
  isShimmering?: boolean
}

export const ShimmerEffect: React.FC<ShimmerEffectProps> = ({
  children,
  className = '',
  isShimmering = false
}) => {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {children}
      <motion.div
        initial={{ x: '-100%', opacity: 0 }}
        animate={isShimmering ? {
          x: ['100%', '200%'],
          opacity: [0, 0.6, 0]
        } : {}}
        transition={{
          duration: 1.5,
          repeat: isShimmering ? Infinity : 0,
          repeatDelay: 2,
          ease: "easeInOut"
        }}
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
        style={{ 
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)'
        }}
      />
    </div>
  )
}

interface RippleEffectProps {
  children: React.ReactNode
  className?: string
  rippleColor?: string
  onClick?: () => void
}

export const RippleEffect: React.FC<RippleEffectProps> = ({
  children,
  className = '',
  rippleColor = 'rgba(255, 255, 255, 0.3)',
  onClick
}) => {
  const [ripples, setRipples] = React.useState<Array<{ id: number, x: number, y: number }>>([])

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    const newRipple = {
      id: Date.now(),
      x,
      y
    }
    
    setRipples(prev => [...prev, newRipple])
    
    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id))
    }, 600)
    
    if (onClick) onClick()
  }

  return (
    <div 
      className={`relative overflow-hidden cursor-pointer ${className}`}
      onClick={handleClick}
    >
      {children}
      {ripples.map(ripple => (
        <motion.div
          key={ripple.id}
          initial={{ 
            scale: 0, 
            opacity: 0.8 
          }}
          animate={{ 
            scale: 4, 
            opacity: 0 
          }}
          transition={{ 
            duration: 0.6, 
            ease: "easeOut" 
          }}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: ripple.x - 10,
            top: ripple.y - 10,
            width: 20,
            height: 20,
            backgroundColor: rippleColor
          }}
        />
      ))}
    </div>
  )
}

interface GlowEffectProps {
  children: React.ReactNode
  className?: string
  glowColor?: string
  intensity?: 'low' | 'medium' | 'high'
  isGlowing?: boolean
}

export const GlowEffect: React.FC<GlowEffectProps> = ({
  children,
  className = '',
  glowColor = 'rgba(34, 197, 94, 0.5)',
  intensity = 'medium',
  isGlowing = false
}) => {
  const intensityMap = {
    low: '0 0 10px',
    medium: '0 0 20px',
    high: '0 0 30px'
  }

  return (
    <motion.div
      animate={isGlowing ? {
        boxShadow: [
          'none',
          `${intensityMap[intensity]} ${glowColor}`,
          'none'
        ]
      } : {}}
      transition={{
        duration: 2,
        repeat: isGlowing ? Infinity : 0,
        ease: "easeInOut"
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}