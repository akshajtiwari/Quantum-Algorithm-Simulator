import React, { useState, useEffect } from 'react';

// Define the structure for credentials required by different QPUs
// This map helps the modal dynamically render input fields
const QPU_CREDENTIAL_FIELDS: { [key: string]: { key: string; label: string; type: string; placeholder: string }[] } = {
  ibm: [
    { key: 'IBMQ_TOKEN', label: 'IBM Quantum Experience Token', type: 'password', placeholder: 'Your IBMQ Token' },
  ],
  ionq: [
    { key: 'AWS_ACCESS_KEY_ID', label: 'AWS Access Key ID', type: 'password', placeholder: 'Your AWS Access Key ID' },
    { key: 'AWS_SECRET_ACCESS_KEY', label: 'AWS Secret Access Key', type: 'password', placeholder: 'Your AWS Secret Access Key' },
    { key: 'AWS_REGION', label: 'AWS Region', type: 'text', placeholder: 'e.g., us-east-1' },
  ],
  rigetti: [ // Rigetti also uses AWS Braket credentials
    { key: 'AWS_ACCESS_KEY_ID', label: 'AWS Access Key ID', type: 'password', placeholder: 'Your AWS Access Key ID' },
    { key: 'AWS_SECRET_ACCESS_KEY', label: 'AWS Secret Access Key', type: 'password', placeholder: 'Your AWS Secret Access Key' },
    { key: 'AWS_REGION', label: 'AWS Region', type: 'text', placeholder: 'e.g., us-east-1' },
  ],
  quantinuum: [
    { key: 'AZURE_QUANTUM_SUBSCRIPTION_ID', label: 'Azure Subscription ID', type: 'password', placeholder: 'Your Azure Subscription ID' },
    { key: 'AZURE_QUANTUM_WORKSPACE_NAME', label: 'Azure Workspace Name', type: 'text', placeholder: 'Your Azure Quantum Workspace Name' },
    { key: 'AZURE_QUANTUM_RESOURCE_GROUP', label: 'Azure Resource Group', type: 'text', placeholder: 'Your Azure Resource Group' },
    { key: 'AZURE_QUANTUM_LOCATION', label: 'Azure Location', type: 'text', placeholder: 'e.g., eastus' },
  ],
  pennylane: [ // Only if using remote PennyLane backends that require a key
    { key: 'PENNYLANE_API_KEY', label: 'PennyLane API Key', type: 'password', placeholder: 'Your PennyLane API Key (if needed)' },
  ],
};

interface CredentialsModalProps {
  provider: string; // The provider key (e.g., 'ibm', 'ionq')
  backendName: string; // The full backend name (e.g., 'ibm_brisbane', 'aws_ionq')
  onSave: (credentials: { [key: string]: string }) => void;
  onClose: () => void;
}

export const CredentialsModal: React.FC<CredentialsModalProps> = ({ provider, backendName, onSave, onClose }) => {
  const [credentials, setCredentials] = useState<{ [key: string]: string }>({});
  const fields = QPU_CREDENTIAL_FIELDS[provider] || [];

  // Initialize credentials state when provider changes
  useEffect(() => {
    const initialCreds: { [key: string]: string } = {};
    fields.forEach(field => {
      initialCreds[field.key] = ''; // Initialize with empty string
    });
    setCredentials(initialCreds);
  }, [provider]); // Re-run when provider changes

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(credentials);
    onClose(); // Close modal after saving
  };

  if (!fields.length) {
    // If no specific fields are defined for the provider, just close
    // or show a message that no credentials are required.
    console.warn(`No specific credential fields defined for provider: ${provider}`);
    return null; // Or render a simple message and a close button
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md mx-4 border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 text-center">
          Enter Credentials for {backendName}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 text-center">
          These credentials are required to connect to the selected QPU. They will be stored securely on your backend.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map(field => (
            <div key={field.key}>
              <label htmlFor={field.key} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {field.label}
              </label>
              <input
                type={field.type}
                id={field.key}
                name={field.key}
                value={credentials[field.key] || ''}
                onChange={handleChange}
                placeholder={field.placeholder}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                required={field.type === 'password' || field.key.includes('ID') || field.key.includes('KEY') || field.key.includes('REGION') || field.key.includes('NAME') || field.key.includes('GROUP') || field.key.includes('LOCATION')} // Make required for critical fields
              />
            </div>
          ))}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Save Credentials
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
