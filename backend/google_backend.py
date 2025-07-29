# google_backend.py
# Required libraries: pip install cirq
# Note: This file is named `google_backend.py` to align with the request,
# but it uses the Cirq simulator, as Cirq is Google's primary quantum computing framework.
# No specific "Google Cloud QPU" direct integration without actual credentials.
import cirq
from collections import Counter

def run_google(circuit_data: dict) -> dict:
    """
    Runs a quantum circuit using Cirq's local simulator (Google's framework).

    Args:
        circuit_data (dict): A dictionary containing circuit information.
                             Expected format:
                             {
                               "qubits": int,
                               "gates": [
                                 {"gate": "H", "target": int},
                                 {"gate": "CX", "control": int, "target": int},
                                 {"gate": "MEASURE", "target": int}
                               ]
                             }

    Returns:
        dict: Simulation results, typically measurement counts.
    """
    num_qubits = circuit_data.get("qubits")
    gates = circuit_data.get("gates", [])

    if num_qubits is None:
        raise ValueError("Number of qubits must be specified in circuit_data.")

    qubits = cirq.LineQubit.range(num_qubits)
    circuit = cirq.Circuit()

    measurement_keys = {} # To store mapping from qubit to measurement key

    for gate_info in gates:
        gate_type = gate_info.get("gate")
        target = gate_info.get("target")
        control = gate_info.get("control")
        
        target_qubit = qubits[target] if target is not None else None
        control_qubit = qubits[control] if control is not None else None

        if gate_type == "H":
            circuit.append(cirq.H(target_qubit))
        elif gate_type == "X":
            circuit.append(cirq.X(target_qubit))
        elif gate_type == "Y":
            circuit.append(cirq.Y(target_qubit))
        elif gate_type == "Z":
            circuit.append(cirq.Z(target_qubit))
        elif gate_type == "S":
            circuit.append(cirq.S(target_qubit))
        elif gate_type == "SDG":
            circuit.append(cirq.S(target_qubit)**-1)
        elif gate_type == "T":
            circuit.append(cirq.T(target_qubit))
        elif gate_type == "TDG":
            circuit.append(cirq.T(target_qubit)**-1)
        elif gate_type == "RX":
            theta = gate_info.get("params", {}).get("theta", 0)
            circuit.append(cirq.rx(theta).on(target_qubit))
        elif gate_type == "RY":
            theta = gate_info.get("params", {}).get("theta", 0)
            circuit.append(cirq.ry(theta).on(target_qubit))
        elif gate_type == "RZ":
            theta = gate_info.get("params", {}).get("theta", 0)
            circuit.append(cirq.rz(theta).on(target_qubit))
        elif gate_type == "CX":
            if control_qubit is None:
                raise ValueError(f"Control qubit not specified for {gate_type} gate.")
            circuit.append(cirq.CNOT(control_qubit, target_qubit))
        elif gate_type == "CCX":
            control1 = gate_info.get("control1")
            control2 = gate_info.get("control2")
            if control1 is None or control2 is None:
                raise ValueError(f"Both control qubits not specified for {gate_type} gate.")
            circuit.append(cirq.CCNOT(qubits[control1], qubits[control2], target_qubit))
        elif gate_type == "SWAP":
            if control_qubit is None:
                raise ValueError(f"Second qubit not specified for {gate_type} gate.")
            circuit.append(cirq.SWAP(target_qubit, control_qubit))
        elif gate_type == "MEASURE":
            key = f"q{target}"
            circuit.append(cirq.measure(target_qubit, key=key))
            measurement_keys[target] = key
        else:
            print(f"Warning: Unknown gate type {gate_type}. Skipping.")

    simulator = cirq.Simulator()
    shots = 1024 # Default shots

    if measurement_keys:
        result = simulator.run(circuit, repetitions=shots)
        measurements = result.measurements

        combined_results = []
        sorted_measured_qubits = sorted(measurement_keys.keys())
        
        for i in range(shots):
            bitstring_parts = []
            for q_idx in sorted_measured_qubits:
                key = measurement_keys[q_idx]
                bit = measurements[key][i][0] if isinstance(measurements[key][i], list) else measurements[key][i]
                bitstring_parts.append(str(bit))
            combined_results.append("".join(bitstring_parts[::-1]))

        counts = dict(Counter(combined_results))
        return {"counts": counts}
    else:
        final_state = simulator.simulate(circuit).final_state_vector
        probabilities = {bin(i)[2:].zfill(num_qubits): abs(amplitude)**2 for i, amplitude in enumerate(final_state)}
        statevector = [complex(amp) for amp in final_state]
        return {"statevector": statevector, "probabilities": probabilities}