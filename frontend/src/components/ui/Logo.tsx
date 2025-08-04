import React from 'react'

interface LogoProps {
  className?: string
  size?: number
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 24 }) => {
  return (
    <img 
      src="/assets/logo.png" 
      alt="TaskGarden Logo" 
      className={`inline-block ${className}`}
      style={{ 
        width: size, 
        height: size,
        objectFit: 'contain'
      }}
    />
  )
}

export default Logo