# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv, find_dotenv
import os
import traceback
import atexit
import requests
import json

# Import Qiskit components for transpilation
from qiskit import QuantumCircuit, transpile
from qiskit_aer import AerSimulator # For using AerSimulator as a target backend for transpilation
# If you want to use fake backends for specific topologies:
# from qiskit.providers.fake_provider import FakeLima, FakeManhattan # Example fake backends

# Import backend modules
from ibm_backend import run_ibm
from ionq_backend import run_ionq
from rigetti_backend import run_rigetti
from cirq_backend import run_cirq
from pennylane_backend import run_pennylane
from aer_backend import run_aer

# Load environment variables from .env file
dotenv_path = find_dotenv()
if dotenv_path:
    load_dotenv(dotenv_path)
else:
    print("Warning: .env file not found. Ensure it exists in the same directory as app.py.")

app = Flask(__name__)
CORS(app) # Enable CORS for all routes

# In-memory storage for credentials. This dictionary will hold credentials
# only while the Flask server is running.
_in_memory_credentials_store = {}

# Define mapping from frontend backend names to provider functions and types
# 'provider_type': 'qpu' or 'simulator'
BACKEND_MAP = {
    # IBM backends
    "ibm_qasm_simulator": {"provider": "ibm", "runner": run_ibm, "backend_name": "ibm_qasm_simulator", "provider_type": "simulator"},
    "ibm_brisbane": {"provider": "ibm", "runner": run_ibm, "backend_name": "ibm_brisbane", "provider_type": "qpu"},
    "ibm_osprey": {"provider": "ibm", "runner": run_ibm, "backend_name": "ibm_osprey", "provider_type": "qpu"},
    
    # IonQ backends via AWS Braket
    "aws_ionq": {"provider": "ionq", "runner": run_ionq, "backend_name": "ionq/qpu", "provider_type": "qpu"},
    "aws_sv1": {"provider": "ionq", "runner": run_ionq, "backend_name": "sv1", "provider_type": "simulator"}, # SV1 is a managed simulator
    "aws_local": {"provider": "ionq", "runner": run_ionq, "backend_name": "local", "provider_type": "simulator"}, # AWS Braket local

    # Rigetti backends via AWS Braket
    "aws_rigetti": {"provider": "rigetti", "runner": run_rigetti, "backend_name": "rigetti/qpu", "provider_type": "qpu"}, # Placeholder for Rigetti QPU ARN
    
    # Google Cirq local simulator
    "google_cirq": {"provider": "cirq", "runner": run_cirq, "backend_name": "cirq_simulator", "provider_type": "simulator"},

    # PennyLane local simulators
    "pennylane_default": {"provider": "pennylane", "runner": run_pennylane, "backend_name": "default.qubit", "provider_type": "simulator"},
    "pennylane_lightning": {"provider": "pennylane", "runner": run_pennylane, "backend_name": "lightning.qubit", "provider_type": "simulator"},

    # General Aer Simulator (often used for fallback)
    "aer_qasm_simulator": {"provider": "aer", "runner": run_aer, "backend_name": "aer_qasm_simulator", "provider_type": "simulator"},
    "aer_statevector_simulator": {"provider": "aer", "runner": run_aer, "backend_name": "aer_statevector_simulator", "provider_type": "simulator"},
}

# Gemini API configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
# Using gemini-1.5-flash as it's generally good for chat and structured output
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
GEMINI_MODEL = "gemini-1.5-flash" 

def _get_credentials_for_provider(provider_key: str) -> dict:
    """
    Retrieves relevant credentials, prioritizing in-memory store, then environment variables.
    """
    credentials = {}
    
    # First, try to get from in-memory store
    if provider_key in _in_memory_credentials_store:
        return _in_memory_credentials_store[provider_key].copy() # Return a copy to prevent external modification

    # If not in memory, fall back to environment variables (from .env or system)
    if provider_key == "ibm":
        credentials["IBMQ_TOKEN"] = os.getenv("IBMQ_TOKEN")
    elif provider_key == "ionq" or provider_key == "rigetti":
        credentials["AWS_ACCESS_KEY_ID"] = os.getenv("AWS_ACCESS_KEY_ID")
        credentials["AWS_SECRET_ACCESS_KEY"] = os.getenv("AWS_SECRET_ACCESS_KEY")
        credentials["AWS_REGION"] = os.getenv("AWS_REGION")
    elif provider_key == "quantinuum":
        credentials["AZURE_QUANTUM_SUBSCRIPTION_ID"] = os.getenv("AZURE_QUANTUM_SUBSCRIPTION_ID")
        credentials["AZURE_QUANTUM_WORKSPACE_NAME"] = os.getenv("AZURE_QUANTUM_WORKSPACE_NAME")
        credentials["AZURE_QUANTUM_RESOURCE_GROUP"] = os.getenv("AZURE_QUANTUM_RESOURCE_GROUP")
        credentials["AZURE_QUANTUM_LOCATION"] = os.getenv("AZURE_QUANTUM_LOCATION")
    elif provider_key == "pennylane":
        credentials["PENNYLANE_API_KEY"] = os.getenv("PENNYLANE_API_KEY")
    return credentials


@app.route('/run', methods=['POST'])
def run_circuit():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid JSON payload"}), 400
    
    print("Incoming data:", data)

    provider_key = data.get("provider")
    circuit_data = data.get("circuit")
    # Normalize circuit data to ensure every gate has 'qubits'
    for gate in circuit_data.get("gates", []):
        if "qubits" not in gate or not isinstance(gate["qubits"], list):
            gate["qubits"] = []

    use_simulator_if_qpu_fails = data.get("use_simulator_if_qpu_fails", False)
    simulator_choice_key = data.get("simulator_choice", "aer_qasm_simulator") # Default fallback to Aer QASM
    shots = data.get("shots", 1024)

    if not provider_key or not circuit_data:
        return jsonify({"error": "Missing 'provider' or 'circuit' in payload"}), 400

    selected_backend_info = BACKEND_MAP.get(provider_key)

    if not selected_backend_info:
        return jsonify({"error": f"Unsupported provider: {provider_key}"}), 400

    runner_function = selected_backend_info["runner"]
    actual_backend_name = selected_backend_info["backend_name"]
    provider_type = selected_backend_info["provider_type"]
    current_provider_name = selected_backend_info["provider"] # e.g., "ibm", "ionq"

    # Prepare credentials dictionary, including the specific backend name and shots
    credentials = _get_credentials_for_provider(current_provider_name)
    credentials["backend_name"] = actual_backend_name
    credentials["shots"] = shots
    credentials["simulator_choice"] = simulator_choice_key # Pass to runner for consistency

    is_qpu = (provider_type == "qpu")
    
    try:
        # Attempt to run on the selected backend (QPU or simulator)
        result = runner_function(circuit_data, credentials)

        if result and "error" in result:
            # If the primary execution (QPU or simulator) resulted in an error
            if is_qpu and use_simulator_if_qpu_fails:
                app.logger.warning(f"QPU execution failed for '{provider_key}': {result['error']}. Falling back to {simulator_choice_key}.")
                
                fallback_backend_info = BACKEND_MAP.get(simulator_choice_key)
                if not fallback_backend_info or fallback_backend_info["provider_type"] == "qpu":
                    # Fallback simulator is invalid or also a QPU
                    return jsonify({
                        "error": f"Original execution on '{provider_key}' failed: {result['error']}. "
                                 f"Invalid fallback simulator choice: {simulator_choice_key}. Cannot proceed.",
                        "backend_used": result.get("backend_used", "None") # Show original backend if available
                    }), 500
                
                fallback_runner = fallback_backend_info["runner"]
                fallback_backend_name = fallback_backend_info["backend_name"]
                fallback_provider_name = fallback_backend_info["provider"]
                
                fallback_credentials = _get_credentials_for_provider(fallback_provider_name)
                fallback_credentials["backend_name"] = fallback_backend_name
                fallback_credentials["shots"] = shots
                fallback_credentials["simulator_choice"] = simulator_choice_key # Pass for consistency

                fallback_result = fallback_runner(circuit_data, fallback_credentials)
                
                if fallback_result and "error" in fallback_result:
                    # Fallback also failed
                    return jsonify({
                        "error": f"Original execution on '{provider_key}' failed: {result['error']}. "
                                 f"Fallback to '{fallback_backend_name}' also failed: {fallback_result['error']}",
                        "backend_used": fallback_result.get("backend_used", "None"),
                        "original_backend_attempted": provider_key # Indicate which QPU was attempted
                    }), 500
                else:
                    # Fallback succeeded
                    fallback_result["backend_used"] = f"FALLBACK: {fallback_result['backend_used']} (original target: {provider_key})"
                    fallback_result["original_backend_attempted"] = provider_key # Add this field
                    fallback_result["fallback_reason"] = result["error"] # Add the reason for fallback
                    return jsonify(fallback_result), 200
            else:
                # Primary execution (QPU without fallback, or simulator) failed
                return jsonify({"error": result["error"], "backend_used": result.get("backend_used", "None")}), 500
        
        # Primary execution succeeded
        return jsonify(result), 200

    except ValueError as e:
        # Catch specific validation errors (e.g., malformed circuit, unsupported gate, or credential issues from runner)
        error_message = str(e)
        if "credentials" in error_message.lower() or "token" in error_message.lower() or "access key" in error_message.lower() or "connection" in error_message.lower() or "authentication" in error_message.lower():
            if is_qpu and use_simulator_if_qpu_fails:
                app.logger.warning(f"QPU execution failed due to credentials for '{provider_key}': {error_message}. Falling back to {simulator_choice_key}.")
                
                fallback_backend_info = BACKEND_MAP.get(simulator_choice_key)
                if not fallback_backend_info or fallback_backend_info["provider_type"] == "qpu":
                    return jsonify({
                        "error": f"Original execution on '{provider_key}' failed due to credentials: {error_message}. "
                                 f"Invalid fallback simulator choice: {simulator_choice_key}. Cannot proceed.",
                        "backend_used": provider_key # Keep original backend as used for error context
                    }), 500
                
                fallback_runner = fallback_backend_info["runner"]
                fallback_backend_name = fallback_backend_info["backend_name"]
                fallback_provider_name = fallback_backend_info["provider"]
                
                fallback_credentials = _get_credentials_for_provider(fallback_provider_name)
                fallback_credentials["backend_name"] = fallback_backend_name
                fallback_credentials["shots"] = shots
                fallback_credentials["simulator_choice"] = simulator_choice_key

                fallback_result = fallback_runner(circuit_data, fallback_credentials)
                
                if fallback_result and "error" in fallback_result:
                    return jsonify({
                        "error": f"Original execution on '{provider_key}' failed due to credentials: {error_message}. "
                                 f"Fallback to '{fallback_backend_name}' also failed: {fallback_result['error']}",
                        "backend_used": fallback_result.get("backend_used", "None"),
                        "original_backend_attempted": provider_key,
                        "fallback_reason": error_message # Reason for original failure
                    }), 500
                else:
                    fallback_result["backend_used"] = f"FALLBACK: {fallback_result['backend_used']} (original target: {provider_key})"
                    fallback_result["original_backend_attempted"] = provider_key
                    fallback_result["fallback_reason"] = error_message
                    return jsonify(fallback_result), 200
            else:
                # QPU failed due to credentials, no fallback or fallback not allowed
                return jsonify({"error": f"Credential error for {provider_key}: {error_message}", "backend_used": provider_key}), 401
        else:
            # Other ValueError (e.g., circuit validation)
            return jsonify({"error": f"Circuit validation error: {error_message}", "backend_used": provider_key}), 400
    except Exception as e:
        # Catch any unexpected errors during execution
        app.logger.error(f"An unexpected error occurred: {e}\n{traceback.format_exc()}")
        return jsonify({"error": f"An unexpected error occurred: {e}", "backend_used": provider_key}), 500

@app.route('/save_credentials', methods=['POST'])
def save_credentials():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid JSON payload"}), 400

    provider = data.get('provider')
    credentials = data.get('credentials')

    if not provider or not credentials:
        return jsonify({"error": "Missing 'provider' or 'credentials' in payload"}), 400

    try:
        # Store credentials in the in-memory store
        _in_memory_credentials_store[provider] = credentials
        
        print(f"Credentials for {provider} stored in memory.")
        return jsonify({"message": f"Credentials for {provider} saved successfully (in memory)."}), 200
    except Exception as e:
        app.logger.error(f"Error saving credentials to memory: {e}\n{traceback.format_exc()}")
        return jsonify({"error": f"Failed to save credentials to memory: {e}"}), 500

# --- Gemini API Endpoints ---

@app.route('/chat', methods=['POST'])
def chat_with_quantum_chatbot():
    """
    Endpoint for the quantum computing chatbot.
    Receives a user message and sends it to Gemini API for a response.
    """
    if not GEMINI_API_KEY:
        return jsonify({"error": "Gemini API key not configured on the server."}), 500

    data = request.get_json()
    user_message = data.get('message')
    chat_history = data.get('history', []) # Expects an array of {role: "user/assistant", content: "..."}

    if not user_message:
        return jsonify({"error": "Missing 'message' in payload"}), 400

    # Prepare messages for Gemini API
    # Gemini API expects 'contents' as a list of dictionaries with 'role' and 'parts'
    # Each 'part' is a dictionary with 'text'
    gemini_messages = [{"role": "user", "parts": [{"text": "You are a helpful quantum computing expert. Answer questions about quantum computing, quantum mechanics, and quantum algorithms concisely and accurately."}]}]
    for chat_item in chat_history:
        # Map 'assistant' to 'model' for Gemini API
        role = "model" if chat_item["role"] == "assistant" else chat_item["role"]
        gemini_messages.append({"role": role, "parts": [{"text": chat_item["content"]}]})
    gemini_messages.append({"role": "user", "parts": [{"text": user_message}]})

    try:
        headers = {
            "Content-Type": "application/json",
        }
        payload = {
            "contents": gemini_messages,
            "generationConfig": {
                "temperature": 0.7, # Adjust as needed for creativity
                "maxOutputTokens": 500, # Limit response length
            }
        }
        
        # Include API key directly in the URL for Gemini
        response = requests.post(f"{GEMINI_API_URL}?key={GEMINI_API_KEY}", headers=headers, json=payload)
        response.raise_for_status() # Raise an exception for HTTP errors (4xx or 5xx)
        
        gemini_response = response.json()
        
        if gemini_response and gemini_response.get('candidates'):
            # Extract the text from the first candidate's first part
            assistant_message = gemini_response['candidates'][0]['content']['parts'][0]['text']
            return jsonify({"response": assistant_message}), 200
        else:
            app.logger.error(f"Gemini API returned an unexpected response: {gemini_response}")
            return jsonify({"error": "Failed to get a valid response from Gemini API."}), 500

    except requests.exceptions.RequestException as e:
        app.logger.error(f"Error calling Gemini API for chat: {e}\n{traceback.format_exc()}")
        return jsonify({"error": f"Failed to connect to Gemini API for chat: {e}"}), 500
    except Exception as e:
        app.logger.error(f"An unexpected error occurred during chat processing: {e}\n{traceback.format_exc()}")
        return jsonify({"error": f"An unexpected error occurred: {e}"}), 500


@app.route('/suggest_gates', methods=['POST'])
def suggest_gates():
    """
    Endpoint for gate suggestions.
    Receives current circuit data and asks Gemini API for gate suggestions.
    """
    if not GEMINI_API_KEY:
        return jsonify({"error": "Gemini API key not configured on the server."}), 500

    data = request.get_json()
    circuit_data = data.get('circuit')
    num_qubits = data.get('numQubits')

    if not circuit_data:
        return jsonify({"error": "Missing 'circuit' data in payload"}), 400

    # Convert circuit data to a more readable string for the LLM
    circuit_description = "Current quantum circuit:\n"
    if not circuit_data.get('gates'):
        circuit_description += "The circuit is empty."
    else:
        for gate in circuit_data['gates']:
            qubits_str = f"qubits {gate['qubits']}" if gate.get('qubits') else ""
            params_str = f" with parameters {gate['parameters']}" if gate.get('parameters') else ""
            circuit_description += f"- Gate: {gate['name']} {qubits_str}{params_str}\n"
    
    circuit_description += f"\nNumber of qubits in circuit: {num_qubits}"

    prompt = f"""
    Given the following quantum circuit, suggest up to 4 relevant next quantum gates to add. 
    Focus on common quantum algorithm patterns (e.g., superposition, entanglement, phase rotation, measurement preparation, oracles).
    For each suggestion, provide:
    - `gate`: The gate name (e.g., "H", "CX", "RZ").
    - `title`: A short, descriptive title for the suggestion.
    - `reason`: A brief explanation of why this gate is suggested.
    - `priority`: "high", "medium", or "low".
    - `qubits`: An array of qubit indices the gate should act on (e.g., [0], [0, 1]).
    - `parameters` (optional): An array of numerical parameters for parameterized gates (e.g., [0.785] for RZ(pi/4)).

    Return the suggestions as a JSON array of objects. Ensure the JSON is valid and can be directly parsed.
    If no specific suggestions, return an empty array.

    {circuit_description}

    Example JSON structure:
    [
      {{
        "gate": "H",
        "title": "Introduce Superposition",
        "reason": "Start with a Hadamard gate to put a qubit into superposition.",
        "priority": "high",
        "qubits": [0]
      }},
      {{
        "gate": "CX",
        "title": "Create Entanglement",
        "reason": "Use CNOT to entangle qubits after superposition.",
        "priority": "high",
        "qubits": [0, 1]
      }}
    ]
    """

    try:
        headers = {
            "Content-Type": "application/json",
        }
        payload = {
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generationConfig": {
                "responseMimeType": "application/json",
                "responseSchema": {
                    "type": "ARRAY",
                    "items": {
                        "type": "OBJECT",
                        "properties": {
                            "gate": {"type": "STRING"},
                            "title": {"type": "STRING"},
                            "reason": {"type": "STRING"},
                            "priority": {"type": "STRING", "enum": ["high", "medium", "low"]},
                            "qubits": {"type": "ARRAY", "items": {"type": "INTEGER"}},
                            "parameters": {"type": "ARRAY", "items": {"type": "NUMBER"}}
                        },
                        "required": ["gate", "title", "reason", "priority", "qubits"]
                    }
                }
            }
        }
        
        response = requests.post(f"{GEMINI_API_URL}?key={GEMINI_API_KEY}", headers=headers, json=payload)
        response.raise_for_status()
        
        gemini_response = response.json()
        
        if gemini_response and gemini_response.get('candidates'):
            try:
                suggestions_json_str = gemini_response['candidates'][0]['content']['parts'][0]['text']
                suggestions = json.loads(suggestions_json_str)
                if isinstance(suggestions, list):
                    return jsonify({"suggestions": suggestions}), 200
                else:
                    app.logger.error(f"Gemini API returned invalid JSON structure for suggestions: {suggestions_json_str}")
                    return jsonify({"error": "Gemini API returned invalid suggestion format."}), 500
            except json.JSONDecodeError:
                app.logger.error(f"Gemini API returned non-JSON content for suggestions: {gemini_response['candidates'][0]['content']['parts'][0]['text']}")
                return jsonify({"error": "Gemini API did not return valid JSON for suggestions."}), 500
        else:
            app.logger.error(f"Gemini API returned an unexpected response for suggestions: {gemini_response}")
            return jsonify({"error": "Failed to get valid suggestions from Gemini API."}), 500

    except requests.exceptions.RequestException as e:
        app.logger.error(f"Error calling Gemini API for gate suggestions: {e}\n{traceback.format_exc()}")
        return jsonify({"error": f"Failed to connect to Gemini API for gate suggestions: {e}"}), 500
    except Exception as e:
        app.logger.error(f"An unexpected error occurred during gate suggestion processing: {e}\n{traceback.format_exc()}")
        return jsonify({"error": f"An unexpected error occurred: {e}"}), 500


@app.route('/fix_circuit', methods=['POST'])
def fix_circuit():
    """
    Endpoint for circuit fixing/optimization.
    Receives current circuit data and asks Gemini API for analysis and fixes.
    """
    if not GEMINI_API_KEY:
        return jsonify({"error": "Gemini API key not configured on the server."}), 500

    data = request.get_json()
    circuit_data = data.get('circuit')

    if not circuit_data:
        return jsonify({"error": "Missing 'circuit' data in payload"}), 400

    circuit_description = "Current quantum circuit:\n"
    if not circuit_data.get('gates'):
        circuit_description += "The circuit is empty."
    else:
        for gate in circuit_data['gates']:
            qubits_str = f"qubits {gate['qubits']}" if gate.get('qubits') else ""
            params_str = f" with parameters {gate['parameters']}" if gate.get('parameters') else ""
            circuit_description += f"- Gate: {gate['name']} {qubits_str}{params_str}\n"

    prompt = f"""
    Analyze the following quantum circuit for potential issues, inefficiencies, or opportunities for optimization.
    Consider aspects like:
    - Redundant gates (e.g., H-H, X-X pairs)
    - High circuit depth or quantum cost
    - Missing entanglement for multi-qubit circuits
    - Opportunities for gate cancellation or simplification
    - General best practices for quantum circuit design.

    For each finding, provide:
    - `type`: "error", "warning", or "info".
    - `title`: A concise title for the finding.
    - `description`: A detailed explanation of the issue or optimization.
    - `action`: A suggestion on how to address it.
    - `severity` (for errors/warnings): "high", "medium", or "low".
    - `fixable` (boolean, if an automatic fix can be applied by removing gates): true/false.
    - `gates_to_remove` (optional, array of gate IDs if `fixable` is true): IDs of gates to remove for the fix.

    Return the findings as a JSON array of objects. Ensure the JSON is valid and can be directly parsed.
    If the circuit looks good, return an empty array.

    {circuit_description}

    Example JSON structure:
    [
      {{
        "type": "warning",
        "title": "Gate Cancellations Detected",
        "description": "Found a pair of H gates on qubit 0 that cancel each other out.",
        "action": "Remove redundant gate pair.",
        "severity": "medium",
        "fixable": true,
        "gates_to_remove": ["gate_id_1", "gate_id_2"]
      }},
      {{
        "type": "info",
        "title": "No Entanglement",
        "description": "Circuit uses multiple qubits but has no entangling gates (CX, CZ, SWAP).",
        "action": "Consider adding entangling gates for quantum advantage.",
        "severity": null,
        "fixable": false
      }}
    ]
    """

    try:
        headers = {
            "Content-Type": "application/json",
        }
        payload = {
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generationConfig": {
                "responseMimeType": "application/json",
                "responseSchema": {
                    "type": "ARRAY",
                    "items": {
                        "type": "OBJECT",
                        "properties": {
                            "type": {"type": "STRING", "enum": ["error", "warning", "info"]},
                            "title": {"type": "STRING"},
                            "description": {"type": "STRING"},
                            "action": {"type": "STRING"},
                            "severity": {"type": "STRING", "enum": ["high", "medium", "low", None]},
                            "fixable": {"type": "BOOLEAN"},
                            "gates_to_remove": {"type": "ARRAY", "items": {"type": "STRING"}}
                        },
                        "required": ["type", "title", "description", "action", "fixable"]
                    }
                }
            }
        }
        
        response = requests.post(f"{GEMINI_API_URL}?key={GEMINI_API_KEY}", headers=headers, json=payload)
        response.raise_for_status()
        
        gemini_response = response.json()
        
        if gemini_response and gemini_response.get('candidates'):
            try:
                findings_json_str = gemini_response['candidates'][0]['content']['parts'][0]['text']
                findings = json.loads(findings_json_str)
                if isinstance(findings, list):
                    return jsonify({"findings": findings}), 200
                else:
                    app.logger.error(f"Gemini API returned invalid JSON structure for findings: {findings_json_str}")
                    return jsonify({"error": "Gemini API returned invalid circuit fixer format."}), 500
            except json.JSONDecodeError:
                app.logger.error(f"Gemini API returned non-JSON content for circuit fixer: {gemini_response['candidates'][0]['content']['parts'][0]['text']}")
                return jsonify({"error": "Gemini API did not return valid JSON for circuit fixer."}), 500
        else:
            app.logger.error(f"Gemini API returned an unexpected response for circuit fixer: {gemini_response}")
            return jsonify({"error": "Failed to get valid circuit fixes from Gemini API."}), 500

    except requests.exceptions.RequestException as e:
        app.logger.error(f"Error calling Gemini API for circuit fixer: {e}\n{traceback.format_exc()}")
        return jsonify({"error": f"Failed to connect to Gemini API for circuit fixer: {e}"}), 500
    except Exception as e:
        app.logger.error(f"An unexpected error occurred during circuit fixer processing: {e}\n{traceback.format_exc()}")
        return jsonify({"error": f"An unexpected error occurred: {e}"}), 500

# --- New Transpiler Endpoint ---
@app.route('/transpile_circuit', methods=['POST'])
def transpile_circuit():
    """
    Endpoint for transpiling a quantum circuit for a target backend.
    Receives current circuit data and target backend name.
    """
    data = request.get_json()
    circuit_data = data.get('circuit')
    target_backend_name = data.get('target_backend_name')
    num_qubits = data.get('num_qubits')

    if not circuit_data or not target_backend_name or num_qubits is None:
        return jsonify({"error": "Missing 'circuit', 'target_backend_name', or 'num_qubits' in payload"}), 400

    try:
        # --- 1. Convert Frontend Circuit to Qiskit QuantumCircuit ---
        # Initialize with qubits and classical bits for measurement (num_qubits for classical bits)
        qiskit_circuit = QuantumCircuit(num_qubits, num_qubits) 

        for gate in circuit_data.get('gates', []):
            gate_name = gate['name'].lower()
            qubits = gate.get('qubits', [])
            parameters = gate.get('parameters', [])

            # Map your frontend gate names to Qiskit gate methods
            # Ensure qubits are valid indices before applying
            if not qubits or any(q >= num_qubits for q in qubits):
                app.logger.warning(f"Skipping gate '{gate_name}' due to invalid qubit index: {qubits}")
                continue

            if gate_name == 'h':
                qiskit_circuit.h(qubits[0])
            elif gate_name == 'x':
                qiskit_circuit.x(qubits[0])
            elif gate_name == 'y':
                qiskit_circuit.y(qubits[0])
            elif gate_name == 'z':
                qiskit_circuit.z(qubits[0])
            elif gate_name == 's':
                qiskit_circuit.s(qubits[0])
            elif gate_name == 'sdg':
                qiskit_circuit.sdg(qubits[0])
            elif gate_name == 't':
                qiskit_circuit.t(qubits[0])
            elif gate_name == 'tdg':
                qiskit_circuit.tdg(qubits[0])
            elif gate_name == 'rx':
                if parameters: qiskit_circuit.rx(parameters[0], qubits[0])
            elif gate_name == 'ry':
                if parameters: qiskit_circuit.ry(parameters[0], qubits[0])
            elif gate_name == 'rz':
                if parameters: qiskit_circuit.rz(parameters[0], qubits[0])
            elif gate_name == 'u3': # Example for U3, assuming 3 parameters
                if parameters and len(parameters) == 3: qiskit_circuit.u(parameters[0], parameters[1], parameters[2], qubits[0])
            elif gate_name == 'cx':
                if len(qubits) == 2: qiskit_circuit.cx(qubits[0], qubits[1])
            elif gate_name == 'cy':
                if len(qubits) == 2: qiskit_circuit.cy(qubits[0], qubits[1])
            elif gate_name == 'cz':
                if len(qubits) == 2: qiskit_circuit.cz(qubits[0], qubits[1])
            elif gate_name == 'swap':
                if len(qubits) == 2: qiskit_circuit.swap(qubits[0], qubits[1])
            elif gate_name == 'ccx': # Toffoli
                if len(qubits) == 3: qiskit_circuit.ccx(qubits[0], qubits[1], qubits[2])
            elif gate_name == 'measure':
                if len(qubits) > 0:
                    # Measure qubit[0] into classical bit[0] (assuming 1-to-1 mapping for simplicity)
                    qiskit_circuit.measure(qubits[0], qubits[0]) 
            # Add more gate mappings as needed for your supported gates
            else:
                app.logger.warning(f"Unsupported gate type encountered during Qiskit conversion: {gate_name}")
                # You might want to raise an error or skip the gate

        # --- 2. Select Target Backend for Transpilation ---
        target_qiskit_backend = None
        if target_backend_name == "aer_qasm_simulator":
            target_qiskit_backend = AerSimulator()
        elif target_backend_name == "aer_statevector_simulator":
            target_qiskit_backend = AerSimulator(method='statevector') # Or specific Aer method
        # Add more backend mappings here if you introduce fake backends
        # elif target_backend_name == "fake_lima":
        #    target_qiskit_backend = FakeLima()
        # elif target_backend_name == "fake_manhattan":
        #    target_qiskit_backend = FakeManhattan()
        else:
            return jsonify({"error": f"Unsupported target backend for transpilation: {target_backend_name}"}), 400


        # --- 3. Transpile the Circuit ---
        # optimization_level: 0 (no optimization) to 3 (heavy optimization)
        transpiled_circuit = transpile(qiskit_circuit, target_qiskit_backend, optimization_level=3)

        # --- 4. Get Metrics ---
        original_gate_count = qiskit_circuit.size()
        transpiled_gate_count = transpiled_circuit.size()
        original_depth = qiskit_circuit.depth()
        transpiled_depth = transpiled_circuit.depth()

        # --- 5. Get QASM string of the transpiled circuit ---
        transpiled_qasm_code = transpiled_circuit.qasm()

        return jsonify({
            "transpiled_circuit_qasm": transpiled_qasm_code, # New field for QASM code
            "original_gate_count": original_gate_count,
            "transpiled_gate_count": transpiled_gate_count,
            "original_depth": original_depth,
            "transpiled_depth": transpiled_depth,
            "message": "Circuit transpiled successfully!"
        }), 200

    except Exception as e:
        app.logger.error(f"Error during circuit transpilation: {e}\n{traceback.format_exc()}")
        return jsonify({"error": f"Failed to transpile circuit: {e}"}), 500

# Register a function to be called when the application is exiting
@atexit.register
def cleanup_on_exit():
    print("Clearing in-memory credentials store on application exit.")
    _in_memory_credentials_store.clear()

if __name__ == '__main__':
    # Ensure the GEMINI_API_KEY is set in your environment or a .env file
    if not GEMINI_API_KEY:
        print("WARNING: GEMINI_API_KEY environment variable is not set. AI features will not work.")
        print("Please create a .env file in the same directory as app.py with: GEMINI_API_KEY=YOUR_API_KEY")
    app.run(debug=True, port=5000)
