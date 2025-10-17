import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { useTheme } from '@/Components/ThemeProvider';
import Icon from '@/Components/Icon';
import Footer from '@/Components/Footer';

export default function Privacy({ privacy, theme = {}, settings = {} }) {
  const { isDarkMode, toggleDarkMode } = useTheme();
  
  const siteName = settings.site_name || 'AI Chatbot Platform';
  const bgGradient = theme?.background_gradient;

  if (!privacy) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'dark' : ''}`} 
           style={{ background: isDarkMode ? 'linear-gradient(135deg, #1f2937 0%, #111827 100%)' : bgGradient }}>
        <Head title={`Məxfilik Siyasəti - ${siteName}`} />
        
        <div className="text-center">
          <Icon name="warning" size={48} color="#ef4444" className="mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Məxfilik Siyasəti Tapılmadı
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Məxfilik siyasəti hələ təyin edilməyib.
          </p>
          <Link 
            href="/" 
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ana səhifəyə qayıt
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`} 
         style={{ background: isDarkMode ? 'linear-gradient(135deg, #1f2937 0%, #111827 100%)' : bgGradient }}>
      <Head title={`${privacy.title} - ${siteName}`} />

      {/* Dark mode toggle */}
      <div className="fixed top-4 right-4 z-50">
        <div className="flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full px-3 py-2 shadow-lg">
          <Icon name="sun" size={14} color={!isDarkMode ? '#fbbf24' : '#9ca3af'} />
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={isDarkMode} 
              onChange={() => toggleDarkMode()}
              className="sr-only peer" 
            />
            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
          <Icon name="moon" size={14} color={isDarkMode ? '#60a5fa' : '#9ca3af'} />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors mb-6"
          >
            <Icon name="arrow_left" size={20} />
            <span>Ana səhifəyə qayıt</span>
          </Link>
          
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {privacy.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {siteName}
          </p>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-2xl shadow-xl p-8">
            <div 
              className="prose prose-lg dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: privacy.content }}
            />
          </div>
        </div>
        
        {/* Back to home */}
        <div className="text-center mt-8">
          <Link 
            href="/" 
            className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            style={{ backgroundColor: theme?.primary_color }}
          >
            <Icon name="nav_chat" size={20} />
            <span>Çatbota keç</span>
          </Link>
        </div>
      </div>
      
      <Footer footerSettings={{}} />
    </div>
  );
}