import { Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import Icon from '@/Components/Icon';
import { useTheme } from '@/Components/ThemeProvider';
import Footer from '@/Components/Footer';

export default function AdminLayout({ children, footerSettings = {} }) {
  const { props } = usePage();
  const { theme, isLoading } = useTheme();
  const [flashMessage, setFlashMessage] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [darkMode, setDarkMode] = useState(false);

  // Load dark mode preference from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('admin-dark-mode');
    if (savedTheme === 'true' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Toggle dark mode and save preference
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('admin-dark-mode', newDarkMode.toString());
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };
  
  useEffect(() => {
    if (props.flash?.success) {
      setFlashMessage(props.flash.success);
      // Auto hide after 3 seconds
      const timer = setTimeout(() => setFlashMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [props.flash?.success]);
  
  // Navigation items
  const navigationItems = [
    { href: '/admin', icon: 'nav_dashboard', label: 'Panel', color: theme.primary_color },
    { href: '/admin/users', icon: 'users', label: 'İstifadəçilər', color: theme.secondary_color },
    { href: '/admin/providers', icon: 'provider', label: 'AI Provider', color: theme.accent_color },
    { href: '/admin/ai-training', icon: 'feature_ai', label: 'AI Təlimat', color: '#9333ea' },
    { href: '/admin/settings', icon: 'settings', label: 'Parametrlər', color: theme.primary_color },
    { href: '/admin/theme-settings', icon: 'edit', label: 'Tema', color: theme.accent_color },
    { href: '/admin/chat-analytics', icon: 'chart', label: 'Analitika', color: '#0ea5e9' },
    { href: '/admin/chat-management', icon: 'feature_chat', label: 'Söhbət İdarəsi', color: '#16a34a' },
    { href: '/admin/chat-limits', icon: 'shield_check', label: 'Mesaj Limitləri', color: '#dc2626' },
    { href: '/admin/ip-security', icon: 'activity', label: 'IP Təhlükəsizlik', color: '#ea580c' },
    { href: '/admin/donation', icon: 'heart', label: 'İanə', color: '#ef4444' },
  ];

  const currentPath = props?.url || window.location.pathname;

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
      darkMode ? 'dark' : ''
    }`} style={{ background: darkMode ? 'linear-gradient(135deg, #1f2937 0%, #111827 100%)' : theme.background_gradient }}>
      {/* Desktop Navigation */}
      <nav className={`backdrop-blur-lg border-b shadow-lg transition-colors duration-300 ${
        darkMode 
          ? 'bg-gray-800/90 border-gray-700/50' 
          : 'bg-white/90 border-gray-200/50'
      }`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between px-4 py-3">
            {/* Logo & Brand */}
            <div className="flex items-center space-x-4">
              <Link href="/admin" className={`flex items-center space-x-2 font-bold transition-colors ${
                darkMode 
                  ? 'text-gray-200 hover:text-white' 
                  : 'text-gray-800 hover:text-gray-900'
              }`}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: theme.primary_color }}>
                  <Icon name="nav_dashboard" size={18} color="white" />
                </div>
                <span className="text-lg hidden sm:block">Admin Panel</span>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center space-x-1">
              {navigationItems.map((item) => {
                const isActive = currentPath === item.href || currentPath.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive 
                        ? darkMode
                          ? 'bg-gray-700 shadow-sm text-white border border-gray-600'
                          : 'bg-white shadow-sm text-gray-900 border border-gray-200'
                        : darkMode
                        ? 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                    }`}
                  >
                    <Icon name={item.icon} size={16} color={isActive ? item.color : '#6b7280'} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Right side actions */}
            <div className="flex items-center space-x-3">
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode
                    ? 'text-yellow-400 hover:text-yellow-300 hover:bg-gray-700/50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                <Icon name={darkMode ? 'sun' : 'moon'} size={20} color={darkMode ? '#facc15' : '#6b7280'} />
              </button>

              {/* Notifications */}
              <button className={`relative p-2 rounded-lg transition-colors ${
                darkMode
                  ? 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}>
                <Icon name="bell" size={20} color="#6b7280" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {notificationCount}
                  </span>
                )}
              </button>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`lg:hidden p-2 rounded-lg transition-colors ${
                  darkMode
                    ? 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                <Icon name={mobileMenuOpen ? 'close' : 'menu'} size={20} color="#6b7280" />
              </button>

              {/* Back to Chat */}
              <Link 
                href="/" 
                className="px-4 py-2 rounded-lg text-white font-medium hover:shadow-lg transition-all flex items-center space-x-2 text-sm"
                style={{ backgroundColor: theme.primary_color }}
              >
                <Icon name="arrow_left" size={16} color="white" />
                <span className="hidden sm:inline">Çat</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Menu */}
      <div className={`lg:hidden backdrop-blur-lg border-b shadow-lg overflow-hidden transition-all duration-300 ease-in-out ${
        mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
      } ${
        darkMode
          ? 'bg-gray-800/95 border-gray-700/50'
          : 'bg-white/95 border-gray-200/50'
      }`}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {navigationItems.map((item) => {
                const isActive = currentPath === item.href || currentPath.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex flex-col items-center space-y-2 p-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive 
                        ? darkMode
                          ? 'bg-gray-700 shadow-sm text-white border border-gray-600'
                          : 'bg-white shadow-sm text-gray-900 border border-gray-200'
                        : darkMode
                        ? 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                    }`}
                  >
                    <Icon name={item.icon} size={20} color={isActive ? item.color : '#6b7280'} />
                    <span className="text-xs text-center">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      
      {/* Flash Message */}
      {flashMessage && (
        <div className="fixed top-4 right-4 z-50 max-w-sm">
          <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center justify-between">
            <span className="text-sm font-medium">{flashMessage}</span>
            <button 
              onClick={() => setFlashMessage(null)}
              className="ml-3 text-white hover:text-gray-200 transition-colors"
            >
              <Icon name="close" size={16} color="white" />
            </button>
          </div>
        </div>
      )}
      
      <main className="flex-1 p-4">
        {children}
      </main>
      <Footer footerSettings={footerSettings} />
    </div>
  );
}
