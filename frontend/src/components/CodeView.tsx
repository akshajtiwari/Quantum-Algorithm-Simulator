import React, { useState } from 'react';
import { Circuit } from '../types/quantum';
import { Copy, Check } from 'lucide-react';

interface CodeViewProps {
  circuit: Circuit;
  className?: string;
}

export const CodeView: React.FC<CodeViewProps> = ({ circuit, className = '' }) => {
  const [activeTab, setActiveTab] = useState<'qasm' | 'qiskit'>('qasm');
  const [copied, setCopied] = useState(false);

  const generateQASM = () => {
    const numQubits = Math.max(...circuit.gates.map(g => Math.max(...g.qubits)), 0) + 1;
    let qasm = `OPENQASM 2.0;\ninclude "qelib1.inc";\n\nqreg q[${numQubits}];\ncreg c[${numQubits}];\n\n`;
    
    circuit.gates.forEach(gate => {
      switch (gate.name) {
        case 'H':
          qasm += `h q[${gate.qubits[0]}];\n`;
          break;
        case 'X':
          qasm += `x q[${gate.qubits[0]}];\n`;
          break;
        case 'Y':
          qasm += `y q[${gate.qubits[0]}];\n`;
          break;
        case 'Z':
          qasm += `z q[${gate.qubits[0]}];\n`;
          break;
        case 'S':
          qasm += `s q[${gate.qubits[0]}];\n`;
          break;
        case 'T':
          qasm += `t q[${gate.qubits[0]}];\n`;
          break;
        case 'CX':
          qasm += `cx q[${gate.qubits[0]}],q[${gate.qubits[1]}];\n`;
          break;
        case 'CZ':
          qasm += `cz q[${gate.qubits[0]}],q[${gate.qubits[1]}];\n`;
          break;
        case 'SWAP':
          qasm += `swap q[${gate.qubits[0]}],q[${gate.qubits[1]}];\n`;
          break;
        case 'RX':
          qasm += `rx(${gate.parameters?.[0] || 'pi/2'}) q[${gate.qubits[0]}];\n`;
          break;
        case 'RY':
          qasm += `ry(${gate.parameters?.[0] || 'pi/2'}) q[${gate.qubits[0]}];\n`;
          break;
        case 'RZ':
          qasm += `rz(${gate.parameters?.[0] || 'pi/2'}) q[${gate.qubits[0]}];\n`;
          break;
        default:
          qasm += `// Unknown gate: ${gate.name}\n`;
      }
    });
    
    qasm += `\nmeasure q -> c;\n`;
    return qasm;
  };

  const generateQiskit = () => {
    const numQubits = Math.max(...circuit.gates.map(g => Math.max(...g.qubits)), 0) + 1;
    let qiskit = `from qiskit import QuantumCircuit, execute, Aer\nfrom qiskit.visualization import plot_histogram\nimport numpy as np\n\n`;
    qiskit += `# Create quantum circuit\nqc = QuantumCircuit(${numQubits}, ${numQubits})\n\n`;
    
    circuit.gates.forEach(gate => {
      switch (gate.name) {
        case 'H':
          qiskit += `qc.h(${gate.qubits[0]})\n`;
          break;
        case 'X':
          qiskit += `qc.x(${gate.qubits[0]})\n`;
          break;
        case 'Y':
          qiskit += `qc.y(${gate.qubits[0]})\n`;
          break;
        case 'Z':
          qiskit += `qc.z(${gate.qubits[0]})\n`;
          break;
        case 'S':
          qiskit += `qc.s(${gate.qubits[0]})\n`;
          break;
        case 'T':
          qiskit += `qc.t(${gate.qubits[0]})\n`;
          break;
        case 'CX':
          qiskit += `qc.cx(${gate.qubits[0]}, ${gate.qubits[1]})\n`;
          break;
        case 'CZ':
          qiskit += `qc.cz(${gate.qubits[0]}, ${gate.qubits[1]})\n`;
          break;
        case 'SWAP':
          qiskit += `qc.swap(${gate.qubits[0]}, ${gate.qubits[1]})\n`;
          break;
        case 'RX':
          qiskit += `qc.rx(${gate.parameters?.[0] || 'np.pi/2'}, ${gate.qubits[0]})\n`;
          break;
        case 'RY':
          qiskit += `qc.ry(${gate.parameters?.[0] || 'np.pi/2'}, ${gate.qubits[0]})\n`;
          break;
        case 'RZ':
          qiskit += `qc.rz(${gate.parameters?.[0] || 'np.pi/2'}, ${gate.qubits[0]})\n`;
          break;
        default:
          qiskit += `# Unknown gate: ${gate.name}\n`;
      }
    });
    
    qiskit += `\n# Add measurements\nqc.measure_all()\n\n`;
    qiskit += `# Execute circuit\nbackend = Aer.get_backend('qasm_simulator')\njob = execute(qc, backend, shots=1024)\nresult = job.result()\ncounts = result.get_counts(qc)\n\n`;
    qiskit += `# Display results\nprint(counts)\nplot_histogram(counts)`;
    
    return qiskit;
  };

  const handleCopy = async () => {
    const code = activeTab === 'qasm' ? generateQASM() : generateQiskit();
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`bg-white dark:bg-gray-800 ${className}`}>
      <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('qasm')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'qasm'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              QASM
            </button>
            <button
              onClick={() => setActiveTab('qiskit')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'qiskit'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              Qiskit
            </button>
          </div>
          
          <button
            onClick={handleCopy}
            className="flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span className="text-sm">{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>
      </div>
      
      <div className="p-6">
        <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-auto text-sm font-mono text-gray-800 dark:text-gray-200 max-h-96">
          <code>
            {activeTab === 'qasm' ? generateQASM() : generateQiskit()}
          </code>
        </pre>
      </div>
    </div>
  );
};