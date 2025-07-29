import React, { useState } from 'react';
import { X, ArrowRight, ArrowLeft } from 'lucide-react';

interface TutorialTourProps {
  onComplete: () => void;
}

export const TutorialTour: React.FC<TutorialTourProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Welcome to Quantum Algorithm Simulator!",
      content: "This tutorial will guide you through the key features of our quantum computing platform.",
      position: "center"
    },
    {
      title: "Gate Library",
      content: "Browse and select quantum gates from our comprehensive library. Drag gates to the canvas to build your circuit.",
      position: "left"
    },
    {
      title: "Rotation Gates & Angles",
      content: "New! When you add a Rotation (RX, RY, RZ, U3) gate to the canvas, a pop-up will appear allowing you to set its precise angle. You can also click on existing rotation gates to adjust their angles.",
      position: "center"
    },
    {
      title: "Pre-built Algorithms",
      content: "Explore the 'Algorithms' tab in the sidebar. Selecting an algorithm will now clear your current circuit and load the new algorithm onto a fresh canvas, automatically adjusting the number of qubits.",
      position: "left"
    },
    {
      title: "Circuit Canvas",
      content: "The main workspace where you construct your quantum circuits. Drop gates onto qubit wires to build complex algorithms.",
      position: "center"
    },
    {
      title: "Backend Selection",
      content: "Choose from multiple quantum backends including local simulators and real quantum hardware.",
      position: "top"
    },
    {
      title: "AI Assistant",
      content: "Get help from our AI-powered features: quantum chatbot, gate suggestions, and circuit optimization.",
      position: "right"
    },
    {
      title: "Circuit Insights",
      content: "Monitor your circuit's complexity, depth, and quantum cost in real-time.",
      position: "right"
    },
    {
      title: "You're Ready!",
      content: "Start building amazing quantum algorithms. Remember to check out the code view, export features, and experiment with custom gates!",
      position: "center"
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    // We use sessionStorage here to make the tutorial reappear on a fresh server start (new session)
    // but not on a simple page refresh within the same session.
    sessionStorage.setItem('quantum-simulator-tutorial-seen', 'true');
    onComplete();
  };

  const currentStepData = steps[currentStep];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {currentStepData.title}
          </h2>
          <button
            onClick={handleComplete}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {currentStepData.content}
          </p>
          
          <div className="flex items-center space-x-2 mb-4">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full ${
                  index === currentStep
                    ? 'bg-blue-500'
                    : index < currentStep
                    ? 'bg-green-500'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>
          
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Step {currentStep + 1} of {steps.length}
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              currentStep === 0
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>
          
          <button
            onClick={handleNext}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <span>{currentStep === steps.length - 1 ? 'Finish' : 'Next'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
