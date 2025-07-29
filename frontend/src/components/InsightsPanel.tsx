import React from 'react';
import { Circuit } from '../types/quantum';
import { BarChart3, Clock, Zap, AlertCircle } from 'lucide-react';

interface InsightsPanelProps {
  circuit: Circuit;
  className?: string;
}

export const InsightsPanel: React.FC<InsightsPanelProps> = ({ circuit, className = '' }) => {
  const gateCount = circuit.gates.length;
  const circuitDepth = Math.max(...circuit.gates.map(g => g.position || 0), 0) + 1;
  const uniqueGates = new Set(circuit.gates.map(g => g.name)).size;
  const quantumCost = circuit.gates.reduce((cost, gate) => {
    const costMap: { [key: string]: number } = {
      'H': 1, 'X': 1, 'Y': 1, 'Z': 1, 'S': 1, 'T': 1,
      'RX': 1, 'RY': 1, 'RZ': 1, 'U3': 3,
      'CX': 5, 'CZ': 5, 'CY': 5, 'SWAP': 3, 'CCX': 7
    };
    return cost + (costMap[gate.name] || 1);
  }, 0);

  const insights = [
    {
      icon: BarChart3,
      label: 'Gate Count',
      value: gateCount,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      icon: Clock,
      label: 'Circuit Depth',
      value: circuitDepth,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      icon: Zap,
      label: 'Quantum Cost',
      value: quantumCost,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
      icon: AlertCircle,
      label: 'Unique Gates',
      value: uniqueGates,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20'
    }
  ];

  const getCircuitComplexity = () => {
    if (gateCount === 0) return { level: 'None', color: 'text-gray-500' };
    if (gateCount < 5) return { level: 'Simple', color: 'text-green-500' };
    if (gateCount < 15) return { level: 'Moderate', color: 'text-yellow-500' };
    if (gateCount < 30) return { level: 'Complex', color: 'text-orange-500' };
    return { level: 'Very Complex', color: 'text-red-500' };
  };

  const complexity = getCircuitComplexity();

  return (
    <div className={`bg-white dark:bg-gray-800 p-3 border-b border-gray-200 dark:border-gray-700 ${className}`}>
      <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
        Circuit Insights
      </h2>
      
      <div className="space-y-2">
        {insights.map((insight) => {
          const Icon = insight.icon;
          return (
            <div
              key={insight.label}
              className={`p-2 rounded-lg ${insight.bgColor} border border-gray-200 dark:border-gray-600`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Icon className={`w-5 h-5 ${insight.color}`} />
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {insight.label}
                  </span>
                </div>
                <span className={`text-sm font-bold ${insight.color}`}>
                  {insight.value}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            Complexity Level
          </span>
          <span className={`text-xs font-bold ${complexity.color}`}>
            {complexity.level}
          </span>
        </div>
        
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              complexity.level === 'Simple' ? 'bg-green-500 w-1/4' :
              complexity.level === 'Moderate' ? 'bg-yellow-500 w-1/2' :
              complexity.level === 'Complex' ? 'bg-orange-500 w-3/4' :
              complexity.level === 'Very Complex' ? 'bg-red-500 w-full' :
              'bg-gray-300 w-0'
            }`}
          />
        </div>
      </div>
      
      {gateCount > 0 && (
        <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="text-xs font-medium text-blue-900 dark:text-blue-300 mb-1">
            Performance Tips
          </h3>
          <ul className="text-xs text-blue-800 dark:text-blue-400 space-y-0.5">
            <li>• Minimize circuit depth for better coherence</li>
            <li>• Use native gates when possible</li>
            <li>• Consider gate fidelity on real hardware</li>
            <li>• Optimize for your target backend</li>
          </ul>
        </div>
      )}
    </div>
  );
};