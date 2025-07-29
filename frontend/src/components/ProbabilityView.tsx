import React, { useEffect, useRef, useState } from 'react';
import { Circuit } from '../types/quantum';
import { BarChart3, Download } from 'lucide-react';

interface ProbabilityViewProps {
  circuit: Circuit;
  numQubits: number;
  className?: string;
}

export const ProbabilityView: React.FC<ProbabilityViewProps> = ({ 
  circuit, 
  numQubits, 
  className = '' 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [probabilities, setProbabilities] = useState<{ [key: string]: number }>({});

  // Calculate probability distribution
  useEffect(() => {
    const newProbabilities = calculateProbabilities(circuit, numQubits);
    setProbabilities(newProbabilities);
  }, [circuit, numQubits]);

  // Draw probability chart
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

    drawProbabilityChart(ctx, rect.width, rect.height, probabilities);
  }, [probabilities]);

  const calculateProbabilities = (circuit: Circuit, numQubits: number) => {
    const numStates = Math.pow(2, numQubits);
    const probabilities: { [key: string]: number } = {};
    
    // Initialize all states with equal probability if no gates
    if (circuit.gates.length === 0) {
      probabilities['0'.repeat(numQubits)] = 1.0;
      return probabilities;
    }

    // Simplified probability calculation
    // In a real implementation, this would use proper quantum state simulation
    for (let i = 0; i < numStates; i++) {
      const binaryState = i.toString(2).padStart(numQubits, '0');
      let probability = 1.0 / numStates; // Start with uniform distribution
      
      // Adjust probabilities based on gates (simplified)
      circuit.gates.forEach(gate => {
        switch (gate.name) {
          case 'H':
            // Hadamard creates superposition
            probability *= 0.5;
            break;
          case 'X':
            // Pauli-X flips the bit
            const qubitIndex = gate.qubits[0];
            const bitValue = binaryState[numQubits - 1 - qubitIndex];
            if (bitValue === '0') probability *= 0.1;
            else probability *= 1.9;
            break;
          case 'CX':
            // CNOT creates entanglement
            const controlBit = binaryState[numQubits - 1 - gate.qubits[0]];
            const targetBit = binaryState[numQubits - 1 - gate.qubits[1]];
            if (controlBit === '1' && targetBit === '0') probability *= 1.5;
            break;
        }
      });
      
      if (probability > 0.001) {
        probabilities[binaryState] = probability;
      }
    }

    // Normalize probabilities
    const total = Object.values(probabilities).reduce((sum, p) => sum + p, 0);
    if (total > 0) {
      Object.keys(probabilities).forEach(state => {
        probabilities[state] /= total;
      });
    }

    return probabilities;
  };

  const drawProbabilityChart = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    probabilities: { [key: string]: number }
  ) => {
    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    const states = Object.keys(probabilities).sort();
    if (states.length === 0) return;

    const margin = { top: 40, right: 40, bottom: 60, left: 60 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const maxProbability = Math.max(...Object.values(probabilities));
    const barWidth = chartWidth / states.length;

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

    // Draw bars
    states.forEach((state, index) => {
      const probability = probabilities[state];
      const barHeight = (probability / maxProbability) * chartHeight;
      const x = margin.left + index * barWidth;
      const y = margin.top + chartHeight - barHeight;

      // Bar
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(x + 2, y, barWidth - 4, barHeight);

      // State label
      ctx.fillStyle = '#374151';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.save();
      ctx.translate(x + barWidth / 2, margin.top + chartHeight + 20);
      ctx.rotate(-Math.PI / 4);
      ctx.fillText(`|${state}⟩`, 0, 0);
      ctx.restore();

      // Probability label
      if (probability > 0.01) {
        ctx.fillStyle = '#1f2937';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(
          probability.toFixed(3),
          x + barWidth / 2,
          y - 5
        );
      }
    });

    // Y-axis labels
    ctx.fillStyle = '#6b7280';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const value = (maxProbability * i) / 5;
      const y = margin.top + chartHeight - (i * chartHeight) / 5;
      ctx.fillText(value.toFixed(2), margin.left - 10, y + 4);
    }

    // Title
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Probability Distribution', width / 2, 25);

    // Y-axis title
    ctx.save();
    ctx.translate(20, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Probability', 0, 0);
    ctx.restore();
  };

  const downloadChart = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `probability-distribution-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className={`bg-white dark:bg-gray-800 p-3 overflow-auto ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Probability Distribution
          </h2>
        </div>
        <button
          onClick={downloadChart}
          className="flex items-center space-x-1 px-2 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="text-xs font-medium text-blue-900 dark:text-blue-300 mb-1">
            Measurement Outcomes
          </h3>
          <div className="space-y-0.5 max-h-24 overflow-y-auto">
            {Object.entries(probabilities)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 8)
              .map(([state, prob]) => (
                <div key={state} className="flex justify-between text-xs">
                  <span className="font-mono text-blue-800 dark:text-blue-400">|{state}⟩</span>
                  <span className="text-blue-700 dark:text-blue-300">{(prob * 100).toFixed(1)}%</span>
                </div>
              ))}
          </div>
        </div>
        
        <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <h3 className="text-xs font-medium text-green-900 dark:text-green-300 mb-1">
            Statistics
          </h3>
          <div className="space-y-0.5 text-xs">
            <div className="flex justify-between">
              <span className="text-green-800 dark:text-green-400">Total States:</span>
              <span className="text-green-700 dark:text-green-300">{Object.keys(probabilities).length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-800 dark:text-green-400">Max Probability:</span>
              <span className="text-green-700 dark:text-green-300">
                {(Math.max(...Object.values(probabilities)) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-800 dark:text-green-400">Entropy:</span>
              <span className="text-green-700 dark:text-green-300">
                {Object.values(probabilities)
                  .reduce((entropy, p) => entropy - (p > 0 ? p * Math.log2(p) : 0), 0)
                  .toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};