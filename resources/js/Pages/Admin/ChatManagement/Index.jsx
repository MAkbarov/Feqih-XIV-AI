/**
 * XIV AI - Advanced AI Chatbot Platform
 * Version: v1.0.0
 * Release Date: 28.09.2025
 * Author: DeXIV
 * 
 * Admin Chat Management Page - View and manage all chat sessions
 */

import { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { motion } from 'framer-motion';
import Icon from '@/Components/Icon';

export default function ChatManagementIndex({ chatSessions, stats, filters }) {
    const [selectedSessions, setSelectedSessions] = useState(new Set());
    const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [confirmationText, setConfirmationText] = useState('');
    
    // Translations
    const t = {
        title: 'Söhbət İdarəsi',
        totalChats: 'Ümumi Söhbətlər',
        totalMessages: 'Ümumi Mesajlar', 
        activeChats: 'Aktiv Söhbətlər',
        guestChats: 'Qonaq Söhbətləri',
        userChats: 'İstifadəçi Söhbətləri',
        todayChats: 'Bu Gün',
        search: 'Axtar...',
        searchPlaceholder: 'Başlıq, istifadəçi və ya session ID ilə axtar',
        selectAll: 'Hamısını seç',
        deselectAll: 'Seçimi ləğv et',
        bulkDelete: 'Seçilənləri sil',
        deleteAll: 'Hamısını sil',
        view: 'Göstər',
        delete: 'Sil',
        user: 'İstifadəçi',
        guest: 'Qonaq',
        messages: 'mesaj',
        session: 'Session',
        created: 'Yaradıldı',
        actions: 'Əməliyyat',
        confirmDelete: 'Bu söhbəti silmək istədiyinizdən əminsiz?',
        confirmBulkDelete: 'Seçilmiş söhbətləri silmək istədiyinizdən əminsiz?',
        confirmDeleteAll: 'Bütün söhbətləri silmək istədiyinizdən əminsiz? Bu əməl geri alına bilməz!',
        typeToConfirm: 'Təsdiq üçün "HAMISINI_SIL" yazın:',
        cancel: 'Ləğv et',
        confirm: 'Təsdiq et',
        noChats: 'Söhbət tapılmadı',
        noChatsDesc: 'Hələ heç bir söhbət yoxdur və ya axtar kriteriyasına uyğun söhbət yoxdur.',
        loading: 'Yüklənir...'
    };

    // Localize Laravel pagination labels
    const translatePaginationLabel = (label) => {
        if (!label) return '';
        return label
            .replace('&laquo; Previous', '&laquo; Əvvəlki')
            .replace('Previous', 'Əvvəlki')
            .replace('Next &raquo;', 'Növbəti &raquo;')
            .replace('Next', 'Növbəti')
            .replace('&laquo;', '&laquo;')
            .replace('&raquo;', '&raquo;');
    };
    
    const { data, setData, post, processing } = useForm({
        session_ids: [],
        confirmation: ''
    });
    const [isDeletingAll, setIsDeletingAll] = useState(false);
    
    // Handle individual session selection
    const toggleSession = (sessionId) => {
        const newSelected = new Set(selectedSessions);
        if (newSelected.has(sessionId)) {
            newSelected.delete(sessionId);
        } else {
            newSelected.add(sessionId);
        }
        setSelectedSessions(newSelected);
    };
    
    // Handle select all
    const toggleSelectAll = () => {
        if (selectedSessions.size === chatSessions.data.length) {
            setSelectedSessions(new Set());
        } else {
            setSelectedSessions(new Set(chatSessions.data.map(s => s.session_id)));
        }
    };
    
    // Handle search
    const handleSearch = (e) => {
        e.preventDefault();
        router.get('/admin/chat-management', { search: searchTerm }, {
            preserveState: true,
            replace: true
        });
    };
    
    // Delete individual session
    const deleteSession = (sessionId) => {
        if (confirm(t.confirmDelete)) {
            router.delete(`/admin/chat-management/${sessionId}`);
        }
    };
    
    // Bulk delete
    const handleBulkDelete = () => {
        if (selectedSessions.size === 0) return;
        
        setData('session_ids', Array.from(selectedSessions));
        post('/admin/chat-management/bulk-delete', {
            onSuccess: () => {
                setSelectedSessions(new Set());
                setShowBulkDeleteModal(false);
            }
        });
    };
    
    // Delete all
    const handleDeleteAll = () => {
        if (confirmationText !== 'HAMISINI_SIL' || isDeletingAll) return;
        
        setData('confirmation', confirmationText);
        post('/admin/chat-management/delete-all', {
            onStart: () => setIsDeletingAll(true),
            onFinish: () => setIsDeletingAll(false),
            onSuccess: () => {
                setShowDeleteAllModal(false);
                setConfirmationText('');
                setSelectedSessions(new Set());
            }
        });
    };
    
    return (
        <AdminLayout>
            <Head title={t.title} />
            
            <div className="p-3 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">{t.title}</h1>
                </div>
                
                {/* Statistics Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
                    <div className="bg-white/90 dark:bg-gray-800/90 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                        <div className="text-2xl font-bold text-blue-600">{stats.total_chats}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">{t.totalChats}</div>
                    </div>
                    <div className="bg-white/90 dark:bg-gray-800/90 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                        <div className="text-2xl font-bold text-green-600">{stats.total_messages}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">{t.totalMessages}</div>
                    </div>
                    <div className="bg-white/90 dark:bg-gray-800/90 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                        <div className="text-2xl font-bold text-purple-600">{stats.active_chats}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">{t.activeChats}</div>
                    </div>
                    <div className="bg-white/90 dark:bg-gray-800/90 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                        <div className="text-2xl font-bold text-orange-600">{stats.guest_chats}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">{t.guestChats}</div>
                    </div>
                    <div className="bg-white/90 dark:bg-gray-800/90 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                        <div className="text-2xl font-bold text-indigo-600">{stats.user_chats}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">{t.userChats}</div>
                    </div>
                    <div className="bg-white/90 dark:bg-gray-800/90 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                        <div className="text-2xl font-bold text-emerald-600">{stats.today_chats}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">{t.todayChats}</div>
                    </div>
                </div>
                
                {/* Search and Actions */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <form onSubmit={handleSearch} className="flex-1">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={t.searchPlaceholder}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                        />
                    </form>
                    
                    <div className="flex gap-2">
                        <button
                            onClick={toggleSelectAll}
                            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                        >
                            {selectedSessions.size === chatSessions.data.length ? t.deselectAll : t.selectAll}
                        </button>
                        
                        {selectedSessions.size > 0 && (
                            <button
                                onClick={() => setShowBulkDeleteModal(true)}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                            >
                                {t.bulkDelete} ({selectedSessions.size})
                            </button>
                        )}
                        
                        <button
                            onClick={() => setShowDeleteAllModal(true)}
                            className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors"
                        >
                            {t.deleteAll}
                        </button>
                    </div>
                </div>
                
                {/* Chat Sessions Table */}
                <div className="bg-white/90 dark:bg-gray-800/90 rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden">
                    {chatSessions.data.length > 0 ? (
                        <>
                            {/* Desktop Table */}
                            <div className="hidden lg:block overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
                                        <tr>
                                            <th className="px-6 py-3 text-left">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedSessions.size === chatSessions.data.length && chatSessions.data.length > 0}
                                                    onChange={toggleSelectAll}
                                                    className="rounded border-gray-300"
                                                />
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t.session}</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t.user}</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t.messages}</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t.created}</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t.actions}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                                        {chatSessions.data.map((session) => (
                                            <tr key={session.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedSessions.has(session.session_id)}
                                                        onChange={() => toggleSession(session.session_id)}
                                                        className="rounded border-gray-300"
                                                    />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-xs">
                                                        {session.title}
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                                        {session.session_id.substring(0, 8)}...
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {session.user ? (
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{session.user.name}</div>
                                                            <div className="text-xs text-gray-500 dark:text-gray-400">{session.user.email}</div>
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 rounded-full">{t.guest}</span>
                                                            {session.ip_address && (
                                                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-mono">{session.ip_address}</div>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                                                    {session.messages_count} {t.messages}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                    {new Date(session.created_at).toLocaleDateString('az-AZ')}
                                                </td>
                                                <td className="px-6 py-4 text-right space-x-2">
                                                    <button
                                                        onClick={() => router.visit(`/admin/chat-management/${session.session_id}`)}
                                                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
                                                    >
                                                        {t.view}
                                                    </button>
                                                    <button
                                                        onClick={() => deleteSession(session.session_id)}
                                                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 font-medium"
                                                    >
                                                        {t.delete}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            
                            {/* Mobile Cards */}
                            <div className="lg:hidden space-y-4 p-4">
                                {chatSessions.data.map((session) => (
                                    <div key={session.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedSessions.has(session.session_id)}
                                                        onChange={() => toggleSession(session.session_id)}
                                                        className="rounded border-gray-300"
                                                    />
                                                    <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">{session.title}</h3>
                                                </div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                                    {session.session_id.substring(0, 16)}...
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-1 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-500 dark:text-gray-400">{t.user}:</span>
                                                {session.user ? (
                                                    <span className="text-gray-900 dark:text-gray-100">{session.user.name}</span>
                                                ) : (
                                                    <div>
                                                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">{t.guest}</span>
                                                        {session.ip_address && (
                                                            <div className="text-xs text-gray-500 mt-1 font-mono">{session.ip_address}</div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500 dark:text-gray-400">{t.messages}:</span>
                                                <span className="text-gray-900 dark:text-gray-100">{session.messages_count}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500 dark:text-gray-400">{t.created}:</span>
                                                <span className="text-gray-900 dark:text-gray-100">{new Date(session.created_at).toLocaleDateString('az-AZ')}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="flex gap-2 mt-3">
                                            <button
                                                onClick={() => router.visit(`/admin/chat-management/${session.session_id}`)}
                                                className="flex-1 px-3 py-2 bg-indigo-500 text-white text-sm rounded-lg hover:bg-indigo-600"
                                            >
                                                {t.view}
                                            </button>
                                            <button
                                                onClick={() => deleteSession(session.session_id)}
                                                className="flex-1 px-3 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600"
                                            >
                                                {t.delete}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-12">
                            <Icon name="feature_chat" size={64} color="#d1d5db" className="mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">{t.noChats}</h3>
                            <p className="text-gray-500 dark:text-gray-400">{t.noChatsDesc}</p>
                        </div>
                    )}
                </div>
                
                {/* Pagination */}
                {chatSessions.links && (
                    <div className="mt-6 flex justify-center">
                        {chatSessions.links.map((link, index) => (
                            <button
                                key={index}
                                onClick={() => router.visit(link.url)}
                                disabled={!link.url}
                                className={`px-3 py-2 mx-1 text-sm rounded-lg ${
                                    link.active
                                        ? 'bg-indigo-500 text-white'
                                        : link.url
                                        ? 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                                        : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
                                }`}
                                dangerouslySetInnerHTML={{ __html: translatePaginationLabel(link.label) }}
                            />
                        ))}
                    </div>
                )}
            </div>
            
            {/* Bulk Delete Modal */}
            {showBulkDeleteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t.bulkDelete}</h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">{t.confirmBulkDelete}</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowBulkDeleteModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                                {t.cancel}
                            </button>
                            <button
                                onClick={handleBulkDelete}
                                disabled={processing}
                                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                            >
                                {processing ? t.loading : t.confirm}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Delete All Modal */}
            {showDeleteAllModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-6 max-w-md w-full relative">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t.deleteAll}</h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-4">{t.confirmDeleteAll}</p>
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t.typeToConfirm}
                            </label>
                            <input
                                type="text"
                                value={confirmationText}
                                onChange={(e) => setConfirmationText(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                placeholder="HAMISINI_SIL"
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    if (isDeletingAll) return;
                                    setShowDeleteAllModal(false);
                                    setConfirmationText('');
                                }}
                                disabled={isDeletingAll}
                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                            >
                                {t.cancel}
                            </button>
                            <button
                                onClick={handleDeleteAll}
                                disabled={isDeletingAll || confirmationText !== 'HAMISINI_SIL'}
                                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isDeletingAll ? (<><Icon name="activity" size={16} color="white" className="animate-spin" /> {t.loading}</>) : t.confirm}
                            </button>
                        </div>

                        {isDeletingAll && (
                            <div className="absolute inset-0 bg-white/60 dark:bg-black/40 flex items-center justify-center rounded-lg">
                                <div className="flex items-center gap-3 text-gray-700 dark:text-gray-200">
                                    <Icon name="activity" size={20} className="animate-spin" />
                                    <span>Silinir, zəhmət olmasa gözləyin...</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}