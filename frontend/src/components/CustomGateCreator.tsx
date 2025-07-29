import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';

interface CustomGateCreatorProps {
  selectedGatesCount: number;
  onCreateGate: (name: string, initial: string, description: string) => void;
  onClose: () => void;
}

export const CustomGateCreator: React.FC<CustomGateCreatorProps> = ({
  selectedGatesCount,
  onCreateGate,
  onClose
}) => {
  const [name, setName] = useState('');
  const [initial, setInitial] = useState('');
  const [description, setDescription] = useState('');

  const handleCreate = () => {
    if (name.trim() && initial.trim() && description.trim()) {
      onCreateGate(name.trim(), initial.trim(), description.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Plus className="w-6 h-6 text-green-600" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Create Custom Gate
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-800 dark:text-green-400">
              Creating custom gate from {selectedGatesCount} selected gates
            </p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Gate Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Bell State Preparation"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Gate Initial/Symbol *
              </label>
              <input
                type="text"
                value={initial}
                onChange={(e) => setInitial(e.target.value.toUpperCase().slice(0, 4))}
                placeholder="e.g., BELL"
                maxLength={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Max 4 characters, will be displayed on the gate
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this custom gate does..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
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
              onClick={handleCreate}
              disabled={!name.trim() || !initial.trim() || !description.trim()}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                name.trim() && initial.trim() && description.trim()
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              }`}
            >
              Create Gate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};