# ionq_backend.py
from braket.devices import LocalSimulator
from braket.aws import AwsDevice
from braket.circuits import Circuit, Gate, Instruction, ResultType
import os

def _build_braket_circuit(circuit_data: dict) -> Circuit:
    """Builds an Amazon Braket Circuit from the standardized circuit data."""
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
            circuit.swap(target, control) # Frontend uses target/control, Braket swap is q1, q2
        elif gate_type == "measure":
            # Braket measurements are typically implicit or handled at the end of execution for counts
            pass # Measurement for counts is handled by results, not by adding a gate
        else:
            raise ValueError(f"Unsupported gate type for IonQ (Braket): {gate_type}")
    return circuit

def run_ionq(circuit_data: dict, credentials: dict = None) -> dict:
    """
    Executes a quantum circuit on an IonQ QPU via AWS Braket or a local Braket simulator.

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
    backend_name = credentials.get("backend_name") # e.g., "ionq/qpu", "sv1", "local"
    shots = credentials.get("shots", 1024)

    if not backend_name:
        raise ValueError("IonQ backend name (e.g., 'ionq/qpu' or 'local') not specified.")

    try:
        circuit = _build_braket_circuit(circuit_data)

        if backend_name == "local":
            device = LocalSimulator()
            task = device.run(circuit, shots=shots)
            result = task.result()
            counts = result.measurement_counts
            return {
                "backend_used": "AWS Braket Local Simulator",
                "num_qubits": circuit_data["qubits"],
                "counts": counts,
                "statevector": None,
                "probabilities": None
            }
        elif backend_name == "sv1":
            # SV1 is a managed simulator in Braket
            device = AwsDevice("arn:aws:braket:::device/quantum-simulator/amazon/sv1")
            task = device.run(circuit, shots=shots)
            result = task.result()
            counts = result.measurement_counts
            # SV1 can also provide statevector
            statevector = None
            probabilities = None
            if ResultType.StateVector() in circuit.result_types:
                 statevector = result.values[ResultType.StateVector()].tolist()
                 probabilities = {f"{bin(i)[2:].zfill(circuit_data['qubits'])}": abs(amp)**2 
                                 for i, amp in enumerate(statevector)}

            return {
                "backend_used": "AWS Braket SV1 Simulator",
                "num_qubits": circuit_data["qubits"],
                "counts": counts,
                "statevector": statevector,
                "probabilities": probabilities
            }
        elif backend_name == "ionq/qpu":
            if not (aws_access_key_id and aws_secret_access_key and aws_region):
                raise ValueError("AWS credentials (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION) are required for IonQ QPU.")
            
            # --- Actual Validation Step (Implicit via AwsDevice initialization) ---
            # When AwsDevice is initialized, it will attempt to use the configured AWS credentials.
            # If they are invalid, an exception will be raised.
            try:
                # Ensure AWS credentials are set as environment variables or configured in ~/.aws/credentials
                # before this line is executed. Braket SDK picks them up automatically.
                # If not set, AwsDevice will raise an error.
                device = AwsDevice("arn:aws:braket:::device/qpu/ionq/ionQdevice")
                # You could add a small, quick query here to further validate connectivity
                # For example, device.properties or device.status
            except Exception as e:
                raise ValueError(f"AWS Braket connection or IonQ QPU access failed. Please check your AWS credentials and region. Error: {e}")
            # --- End Validation Step ---

            try:
                task = device.run(circuit, shots=shots)
                result = task.result() 
                counts = result.measurement_counts
                return {
                    "backend_used": "IonQ QPU (via AWS Braket)",
                    "num_qubits": circuit_data["qubits"],
                    "counts": counts,
                    "statevector": None,
                    "probabilities": None
                }
            except Exception as e:
                raise RuntimeError(f"Failed to execute circuit on IonQ QPU: {e}")
        else:
            raise ValueError(f"Unsupported IonQ backend: {backend_name}")

    except ValueError as e:
        # Specific validation errors (e.g., missing credentials, connection issues)
        return {"error": str(e), "backend_used": backend_name or "N/A"}
    except Exception as e:
        return {"error": str(e), "backend_used": backend_name or "N/A"}

