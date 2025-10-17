import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/Components/ToastProvider';
import Icon from '@/Components/Icon';
import axios from 'axios';

const UserBackgroundModal = ({ isOpen, onClose, isAuthenticated = false }) => {
    const [activeTab, setActiveTab] = useState('color');
    const [settings, setSettings] = useState({
        type: 'solid',
        color: '#f3f4f6',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        image: null
    });
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    // Real-time preview function for color and gradient changes
    const applyColorPreview = (previewType, previewValue) => {
        const chatContainer = document.querySelector('#chat-container, [data-chat-background]');
        if (chatContainer && previewValue) {
            console.log('Applying color preview:', { type: previewType, value: previewValue });
            
            // Clear all background properties first with !important
            chatContainer.style.setProperty('background-image', '', 'important');
            chatContainer.style.setProperty('background-size', '', 'important');
            chatContainer.style.setProperty('background-position', '', 'important');
            chatContainer.style.setProperty('background-repeat', '', 'important');
            chatContainer.style.setProperty('background-color', '', 'important');
            chatContainer.style.setProperty('background', '', 'important');
            chatContainer.style.setProperty('background-attachment', '', 'important');
            chatContainer.style.setProperty('background-origin', '', 'important');
            chatContainer.style.setProperty('background-clip', '', 'important');
            
            // Add a small delay to ensure React updates don't override
            setTimeout(() => {
                if (previewType === 'solid') {
                    // Apply solid color with !important to ensure persistence and clear all gradient properties
                    chatContainer.style.setProperty('background-color', previewValue, 'important');
                    chatContainer.style.setProperty('background-image', 'none', 'important');
                    chatContainer.style.setProperty('background', 'none', 'important');
                    chatContainer.style.setProperty('background-size', 'auto', 'important');
                    chatContainer.style.setProperty('background-position', '0% 0%', 'important');
                    chatContainer.style.setProperty('background-repeat', 'repeat', 'important');
                    chatContainer.style.setProperty('background-attachment', 'scroll', 'important');
                    chatContainer.style.setProperty('background-origin', 'padding-box', 'important');
                    chatContainer.style.setProperty('background-clip', 'border-box', 'important');
                    console.log('Applied solid color preview:', previewValue);
                    
                    // Verify application
                    setTimeout(() => {
                        console.log('Solid color verification:', {
                            backgroundColor: chatContainer.style.backgroundColor,
                            background: chatContainer.style.background,
                            backgroundImage: chatContainer.style.backgroundImage,
                            computedStyles: window.getComputedStyle(chatContainer).background
                        });
                    }, 100);
                } else if (previewType === 'gradient') {
                    // Apply gradient with !important to ensure persistence
                    chatContainer.style.setProperty('background', previewValue, 'important');
                    chatContainer.style.setProperty('background-color', '', 'important');
                    console.log('Applied gradient preview:', previewValue);
                }
                
                // Dispatch event to notify other components
                window.dispatchEvent(new CustomEvent('backgroundChanged', {
                    detail: { 
                        type: previewType, 
                        background: previewValue
                    }
                }));
            }, 10); // Small delay to prevent React state conflicts
        }
    };

    // Load current settings from cookie or user data
    useEffect(() => {
        if (isOpen) {
            loadCurrentSettings();
        }
    }, [isOpen, isAuthenticated]);

    // Apply background when settings are loaded from API
    useEffect(() => {
        // Only apply background when we have valid settings and user is authenticated
        // This ensures the background is applied when API loads settings
        if (settings && settings.type && isAuthenticated) {
            console.log('Settings changed, applying background:', settings.type);
            applyBackground();
        }
    }, [settings.type, settings.color, settings.gradient, settings.image, isAuthenticated]);

    // Apply preview when modal opens with loaded settings
    useEffect(() => {
        if (isOpen && settings && settings.type) {
            console.log('Modal opened, applying preview for type:', settings.type);
            // Apply real-time preview based on current settings
            if (settings.type === 'solid') {
                applyColorPreview('solid', settings.color || '#f3f4f6');
            } else if (settings.type === 'gradient') {
                applyColorPreview('gradient', settings.gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)');
            } else if (settings.type === 'image' && settings.image) {
                applyBackgroundPreview(settings);
            }
        }
    }, [isOpen, settings.type, settings.color, settings.gradient, settings.image]);

    const loadCurrentSettings = async () => {
        console.log('loadCurrentSettings called, isAuthenticated:', isAuthenticated);
        try {
            let loadedSettings = null;
            
            if (isAuthenticated) {
                // Load from user data
                console.log('Loading settings from API...');
                const response = await axios.get('/api/user/background-settings');
                console.log('API response:', response.data);
                
                if (response.data.success) {
                    loadedSettings = response.data.settings;
                    console.log('Loaded settings from API:', loadedSettings);
                    setSettings(loadedSettings);
                } else {
                    console.warn('API returned success=false');
                    // Set default settings
                    loadedSettings = {
                        type: 'solid',
                        color: '#f3f4f6',
                        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        image: null,
                        imageSize: 'cover',
                        imagePosition: 'center'
                    };
                    setSettings(loadedSettings);
                }
            } else {
                // Load from cookie for guests
                console.log('Loading settings from cookies...');
                const cookieSettings = getCookie('guest_background_settings');
                console.log('Cookie settings:', cookieSettings);
                
                if (cookieSettings) {
                    try {
                        loadedSettings = JSON.parse(cookieSettings);
                        console.log('Parsed cookie settings:', loadedSettings);
                        setSettings(loadedSettings);
                    } catch (e) {
                        console.warn('Failed to parse guest background settings:', e);
                        loadedSettings = {
                            type: 'solid',
                            color: '#f3f4f6',
                            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            image: null
                        };
                        setSettings(loadedSettings);
                    }
                } else {
                    // No settings found, use defaults
                    loadedSettings = {
                        type: 'solid',
                        color: '#f3f4f6',
                        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        image: null
                    };
                    setSettings(loadedSettings);
                }
            }
            
            // Set the active tab based on the loaded settings TYPE (not image existence)
            console.log('Setting active tab based on settings type:', loadedSettings?.type);
            if (loadedSettings && loadedSettings.type === 'image') {
                console.log('Setting active tab to image because type is image');
                setActiveTab('image');
            } else {
                console.log('Setting active tab to color because type is solid/gradient:', loadedSettings?.type);
                setActiveTab('color');
            }
        } catch (error) {
            console.error('Error loading background settings:', error);
            // Set default settings on error
            const defaultSettings = {
                type: 'solid',
                color: '#f3f4f6',
                gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                image: null
            };
            setSettings(defaultSettings);
            setActiveTab('color');
        }
    };

    const getCookie = (name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    };

    const setCookie = (name, value, days) => {
        const expires = new Date();
        expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
    };

    const handleSave = async () => {
        console.log('handleSave called with settings:', settings);
        setLoading(true);
        
        try {
            if (isAuthenticated) {
                // Save to database
                const saveData = {
                    type: settings.type,
                    color: settings.type === 'solid' ? settings.color : null,
                    gradient: settings.type === 'gradient' ? settings.gradient : null,
                    image: settings.type === 'image' ? settings.image : null,
                    imageSize: settings.type === 'image' ? settings.imageSize : null,
                    imagePosition: settings.type === 'image' ? settings.imagePosition : null
                };
                console.log('Sending save data:', saveData);
                console.log('Current settings:', settings);
                
                const response = await axios.post('/api/user/background-settings', saveData);
                console.log('Save response:', response.data);
                console.log('Current settings after save:', settings);
                
                if (response.data.success) {
                    toast.success('Arxa fon parametrləri saxlanıldı!');
                    // Apply background after successful save
                    applyBackground();
                    onClose();
                } else {
                    console.log('Save failed:', response.data);
                    toast.error('Xəta baş verdi!');
                }
            } else {
                // Save to cookie for 70 days
                setCookie('guest_background_settings', JSON.stringify(settings), 70);
                toast.success('Arxa fon parametrləri saxlanıldı!');
                // Apply background after successful save
                applyBackground();
                onClose();
            }
        } catch (error) {
            console.error('Save error:', error);
            toast.error('Saxlama zamanı xəta baş verdi!');
        } finally {
            setLoading(false);
        }
    };

    const applyBackground = () => {
        console.log('applyBackground called with settings:', settings);
        const chatContainer = document.querySelector('#chat-container, [data-chat-background]');
        console.log('Chat container found:', chatContainer);
        
        if (chatContainer) {
            let backgroundStyle = '';
            
            switch (settings.type) {
                case 'solid':
                    backgroundStyle = settings.color || '#f3f4f6';
                    console.log('Solid color background style:', backgroundStyle);
                    break;
                case 'gradient':
                    backgroundStyle = settings.gradient;
                    console.log('Gradient background style:', backgroundStyle);
                    break;
                case 'image':
                    if (settings.image) {
                        // Ensure the image URL is properly formatted
                        let imageUrl = settings.image;
                        if (!imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
                            imageUrl = '/' + imageUrl;
                        }
                        backgroundStyle = `url(${imageUrl})`;
                        chatContainer.style.backgroundSize = settings.imageSize || 'cover';
                        chatContainer.style.backgroundPosition = settings.imagePosition || 'center';
                        chatContainer.style.backgroundRepeat = 'no-repeat';
                        console.log('Applied image background:', {
                            url: imageUrl,
                            size: settings.imageSize || 'cover',
                            position: settings.imagePosition || 'center'
                        });
                    } else {
                        backgroundStyle = settings.color || '#f3f4f6';
                    }
                    break;
                default:
                    backgroundStyle = '#f3f4f6';
            }
            
            console.log('Applying background style:', backgroundStyle);
            if (settings.type === 'image') {
                // For images, set individual properties instead of shorthand
                chatContainer.style.setProperty('background-image', backgroundStyle, 'important');
                chatContainer.style.setProperty('background-size', settings.imageSize || 'cover', 'important');
                chatContainer.style.setProperty('background-position', settings.imagePosition || 'center', 'important');
                chatContainer.style.setProperty('background-repeat', 'no-repeat', 'important');
                // Clear any existing background color
                chatContainer.style.setProperty('background-color', '', 'important');
            } else {
                // For solid colors and gradients
                chatContainer.style.setProperty('background-image', '', 'important');
                chatContainer.style.setProperty('background-size', '', 'important');
                chatContainer.style.setProperty('background-position', '', 'important');
                chatContainer.style.setProperty('background-repeat', '', 'important');
                
                if (settings.type === 'gradient') {
                    // For gradients, use background property
                    chatContainer.style.setProperty('background', backgroundStyle, 'important');
                    chatContainer.style.setProperty('background-color', '', 'important'); // Clear any solid color
                } else if (settings.type === 'solid') {
                    // For solid colors, completely clear all gradient properties and apply solid color
                    chatContainer.style.setProperty('background', 'none', 'important'); // Clear any gradient
                    chatContainer.style.setProperty('background-image', 'none', 'important');
                    chatContainer.style.setProperty('background-size', 'auto', 'important');
                    chatContainer.style.setProperty('background-position', '0% 0%', 'important');
                    chatContainer.style.setProperty('background-repeat', 'repeat', 'important');
                    chatContainer.style.setProperty('background-attachment', 'scroll', 'important');
                    chatContainer.style.setProperty('background-origin', 'padding-box', 'important');
                    chatContainer.style.setProperty('background-clip', 'border-box', 'important');
                    chatContainer.style.setProperty('background-color', backgroundStyle, 'important');
                    console.log('Applied solid color with full reset:', backgroundStyle);
                } else {
                    // Default fallback
                    chatContainer.style.setProperty('background-color', backgroundStyle, 'important');
                    chatContainer.style.setProperty('background', '', 'important');
                }
            }
            
            // Dispatch event to notify other components
            window.dispatchEvent(new CustomEvent('backgroundChanged', {
                detail: { 
                    type: settings.type, 
                    background: backgroundStyle,
                    imageSize: settings.imageSize,
                    imagePosition: settings.imagePosition
                }
            }));
        } else {
            console.error('Chat container not found! Available elements:');
            console.log('Elements with id chat-container:', document.querySelectorAll('#chat-container'));
            console.log('Elements with data-chat-background:', document.querySelectorAll('[data-chat-background]'));
            console.log('All divs on page:', document.querySelectorAll('div').length);
            console.log('Page body classes:', document.body.className);
        }
    };

    // Real-time preview function for image adjustments
    const applyBackgroundPreview = (previewSettings) => {
        const chatContainer = document.querySelector('#chat-container, [data-chat-background]');
        if (chatContainer && previewSettings.image) {
            let imageUrl = previewSettings.image;
            if (!imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
                imageUrl = '/' + imageUrl;
            }
            
            // Clear any color/gradient backgrounds first
            chatContainer.style.setProperty('background', '', 'important');
            chatContainer.style.setProperty('background-color', '', 'important');
            
            // Apply image background with new settings
            chatContainer.style.setProperty('background-image', `url(${imageUrl})`, 'important');
            chatContainer.style.setProperty('background-size', previewSettings.imageSize || 'cover', 'important');
            chatContainer.style.setProperty('background-position', previewSettings.imagePosition || 'center', 'important');
            chatContainer.style.setProperty('background-repeat', 'no-repeat', 'important');
            
            console.log('Applied persistent preview:', {
                url: imageUrl,
                size: previewSettings.imageSize || 'cover',
                position: previewSettings.imagePosition || 'center'
            });
        }
    };

    // Delete image function
    const handleDeleteImage = async () => {
        console.log('Delete image called, current settings:', settings);
        if (!settings.image) {
            console.log('No image to delete');
            return;
        }
        
        setLoading(true);
        try {
            console.log('Sending delete request to /api/user/background-image');
            const response = await axios.delete('/api/user/background-image', {
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                }
            });
            
            console.log('Delete response:', response.data);
            
            if (response.data.success) {
                setSettings(prev => ({
                    ...prev,
                    image: null,
                    imageSize: 'cover',
                    imagePosition: 'center',
                    type: 'solid',
                    color: '#f3f4f6'
                }));
                
                // Switch back to color tab
                setActiveTab('color');
                
                // Reset chat background to default solid color with complete cleanup
                const chatContainer = document.querySelector('#chat-container, [data-chat-background]');
                if (chatContainer) {
                    chatContainer.style.setProperty('background', 'none', 'important');
                    chatContainer.style.setProperty('background-image', 'none', 'important');
                    chatContainer.style.setProperty('background-size', 'auto', 'important');
                    chatContainer.style.setProperty('background-position', '0% 0%', 'important');
                    chatContainer.style.setProperty('background-repeat', 'repeat', 'important');
                    chatContainer.style.setProperty('background-attachment', 'scroll', 'important');
                    chatContainer.style.setProperty('background-origin', 'padding-box', 'important');
                    chatContainer.style.setProperty('background-clip', 'border-box', 'important');
                    chatContainer.style.setProperty('background-color', '#f3f4f6', 'important');
                }
                
                toast.success('Şəkil silindi!');
            } else {
                toast.error('Şəkil silinərkən xəta baş verdi!');
            }
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Şəkil silinərkən xəta baş verdi!');
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (file) => {
        if (!file) return;
        
        if (file.size > 400 * 1024) {
            toast.error('Şəkil ölçüsü 400KB-dan böyük ola bilməz!');
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await axios.post('/api/user/upload-background-image', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                }
            });

            if (response.data.success) {
                console.log('Upload successful, URL:', response.data.url);
                const newSettings = {
                    ...settings,
                    image: response.data.url,
                    imageSize: 'cover',
                    imagePosition: 'center',
                    type: 'image'
                };
                setSettings(newSettings);
                
                // Apply initial preview
                applyBackgroundPreview(newSettings);
                
                toast.success('Şəkil yükləndi!');
            } else {
                console.log('Upload failed:', response.data);
                toast.error('Şəkil yüklənmədi!');
            }
        } catch (error) {
            console.error('Upload error:', error);
            console.error('Upload error response:', error.response);
            if (error.response) {
                console.error('Upload error data:', error.response.data);
            }
            toast.error('Şəkil yüklənmə xətası!');
        } finally {
            setLoading(false);
        }
    };

    const predefinedGradients = [
        { name: 'Göy-Bənövşəyi', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
        { name: 'Çəhrayı-Narıncı', value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
        { name: 'Yaşıl-Mavi', value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
        { name: 'Qızıl-Narıncı', value: 'linear-gradient(135deg, #ffa751 0%, #ff6b6b 100%)' },
        { name: 'Bənövşəyi-Çəhrayı', value: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
        { name: 'Tünd Mavi', value: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)' }
    ];

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                            Arxa Fon Parametrləri
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                        >
                            <Icon name="close" size={20} />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-gray-200 dark:border-gray-700">
                        <button
                                        onClick={() => {
                                            setActiveTab('color');
                                            // When switching to color tab, ensure type is not image
                                            if (settings.type === 'image') {
                                                setSettings(prev => ({
                                                    ...prev,
                                                    type: 'solid'
                                                }));
                                            }
                                        }}
                            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                                activeTab === 'color'
                                    ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                            }`}
                        >
                            Rəng & Gradient
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab('image');
                                // When switching to image tab, set type to image and apply preview if image exists
                                if (settings.image) {
                                    setSettings(prev => ({ ...prev, type: 'image' }));
                                    applyBackgroundPreview(settings);
                                }
                            }}
                            disabled={!isAuthenticated}
                            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                                activeTab === 'image' && isAuthenticated
                                    ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                                    : !isAuthenticated
                                    ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                            }`}
                        >
                            Şəkil {!isAuthenticated && '🔒'}
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {activeTab === 'color' && (
                            <div className="space-y-4">
                                {/* Color Type Selection */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            console.log('Solid color selected');
                                            const newSettings = { 
                                                ...settings, 
                                                type: 'solid'
                                                // Keep image data for future use
                                            };
                                            setSettings(newSettings);
                                            // Apply real-time preview with current color
                                            applyColorPreview('solid', settings.color || '#f3f4f6');
                                        }}
                                        className={`flex-1 p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                                            settings.type === 'solid'
                                                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700'
                                                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                                        }`}
                                    >
                                        Solid Rəng
                                    </button>
                                    <button
                                        onClick={() => {
                                            console.log('Gradient selected');
                                            const newSettings = { 
                                                ...settings, 
                                                type: 'gradient'
                                                // Keep image data for future use
                                            };
                                            setSettings(newSettings);
                                            // Apply real-time preview with current gradient
                                            applyColorPreview('gradient', settings.gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)');
                                        }}
                                        className={`flex-1 p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                                            settings.type === 'gradient'
                                                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700'
                                                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                                        }`}
                                    >
                                        Gradient
                                    </button>
                                </div>

                                {/* Solid Color Picker */}
                                {settings.type === 'solid' && (
                                    <div className="space-y-3">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Rəng seçin
                                        </label>
                                        <div className="flex gap-3">
                                            <input
                                                type="color"
                                                value={settings.color}
                                                onChange={(e) => {
                                                    console.log('Color changed to:', e.target.value);
                                                    const newSettings = { 
                                                        ...settings, 
                                                        color: e.target.value,
                                                        type: 'solid' // Ensure type is solid when color is changed
                                                    };
                                                    setSettings(newSettings);
                                                    // Real-time preview
                                                    applyColorPreview('solid', e.target.value);
                                                }}
                                                className="w-16 h-12 rounded-lg border-2 border-gray-300 cursor-pointer"
                                            />
                                            <input
                                                type="text"
                                                value={settings.color}
                                                onChange={(e) => {
                                                    console.log('Color text changed to:', e.target.value);
                                                    const newSettings = { 
                                                        ...settings, 
                                                        color: e.target.value,
                                                        type: 'solid'
                                                    };
                                                    setSettings(newSettings);
                                                    // Real-time preview
                                                    applyColorPreview('solid', e.target.value);
                                                }}
                                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                                placeholder="#f3f4f6"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Gradient Settings */}
                                {settings.type === 'gradient' && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Xüsusi Gradient CSS
                                            </label>
                                            <textarea
                                                value={settings.gradient}
                                                onChange={(e) => {
                                                    console.log('Gradient changed to:', e.target.value);
                                                    const newSettings = { 
                                                        ...settings, 
                                                        gradient: e.target.value,
                                                        type: 'gradient'
                                                    };
                                                    setSettings(newSettings);
                                                    // Real-time preview
                                                    applyColorPreview('gradient', e.target.value);
                                                }}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono text-sm h-20"
                                                placeholder="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Hazır Gradientlər
                                            </label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {predefinedGradients.map((gradient, index) => (
                                                    <button
                                                        key={index}
                                                        onClick={() => {
                                                            const newSettings = { ...settings, gradient: gradient.value, type: 'gradient' };
                                                            setSettings(newSettings);
                                                            // Real-time preview
                                                            applyColorPreview('gradient', gradient.value);
                                                        }}
                                                        className="text-xs px-3 py-2 border rounded-lg text-left hover:opacity-80 transition-opacity text-white font-medium"
                                                        style={{ background: gradient.value }}
                                                    >
                                                        {gradient.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Preview */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Önizləmə
                                    </label>
                                    <div
                                        className="w-full h-20 rounded-lg border-2 border-gray-200 flex items-center justify-center"
                                        style={{
                                            background: settings.type === 'solid' ? settings.color : settings.gradient
                                        }}
                                    >
                                        <span className="bg-black/20 px-3 py-1 rounded text-white text-sm font-medium">
                                            Arxa Fon Nümunəsi
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'image' && (
                            <div className="space-y-4">
                                {!isAuthenticated ? (
                                    <div className="text-center py-8">
                                        <div className="text-6xl mb-4">🔒</div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                            Şəkil Yükləmə Qadağandır
                                        </h3>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            Şəkil yükləmək üçün hesaba daxil olmalısınız
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Image Upload Section */}
                                        {!settings.image ? (
                                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                                <div className="text-4xl mb-4">📷</div>
                                                <label htmlFor="background-image-upload" className="cursor-pointer">
                                                    <span className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                                                        Şəkil yükləyin
                                                    </span>
                                                    <span className="block text-sm text-gray-500 dark:text-gray-400">
                                                        PNG, JPG, GIF (Maksimum 400KB)
                                                    </span>
                                                    <input
                                                        id="background-image-upload"
                                                        type="file"
                                                        accept="image/*"
                                                        className="sr-only"
                                                        onChange={(e) => handleImageUpload(e.target.files[0])}
                                                    />
                                                </label>
                                            </div>
                                        ) : (
                                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50 dark:bg-gray-800">
                                                <div className="text-4xl mb-4">🚫</div>
                                                <span className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                                                    Şəkil yüklənib
                                                </span>
                                                <span className="block text-sm text-gray-500 dark:text-gray-500">
                                                    Başqa şəkil yükləmək üçün mövcud şəkili silin
                                                </span>
                                            </div>
                                        )}

                        {settings.image && (
                            <div className="space-y-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Cari Şəkil
                                </label>
                                
                                {/* Image Preview */}
                                <div className="space-y-3">
                                    <div className="relative inline-block">
                                        <div 
                                            className="w-full h-40 rounded-lg border-2 border-gray-200 overflow-hidden"
                                            style={{
                                                backgroundImage: `url(${settings.image})`,
                                                backgroundSize: settings.imageSize || 'cover',
                                                backgroundPosition: settings.imagePosition || 'center',
                                                backgroundRepeat: 'no-repeat'
                                            }}
                                        >
                                            <div className="w-full h-full flex items-center justify-center bg-black/10">
                                                <span className="bg-white/90 px-2 py-1 rounded text-xs font-medium text-gray-700">
                                                    Önizləmə
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleDeleteImage}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
                                            title="Şəkili sil"
                                        >
                                            ×
                                        </button>
                                    </div>
                                    
                                    {/* Image Controls */}
                                    <div className="space-y-3">
                                        {/* Background Size Control */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Şəkil Ölçüsü
                                            </label>
                                            <div className="flex gap-2">
                                                {['cover', 'contain', 'auto', '100% 100%'].map((size) => (
                                                    <button
                                                        key={size}
                                                        onClick={() => {
                                                            const newSettings = { ...settings, imageSize: size };
                                                            setSettings(newSettings);
                                                            applyBackgroundPreview(newSettings);
                                                        }}
                                                        className={`px-3 py-1 text-xs rounded-lg border transition-colors ${
                                                            (settings.imageSize || 'cover') === size
                                                                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700'
                                                                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 text-gray-700 dark:text-gray-300'
                                                        }`}
                                                    >
                                                        {size === 'cover' ? 'Doldur' : size === 'contain' ? 'Sığışdır' : size === 'auto' ? 'Orjinal' : 'Uzat'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        
                                        {/* Background Position Control */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Şəkil Mövqeyi
                                            </label>
                                            <div className="grid grid-cols-3 gap-1 max-w-[120px]">
                                                {[
                                                    ['top left', '↖️'], ['top center', '⬆️'], ['top right', '↗️'],
                                                    ['center left', '⬅️'], ['center', '⭕'], ['center right', '➡️'],
                                                    ['bottom left', '↙️'], ['bottom center', '⬇️'], ['bottom right', '↘️']
                                                ].map(([position, icon]) => (
                                                    <button
                                                        key={position}
                                                        onClick={() => {
                                                            const newSettings = { ...settings, imagePosition: position };
                                                            setSettings(newSettings);
                                                            applyBackgroundPreview(newSettings);
                                                        }}
                                                        className={`w-8 h-8 text-xs rounded border flex items-center justify-center transition-colors ${
                                                            (settings.imagePosition || 'center') === position
                                                                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-600'
                                                                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 text-gray-500'
                                                        }`}
                                                        title={position}
                                                    >
                                                        {icon}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                        Dəyişikliklər real-time göstərilir
                                    </div>
                                </div>
                            </div>
                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex gap-2 p-6 border-t border-gray-200 dark:border-gray-700">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            Ləğv et
                        </button>
                        <button
                            onClick={async () => {
                                // Reset to default transparent background
                                const defaultSettings = {
                                    type: 'default',
                                    color: 'transparent',
                                    gradient: '',
                                    image: null,
                                    imageSize: 'cover',
                                    imagePosition: 'center'
                                };
                                
                                setSettings(defaultSettings);
                                
                                // Clear the chat background immediately
                                const chatContainer = document.querySelector('#chat-container, [data-chat-background]');
                                if (chatContainer) {
                                    // Clear all background properties to use default CSS classes
                                    chatContainer.style.setProperty('background', '', 'important');
                                    chatContainer.style.setProperty('background-image', '', 'important');
                                    chatContainer.style.setProperty('background-size', '', 'important');
                                    chatContainer.style.setProperty('background-position', '', 'important');
                                    chatContainer.style.setProperty('background-repeat', '', 'important');
                                    chatContainer.style.setProperty('background-color', '', 'important');
                                    chatContainer.style.setProperty('background-attachment', '', 'important');
                                    chatContainer.style.setProperty('background-origin', '', 'important');
                                    chatContainer.style.setProperty('background-clip', '', 'important');
                                }
                                
                                // Save the reset settings
                                try {
                                    setLoading(true);
                                    console.log('Sending reset request with current settings:', settings);
                                    
                                if (isAuthenticated) {
                                        const resetData = {
                                            type: 'default',
                                            color: null,
                                            gradient: null,
                                            image: null,
                                            imageSize: null,
                                            imagePosition: null
                                        };
                                        console.log('Sending reset data to API:', resetData);
                                        
                                        const response = await axios.post('/api/user/background-settings', resetData);
                                        console.log('Reset API response:', response.data);
                                        
                                        if (response.data.success) {
                                            console.log('Reset successful - background and file should be deleted');
                                            toast.success('Arxa fon və şəkil sıfırlandı!');
                                        } else {
                                            console.error('Reset failed:', response.data);
                                            toast.error('Sıfırlama uğursuz oldu!');
                                        }
                                    } else {
                                        // Clear guest cookie
                                        document.cookie = 'guest_background_settings=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
                                        toast.success('Qonaq parametrləri sıfırlandı!');
                                    }
                                    
                                    // Force reload settings to show the reset state
                                    setTimeout(() => {
                                        loadCurrentSettings();
                                    }, 500);
                                    
                                    onClose();
                                } catch (error) {
                                    console.error('Reset error details:', error);
                                    console.error('Error response:', error.response?.data);
                                    toast.error('Sıfırlama zamanı xəta baş verdi: ' + (error.response?.data?.message || error.message));
                                } finally {
                                    setLoading(false);
                                }
                            }}
                            disabled={loading}
                            className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors text-sm"
                            title="Defolt rəngə qaytar"
                        >
                            Sıfırlamaq
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 disabled:opacity-50 transition-colors"
                        >
                            {loading ? 'Saxlanır...' : 'Yadda Saxla'}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default UserBackgroundModal;