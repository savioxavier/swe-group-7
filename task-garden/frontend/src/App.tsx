import { useState } from 'react'
import { motion } from 'framer-motion'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-green-900 p-8"
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #111827, #1f2937, #14532d)',
        padding: '2rem'
      }}
    >
      <div className="max-w-4xl mx-auto" style={{ maxWidth: '56rem', margin: '0 auto' }}>
        <motion.h1 
          className="text-4xl font-bold text-green-300 text-center mb-8"
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
          className="bg-gray-800 border border-gray-700 rounded-lg shadow-2xl p-6 text-center"
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
            className="text-2xl font-semibold text-gray-100 mb-4"
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
            className="text-gray-300 mb-6"
            style={{
              color: '#d1d5db',
              marginBottom: '1.5rem'
            }}
          >
            Complete tasks to grow your virtual plants and build the most beautiful garden
          </p>
          
          <motion.button
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-500 transition-colors shadow-lg"
            style={{
              backgroundColor: '#059669',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              fontWeight: '500',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
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
            className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4"
            style={{
              marginTop: '2rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem'
            }}
          >
            <div 
              className="p-4 bg-gray-700 border border-gray-600 rounded-lg"
              style={{
                padding: '1rem',
                backgroundColor: '#374151',
                border: '1px solid #4b5563',
                borderRadius: '0.5rem'
              }}
            >
              <h3 
                className="font-semibold text-green-400"
                style={{ fontWeight: '600', color: '#4ade80' }}
              >
                Exercise
              </h3>
              <p 
                className="text-sm text-gray-300"
                style={{ fontSize: '0.875rem', color: '#d1d5db' }}
              >
                Grow strong oak trees
              </p>
            </div>
            <div 
              className="p-4 bg-gray-700 border border-gray-600 rounded-lg"
              style={{
                padding: '1rem',
                backgroundColor: '#374151',
                border: '1px solid #4b5563',
                borderRadius: '0.5rem'
              }}
            >
              <h3 
                className="font-semibold text-blue-400"
                style={{ fontWeight: '600', color: '#60a5fa' }}
              >
                Study
              </h3>
              <p 
                className="text-sm text-gray-300"
                style={{ fontSize: '0.875rem', color: '#d1d5db' }}
              >
                Cultivate wisdom flowers
              </p>
            </div>
            <div 
              className="p-4 bg-gray-700 border border-gray-600 rounded-lg"
              style={{
                padding: '1rem',
                backgroundColor: '#374151',
                border: '1px solid #4b5563',
                borderRadius: '0.5rem'
              }}
            >
              <h3 
                className="font-semibold text-purple-400"
                style={{ fontWeight: '600', color: '#a78bfa' }}
              >
                Self Care
              </h3>
              <p 
                className="text-sm text-gray-300"
                style={{ fontSize: '0.875rem', color: '#d1d5db' }}
              >
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
