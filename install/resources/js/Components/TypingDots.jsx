import React from 'react';

const TypingDots = ({ className = '', chatbotName = 'AI Assistant' }) => {
  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">{chatbotName}</span>
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
      </div>
    </div>
  );
};

export default TypingDots;