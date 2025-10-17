import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from './Icon';
import { useTheme } from './ThemeProvider';

const GuestTermsModal = ({ isOpen, onAccept, onReject, siteName = 'XIV AI' }) => {
  const { theme } = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [adminTerms, setAdminTerms] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAdminTerms = async () => {
    try {
      const response = await fetch('/api/guest-terms');
      const data = await response.json();
      setAdminTerms(data);
    } catch (error) {
      console.warn('Failed to fetch admin terms, using fallback');
      setAdminTerms({
        title: 'İstifadə Şərtləri',
        content: '<p>İstifadə şərtləri yüklənmədi.</p>'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !adminTerms) {
      fetchAdminTerms();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          {/* Arxa fon overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={() => onReject && onReject()}
          />

          {/* Modal məzmunu */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 25 }}
            className="relative z-50 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700"
          >
            {/* Modal başlığı */}
            <div 
              className="p-6 text-white"
              style={{ 
                background: theme?.primary_color 
                  ? `linear-gradient(135deg, ${theme.primary_color} 0%, ${theme.secondary_color || theme.primary_color} 100%)`
                  : 'linear-gradient(135deg, #10b981 0%, #065f46 100%)'
              }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Icon name="shield_check" size={24} color="white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">
                    {isLoading ? 'İstifadə Şərtləri' : (adminTerms?.title || 'İstifadə Şərtləri')}
                  </h2>
                  <p className="text-blue-100 text-sm">{siteName}</p>
                </div>
              </div>
            </div>

            {/* Modal məzmunu */}
            <div className="p-6 overflow-y-auto max-h-96">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <span className="ml-3 text-gray-600 dark:text-gray-400">Yüklənir...</span>
                </div>
              ) : (
                <div className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                  <div 
                    className="prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: adminTerms?.content || '<p>İstifadə şərtləri yüklənmədi.</p>' }}
                  />
                </div>
              )}
            </div>

            {/* Modal düymələri */}
            <div 
              className="p-6 border-t border-gray-200 dark:border-gray-600 flex gap-3"
              style={{ 
                background: theme?.primary_color 
                  ? `linear-gradient(135deg, ${theme.primary_color}15 0%, ${theme.secondary_color || theme.primary_color}15 100%)`
                  : 'linear-gradient(135deg, #10b98115 0%, #065f4615 100%)'
              }}
            >
              <button
                onClick={onReject}
                className="flex-1 px-4 py-3 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors flex items-center justify-center gap-2"
              >
                <Icon name="close" size={16} />
                <span>Rədd et</span>
              </button>
              <button
                onClick={onAccept}
                className="flex-1 px-4 py-3 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                style={{
                  background: theme?.primary_color 
                    ? `linear-gradient(135deg, ${theme.primary_color} 0%, ${theme.secondary_color || theme.primary_color} 100%)`
                    : 'linear-gradient(135deg, #10b981 0%, #065f46 100%)',
                  filter: 'brightness(1)',
                  ':hover': { filter: 'brightness(1.1)' }
                }}
                onMouseEnter={(e) => e.target.style.filter = 'brightness(1.1)'}
                onMouseLeave={(e) => e.target.style.filter = 'brightness(1)'}          >
                <Icon name="shield_check" size={16} />
                <span>Qəbul edirəm</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default GuestTermsModal;