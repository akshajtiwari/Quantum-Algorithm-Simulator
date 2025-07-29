# pennylane_backend.py
import pennylane as qml
from pennylane import numpy as np
import os

def _build_pennylane_circuit(circuit_data: dict, dev: qml.Device):
    """Builds a PennyLane QNode function from the standardized circuit data."""
    num_qubits = circuit_data["qubits"]

    @qml.qnode(dev)
    def quantum_program():
        for gate_info in circuit_data["gates"]:
            gate_type = gate_info["gate"].lower()
            target_qubit = gate_info["target"]
            control_qubit = gate_info.get("control")
            controls = gate_info.get("controls")
            params = gate_info.get("params", {})

            if gate_type == "h":
                qml.Hadamard(wires=target_qubit)
            elif gate_type == "x":
                qml.PauliX(wires=target_qubit)
            elif gate_type == "y":
                qml.PauliY(wires=target_qubit)
            elif gate_type == "z":
                qml.PauliZ(wires=target_qubit)
            elif gate_type == "s":
                qml.S(wires=target_qubit)
            elif gate_type == "sdg":
                qml.Adjoint(qml.S(wires=target_qubit))
            elif gate_type == "t":
                qml.T(wires=target_qubit)
            elif gate_type == "tdg":
                qml.Adjoint(qml.T(wires=target_qubit))
            elif gate_type == "rx":
                qml.RX(params.get("theta", 0), wires=target_qubit)
            elif gate_type == "ry":
                qml.RY(params.get("theta", 0), wires=target_qubit)
            elif gate_type == "rz":
                qml.RZ(params.get("theta", 0), wires=target_qubit)
            elif gate_type == "cx":
                qml.CNOT(wires=[control_qubit, target_qubit])
            elif gate_type == "ccx":
                if controls and len(controls) == 2:
                    qml.Toffoli(wires=[controls[0], controls[1], target_qubit])
                else:
                    raise ValueError("CCX gate requires exactly 2 control qubits.")
            elif gate_type == "swap":
                qml.SWAP(wires=[target_qubit, control_qubit]) # Assuming 'control' is the second qubit for swap
            elif gate_type == "measure":
                pass 
            else:
                raise ValueError(f"Unsupported gate type for PennyLane: {gate_type}")
        
        has_measurements = any(g["gate"].lower() == "measure" for g in circuit_data["gates"])
        if has_measurements:
            return [qml.sample(wires=q) for q in range(num_qubits)]
        else:
            return qml.state()
    
    return quantum_program

def run_pennylane(circuit_data: dict, credentials: dict = None) -> dict:
    """
    Executes a quantum circuit using PennyLane's local simulators or potentially a remote QPU.

    Args:
        circuit_data (dict): A dictionary describing the quantum circuit.
                             Expected format: {"qubits": int, "gates": list}
        credentials (dict): A dictionary containing 'backend_name' (e.g., "default.qubit", "lightning.qubit")
                            and optionally PENNYLANE_API_KEY if a remote device is used.

    Returns:
        dict: Simulation results including counts, statevector, and probabilities.
    """
    backend_name = credentials.get("backend_name", "default.qubit")
    shots = credentials.get("shots", 1024)
    pennylane_api_key = credentials.get("PENNYLANE_API_KEY")

    try:
        dev = None
        if backend_name == "default.qubit":
            dev = qml.device("default.qubit", wires=circuit_data["qubits"], shots=shots)
        elif backend_name == "lightning.qubit":
            # Requires PennyLane-Lightning plugin: pip install pennylane-lightning
            dev = qml.device("lightning.qubit", wires=circuit_data["qubits"], shots=shots)
        # Add logic for other PennyLane-supported backends, including QPUs
        # For example, if using a cloud-based QPU via PennyLane plugin:
        # elif backend_name.startswith("qcs."): # Example for Quantinuum QCS
        #     if not pennylane_api_key:
        #         raise ValueError("PENNYLANE_API_KEY is required for Quantinuum QCS backend.")
        #     dev = qml.device(backend_name, wires=circuit_data["qubits"], shots=shots, api_key=pennylane_api_key)
        else:
            # For any other backend, assume it might be a remote QPU requiring a key
            if pennylane_api_key:
                try:
                    dev = qml.device(backend_name, wires=circuit_data["qubits"], shots=shots, api_key=pennylane_api_key)
                    # Attempt a simple device property check to validate
                    _ = dev.capabilities # This will often fail if connection/auth is bad
                except Exception as e:
                    raise ValueError(f"Failed to initialize PennyLane device '{backend_name}' with provided API key. Error: {e}")
            else:
                raise ValueError(f"Unsupported PennyLane backend '{backend_name}' or missing PENNYLANE_API_KEY for a remote backend.")

        if dev is None:
            raise ValueError(f"Could not initialize PennyLane device for backend: {backend_name}")

        quantum_program = _build_pennylane_circuit(circuit_data, dev)
        
        has_measurements = any(g["gate"].lower() == "measure" for g in circuit_data["gates"])

        if has_measurements:
            raw_samples = quantum_program()
            
            if isinstance(raw_samples, np.ndarray) and raw_samples.ndim == 2:
                bitstrings = ["".join(str(int(b)) for b in shot) for shot in raw_samples]
            elif isinstance(raw_samples, list) and all(isinstance(s, np.ndarray) for s in raw_samples):
                 if raw_samples and raw_samples[0].ndim == 1:
                    stacked_samples = np.array(raw_samples).T
                    bitstrings = ["".join(str(int(b)) for b in shot) for shot in stacked_samples]
                 else:
                     raise TypeError("Unexpected sample format from PennyLane.")
            else:
                 raise TypeError("Unexpected sample format from PennyLane.")

            counts = {b: bitstrings.count(b) for b in set(bitstrings)}
            
            return {
                "backend_used": f"PennyLane {backend_name} Simulator",
                "num_qubits": circuit_data["qubits"],
                "counts": counts,
                "statevector": None,
                "probabilities": None
            }
        else:
            statevector = quantum_program()
            statevector_list = statevector.tolist()
            
            probabilities = {
                format(i, f'0{circuit_data["qubits"]}b'): abs(amp)**2
                for i, amp in enumerate(statevector_list)
            }
            return {
                "backend_used": f"PennyLane {backend_name} Simulator (Statevector)",
                "num_qubits": circuit_data["qubits"],
                "counts": None,
                "statevector": statevector_list,
                "probabilities": probabilities
            }

    except ImportError:
        return {"error": f"PennyLane backend '{backend_name}' requires its corresponding plugin (e.g., pennylane-lightning for lightning.qubit). Please install it.", "backend_used": backend_name}
    except ValueError as e:
        return {"error": str(e), "backend_used": backend_name}
    except Exception as e:
        return {"error": str(e), "backend_used": backend_name}

