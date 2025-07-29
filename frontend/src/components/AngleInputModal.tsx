import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { QuantumGate } from '../types/quantum';

interface AngleInputModalProps {
  gate: QuantumGate;
  onSave: (gateId: string, angle: number) => void;
  onClose: () => void;
}

export const AngleInputModal: React.FC<AngleInputModalProps> = ({
  gate,
  onSave,
  onClose,
}) => {
  // Initialize angle from gate.params.theta or default to 0
  const [angle, setAngle] = useState<number>(gate.params?.theta || 0);
  const [angleUnit, setAngleUnit] = useState<'radians' | 'degrees'>('radians');

  useEffect(() => {
    // When the gate prop changes, update the internal angle state
    setAngle(gate.params?.theta || 0);
  }, [gate]);

  const handleAngleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = parseFloat(e.target.value);
    if (isNaN(value)) {
      value = 0; // Default to 0 if input is not a number
    }
    setAngle(value);
  };

  const handleSave = () => {
    let finalAngle = angle;
    if (angleUnit === 'degrees') {
      finalAngle = angle * (Math.PI / 180); // Convert degrees to radians
    }
    onSave(gate.id, finalAngle);
  };

  const convertAngleToDisplay = (value: number) => {
    if (angleUnit === 'degrees') {
      return (value * (180 / Math.PI)).toFixed(2); // Convert radians to degrees for display
    }
    return value.toFixed(2); // Display radians as is
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-sm w-full mx-4">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Set Angle for {gate.name}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Angle Value
            </label>
            <input
              type="number"
              value={convertAngleToDisplay(angle)} // Display converted angle
              onChange={handleAngleChange}
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Unit
            </label>
            <div className="flex space-x-2">
              <button
                onClick={() => setAngleUnit('radians')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  angleUnit === 'radians'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Radians ($\pi$ rad)
              </button>
              <button
                onClick={() => setAngleUnit('degrees')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  angleUnit === 'degrees'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Degrees ($^\circ$)
              </button>
            </div>
          </div>
          
          <div className="flex space-x-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Save Angle
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
