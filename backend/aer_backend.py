# aer_backend.py
import qiskit
import qiskit_aer

# pip install qiskit qiskit-aer

def _build_qiskit_circuit_aer(circuit_data: dict) -> tuple[qiskit.QuantumCircuit, bool]:
    """
    Builds a Qiskit QuantumCircuit from the standardized circuit data.
    Returns the circuit and a boolean indicating if explicit measurement gates were found.
    """
    num_qubits = circuit_data["qubits"]
    # Create classical bits equal to the number of quantum bits for potential measurements
    circuit = qiskit.QuantumCircuit(num_qubits, num_qubits)

    has_explicit_measurements = False

    for gate_info in circuit_data["gates"]:
        gate_type = gate_info["gate"].lower()
        target = gate_info.get("target")
        control = gate_info.get("control")
        params = gate_info.get("params", {})

        # Basic validation for target/control qubits
        if target is not None and not isinstance(target, int):
            raise ValueError(f"Invalid target for {gate_type} gate: {target}. Must be an integer.")
        if control is not None and not isinstance(control, int):
            raise ValueError(f"Invalid control for {gate_type} gate: {control}. Must be an integer.")
        
        # Single qubit gates
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
        elif gate_type == "p": # Phase gate
            circuit.p(params.get("theta", 0), target)
        elif gate_type == "u": # U gate (generalized single qubit gate: U(theta, phi, lambda))
            circuit.u(params.get("theta", 0), params.get("phi", 0), params.get("lambda", 0), target)

        # Two qubit gates
        elif gate_type == "cx":
            circuit.cx(control, target)
        elif gate_type == "cy":
            circuit.cy(control, target)
        elif gate_type == "cz":
            circuit.cz(control, target)
        elif gate_type == "swap":
            circuit.swap(control, target)
        elif gate_type == "crx":
            circuit.crx(params.get("theta", 0), control, target)
        elif gate_type == "cry":
            circuit.cry(params.get("theta", 0), control, target)
        elif gate_type == "crz":
            circuit.crz(params.get("theta", 0), control, target)
        elif gate_type == "cu": # Controlled U gate (generalized two-qubit gate: CU(theta, phi, lambda, gamma))
            circuit.cu(params.get("theta", 0), params.get("phi", 0), params.get("lambda", 0), params.get("gamma", 0), control, target)

        # Three-qubit gates
        elif gate_type == "ccx": # Toffoli gate
            control1 = gate_info.get("control1")
            control2 = gate_info.get("control2")
            if control1 is None or control2 is None:
                raise ValueError(f"Both control1 and control2 must be specified for {gate_type} gate.")
            circuit.ccx(control1, control2, target)
        
        # Measurement gate
        elif gate_type == "measure":
            # Map target qubit to a classical bit. Default to the same index.
            classical_bit = gate_info.get("classical_bit", target)
            if classical_bit is None: # Fallback if target also happens to be None (should be validated earlier)
                classical_bit = target # Use target as classical bit if not specified

            circuit.measure(target, classical_bit)
            has_explicit_measurements = True

        else:
            print(f"Warning: Unknown gate type {gate_type}. Skipping.")

    return circuit, has_explicit_measurements


def run_aer(circuit_data: dict, credentials: dict) -> dict:
    """
    Runs a quantum circuit on a Qiskit Aer simulator.
    """
    try:
        # Build the Qiskit circuit and check for explicit measurements
        circuit, has_explicit_measurements = _build_qiskit_circuit_aer(circuit_data)

        # Determine the simulator backend based on credentials
        backend_name = credentials.get("simulator_choice", "qasm_simulator")
        shots = credentials.get("shots", 1024)

        if backend_name == "aer_qasm_simulator":
            # For QASM simulator, measurements are required to get counts.
            # If no explicit measurements are defined in the circuit data, add them for all qubits.
            if not has_explicit_measurements:
                # Measure all quantum bits into their corresponding classical bits
                circuit.measure(range(circuit.num_qubits), range(circuit.num_qubits))

            simulator = qiskit_aer.AerSimulator(method='automatic') # Use automatic method for best performance
            job = qiskit.execute(circuit, simulator, shots=shots)
            result = job.result()
            counts = result.get_counts(circuit) # This should now work as measurements are guaranteed

            return {
                "backend_used": "Aer QASM Simulator",
                "num_qubits": circuit_data["qubits"],
                "counts": counts,
                "statevector": None, # QASM simulators don't directly give statevector
                "probabilities": None # Probabilities are derived from counts, not statevector
            }
        elif backend_name == "aer_statevector_simulator": # Consistent naming with BACKEND_MAP
            simulator = qiskit_aer.AerSimulator(method='statevector')
            job = qiskit.execute(circuit, simulator) # Statevector doesn't need shots, and measurements are ignored for statevector output

            result = job.result()
            statevector = result.get_statevector(circuit).tolist()
            
            # Calculate probabilities from statevector for display
            probabilities = {
                format(i, f'0{circuit_data["qubits"]}b'): abs(amp)**2
                for i, amp in enumerate(statevector)
            }
            return {
                "backend_used": "Aer Statevector Simulator",
                "num_qubits": circuit_data["qubits"],
                "counts": None, # Statevector simulator doesn't return counts directly
                "statevector": statevector,
                "probabilities": probabilities
            }
        else:
            raise ValueError(f"Unsupported Aer simulator: {backend_name}")

    except Exception as e:
        # Include the backend name in the error for better debugging
        return {"error": str(e), "backend_used": credentials.get("backend_name", "N/A")}