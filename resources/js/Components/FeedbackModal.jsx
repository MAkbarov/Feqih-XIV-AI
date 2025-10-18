import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '@/Components/Icon';
import { useTheme } from '@/Components/ThemeProvider';

const TAGS = [
  'Zərərli / Təhlükəli',
  'Saxta',
  'Yararsız',
  'Digər'
];

export default function FeedbackModal({ isOpen, onClose, onSubmit, messagePreview = '' }) {
  const { theme } = useTheme();
  const [selected, setSelected] = useState([]);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelected([]);
      setComment('');
      try { document.body.style.overflow = 'hidden'; } catch {}
    } else {
      try { document.body.style.overflow = ''; } catch {}
    }
    return () => { try { document.body.style.overflow = ''; } catch {} };
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleTag = (t) => {
    setSelected(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  };

  const submit = () => {
    const payload = {
      tags: selected,
      comment: comment?.trim() || ''
    };
    // Call parent submit and close immediately for instant UX
    if (onSubmit) onSubmit(payload);
    if (onClose) onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.25, type: 'spring', stiffness: 260, damping: 22 }}
            role="dialog"
            aria-modal="true"
            className="relative z-50 w-full max-w-lg mx-auto rounded-2xl overflow-hidden shadow-2xl border border-white/20 dark:border-gray-700"
            style={{ background: '#0b0b0b00' }}
          >
            {/* Header gradient */}
            <div
              className="p-5 text-white"
              style={{
                background: theme?.primary_color
                  ? `linear-gradient(135deg, ${theme.primary_color} 0%, ${theme.secondary_color || theme.primary_color} 100%)`
                  : 'linear-gradient(135deg, #10b981 0%, #065f46 100%)'
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Icon name="warning" size={22} color="white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">Feedback</h2>
                    <p className="text-blue-100 text-xs">Geribildirişinizi paylaşın</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors" aria-label="Bağla">
                  <Icon name="close" size={18} color="#fff" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 bg-white dark:bg-gray-800">
              {/* Quick tags */}
              <div className="flex flex-wrap gap-2 mb-3">
                {TAGS.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleTag(t)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      selected.includes(t)
                        ? 'text-white shadow-md'
                        : 'text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700/60'
                    }`}
                    style={selected.includes(t)
                      ? { background: theme?.primary_color
                          ? `linear-gradient(135deg, ${theme.primary_color} 0%, ${theme.secondary_color || theme.primary_color} 100%)`
                          : 'linear-gradient(135deg, #10b981 0%, #065f46 100%)',
                          borderColor: 'transparent'
                        }
                      : { borderColor: 'rgba(0,0,0,0.08)' }}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Message preview */}
              {messagePreview && (
                <div className="mb-3 text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/40 p-3 rounded-lg max-h-28 overflow-auto">
                  <div className="font-semibold mb-1">Mesaj:</div>
                  <div className="whitespace-pre-wrap">{messagePreview}</div>
                </div>
              )}

              {/* Comment box */}
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1 block">Şərh</label>
              <textarea
                rows={4}
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Qısa izah yazın..."
                className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900/60 text-gray-800 dark:text-gray-100 p-3 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>

            {/* Footer */}
            <div
              className="p-5 flex gap-3 border-t border-gray-200 dark:border-gray-700 bg-gradient-to-r"
              style={{
                background: theme?.primary_color
                  ? `linear-gradient(135deg, ${theme.primary_color}15 0%, ${theme.secondary_color || theme.primary_color}15 100%)`
                  : 'linear-gradient(135deg, #10b98115 0%, #065f4615 100%)'
              }}
            >
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Ləğv et
              </button>
              <button
                type="button"
                onClick={submit}
                className="flex-1 px-4 py-3 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
                style={{
                  background: theme?.primary_color
                    ? `linear-gradient(135deg, ${theme.primary_color} 0%, ${theme.secondary_color || theme.primary_color} 100%)`
                    : 'linear-gradient(135deg, #10b981 0%, #065f46 100%)'
                }}
              >
                Göndər
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}