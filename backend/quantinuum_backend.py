# quantinuum_backend.py
from azure.quantum.qiskit import AzureQuantumProvider
from qiskit import QuantumCircuit, transpile
import qiskit_aer

# pip install azure-quantum qiskit qiskit-aer

def _build_qiskit_circuit_quantinuum(circuit_data: dict) -> QuantumCircuit:
    """Builds a Qiskit QuantumCircuit from the standardized circuit data."""
    num_qubits = circuit_data["qubits"]
    circuit = QuantumCircuit(num_qubits, num_qubits) # Classical bits for measurement

    for gate_info in circuit_data["gates"]:
        gate_type = gate_info["gate"].lower()

        if gate_type == "h":
            circuit.h(gate_info["target"])
        elif gate_type == "x":
            circuit.x(gate_info["target"])
        elif gate_type == "y":
            circuit.y(gate_info["target"])
        elif gate_type == "z":
            circuit.z(gate_info["target"])
        elif gate_type == "s":
            circuit.s(gate_info["target"])
        elif gate_type == "sdg":
            circuit.sdg(gate_info["target"])
        elif gate_type == "t":
            circuit.t(gate_info["target"])
        elif gate_type == "tdg":
            circuit.tdg(gate_info["target"])
        elif gate_type == "rx":
            circuit.rx(gate_info["params"]["theta"], gate_info["target"])
        elif gate_type == "ry":
            circuit.ry(gate_info["params"]["theta"], gate_info["target"])
        elif gate_type == "rz":
            circuit.rz(gate_info["params"]["theta"], gate_info["target"])
        elif gate_type == "cx":
            circuit.cx(gate_info["control"], gate_info["target"])
        elif gate_type == "ccx":
            controls = gate_info["controls"]
            if len(controls) == 2:
                circuit.ccx(controls[0], controls[1], gate_info["target"])
            else:
                raise ValueError(f"CCX gate requires exactly 2 control qubits, got {len(controls)}")
        elif gate_type == "swap":
            circuit.swap(gate_info["target"], gate_info["control"])
        elif gate_type == "measure":
            circuit.measure(gate_info["target"], gate_info["target"])
        else:
            raise ValueError(f"Unsupported gate type for Quantinuum (Azure Quantum): {gate_type}")
    return circuit

def run_quantinuum(circuit_data: dict, credentials: dict = None) -> dict:
    """
    Executes a quantum circuit on a Quantinuum QPU via Azure Quantum.

    Args:
        circuit_data (dict): A dictionary describing the quantum circuit.
                             Expected format: {"qubits": int, "gates": list}
        credentials (dict): A dictionary containing Azure Quantum workspace details:
                            AZURE_QUANTUM_SUBSCRIPTION_ID, AZURE_QUANTUM_RESOURCE_GROUP,
                            AZURE_QUANTUM_WORKSPACE_NAME, AZURE_QUANTUM_LOCATION,
                            and 'backend_name'.

    Returns:
        dict: Simulation results including counts, statevector (if applicable),
              probabilities (if applicable), and backend used.
    """
    sub_id = credentials.get("AZURE_QUANTUM_SUBSCRIPTION_ID")
    resource_group = credentials.get("AZURE_QUANTUM_RESOURCE_GROUP")
    workspace_name = credentials.get("AZURE_QUANTUM_WORKSPACE_NAME")
    location = credentials.get("AZURE_QUANTUM_LOCATION")
    backend_name = credentials.get("backend_name") # e.g., "quantinuum.sim.h1-1sc", "quantinuum.qpu.h1"
    shots = credentials.get("shots", 1024)

    if not backend_name:
        raise ValueError("Quantinuum backend name (e.g., 'quantinuum.sim.h1-1sc' or 'quantinuum.qpu.h1') not specified.")

    try:
        circuit = _build_qiskit_circuit_quantinuum(circuit_data)

        if backend_name.startswith("quantinuum.sim"): # Quantinuum simulators via Azure
            if not (sub_id and resource_group and workspace_name and location):
                raise ValueError("Azure Quantum workspace credentials are required for Quantinuum simulators on Azure.")
            try:
                provider = AzureQuantumProvider(
                    resource_id=f"/subscriptions/{sub_id}/resourceGroups/{resource_group}/providers/Microsoft.Quantum/Workspaces/{workspace_name}",
                    location=location
                )
                backend = provider.get_backend(backend_name)
            except Exception as e:
                raise ValueError(f"Failed to connect to Azure Quantum workspace or backend '{backend_name}': {e}. Check Azure credentials and backend name.")
            
            job = backend.run(circuit, shots=shots)
            result = job.result()
            counts = result.get_counts(circuit)
            return {
                "backend_used": f"Quantinuum Simulator (Azure Quantum): {backend_name}",
                "num_qubits": circuit_data["qubits"],
                "counts": counts,
                "statevector": None,
                "probabilities": None
            }

        elif backend_name.startswith("quantinuum.qpu"): # Quantinuum QPU via Azure
            if not (sub_id and resource_group and workspace_name and location):
                raise ValueError("Azure Quantum workspace credentials are required for Quantinuum QPU.")
            try:
                provider = AzureQuantumProvider(
                    resource_id=f"/subscriptions/{sub_id}/resourceGroups/{resource_group}/providers/Microsoft.Quantum/Workspaces/{workspace_name}",
                    location=location
                )
                backend = provider.get_backend(backend_name)
            except Exception as e:
                raise ValueError(f"Failed to connect to Azure Quantum workspace or backend '{backend_name}': {e}. Check Azure credentials and backend name.")
            
            job = backend.run(circuit, shots=shots)
            result = job.result()
            counts = result.get_counts(circuit)
            return {
                "backend_used": f"Quantinuum QPU (Azure Quantum): {backend_name}",
                "num_qubits": circuit_data["qubits"],
                "counts": counts,
                "statevector": None,
                "probabilities": None
            }
        else:
            raise ValueError(f"Unsupported Quantinuum backend: {backend_name}")

    except Exception as e:
        return {"error": str(e), "backend_used": backend_name or "N/A"}