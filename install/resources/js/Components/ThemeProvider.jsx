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

    const [theme, setTheme] = useState(getCachedTheme());
    const [isLoading, setIsLoading] = useState(false); // Disable loading screen to prevent flash
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('chatbot_dark_mode');
        return saved ? JSON.parse(saved) : false;
    });

    const loadTheme = async () => {
        try {
            const response = await fetch('/api/theme');
            const data = await response.json();
            setTheme(data);
            applyTheme(data);
            // Cache theme in localStorage
            localStorage.setItem('chatbot_theme', JSON.stringify(data));
        } catch (error) {
            console.warn('Failed to load theme settings, using default fallback');
            const fallbackTheme = {
                primary_color: '#6366f1',
                secondary_color: '#8b5cf6',
                accent_color: '#fbbf24', 
                background_gradient: 'linear-gradient(135deg, #f9fafb 0%, #ffffff 100%)',
                text_color: '#1f2937'
            };
            setTheme(fallbackTheme);
            applyTheme(fallbackTheme);
            localStorage.setItem('chatbot_theme', JSON.stringify(fallbackTheme));
        } finally {
            // Keep loading false to prevent flash
        }
    };

    const applyTheme = (themeData, darkMode = isDarkMode) => {
        // Apply CSS variables for dynamic theming only (no global dark class)
        document.documentElement.style.setProperty('--primary-color', themeData.primary_color);
        document.documentElement.style.setProperty('--secondary-color', themeData.secondary_color);
        document.documentElement.style.setProperty('--accent-color', themeData.accent_color);
        document.documentElement.style.setProperty('--text-color', themeData.text_color);
        document.documentElement.style.setProperty('--background-gradient', themeData.background_gradient);
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
        if (theme) {
            applyTheme(theme, newDarkMode);
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