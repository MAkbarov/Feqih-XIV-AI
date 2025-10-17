import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';

export default function IpSecurity({ logs, statistics, auth }) {
    const [selectedLogs, setSelectedLogs] = useState([]);
    const [showResolveModal, setShowResolveModal] = useState(false);
    const [currentLog, setCurrentLog] = useState(null);
    
    const resolveForm = useForm({
        admin_notes: ''
    });

    const handleSelectLog = (logId) => {
        setSelectedLogs(prev => 
            prev.includes(logId) 
                ? prev.filter(id => id !== logId)
                : [...prev, logId]
        );
    };

    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedLogs(logs.data.map(log => log.id));
        } else {
            setSelectedLogs([]);
        }
    };

    const openResolveModal = (log) => {
        setCurrentLog(log);
        setShowResolveModal(true);
        resolveForm.reset();
    };

    const handleResolve = (e) => {
        e.preventDefault();
        resolveForm.post(`/admin/ip-security/${currentLog.id}/resolve`, {
            onSuccess: () => {
                setShowResolveModal(false);
                setCurrentLog(null);
            }
        });
    };

    const handleDelete = (log) => {
        if (confirm('Bu təhlükəsizlik logunu silmək istədiyinizdən əminsiniz?')) {
            router.delete(`/admin/ip-security/${log.id}`);
        }
    };

    const getActionTypeLabel = (actionType) => {
        const types = {
            'blocked_duplicate': 'Dublikat Bloklandı',
            'rate_limited': 'Rate Limit',
            'suspicious_activity': 'Şübhəli Aktivlik',
            'unauthorized_access': 'İcazəsiz Giriş'
        };
        return types[actionType] || actionType;
    };

    const getActionTypeBadge = (actionType) => {
        const badges = {
            'blocked_duplicate': 'bg-red-100 text-red-800',
            'rate_limited': 'bg-yellow-100 text-yellow-800',
            'suspicious_activity': 'bg-orange-100 text-orange-800',
            'unauthorized_access': 'bg-red-100 text-red-800'
        };
        return badges[actionType] || 'bg-gray-100 text-gray-800';
    };

    return (
        <AdminLayout auth={auth}>
            <Head title="IP Təhlükəsizlik" />

            <div className="p-3 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">IP Təhlükəsizlik</h1>
                        <p className="text-gray-600 dark:text-gray-300 mt-1">Sistem təhlükəsizlik loglarını izləyin və idarə edin</p>
                    </div>
                    
                    <Link
                        href="/admin/chat-limits"
                        className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Chat Limitlər
                    </Link>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white/90 dark:bg-gray-800/90 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                        <div className="flex items-center justify-between mb-2">
                            <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <div className="text-2xl font-bold text-blue-600">{statistics.total_logs}</div>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">Ümumi Loglar</div>
                    </div>
                    
                    <div className="bg-white/90 dark:bg-gray-800/90 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                        <div className="flex items-center justify-between mb-2">
                            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            <div className="text-2xl font-bold text-red-600">{statistics.unresolved_logs}</div>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">Həll Edilməyən</div>
                    </div>
                    
                    <div className="bg-white/90 dark:bg-gray-800/90 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                        <div className="flex items-center justify-between mb-2">
                            <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                            </svg>
                            <div className="text-2xl font-bold text-yellow-600">{statistics.blocked_attempts}</div>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">Bloklanmış</div>
                    </div>
                    
                    <div className="bg-white/90 dark:bg-gray-800/90 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                        <div className="flex items-center justify-between mb-2">
                            <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-8 0h8m-8 0H4a2 2 0 00-2 2v8a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2h-4m-8 0V7" />
                            </svg>
                            <div className="text-2xl font-bold text-green-600">{statistics.today_logs}</div>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">Bu Gün</div>
                    </div>
                </div>

                {/* IP Security Logs Table */}
                <div className="bg-white/90 dark:bg-gray-800/90 rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden">
                    <div className="px-4 py-5 sm:p-6">
                        <div className="sm:flex sm:items-center sm:justify-between mb-6">
                            <div>
                                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                                    Təhlükəsizlik Logları
                                </h3>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
                                    IP təhlükəsizlik hadisələri və cəhdlər
                                </p>
                            </div>
                            {selectedLogs.length > 0 && (
                                <div className="flex space-x-2">
                                    <button
                                        type="button"
                                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                        onClick={() => setSelectedLogs([])}
                                    >
                                        Seçimi İptal Et
                                    </button>
                                </div>
                            )}
                        </div>

                        {logs.data.length === 0 ? (
                            <div className="text-center py-12 text-gray-900 dark:text-white">
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Təhlükəsizlik logu yoxdur</h3>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">Hələ heç bir IP təhlükəsizlik hadisəsi qeydə alınmayıb.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-900">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left">
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                                    checked={selectedLogs.length === logs.data.length}
                                                    onChange={(e) => handleSelectAll(e.target.checked)}
                                                />
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                IP Ünvan
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Əməliyyat
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                İstifadəçi
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Tarix
                                            </th>
                                            <th scope="col" className="relative px-6 py-3">
                                                <span className="sr-only">Əməliyyatlar</span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {logs.data.map((log) => (
                                            <tr key={log.id} className={log.is_resolved ? 'bg-gray-50' : 'bg-white'}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <input
                                                        type="checkbox"
                                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                                        checked={selectedLogs.includes(log.id)}
                                                        onChange={() => handleSelectLog(log.id)}
                                                    />
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {log.ip_address}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionTypeBadge(log.action_type)}`}>
                                                        {getActionTypeLabel(log.action_type)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {log.existing_user ? (
                                                        <div className="text-sm text-gray-900 dark:text-white">
                                                            <div className="font-medium">{log.existing_user.name}</div>
                                                            <div className="text-gray-500 dark:text-gray-300">{log.existing_user.email}</div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-sm text-gray-500">
                                                            {log.attempted_email ? (
                                                                <div>
                                                                    <div className="text-red-600">Cəhd: {log.attempted_name}</div>
                                                                    <div className="text-red-500">{log.attempted_email}</div>
                                                                </div>
                                                            ) : (
                                                                <span className="text-gray-500 dark:text-gray-300">Qeydiyyatsız</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {log.is_resolved ? (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                            Həll Edildi
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                            Açıq
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                                    {new Date(log.created_at).toLocaleDateString('az-AZ')} {new Date(log.created_at).toLocaleTimeString('az-AZ')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex items-center space-x-2">
                                                        {!log.is_resolved && (
                                                            <button
                                                                type="button"
                                                                onClick={() => openResolveModal(log)}
                                                                className="text-green-600 hover:text-green-900"
                                                            >
                                                                Həll Et
                                                            </button>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDelete(log)}
                                                            className="text-red-600 hover:text-red-900"
                                                        >
                                                            Sil
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Pagination */}
                        {logs.links && logs.links.length > 3 && (
                            <div className="mt-6 flex items-center justify-between">
                                <div className="flex-1 flex justify-between sm:hidden">
                                    {logs.prev_page_url && (
                                        <Link href={logs.prev_page_url} className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                                            Əvvəlki
                                        </Link>
                                    )}
                                    {logs.next_page_url && (
                                        <Link href={logs.next_page_url} className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                                            Növbəti
                                        </Link>
                                    )}
                                </div>
                                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm text-gray-700">
                                            <span className="font-medium">{logs.from}</span> - <span className="font-medium">{logs.to}</span> arası, 
                                            ümumi <span className="font-medium">{logs.total}</span> nəticə
                                        </p>
                                    </div>
                                    <div>
                                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                            {logs.links.map((link, index) => (
                                                <Link
                                                    key={index}
                                                    href={link.url}
                                                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                        link.active
                                                            ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                    } ${
                                                        index === 0 ? 'rounded-l-md' : ''
                                                    } ${
                                                        index === logs.links.length - 1 ? 'rounded-r-md' : ''
                                                    }`}
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                />
                                            ))}
                                        </nav>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Resolve Modal */}
            {showResolveModal && currentLog && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full border border-gray-200 dark:border-gray-600">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="flex-shrink-0 w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Logu Həll Et</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">IP: <strong>{currentLog.ip_address}</strong> - {getActionTypeLabel(currentLog.action_type)}</p>
                            </div>
                        </div>
                        
                        <form onSubmit={handleResolve}>
                            <div>
                                <label htmlFor="admin_notes" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                                    Admin Qeydləri
                                </label>
                                <textarea
                                    id="admin_notes"
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                                    placeholder="Bu problemin necə həll edildiyi haqqında qeyd..."
                                    value={resolveForm.data.admin_notes}
                                    onChange={(e) => resolveForm.setData('admin_notes', e.target.value)}
                                />
                                {resolveForm.errors.admin_notes && (
                                    <p className="text-red-500 text-xs mt-1">{resolveForm.errors.admin_notes}</p>
                                )}
                            </div>
                            
                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowResolveModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 transition-colors"
                                >
                                    İptal Et
                                </button>
                                <button
                                    type="submit"
                                    disabled={resolveForm.processing}
                                    className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                                >
                                    {resolveForm.processing ? (
                                        <>
                                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Həll Edilir...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            Həll Et
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
