import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from './Icon';
import { useTheme } from './ThemeProvider';

const DeleteChatModal = ({ isOpen, onConfirm, onCancel, chatTitle = '', siteName = '' }) => {
  const { theme } = useTheme();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        {/* Arxa fon overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-md"
          onClick={onCancel}
        />

        {/* Modal məzmunu */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 25 }}
          className="relative z-50 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden border border-gray-200 dark:border-gray-700"
        >
          {/* Modal başlığı */}
          <div 
            className="p-6 text-white"
            style={{ 
              background: theme?.primary_color 
                ? `linear-gradient(135deg, ${theme.primary_color} 0%, ${theme.secondary_color || theme.primary_color} 100%)`
                : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
            }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Icon name="warning" size={24} color="white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">
                  Söhbəti Sil
                </h2>
                <p className="text-blue-100 text-sm">{siteName}</p>
              </div>
            </div>
          </div>

          {/* Modal məzmunu */}
          <div className="p-6">
            <div className="text-gray-700 dark:text-gray-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <Icon name="warning" size={24} color="#ef4444" />
                </div>
                <div>
                  <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                    Bu söhbəti silmək istədiyinizdən əminsiz?
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Bu əməl geri alına bilməz.
                  </p>
                </div>
              </div>
              
              {chatTitle && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Silinəcək söhbət:</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                    "{chatTitle}"
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Modal düymələri */}
          <div 
            className="p-6 border-t border-gray-200 dark:border-gray-600 flex gap-3"
            style={{ 
              background: theme?.primary_color 
                ? `linear-gradient(135deg, ${theme.primary_color}10 0%, ${theme.secondary_color || theme.primary_color}10 100%)`
                : 'linear-gradient(135deg, #ef444415 0%, #dc262615 100%)'
            }}
          >
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-3 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors flex items-center justify-center gap-2"
            >
              <Icon name="close" size={16} />
              <span>Ləğv et</span>
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-3 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl bg-red-500 hover:bg-red-600"
            >
              <Icon name="delete" size={16} />
              <span>Sil</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DeleteChatModal;