import React from 'react';
import { useTheme } from '@/Components/ThemeProvider';

const TypingDots = ({ className = '', chatbotName = 'AI Assistant' }) => {
  const { theme } = useTheme();
  const primaryColor = theme?.primary_color || '#6366f1';
  const textColor = theme?.text_color || '#1f2937';
  
  return (
    <div className={`inline-flex items-center space-x-3 px-4 py-2 rounded-full ${className}`}
         style={{ 
           backgroundColor: `${primaryColor}10`
         }}>
      <span className="text-sm font-semibold" style={{ color: textColor }}>
        {chatbotName} yazır
      </span>
      <div className="flex space-x-1.5">
        <div 
          className="w-2.5 h-2.5 rounded-full animate-pulse"
          style={{
            backgroundColor: primaryColor,
            animation: 'typingDot1 1.8s infinite ease-in-out'
          }}
        ></div>
        <div 
          className="w-2.5 h-2.5 rounded-full animate-pulse"
          style={{
            backgroundColor: primaryColor,
            animation: 'typingDot2 1.8s infinite ease-in-out'
          }}
        ></div>
        <div 
          className="w-2.5 h-2.5 rounded-full animate-pulse"
          style={{
            backgroundColor: primaryColor,
            animation: 'typingDot3 1.8s infinite ease-in-out'
          }}
        ></div>
      </div>
      <style jsx>{`
        @keyframes typingDot1 {
          0%, 60%, 100% { transform: scale(1); opacity: 0.7; }
          30% { transform: scale(1.2); opacity: 1; }
        }
        @keyframes typingDot2 {
          0%, 60%, 100% { transform: scale(1); opacity: 0.7; }
          45% { transform: scale(1.2); opacity: 1; }
        }
        @keyframes typingDot3 {
          0%, 60%, 100% { transform: scale(1); opacity: 0.7; }
          60% { transform: scale(1.2); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default TypingDots;
