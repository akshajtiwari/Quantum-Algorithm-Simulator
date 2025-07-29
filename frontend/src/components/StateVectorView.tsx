import React, { useEffect, useRef, useState } from 'react';
import { Circuit } from '../types/quantum';
import { TrendingUp, Download } from 'lucide-react';

interface StateVectorViewProps {
  circuit: Circuit;
  numQubits: number;
  className?: string;
}

interface ComplexNumber {
  real: number;
  imag: number;
}

export const StateVectorView: React.FC<StateVectorViewProps> = ({ 
  circuit, 
  numQubits, 
  className = '' 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stateVector, setStateVector] = useState<ComplexNumber[]>([]);

  // Calculate state vector
  useEffect(() => {
    const newStateVector = calculateStateVector(circuit, numQubits);
    setStateVector(newStateVector);
  }, [circuit, numQubits]);

  // Draw state vector chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size with device pixel ratio
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    drawStateVectorChart(ctx, rect.width, rect.height, stateVector);
  }, [stateVector]);

  const calculateStateVector = (circuit: Circuit, numQubits: number): ComplexNumber[] => {
    const numStates = Math.pow(2, numQubits);
    const stateVector: ComplexNumber[] = [];
    
    // Initialize state vector to |00...0⟩
    for (let i = 0; i < numStates; i++) {
      stateVector.push({
        real: i === 0 ? 1.0 : 0.0,
        imag: 0.0
      });
    }

    // Apply gates sequentially (simplified simulation)
    circuit.gates.forEach(gate => {
      applyGateToStateVector(stateVector, gate, numQubits);
    });

    return stateVector;
  };

  const applyGateToStateVector = (
    stateVector: ComplexNumber[], 
    gate: any, 
    numQubits: number
  ) => {
    const numStates = stateVector.length;
    
    switch (gate.name) {
      case 'H':
        // Hadamard gate
        const qubit = gate.qubits[0];
        const newStateVector = [...stateVector];
        
        for (let i = 0; i < numStates; i++) {
          const bitMask = 1 << (numQubits - 1 - qubit);
          const j = i ^ bitMask; // Flip the qubit bit
          
          if (i < j) { // Process each pair only once
            const amp0 = stateVector[i];
            const amp1 = stateVector[j];
            
            newStateVector[i] = {
              real: (amp0.real + amp1.real) / Math.sqrt(2),
              imag: (amp0.imag + amp1.imag) / Math.sqrt(2)
            };
            newStateVector[j] = {
              real: (amp0.real - amp1.real) / Math.sqrt(2),
              imag: (amp0.imag - amp1.imag) / Math.sqrt(2)
            };
          }
        }
        
        stateVector.splice(0, numStates, ...newStateVector);
        break;
        
      case 'X':
        // Pauli-X gate
        const xQubit = gate.qubits[0];
        const xNewStateVector = [...stateVector];
        
        for (let i = 0; i < numStates; i++) {
          const bitMask = 1 << (numQubits - 1 - xQubit);
          const j = i ^ bitMask;
          xNewStateVector[i] = stateVector[j];
        }
        
        stateVector.splice(0, numStates, ...xNewStateVector);
        break;
        
      case 'Z':
        // Pauli-Z gate
        const zQubit = gate.qubits[0];
        
        for (let i = 0; i < numStates; i++) {
          const bitMask = 1 << (numQubits - 1 - zQubit);
          if (i & bitMask) {
            stateVector[i].real *= -1;
            stateVector[i].imag *= -1;
          }
        }
        break;
        
      case 'CX':
        // CNOT gate
        const control = gate.qubits[0];
        const target = gate.qubits[1];
        const cxNewStateVector = [...stateVector];
        
        for (let i = 0; i < numStates; i++) {
          const controlBitMask = 1 << (numQubits - 1 - control);
          const targetBitMask = 1 << (numQubits - 1 - target);
          
          if (i & controlBitMask) { // Control qubit is 1
            const j = i ^ targetBitMask; // Flip target qubit
            cxNewStateVector[i] = stateVector[j];
          }
        }
        
        stateVector.splice(0, numStates, ...cxNewStateVector);
        break;
    }
  };

  const drawStateVectorChart = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    stateVector: ComplexNumber[]
  ) => {
    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    if (stateVector.length === 0) return;

    const margin = { top: 40, right: 40, bottom: 60, left: 60 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const maxAmplitude = Math.max(...stateVector.map(amp => 
      Math.sqrt(amp.real * amp.real + amp.imag * amp.imag)
    ));
    
    const barWidth = chartWidth / stateVector.length;

    // Draw axes
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    
    // Y-axis
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, margin.top + chartHeight);
    ctx.stroke();
    
    // X-axis
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top + chartHeight);
    ctx.lineTo(margin.left + chartWidth, margin.top + chartHeight);
    ctx.stroke();

    // Draw bars for real and imaginary parts
    stateVector.forEach((amplitude, index) => {
      const magnitude = Math.sqrt(amplitude.real * amplitude.real + amplitude.imag * amplitude.imag);
      const realHeight = Math.abs(amplitude.real) / maxAmplitude * chartHeight * 0.8;
      const imagHeight = Math.abs(amplitude.imag) / maxAmplitude * chartHeight * 0.8;
      
      const x = margin.left + index * barWidth;
      const centerY = margin.top + chartHeight / 2;

      // Real part (blue)
      ctx.fillStyle = amplitude.real >= 0 ? '#3b82f6' : '#ef4444';
      const realY = amplitude.real >= 0 ? centerY - realHeight : centerY;
      ctx.fillRect(x + 2, realY, barWidth / 2 - 2, realHeight);

      // Imaginary part (green)
      ctx.fillStyle = amplitude.imag >= 0 ? '#10b981' : '#f59e0b';
      const imagY = amplitude.imag >= 0 ? centerY - imagHeight : centerY;
      ctx.fillRect(x + barWidth / 2, imagY, barWidth / 2 - 2, imagHeight);

      // State label
      if (magnitude > 0.01) {
        ctx.fillStyle = '#374151';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.save();
        ctx.translate(x + barWidth / 2, margin.top + chartHeight + 20);
        ctx.rotate(-Math.PI / 4);
        const binaryState = index.toString(2).padStart(numQubits, '0');
        ctx.fillText(`|${binaryState}⟩`, 0, 0);
        ctx.restore();
      }
    });

    // Zero line
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top + chartHeight / 2);
    ctx.lineTo(margin.left + chartWidth, margin.top + chartHeight / 2);
    ctx.stroke();

    // Y-axis labels
    ctx.fillStyle = '#6b7280';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'right';
    for (let i = -2; i <= 2; i++) {
      const value = (maxAmplitude * i) / 2;
      const y = margin.top + chartHeight / 2 - (i * chartHeight) / 4;
      ctx.fillText(value.toFixed(2), margin.left - 10, y + 4);
    }

    // Title
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('State Vector Amplitudes', width / 2, 25);

    // Legend
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(width - 150, 40, 15, 10);
    ctx.fillStyle = '#374151';
    ctx.fillText('Real', width - 130, 50);
    
    ctx.fillStyle = '#10b981';
    ctx.fillRect(width - 150, 55, 15, 10);
    ctx.fillStyle = '#374151';
    ctx.fillText('Imaginary', width - 130, 65);

    // Y-axis title
    ctx.save();
    ctx.translate(20, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Amplitude', 0, 0);
    ctx.restore();
  };

  const downloadChart = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `state-vector-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className={`bg-white dark:bg-gray-800 p-3 overflow-auto ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <TrendingUp className="w-6 h-6 text-purple-600" />
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            State Vector
          </h2>
        </div>
        <button
          onClick={downloadChart}
          className="flex items-center space-x-1 px-2 py-1 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Download</span>
        </button>
      </div>
      
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2 mb-3" style={{ height: '350px' }}>
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ width: '100%', height: '100%' }}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <h3 className="text-xs font-medium text-purple-900 dark:text-purple-300 mb-1">
            Non-Zero Amplitudes
          </h3>
          <div className="space-y-0.5 max-h-24 overflow-y-auto">
            {stateVector
              .map((amp, index) => ({
                state: index.toString(2).padStart(numQubits, '0'),
                magnitude: Math.sqrt(amp.real * amp.real + amp.imag * amp.imag),
                real: amp.real,
                imag: amp.imag
              }))
              .filter(item => item.magnitude > 0.001)
              .sort((a, b) => b.magnitude - a.magnitude)
              .slice(0, 8)
              .map(item => (
                <div key={item.state} className="text-xs">
                  <div className="flex justify-between">
                    <span className="font-mono text-purple-800 dark:text-purple-400">|{item.state}⟩</span>
                    <span className="text-purple-700 dark:text-purple-300">
                      {item.real.toFixed(3)} + {item.imag.toFixed(3)}i
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
        
        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
          <h3 className="text-xs font-medium text-indigo-900 dark:text-indigo-300 mb-1">
            Vector Properties
          </h3>
          <div className="space-y-0.5 text-xs">
            <div className="flex justify-between">
              <span className="text-indigo-800 dark:text-indigo-400">Dimension:</span>
              <span className="text-indigo-700 dark:text-indigo-300">{stateVector.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-indigo-800 dark:text-indigo-400">Norm:</span>
              <span className="text-indigo-700 dark:text-indigo-300">
                {Math.sqrt(stateVector.reduce((sum, amp) => 
                  sum + amp.real * amp.real + amp.imag * amp.imag, 0
                )).toFixed(3)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-indigo-800 dark:text-indigo-400">Non-zero:</span>
              <span className="text-indigo-700 dark:text-indigo-300">
                {stateVector.filter(amp => 
                  Math.sqrt(amp.real * amp.real + amp.imag * amp.imag) > 0.001
                ).length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};