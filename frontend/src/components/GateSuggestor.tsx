import React, { useState, useEffect } from 'react';
import { Circuit, QuantumGate } from '../types/quantum';
import { Lightbulb, Plus, X, Loader2, AlertTriangle } from 'lucide-react'; // Added Loader2 and AlertTriangle

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
      case 'high': return 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20';
      case 'medium': return 'border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low': return 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20';
      default: return 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getPriorityTextColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-green-800 dark:text-green-300';
      case 'medium': return 'text-yellow-800 dark:text-yellow-300';
      case 'low': return 'text-blue-800 dark:text-blue-300';
      default: return 'text-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <Lightbulb className="w-6 h-6 text-yellow-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Gate Suggestor
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          title="Close Suggestor"
        >
          <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Smart suggestions based on your current circuit pattern and quantum algorithm best practices:
        </p>
        
        {isLoading ? (
          <div className="text-center py-8 flex flex-col items-center justify-center">
            <Loader2 className="animate-spin w-10 h-10 text-blue-500 mb-4" />
            <p className="text-gray-600 dark:text-gray-300 text-lg font-medium">Generating suggestions...</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">This might take a moment.</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg p-6 border border-red-200 dark:border-red-800">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h4 className="text-xl font-bold mb-2">Suggestion Error!</h4>
            <p className="text-lg">{error}</p>
            <p className="text-sm mt-3 text-red-700 dark:text-red-300">Please ensure your backend server is running and accessible, and check your API key configuration.</p>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="text-center py-8">
            <Lightbulb className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              No Suggestions at the Moment
            </h4>
            <p className="text-gray-600 dark:text-gray-400">
              Your circuit looks good, or I need more context to provide smart suggestions.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className={`p-4 rounded-xl border-2 ${getPriorityColor(suggestion.priority)} shadow-md hover:shadow-lg transition-shadow duration-200`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getPriorityTextColor(suggestion.priority)} bg-white dark:bg-gray-900 border border-current`}>
                        {suggestion.gate}
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                        {suggestion.priority} priority
                      </span>
                    </div>
                    <h4 className={`font-semibold text-lg mb-1 ${getPriorityTextColor(suggestion.priority)}`}>
                      {suggestion.title}
                    </h4>
                    <p className={`text-sm ${getPriorityTextColor(suggestion.priority)} opacity-90`}>
                      {suggestion.reason}
                    </p>
                    <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                      Target qubits: <span className="font-medium">{suggestion.qubits.join(', ')}</span>
                      {suggestion.parameters && ` • Parameters: ${suggestion.parameters.map(p => p.toFixed(2)).join(', ')}`}
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddGate(suggestion)}
                    className="ml-4 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md flex-shrink-0"
                    title="Add this gate"
                  >
                    <Plus className="w-5 h-5" />
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
