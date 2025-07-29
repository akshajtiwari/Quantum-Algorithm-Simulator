import React, { useState, useRef, useEffect } from 'react';
import { Circuit, QuantumGate } from '../types/quantum';
import { Trash2, Settings, Target, Circle, Plus } from 'lucide-react';

interface CircuitCanvasProps {
  circuit: Circuit;
  onGateRemove: (gateId: string) => void;
  onGateAdd: (gate: QuantumGate) => void;
  selectedGates: string[];
  onGateToggleSelection: (gateId: string) => void;
  onCreateCustomGate: () => void;
  numQubits: number;
  className?: string;
}

export const CircuitCanvas: React.FC<CircuitCanvasProps> = ({
  circuit,
  onGateRemove,
  onGateAdd,
  selectedGates,
  onGateToggleSelection,
  onCreateCustomGate,
  numQubits,
  className = ''
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [hoveredPosition, setHoveredPosition] = useState<{ qubit: number; position: number } | null>(null);
  const [selectedGate, setSelectedGate] = useState<string | null>(null);
  const [gateBeingPlaced, setGateBeingPlaced] = useState<QuantumGate | null>(null);
  const [controlQubit, setControlQubit] = useState<number | null>(null);

  const isMultiQubitGate = (gateName: string) => {
    return ['CX', 'CZ', 'CY', 'SWAP', 'CCX'].includes(gateName);
  };

  // Calculate next available position for a qubit
  const getNextPosition = (qubitIndex: number) => {
    const gatesOnQubit = circuit.gates.filter(gate => gate.qubits.includes(qubitIndex));
    const maxPosition = Math.max(...gatesOnQubit.map(g => g.position || 0), -1);
    return maxPosition + 1;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropZoneClick = (qubitIndex: number, position?: number) => {
    const actualPosition = position !== undefined ? position : getNextPosition(qubitIndex);
    
    if (gateBeingPlaced && isMultiQubitGate(gateBeingPlaced.name)) {
      if (controlQubit === null) {
        setControlQubit(qubitIndex);
      } else if (controlQubit !== qubitIndex) {
        const newGate = {
          ...gateBeingPlaced,
          qubits: [controlQubit, qubitIndex],
          position: actualPosition
        };
        onGateAdd(newGate);
        setGateBeingPlaced(null);
        setControlQubit(null);
      }
    } else if (gateBeingPlaced) {
      if (isMultiQubitGate(gateBeingPlaced.name)) {
        setControlQubit(qubitIndex);
      } else {
        const newGate = {
          ...gateBeingPlaced,
          qubits: [qubitIndex],
          position: actualPosition
        };
        onGateAdd(newGate);
        setGateBeingPlaced(null);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const gateData = e.dataTransfer.getData('application/json');
      if (gateData) {
        const gate = JSON.parse(gateData);
        setGateBeingPlaced(gate);
      }
    } catch (error) {
      console.error('Error parsing dragged gate data:', error);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    // If no gate is being placed, do nothing
    if (!gateBeingPlaced) return;
    
    // Cancel gate placement if clicking on empty area
    if (e.target === e.currentTarget) {
      setGateBeingPlaced(null);
      setControlQubit(null);
    }
  };

  // Handle gate selection from sidebar
  useEffect(() => {
    const handleGateFromSidebar = (event: CustomEvent) => {
      setGateBeingPlaced(event.detail);
    };

    window.addEventListener('gateSelected', handleGateFromSidebar as EventListener);
    return () => {
      window.removeEventListener('gateSelected', handleGateFromSidebar as EventListener);
    };
  }, []);

  const handleDragEnter = (e: React.DragEvent) => {
    try {
      const gateData = e.dataTransfer.getData('application/json');
      if (gateData) {
        const gate = JSON.parse(gateData);
        setGateBeingPlaced(gate);
      }
    } catch (error) {
      // Ignore errors during drag enter
    }
  };

  const renderQubitLine = (qubitIndex: number) => {
    const gatesOnQubit = circuit.gates.filter(gate => gate.qubits.includes(qubitIndex));
    const maxPosition = Math.max(...circuit.gates.map(g => g.position || 0), 3);
    
    return (
      <div key={qubitIndex} className="relative flex items-center h-12 mb-1">
        {/* Qubit label */}
        <div className="w-12 flex-shrink-0 text-center">
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            |q{qubitIndex}⟩
          </span>
        </div>
        
        {/* Qubit wire */}
        <div className="flex-1 relative" style={{ minWidth: `${(maxPosition + 3) * 60}px` }}>
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-400 dark:bg-gray-500 transform -translate-y-1/2" />
          
          {/* Drop zones for gate placement */}
          {Array.from({ length: maxPosition + 4 }, (_, i) => (
            <div
              key={`drop-zone-${i}`}
              className={`absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 w-12 h-12 rounded-lg border-2 border-dashed transition-colors cursor-pointer z-10 ${
                gateBeingPlaced ? 'border-blue-300 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20' : 'border-transparent hover:border-gray-300'
              }`}
              style={{ left: `${i * 60 + 30}px` }}
              onDragOver={(e) => {
                e.preventDefault();
                setHoveredPosition({ qubit: qubitIndex, position: i });
              }}
              onDragLeave={() => setHoveredPosition(null)}
              onDrop={(e) => {
                e.preventDefault();
                try {
                  const gateData = e.dataTransfer.getData('application/json');
                  if (gateData) {
                    const gate = JSON.parse(gateData);
                    setGateBeingPlaced(gate);
                    handleDropZoneClick(qubitIndex, i);
                  }
                } catch (error) {
                  console.error('Error parsing dragged gate data:', error);
                }
                setHoveredPosition(null);
              }}
              onClick={() => handleDropZoneClick(qubitIndex, i)}
            />
          ))}
          
          {/* Visual feedback for hovered position */}
          {hoveredPosition && hoveredPosition.qubit === qubitIndex && (
            <div
              className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 w-12 h-12 bg-blue-200 dark:bg-blue-800 rounded-lg border-2 border-blue-400 dark:border-blue-600 opacity-50 pointer-events-none"
              style={{ left: `${hoveredPosition.position * 60 + 30}px` }}
            />
          )}
          
          {/* Clickable positions for multi-qubit gates */}
          {gateBeingPlaced && isMultiQubitGate(gateBeingPlaced.name) && (
            Array.from({ length: maxPosition + 4 }, (_, i) => (
              <div
                key={`multi-gate-${i}`}
                className={`absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full border-2 border-dashed cursor-pointer transition-colors z-20 ${
                  controlQubit === qubitIndex ? 'border-blue-500 bg-blue-100 dark:bg-blue-900' : 'border-gray-300 hover:border-blue-400'
                }`}
                style={{ left: `${i * 60 + 30}px` }}
                onClick={() => handleDropZoneClick(qubitIndex, i)}
              />
            ))
          )}
          
          {/* Gates on this qubit */}
          {gatesOnQubit.map((gate) => (
            <div
              key={gate.id}
              className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 group z-30"
              style={{ left: `${(gate.position || 0) * 60 + 30}px` }}
            >
              <div className="relative">
                <div 
                  className={`w-8 h-8 rounded-lg shadow-md border-2 flex items-center justify-center text-white font-bold text-xs cursor-pointer hover:scale-110 transition-transform ${getGateColor(gate.name)} ${
                    selectedGates.includes(gate.id) 
                      ? 'border-yellow-400 ring-2 ring-yellow-400' 
                      : selectedGate === gate.id 
                        ? 'border-blue-400 ring-2 ring-blue-400' 
                        : 'border-white dark:border-gray-800'
                  }`}
                  onClick={(e) => {
                    if (e.shiftKey) {
                      onGateToggleSelection(gate.id);
                    } else {
                      setSelectedGate(selectedGate === gate.id ? null : gate.id);
                    }
                  }}
                >
                  {gate.name}
                </div>
                
                {/* Control/Target indicators for multi-qubit gates */}
                {gate.qubits.length > 1 && gate.qubits[0] === qubitIndex && (
                  <div className="absolute -top-1 -right-1">
                    <Circle className="w-3 h-3 text-blue-600 fill-current" />
                  </div>
                )}
                {gate.qubits.length > 1 && gate.qubits[1] === qubitIndex && gate.name !== 'SWAP' && (
                  <div className="absolute -top-1 -right-1">
                    <Target className="w-3 h-3 text-red-600" />
                  </div>
                )}
                
                {/* Gate controls */}
                <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onGateRemove(gate.id)}
                    className="w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <Trash2 className="w-2 h-2" />
                  </button>
                </div>
                
                {gate.parameters && (
                  <div className="absolute -bottom-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="w-4 h-4 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors">
                      <Settings className="w-2 h-2" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {/* Connection lines for multi-qubit gates */}
          {circuit.gates.filter(gate => gate.qubits.length > 1).map(gate => {
            const minQubit = Math.min(...gate.qubits);
            const maxQubit = Math.max(...gate.qubits);
            if (qubitIndex === minQubit) {
              return (
                <div
                  key={`connection-${gate.id}`}
                  className="absolute bg-gray-400 dark:bg-gray-500"
                  style={{
                    left: `${(gate.position || 0) * 60 + 30}px`,
                    top: '50%',
                    width: '2px',
                    height: `${(maxQubit - minQubit) * 52}px`,
                    transform: 'translateX(-1px)'
                  }}
                />
              );
            }
            return null;
          })}
        </div>
      </div>
    );
  };

  const getGateColor = (gateName: string): string => {
    const colorMap: { [key: string]: string } = {
      'H': 'bg-blue-500',
      'X': 'bg-red-500',
      'Y': 'bg-green-500',
      'Z': 'bg-purple-500',
      'S': 'bg-yellow-500',
      'S†': 'bg-yellow-600',
      'T': 'bg-pink-500',
      'T†': 'bg-pink-600',
      'RX': 'bg-red-400',
      'RY': 'bg-green-400',
      'RZ': 'bg-purple-400',
      'U3': 'bg-indigo-500',
      'CX': 'bg-orange-500',
      'CZ': 'bg-cyan-500',
      'CY': 'bg-teal-500',
      'SWAP': 'bg-gray-500',
      'CCX': 'bg-rose-500'
    };
    return colorMap[gateName] || 'bg-gray-500';
  };

  return (
    <div className={`bg-white dark:bg-gray-800 p-3 overflow-auto ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          Quantum Circuit
        </h2>
        <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
          <span>Qubits: {numQubits}</span>
          <span>Gates: {circuit.gates.length}</span>
          <span>Depth: {Math.max(...circuit.gates.map(g => g.position || 0), 0) + 1}</span>
        </div>
      </div>
      
      {gateBeingPlaced && isMultiQubitGate(gateBeingPlaced.name) && (
        <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-xs text-blue-800 dark:text-blue-200">
            {controlQubit === null 
              ? `Click on a qubit to place the control for ${gateBeingPlaced.name} gate`
              : `Control qubit: ${controlQubit}. Click on another qubit to place the target.`
            }
          </p>
          <button
            onClick={() => {
              setGateBeingPlaced(null);
              setControlQubit(null);
            }}
            className="mt-1 px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
      
      {gateBeingPlaced && !isMultiQubitGate(gateBeingPlaced.name) && (
        <div className="mb-3 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-xs text-green-800 dark:text-green-200">
            Click on any qubit line to place the {gateBeingPlaced.name} gate
          </p>
          <button
            onClick={() => setGateBeingPlaced(null)}
            className="mt-1 px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
      
      <div
        ref={canvasRef}
        className="relative p-2 bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 overflow-x-auto"
        style={{ minHeight: `${numQubits * 60 + 60}px` }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onDragLeave={() => setHoveredPosition(null)}
        onDragEnter={handleDragEnter}
        onClick={handleCanvasClick}
      >
        {/* Qubit lines */}
        <div className="space-y-2">
          {Array.from({ length: numQubits }, (_, i) => renderQubitLine(i))}
        </div>
        
        {circuit.gates.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-4">⚛️</div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Drag gates from the library to start building your quantum circuit
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Custom Gate Creation Button */}
      {selectedGates.length > 1 && (
        <div className="absolute top-4 right-4 z-40">
          <button
            onClick={onCreateCustomGate}
            className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm">Create Custom Gate ({selectedGates.length})</span>
          </button>
        </div>
      )}
      
      {selectedGates.length > 0 && (
        <div className="absolute bottom-4 left-4 z-40">
          <div className="bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg px-3 py-2">
            <p className="text-xs text-yellow-800 dark:text-yellow-200">
              {selectedGates.length} gate{selectedGates.length > 1 ? 's' : ''} selected • Shift+click to select multiple
            </p>
          </div>
        </div>
      )}
    </div>
  );
};