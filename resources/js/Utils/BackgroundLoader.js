/**
 * Background Loader Utility
 * Loads and applies user background settings on page load
 */

const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
};

const applyBackgroundFromSettings = (settings) => {
    console.log('BackgroundLoader: applyBackgroundFromSettings called', settings);
    const chatContainer = document.querySelector('#chat-container, [data-chat-background]');
    console.log('BackgroundLoader: Chat container found:', chatContainer);
    if (!chatContainer) {
        console.error('BackgroundLoader: Chat container not found!');
        return;
    }

    let backgroundStyle = '';
    
    switch (settings.type) {
        case 'solid':
            backgroundStyle = settings.color;
            break;
        case 'gradient':
            backgroundStyle = settings.gradient;
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
                console.log('BackgroundLoader: Applied image background:', {
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
    
    console.log('BackgroundLoader: Applying background style:', backgroundStyle);
    
    if (settings.type === 'image') {
        // For images, set individual properties
        chatContainer.style.backgroundImage = backgroundStyle;
        chatContainer.style.backgroundSize = settings.imageSize || 'cover';
        chatContainer.style.backgroundPosition = settings.imagePosition || 'center';
        chatContainer.style.backgroundRepeat = 'no-repeat';
        // Clear any existing background color
        chatContainer.style.backgroundColor = '';
    } else {
        // For solid colors and gradients
        chatContainer.style.backgroundImage = '';
        chatContainer.style.backgroundSize = '';
        chatContainer.style.backgroundPosition = '';
        chatContainer.style.backgroundRepeat = '';
        
        if (settings.type === 'gradient') {
            // For gradients, use background property
            chatContainer.style.background = backgroundStyle;
            chatContainer.style.backgroundColor = ''; // Clear any solid color
        } else if (settings.type === 'solid') {
            // For solid colors, completely clear all gradient properties
            chatContainer.style.setProperty('background', 'none', 'important');
            chatContainer.style.setProperty('background-image', 'none', 'important');
            chatContainer.style.setProperty('background-size', 'auto', 'important');
            chatContainer.style.setProperty('background-position', '0% 0%', 'important');
            chatContainer.style.setProperty('background-repeat', 'repeat', 'important');
            chatContainer.style.setProperty('background-attachment', 'scroll', 'important');
            chatContainer.style.setProperty('background-origin', 'padding-box', 'important');
            chatContainer.style.setProperty('background-clip', 'border-box', 'important');
            chatContainer.style.setProperty('background-color', backgroundStyle, 'important');
            console.log('BackgroundLoader: Applied solid color with full reset:', backgroundStyle);
        } else {
            // Default fallback
            chatContainer.style.backgroundColor = backgroundStyle;
            chatContainer.style.background = ''; // Clear any gradient
        }
    }
};

export const loadUserBackground = async (isAuthenticated = false) => {
    console.log('BackgroundLoader: loadUserBackground called, isAuthenticated:', isAuthenticated);
    try {
        if (isAuthenticated) {
            // Load from user data
            console.log('BackgroundLoader: Loading from API for authenticated user');
            const response = await fetch('/api/user/background-settings', {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            
            console.log('BackgroundLoader: API response status:', response.status);
            if (response.ok) {
                const data = await response.json();
                console.log('BackgroundLoader: API response data:', data);
                if (data.success) {
                    applyBackgroundFromSettings(data.settings);
                } else {
                    console.warn('BackgroundLoader: API returned success=false');
                }
            } else {
                console.error('BackgroundLoader: API request failed with status:', response.status);
            }
        } else {
            // Load from cookie for guests
            const cookieSettings = getCookie('guest_background_settings');
            if (cookieSettings) {
                try {
                    const settings = JSON.parse(cookieSettings);
                    applyBackgroundFromSettings(settings);
                } catch (e) {
                    console.warn('Failed to parse guest background settings:', e);
                }
            }
        }
    } catch (error) {
        console.warn('Failed to load user background:', error);
    }
};

// Auto-load when DOM is ready
export const initBackgroundLoader = (isAuthenticated = false) => {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // Small delay to ensure chat container is rendered
            setTimeout(() => loadUserBackground(isAuthenticated), 100);
        });
    } else {
        // DOM is already ready
        setTimeout(() => loadUserBackground(isAuthenticated), 100);
    }
};