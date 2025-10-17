import { Head, Link, usePage } from '@inertiajs/react';
import UserLayout from '@/Layouts/UserLayout';
import { motion } from 'framer-motion';
import { useTheme } from '@/Components/ThemeProvider';
import Icon from '@/Components/Icon';
import { useState, useEffect } from 'react';

export default function ChatHistory({ 
  chatSessions = [], 
  auth, 
  settings = {}, 
  footerSettings = {}, 
  theme = {} 
}) {
  const { isDarkMode } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSessions, setSelectedSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState(chatSessions);
  
  const primaryColor = theme?.primary_color || '#10b981';
  const secondaryColor = theme?.secondary_color || '#06b6d4';
  const accentColor = theme?.accent_color || '#f59e0b';

  // Filter sessions based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredSessions(chatSessions);
      return;
    }

    const filtered = chatSessions.filter(session => 
      session.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.messages?.some(msg => 
        msg.content.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    setFilteredSessions(filtered);
  }, [searchTerm, chatSessions]);

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Bugün';
    if (diffDays === 2) return 'Dünən';
    if (diffDays <= 7) return `${diffDays} gün əvvəl`;
    
    return date.toLocaleDateString('az-AZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const truncateContent = (content, maxLength = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const handleSelectSession = (sessionId) => {
    setSelectedSessions(prev => 
      prev.includes(sessionId)
        ? prev.filter(id => id !== sessionId)
        : [...prev, sessionId]
    );
  };

  const handleSelectAll = () => {
    if (selectedSessions.length === filteredSessions.length) {
      setSelectedSessions([]);
    } else {
      setSelectedSessions(filteredSessions.map(session => session.id));
    }
  };

  return (
    <UserLayout auth={auth} settings={settings} footerSettings={footerSettings}>
      <Head title="Söhbət Tarixçəsi" />
      
      <section className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 relative">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 right-10 w-32 h-32 rounded-full opacity-10" 
               style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}></div>
          <div className="absolute bottom-20 left-10 w-24 h-24 rounded-full opacity-10" 
               style={{ background: `linear-gradient(135deg, ${accentColor}, ${primaryColor})` }}></div>
        </div>

        <motion.div 
          className="max-w-7xl mx-auto relative z-10"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Header */}
          <motion.div 
            variants={itemVariants}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6"
                 style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}>
              <Icon name="history" size={32} color="white" />
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Söhbət Tarixçəsi
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Əvvəlki söhbətlərinizi axtarın və davam etdirin
            </p>
          </motion.div>

          {/* Search and Filters */}
          <motion.div 
            variants={itemVariants}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-3xl border border-gray-200 dark:border-gray-700 shadow-2xl p-6 mb-8"
          >
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Icon 
                  name="search" 
                  size={20} 
                  color={isDarkMode ? '#9ca3af' : '#6b7280'}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2"
                />
                <input
                  type="text"
                  placeholder="Söhbətlərdə axtarış..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400"
                  style={{ '--tw-ring-color': primaryColor }}
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSelectAll}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Icon name="select_all" size={16} />
                  <span className="hidden sm:inline">
                    {selectedSessions.length === filteredSessions.length ? 'Hamısını ləğv et' : 'Hamısını seç'}
                  </span>
                </button>

                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-white transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                  style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                >
                  <Icon name="add" size={16} color="white" />
                  Yeni Söhbət
                </Link>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {filteredSessions.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {searchTerm ? 'Axtarış nəticəsi' : 'Ümumi söhbət'}
                </div>
              </div>
              
              <div className="text-center p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {filteredSessions.reduce((total, session) => total + (session.messages?.length || 0), 0)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Ümumi mesaj
                </div>
              </div>
              
              <div className="text-center p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {selectedSessions.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Seçilmiş
                </div>
              </div>
            </div>
          </motion.div>

          {/* Chat Sessions Grid */}
          <motion.div 
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredSessions.length > 0 ? (
              filteredSessions.map((session, index) => (
                <motion.div
                  key={session.id}
                  variants={itemVariants}
                  whileHover={{ scale: 1.02, y: -5 }}
                  className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group"
                >
                  {/* Session header */}
                  <div className="p-6 pb-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
                          {session.title || `Söhbət ${index + 1}`}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          <Icon name="schedule" size={16} />
                          {formatDate(session.created_at)}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedSessions.includes(session.id)}
                          onChange={() => handleSelectSession(session.id)}
                          className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0"
                        />
                        <div className="w-3 h-3 rounded-full"
                             style={{ backgroundColor: session.is_active ? '#10b981' : '#6b7280' }}>
                        </div>
                      </div>
                    </div>

                    {/* Message preview */}
                    {session.messages && session.messages.length > 0 && (
                      <div className="space-y-2 mb-4">
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          <span className="font-medium">Son mesaj:</span>
                        </div>
                        <div className="text-sm text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                          {truncateContent(session.messages[session.messages.length - 1]?.content)}
                        </div>
                      </div>
                    )}

                    {/* Session stats */}
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-600 pt-3">
                      <span className="flex items-center gap-1">
                        <Icon name="chat_bubble" size={14} />
                        {session.messages?.length || 0} mesaj
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon name="token" size={14} />
                        {session.total_tokens || 0} token
                      </span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="px-6 pb-6">
                    <div className="flex gap-2">
                      <Link
                        href={`/chat/${session.session_id}`}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                      >
                        <Icon name="visibility" size={14} />
                        Göstər
                      </Link>
                      <Link
                        href={`/?session=${session.session_id}`}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white text-sm transition-all hover:shadow-lg"
                        style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                      >
                        <Icon name="play_arrow" size={14} color="white" />
                        Davam et
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div 
                variants={itemVariants}
                className="col-span-full text-center py-16"
              >
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <Icon name="chat" size={32} color="#9ca3af" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {searchTerm ? 'Axtarış nəticəsi tapılmadı' : 'Hələlik söhbət yoxdur'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {searchTerm 
                    ? 'Fərqli açar sözlərlə axtarış etməyə cəhd edin'
                    : 'İlk söhbətinizi başlatmaq üçün aşağıdakı düyməyə basın'
                  }
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-white transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                  style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                >
                  <Icon name="add" size={16} color="white" />
                  Yeni Söhbət Başlat
                </Link>
              </motion.div>
            )}
          </motion.div>

          {/* Selected actions */}
          {selectedSessions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50"
            >
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl p-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {selectedSessions.length} söhbət seçildi
                  </span>
                  <div className="flex items-center gap-2">
                    <button 
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors text-sm"
                    >
                      <Icon name="delete" size={14} color="white" />
                      Sil
                    </button>
                    <button 
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors text-sm"
                    >
                      <Icon name="archive" size={14} color="white" />
                      Arxivləş
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </section>
    </UserLayout>
  );
}