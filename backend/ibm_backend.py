# ibm_backend.py
import os
from dotenv import load_dotenv
from qiskit import QuantumCircuit, transpile
from qiskit_ibm_runtime import QiskitRuntimeService
# Corrected import paths for exceptions
from qiskit_ibm_provider.exceptions import IBMProviderError
from qiskit_ibm_runtime.exceptions import IBMRuntimeError


load_dotenv()

def run_ibm(circuit_data: dict, credentials: dict) -> dict:
    """
    Executes a QASM circuit on an IBM Quantum backend via Qiskit IBM Runtime.

    Args:
        circuit_data (dict): A dictionary describing the quantum circuit.
                             Expected format: {"qubits": int, "gates": list}
        credentials (dict): A dictionary containing IBMQ_TOKEN, backend_name, and shots.

    Returns:
        dict: The measurement counts from the quantum circuit execution or an error.
    """
    token = credentials.get("IBMQ_TOKEN")
    backend_name = credentials.get("backend_name", "ibm_qasm_simulator") # Default to simulator if not specified
    shots = credentials.get("shots", 1024)

    try:
        if not token:
            raise ValueError("IBMQ_TOKEN is missing. Please provide your IBM Quantum Experience Token.")

        # Initialize QiskitRuntimeService
        # This will attempt to authenticate with the provided token
        service = QiskitRuntimeService(token=token)

        # Attempt to get the specified backend to verify credentials and connectivity
        try:
            backend = service.get_backend(backend_name)
        except IBMProviderError as e: # Use IBMProviderError for issues related to provider/backend access
            raise ValueError(f"Could not find or connect to IBM backend '{backend_name}'. Error: {e}. Please check backend name and your IBMQ_TOKEN.")
        except IBMRuntimeError as e: # Use IBMRuntimeError for runtime-specific issues
            raise ValueError(f"IBM Runtime service error: {e}. Please check your IBMQ_TOKEN and network connectivity.")
        except Exception as e:
            raise ValueError(f"Failed to connect to IBM Quantum service: {e}")

        # Create a quantum circuit from the structured circuit_data
        circuit = QuantumCircuit(circuit_data["qubits"])
        for gate_info in circuit_data["gates"]:
            gate_type = gate_info["gate"].lower()
            target = gate_info.get("target")
            control = gate_info.get("control")
            controls = gate_info.get("controls")
            params = gate_info.get("params", {})

            if gate_type == "h":
                circuit.h(target)
            elif gate_type == "x":
                circuit.x(target)
            elif gate_type == "y":
                circuit.y(target)
            elif gate_type == "z":
                circuit.z(target)
            elif gate_type == "s":
                circuit.s(target)
            elif gate_type == "sdg":
                circuit.sdg(target)
            elif gate_type == "t":
                circuit.t(target)
            elif gate_type == "tdg":
                circuit.tdg(target)
            elif gate_type == "rx":
                circuit.rx(params.get("theta", 0), target)
            elif gate_type == "ry":
                circuit.ry(params.get("theta", 0), target)
            elif gate_type == "rz":
                circuit.rz(params.get("theta", 0), target)
            elif gate_type == "cx":
                circuit.cx(control, target)
            elif gate_type == "ccx":
                if controls and len(controls) == 2:
                    circuit.ccx(controls[0], controls[1], target)
                else:
                    raise ValueError("CCX gate requires exactly 2 control qubits.")
            elif gate_type == "swap":
                circuit.swap(target, control) # Assuming 'control' is the second qubit for swap
            elif gate_type == "measure":
                # Add classical bits for measurement if not already present
                if circuit.num_clbits < circuit.num_qubits:
                    circuit.add_register(QuantumCircuit.ClassicalRegister(circuit.num_qubits - circuit.num_clbits))
                circuit.measure(target, target) # Measure target qubit to its corresponding classical bit
            else:
                print(f"Warning: Unknown gate type {gate_type} for IBM. Skipping.")

        # Transpile the circuit for the backend
        transpiled_circuit = transpile(circuit, backend)

        # Use the Sampler primitive for getting measurement outcomes/counts
        from qiskit_ibm_runtime import Sampler
        sampler = Sampler(backend=backend)
        job = sampler.run(transpiled_circuit, shots=shots)

        # Get results
        result = job.result()

        # Sampler provides quasi_distributions. Convert to counts format for consistency.
        quasi_dists = result.quasi_dists[0]
        counts = {format(i, '0' + str(circuit.num_qubits) + 'b'): int(prob * shots)
                  for i, prob in quasi_dists.binary_probabilities().items()}

        return {
            "backend_used": backend_name,
            "num_qubits": circuit_data["qubits"],
            "counts": counts,
            "statevector": None, # IBM QPUs typically don't return statevector
            "probabilities": None # Probabilities are derived from counts
        }

    except ValueError as e:
        # Specific validation errors (e.g., missing token, connection issues)
        return {"error": str(e), "backend_used": backend_name}
    except Exception as e:
        # Catch any other unexpected errors during execution
        print(f"Error running on IBM Quantum backend: {e}")
        return {"error": str(e), "backend_used": backend_name}
