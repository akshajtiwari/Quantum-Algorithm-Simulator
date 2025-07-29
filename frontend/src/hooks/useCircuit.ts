import { useState, useCallback } from 'react';
import { Circuit, QuantumGate, CircuitBackup, CustomGate } from '../types/quantum';
import { v4 as uuidv4 } from 'uuid'; // Ensure uuidv4 is imported if used for new gate IDs

export const useCircuit = () => {
  const [circuit, setCircuit] = useState<Circuit>({
    gates: [],
    measurements: []
  });
  const [numQubits, setNumQubitsState] = useState(4);
  // Changed selectedGates type from string[] to QuantumGate[]
  const [selectedGates, setSelectedGates] = useState<QuantumGate[]>([]); 

  const addGate = useCallback((gate: QuantumGate) => {
    setCircuit(prev => ({
      ...prev,
      // Ensure a unique ID is assigned here, even if the incoming gate already has one
      // This helps when adding pre-defined gates or custom gate sub-gates
      gates: [...prev.gates, { ...gate, id: uuidv4() }] 
    }));
  }, []);

  const removeGate = useCallback((gateId: string) => {
    setCircuit(prev => ({
      ...prev,
      gates: prev.gates.filter(gate => gate.id !== gateId)
    }));
  }, []);

  const clearCircuit = useCallback(() => {
    setCircuit({
      gates: [],
      measurements: []
    });
  }, []);

  const setNumQubits = useCallback((newNumQubits: number) => {
    setNumQubitsState(newNumQubits);
    // Remove gates that reference qubits beyond the new limit
    setCircuit(prev => ({
      ...prev,
      gates: prev.gates.filter(gate => 
        gate.qubits.every(qubit => qubit < newNumQubits)
      )
    }));
  }, []);

  const exportCircuit = useCallback(() => {
    const dataStr = JSON.stringify(circuit, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `quantum-circuit-${Date.now()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }, [circuit]);

  const importCircuit = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const importedCircuit = JSON.parse(e.target?.result as string);
            setCircuit(importedCircuit);
          } catch (error) {
            console.error('Error importing circuit:', error);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }, []);

  const saveBackup = useCallback((name: string, description?: string) => {
    const backup: CircuitBackup = {
      id: Date.now().toString(),
      name,
      circuit: { ...circuit },
      timestamp: Date.now(),
      description
    };
    
    const existingBackups = JSON.parse(localStorage.getItem('quantum-circuit-backups') || '[]');
    existingBackups.push(backup);
    localStorage.setItem('quantum-circuit-backups', JSON.stringify(existingBackups));
    
    return backup;
  }, [circuit]);

  const loadBackup = useCallback((backupId: string) => {
    const backups = JSON.parse(localStorage.getItem('quantum-circuit-backups') || '[]');
    const backup = backups.find((b: CircuitBackup) => b.id === backupId);
    if (backup) {
      setCircuit(backup.circuit);
    }
  }, []);

  const getBackups = useCallback((): CircuitBackup[] => {
    return JSON.parse(localStorage.getItem('quantum-circuit-backups') || '[]');
  }, []);

  const deleteBackup = useCallback((backupId: string) => {
    const backups = JSON.parse(localStorage.getItem('quantum-circuit-backups') || '[]');
    const filteredBackups = backups.filter((b: CircuitBackup) => b.id !== backupId);
    localStorage.setItem('quantum-circuit-backups', JSON.stringify(filteredBackups));
  }, []);

  // Modified toggleGateSelection to work with QuantumGate[]
  const toggleGateSelection = useCallback((gateId: string) => {
    setSelectedGates(prevSelected => {
      const gateToToggle = circuit.gates.find(g => g.id === gateId);
      if (!gateToToggle) return prevSelected; // Gate not found

      if (prevSelected.some(g => g.id === gateId)) {
        // Deselect the gate
        return prevSelected.filter(g => g.id !== gateId);
      } else {
        // Select the gate
        return [...prevSelected, gateToToggle];
      }
    });
  }, [circuit.gates]); // Dependency on circuit.gates to find the gate object

  const clearSelection = useCallback(() => {
    setSelectedGates([]);
  }, []);

  // Modified createCustomGate to accept gatesToCombine as QuantumGate[]
  const createCustomGate = useCallback((name: string, initial: string, description: string, gatesToCombine: QuantumGate[]) => {
    if (gatesToCombine.length === 0) {
      console.warn("Cannot create custom gate with no selected gates.");
      return null;
    }

    const customGate: CustomGate = {
      id: uuidv4(), // Use uuidv4 for new custom gate ID
      name,
      initial,
      description,
      // Ensure each gate within the custom gate gets a new unique ID
      gates: gatesToCombine.map(gate => ({ ...gate, id: uuidv4() })), 
      // Calculate numQubits based on the highest qubit index used + 1
      numQubits: Math.max(...gatesToCombine.flatMap(g => g.qubits || [0])) + 1, 
      timestamp: Date.now()
    };

    const existingCustomGates = JSON.parse(localStorage.getItem('quantum-custom-gates') || '[]');
    existingCustomGates.push(customGate);
    localStorage.setItem('quantum-custom-gates', JSON.stringify(existingCustomGates));

    setSelectedGates([]); // Clear selection after creating custom gate
    return customGate;
  }, []); // Dependencies updated

  const getCustomGates = useCallback((): CustomGate[] => {
    return JSON.parse(localStorage.getItem('quantum-custom-gates') || '[]');
  }, []);

  // NEW: updateGate function
  const updateGate = useCallback((gateId: string, updates: Partial<QuantumGate>) => {
    setCircuit(prevCircuit => ({
      ...prevCircuit,
      gates: prevCircuit.gates.map(gate =>
        gate.id === gateId
          ? {
              ...gate,
              ...updates,
              // Special handling for 'params' to merge objects
              params: updates.params ? { ...gate.params, ...updates.params } : gate.params,
            }
          : gate
      ),
    }));
  }, []);


  return {
    circuit,
    numQubits,
    selectedGates,
    addGate,
    removeGate,
    clearCircuit,
    setNumQubits,
    exportCircuit,
    importCircuit,
    saveBackup,
    loadBackup,
    getBackups,
    deleteBackup,
    toggleGateSelection,
    clearSelection,
    createCustomGate,
    getCustomGates,
    updateGate // IMPORTANT: Make sure updateGate is returned here
  };
};
