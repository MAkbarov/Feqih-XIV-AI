import { Link, usePage } from '@inertiajs/react';
import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import Icon from '@/Components/Icon';
import axios from 'axios';
import { useTheme } from '@/Components/ThemeProvider';
import Footer from '@/Components/Footer';

export default function AdminLayout({ children }) {
  const { props } = usePage();
  const footerSettings = props.footerSettings || null;
  const { theme, isLoading } = useTheme();
  const [flashMessage, setFlashMessage] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [showNotif, setShowNotif] = useState(false);
  const [recentNotif, setRecentNotif] = useState([]);
  const [showMoreNav, setShowMoreNav] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const navRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  const [morePos, setMorePos] = useState({ top: 80 });

  // Load dark mode preference from localStorage on mount (admin-only)
  useEffect(() => {
    const saved = localStorage.getItem('admin-dark-mode');
    if (saved === 'true') {
      setDarkMode(true);
    } else if (saved === 'false') {
      setDarkMode(false);
    } else {
      setDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
  }, []);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const updateMorePos = () => {
      try {
        if (navRef.current) {
          const rect = navRef.current.getBoundingClientRect();
          setMorePos({ top: Math.max(0, rect.bottom + 8) });
        }
      } catch {}
    };
    updateMorePos();
    window.addEventListener('resize', updateMorePos);
    window.addEventListener('scroll', updateMorePos, { passive: true });
    return () => {
      window.removeEventListener('resize', updateMorePos);
      window.removeEventListener('scroll', updateMorePos);
    };
  }, [showMoreNav]);

  // Toggle dark mode and save preference (scoped to admin layout wrapper)
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('admin-dark-mode', newDarkMode.toString());
    try { window.dispatchEvent(new CustomEvent('admin-dark-mode-changed', { detail: newDarkMode })); } catch {}
  };
  
  useEffect(() => {
    // Load initial notifications
    const loadStats = async () => {
      try {
        const { data } = await axios.get('/admin/notifications/stats');
        if (data?.data?.unread_notifications !== undefined) setNotificationCount(data.data.unread_notifications);
        else if (data?.unread_count !== undefined) setNotificationCount(data.unread_count);
      } catch {}
    };
    const loadRecent = async () => {
      try {
        const { data } = await axios.get('/admin/notifications/recent');
        setRecentNotif(Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []));
      } catch {}
    };
    loadStats();
    loadRecent();

    if (props.flash?.success) {
      setFlashMessage(props.flash.success);
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
    { href: '/admin/theme-settings', icon: 'edit', label: 'Mövzu', color: theme.accent_color },
    { href: '/admin/terms-privacy', icon: 'shield_check', label: 'Şərtlər & Məxfilik', color: '#8b5cf6' },
    { href: '/admin/chat-analytics', icon: 'chart', label: 'Analitika', color: '#0ea5e9' },
    { href: '/admin/chat-management', icon: 'feature_chat', label: 'Söhbət İdarəsi', color: '#16a34a' },
    { href: '/admin/chat-limits', icon: 'shield_check', label: 'Mesaj Limitləri', color: '#dc2626' },
    { href: '/admin/ip-security', icon: 'activity', label: 'IP Təhlükəsizlik', color: '#ea580c' },
    { href: '/admin/donation', icon: 'heart', label: 'İanə', color: '#ef4444' },
    { href: '/admin/contact-settings', icon: 'message', label: 'Əlaqə', color: '#10b981' },
    { href: '/admin/mail-settings', icon: 'settings', label: 'E-poçt', color: '#2563eb' },
    { href: '/admin/system/update', icon: 'download', label: 'Sistem Yeniləməsi', color: '#16a34a' },    
  ];

  const currentPath = props?.url || window.location.pathname;

  return (
    <div 
      className={`min-h-screen flex flex-col transition-colors duration-300 ${darkMode ? 'dark' : ''} overflow-x-hidden`}
      style={{ background: darkMode ? 'linear-gradient(135deg, #1f2937 0%, #111827 100%)' : theme.background_gradient }}
    >
      {/* Desktop Navigation */}
      <nav ref={navRef} className={`relative overflow-visible backdrop-blur-lg border-b shadow-lg transition-colors duration-300 ${
        darkMode 
          ? 'bg-gray-800/90 border-gray-700/50' 
          : 'bg-white/90 border-gray-200/50'
      }`}>
        <div className="max-w-screen-2xl mx-auto w-full relative">
          <div className="flex items-center justify-between px-3 md:px-4 py-3 gap-2 flex-wrap lg:flex-nowrap">
            {/* Logo & Brand */}
            <div className="flex items-center space-x-2 md:space-x-3">
              <Link 
                href="/admin" 
                className={`flex items-center space-x-2 font-bold transition-colors ${
                  darkMode 
                    ? 'text-gray-200 hover:text-white' 
                    : 'text-gray-800 hover:text-gray-900'
                }`}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: theme.primary_color }}>
                  <Icon name="nav_dashboard" size={18} color="white" />
                </div>
                <span className="text-lg hidden sm:block">Admin Panel</span>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center justify-center space-x-1 flex-1">
              {navigationItems.slice(0,7).map((item) => {
                const isActive = currentPath === item.href || currentPath.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-1 px-2 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
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
              {/* Expand button for more items (desktop only) */}
              {navigationItems.length > 7 && (
                <button
                  type="button"
                  onClick={() => setShowMoreNav(v => !v)}
                  className={`hidden lg:inline-flex items-center justify-center p-2 rounded-lg ring-1 ${darkMode ? 'bg-gray-800 text-gray-200 ring-gray-700 hover:bg-gray-700' : 'bg-white text-gray-700 ring-gray-200 hover:bg-gray-50'}`}
                  title="Daha çox"
                  aria-expanded={showMoreNav}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <path d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" />
                  </svg>
                </button>
              )}
            </div>

            {/* Right side actions */}
            <div className="flex items-center space-x-2">
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
              <div className="relative">
              <button className={`relative p-2 rounded-lg transition-colors ${
                darkMode
                  ? 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`} onClick={async () => { const next = !showNotif; setShowNotif(next); if (!next) return; try { await axios.post('/admin/notifications/read-all'); setNotificationCount(0); } catch {} try { const { data } = await axios.get('/admin/notifications/recent'); setRecentNotif(Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : [])); } catch {} }}>
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
              </div>

              {/* Back to Chat */}
              <Link 
                href="/" 
                className="px-3 py-2 rounded-lg text-white font-medium hover:shadow-lg transition-all flex items-center space-x-2 text-sm"
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
      <div className={`lg:hidden backdrop-blur-lg border-b shadow-lg transition-all duration-300 ease-in-out ${
        mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      } ${
        darkMode
          ? 'bg-gray-800/95 border-gray-700/50'
          : 'bg-white/95 border-gray-200/50'
      } ${mobileMenuOpen ? 'max-h-[75vh] py-2' : 'max-h-0 py-0'} overflow-hidden transition-[max-height,padding]`}>
        <div className={`mx-auto px-4 ${mobileMenuOpen ? 'py-4' : 'py-0'}`}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {navigationItems.map((item) => {
              const isActive = currentPath === item.href || currentPath.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex flex-col items-center space-y-2 p-3 rounded-lg text-xs font-medium transition-all duration-200 ${
                    isActive 
                      ? darkMode
                        ? 'bg-gray-700 shadow-sm text-white border border-gray-600'
                        : 'bg-white shadow-sm text-gray-900 border border-gray-200'
                      : darkMode
                      ? 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }`}
                >
                  <Icon name={item.icon} size={18} color={isActive ? item.color : '#6b7280'} />
                  <span className="text-[11px] leading-4 text-center">{item.label}</span>
                </Link>
              );
            })}
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

      {/* Global portals to avoid stacking conflicts */}
      {mounted && showMoreNav && createPortal(
        <div className={darkMode ? 'dark' : ''}>
          <div className={`hidden lg:block fixed left-1/2 -translate-x-1/2 rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-800/95' : 'border-gray-200 bg-white'} shadow-2xl overflow-hidden animate-dropdown`} style={{ top: morePos.top, zIndex: 2147483647 }}>
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-1 p-2">
              {navigationItems.slice(7).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition ${darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-700/50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
                  onClick={() => setShowMoreNav(false)}
                >
                  <Icon name={item.icon} size={16} color={item.color} />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>, document.body)}

      {mounted && showNotif && createPortal(
        <div className={darkMode ? 'dark' : ''}>
          <div className={`fixed right-4 top-16 w-80 max-w-[90vw] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl animate-dropdown origin-top-right`} style={{ zIndex: 2147483647 }}>
            <div className="p-3 border-b border-gray-200 dark:border-gray-700 font-semibold text-gray-800 dark:text-gray-100">Bildirişlər</div>
            <div className="max-h-80 overflow-auto">
                  {recentNotif.length === 0 ? (
              <div className="p-4 text-sm text-gray-500 dark:text-gray-400">Bildiriş yoxdur</div>
            ) : recentNotif.map(n => (
              <div key={n.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                  <Icon name={n.icon || 'info'} size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <Link href="/admin/notifications" onClick={() => setShowNotif(false)} className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate hover:underline">{n.title}</Link>
                  {n.message && <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{n.message}</div>}
                  <div className="mt-1 text-[11px] text-gray-400 dark:text-gray-400">
                    <Link href="/admin/notifications" onClick={() => setShowNotif(false)} className="hover:underline">
                      {n.created_at ? new Date(n.created_at).toLocaleString('az-AZ') : ''}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
            </div>
            <div className="p-2 border-t border-gray-200 dark:border-gray-700 text-center">
              <a href="/admin/notifications" className="text-sm text-emerald-600 hover:text-emerald-700">Bütün bildirişlər</a>
            </div>
          </div>
        </div>, document.body)}
    </div>
  );
}
