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
      className="cursor-pointer"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
    >
      <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
        <span className="text-2xl">í¼±</span>
      </div>
      <p className="text-sm mt-2 text-center">{plant.name}</p>
    </motion.div>
  );
};
