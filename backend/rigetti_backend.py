# rigetti_backend.py
from braket.devices import LocalSimulator
from braket.aws import AwsDevice
from braket.circuits import Circuit, Gate, Instruction, ResultType
import numpy as np
import os

def _build_braket_circuit_rigetti(circuit_data: dict) -> Circuit:
    """
    Builds an Amazon Braket Circuit from the standardized circuit data,
    specifically tailored for Rigetti compatibility through Braket.
    Rigetti backends often prefer native gates. Braket handles some translation.
    """
    num_qubits = circuit_data["qubits"]
    circuit = Circuit()

    for gate_info in circuit_data["gates"]:
        gate_type = gate_info["gate"].lower()
        target = gate_info["target"]
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
            circuit.rx(target, params.get("theta", 0))
        elif gate_type == "ry":
            circuit.ry(target, params.get("theta", 0))
        elif gate_type == "rz":
            circuit.rz(target, params.get("theta", 0))
        elif gate_type == "cx":
            circuit.cnot(control, target)
        elif gate_type == "ccx":
            if controls and len(controls) == 2:
                circuit.ccnot(controls[0], controls[1], target)
            else:
                raise ValueError("CCX gate requires exactly 2 control qubits.")
        elif gate_type == "swap":
            circuit.swap(target, control)
        elif gate_type == "measure":
            pass # Measurement for counts is handled by results, not by adding a gate
        else:
            raise ValueError(f"Unsupported gate type for Rigetti (Braket): {gate_type}")
    return circuit

def run_rigetti(circuit_data: dict, credentials: dict = None) -> dict:
    """
    Executes a quantum circuit on a Rigetti QPU via AWS Braket or a local Braket simulator.

    Args:
        circuit_data (dict): A dictionary describing the quantum circuit.
                             Expected format: {"qubits": int, "gates": list}
        credentials (dict): A dictionary containing AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY,
                            AWS_REGION, and optionally 'backend_name'.

    Returns:
        dict: Simulation results including counts, statevector (if applicable),
              probabilities (if applicable), and backend used.
    """
    aws_access_key_id = credentials.get("AWS_ACCESS_KEY_ID")
    aws_secret_access_key = credentials.get("AWS_SECRET_ACCESS_KEY")
    aws_region = credentials.get("AWS_REGION")
    backend_name = credentials.get("backend_name") # e.g., "rigetti/qpu", "local"
    shots = credentials.get("shots", 1024)

    if not backend_name:
        raise ValueError("Rigetti backend name (e.g., 'rigetti/qpu' or 'local') not specified.")

    try:
        circuit = _build_braket_circuit_rigetti(circuit_data)

        if backend_name == "local":
            device = LocalSimulator()
            task = device.run(circuit, shots=shots)
            result = task.result()
            counts = result.measurement_counts
            return {
                "backend_used": "AWS Braket Local Simulator (Rigetti context)",
                "num_qubits": circuit_data["qubits"],
                "counts": counts,
                "statevector": None,
                "probabilities": None
            }
        elif backend_name == "rigetti/qpu": # Use a generic name for the frontend
            if not (aws_access_key_id and aws_secret_access_key and aws_region):
                raise ValueError("AWS credentials (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION) are required for Rigetti QPU.")
            
            # --- Actual Validation Step (Implicit via AwsDevice initialization) ---
            try:
                # Rigetti QPU ARNs are specific to region and device name
                # Example: "arn:aws:braket:us-west-1::device/qpu/rigetti/Aspen-M-3"
                # You might need a more dynamic way to get the exact ARN or map it from a simpler name
                rigetti_qpu_arn = f"arn:aws:braket:{aws_region}::device/qpu/rigetti/Aspen-M-3" # Placeholder
                device = AwsDevice(rigetti_qpu_arn)
                # Further validation: device.properties or device.status
            except Exception as e:
                raise ValueError(f"AWS Braket connection or Rigetti QPU access failed. Please check your AWS credentials, region, and QPU ARN. Error: {e}")
            # --- End Validation Step ---

            try:
                task = device.run(circuit, shots=shots)
                result = task.result()
                counts = result.measurement_counts
                return {
                    "backend_used": f"Rigetti QPU (via AWS Braket): {rigetti_qpu_arn}",
                    "num_qubits": circuit_data["qubits"],
                    "counts": counts,
                    "statevector": None,
                    "probabilities": None
                }
            except Exception as e:
                raise RuntimeError(f"Failed to execute circuit on Rigetti QPU: {e}")
        else:
            raise ValueError(f"Unsupported Rigetti backend: {backend_name}")

    except ValueError as e:
        # Specific validation errors (e.g., missing credentials, connection issues)
        return {"error": str(e), "backend_used": backend_name or "N/A"}
    except Exception as e:
        return {"error": str(e), "backend_used": backend_name or "N/A"}

