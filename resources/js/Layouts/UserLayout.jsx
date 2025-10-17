import { Link, usePage } from '@inertiajs/react';
import Icon from '@/Components/Icon';
import { useTheme } from '@/Components/ThemeProvider';
import Footer from '@/Components/Footer';
import { motion } from 'framer-motion';

export default function UserLayout({ children, auth, settings = {}, footerSettings = {} }) {
  const { url } = usePage();
  const { theme, isDarkMode, toggleDarkMode } = useTheme();
  const siteName = settings.site_name || 'AI Chatbot Platform';
  const brandMode = settings.brand_mode || 'icon';
  const brandIconName = settings.brand_icon_name || 'nav_chat';
  const brandLogoUrl = settings.brand_logo_url || '';
  const primaryColor = theme?.primary_color || '#10b981';
  const secondaryColor = theme?.secondary_color || '#06b6d4';
  
  // Get appropriate logo based on device and theme
  const getBrandLogo = () => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      return isDarkMode ? settings?.brand_logo_mobile_dark || brandLogoUrl : settings?.brand_logo_mobile_light || brandLogoUrl;
    } else {
      return isDarkMode ? settings?.brand_logo_desktop_dark || brandLogoUrl : settings?.brand_logo_desktop_light || brandLogoUrl;
    }
  };
  
  const brandLogoDisplay = getBrandLogo();
  
  return (
    <div className={`${isDarkMode ? 'dark' : ''}`}>
      <div className="min-h-screen flex flex-col" style={{ background: isDarkMode ? 'linear-gradient(135deg, #1f2937 0%, #111827 100%)' : (theme?.background_gradient || 'linear-gradient(135deg, #f9fafb 0%, #ffffff 100%)') }}>
      
      {/* Interactive Navigation Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full px-4 sm:px-6 lg:px-8 py-4 bg-gradient-to-r from-white/95 via-white/90 to-white/95 dark:from-gray-800/95 dark:via-gray-800/90 dark:to-gray-800/95 backdrop-blur-xl border-b border-white/20 dark:border-gray-700/50 shadow-lg"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            {/* Brand Display */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex items-center gap-3"
            >
              <Link href="/" className="flex items-center gap-3">
                {brandMode === 'logo' && brandLogoDisplay ? (
                  <motion.img 
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    src={brandLogoDisplay} 
                    alt="logo" 
                    className="w-8 h-8 md:w-10 md:h-10 object-contain rounded-xl shadow-lg border border-white/20 dark:border-gray-700/50" 
                  />
                ) : brandMode === 'icon' ? (
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="p-2 rounded-xl bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-200/30 dark:border-purple-700/30 shadow-lg"
                  >
                    <Icon name={brandIconName} size={24} color={primaryColor} />
                  </motion.div>
                ) : null}
                
                {(brandMode === 'icon' || brandMode === 'logo') && (
                  <motion.h1 
                    whileHover={{ scale: 1.02 }}
                    className="text-lg md:text-xl lg:text-2xl font-bold bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 dark:from-gray-100 dark:via-gray-200 dark:to-gray-100 bg-clip-text text-transparent"
                  >
                    {siteName}
                  </motion.h1>
                )}
                
                {brandMode === 'none' && (
                  <motion.h1 
                    whileHover={{ scale: 1.02 }}
                    className="text-lg md:text-xl lg:text-2xl font-bold bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 dark:from-gray-100 dark:via-gray-200 dark:to-gray-100 bg-clip-text text-transparent"
                  >
                    {siteName}
                  </motion.h1>
                )}
              </Link>
            </motion.div>
            
            {/* Navigation Links */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex items-center gap-2 sm:gap-3"
            >
              {/* Dark Mode Toggle */}
              <motion.div 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2"
              >
                <Icon name="sun" size={16} color={!isDarkMode ? '#fbbf24' : '#9ca3af'} />
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={isDarkMode} 
                    onChange={() => toggleDarkMode()}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
                <Icon name="moon" size={16} color={isDarkMode ? '#60a5fa' : '#9ca3af'} />
              </motion.div>
              
              {auth?.user ? (
                <>
                  <span className="hidden md:inline text-sm text-gray-600 dark:text-gray-300">Salam, {auth.user.name}</span>
                  
                  {auth.user.role?.name === 'admin' && (
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Link 
                        href="/admin" 
                        className="px-3 py-2 rounded-xl text-sm bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2 font-medium"
                      >
                        <Icon name="control-panel" size={16} />
                        <span className="hidden md:inline">Admin</span>
                      </Link>
                    </motion.div>
                  )}
                  
                  
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link 
                      href="/" 
                      className="px-3 py-2 rounded-xl text-sm bg-gradient-to-r text-white hover:shadow-xl transition-all duration-300 shadow-lg flex items-center gap-2 font-medium"
                      style={{ 
                        backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` 
                      }}
                    >
                      <Icon name="nav_chat" size={16} />
                      <span className="hidden md:inline">Chat</span>
                    </Link>
                  </motion.div>
                  
                  {url !== '/profile' && (
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Link 
                        href="/profile" 
                        className="px-3 py-2 rounded-xl text-sm bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300 dark:from-gray-600 dark:to-gray-700 dark:text-gray-200 dark:hover:from-gray-500 dark:hover:to-gray-600 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2 font-medium"
                      >
                        <Icon name="users" size={16} />
                        <span className="hidden md:inline">Profil</span>
                      </Link>
                    </motion.div>
                  )}
                  
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link 
                      href="/logout" 
                      method="post" 
                      as="button" 
                      className="px-3 py-2 rounded-xl text-sm bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2 font-medium"
                    >
                      <Icon name="logout" size={16} />
                      <span className="hidden md:inline">Çıxış</span>
                    </Link>
                  </motion.div>
                </>
              ) : (
                <>
                  
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link 
                      href="/login" 
                      className="px-3 py-2 rounded-xl text-sm bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300 dark:from-gray-600 dark:to-gray-700 dark:text-gray-200 dark:hover:from-gray-500 dark:hover:to-gray-600 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2 font-medium"
                    >
                      <Icon name="users" size={16} />
                      <span className="hidden md:inline">Giriş</span>
                    </Link>
                  </motion.div>
                  
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link 
                      href="/register" 
                      className="px-3 py-2 rounded-xl text-sm bg-gradient-to-r text-white hover:shadow-xl transition-all duration-300 shadow-lg flex items-center gap-2 font-medium"
                      style={{ 
                        backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` 
                      }}
                    >
                      <Icon name="edit" size={16} />
                      <span className="hidden md:inline">Qeydiyyat</span>
                    </Link>
                  </motion.div>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </motion.header>
      
      <main className="flex-1 p-4">
        {children}
      </main>
      
      <Footer footerSettings={footerSettings} />
      </div>
    </div>
  );
}