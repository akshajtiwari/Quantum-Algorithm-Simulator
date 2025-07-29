import React from 'react';
import { Play, Pause, Sun, Moon, Download, Upload, Code, Eye, Trash2, Settings, Atom, Plus, Minus, Bot, Lightbulb, Wrench, BarChart3, TrendingUp, Save, FolderOpen, SlidersHorizontal } from 'lucide-react'; // Import SlidersHorizontal
import { Backend } from '../types/quantum';

interface HeaderProps {
  theme: string;
  toggleTheme: () => void;
  onSimulate: () => void;
  isSimulating: boolean;
  selectedBackend: Backend;
  setSelectedBackend: (backend: Backend) => void;
  showCodeView: boolean;
  setShowCodeView: (show: boolean) => void;
  showBlochSphere: boolean;
  setShowBlochSphere: (show: boolean) => void;
  showProbability: boolean;
  setShowProbability: (show: boolean) => void;
  showStateVector: boolean;
  setShowStateVector: (show: boolean) => void;
  onExport: () => void;
  onImport: () => void;
  onClear: () => void;
  onSaveBackup: () => void;
  onLoadBackup: () => void;
  numQubits: number;
  onNumQubitsChange: (numQubits: number) => void;
  activeBottomPanel: 'chat' | 'suggest' | 'fix' | 'none';
  onToggleBottomPanel: (panel: 'chat' | 'suggest' | 'fix') => void;
  onToggleTranspilerPanel: () => void; // New prop for transpiler
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  toggleTheme,
  onSimulate,
  isSimulating,
  selectedBackend,
  setSelectedBackend,
  showCodeView,
  setShowCodeView,
  showBlochSphere,
  setShowBlochSphere,
  showProbability,
  setShowProbability,
  showStateVector,
  setShowStateVector,
  onExport,
  onImport,
  onClear,
  onSaveBackup,
  onLoadBackup,
  numQubits,
  onNumQubitsChange,
  activeBottomPanel,
  onToggleBottomPanel,
  onToggleTranspilerPanel // Destructure new prop
}) => {
  const backends: { value: Backend; label: string }[] = [
    { value: 'ibm_qasm_simulator', label: 'IBM QASM Simulator' },
    { value: 'ibm_brisbane', label: 'IBM Brisbane' },
    { value: 'ibm_osprey', label: 'IBM Osprey' },
    { value: 'aws_ionq', label: 'AWS IonQ QPU' },
    { value: 'aws_sv1', label: 'AWS SV1 Simulator' },
    { value: 'aws_local', label: 'AWS Local Simulator' },
    { value: 'aws_rigetti', label: 'AWS Rigetti QPU' },
    { value: 'google_cirq', label: 'Google Cirq Simulator' },
    { value: 'pennylane_default', label: 'PennyLane Default.qubit' },
    { value: 'pennylane_lightning', label: 'PennyLane Lightning.qubit' },
    { value: 'aer_qasm_simulator', label: 'Qiskit Aer QASM Simulator' },
    { value: 'aer_statevector_simulator', label: 'Qiskit Aer Statevector Simulator' }
  ];

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center space-x-3 min-w-0 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">Q</span>
            </div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate">
              Quantum Algorithm Simulator
            </h1>
          </div>
          
          <div className="flex items-center space-x-2 flex-wrap">
            <div className="flex items-center space-x-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
              <span className="text-sm text-gray-700 dark:text-gray-300">Qubits:</span>
              <button
                onClick={() => onNumQubitsChange(Math.max(1, numQubits - 1))}
                className="w-5 h-5 flex items-center justify-center rounded bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-6 text-center text-sm font-medium text-gray-900 dark:text-white">
                {numQubits}
              </span>
              <button
                onClick={() => onNumQubitsChange(Math.min(8, numQubits + 1))}
                className="w-5 h-5 flex items-center justify-center rounded bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
            
            <select
              value={selectedBackend}
              onChange={(e) => setSelectedBackend(e.target.value as Backend)}
              className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-0"
            >
              {backends.map(backend => (
                <option key={backend.value} value={backend.value}>
                  {backend.label}
                </option>
              ))}
            </select>
            
            <button
              onClick={onSimulate}
              disabled={isSimulating}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                isSimulating
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isSimulating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span className="hidden sm:inline">{isSimulating ? 'Simulating...' : 'Simulate'}</span>
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-1 flex-shrink-0">
          <button
            onClick={() => {
              setShowBlochSphere(!showBlochSphere);
              if (!showBlochSphere) {
                setShowCodeView(false);
                setShowProbability(false);
                setShowStateVector(false);
              }
            }}
            className={`p-1.5 rounded-lg transition-colors ${
              showBlochSphere 
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title="Show Bloch Sphere"
          >
            <Atom className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => {
              setShowProbability(!showProbability);
              if (!showProbability) {
                setShowCodeView(false);
                setShowBlochSphere(false);
                setShowStateVector(false);
              }
            }}
            className={`p-1.5 rounded-lg transition-colors ${
              showProbability 
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title="Show Probability Distribution"
          >
            <BarChart3 className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => {
              setShowStateVector(!showStateVector);
              if (!showStateVector) {
                setShowCodeView(false);
                setShowBlochSphere(false);
                setShowProbability(false);
              }
            }}
            className={`p-1.5 rounded-lg transition-colors ${
              showStateVector 
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title="Show State Vector"
          >
            <TrendingUp className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => {
              setShowCodeView(!showCodeView);
              if (!showCodeView) {
                setShowBlochSphere(false);
                setShowProbability(false);
                setShowStateVector(false);
              }
            }}
            className={`p-1.5 rounded-lg transition-colors ${
              showCodeView 
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title={showCodeView ? 'Show Circuit View' : 'Show Code View'}
          >
            {showCodeView ? <Eye className="w-5 h-5" /> : <Code className="w-5 h-5" />}
          </button>
          
          <button
            onClick={onExport}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Export Circuit"
          >
            <Download className="w-5 h-5" />
          </button>
          
          <button
            onClick={onImport}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Import Circuit"
          >
            <Upload className="w-5 h-5" />
          </button>
          
          <button
            onClick={onSaveBackup}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Save Backup"
          >
            <Save className="w-5 h-5" />
          </button>
          
          <button
            onClick={onLoadBackup}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Load Backup"
          >
            <FolderOpen className="w-5 h-5" />
          </button>
          
          <button
            onClick={onClear}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-red-600"
            title="Clear Circuit"
          >
            <Trash2 className="w-5 h-5" />
          </button>
          
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
          
          <button
            onClick={() => onToggleBottomPanel('chat')}
            className={`p-1.5 rounded-lg transition-colors ${
              activeBottomPanel === 'chat'
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title="Quantum Chatbot"
          >
            <Bot className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => onToggleBottomPanel('suggest')}
            className={`p-1.5 rounded-lg transition-colors ${
              activeBottomPanel === 'suggest'
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title="Gate Suggestor"
          >
            <Lightbulb className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => onToggleBottomPanel('fix')}
            className={`p-1.5 rounded-lg transition-colors ${
              activeBottomPanel === 'fix'
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title="Circuit Fixer"
          >
            <Wrench className="w-5 h-5" />
          </button>

          {/* New Transpiler Button */}
          <button
            onClick={onToggleTranspilerPanel}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Quantum Transpiler"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
          
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
          
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </header>
  );
};
