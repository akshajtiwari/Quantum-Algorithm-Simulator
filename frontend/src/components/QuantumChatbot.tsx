import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Loader2 } from 'lucide-react'; 
// import { Circuit } from '../types/quantum'; // Circuit import removed as it's no longer a direct prop

interface QuantumChatbotProps {
  // circuit: Circuit; // Circuit prop removed
  onClose: () => void;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const QuantumChatbot: React.FC<QuantumChatbotProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to the bottom of the chat when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (inputMessage.trim() === '') return;

    const newUserMessage: ChatMessage = { role: 'user', content: inputMessage.trim() };
    const newMessages = [...messages, newUserMessage];
    setMessages(newMessages);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:5000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          message: newUserMessage.content,
          // Send only content for history, as DeepSeek expects simple role/content objects
          history: newMessages.slice(0, -1).map(msg => ({ role: msg.role, content: msg.content })) 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessages((prevMessages) => [
          ...prevMessages,
          { role: 'assistant', content: data.response }
        ]);
      } else {
        // Handle non-OK responses: filter out sensitive info like API keys
        let errorMessage = data.error || 'Failed to get response from chatbot.';
        // Simple regex to remove API key pattern from the error message
        errorMessage = errorMessage.replace(/key=[\w-]+/, 'key=***REDACTED***');
        errorMessage = errorMessage.replace(/AIzaSy[A-Za-z0-9-_]{35}/, '***REDACTED_API_KEY***'); // More specific pattern for Gemini API keys

        setMessages((prevMessages) => [
          ...prevMessages,
          { role: 'assistant', content: `Error: ${errorMessage}` }
        ]);
        console.error("Chatbot API error:", data.error);
      }
    } catch (error: any) { // Explicitly type error as any for easier access to message property
      console.error("Failed to connect to chatbot backend:", error);
      // Provide a generic error message for network/connection issues
      let displayError = 'Could not connect to the quantum chatbot service. Please check your network connection and backend server.';
      if (error.message && error.message.includes('Failed to fetch')) {
        displayError = 'Could not connect to the quantum chatbot service. Ensure the backend server is running.';
      }
      setMessages((prevMessages) => [
        ...prevMessages,
        { role: 'assistant', content: `Error: ${displayError}` }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSendMessage();
    }
  };

  return (
    <div className="h-[90vh] max-h-[700px] w-full max-w-3xl flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 rounded-t-xl">
        <div className="flex items-center space-x-3">
          <MessageSquare className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Quantum Chatbot
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
          title="Close Chatbot"
        >
          <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-gray-100 dark:bg-gray-850">
        {messages.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-70" />
            <p className="text-lg font-medium">Ask me anything about quantum computing!</p>
            <p className="text-sm mt-2">e.g., "What is superposition?", "Explain Grover's algorithm."</p>
          </div>
        )}

        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[75%] p-3 rounded-xl shadow-sm break-words ${ 
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-br-none' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[75%] p-3 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white">
              <div className="flex items-center">
                <Loader2 className="animate-spin w-4 h-4 mr-2 text-gray-500" /> Thinking...
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} /> {/* Scroll target */}
      </div>
      
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center space-x-3 bg-gray-50 dark:bg-gray-700 rounded-b-xl">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your question..."
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
          disabled={isLoading}
        />
        <button
          onClick={handleSendMessage}
          className={`p-2 rounded-full shadow-md ${
            inputMessage.trim() === '' || isLoading
              ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 transform hover:scale-105'
          } transition-all duration-200`}
          disabled={inputMessage.trim() === '' || isLoading}
          title="Send Message"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
