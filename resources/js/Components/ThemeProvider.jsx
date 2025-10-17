import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export const ThemeProvider = ({ children }) => {
    // Try to get cached theme from localStorage
    const getCachedTheme = () => {
        try {
            const cached = localStorage.getItem('chatbot_theme');
            return cached ? JSON.parse(cached) : null;
        } catch {
            return null;
        }
    };

    // Provide immediate fallback theme to prevent any gray flash
    const defaultTheme = {
        primary_color: '#17cf1a',
        secondary_color: '#179207', 
        accent_color: '#b6fb23',
        background_gradient: 'linear-gradient(135deg, #04f000 0%, #009e4c 100%)',
        text_color: '#1f2937'
    };
    
    const [theme, setTheme] = useState(getCachedTheme() || defaultTheme);
    const [isLoading, setIsLoading] = useState(false); // Disable loading screen to prevent flash
    
    // Apply theme immediately on component mount to prevent any flash
    React.useLayoutEffect(() => {
        const currentTheme = getCachedTheme() || defaultTheme;
        applyTheme(currentTheme, isDarkMode);
    }, []);
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('chatbot_dark_mode');
        return saved ? JSON.parse(saved) : false;
    });

    const loadTheme = async () => {
        try {
            // Add cache-busting with short timeout for faster load
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
            
            const response = await fetch(`/api/theme?v=${Date.now()}`, {
                signal: controller.signal,
                cache: 'no-cache'
            });
            clearTimeout(timeoutId);
            
            const data = await response.json();
            setTheme(data);
            applyTheme(data);
            // Cache theme in localStorage with timestamp
            localStorage.setItem('chatbot_theme', JSON.stringify(data));
            localStorage.setItem('chatbot_theme_updated', Date.now().toString());
        } catch (error) {
            console.warn('Failed to load theme settings, using cached or default fallback');
            // Use cached theme if available, otherwise default
            const cachedTheme = getCachedTheme();
            const fallbackTheme = cachedTheme || defaultTheme;
            setTheme(fallbackTheme);
            applyTheme(fallbackTheme);
            if (!cachedTheme) {
                localStorage.setItem('chatbot_theme', JSON.stringify(defaultTheme));
            }
        } finally {
            // Keep loading false to prevent flash
        }
    };

    const updateBrowserThemeColor = (themeData, darkMode) => {
        try {
            // Update meta theme-color for browser UI
            const themeColorMeta = document.querySelector('meta[name="theme-color"]:not([media])');
            const lightThemeMeta = document.querySelector('meta[name="theme-color"][media*="light"]');
            const darkThemeMeta = document.querySelector('meta[name="theme-color"][media*="dark"]');
            
            const primaryColor = themeData.primary_color || '#6366F1';
            const darkColor = '#1f2937';
            
            if (themeColorMeta) {
                themeColorMeta.setAttribute('content', darkMode ? darkColor : primaryColor);
            }
            if (lightThemeMeta) {
                lightThemeMeta.setAttribute('content', primaryColor);
            }
            if (darkThemeMeta) {
                darkThemeMeta.setAttribute('content', darkColor);
            }
            
            // Update Microsoft tiles color
            const tileColorMeta = document.querySelector('meta[name="msapplication-TileColor"]');
            if (tileColorMeta) {
                tileColorMeta.setAttribute('content', darkMode ? darkColor : primaryColor);
            }
            
            const navButtonMeta = document.querySelector('meta[name="msapplication-navbutton-color"]');
            if (navButtonMeta) {
                navButtonMeta.setAttribute('content', darkMode ? darkColor : primaryColor);
            }
        } catch (error) {
            console.warn('Failed to update browser theme colors:', error);
        }
    };
    
    const applyTheme = (themeData, darkMode = isDarkMode) => {
        const root = document.documentElement;
        
        // Add transition preparation class to prevent jarring changes
        root.classList.add('theme-transitioning');
        
        // Apply CSS variables with optimized timing
        requestAnimationFrame(() => {
            root.style.setProperty('--primary-color', themeData.primary_color);
            root.style.setProperty('--secondary-color', themeData.secondary_color);
            root.style.setProperty('--accent-color', themeData.accent_color);
            root.style.setProperty('--text-color', themeData.text_color);
            root.style.setProperty('--background-gradient', themeData.background_gradient);
            
            // Update browser theme colors
            updateBrowserThemeColor(themeData, darkMode);
            
            // Enable hardware acceleration for smooth transitions
            root.style.setProperty('will-change', 'background-color, color');
            
            // Clean up after transition completes
            setTimeout(() => {
                root.classList.remove('theme-transitioning');
                root.style.removeProperty('will-change');
            }, 300); // Match CSS transition duration
        });
        
        // Do not mutate <html> or <body> dark classes or backgrounds here.
        // Each page/layout wraps its own root with a scoped `.dark` class.
    };

    const updateTheme = (newTheme) => {
        const updatedTheme = { ...theme, ...newTheme };
        setTheme(updatedTheme);
        applyTheme(updatedTheme);
        // Update cache
        localStorage.setItem('chatbot_theme', JSON.stringify(updatedTheme));
    };
    
    // Add refresh theme function to force reload from server
    const refreshTheme = async () => {
        setIsLoading(true);
        await loadTheme();
        setIsLoading(false);
    };

    const toggleDarkMode = () => {
        const newDarkMode = !isDarkMode;
        setIsDarkMode(newDarkMode);
        localStorage.setItem('chatbot_dark_mode', JSON.stringify(newDarkMode));
        
        // Debounce theme application for better performance
        if (theme) {
            // Cancel any pending theme application
            if (window.themeToggleTimeout) {
                clearTimeout(window.themeToggleTimeout);
            }
            
            // Apply theme with minimal delay to batch DOM updates
            window.themeToggleTimeout = setTimeout(() => {
                applyTheme(theme, newDarkMode);
                window.themeToggleTimeout = null;
            }, 16); // ~1 frame delay for batching
        } else {
            console.warn('⚠️ No theme available for dark mode toggle');
        }
    };

    // Do not manipulate global <html> or <body> classes/styles here.
    // Page/layout wrappers handle dark mode scoping via wrapper-level `.dark`.
    React.useLayoutEffect(() => {
        // No-op: keep for compatibility
    }, [isDarkMode]);

    useEffect(() => {
        loadTheme();
    }, []);
    
    // Apply theme changes
    React.useLayoutEffect(() => {
        if (theme) {
            applyTheme(theme, isDarkMode);
        }
    }, [theme, isDarkMode]);

    // Only show loading if no theme available at all (very rare)
    if (!theme && isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-pulse text-gray-400">Yüklənir...</div>
            </div>
        );
    }

    return (
        <ThemeContext.Provider value={{
            theme,
            updateTheme,
            refreshTheme,
            isLoading,
            loadTheme,
            applyTheme,
            isDarkMode,
            toggleDarkMode
        }}>
            {children}
        </ThemeContext.Provider>
    );
};