# Quantum Circuit Simulator

This project provides a web-based interface for building and simulating quantum circuits. It features a React frontend for an interactive circuit canvas and a Flask backend that integrates with various quantum computing platforms and simulators, including real Quantum Processing Units (QPUs) from IBM Quantum, IonQ, and Rigetti (via AWS Braket), as well as local simulators like Aer, Cirq, and PennyLane.

## Features

* **Interactive Circuit Builder:** Drag-and-drop interface to create quantum circuits.

* **Multiple Backend Support:** Simulate circuits on:

    * **QPUs:** IBM Quantum (Brisbane, Osprey), IonQ (via AWS Braket), Rigetti (via AWS Braket).

    * **Simulators:** IBM QASM Simulator, AWS Braket Local/SV1, Cirq Local, PennyLane Local (default.qubit, lightning.qubit), Aer (QASM, Statevector).

* **Automatic Fallback:** If a selected QPU cannot be accessed (e.g., due to invalid credentials or network issues), the circuit automatically falls back to a specified local simulator (defaulting to Aer QASM Simulator).

* **Clear Simulation Results:** Detailed results panel showing measurement counts, execution time, and clear indicators if a fallback occurred.

* **Theming:** Toggle between light and dark modes.

* **Backup Manager:** Save and load circuit designs.

* **Custom Gate Creator:** Define and reuse your own quantum gates.

## Architecture

The project follows a client-server architecture:

* **Frontend (React):** Built with React and Tailwind CSS, providing the graphical user interface for designing quantum circuits and visualizing results. It communicates with the backend via REST API calls.

* **Backend (Flask):** A Python Flask application that acts as an API gateway to various quantum computing SDKs. It receives circuit definitions from the frontend, executes them on the chosen backend (QPU or simulator), and returns the results. It also handles the ephemeral storage of QPU credentials.

## Prerequisites

Before you begin, ensure you have the following installed:

* **Python 3.8+:** For the Flask backend.

* **Node.js (LTS recommended):** For the React frontend.

* **npm or Yarn:** Package manager for Node.js (comes with Node.js installation).

* **Git (Optional but Recommended):** For cloning the repository.

## Setup Instructions

Follow these steps to get the project up and running on your local machine.

### 1. Clone the Repository (if applicable)

```
git clone <repository-url>
cd <repository-name>
```

### 2. Backend Setup

Navigate to the `backend` directory (or wherever your `app.py` and other Python files are located).

```
cd backend
```

#### Create a Python Virtual Environment

It's highly recommended to use a virtual environment to manage dependencies.

```
python -m venv venv
```

#### Activate the Virtual Environment

* **On Windows:**

    ```
    .\venv\Scripts\activate
    ```

* **On macOS/Linux:**

    ```
    source venv/bin/activate
    ```

#### Install Python Dependencies

run

```
pip install -r requirements.txt
```

#### Configure Environment Variables (`.env` file)

While QPU credentials entered via the UI are stored in-memory, you might want to pre-configure some default credentials or other environment variables for convenience. Create a file named `.env` in the same directory as `app.py`.

Example `.env` content (fill in your actual tokens/keys if you want them to be loaded at startup, otherwise leave them empty):

```
# .env
# IBM Quantum Experience Token
# Obtain from your IBM Quantum Experience account settings.
IBMQ_TOKEN=

# AWS Credentials for IonQ and Rigetti via AWS Braket
# Obtain from your AWS Management Console (IAM User Access Keys).
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1 # Example region, adjust as needed

# Azure Quantum Workspace Keys for Quantinuum (if integrated)
AZURE_QUANTUM_SUBSCRIPTION_ID=
AZURE_QUANTUM_WORKSPACE_NAME=
AZURE_QUANTUM_RESOURCE_GROUP=
AZURE_QUANTUM_LOCATION=eastus

# PennyLane API Key (if using remote PennyLane backends)
PENNYLANE_API_KEY=
```

#### Run the Backend Server

```
python app.py
```

The backend server should start on `http://localhost:5000`. Keep this terminal window open.

### 3. Frontend Setup

Navigate to the `frontend` directory (or wherever your `App.tsx`, `main.tsx`, and `package.json` are located).

```
cd ../frontend # Adjust path if your frontend is not in a sibling directory
```

#### Install Node.js Dependencies

```
npm install # or yarn install
```

#### Run the Frontend Development Server

```
npm start # or yarn start
```

The frontend application should open in your default browser, usually at `http://localhost:3000`.

## Usage

1.  **Build Your Circuit:** Use the drag-and-drop interface on the left sidebar to add quantum gates to the canvas.

2.  **Select a Backend:** Choose your desired QPU or simulator from the dropdown in the header.

3.  **Enter Credentials (for QPUs):** If you select a QPU (e.g., `ibm_brisbane`, `aws_ionq`), a modal will appear prompting you to enter the necessary API keys/credentials. These are stored in-memory on the backend for the duration of its run.

4.  **Simulate:** Click the "Simulate" button in the header.

5.  **View Results:** A results modal will appear showing measurement counts, execution details, and a clear indication if a fallback to a simulator occurred due to QPU access issues.

## Troubleshooting

* **CORS Error:** If you see CORS errors in your browser console, ensure your Flask backend is running and that `CORS(app)` is correctly enabled in `app.py`.

* **Python Dependencies:** If the backend fails to start or encounters import errors, double-check that all dependencies listed in `requirements.txt` are installed within your active virtual environment.

* **Node.js Dependencies:** If the frontend fails to compile or run, ensure you've run `npm install` (or `yarn install`) in the frontend directory.

* **Invalid QPU Credentials:** If a QPU simulation fails and falls back to a simulator, check the error message in the results modal. It will often indicate issues with your credentials (e.g., "Invalid IBMQ\_TOKEN", "AWS Braket connection failed"). Re-enter correct credentials via the UI.

* **`.env` file not found:** Ensure your `.env` file is in the same directory as `app.py`.

* **"IBM backends currently require QASM string" alert:** This is a known limitation in the current frontend's `App.tsx` where IBM QPU requests are hardcoded to require QASM. If you wish to use IBM QPUs with the structured circuit payload, this logic in `App.tsx`'s `handleSimulate` would need to be adapted to convert the structured circuit to QASM before sending to the IBM backend.
