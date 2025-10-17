/**
 * XIV AI - Advanced AI Chatbot Platform
 * Version: v1.0.0
 * Release Date: 28.09.2025
 * Author: DeXIV
 * 
 * Chat Session Detail View - View and manage individual chat session
 */

import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { motion } from 'framer-motion';
import Icon from '@/Components/Icon';

export default function ChatManagementShow({ session, messages }) {
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    
    // Translations
    const t = {
        title: 'Söhbət Detalları',
        backToList: 'Siyahıya qayıt',
        sessionInfo: 'Session Məlumatları',
        sessionId: 'Session ID',
        user: 'İstifadəçi',
        guest: 'Qonaq',
        created: 'Yaradıldı',
        lastActivity: 'Son Aktivlik',
        totalMessages: 'Ümumi Mesajlar',
        deleteSession: 'Söhbəti sil',
        messages: 'Mesajlar',
        userMessage: 'İstifadəçi Mesajı',
        assistantMessage: 'AI Cavabı',
        noMessages: 'Mesaj yoxdur',
        noMessagesDesc: 'Bu söhbətdə hələ heç bir mesaj yoxdur.',
        confirmDelete: 'Bu söhbəti silmək istədiyinizdən əminsiz?',
        confirmDeleteDesc: 'Bu əməl geri alına bilməz. Bütün mesajlar silinəcək.',
        cancel: 'Ləğv et',
        confirm: 'Sil',
        loading: 'Yüklənir...'
    };
    
    // Delete session
    const deleteSession = () => {
        router.delete(`/admin/chat-management/${session.session_id}`, {
            onSuccess: () => {
                router.visit('/admin/chat-management');
            }
        });
    };
    
    // Format message content
    const formatMessage = (content) => {
        if (!content) return '';
        
        // Convert markdown-like formatting to basic HTML
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/```(.*?)```/gs, '<pre class="bg-gray-100 p-2 rounded text-sm overflow-x-auto"><code>$1</code></pre>')
            .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded text-sm">$1</code>')
            .replace(/\n/g, '<br>');
    };
    
    return (
        <AdminLayout>
            <Head title={`${t.title} - ${session.title}`} />
            
            <div className="p-3 sm:p-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                    <div>
                        <button
                            onClick={() => router.visit('/admin/chat-management')}
                            className="text-indigo-600 hover:text-indigo-800 mb-2 flex items-center gap-2"
                        >
                            <Icon name="arrow_left" size={16} color="currentColor" />
                            {t.backToList}
                        </button>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">{t.title}</h1>
                        <p className="text-gray-600 dark:text-gray-300 mt-1 truncate">{session.title}</p>
                    </div>
                    
                    <button
                        onClick={() => setShowDeleteModal(true)}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                        {t.deleteSession}
                    </button>
                </div>
                
                {/* Session Info Card */}
                <div className="bg-white/90 dark:bg-gray-800/90 rounded-xl border border-gray-200 dark:border-gray-600 p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t.sessionInfo}</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t.sessionId}</label>
                            <p className="text-gray-900 dark:text-gray-200 font-mono text-sm break-all">{session.session_id}</p>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t.user}</label>
                            {session.user ? (
                                <div>
                                    <p className="text-gray-900 dark:text-gray-200 font-medium">{session.user.name}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{session.user.email}</p>
                                </div>
                            ) : (
                                <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full">{t.guest}</span>
                            )}
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">IP Ünvanı</label>
                            <p className="text-gray-900 dark:text-gray-200 font-mono text-sm">{session.ip_address || 'Məlum deyil'}</p>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t.totalMessages}</label>
                            <p className="text-gray-900 dark:text-gray-200 text-lg font-semibold">{messages?.total || 0}</p>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t.created}</label>
                            <p className="text-gray-900 dark:text-gray-200">{new Date(session.created_at).toLocaleString('az-AZ')}</p>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t.lastActivity}</label>
                            <p className="text-gray-900 dark:text-gray-200">{new Date(session.updated_at).toLocaleString('az-AZ')}</p>
                        </div>
                    </div>
                </div>
                
                {/* Messages */}
                <div className="bg-white/90 dark:bg-gray-800/90 rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-600">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t.messages}</h2>
                    </div>
                    
                    {messages?.data && messages.data.length > 0 ? (
                        <div className="max-h-[600px] overflow-y-auto">
                            {messages.data.map((message, index) => (
                                <motion.div
                                    key={message.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={`p-6 border-b border-gray-100 dark:border-gray-600 last:border-b-0 ${
                                        message.sender === 'user' ? 'bg-blue-50/50 dark:bg-blue-900/20' : 'bg-gray-50/50 dark:bg-gray-700/50'
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                                            message.sender === 'user' ? 'bg-blue-500' : 'bg-gray-500'
                                        }`}>
                                            <Icon 
                                                name={message.sender === 'user' ? 'users' : 'bot'} 
                                                size={16} 
                                                color="white" 
                                            />
                                        </div>
                                        
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-medium text-gray-900 dark:text-gray-200">
                                                    {message.sender === 'user' ? t.userMessage : t.assistantMessage}
                                                </span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {new Date(message.created_at).toLocaleString('az-AZ')}
                                                </span>
                                            </div>
                                            
                                            <div 
                                                className="text-gray-700 dark:text-gray-300 leading-relaxed message-content"
                                                dangerouslySetInnerHTML={{ __html: formatMessage(message.message) }}
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Icon name="feature_chat" size={64} color="#d1d5db" className="mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-200 mb-2">{t.noMessages}</h3>
                            <p className="text-gray-500 dark:text-gray-400">{t.noMessagesDesc}</p>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {messages?.data && messages.total > messages.per_page && (
                    <div className="flex items-center justify-between mt-4">
                        <button
                            disabled={!messages.prev_page_url}
                            onClick={() => router.get(window.location.pathname, { page: messages.current_page - 1 }, { preserveScroll: true, preserveState: true })}
                            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-50"
                        >
                            « Əvvəlki
                        </button>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                            Səhifə {messages.current_page} / {messages.last_page}
                        </div>
                        <button
                            disabled={!messages.next_page_url}
                            onClick={() => router.get(window.location.pathname, { page: messages.current_page + 1 }, { preserveScroll: true, preserveState: true })}
                            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-50"
                        >
                            Sonrakı »
                        </button>
                    </div>
                )}
            </div>
            
            {/* Delete Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t.confirmDelete}</h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">{t.confirmDeleteDesc}</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800"
                            >
                                {t.cancel}
                            </button>
                            <button
                                onClick={deleteSession}
                                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                            >
                                {t.confirm}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            <style jsx>{`
                .message-content pre {
                    white-space: pre-wrap;
                    word-wrap: break-word;
                }
                
                .message-content code {
                    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                }
                
                .message-content strong {
                    font-weight: 600;
                }
                
                .message-content em {
                    font-style: italic;
                }
            `}</style>
        </AdminLayout>
    );
}