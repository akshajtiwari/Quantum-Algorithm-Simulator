import React, { useState, useEffect } from 'react';
import { Circuit, QuantumGate } from '../types/quantum';
import { Lightbulb, Plus, X } from 'lucide-react';

interface GateSuggestorProps {
  circuit: Circuit;
  onGateAdd: (gate: QuantumGate) => void;
  numQubits: number;
  onClose: () => void;
}

interface Suggestion {
  gate: string;
  title: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  qubits: number[];
  parameters?: number[];
}

export const GateSuggestor: React.FC<GateSuggestorProps> = ({ 
  circuit, 
  onGateAdd, 
  numQubits, 
  onClose 
}) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSuggestions();
  }, [circuit, numQubits]); // Re-fetch suggestions when circuit or numQubits changes

  const fetchSuggestions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("http://localhost:5000/suggest_gates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ circuit, numQubits }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuggestions(data.suggestions || []);
      } else {
        setError(data.error || 'Failed to fetch gate suggestions.');
        setSuggestions([]);
      }
    } catch (err) {
      console.error("Error fetching gate suggestions:", err);
      setError('Could not connect to the gate suggestion service.');
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddGate = (suggestion: Suggestion) => {
    const gate: QuantumGate = {
      id: Date.now().toString(), // Simple unique ID for now
      name: suggestion.gate,
      qubits: suggestion.qubits,
      parameters: suggestion.parameters
    };
    onGateAdd(gate);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20';
      case 'medium': return 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low': return 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20';
      default: return 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getPriorityTextColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-green-900 dark:text-green-300';
      case 'medium': return 'text-yellow-900 dark:text-yellow-300';
      case 'low': return 'text-blue-900 dark:text-blue-300';
      default: return 'text-gray-900 dark:text-gray-300';
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <Lightbulb className="w-6 h-6 text-yellow-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Gate Suggestor
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          title="Close Suggestor"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Smart suggestions based on your current circuit pattern and quantum algorithm best practices:
        </p>
        
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-t-4 border-blue-500 border-solid rounded-full"></div>
            <p className="text-gray-500 dark:text-gray-400 mt-4">Generating suggestions...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500 dark:text-red-400">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
            <p>{error}</p>
            <p className="text-sm mt-2">Please check your backend server and API key configuration.</p>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="text-center py-8">
            <Lightbulb className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 dark:text-gray-400">
              No specific suggestions at the moment. Your circuit looks good!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${getPriorityColor(suggestion.priority)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityTextColor(suggestion.priority)} bg-white dark:bg-gray-800`}>
                        {suggestion.gate}
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                        {suggestion.priority} priority
                      </span>
                    </div>
                    <h4 className={`font-medium mb-1 ${getPriorityTextColor(suggestion.priority)}`}>
                      {suggestion.title}
                    </h4>
                    <p className={`text-sm ${getPriorityTextColor(suggestion.priority)} opacity-80`}>
                      {suggestion.reason}
                    </p>
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Target qubits: {suggestion.qubits.join(', ')}
                      {suggestion.parameters && ` • Parameters: ${suggestion.parameters.map(p => p.toFixed(2)).join(', ')}`}
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddGate(suggestion)}
                    className="ml-3 p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    title="Add this gate"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
