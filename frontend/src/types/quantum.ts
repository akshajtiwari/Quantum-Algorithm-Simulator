export interface QuantumGate {
  id: string;
  name: string;
  qubits: number[];
  parameters?: number[];
  position?: number;
}

export interface Circuit {
  gates: QuantumGate[];
  measurements: { qubit: number; bit: number }[];
}

export type Backend =
  | 'ibm_qasm_simulator'
  | 'ibm_brisbane'
  | 'ibm_osprey'
  | 'aws_ionq'
  | 'aws_sv1'
  | 'aws_local'
  | 'aws_rigetti'
  | 'google_cirq'
  | 'pennylane_default'
  | 'pennylane_lightning'
  | 'aer_qasm_simulator'
  | 'aer_statevector_simulator';


export interface QuantumState {
  amplitudes: Complex[];
  numQubits: number;
}

export interface Complex {
  real: number;
  imag: number;
}

export interface SimulationResult {
  counts: { [key: string]: number };
  statevector?: QuantumState;
  executionTime: number;
  shots: number;
  backend: Backend;
  timestamp: number;
}

export interface CircuitBackup {
  id: string;
  name: string;
  circuit: Circuit;
  timestamp: number;
  description?: string;
}

export interface CustomGate {
  id: string;
  name: string;
  initial: string;
  description: string;
  gates: QuantumGate[];
  numQubits: number;
  timestamp: number;
}

export interface PrebuiltAlgorithm {
  id: string;
  name: string;
  description: string;
  circuit: Circuit;
  category: string;
}