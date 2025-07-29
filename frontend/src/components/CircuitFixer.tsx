import React, { useState, useEffect } from 'react';
import { Circuit } from '../types/quantum';
import { Wrench, AlertTriangle, CheckCircle, Info, X, Trash2, Loader2 } from 'lucide-react'; // Added Loader2 for spinner

interface CircuitFixerProps {
  circuit: Circuit;
  onGateRemove: (gateId: string) => void;
  onClose: () => void;
}

interface CircuitFinding {
  type: 'error' | 'warning' | 'info';
  title: string;
  description: string;
  action: string;
  severity?: 'high' | 'medium' | 'low';
  fixable: boolean;
  gates_to_remove?: string[]; // IDs of gates to remove for auto-fix
}

export const CircuitFixer: React.FC<CircuitFixerProps> = ({ 
  circuit, 
  onGateRemove, 
  onClose 
}) => {
  const [findings, setFindings] = useState<CircuitFinding[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    analyzeCircuitWithAI();
  }, [circuit]); // Re-analyze circuit when it changes

  const analyzeCircuitWithAI = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("http://localhost:5000/fix_circuit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ circuit }),
      });

      const data = await response.json();

      if (response.ok) {
        setFindings(data.findings || []);
      } else {
        setError(data.error || 'Failed to get circuit analysis.');
        setFindings([]);
      }
    } catch (err) {
      console.error("Error fetching circuit analysis:", err);
      setError('Could not connect to the circuit analysis service.');
      setFindings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoFix = (finding: CircuitFinding) => {
    if (finding.fixable && finding.gates_to_remove) {
      finding.gates_to_remove.forEach(gateId => {
        onGateRemove(gateId);
      });
      // After fixing, re-analyze the circuit to reflect changes
      analyzeCircuitWithAI(); 
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'error': return AlertTriangle;
      case 'warning': return AlertTriangle;
      case 'info': return Info;
      default: return CheckCircle;
    }
  };

  const getColors = (type: string) => {
    switch (type) {
      case 'error': return {
        bg: 'bg-red-50 dark:bg-red-900/20',
        border: 'border-red-200 dark:border-red-800',
        text: 'text-red-900 dark:text-red-300',
        icon: 'text-red-600'
      };
      case 'warning': return {
        bg: 'bg-yellow-50 dark:bg-yellow-900/20',
        border: 'border-yellow-200 dark:border-yellow-800',
        text: 'text-yellow-900 dark:text-yellow-300',
        icon: 'text-yellow-600'
      };
      case 'info': return {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'border-blue-200 dark:border-blue-800',
        text: 'text-blue-900 dark:text-blue-300',
        icon: 'text-blue-600'
      };
      default: return {
        bg: 'bg-gray-50 dark:bg-gray-900/20',
        border: 'border-gray-200 dark:border-gray-800',
        text: 'text-gray-900 dark:text-gray-300',
        icon: 'text-gray-600'
      };
    }
  };

  const issues = findings.filter(f => f.type === 'error');
  const optimizations = findings.filter(f => f.type === 'warning');
  const info = findings.filter(f => f.type === 'info');
  const allItems = findings; // Display all findings in the list

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <Wrench className="w-6 h-6 text-orange-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Circuit Fixer
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          title="Close Fixer"
        >
          <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <div className="mb-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-red-700 dark:text-red-300">{issues.length}</div>
              <div className="text-sm text-red-800 dark:text-red-400">Issues</div>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{optimizations.length}</div>
              <div className="text-sm text-yellow-800 dark:text-yellow-400">Optimizations</div>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{info.length}</div>
              <div className="text-sm text-blue-800 dark:text-blue-400">Suggestions</div>
            </div>
          </div>
        </div>
        
        {isLoading ? (
          <div className="text-center py-8 flex flex-col items-center justify-center">
            <Loader2 className="animate-spin w-10 h-10 text-orange-500 mb-4" />
            <p className="text-gray-600 dark:text-gray-300 text-lg font-medium">Analyzing circuit...</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">This might take a moment.</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg p-6 border border-red-200 dark:border-red-800">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h4 className="text-xl font-bold mb-2">Analysis Error!</h4>
            <p className="text-lg">{error}</p>
            <p className="text-sm mt-3 text-red-700 dark:text-red-300">Please ensure your backend server is running and accessible, and check your API key configuration.</p>
          </div>
        ) : allItems.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Circuit Looks Great!
            </h4>
            <p className="text-gray-600 dark:text-gray-400">
              No issues or optimizations detected in your quantum circuit. Keep up the good work!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {allItems.map((item, index) => {
              const Icon = getIcon(item.type);
              const colors = getColors(item.type);
              
              return (
                <div
                  key={index}
                  className={`p-4 rounded-xl border-2 ${colors.bg} ${colors.border} shadow-md hover:shadow-lg transition-shadow duration-200`}
                >
                  <div className="flex items-start space-x-4">
                    <Icon className={`w-7 h-7 mt-0.5 ${colors.icon} flex-shrink-0`} />
                    <div className="flex-1">
                      <h4 className={`font-semibold text-lg mb-1 ${colors.text}`}>
                        {item.title}
                      </h4>
                      <p className={`text-sm mb-2 ${colors.text} opacity-90`}>
                        {item.description}
                      </p>
                      <p className={`text-xs ${colors.text} opacity-70 italic`}>
                        💡 {item.action}
                      </p>
                    </div>
                    {item.fixable && (
                      <button
                        onClick={() => handleAutoFix(item)}
                        className="ml-4 p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors shadow-sm flex-shrink-0"
                        title="Auto-fix this issue"
                      >
                        <Trash2 className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
