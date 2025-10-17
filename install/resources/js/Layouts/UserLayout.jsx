import { Link, usePage } from '@inertiajs/react';
import Icon from '@/Components/Icon';
import { useTheme } from '@/Components/ThemeProvider';
import Footer from '@/Components/Footer';

export default function UserLayout({ children, auth, settings = {}, footerSettings = {} }) {
  const { theme, isDarkMode, toggleDarkMode } = useTheme();
  const siteName = settings.site_name || 'AI Chatbot Platform';
  
  return (
    <div className={`${isDarkMode ? 'dark' : ''}`}>
      <div className="min-h-screen flex flex-col" style={{ background: isDarkMode ? 'linear-gradient(135deg, #1f2937 0%, #111827 100%)' : (theme?.background_gradient || 'linear-gradient(135deg, #f9fafb 0%, #ffffff 100%)') }}>
      <nav className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-white/20 dark:border-gray-700/30 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/60 dark:hover:bg-gray-700/60 transition-all">
              <Icon name="nav_chat" size={24} color={theme?.primary_color} />
              <span className="text-lg">{siteName}</span>
            </Link>
          </div>
          
          <div className="flex items-center gap-1 md:gap-2">
            {/* Dark mode toggle switch */}
            <div className="flex items-center gap-2">
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
            </div>
            
            {auth?.user ? (
              <>
                <span className="hidden md:inline text-sm text-gray-600 dark:text-gray-300">Salam, {auth.user.name}</span>
                {auth.user.role?.name === 'admin' && (
                  <Link href="/admin" className="px-2 md:px-3 py-2 rounded-lg text-sm bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-sm flex items-center gap-1">
                    <Icon name="nav_dashboard" size={16} />
                    <span className="hidden md:inline">Admin Panel</span>
                  </Link>
                )}
                <Link href="/" className="px-2 md:px-3 py-2 rounded-lg text-sm text-white transition-colors shadow-sm flex items-center gap-1" style={{ backgroundColor: theme?.primary_color }}>
                  <Icon name="nav_chat" size={16} />
                  <span className="hidden md:inline">Chat</span>
                </Link>
                <Link href="/profile" className="px-2 md:px-3 py-2 rounded-lg text-sm bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition-colors shadow-sm flex items-center gap-1">
                  <Icon name="users" size={16} />
                  <span className="hidden md:inline">Profil</span>
                </Link>
                <Link href="/logout" method="post" as="button" className="px-2 md:px-3 py-2 rounded-lg text-sm bg-red-500 text-white hover:bg-red-600 transition-colors shadow-sm flex items-center gap-1">
                  <Icon name="logout" size={16} />
                  <span className="hidden md:inline">Çıxış</span>
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="px-2 md:px-4 py-2 rounded-lg text-sm bg-white border text-emerald-700 hover:bg-emerald-50 dark:bg-gray-800 dark:text-emerald-400 dark:hover:bg-gray-700 transition-colors shadow-sm flex items-center gap-1" style={{ borderColor: theme?.primary_color }}>
                  <Icon name="users" size={16} />
                  <span className="hidden md:inline">Daxil ol</span>
                </Link>
                <Link href="/register" className="px-2 md:px-4 py-2 rounded-lg text-sm text-white transition-colors shadow-sm flex items-center gap-1" style={{ backgroundColor: theme?.primary_color }}>
                  <Icon name="edit" size={16} />
                  <span className="hidden md:inline">Qeydiyyat</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
      
      <main className="flex-1 p-4">
        {children}
      </main>
      
      <Footer footerSettings={footerSettings} />
      </div>
    </div>
  );
}