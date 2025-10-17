import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '@/Components/Icon';
import { useTheme } from '@/Components/ThemeProvider';

const ConfirmModal = ({ 
  isOpen, 
  onConfirm, 
  onCancel, 
  title = 'Təsdiq edin',
  message,
  confirmText = 'Bəli',
  cancelText = 'Xeyr',
  confirmButtonColor = 'bg-green-500 hover:bg-green-600',
  cancelButtonColor = 'bg-gray-500 hover:bg-gray-600',
  icon = 'warning',
  iconColor = '#f59e0b'
}) => {
  const { isDarkMode } = useTheme();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={`relative w-full max-w-md mx-auto rounded-2xl shadow-2xl border ${
              isDarkMode 
                ? 'bg-gray-800/95 border-gray-700' 
                : 'bg-white/95 border-gray-200'
            } backdrop-blur-xl`}
          >
            {/* Header */}
            <div className="p-6 pb-4">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
                  <Icon name={icon} size={24} color={iconColor} />
                </div>
                <div>
                  <h3 className={`text-lg font-semibold ${
                    isDarkMode ? 'text-gray-100' : 'text-gray-900'
                  }`}>
                    {title}
                  </h3>
                </div>
              </div>
            </div>

            {/* Message */}
            <div className="px-6 pb-6">
              <div className={`text-sm leading-relaxed whitespace-pre-line ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {message}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 p-6 pt-0">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onCancel}
                className={`flex-1 px-4 py-3 rounded-xl font-medium transition-colors ${cancelButtonColor} text-white shadow-lg hover:shadow-xl`}
              >
                {cancelText}
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onConfirm}
                className={`flex-1 px-4 py-3 rounded-xl font-medium transition-colors ${confirmButtonColor} text-white shadow-lg hover:shadow-xl`}
              >
                {confirmText}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;