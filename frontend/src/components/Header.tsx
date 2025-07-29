import React, { useState } from 'react';
import { Play, Pause, Sun, Moon, Download, Upload, Code, Eye, Trash2, Settings, Atom, Plus, Minus, Bot, Lightbulb, Wrench, BarChart3, TrendingUp, Save, FolderOpen, SlidersHorizontal, ChevronDown, CircuitBoard, Eraser } from 'lucide-react'; // Changed LayoutGrid to CircuitBoard, added Eraser for Clear Circuit
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
  onToggleTranspilerPanel: () => void; 
  onOpenChatbot: () => void; 
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
  onToggleTranspilerPanel,
  onOpenChatbot 
}) => {
  const [fileDropdownOpen, setFileDropdownOpen] = useState(false);
  const [viewDropdownOpen, setViewDropdownOpen] = useState(false);
  const [aiDropdownOpen, setAiDropdownOpen] = useState(false);

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

  // Helper function to close all dropdowns
  const closeAllDropdowns = () => {
    setFileDropdownOpen(false);
    setViewDropdownOpen(false);
    setAiDropdownOpen(false);
  };

  // Handle clicks outside to close dropdowns
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        closeAllDropdowns();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleViewToggle = (setter: React.Dispatch<React.SetStateAction<boolean>>, currentState: boolean) => {
    setShowBlochSphere(false);
    setShowProbability(false);
    setShowStateVector(false);
    setShowCodeView(false);
    setter(!currentState);
    closeAllDropdowns();
  };

  // Function to show the Circuit Canvas
  const showCircuitCanvas = () => {
    setShowBlochSphere(false);
    setShowProbability(false);
    setShowStateVector(false);
    setShowCodeView(false);
    closeAllDropdowns();
  };

  const handleAIToolToggle = (panel: 'chat' | 'suggest' | 'fix' | 'transpile') => {
    if (panel === 'chat') {
      onOpenChatbot(); 
    } else if (panel === 'transpile') {
      onToggleTranspilerPanel();
      onToggleBottomPanel('none'); 
    }
    else {
      onToggleBottomPanel(panel);
    }
    closeAllDropdowns();
  };


  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        {/* Left Section: Logo, Title, Qubit Controls, Backend, Simulate */}
        <div className="flex items-center space-x-4 min-w-0 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-sm">Q</span>
            </div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate">
              Quantum Algorithm Simulator
            </h1>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 shadow-sm">
              <span className="text-sm text-gray-700 dark:text-gray-300">Qubits:</span>
              <button
                onClick={() => onNumQubitsChange(Math.max(1, numQubits - 1))}
                className="w-5 h-5 flex items-center justify-center rounded bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors text-gray-700 dark:text-gray-300"
                title="Decrease Qubits"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-6 text-center text-sm font-medium text-gray-900 dark:text-white">
                {numQubits}
              </span>
              <button
                onClick={() => onNumQubitsChange(Math.min(8, numQubits + 1))}
                className="w-5 h-5 flex items-center justify-center rounded bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors text-gray-700 dark:text-gray-300"
                title="Increase Qubits"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
            
            <select
              value={selectedBackend}
              onChange={(e) => setSelectedBackend(e.target.value as Backend)}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
              title="Select Backend"
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
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors shadow-md ${
                isSimulating
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white transform hover:scale-105'
              }`}
              title="Run Simulation"
            >
              {isSimulating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span className="hidden sm:inline">{isSimulating ? 'Simulating...' : 'Simulate'}</span>
            </button>
          </div>
        </div>
        
        {/* Right Section: Fixed Buttons, Dropdowns and Theme Toggle */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          {/* Circuit Canvas Button */}
          <button
            onClick={showCircuitCanvas}
            className={`p-2 rounded-lg transition-colors ${
              !showBlochSphere && !showProbability && !showStateVector && !showCodeView
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
            title="Show Circuit Canvas"
          >
            <CircuitBoard className="w-5 h-5" />
          </button>

          {/* Clear Circuit Button - Always Visible */}
          <button
            onClick={onClear}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-red-600 dark:text-red-400"
            title="Clear Circuit"
          >
            <Eraser className="w-5 h-5" />
          </button>
          
          {/* File Dropdown */}
          <div className="relative dropdown-container">
            <button
              onClick={() => { closeAllDropdowns(); setFileDropdownOpen(!fileDropdownOpen); }}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300 font-medium"
              title="File Options"
            >
              <span>File</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${fileDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {fileDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-lg shadow-xl py-1 z-10 border border-gray-200 dark:border-gray-600">
                <button 
                  onClick={() => { onExport(); closeAllDropdowns(); }} 
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" /> Export Circuit
                </button>
                <button 
                  onClick={() => { onImport(); closeAllDropdowns(); }} 
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <Upload className="w-4 h-4 mr-2" /> Import Circuit
                </button>
                <div className="border-t border-gray-200 dark:border-gray-600 my-1" />
                <button 
                  onClick={() => { onSaveBackup(); closeAllDropdowns(); }} 
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <Save className="w-4 h-4 mr-2" /> Save Backup
                </button>
                <button 
                  onClick={() => { onLoadBackup(); closeAllDropdowns(); }} 
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <FolderOpen className="w-4 h-4 mr-2" /> Load Backup
                </button>
              </div>
            )}
          </div>

          {/* View Dropdown */}
          <div className="relative dropdown-container">
            <button
              onClick={() => { closeAllDropdowns(); setViewDropdownOpen(!viewDropdownOpen); }}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300 font-medium"
              title="View Options"
            >
              <span>View</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${viewDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {viewDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-lg shadow-xl py-1 z-10 border border-gray-200 dark:border-gray-600">
                <button 
                  onClick={() => handleViewToggle(setShowBlochSphere, showBlochSphere)} 
                  className={`flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors ${showBlochSphere ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''}`}
                >
                  <Atom className="w-4 h-4 mr-2" /> Bloch Sphere
                </button>
                <button 
                  onClick={() => handleViewToggle(setShowProbability, showProbability)} 
                  className={`flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors ${showProbability ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''}`}
                >
                  <BarChart3 className="w-4 h-4 mr-2" /> Probability
                </button>
                <button 
                  onClick={() => handleViewToggle(setShowStateVector, showStateVector)} 
                  className={`flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors ${showStateVector ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''}`}
                >
                  <TrendingUp className="w-4 h-4 mr-2" /> State Vector
                </button>
                <div className="border-t border-gray-200 dark:border-gray-600 my-1" />
                <button 
                  onClick={() => handleViewToggle(setShowCodeView, showCodeView)} 
                  className={`flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors ${showCodeView ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''}`}
                >
                  {showCodeView ? <Eye className="w-4 h-4 mr-2" /> : <Code className="w-4 h-4 mr-2" />} {showCodeView ? 'Circuit View' : 'Code View'}
                </button>
              </div>
            )}
          </div>

          {/* AI Tools Dropdown */}
          <div className="relative dropdown-container">
            <button
              onClick={() => { closeAllDropdowns(); setAiDropdownOpen(!aiDropdownOpen); }}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300 font-medium"
              title="AI Tools"
            >
              <span>AI Tools</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${aiDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {aiDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-lg shadow-xl py-1 z-10 border border-gray-200 dark:border-gray-600">
                <button 
                  onClick={() => handleAIToolToggle('chat')} 
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <Bot className="w-4 h-4 mr-2" /> Quantum Chatbot
                </button>
                <button 
                  onClick={() => handleAIToolToggle('suggest')} 
                  className={`flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors ${activeBottomPanel === 'suggest' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''}`}
                >
                  <Lightbulb className="w-4 h-4 mr-2" /> Gate Suggestor
                </button>
                <button 
                  onClick={() => handleAIToolToggle('fix')} 
                  className={`flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors ${activeBottomPanel === 'fix' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''}`}
                >
                  <Wrench className="w-4 h-4 mr-2" /> Circuit Fixer
                </button>
                <div className="border-t border-gray-200 dark:border-gray-600 my-1" />
                <button 
                  onClick={() => handleAIToolToggle('transpile')} 
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <SlidersHorizontal className="w-4 h-4 mr-2" /> Quantum Transpiler
                </button>
              </div>
            )}
          </div>
          
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
          
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </header>
  );
};
