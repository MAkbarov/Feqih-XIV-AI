import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { motion } from 'framer-motion';
import Icon from '@/Components/Icon';
import { useState } from 'react';

export default function ChatSessions({ sessions, stats, filters, feedbackStats }) {
    const [search, setSearch] = useState(filters.search || '');
    const [sortBy, setSortBy] = useState(filters.sort_by || 'created_at');
    const [sortOrder, setSortOrder] = useState(filters.sort_order || 'desc');
    const [perPage, setPerPage] = useState(filters.per_page || 20);

    const handleSearch = (e) => {
        e.preventDefault();
        router.get('/admin/chat-analytics', {
            search,
            sort_by: sortBy,
            sort_order: sortOrder,
            per_page: perPage,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleSort = (field) => {
        const newSortOrder = sortBy === field && sortOrder === 'desc' ? 'asc' : 'desc';
        router.get('/admin/chat-analytics', {
            search,
            sort_by: field,
            sort_order: newSortOrder,
            per_page: perPage,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handlePerPageChange = (newPerPage) => {
        router.get('/admin/chat-analytics', {
            search,
            sort_by: sortBy,
            sort_order: sortOrder,
            per_page: newPerPage,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <AdminLayout>
            <Head title="Söhbətlər - Admin Panel" />

            <div className="p-4 md:p-6 space-y-6">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
                >
                    <div className="flex items-center space-x-3">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20">
                            <Icon name="feature_chat" size={32} color="#10b981" />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-1">
                                Chat Analitika
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                Söhbətlər və feedback statistikası
                            </p>
                        </div>
                    </div>
                    <div>
                        <Link
                            href="/admin/chat-analytics/feedback"
                            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-xl font-medium transition-all flex items-center space-x-2 shadow-lg"
                        >
                            <Icon name="chart" size={20} />
                            <span>Feedback Statistikası</span>
                        </Link>
                    </div>
                </motion.div>

                {/* Statistics Cards */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
                >
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-3 mb-2">
                            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                <Icon name="feature_chat" size={20} color="#3b82f6" />
                            </div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">Ümumi Sessiyalar</span>
                        </div>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">
                            {stats.total_sessions.toLocaleString()}
                        </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-3 mb-2">
                            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                                <Icon name="check" size={20} color="#10b981" />
                            </div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">Aktiv Sessiyalar</span>
                        </div>
                        <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                            {stats.active_sessions.toLocaleString()}
                        </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-3 mb-2">
                            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                                <Icon name="activity" size={20} color="#9333ea" />
                            </div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">Bu Gün</span>
                        </div>
                        <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                            {stats.today_sessions.toLocaleString()}
                        </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-3 mb-2">
                            <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                                <Icon name="message" size={20} color="#f97316" />
                            </div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">Ümumi Mesajlar</span>
                        </div>
                        <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">
                            {stats.total_messages.toLocaleString()}
                        </p>
                    </div>
                </motion.div>

                {/* Search and Filters */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700"
                >
                    <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Icon
                                    name="search"
                                    size={20}
                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="İstifadəçi adı, email və ya ID ilə axtar..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                        >
                            <Icon name="search" size={18} />
                            <span>Axtar</span>
                        </button>
                        <select
                            value={perPage}
                            onChange={(e) => handlePerPageChange(e.target.value)}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        >
                            <option value="10">10 nəticə</option>
                            <option value="20">20 nəticə</option>
                            <option value="50">50 nəticə</option>
                            <option value="100">100 nəticə</option>
                        </select>
                    </form>
                </motion.div>

                {/* Sessions Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                                <tr>
                                    <th className="px-6 py-4 text-left">
                                        <button
                                            onClick={() => handleSort('id')}
                                            className="flex items-center space-x-1 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                                        >
                                            <span>ID</span>
                                            {sortBy === 'id' && (
                                                <Icon name={sortOrder === 'asc' ? 'arrow_left' : 'arrow_right'} size={14} />
                                            )}
                                        </button>
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        İstifadəçi
                                    </th>
                                    <th className="px-6 py-4 text-left">
                                        <button
                                            onClick={() => handleSort('messages_count')}
                                            className="flex items-center space-x-1 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                                        >
                                            <span>Mesajlar</span>
                                            {sortBy === 'messages_count' && (
                                                <Icon name={sortOrder === 'asc' ? 'arrow_left' : 'arrow_right'} size={14} />
                                            )}
                                        </button>
                                    </th>
                                    <th className="px-6 py-4 text-left">
                                        <button
                                            onClick={() => handleSort('created_at')}
                                            className="flex items-center space-x-1 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                                        >
                                            <span>Başlama</span>
                                            {sortBy === 'created_at' && (
                                                <Icon name={sortOrder === 'asc' ? 'arrow_left' : 'arrow_right'} size={14} />
                                            )}
                                        </button>
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Bitmə
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Müddət
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {sessions.data.length > 0 ? (
                                    sessions.data.map((session, index) => (
                                        <motion.tr
                                            key={session.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <span className="font-mono text-sm text-gray-600 dark:text-gray-400">
                                                    #{session.id}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">
                                                        {session.user_name}
                                                    </p>
                                                    {session.user_email && (
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                                            {session.user_email}
                                                        </p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                                    {session.messages_count}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                                {session.created_at}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                                {session.ended_at || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                                {session.duration ? `${session.duration} dəq` : '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                        session.status === 'Aktiv'
                                                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                                    }`}
                                                >
                                                    {session.status}
                                                </span>
                                            </td>
                                        </motion.tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center">
                                            <div className="text-gray-500 dark:text-gray-400">
                                                <Icon name="search" size={48} className="mx-auto mb-4 opacity-50" />
                                                <p className="text-lg font-medium">Heç bir söhbət tapılmadı</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {sessions.data.length > 0 && (
                        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                Göstərilir: {sessions.from}-{sessions.to} / {sessions.total}
                            </div>
                            <div className="flex space-x-2">
                                {sessions.links.map((link, index) => (
                                    <Link
                                        key={index}
                                        href={link.url || '#'}
                                        disabled={!link.url}
                                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                                            link.active
                                                ? 'bg-green-500 text-white'
                                                : link.url
                                                ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </AdminLayout>
    );
}
