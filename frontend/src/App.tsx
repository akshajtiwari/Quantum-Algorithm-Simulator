import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { CircuitCanvas } from './components/CircuitCanvas';
import { InsightsPanel } from './components/InsightsPanel'; 
import { CodeView } from './components/CodeView';
import { QuantumChatbot } from './components/QuantumChatbot';
import { GateSuggestor } from './components/GateSuggestor';
import { CircuitFixer } from './components/CircuitFixer';
import { TutorialTour } from './components/TutorialTour';
import { BlochSphere } from './components/BlochSphere';
import { ProbabilityView } from './components/ProbabilityView';
import { StateVectorView } from './components/StateVectorView';
import { SimulationResults } from './components/SimulationResults';
import { BackupManager } from './components/BackupManager';
import { CustomGateCreator } from './components/CustomGateCreator'; 
import { CredentialsModal } from './components/CredentialsModal';
import { TranspilerPanel } from './components/TranspilerPanel'; // Import the new panel
import { AngleInputModal } from './components/AngleInputModal'; // Import the new AngleInputModal
import { useTheme } from './hooks/useTheme';
import { useCircuit } from './hooks/useCircuit';
import { v4 as uuidv4 } from 'uuid';
import { QuantumGate, Circuit, Backend, SimulationResult, PrebuiltAlgorithm, CustomGate } from './types/quantum';

// Define which backends are QPUs and their corresponding provider keys
// This map helps determine when to show the credentials modal
const QPU_BACKEND_INFO: { [key: string]: { provider: string; type: 'qpu' | 'simulator' } } = {
  "ibm_brisbane": { provider: "ibm", type: "qpu" },
  "ibm_osprey": { provider: "ibm", type: "qpu" },
  "aws_ionq": { provider: "ionq", type: "qpu" },
  "aws_rigetti": { provider: "rigetti", type: "qpu" },
  // "quantinuum_qpu": { provider: "quantinuum", type: "qpu" }, // Uncomment if Quantinuum is fully integrated
};

// Define available backends for the transpiler dropdown
const AVAILABLE_TRANSPILER_BACKENDS = [
  { name: "aer_qasm_simulator", label: "Aer QASM Simulator", type: "simulator" },
  { name: "aer_statevector_simulator", label: "Aer Statevector Simulator", type: "simulator" },
  // Add more specific fake backends or real QPU backends here if you set them up in app.py
  // Example for a fake QPU topology (requires `pip install qiskit-terra[visualization]`)
  // { name: "fake_lima", label: "Fake Lima (IBM Q)", type: "qpu" }, 
  // { name: "fake_manhattan", label: "Fake Manhattan (IBM Q)", type: "qpu" },
];


function App() {
  const { 
    theme, 
    toggleTheme 
  } = useTheme();
  const { 
    circuit, 
    numQubits,
    selectedGates,
    addGate, 
    removeGate, 
    clearCircuit, 
    exportCircuit, 
    importCircuit, 
    setNumQubits,
    saveBackup,
    loadBackup,
    getBackups,
    deleteBackup,
    toggleGateSelection,
    clearSelection,
    createCustomGate,
    getCustomGates,
    deleteCustomGate, // Import the new deleteCustomGate function
    updateGate 
  } = useCircuit();
  const [selectedBackend, setSelectedBackend] = useState<Backend>('local');
  const [showCodeView, setShowCodeView] = useState(false);
  const [showBlochSphere, setShowBlochSphere] = useState(false);
  const [showProbability, setShowProbability] = useState(false);
  const [showStateVector, setShowStateVector] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  // Add new state for transpiler panel
  const [showTranspilerPanel, setShowTranspilerPanel] = useState(false); 
  const [activeBottomPanel, setActiveBottomPanel] = useState<'chat' | 'suggest' | 'fix' | 'none'>('none');
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [showBackupManager, setShowBackupManager] = useState<'save' | 'load' | null>(null);
  const [showCustomGateCreator, setShowCustomGateCreator] = useState(false);
  const [customGates, setCustomGates] = useState<CustomGate[]>([]);
  // New state for credentials modal
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [qpuToConfigure, setQpuToConfigure] = useState<{ provider: string; backendName: string } | null>(null);
  // State for angle input modal
  const [showAngleInputModal, setShowAngleInputModal] = useState<QuantumGate | null>(null);


  useEffect(() => {
    // Check if tutorial has been seen in the current session
    const hasSeenTutorialInSession = sessionStorage.getItem('quantum-simulator-tutorial-seen');
    if (!hasSeenTutorialInSession) {
      setShowTutorial(true);
    }
    
    // Load custom gates
    setCustomGates(getCustomGates());
  }, []);

  const handleBackendChange = (backend: Backend) => {
    setSelectedBackend(backend);
    const backendInfo = QPU_BACKEND_INFO[backend];
    if (backendInfo && backendInfo.type === 'qpu') {
      setQpuToConfigure({ provider: backendInfo.provider, backendName: backend });
      setShowCredentialsModal(true);
    } else {
      setQpuToConfigure(null);
      setShowCredentialsModal(false);
    }
  };

  const handleSaveCredentials = async (credentials: { [key: string]: string }) => {
    if (!qpuToConfigure) return;

    try {
      const response = await fetch("http://localhost:5000/save_credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider: qpuToConfigure.provider,
          credentials: credentials,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Replaced alert with a more user-friendly message or modal in a real app
        console.log(data.message); 
      } else {
        console.error(`Error saving credentials: ${data.error}`);
      }
    } catch (error) {
      console.error("Error saving credentials:", error);
    }
    setShowCredentialsModal(false); // Always close modal after attempt
  };


const handleSimulate = async () => {
    setIsSimulating(true);

    const payload = {
      provider: selectedBackend,
      circuit: {
        qubits: numQubits,
        // This mapping creates the generic payload structure for gates
        gates: circuit.gates.map((gate: QuantumGate) => {
          const gatePayload: {
            gate: string;
            target?: number;
            control?: number;
            controls?: number[];
            params?: { theta: number }; // For parameterized gates
          } = {
            gate: gate.name,
          };

          // Ensure gate.qubits is an array; default to empty if not present
          const gateQubits = Array.isArray(gate.qubits) ? gate.qubits : [];

          // Determine the payload structure based on the gate type
          switch (gate.name.toLowerCase()) {
            case 'h':
            case 'x':
            case 'y':
            case 'z':
            case 's':
            case 'sdg':
            case 't':
            case 'tdg':
            case 'measure':
              // Single qubit gates
              if (gateQubits.length > 0) {
                gatePayload.target = gateQubits[0];
              } else {
                console.warn(`Gate "${gate.name}" missing target qubit.`, gate);
              }
              break;
            case 'rx':
            case 'ry':
            case 'rz':
              // Parameterized single qubit gates
              if (gateQubits.length > 0) {
                gatePayload.target = gateQubits[0];
                // Assuming `QuantumGate` has a `params` property for angles
                if (gate.params && typeof gate.params.theta === 'number') {
                  gatePayload.params = { theta: gate.params.theta };
                } else if (gate.parameters && typeof gate.parameters[0] === 'number') { // Fallback for 'parameters' array
                    gatePayload.params = { theta: gate.parameters[0] };
                }
              } else {
                console.warn(`Parameterized gate "${gate.name}" missing target qubit.`, gate);
              }
              break;
            case 'cx': // Controlled-X (CNOT)
            case 'cy': // Controlled-Y
            case 'cz': // Controlled-Z
              // Two-qubit controlled gates (one control, one target)
              if (gateQubits.length === 2) {
                gatePayload.control = gateQubits[0];
                gatePayload.target = gateQubits[1];
              } else {
                console.warn(`Gate "${gate.name}" expects 2 qubits (control, target), but received ${gateQubits.length}.`, gate);
              }
              break;
            case 'ccx': // Controlled-Controlled-X (Toffoli)
              // Three-qubit controlled gates (two controls, one target)
              if (gateQubits.length === 3) {
                gatePayload.controls = [gateQubits[0], gateQubits[1]];
                gatePayload.target = gateQubits[2];
              } else {
                console.warn(`Gate "${gate.name}" expects 3 qubits (controls, target), but received ${gateQubits.length}.`, gate);
              }
              break;
            case 'swap': // SWAP gate
              // Two-qubit symmetric gates. Mapping to target/control can vary by backend,
              // but this is a common interpretation (e.g., Qiskit's `swap(q1, q2)`)
              if (gateQubits.length === 2) {
                gatePayload.target = gateQubits[0];
                gatePayload.control = gateQubits[1]; // Using 'control' for the second qubit in SWAP for consistency
              } else {
                console.warn(`SWAP gate expects 2 qubits, but received ${gateQubits.length}.`, gate);
              }
              break;
            // Add other gate types here if your circuit supports them
            default:
              // For any other gate, if it has a single qubit, assume it's a target
              if (gateQubits.length === 1) {
                gatePayload.target = gateQubits[0];
              } else if (gateQubits.length > 1) {
                // If it's a multi-qubit gate not explicitly handled,
                // you might need to add a generic 'qubits' array here
                // gatePayload.qubits = gateQubits; // This would require backend support
                console.warn(`Unhandled multi-qubit gate type "${gate.name}". Consider adding specific payload logic.`, gate);
              } else {
                console.warn(`Unhandled gate type "${gate.name}" with no qubits specified.`, gate);
              }
              break;
          }
          return gatePayload;
        }),
      },
      use_simulator_if_qpu_fails: true,
      simulator_choice: "aer_qasm_simulator", // Default to Aer QASM simulator
      shots: 1024,
    };

    // Special handling for IBM backends, as they expect QASM string
    // This alert should ideally be replaced with a proper QASM conversion or a different approach
    // if IBM QPU support is desired with structured circuits.
    if (selectedBackend.startsWith('ibm_')) {
        alert("IBM backends currently require QASM string. This functionality is not directly supported by the current structured payload.");
        setIsSimulating(false);
        return; 
    }

    try {
      const response = await fetch("http://localhost:5000/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        const result: SimulationResult = {
          counts: data.counts,
          executionTime: data.executionTime || 0,
          shots: data.shots || 1024,
          // Use the 'backend_used' from the server response, which will be 'FALLBACK:...' if applicable
          backend: data.backend_used, 
          timestamp: Date.now(),
          // Pass along original_backend_attempted and fallback_reason if they exist
          original_backend_attempted: data.original_backend_attempted || undefined,
          fallback_reason: data.fallback_reason || undefined,
        };

        setSimulationResult(result);
      } else {
        // If the server returns an error, display it
        alert(`Error from backend: ${data.error}`);
      }
    } catch (error) {
      console.error("Simulation error:", error);
      alert("Failed to connect to backend.");
    }

    setIsSimulating(false);
  };


  const toggleBottomPanel = (panel: 'chat' | 'suggest' | 'fix') => {
    setActiveBottomPanel(activeBottomPanel === panel ? 'none' : panel);
  };

  // New handler for transpiler panel
  const toggleTranspilerPanel = () => {
    setShowTranspilerPanel(!showTranspilerPanel);
  };

  // Corrected handleAlgorithmSelect to directly use the passed circuit object
  const handleAlgorithmSelect = (algorithmCircuit: PrebuiltAlgorithm['circuit']) => {
    clearCircuit(); // Clear the circuit first
    // Set the number of qubits for the circuit based on the algorithm's requirement
    setNumQubits(algorithmCircuit.qubits); 
    algorithmCircuit.gates.forEach(gate => addGate(gate));
  };

  const handleCustomGateSelect = (customGate: CustomGate) => {
  customGate.gates.forEach(gate => addGate({ 
    ...gate, 
    id: uuidv4() 
  }));
};

  const handleCreateCustomGate = () => {
    setShowCustomGateCreator(true);
  };

  const handleCustomGateCreated = (name: string, initial: string, description: string) => {
    // Pass selectedGates directly to createCustomGate from useCircuit
    const newCustomGate = createCustomGate(name, initial, description, selectedGates);
    if (newCustomGate) {
      setCustomGates(getCustomGates());
      clearSelection(); // Clear selection after creating custom gate
    }
    setShowCustomGateCreator(false); // Close the modal
  };

  // New handler for deleting a custom gate
  const handleDeleteCustomGate = (gateId: string) => {
    deleteCustomGate(gateId);
    setCustomGates(getCustomGates()); // Refresh the list of custom gates
  };

  const handleGateAddedToCanvas = (gate: QuantumGate) => {
    addGate(gate);
    // If it's a rotation gate, show the angle input modal
    if (['RX', 'RY', 'RZ', 'U3'].includes(gate.name.toUpperCase())) {
      setShowAngleInputModal(gate);
    }
  };

  const handleAngleUpdate = (gateId: string, angle: number) => {
    updateGate(gateId, { params: { theta: angle } });
    setShowAngleInputModal(null); // Close modal after update
  };

  // Modified handleGateClickOnCanvas to retrieve the full gate object
  const handleGateClickOnCanvas = (gateId: string) => {
    // Find the actual gate object from the circuit state
    const clickedGate = circuit.gates.find(g => g.id === gateId);
    
    if (!clickedGate) {
      console.warn(`Gate with ID ${gateId} not found in circuit. Cannot perform click actions.`);
      return; // Exit if the gate is not found
    }

    toggleGateSelection(clickedGate.id); // Toggle selection using the found gate's ID
    
    // Now, safely access clickedGate.name
    if (['RX', 'RY', 'RZ', 'U3'].includes(clickedGate.name.toUpperCase())) {
      setShowAngleInputModal(clickedGate); // Pass the full gate object to the modal
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <div className="flex flex-col h-screen">
          <Header 
            theme={theme}
            toggleTheme={toggleTheme}
            onSimulate={handleSimulate}
            isSimulating={isSimulating}
            selectedBackend={selectedBackend}
            setSelectedBackend={handleBackendChange}
            showCodeView={showCodeView}
            setShowCodeView={setShowCodeView}
            showBlochSphere={showBlochSphere}
            setShowBlochSphere={setShowBlochSphere}
            showProbability={showProbability}
            setShowProbability={setShowProbability}
            showStateVector={showStateVector}
            setShowStateVector={setShowStateVector}
            onExport={exportCircuit}
            onImport={importCircuit}
            onClear={clearCircuit}
            onSaveBackup={() => setShowBackupManager('save')}
            onLoadBackup={() => setShowBackupManager('load')}
            numQubits={numQubits}
            onNumQubitsChange={setNumQubits}
            activeBottomPanel={activeBottomPanel}
            onToggleBottomPanel={toggleBottomPanel}
            onToggleTranspilerPanel={toggleTranspilerPanel}
          />
          
          <div className="flex flex-1 overflow-hidden">
            <div className="w-56 flex-shrink-0 border-r border-gray-200 dark:border-gray-700">
              <Sidebar 
                onGateSelect={handleGateAddedToCanvas} 
                onApplyAlgorithm={handleAlgorithmSelect} 
                onCustomGateSelect={handleCustomGateSelect}
                onDeleteCustomGate={handleDeleteCustomGate} // Pass the new delete handler
                customGates={customGates}
                className="h-full"
              />
            </div>
            
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex flex-1 overflow-hidden">
                <main className="flex-1 overflow-hidden">
                  {showStateVector ? (
                    <StateVectorView circuit={circuit} numQubits={numQubits} />
                  ) : showProbability ? (
                    <ProbabilityView circuit={circuit} numQubits={numQubits} />
                  ) : showBlochSphere ? (
                    <BlochSphere circuit={circuit} numQubits={numQubits} />
                  ) : (
                    <CircuitCanvas 
                      circuit={circuit}
                      onGateRemove={removeGate}
                      onGateAdd={handleGateAddedToCanvas} 
                      selectedGates={selectedGates}
                      onGateToggleSelection={handleGateClickOnCanvas} 
                      onCreateCustomGate={handleCreateCustomGate}
                      numQubits={numQubits}
                      className="h-full"
                    />
                  )}
                </main>
                
                <div className="w-64 flex-shrink-0 border-l border-gray-200 dark:border-gray-700">
                  <InsightsPanel 
                    circuit={circuit}
                    className="h-full"
                  />
                </div>
              </div>
              
              {/* Bottom AI Panels */}
              {activeBottomPanel !== 'none' && (
                <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800" style={{ height: '250px' }}>
                  {activeBottomPanel === 'chat' && (
                    <QuantumChatbot 
                      circuit={circuit}
                      onClose={() => setActiveBottomPanel('none')}
                    />
                  )}
                  {activeBottomPanel === 'suggest' && (
                    <GateSuggestor 
                      circuit={circuit}
                      onGateAdd={addGate}
                      numQubits={numQubits}
                      onClose={() => setActiveBottomPanel('none')}
                    />
                  )}
                  {activeBottomPanel === 'fix' && (
                    <CircuitFixer 
                      circuit={circuit}
                      onGateRemove={removeGate}
                      onClose={() => setActiveBottomPanel('none')}
                    />
                  )}
                </div>
              )}

              {/* Transpiler Panel Modal */}
              {showTranspilerPanel && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 h-[80vh] flex flex-col">
                    <TranspilerPanel
                      circuit={circuit}
                      numQubits={numQubits}
                      availableBackends={AVAILABLE_TRANSPILER_BACKENDS}
                      onClose={() => setShowTranspilerPanel(false)}
                      // onApplyTranspiledCircuit={handleApplyTranspiledCircuit} // Uncomment if implemented
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      
      {/* Modals */}
      {showTutorial && (
        <TutorialTour onComplete={() => setShowTutorial(false)} />
      )}
      
      {simulationResult && (
        <SimulationResults 
          result={simulationResult}
          onClose={() => setSimulationResult(null)}
        />
      )}
      
      {showBackupManager && (
        <BackupManager
          mode={showBackupManager}
          onSave={saveBackup}
          onLoad={loadBackup}
          onDelete={deleteBackup}
          getBackups={getBackups}
          onClose={() => setShowBackupManager(null)}
        />
      )}
      
      {showCustomGateCreator && (
        <CustomGateCreator
          selectedGatesCount={selectedGates.length}
          onCreateGate={handleCustomGateCreated}
          onClose={() => setShowCustomGateCreator(false)}
        />
      )}

      {/* Credentials Modal */}
      {showCredentialsModal && qpuToConfigure && (
        <CredentialsModal
          provider={qpuToConfigure.provider}
          backendName={qpuToConfigure.backendName}
          onSave={handleSaveCredentials}
          onClose={() => setShowCredentialsModal(false)}
        />
      )}

      {/* Angle Input Modal */}
      {showAngleInputModal && (
        <AngleInputModal
          gate={showAngleInputModal}
          onSave={handleAngleUpdate}
          onClose={() => setShowAngleInputModal(null)}
        />
      )}
    </div>
  );
}

export default App;
