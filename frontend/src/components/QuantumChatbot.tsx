import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';
import { Circuit } from '../types/quantum'; // Assuming Circuit type is defined here

interface QuantumChatbotProps {
  circuit: Circuit;
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
        setMessages((prevMessages) => [
          ...prevMessages,
          { role: 'assistant', content: `Error: ${data.error || 'Failed to get response from chatbot.'}` }
        ]);
        console.error("Chatbot API error:", data.error);
      }
    } catch (error) {
      console.error("Failed to connect to chatbot backend:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        { role: 'assistant', content: 'Error: Could not connect to the quantum chatbot service.' }
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
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <MessageSquare className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Quantum Chatbot
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          title="Close Chatbot"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>Ask me anything about quantum computing!</p>
            <p className="text-sm mt-2">e.g., "What is superposition?", "Explain Grover's algorithm."</p>
          </div>
        )}

        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[70%] p-3 rounded-lg ${
                msg.role === 'user' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[70%] p-3 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white">
              <div className="flex items-center">
                <span className="animate-pulse mr-2">...</span> Thinking
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} /> {/* Scroll target */}
      </div>
      
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center space-x-3">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your question..."
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isLoading}
        />
        <button
          onClick={handleSendMessage}
          className={`p-2 rounded-full ${
            inputMessage.trim() === '' || isLoading
              ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          } transition-colors`}
          disabled={inputMessage.trim() === '' || isLoading}
          title="Send Message"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
