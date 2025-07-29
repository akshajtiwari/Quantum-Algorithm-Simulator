import React from 'react';
import { SimulationResult } from '../types/quantum';
import { Clock, Zap, Target, BarChart3, Download, CheckCircle, AlertTriangle } from 'lucide-react';

interface SimulationResultsProps {
  result: SimulationResult;
  onClose: () => void;
}

export const SimulationResults: React.FC<SimulationResultsProps> = ({ result, onClose }) => {
  const downloadResults = () => {
    const dataStr = JSON.stringify(result, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `simulation-results-${Date.now()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const totalCounts = Object.values(result.counts).reduce((sum, count) => sum + count, 0);
  const sortedResults = Object.entries(result.counts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10);

  // Determine if a fallback occurred
  const isFallback = result.backend.startsWith('FALLBACK:');
  const actualBackendUsed = isFallback ? result.backend.replace('FALLBACK: ', '') : result.backend;
  const originalBackendAttempted = result.original_backend_attempted || 'N/A';
  const fallbackReason = result.fallback_reason || 'Unknown reason';


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            {isFallback ? (
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            ) : (
              <CheckCircle className="w-6 h-6 text-green-600" />
            )}
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Simulation Results
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={downloadResults}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Fallback Warning */}
          {isFallback && (
            <div className="bg-orange-100 dark:bg-orange-900/30 border border-orange-400 dark:border-orange-600 text-orange-800 dark:text-orange-300 px-4 py-3 rounded-md mb-6 flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">QPU Access Failed: Fallback to Simulator</p>
                <p className="text-sm">
                  The intended backend (<span className="font-mono">{originalBackendAttempted}</span>) could not be accessed.
                  Reason: <span className="font-medium">{fallbackReason}</span>.
                  The circuit was run on the <span className="font-mono">{actualBackendUsed}</span> simulator instead.
                </p>
              </div>
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center space-x-3">
                <Target className="w-8 h-8 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-300">
                    {result.shots.toLocaleString()}
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-400">Total Shots</div>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center space-x-3">
                <Clock className="w-8 h-8 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-green-900 dark:text-green-300">
                    {result.executionTime.toFixed(2)}ms
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-400">Execution Time</div>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-center space-x-3">
                <BarChart3 className="w-8 h-8 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold text-purple-900 dark:text-purple-300">
                    {Object.keys(result.counts).length}
                  </div>
                  <div className="text-sm text-purple-700 dark:text-purple-400">Unique States</div>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="flex items-center space-x-3">
                <Zap className="w-8 h-8 text-orange-600" />
                <div>
                  <div className="text-2xl font-bold text-orange-900 dark:text-orange-300">
                    {actualBackendUsed.toUpperCase()}
                  </div>
                  <div className="text-sm text-orange-700 dark:text-orange-400">Backend Used</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Results Table */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Measurement Results
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                      State
                    </th>
                    <th className="text-left py-2 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Counts
                    </th>
                    <th className="text-left py-2 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Probability
                    </th>
                    <th className="text-left py-2 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Percentage
                    </th>
                    <th className="text-left py-2 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Visualization
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedResults.map(([state, count], index) => {
                    const probability = count / totalCounts;
                    const percentage = (probability * 100).toFixed(2);
                    
                    return (
                      <tr key={state} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-3 px-4">
                          <span className="font-mono text-sm bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                            |{state}⟩
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                          {count.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                          {probability.toFixed(4)}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                          {percentage}%
                        </td>
                        <td className="py-3 px-4">
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {Object.keys(result.counts).length > 10 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                Showing top 10 results out of {Object.keys(result.counts).length} total states
              </p>
            )}
          </div>
          
          {/* Statistical Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 border border-indigo-200 dark:border-indigo-800">
              <h4 className="text-lg font-semibold text-indigo-900 dark:text-indigo-300 mb-3">
                Statistical Analysis
              </h4>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-indigo-800 dark:text-indigo-400">Most Probable State:</span>
                  <span className="text-sm font-mono text-indigo-900 dark:text-indigo-300">
                    |{sortedResults[0]?.[0] || 'N/A'}⟩
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-indigo-800 dark:text-indigo-400">Max Probability:</span>
                  <span className="text-sm text-indigo-900 dark:text-indigo-300">
                    {sortedResults[0] ? ((sortedResults[0][1] / totalCounts) * 100).toFixed(2) : 0}%
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-indigo-800 dark:text-indigo-400">Entropy:</span>
                  <span className="text-sm text-indigo-900 dark:text-indigo-300">
                    {Object.values(result.counts)
                      .map(count => count / totalCounts)
                      .reduce((entropy, p) => entropy - (p > 0 ? p * Math.log2(p) : 0), 0)
                      .toFixed(3)} bits
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-indigo-800 dark:text-indigo-400">Effective States:</span>
                  <span className="text-sm text-indigo-900 dark:text-indigo-300">
                    {Object.values(result.counts).filter(count => count > totalCounts * 0.01).length}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-teal-50 dark:bg-teal-900/20 rounded-lg p-4 border border-teal-200 dark:border-teal-800">
              <h4 className="text-lg font-semibold text-teal-900 dark:text-teal-300 mb-3">
                Execution Details
              </h4>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-teal-800 dark:text-teal-400">Backend:</span>
                  <span className="text-sm text-teal-900 dark:text-teal-300">
                    {actualBackendUsed.charAt(0).toUpperCase() + actualBackendUsed.slice(1)}
                  </span>
                </div>
                
                {isFallback && (
                  <div className="flex justify-between">
                    <span className="text-sm text-teal-800 dark:text-teal-400">Original Target:</span>
                    <span className="text-sm text-teal-900 dark:text-teal-300">
                      {originalBackendAttempted.charAt(0).toUpperCase() + originalBackendAttempted.slice(1)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-sm text-teal-800 dark:text-teal-400">Timestamp:</span>
                  <span className="text-sm text-teal-900 dark:text-teal-300">
                    {new Date(result.timestamp).toLocaleString()}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-teal-800 dark:text-teal-400">Shots per Second:</span>
                  <span className="text-sm text-teal-900 dark:text-teal-300">
                    {(result.shots / (result.executionTime / 1000)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-teal-800 dark:text-teal-400">Success Rate:</span>
                  <span className="text-sm text-teal-900 dark:text-teal-300">
                    100%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
