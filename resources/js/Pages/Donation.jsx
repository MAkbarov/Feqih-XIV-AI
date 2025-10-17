import React from 'react';
import { Head, Link } from '@inertiajs/react';
import Icon from '@/Components/Icon';
import { useTheme } from '@/Components/ThemeProvider';

const Donation = ({ donation, theme, auth }) => {
    const { isDarkMode } = useTheme();
    const displaySettings = donation.display_settings || {};
    const paymentMethods = donation.payment_methods || {};
    const customTexts = donation.custom_texts || {};
    
    // Filter only enabled payment methods
    const enabledPaymentMethods = Object.entries(paymentMethods).filter(([key, method]) => method.enabled);
    
    const bgGradient = isDarkMode 
        ? 'linear-gradient(135deg, #111827 0%, #0b1220 100%)'
        : (theme.background_gradient || 'linear-gradient(135deg, #10b981 0%, #065f46 100%)');
    
    // Fix text color for dark mode - dark mode always uses white/light colors
    const textBase = isDarkMode ? '#ffffff' : (displaySettings.text_color || theme.text_color || '#1f2937');
    const secondaryTextBase = isDarkMode ? '#d1d5db' : '#6b7280';
    
    return (
        <>
            <Head title={donation.title || "Dəstək Ver"} />
            
            <div 
                className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'dark' : ''}`}
                style={{ 
                    background: bgGradient
                }}
            >
                <div className="container mx-auto px-4 py-8">
                    {/* Back to Home Button and Admin Edit */}
                    <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <Link 
                            href="/"
                            className="inline-flex items-center text-white hover:text-gray-200 transition-colors duration-200"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            {customTexts.back_to_home || 'Ana Səhifəyə Qayıt'}
                        </Link>
                        
                        {/* Admin Edit Button */}
                        {auth?.user?.role?.name === 'admin' && (
                            <Link 
                                href="/admin/donation"
                                className="inline-flex items-center px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg transition-all duration-200 backdrop-blur-sm border border-white border-opacity-30"
                            >
                                <Icon name="edit" size={16} className="mr-2" />
                                İanə Parametrlərini Redaktə Et
                            </Link>
                        )}
                    </div>
                    
                    {/* Main Donation Card */}
                    <div className="max-w-2xl mx-auto">
                        <div 
                            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700"
                            style={{
                                backgroundColor: displaySettings.background_color || (isDarkMode ? '#1f2937' : '#ffffff')
                            }}
                        >
                            {/* Header */}
                            <div 
                                className="px-8 py-6 text-center"
                                style={{
                                    backgroundColor: displaySettings.button_color || theme.primary_color || '#10b981'
                                }}
                            >
                                <div className="w-16 h-16 mx-auto mb-4 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <h1 
                                    className="text-3xl font-bold text-white"
                                >
                                    {donation.title}
                                </h1>
                            </div>
                            
                            {/* Content */}
                            <div className={`px-8 py-8 ${isDarkMode ? 'dark' : ''}`}>
                                <div 
                                    className={`prose prose-lg max-w-none mb-8 ${isDarkMode ? 'dark:prose-invert' : ''}`}
                                    style={isDarkMode ? {
                                        // Force white colors in dark mode
                                        color: '#ffffff !important',
                                        '--tw-prose-body': '#ffffff',
                                        '--tw-prose-headings': '#ffffff',
                                        '--tw-prose-lead': '#ffffff',
                                        '--tw-prose-links': '#ffffff',
                                        '--tw-prose-bold': '#ffffff',
                                        '--tw-prose-counters': '#ffffff',
                                        '--tw-prose-bullets': '#ffffff',
                                        '--tw-prose-hr': '#ffffff',
                                        '--tw-prose-quotes': '#ffffff',
                                        '--tw-prose-quote-borders': '#ffffff',
                                        '--tw-prose-captions': '#ffffff',
                                        '--tw-prose-code': '#ffffff',
                                        '--tw-prose-pre-code': '#ffffff',
                                        '--tw-prose-pre-bg': 'rgba(31, 41, 55, 0.5)',
                                        '--tw-prose-th-borders': '#ffffff',
                                        '--tw-prose-td-borders': '#ffffff'
                                    } : {
                                        // Light mode colors
                                        color: textBase,
                                        '--tw-prose-body': textBase,
                                        '--tw-prose-headings': textBase,
                                        '--tw-prose-lead': textBase,
                                        '--tw-prose-links': textBase,
                                        '--tw-prose-bold': textBase,
                                        '--tw-prose-counters': textBase,
                                        '--tw-prose-bullets': textBase,
                                        '--tw-prose-hr': textBase,
                                        '--tw-prose-quotes': textBase,
                                        '--tw-prose-quote-borders': textBase,
                                        '--tw-prose-captions': textBase,
                                        '--tw-prose-code': textBase,
                                        '--tw-prose-pre-code': textBase,
                                        '--tw-prose-pre-bg': 'rgba(255, 255, 255, 0.5)',
                                        '--tw-prose-th-borders': textBase,
                                        '--tw-prose-td-borders': textBase
                                    }}
                                    dangerouslySetInnerHTML={{ __html: donation.content }}
                                />
                                
                                {/* Donation Methods */}
                                {enabledPaymentMethods.length > 0 && (
                                    <div className="space-y-6">
                                        <h3 
                                            className="text-xl font-semibold mb-4"
                                            style={{ 
                                                color: isDarkMode ? '#ffffff' : textBase
                                            }}
                                        >
                                            {customTexts.payment_methods_title || 'Dəstək Üsulları'}
                                        </h3>
                                        
                                        <div className="grid md:grid-cols-2 gap-4">
                                            {enabledPaymentMethods.map(([key, method]) => {
                                                // Get icon based on payment method type
                                                const getMethodIcon = (methodKey) => {
                                                    switch(methodKey) {
                                                        case 'bank_transfer':
                                                            return (
                                                                <svg className="w-6 h-6 mr-3" style={{ color: displaySettings.button_color || theme.primary_color }} fill="currentColor" viewBox="0 0 20 20">
                                                                    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                                                                    <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                                                                </svg>
                                                            );
                                                        case 'crypto':
                                                            return (
                                                                <svg className="w-6 h-6 mr-3" style={{ color: displaySettings.button_color || theme.primary_color }} fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.736 6.979C9.208 6.193 9.696 6 10 6s.792.193 1.264.979a1 1 0 001.715-1.029C12.279 4.784 11.232 4 10 4s-2.279.784-2.979 1.95c-.285.475-.507 1-.67 1.55H6a1 1 0 000 2h.013a9.358 9.358 0 000 1H6a1 1 0 100 2h.351c.163.55.385 1.075.67 1.55C7.721 15.216 8.768 16 10 16s2.279-.784 2.979-1.95a1 1 0 10-1.715-1.029C10.792 13.807 10.304 14 10 14s-.792-.193-1.264-.979a4.265 4.265 0 01-.264-.521H10a1 1 0 100-2H8.472a7.375 7.375 0 010-1H10a1 1 0 100-2H8.472c.08-.185.167-.36.264-.521z" clipRule="evenodd" />
                                                                </svg>
                                                            );
                                                        case 'paypal':
                                                            return (
                                                                <svg className="w-6 h-6 mr-3" style={{ color: displaySettings.button_color || theme.primary_color }} fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                                                </svg>
                                                            );
                                                        case 'contact':
                                                            return (
                                                                <svg className="w-6 h-6 mr-3" style={{ color: displaySettings.button_color || theme.primary_color }} fill="currentColor" viewBox="0 0 20 20">
                                                                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                                                </svg>
                                                            );
                                                        default:
                                                            return (
                                                                <svg className="w-6 h-6 mr-3" style={{ color: displaySettings.button_color || theme.primary_color }} fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                                </svg>
                                                            );
                                                    }
                                                };
                                                
                                                return (
                                                    <div 
                                                        key={key}
                                                        className="p-4 border-2 rounded-lg hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                                                        style={{
                                                            borderColor: displaySettings.button_color || theme.primary_color || '#10b981'
                                                        }}
                                                    >
                                                        <div className="flex items-center mb-2">
                                                            {getMethodIcon(key)}
                                                            <h4 
                                                                className="font-semibold"
                                                                style={{ 
                                                                    color: isDarkMode ? '#ffffff' : textBase
                                                                }}
                                                            >
                                                                {method.title}
                                                            </h4>
                                                        </div>
                                                        <p 
                                                            className="text-sm"
                                                            style={{ 
                                                                color: isDarkMode ? '#ffffff' : textBase
                                                            }}
                                                        >
                                                            {method.description}
                                                        </p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                                
                                {/* Thank you message */}
                                <div 
                                    className="mt-8 p-4 rounded-lg text-center"
                                    style={{
                                        backgroundColor: `${displaySettings.button_color || theme.primary_color}20`
                                    }}
                                >
                                    <p 
                                        className="text-sm font-medium"
                                        style={{ 
                                            color: isDarkMode ? '#ffffff' : textBase
                                        }}
                                    >
                                        {customTexts.thank_you_message || '🙏 Hər hansı məbləğdəki dəstəyinizə görə təşəkkürlər!'} <br />
                                        {customTexts.thank_you_description || 'Sizin köməyiniz sayəsində xidmətimizi daha da yaxşılaşdırırıq.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Donation;