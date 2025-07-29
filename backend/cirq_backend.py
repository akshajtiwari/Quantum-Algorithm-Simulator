# cirq_backend.py
import cirq
import numpy as np

# pip install cirq

def _build_cirq_circuit(circuit_data: dict) -> cirq.Circuit:
    """Builds a Cirq Circuit from the standardized circuit data."""
    num_qubits = circuit_data["qubits"]
    qubits = cirq.LineQubit.range(num_qubits)
    circuit = cirq.Circuit()

    for gate_info in circuit_data["gates"]:
        gate_type = gate_info["gate"].lower()
        target = qubits[gate_info["target"]]

        if gate_type == "h":
            circuit.append(cirq.H(target))
        elif gate_type == "x":
            circuit.append(cirq.X(target))
        elif gate_type == "y":
            circuit.append(cirq.Y(target))
        elif gate_type == "z":
            circuit.append(cirq.Z(target))
        elif gate_type == "s":
            circuit.append(cirq.S(target))
        elif gate_type == "sdg":
            circuit.append(cirq.S(target)**-1)
        elif gate_type == "t":
            circuit.append(cirq.T(target))
        elif gate_type == "tdg":
            circuit.append(cirq.T(target)**-1)
        elif gate_type == "rx":
            circuit.append(cirq.rx(gate_info["params"]["theta"]).on(target))
        elif gate_type == "ry":
            circuit.append(cirq.ry(gate_info["params"]["theta"]).on(target))
        elif gate_type == "rz":
            circuit.append(cirq.rz(gate_info["params"]["theta"]).on(target))
        elif gate_type == "cx":
            control = qubits[gate_info["control"]]
            circuit.append(cirq.CNOT(control, target))
        elif gate_type == "ccx":
            controls = [qubits[c] for c in gate_info["controls"]]
            if len(controls) == 2:
                circuit.append(cirq.CCNOT(controls[0], controls[1], target))
            else:
                raise ValueError(f"CCX gate requires exactly 2 control qubits, got {len(controls)}")
        elif gate_type == "swap":
            # For swap, frontend's "target" and "control" map to the two qubits to swap
            q1 = qubits[gate_info["target"]]
            q2 = qubits[gate_info["control"]] # Assuming control is used for the second qubit in swap
            circuit.append(cirq.SWAP(q1, q2))
        elif gate_type == "measure":
            # Cirq measurements
            circuit.append(cirq.measure(target, key=f"q{gate_info['target']}"))
        else:
            raise ValueError(f"Unsupported gate type for Cirq: {gate_type}")
    return circuit

def run_cirq(circuit_data: dict, credentials: dict = None) -> dict:
    """
    Executes a quantum circuit using Cirq's local simulator.

    Args:
        circuit_data (dict): A dictionary describing the quantum circuit.
                             Expected format: {"qubits": int, "gates": list}
        credentials (dict): Not directly used for local Cirq simulation, but present for API consistency.

    Returns:
        dict: Simulation results including counts, statevector, and probabilities.
    """
    shots = credentials.get("shots", 1024) if credentials else 1024 # Default shots

    try:
        circuit = _build_cirq_circuit(circuit_data)
        simulator = cirq.Simulator()

        # Check if there are any measurement gates in the circuit
        has_measurements = any(g["gate"].lower() == "measure" for g in circuit_data["gates"])

        if has_measurements:
            # Run simulation to get counts
            result = simulator.run(circuit, repetitions=shots)
            
            # Process counts from measurement results
            counts = {}
            # Cirq results are often by key. Combine bits into a single string.
            for key, val_counts in result.multi_readout_histogram(keys=result.measurements.keys()).items():
                for bitstring, count in val_counts.items():
                    # Reconstruct the full bitstring. This can be tricky if not all qubits are measured.
                    # A robust way is to measure all qubits for counts.
                    # For simplicity, we assume relevant qubits are measured and reconstruct.
                    # This assumes measurement keys are 'q0', 'q1', etc.
                    full_bitstring = ['0'] * circuit_data["qubits"]
                    for q_idx in range(circuit_data["qubits"]):
                        q_key = f"q{q_idx}"
                        if q_key in result.measurements: # Check if this qubit was measured
                            # Get the measured bit for this qubit for each repetition
                            # This needs to align `bitstring` with `q_idx` from the histogram.
                            # The `multi_readout_histogram` maps tuples of bits to counts.
                            # The order of the bits in the tuple corresponds to the sorted keys passed to it.
                            
                            # Re-process to align with typical '00', '01' format
                            # This is a simplification; for complex measurement setups, more careful mapping is needed.
                            # A direct way to get counts for all measured qubits:
                            combined_measurement = "".join(str(bit[0]) for bit in bitstring) # If bitstring is a tuple of tuples
                            counts[combined_measurement] = counts.get(combined_measurement, 0) + count

            # Statevector and probabilities only if no measurements were performed (or for separate statevector run)
            statevector = None
            probabilities = None
            if not has_measurements: # Only get statevector if no measurement gates are present
                final_state_vector = simulator.simulate(circuit).final_state_vector
                statevector = final_state_vector.tolist()
                probabilities = {
                    format(i, f'0{circuit_data["qubits"]}b'): abs(amp)**2
                    for i, amp in enumerate(statevector)
                }

            return {
                "backend_used": "Cirq Local Simulator",
                "num_qubits": circuit_data["qubits"],
                "counts": counts if has_measurements else None,
                "statevector": statevector,
                "probabilities": probabilities
            }
        else:
            # If no measurements, simulate statevector
            result = simulator.simulate(circuit)
            statevector = result.final_state_vector.tolist()
            probabilities = {
                format(i, f'0{circuit_data["qubits"]}b'): abs(amp)**2
                for i, amp in enumerate(statevector)
            }
            return {
                "backend_used": "Cirq Local Simulator (Statevector)",
                "num_qubits": circuit_data["qubits"],
                "counts": None,
                "statevector": statevector,
                "probabilities": probabilities
            }

    except Exception as e:
        return {"error": str(e), "backend_used": "Cirq Local Simulator"}