import React, { useState } from 'react';
import { Circuit, QuantumGate } from '../types/quantum';
import { Bot, Lightbulb, Wrench, Send } from 'lucide-react';

interface AIPanelProps {
  circuit: Circuit;
  onGateAdd: (gate: QuantumGate) => void;
  numQubits: number;
  className?: string;
}

export const AIPanel: React.FC<AIPanelProps> = ({ circuit, onGateAdd, numQubits, className = '' }) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'suggest' | 'fix'>('chat');
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);

  const handleSendMessage = async () => {
    if (!chatMessage.trim()) return;

    const newMessage = { role: 'user' as const, content: chatMessage };
    setChatHistory(prev => [...prev, newMessage]);
    setChatMessage('');

    // Simulate AI response
    setTimeout(() => {
      const response = { 
        role: 'assistant' as const, 
        content: getQuantumResponse(chatMessage)
      };
      setChatHistory(prev => [...prev, response]);
    }, 1000);
  };

  const getQuantumResponse = (message: string): string => {
    const responses = [
      "Quantum superposition allows qubits to exist in multiple states simultaneously, which is fundamental to quantum computing's power.",
      "Entanglement is a quantum phenomenon where qubits become correlated in such a way that the state of one qubit instantly affects the other, regardless of distance.",
      "The Hadamard gate creates an equal superposition of |0⟩ and |1⟩ states, making it essential for many quantum algorithms.",
      "Quantum interference allows us to amplify correct answers and cancel out wrong ones in quantum algorithms.",
      "Decoherence is the loss of quantum properties due to interaction with the environment, which is why quantum computers need to be kept at extremely low temperatures."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const getGateSuggestions = () => {
    if (circuit.gates.length === 0) {
      return [
        { gate: 'H', reason: 'Start with Hadamard to create superposition' },
        { gate: 'X', reason: 'Initialize qubit to |1⟩ state' }
      ];
    }
    
    const lastGate = circuit.gates[circuit.gates.length - 1];
    const suggestions = [
      { gate: 'CX', reason: 'Create entanglement between qubits' },
      { gate: 'RZ', reason: 'Add phase rotation for fine control' },
      { gate: 'H', reason: 'Add more superposition' }
    ];
    
    return suggestions.filter(s => s.gate !== lastGate.name).slice(0, 3);
  };

  const getCircuitFixes = () => {
    const fixes = [];
    
    if (circuit.gates.length > 10) {
      fixes.push({
        type: 'optimization',
        description: 'Circuit depth is high. Consider gate cancellation.',
        action: 'Remove redundant gates'
      });
    }
    
    if (circuit.gates.filter(g => g.name === 'H').length > 3) {
      fixes.push({
        type: 'warning',
        description: 'Multiple H gates may cancel each other out.',
        action: 'Review H gate placement'
      });
    }
    
    if (circuit.gates.length === 0) {
      fixes.push({
        type: 'info',
        description: 'Empty circuit - add some gates to get started!',
        action: 'Add quantum gates'
      });
    }
    
    return fixes;
  };

  const tabs = [
    { id: 'chat', label: 'Quantum Chat', icon: Bot },
    { id: 'suggest', label: 'Gate Suggestor', icon: Lightbulb },
    { id: 'fix', label: 'Circuit Fixer', icon: Wrench }
  ];

  return (
    <div className={`bg-white dark:bg-gray-800 overflow-hidden ${className}`}>
      <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          AI Assistant
        </h2>
        
        <div className="flex space-x-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-xs">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      
      <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(100% - 120px)' }}>
        {activeTab === 'chat' && (
          <div className="space-y-4">
            <div className="h-64 overflow-y-auto space-y-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              {chatHistory.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <Bot className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Ask me anything about quantum computing!</p>
                </div>
              ) : (
                chatHistory.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs p-3 rounded-lg text-sm ${
                        message.role === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600'
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="flex space-x-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask about quantum computing..."
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleSendMessage}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
        
        {activeTab === 'suggest' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Based on your current circuit, here are some gate suggestions:
            </p>
            
            {getGateSuggestions().map((suggestion, index) => (
              <div
                key={index}
                className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-green-900 dark:text-green-300">
                      {suggestion.gate} Gate
                    </h3>
                    <p className="text-sm text-green-700 dark:text-green-400">
                      {suggestion.reason}
                    </p>
                  </div>
                  <button
                    onClick={() => onGateAdd({
                      id: Date.now().toString(),
                      name: suggestion.gate,
                      qubits: suggestion.gate === 'CX' ? [0, Math.min(1, numQubits - 1)] : [0]
                    })}
                    className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {activeTab === 'fix' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Circuit analysis and optimization suggestions:
            </p>
            
            {getCircuitFixes().map((fix, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  fix.type === 'optimization' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' :
                  fix.type === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' :
                  'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className={`font-medium ${
                      fix.type === 'optimization' ? 'text-blue-900 dark:text-blue-300' :
                      fix.type === 'warning' ? 'text-yellow-900 dark:text-yellow-300' :
                      'text-gray-900 dark:text-gray-300'
                    }`}>
                      {fix.action}
                    </h3>
                    <p className={`text-sm ${
                      fix.type === 'optimization' ? 'text-blue-700 dark:text-blue-400' :
                      fix.type === 'warning' ? 'text-yellow-700 dark:text-yellow-400' :
                      'text-gray-700 dark:text-gray-400'
                    }`}>
                      {fix.description}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    fix.type === 'optimization' ? 'bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200' :
                    fix.type === 'warning' ? 'bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200' :
                    'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                  }`}>
                    {fix.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};