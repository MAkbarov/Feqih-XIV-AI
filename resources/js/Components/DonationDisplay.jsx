import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/Components/ThemeProvider';

const DonationDisplay = ({ className = '' }) => {
    const { isDarkMode } = useTheme();
    const [donationSettings, setDonationSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);
    

    useEffect(() => {
        // Check if donation was permanently dismissed
        const dismissedUntil = localStorage.getItem('donation_dismissed_until');
        const currentTime = Date.now();
        
        if (dismissedUntil && currentTime < parseInt(dismissedUntil)) {
            setIsDismissed(true);
            setLoading(false);
            return;
        }
        
        fetchDonationSettings();
    }, []);

    const fetchDonationSettings = async () => {
        try {
            const response = await fetch('/api/donation-settings');
            const data = await response.json();
            
            if (data && data.enabled) {
                setDonationSettings(data);
                
                // Auto show modal after 2 seconds
                setTimeout(() => {
                    setShowModal(true);
                }, 2000);
            }
        } catch (error) {
            console.error('Error fetching donation settings:', error);
        } finally {
            setLoading(false);
        }
    };
    
    const handleClose = () => {
        setIsDismissed(true);
        setShowModal(false);
    };
    
    const handlePermanentDismiss = () => {
        const oneWeekFromNow = Date.now() + (7 * 24 * 60 * 60 * 1000); // 1 week
        localStorage.setItem('donation_dismissed_until', oneWeekFromNow.toString());
        setIsDismissed(true);
        setShowModal(false);
    };

    
    if (loading || !donationSettings || isDismissed) {
        return null;
    }

    // Always show modal
    return (
        <AnimatePresence>
            {showModal && (
                    <motion.div 
                        className="fixed inset-0 backdrop-blur-lg flex items-center justify-center z-50 p-4 modal-overlay"
                        style={{
                            background: isDarkMode 
                                ? 'linear-gradient(135deg, rgba(31, 41, 55, 0.85) 0%, rgba(17, 24, 39, 0.9) 100%) !important'
                                : 'linear-gradient(135deg, rgba(249, 250, 251, 0.85) 0%, rgba(255, 255, 255, 0.9) 100%) !important'
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        onClick={() => setShowModal(false)}
                    >
                        <motion.div 
                            className={`max-w-md w-full rounded-3xl shadow-2xl relative overflow-hidden border-2 backdrop-blur-md modal-content donation-modal ${isDarkMode ? 'dark' : ''} ${
                                isDarkMode ? 'border-gray-600/50' : 'border-gray-200/50'
                            }`}
                            style={{ 
                                background: donationSettings.background_color || (isDarkMode 
                                    ? 'linear-gradient(135deg, rgba(31, 41, 55, 0.95) 0%, rgba(17, 24, 39, 0.98) 100%) !important'
                                    : 'linear-gradient(135deg, rgba(249, 250, 251, 0.95) 0%, rgba(255, 255, 255, 0.98) 100%) !important'
                                ),
                                color: donationSettings.text_color || (isDarkMode ? '#ffffff !important' : '#333333 !important'),
                                backdropFilter: 'blur(20px)',
                                boxShadow: isDarkMode 
                                    ? '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)'
                                    : '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)'
                            }}
                            initial={{ scale: 0.8, opacity: 0, y: 50, rotateX: 15 }}
                            animate={{ scale: 1, opacity: 1, y: 0, rotateX: 0 }}
                            exit={{ scale: 0.8, opacity: 0, y: 50, rotateX: 15 }}
                            transition={{ 
                                type: "spring", 
                                damping: 25, 
                                stiffness: 300,
                                duration: 0.5
                            }}
                            whileHover={{ scale: 1.02, y: -5 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Close button */}
                            <motion.button 
                                onClick={handleClose}
                                className={`absolute top-5 right-5 w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 z-10 text-xl font-medium ${
                                    isDarkMode 
                                        ? 'bg-gray-700/70 hover:bg-gray-600/80 text-gray-300 hover:text-white border border-gray-600/50' 
                                        : 'bg-gray-100/70 hover:bg-gray-200/80 text-gray-600 hover:text-gray-800 border border-gray-200/50'
                                }`}
                                whileHover={{ scale: 1.1, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                            >
                                ×
                            </motion.button>
                            
                            {/* Content */}
                            <div className="p-8">
                                <div className="mb-6">
                                    <motion.h3 
                                        className="text-2xl font-bold mb-6 pr-10 leading-tight" 
                                        style={{ color: donationSettings.text_color || (isDarkMode ? '#ffffff' : '#333333') }}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 }}
                                    >
                                        {donationSettings.title}
                                    </motion.h3>
                                    <motion.div 
                                        className={`text-base leading-relaxed prose max-w-none ${isDarkMode ? 'dark:prose-invert' : ''}`}
                                        style={{ 
                                            color: donationSettings.text_color || (isDarkMode ? '#ffffff' : '#333333'),
                                            '--tw-prose-body': donationSettings.text_color || (isDarkMode ? '#ffffff' : '#333333'),
                                            '--tw-prose-headings': donationSettings.text_color || (isDarkMode ? '#ffffff' : '#333333'),
                                            '--tw-prose-bold': donationSettings.text_color || (isDarkMode ? '#ffffff' : '#333333'),
                                            '--tw-prose-links': donationSettings.text_color || (isDarkMode ? '#ffffff' : '#333333')
                                        }}
                                        dangerouslySetInnerHTML={{ __html: donationSettings.content }}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                    />
                                </div>
                                
                                {/* Buttons */}
                                <motion.div 
                                    className="space-y-4"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <div className="flex gap-4">
                                        <motion.div className="flex-1">
                                            <Link
                                                href="/donation"
                                                className="w-full block px-6 py-4 rounded-xl font-bold text-white text-center transition-all duration-300 shadow-lg"
                                                style={{ backgroundColor: donationSettings.button_color || '#3b82f6' }}
                                                onMouseEnter={(e) => {
                                                    e.target.style.filter = 'brightness(110%)';
                                                    e.target.style.transform = 'translateY(-2px)';
                                                    e.target.style.boxShadow = '0 20px 40px rgba(0,0,0,0.2)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.target.style.filter = 'brightness(100%)';
                                                    e.target.style.transform = 'translateY(0px)';
                                                    e.target.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
                                                }}
                                            >
                                                💝 Dəstək Ol
                                            </Link>
                                        </motion.div>
                                        <motion.button
                                            className={`px-6 py-4 rounded-xl font-medium transition-all duration-300 hover:shadow-md backdrop-blur-sm ${
                                                isDarkMode
                                                    ? 'text-gray-300 border border-gray-600/60 hover:bg-gray-700/60 hover:border-gray-500'
                                                    : 'text-gray-600 border border-gray-300/60 hover:bg-gray-50/60 hover:border-gray-400'
                                            }`}
                                            onClick={handleClose}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            Bağla
                                        </motion.button>
                                    </div>
                                    <motion.button
                                        className={`w-full text-sm underline transition-colors py-2 rounded-lg ${
                                            isDarkMode
                                                ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/30'
                                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/30'
                                        }`}
                                        onClick={handlePermanentDismiss}
                                        whileHover={{ scale: 1.02 }}
                                    >
                                        1 həftə göstərmə
                                    </motion.button>
                                </motion.div>
                            </div>
                        </motion.div>
                    </motion.div>
            )}
        </AnimatePresence>
    );
};

export default DonationDisplay;