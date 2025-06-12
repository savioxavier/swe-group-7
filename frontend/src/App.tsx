import { useState } from 'react'
import { motion } from 'framer-motion'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div 
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #111827, #1f2937, #14532d)',
        padding: '2rem'
      }}
    >
      <div style={{ maxWidth: '56rem', margin: '0 auto' }}>
        <motion.h1 
          style={{
            fontSize: '2.25rem',
            fontWeight: 'bold',
            color: '#86efac',
            textAlign: 'center',
            marginBottom: '2rem'
          }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Task Garden
        </motion.h1>
        
        <motion.div 
          style={{
            backgroundColor: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '0.5rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            padding: '1.5rem',
            textAlign: 'center'
          }}
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <h2 
            style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: '#f3f4f6',
              marginBottom: '1rem'
            }}
          >
            Welcome to Your Digital Garden
          </h2>
          <p 
            style={{
              color: '#d1d5db',
              marginBottom: '1.5rem'
            }}
          >
            Complete tasks to grow your virtual plants and build the most beautiful garden
          </p>
          
          <motion.button
            style={{
              backgroundColor: '#059669',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              fontWeight: '500',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              fontSize: '1rem'
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCount(count + 1)}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#10b981'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#059669'}
          >
            Plant a Seed ({count})
          </motion.button>
          
          <div 
            style={{
              marginTop: '2rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem'
            }}
          >
            <div 
              style={{
                padding: '1rem',
                backgroundColor: '#374151',
                border: '1px solid #4b5563',
                borderRadius: '0.5rem'
              }}
            >
              <h3 style={{ fontWeight: '600', color: '#4ade80', marginBottom: '0.5rem' }}>
                Exercise
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#d1d5db', margin: 0 }}>
                Grow strong oak trees
              </p>
            </div>
            <div 
              style={{
                padding: '1rem',
                backgroundColor: '#374151',
                border: '1px solid #4b5563',
                borderRadius: '0.5rem'
              }}
            >
              <h3 style={{ fontWeight: '600', color: '#60a5fa', marginBottom: '0.5rem' }}>
                Study
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#d1d5db', margin: 0 }}>
                Cultivate wisdom flowers
              </p>
            </div>
            <div 
              style={{
                padding: '1rem',
                backgroundColor: '#374151',
                border: '1px solid #4b5563',
                borderRadius: '0.5rem'
              }}
            >
              <h3 style={{ fontWeight: '600', color: '#a78bfa', marginBottom: '0.5rem' }}>
                Self Care
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#d1d5db', margin: 0 }}>
                Nurture peaceful bamboo
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default App
