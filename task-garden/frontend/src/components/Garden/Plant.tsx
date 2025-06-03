import React from 'react';
import { motion } from 'framer-motion';
import { Plant } from '../../types';

interface PlantProps {
  plant: Plant;
  onClick?: () => void;
}

export const PlantComponent: React.FC<PlantProps> = ({ plant, onClick }) => {
  return (
    <motion.div
      style={{
        cursor: 'pointer',
        textAlign: 'center'
      }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
    >
      <div 
        style={{
          width: '4rem',
          height: '4rem',
          backgroundColor: '#059669',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem'
        }}
      >
        í¼±
      </div>
      <p style={{ fontSize: '0.875rem', marginTop: '0.5rem', color: '#d1d5db' }}>
        {plant.name}
      </p>
    </motion.div>
  );
};
