import React from 'react';
import { Button } from '../components/ui/Button';

export const Dashboard: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Task Garden Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Today's Tasks</h2>
          <p className="text-gray-600">Complete your tasks to grow your garden!</p>
          <Button className="mt-4">Add Task</Button>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Garden Status</h2>
          <p className="text-gray-600">Your plants are thriving!</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Achievements</h2>
          <p className="text-gray-600">Keep up the great work!</p>
        </div>
      </div>
    </div>
  );
};
