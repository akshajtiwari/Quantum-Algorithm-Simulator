import React from 'react';
import { QuantumGate, PrebuiltAlgorithm, CustomGate } from '../types/quantum';
import { AlertTriangle, Plus, Save, History, Cpu, XCircle } from 'lucide-react'; // Import XCircle for delete icon

interface SidebarProps {
  onGateSelect: (gate: QuantumGate) => void;
  onApplyAlgorithm: (algorithmCircuit: PrebuiltAlgorithm['circuit']) => void; 
  onCustomGateSelect: (customGate: CustomGate) => void;
  onDeleteCustomGate: (gateId: string) => void; // New prop for deleting custom gates
  customGates: CustomGate[];
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  onGateSelect, 
  onApplyAlgorithm, 
  onCustomGateSelect,
  onDeleteCustomGate, // Destructure the new prop
  customGates, 
  className = '' 
}) => {
  const [activeTab, setActiveTab] = React.useState<'gates' | 'algorithms' | 'custom'>('gates');
  const [showAlgorithmWarning, setShowAlgorithmWarning] = React.useState<PrebuiltAlgorithm | null>(null);

  const gateCategories = [
    {
      name: 'Single Qubit Gates',
      gates: [
        { name: 'H', label: 'Hadamard', color: 'bg-blue-500' },
        { name: 'X', label: 'Pauli-X', color: 'bg-red-500' },
        { name: 'Y', label: 'Pauli-Y', color: 'bg-green-500' },
        { name: 'Z', label: 'Pauli-Z', color: 'bg-purple-500' },
        { name: 'S', label: 'S Gate', color: 'bg-yellow-500' },
        { name: 'SDG', label: 'S Dagger', color: 'bg-yellow-600' },
        { name: 'T', label: 'T Gate', color: 'bg-pink-500' },
        { name: 'TDG', label: 'T Dagger', color: 'bg-pink-600' },
      ]
    },
    {
      name: 'Rotation Gates',
      gates: [
        { name: 'RX', label: 'Rotation X', color: 'bg-red-400' },
        { name: 'RY', label: 'Rotation Y', color: 'bg-green-400' },
        { name: 'RZ', label: 'Rotation Z', color: 'bg-purple-400' },
        { name: 'U3', label: 'Universal Gate', color: 'bg-indigo-500' },
      ]
    },
    {
      name: 'Multi-Qubit Gates',
      gates: [
        { name: 'CX', label: 'CNOT', color: 'bg-orange-500' },
        { name: 'CZ', label: 'Controlled-Z', color: 'bg-cyan-500' },
        { name: 'CY', label: 'Controlled-Y', color: 'bg-teal-500' },
        { name: 'SWAP', label: 'SWAP', color: 'bg-gray-500' },
        { name: 'CCX', label: 'Toffoli', color: 'bg-rose-500' },
      ]
    },
    {
      name: 'Measurement Gates', // Added category for clarity
      gates: [
        { name: 'MEASURE', label: 'Measurement gate', color: 'bg-gray-700' },
      ]
    }
  ];

  // Corrected Prebuilt Algorithms structure
  const prebuiltAlgorithms: PrebuiltAlgorithm[] = [
    {
      id: 'bell-state',
      name: 'Bell State',
      description: 'Creates maximum entanglement between two qubits',
      category: 'Entanglement',
      circuit: {
        qubits: 2, // Explicitly define qubits
        classicalBits: 2, // Explicitly define classical bits
        gates: [
          { name: 'H', qubits: [0], position: 0 },
          { name: 'CX', qubits: [0, 1], control: 0, target: 1, position: 1 },
          { name: 'MEASURE', qubits: [0], position: 2, conditionalBit: 0 }, // Ensure measure has conditionalBit
          { name: 'MEASURE', qubits: [1], position: 2, conditionalBit: 1 }
        ],
      }
    },
    {
      id: 'ghz-state',
      name: 'GHZ State',
      description: 'Three-qubit maximally entangled state',
      category: 'Entanglement',
      circuit: {
        qubits: 3, // Explicitly define qubits
        classicalBits: 3, // Explicitly define classical bits
        gates: [
          { name: 'H', qubits: [0], position: 0 },
          { name: 'CX', qubits: [0, 1], control: 0, target: 1, position: 1 },
          { name: 'CX', qubits: [1, 2], control: 1, target: 2, position: 2 },
          { name: 'MEASURE', qubits: [0], position: 3, conditionalBit: 0 },
          { name: 'MEASURE', qubits: [1], position: 3, conditionalBit: 1 },
          { name: 'MEASURE', qubits: [2], position: 3, conditionalBit: 2 }
        ],
      }
    },
    {
      id: 'deutsch-jozsa',
      name: 'Deutsch-Jozsa',
      description: 'Determines if function is constant or balanced',
      category: 'Algorithms',
      circuit: {
        qubits: 3, // Explicitly define qubits
        classicalBits: 3, // Explicitly define classical bits
        gates: [
          { name: 'X', qubits: [2], position: 0 },
          { name: 'H', qubits: [0], position: 1 },
          { name: 'H', qubits: [1], position: 1 },
          { name: 'H', qubits: [2], position: 1 },
          { name: 'CX', qubits: [0, 2], control: 0, target: 2, position: 2 }, // Example oracle for f(x)=x
          { name: 'CX', qubits: [1, 2], control: 1, target: 2, position: 2 }, // Example oracle for f(x)=x
          { name: 'H', qubits: [0], position: 3 },
          { name: 'H', qubits: [1], position: 3 },
          { name: 'MEASURE', qubits: [0], position: 4, conditionalBit: 0 },
          { name: 'MEASURE', qubits: [1], position: 4, conditionalBit: 1 },
          { name: 'MEASURE', qubits: [2], position: 4, conditionalBit: 2 }
        ],
      }
    },
    {
      id: 'grover-2qubit',
      name: 'Grover (2-qubit)',
      description: 'Search algorithm for 2 qubits (finds |11>)',
      category: 'Algorithms',
      circuit: {
        qubits: 2,
        classicalBits: 2,
        gates: [
          { name: 'H', qubits: [0], position: 0 },
          { name: 'H', qubits: [1], position: 0 },
          { name: 'Z', qubits: [1], position: 1 },
          { name: 'CX', qubits: [0, 1], control: 0, target: 1, position: 1 }, // Changed CZ to CX for consistency with App.tsx
          { name: 'H', qubits: [0], position: 2 },
          { name: 'H', qubits: [1], position: 2 },
          { name: 'X', qubits: [0], position: 3 },
          { name: 'X', qubits: [1], position: 3 },
          { name: 'CX', qubits: [0, 1], control: 0, target: 1, position: 4 }, // Changed CZ to CX
          { name: 'H', qubits: [1], position: 4 }, // Added H for diffusion
          { name: 'X', qubits: [0], position: 5 },
          { name: 'X', qubits: [1], position: 5 },
          { name: 'H', qubits: [0], position: 6 },
          { name: 'H', qubits: [1], position: 6 },
          { name: 'MEASURE', qubits: [0], position: 7, conditionalBit: 0 },
          { name: 'MEASURE', qubits: [1], position: 7, conditionalBit: 1 }
        ],
      }
    },
    {
      id: 'qft-3qubit',
      name: 'QFT (3-qubit)',
      description: 'Quantum Fourier Transform for 3 qubits',
      category: 'Transforms',
      circuit: {
        qubits: 3,
        classicalBits: 3,
        gates: [
          { name: 'H', qubits: [0], position: 0 },
          { name: 'RZ', qubits: [1], params: { theta: Math.PI / 2 }, position: 1 }, // Use params.theta
          { name: 'CX', qubits: [0, 1], control: 0, target: 1, position: 1 },
          { name: 'RZ', qubits: [1], params: { theta: -Math.PI / 2 }, position: 2 }, // Use params.theta
          { name: 'CX', qubits: [0, 1], control: 0, target: 1, position: 2 },
          { name: 'RZ', qubits: [2], params: { theta: Math.PI / 4 }, position: 3 }, // Use params.theta
          { name: 'CX', qubits: [0, 2], control: 0, target: 2, position: 3 },
          { name: 'RZ', qubits: [2], params: { theta: -Math.PI / 4 }, position: 4 }, // Use params.theta
          { name: 'CX', qubits: [0, 2], control: 0, target: 2, position: 4 },
          { name: 'H', qubits: [1], position: 5 },
          { name: 'RZ', qubits: [2], params: { theta: Math.PI / 2 }, position: 6 }, // Use params.theta
          { name: 'CX', qubits: [1, 2], control: 1, target: 2, position: 6 },
          { name: 'RZ', qubits: [2], params: { theta: -Math.PI / 2 }, position: 7 }, // Use params.theta
          { name: 'CX', qubits: [1, 2], control: 1, target: 2, position: 7 },
          { name: 'H', qubits: [2], position: 8 },
          { name: 'SWAP', qubits: [0, 2], control: 0, target: 2, position: 9 }, // QFT often ends with swaps to reverse qubit order
          { name: 'MEASURE', qubits: [0], position: 10, conditionalBit: 0 },
          { name: 'MEASURE', qubits: [1], position: 10, conditionalBit: 1 },
          { name: 'MEASURE', qubits: [2], position: 10, conditionalBit: 2 }
        ],
      }
    }
  ];

  const handleGateClick = (gateName: string) => {
    const gate: QuantumGate = {
      id: Date.now().toString(), // Temporary ID, will be replaced by uuidv4 in useCircuit
      name: gateName,
      qubits: [],
      position: 0, // Default position, will be set by canvas
      params: (gateName.startsWith('R') || gateName === 'U3') ? { theta: Math.PI / 2 } : undefined // Default angle
    };
    
    // Dispatch custom event to notify canvas
    onGateSelect(gate); // Use the prop directly
  };

  const handleDragStart = (e: React.DragEvent, gateName: string) => {
    const gate: QuantumGate = {
      id: Date.now().toString(), // Temporary ID, will be replaced by uuidv4 in useCircuit
      name: gateName,
      qubits: [],
      position: 0, // Default position, will be set by canvas
      params: (gateName.startsWith('R') || gateName === 'U3') ? { theta: Math.PI / 2 } : undefined // Default angle
    };
    e.dataTransfer.setData('application/json', JSON.stringify(gate));
  };

  const handleAlgorithmClick = (algorithm: PrebuiltAlgorithm) => {
    setShowAlgorithmWarning(algorithm);
  };

  const confirmAlgorithmLoad = () => {
    if (showAlgorithmWarning) {
      // Pass the circuit object directly to onApplyAlgorithm
      onApplyAlgorithm(showAlgorithmWarning.circuit); 
      setShowAlgorithmWarning(null);
    }
  };

  const tabs = [
    { id: 'gates', label: 'Gates', icon: Cpu },
    { id: 'algorithms', label: 'Algorithms', icon: History },
    { id: 'custom', label: 'Custom', icon: Save }
  ];

  return (
    <div className={`bg-white dark:bg-gray-800 overflow-y-auto ${className}`}>
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Library</h2>
        
        <div className="flex space-x-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      
      <div className="p-3">
        {activeTab === 'gates' && (
          <>
            {gateCategories.map((category) => (
              <div key={category.name} className="mb-4">
                <h3 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {category.name}
                </h3>
                <div className="grid grid-cols-2 gap-1.5">
                  {category.gates.map((gate) => (
                    <button
                      key={gate.name}
                      onClick={() => handleGateClick(gate.name)}
                      draggable
                      onDragStart={(e) => handleDragStart(e, gate.name)}
                      className={`${gate.color} text-white p-2 rounded-lg font-medium text-xs hover:opacity-90 transition-opacity shadow-sm hover:shadow-md transform hover:scale-105 transition-transform`}
                      title={gate.label}
                    >
                      {gate.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h3 className="text-xs font-medium text-blue-900 dark:text-blue-300 mb-2">
                Quick Tips
              </h3>
              <ul className="text-xs text-blue-800 dark:text-blue-400 space-y-0.5">
                <li>• Drag or click gates to add them to the circuit</li>
                <li>• Multi-qubit gates require control and target selection</li>
                <li>• Use H gates to create superposition</li>
                <li>• CX gates create entanglement</li>
                <li>• Rotation gates have adjustable parameters</li>
              </ul>
            </div>
          </>
        )}
        
        {activeTab === 'algorithms' && (
          <>
            {['Entanglement', 'Algorithms', 'Transforms'].map(category => (
              <div key={category} className="mb-4">
                <h3 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {category}
                </h3>
                <div className="space-y-2">
                  {prebuiltAlgorithms
                    .filter(alg => alg.category === category)
                    .map((algorithm) => (
                      <button
                        key={algorithm.id}
                        onClick={() => handleAlgorithmClick(algorithm)}
                        className="w-full p-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg text-xs hover:opacity-90 transition-opacity shadow-sm hover:shadow-md text-left"
                      >
                        <div className="font-medium">{algorithm.name}</div>
                        <div className="text-xs opacity-80 mt-1">{algorithm.description}</div>
                      </button>
                    ))}
                </div>
              </div>
            ))}
            
            <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <h3 className="text-xs font-medium text-purple-900 dark:text-purple-300 mb-2">
                Algorithm Library
              </h3>
              <ul className="text-xs text-purple-800 dark:text-purple-400 space-y-0.5">
                <li>• Pre-built quantum algorithms</li>
                <li>• Click to load (replaces current circuit)</li>
                <li>• Study and modify famous quantum circuits</li>
                <li>• Learn quantum algorithm patterns</li>
              </ul>
            </div>
          </>
        )}
        
        {activeTab === 'custom' && (
          <>
            <div className="mb-4">
              <h3 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                Custom Gates
              </h3>
              {customGates.length === 0 ? (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                  <Plus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">No custom gates yet</p>
                  <p className="text-xs">Select gates on canvas to create one</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {customGates.map((customGate) => (
                    <div 
                      key={customGate.id} 
                      className="relative w-full p-2 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg text-xs hover:opacity-90 transition-opacity shadow-sm hover:shadow-md text-left flex items-center justify-between"
                    >
                      <button
                        onClick={() => onCustomGateSelect(customGate)}
                        className="flex-1 text-left" // Make button take available space
                      >
                        <div className="font-medium">{customGate.initial}</div>
                        <div className="text-xs opacity-80 mt-1">{customGate.description}</div>
                      </button>
                      <button
                        onClick={() => onDeleteCustomGate(customGate.id)} // Call delete handler
                        className="ml-2 p-1 rounded-full bg-red-600 hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                        title="Delete Custom Gate"
                      >
                        <XCircle className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <h3 className="text-xs font-medium text-green-900 dark:text-green-300 mb-2">
                Custom Gate Creation
              </h3>
              <ul className="text-xs text-green-800 dark:text-green-400 space-y-0.5">
                <li>• Select multiple gates on canvas</li>
                <li>• Use "Create Custom Gate" button</li>
                <li>• Reuse your gate combinations</li>
                <li>• Build complex operations easily</li>
              </ul>
            </div>
          </>
        )}
      </div>
      
      {/* Algorithm Warning Modal */}
      {showAlgorithmWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Load Algorithm
              </h3>
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Loading "{showAlgorithmWarning.name}" will replace your current circuit. 
              Make sure to save your work if needed.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowAlgorithmWarning(null)}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmAlgorithmLoad}
                className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Load Algorithm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
