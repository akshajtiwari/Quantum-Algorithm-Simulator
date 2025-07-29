// src/components/TranspilerPanel.tsx
import React, { useState, useEffect } from 'react';
import { Circuit, Backend } from '../types/quantum';
import { X, SlidersHorizontal, ArrowRight, AlertTriangle } from 'lucide-react';

interface TranspilerPanelProps {
  circuit: Circuit;
  numQubits: number;
  availableBackends: { name: Backend; label: string; type: 'qpu' | 'simulator' }[];
  onClose: () => void;
  // If you want to apply the transpiled circuit back to the canvas, uncomment:
  // onApplyTranspiledCircuit: (newCircuit: Circuit) => void; 
}

export const TranspilerPanel: React.FC<TranspilerPanelProps> = ({
  circuit,
  numQubits,
  availableBackends,
  onClose,
  // onApplyTranspiledCircuit
}) => {
  const [selectedBackend, setSelectedBackend] = useState<Backend | ''>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transpiledQasmCode, setTranspiledQasmCode] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<{
    original_gate_count: number;
    transpiled_gate_count: number;
    original_depth: number;
    transpiled_depth: number;
  } | null>(null);

  useEffect(() => {
    // Set a default backend if available and none is selected
    if (availableBackends.length > 0 && !selectedBackend) {
      setSelectedBackend(availableBackends[0].name);
    }
  }, [availableBackends, selectedBackend]);

  const handleTranspile = async () => {
    if (!selectedBackend) {
      setError("Please select a target backend.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setTranspiledQasmCode(null);
    setMetrics(null);

    try {
      const response = await fetch("http://localhost:5000/transpile_circuit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          circuit: circuit,
          num_qubits: numQubits,
          target_backend_name: selectedBackend,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setTranspiledQasmCode(data.transpiled_circuit_qasm);
        setMetrics({
          original_gate_count: data.original_gate_count,
          transpiled_gate_count: data.transpiled_gate_count,
          original_depth: data.original_depth,
          transpiled_depth: data.transpiled_depth,
        });
        // If you implement onApplyTranspiledCircuit, call it here:
        // if (data.transpiled_circuit_json) {
        //   onApplyTranspiledCircuit(data.transpiled_circuit_json);
        // }
      } else {
        setError(data.error || 'Failed to transpile circuit.');
      }
    } catch (err) {
      console.error("Error transpiling circuit:", err);
      setError('Could not connect to the transpilation service. Ensure backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const getReductionPercentage = (original: number, transpiled: number) => {
    if (original === 0) return "N/A";
    const reduction = ((original - transpiled) / original) * 100;
    return `${reduction.toFixed(2)}%`;
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <SlidersHorizontal className="w-6 h-6 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Quantum Transpiler
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          title="Close Transpiler"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Optimize your circuit for specific quantum hardware by selecting a target backend.
        </p>

        <div className="mb-4">
          <label htmlFor="backend-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Target Quantum Backend:
          </label>
          <select
            id="backend-select"
            value={selectedBackend}
            onChange={(e) => setSelectedBackend(e.target.value as Backend)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            disabled={isLoading}
          >
            {availableBackends.map((backend) => (
              <option key={backend.name} value={backend.name}>
                {backend.label} ({backend.type.toUpperCase()})
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleTranspile}
          disabled={isLoading || !selectedBackend}
          className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
            isLoading || !selectedBackend
              ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              : 'bg-purple-600 text-white hover:bg-purple-700'
          }`}
        >
          {isLoading ? 'Transpiling...' : 'Transpile Circuit'}
        </button>

        {error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-900 dark:text-red-300">
            <AlertTriangle className="inline-block w-5 h-5 mr-2" />
            {error}
          </div>
        )}

        {isLoading && (
          <div className="text-center py-8">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-t-4 border-purple-500 border-solid rounded-full"></div>
            <p className="text-gray-500 dark:text-gray-400 mt-4">Transpiling circuit, please wait...</p>
          </div>
        )}

        {metrics && !isLoading && (
          <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
            <h4 className="font-semibold text-purple-900 dark:text-purple-300 mb-3">Transpilation Results:</h4>
            <div className="grid grid-cols-2 gap-2 text-sm text-purple-800 dark:text-purple-400">
              <div>Original Gates: <span className="font-medium">{metrics.original_gate_count}</span></div>
              <div>Transpiled Gates: <span className="font-medium">{metrics.transpiled_gate_count}</span></div>
              <div>Gate Reduction: <span className="font-medium">{getReductionPercentage(metrics.original_gate_count, metrics.transpiled_gate_count)}</span></div>
              
              <div className="mt-2">Original Depth: <span className="font-medium">{metrics.original_depth}</span></div>
              <div className="mt-2">Transpiled Depth: <span className="font-medium">{metrics.transpiled_depth}</span></div>
              <div className="mt-2">Depth Reduction: <span className="font-medium">{getReductionPercentage(metrics.original_depth, metrics.transpiled_depth)}</span></div>
            </div>
          </div>
        )}

        {transpiledQasmCode && !isLoading && (
          <div className="mt-6">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <ArrowRight className="w-5 h-5 mr-2 text-purple-600" />
              Transpiled QASM Code:
            </h4>
            <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm text-green-300 overflow-x-auto custom-scrollbar">
              <pre><code>{transpiledQasmCode}</code></pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
