import { useState, useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '@/Components/Icon';

// Tarix formatlaşdırma funksiyası
const formatAzerbaijaniDate = (dateString, includeTime = false, includeWeekday = false) => {
    if (!dateString) return 'Məlum deyil';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Səhv tarix';
    
    const weekdays = ['bazar', 'bazar ertəsi', 'çərşənbə axşamı', 'çərşənbə', 'cümə axşamı', 'cümə', 'şənbə'];
    const months = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avqust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr'];
    const monthsShort = ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avq', 'sen', 'okt', 'noy', 'dek'];
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = includeWeekday ? months[date.getMonth()] : monthsShort[date.getMonth()];
    const year = date.getFullYear();
    
    let result = `${day} ${month} ${year}`;
    
    if (includeWeekday) {
        const weekday = weekdays[date.getDay()];
        result = `${weekday}, ${result}`;
    }
    
    if (includeTime) {
        const hour = String(date.getHours()).padStart(2, '0');
        const minute = String(date.getMinutes()).padStart(2, '0');
        result += `, ${hour}:${minute}`;
    }
    
    return result;
};

export default function UsersIndex({ users, roles, blockedUsers = {}, blockedIps = {} }) {
    const [selectedUser, setSelectedUser] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [sortBy, setSortBy] = useState('created_at');
    const [sortOrder, setSortOrder] = useState('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const [usersPerPage] = useState(10);
    
    // Enhanced translations
    const t = {
        title: 'İstifadəçi İdarəsi',
        name: 'Ad',
        email: 'Email',
        role: 'Rol',
        joined: 'Qoşulma Tarixi',
        lastActive: 'Son Aktivlik',
        actions: 'Əməliyyat',
        edit: 'Redaktə Et',
        save: 'Saxla',
        cancel: 'Ləğv Et',
        admin: 'Admin',
        user: 'İstifadəçi',
        chatLimits: 'Çatbot Limitləri',
        dailyLimit: 'Günlük Limit',
        monthlyLimit: 'Aylıq Limit',
        unlimitedAccess: 'Məhdudiyyətsiz giriş',
        resetLimits: 'Limitləri sıfırla',
        currentLimits: 'Cari Limitlər',
        noLimitsSet: 'Limit təyin edilməyib',
        search: 'İstifadəçi axtar...',
        filterByRole: 'Rola görə filtr',
        allRoles: 'Bütün rollar',
        sortBy: 'Sırala',
        totalUsers: 'Ümumi İstifadəçi',
        activeUsers: 'Aktiv İstifadəçi',
        adminUsers: 'Admin İstifadəçi',
        settings: 'Parametrlər',
        activity: 'Aktivlik',
        security: 'Təhlükəsizlik',
        profile: 'Profil',
        permissions: 'İcazələr',
        statistics: 'Statistika',
        block: 'Blok Et',
        delete: 'Sil',
        view: 'Bax'
    };

    // Filter and sort users
    const filteredUsers = users.data.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'all' || user.role?.name === roleFilter;
        return matchesSearch && matchesRole;
    }).sort((a, b) => {
        let aValue = a[sortBy];
        let bValue = b[sortBy];
        
        if (sortBy === 'created_at') {
            aValue = new Date(aValue);
            bValue = new Date(bValue);
        }
        
        if (sortOrder === 'asc') {
            return aValue > bValue ? 1 : -1;
        } else {
            return aValue < bValue ? 1 : -1;
        }
    });
    
    // Pagination calculations
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
    const startIndex = (currentPage - 1) * usersPerPage;
    const endIndex = startIndex + usersPerPage;
    const currentUsers = filteredUsers.slice(startIndex, endIndex);
    
    // Reset to first page when search/filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, roleFilter]);
    
    const openEditModal = (user) => {
        setSelectedUser(user);
        setShowEditModal(true);
    };
    
    const closeEditModal = () => {
        setSelectedUser(null);
        setShowEditModal(false);
    };
    
    // Statistics
    const totalUsers = users.data.length;
    const adminUsers = users.data.filter(u => u.role?.name === 'admin').length;
    const activeUsers = users.data.filter(u => u.last_login_at).length;

    return (
        <AdminLayout>
            <Head title={t.title} />
            
            <div className="p-3 sm:p-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t.title}</h1>
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">İstifadəçiləri idarə edin və onların hesab parametrlərini tənzimləyin</p>
                        </div>
                    </div>
                </div>
                
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-blue-100">{t.totalUsers}</p>
                                <p className="text-3xl font-bold">{totalUsers}</p>
                            </div>
                            <div className="p-3 bg-blue-400/30 rounded-lg">
                                <Icon name="users" size={24} />
                            </div>
                        </div>
                    </motion.div>
                    
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-emerald-100">{t.activeUsers}</p>
                                <p className="text-3xl font-bold">{activeUsers}</p>
                            </div>
                            <div className="p-3 bg-emerald-400/30 rounded-lg">
                                <Icon name="user_check" size={24} />
                            </div>
                        </div>
                    </motion.div>
                    
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-purple-100">{t.adminUsers}</p>
                                <p className="text-3xl font-bold">{adminUsers}</p>
                            </div>
                            <div className="p-3 bg-purple-400/30 rounded-lg">
                                <Icon name="shield" size={24} />
                            </div>
                        </div>
                    </motion.div>
                </div>
                
                {/* Search and Filter Bar */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 mb-8"
                >
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                                    <Icon name="search" size={20} className="text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    placeholder={t.search}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                                />
                            </div>
                        </div>
                        
                        {/* Role Filter */}
                        <div className="sm:w-48">
                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            >
                                <option value="all">{t.allRoles}</option>
                                <option value="admin">{t.admin}</option>
                                <option value="user">{t.user}</option>
                            </select>
                        </div>
                        
                        {/* Sort */}
                        <div className="sm:w-48">
                            <select
                                value={`${sortBy}-${sortOrder}`}
                                onChange={(e) => {
                                    const [field, order] = e.target.value.split('-');
                                    setSortBy(field);
                                    setSortOrder(order);
                                }}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            >
                                <option value="created_at-desc">Yeni - Köhnə</option>
                                <option value="created_at-asc">Köhnə - Yeni</option>
                                <option value="name-asc">Ad (A-Z)</option>
                                <option value="name-desc">Ad (Z-A)</option>
                            </select>
                        </div>
                    </div>
                </motion.div>
                
                {/* Users Grid */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8"
                >
                    {filteredUsers.length === 0 ? (
                        <div className="col-span-full text-center py-12">
                            <Icon name="users" size={64} className="mx-auto text-gray-400 mb-4" />
                            <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">İstifadəçi tapılmadı</h3>
                            <p className="text-gray-500 dark:text-gray-500">Axtarış kriteriyalarınızı dəyişdirin</p>
                        </div>
                    ) : (
                        currentUsers.map((user, index) => (
                            <UserCard
                                key={user.id}
                                user={user}
                                roles={roles}
                                onEdit={() => openEditModal(user)}
                                t={t}
                                index={index}
                            />
                        ))
                    )}
                </motion.div>
                
                {/* Pagination */}
                {filteredUsers.length > usersPerPage && (
                    <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-6 mt-8">
                        <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                            <span>
                                <span className="font-medium">{startIndex + 1}</span> - <span className="font-medium">{Math.min(endIndex, filteredUsers.length)}</span> arası, 
                                <span className="font-medium"> {filteredUsers.length}</span> ümumi nəticə
                            </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-500 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <Icon name="chevron_left" size={16} className="mr-1" />
                                Əvvəlki
                            </button>
                            
                            <div className="flex items-center space-x-1">
                                {[...Array(totalPages)].map((_, index) => {
                                    const pageNumber = index + 1;
                                    const isCurrentPage = pageNumber === currentPage;
                                    const isNearCurrentPage = Math.abs(pageNumber - currentPage) <= 2;
                                    const isFirstOrLast = pageNumber === 1 || pageNumber === totalPages;
                                    
                                    if (totalPages <= 7 || isNearCurrentPage || isFirstOrLast) {
                                        return (
                                            <button
                                                key={pageNumber}
                                                onClick={() => setCurrentPage(pageNumber)}
                                                className={`relative inline-flex items-center px-3 py-2 text-sm font-medium border rounded-lg transition-colors ${
                                                    isCurrentPage
                                                        ? 'bg-blue-600 text-white border-blue-600'
                                                        : 'text-gray-500 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                                                }`}
                                            >
                                                {pageNumber}
                                            </button>
                                        );
                                    } else if (pageNumber === currentPage - 3 || pageNumber === currentPage + 3) {
                                        return (
                                            <span key={pageNumber} className="px-3 py-2 text-gray-500">
                                                ...
                                            </span>
                                        );
                                    }
                                    return null;
                                })}
                            </div>
                            
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-500 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Növbəti
                                <Icon name="chevron_right" size={16} className="ml-1" />
                            </button>
                        </div>
                    </div>
                )}
                
                {/* Edit Modal */}
                <AnimatePresence>
                    {showEditModal && selectedUser && (
                        <UserEditModal
                            user={selectedUser}
                            roles={roles}
                            onClose={closeEditModal}
                            t={t}
                        />
                    )}
                </AnimatePresence>
            </div>
        </AdminLayout>
    );
}

// Modern User Card Component
function UserCard({ user, roles, onEdit, t, index }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 group"
        >
            {/* User Avatar & Basic Info */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                    {/* Avatar */}
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                        {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {user.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                    </div>
                </div>
                
                {/* Role Badge */}
                <div className="flex-shrink-0">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        user.role?.name === 'admin' 
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' 
                            : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                    }`}>
                        {user.role?.name === 'admin' ? t.admin : t.user}
                    </span>
                </div>
            </div>
            
            {/* User Stats */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                        <Icon name="calendar" size={16} className="text-gray-400" />
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Qoşulub</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-1">
                        {formatAzerbaijaniDate(user.created_at)}
                    </p>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                        <Icon name="clock" size={16} className="text-gray-400" />
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Status</span>
                    </div>
                    <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                        {user.last_login_at ? 'Aktiv' : 'Yeni'}
                    </p>
                </div>
            </div>
            
            {/* Chat Limits */}
            <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Çat Limitləri</span>
                    {user.unlimited_access && (
                        <span className="px-2 py-1 text-xs font-medium bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-full">
                            ∞ Məhdudiyyətsiz
                        </span>
                    )}
                </div>
                
                {!user.unlimited_access && (
                    <div className="grid grid-cols-2 gap-2">
                        <div className="text-center bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2">
                            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Günlük</p>
                            <p className="text-sm font-bold text-blue-900 dark:text-blue-100">
                                {user.daily_limit || 'Sistem'}
                            </p>
                        </div>
                        <div className="text-center bg-purple-50 dark:bg-purple-900/20 rounded-lg p-2">
                            <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Aylıq</p>
                            <p className="text-sm font-bold text-purple-900 dark:text-purple-100">
                                {user.monthly_limit || 'Sistem'}
                            </p>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Action Button */}
            <button
                onClick={onEdit}
                className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-lg"
            >
                <div className="flex items-center justify-center space-x-2">
                    <Icon name="edit" size={18} />
                    <span>{t.edit}</span>
                </div>
            </button>
        </motion.div>
    );
}

// Advanced User Edit Modal Component
function UserEditModal({ user, roles, onClose, t }) {
    const initialLimitType = user.daily_limit ? 'daily' : (user.monthly_limit ? 'monthly' : 'daily');
    const [activeTab, setActiveTab] = useState('profile');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showBlockModal, setShowBlockModal] = useState(false);
    
    const { data, setData, patch, processing, delete: destroy, post, errors } = useForm({
        name: user.name,
        role_id: user.role_id,
        daily_limit: user.daily_limit || null,
        monthly_limit: user.monthly_limit || null,
        limit_type: initialLimitType,
        unlimited_access: user.unlimited_access || false,
        reset_limits: false,
    });
    
    const [blockData, setBlockData] = useState({
        block_account: true,
        block_ip: false,
        ip_address: user.registration_ip || '',
        reason: ''
    });
    
    const handleSubmit = (e) => {
        e.preventDefault();
        patch(`/admin/users/${user.id}`, {
            onSuccess: () => {
                onClose();
                // Could add a success toast here
            },
            onError: () => {
                // Could add an error toast here
            }
        });
    };
    
    const handleDelete = () => {
        destroy(`/admin/users/${user.id}`, {
            onSuccess: () => {
                onClose();
            }
        });
    };
    
    const handleBlock = () => {
        post(`/admin/users/${user.id}/block`, blockData, {
            onSuccess: () => {
                setShowBlockModal(false);
                onClose();
            }
        });
    };
    
    const tabs = [
        { id: 'profile', name: t.profile, icon: 'profile' },
        { id: 'limits', name: t.chatLimits, icon: 'message' },
        { id: 'security', name: t.security, icon: 'security' },
        { id: 'activity', name: t.activity, icon: 'analytics' }
    ];
    
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start sm:items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="my-6 sm:my-0 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-hidden"
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-xl">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">{user.name}</h2>
                                <p className="text-blue-100">{user.email}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
                        >
                            <Icon name="close" size={24} />
                        </button>
                    </div>
                </div>
                
                {/* Tabs */}
                <div className="border-b border-gray-200 dark:border-gray-700">
                    <nav className="flex space-x-1 sm:space-x-8 px-2 sm:px-6">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                title={tab.name}
                                className={`flex-1 sm:flex-initial flex flex-col sm:flex-row items-center justify-center sm:justify-start space-y-1 sm:space-y-0 sm:space-x-2 py-3 sm:py-4 px-2 sm:px-0 border-b-2 font-medium text-xs sm:text-sm transition-colors rounded-t-lg sm:rounded-none ${
                                    activeTab === tab.id
                                        ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 sm:bg-transparent dark:bg-blue-900/20 sm:dark:bg-transparent'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-50 sm:hover:bg-transparent dark:hover:bg-gray-700/30 sm:dark:hover:bg-transparent'
                                }`}
                            >
                                <Icon name={tab.icon} size={20} className="sm:w-[18px] sm:h-[18px]" />
                                <span className="sm:hidden text-center leading-tight">{tab.name}</span>
                                <span className="hidden sm:inline">{tab.name}</span>
                            </button>
                        ))}
                    </nav>
                </div>
                
                {/* Content */}
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    <form onSubmit={handleSubmit}>
                        {activeTab === 'profile' && (
                            <ProfileTab
                                data={data}
                                setData={setData}
                                user={user}
                                roles={roles}
                                t={t}
                                errors={errors}
                            />
                        )}
                        
                        {activeTab === 'limits' && (
                            <LimitsTab
                                data={data}
                                setData={setData}
                                t={t}
                                errors={errors}
                            />
                        )}
                        
                        {activeTab === 'security' && (
                            <SecurityTab
                                user={user}
                                t={t}
                                onBlock={() => setShowBlockModal(true)}
                                onDelete={() => setShowDeleteConfirm(true)}
                            />
                        )}
                        
                        {activeTab === 'activity' && (
                            <ActivityTab
                                user={user}
                                t={t}
                            />
                        )}
                    </form>
                </div>
                
                {/* Footer */}
                <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 flex justify-between items-center">
                    <div className="flex space-x-3">
                        {activeTab === 'security' && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setShowBlockModal(true)}
                                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                                >
                                    <Icon name="block" size={18} />
                                    <span>{t.block}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                                >
                                    <Icon name="delete" size={18} />
                                    <span>{t.delete}</span>
                                </button>
                            </>
                        )}
                    </div>
                    
                    <div className="flex space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                        >
                            {t.cancel}
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            onClick={handleSubmit}
                            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 text-white rounded-lg font-medium transition-all flex items-center space-x-2"
                        >
                            {processing ? (
                                <>
                                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                                    <span>Saxlanılır...</span>
                                </>
                            ) : (
                                <>
                                    <Icon name="save" size={18} />
                                    <span>{t.save}</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </motion.div>
            
            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {showDeleteConfirm && (
                    <DeleteConfirmModal
                        onConfirm={handleDelete}
                        onCancel={() => setShowDeleteConfirm(false)}
                        userName={user.name}
                        t={t}
                    />
                )}
            </AnimatePresence>
            
            {/* Block Modal */}
            <AnimatePresence>
                {showBlockModal && (
                    <BlockUserModal
                        blockData={blockData}
                        setBlockData={setBlockData}
                        onConfirm={handleBlock}
                        onCancel={() => setShowBlockModal(false)}
                        t={t}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// Profile Tab Component
function ProfileTab({ data, setData, user, roles, t, errors }) {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Info */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                        <Icon name="user" size={20} />
                        <span>Əsas Məlumatlar</span>
                    </h3>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.name}</label>
                        <input
                            type="text"
                            value={data.name}
                            onChange={e => setData('name', e.target.value)}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors ${
                                errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                            }`}
                            required
                        />
                        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.email}</label>
                        <input
                            type="email"
                            value={user.email}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                            disabled
                        />
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Email dəyişdirilə bilməz</p>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.role}</label>
                        <select
                            value={data.role_id}
                            onChange={e => setData('role_id', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        >
                            {roles.map(role => (
                                <option key={role.id} value={role.id}>
                                    {role.name === 'admin' ? t.admin : t.user}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                
                {/* User Statistics */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                        <Icon name="chart" size={20} />
                        <span>İstifadəçi Məlumatları</span>
                    </h3>
                    
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Hesab ID</span>
                            <span className="text-sm font-mono font-bold text-gray-900 dark:text-gray-100">#{user.id}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Qoşulma Tarixi</span>
                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                {formatAzerbaijaniDate(user.created_at, false, true)}
                            </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Son Giriş</span>
                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                {user.last_login_at ? formatAzerbaijaniDate(user.last_login_at, true, true) : 'Hələ giriş etməyib'}
                            </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">IP Ünvanı</span>
                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                {user.registration_ip || user.last_login_ip || 'Məlum deyil'}
                            </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">İstifadəçi Tipi</span>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                user.role?.name === 'admin' 
                                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-800 dark:text-purple-200'
                                    : 'bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-200'
                            }`}>
                                {user.role?.name === 'admin' ? t.admin : t.user}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Limits Tab Component
function LimitsTab({ data, setData, t, errors }) {
    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-6">
                <Icon name="clock" size={24} className="text-blue-500" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Çat Limitləri</h3>
            </div>
            
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-6">
                <div className="flex items-start space-x-3">
                    <Icon name="warning" size={24} className="text-yellow-500 flex-shrink-0 mt-1" />
                    <div>
                        <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Limit Parametrləri</h4>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                            İstifadəçinin çatbot istifadə limitlərini təyin edin. Məhdudiyyətsiz giriş aktivləşdirilərsə, istifadəçi limitsiz mesaj göndərə biləcək.
                        </p>
                    </div>
                </div>
            </div>
            
            {/* Unlimited Access Toggle */}
            <div className="bg-white dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 p-6">
                <div className="flex items-center space-x-3">
                    <button
                        type="button"
                        onClick={() => setData('unlimited_access', !data.unlimited_access)}
                        className={`relative inline-flex h-6 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                            data.unlimited_access ? 'bg-emerald-600' : 'bg-gray-200 dark:bg-gray-600'
                        }`}
                        role="switch"
                        aria-checked={data.unlimited_access}
                        aria-labelledby="unlimited-access-label"
                    >
                        <span className="sr-only">Məhdudiyyətsiz giriş</span>
                        <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                data.unlimited_access ? 'translate-x-6' : 'translate-x-0'
                            }`}
                        />
                    </button>
                    
                    <div className="flex-1">
                        <label id="unlimited-access-label" className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {t.unlimitedAccess}
                        </label>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Bu istifadəçi üçün bütün çat limitləri aradan qaldırılacaq
                        </p>
                    </div>
                    
                    {data.unlimited_access && (
                        <div className="flex-shrink-0">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-100">
                                <Icon name="check" size={14} className="mr-1" />
                                Aktiv
                            </span>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Limit Configuration */}
            {!data.unlimited_access && (
                <div className="space-y-6">
                    {/* Limit Type Selection */}
                    <div className="bg-white dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 p-6">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Limit Tipi</h4>
                        <div className="flex space-x-4">
                            <button
                                type="button"
                                onClick={() => setData('limit_type', 'daily')}
                                className={`flex-1 px-6 py-4 rounded-xl border-2 transition-all ${
                                    data.limit_type === 'daily'
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                                }`}
                            >
                                <div className="text-center">
                                    <Icon name="sun" size={24} className={`mx-auto mb-2 ${
                                        data.limit_type === 'daily' ? 'text-blue-500' : 'text-gray-400'
                                    }`} />
                                    <div className="font-semibold">Günlük Limit</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        Hər gün sıfırlanır
                                    </div>
                                </div>
                            </button>
                            
                            <button
                                type="button"
                                onClick={() => setData('limit_type', 'monthly')}
                                className={`flex-1 px-6 py-4 rounded-xl border-2 transition-all ${
                                    data.limit_type === 'monthly'
                                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                                }`}
                            >
                                <div className="text-center">
                                    <Icon name="calendar" size={24} className={`mx-auto mb-2 ${
                                        data.limit_type === 'monthly' ? 'text-purple-500' : 'text-gray-400'
                                    }`} />
                                    <div className="font-semibold">Aylıq Limit</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        Hər ay sıfırlanır
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                    
                    {/* Limit Value Input */}
                    <div className="bg-white dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 p-6">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                            {data.limit_type === 'daily' ? t.dailyLimit : t.monthlyLimit}
                        </h4>
                        
                        <div className="max-w-md">
                            <input
                                type="number"
                                value={data.limit_type === 'daily' ? (data.daily_limit || '') : (data.monthly_limit || '')}
                                onChange={e => {
                                    const value = e.target.value ? parseInt(e.target.value) : null;
                                    if (data.limit_type === 'daily') {
                                        setData('daily_limit', value);
                                    } else {
                                        setData('monthly_limit', value);
                                    }
                                }}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                min="1"
                                placeholder="Sistem limitindən istifadə et (boş burax)"
                            />
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                Boş buraxsanız, sistem tənzimləmələrindəki limit istifadə ediləcək.
                            </p>
                        </div>
                    </div>
                    
                    {/* Reset Limits */}
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-6">
                        <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={data.reset_limits}
                                onChange={e => setData('reset_limits', e.target.checked)}
                                className="h-5 w-5 text-red-600 border-red-300 rounded focus:ring-red-500 focus:border-red-500"
                            />
                            <div className="flex-1">
                                <span className="text-lg font-semibold text-red-800 dark:text-red-200">
                                    {t.resetLimits}
                                </span>
                                <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                                    Bu istifadəçinin cari limitləri sıfırlanacaq və yenidən başlayacaq
                                </p>
                            </div>
                        </label>
                    </div>
                </div>
            )}
        </div>
    );
}

// Security Tab Component
function SecurityTab({ user, t, onBlock, onDelete }) {
    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-6">
                <Icon name="shield" size={24} className="text-red-500" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Təhlükəsizlik Əməliyyatları</h3>
            </div>
            
            {/* Security Info */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-6">
                <div className="flex items-start space-x-3">
                    <Icon name="info" size={24} className="text-blue-500 flex-shrink-0 mt-1" />
                    <div>
                        <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">İstifadəçi Təhlükəsizliyi</h4>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                            Bu bölmədə istifadəçi hesabına aid təhlükəsizlik əməliyyatlarını həyata keçirə bilərsiniz.
                        </p>
                    </div>
                </div>
            </div>
            
            {/* Security Actions */}
            <div className="grid gap-6">
                {/* Block User */}
                <div className="bg-white dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 p-6">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                İstifadəçini Blokla
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                İstifadəçinin hesabını və ya IP ünvanını bloklaya bilərsiniz. Bu əməliyyat geri alına bilər.
                            </p>
                            <div className="flex items-center space-x-4 text-sm">
                                <div className="flex items-center space-x-2">
                                    <Icon name="user" size={16} className="text-gray-400" />
                                    <span className="text-gray-600 dark:text-gray-400">Hesab ID: #{user.id}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Icon name="globe" size={16} className="text-gray-400" />
                                    <span className="text-gray-600 dark:text-gray-400">IP: {user.registration_ip || user.last_login_ip || 'Məlum deyil'}</span>
                                </div>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onBlock}
                            className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                            <Icon name="block" size={18} />
                            <span>Blokla</span>
                        </button>
                    </div>
                </div>
                
                {/* Delete User */}
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-6">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <h4 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                                Hesabı Tamamilə Sil
                            </h4>
                            <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                                ⚠️ Bu əməliyyat geri alına bilməz! İstifadəçinin bütün məlumatları və çat tarixçəsi silinəcək.
                            </p>
                            <div className="bg-red-100 dark:bg-red-900/40 border border-red-200 dark:border-red-700 rounded-lg p-3 mb-4">
                                <p className="text-xs font-medium text-red-800 dark:text-red-200">
                                    Silinəcək məlumatlar:
                                </p>
                                <ul className="text-xs text-red-700 dark:text-red-300 mt-1 space-y-1">
                                    <li>• İstifadəçi hesab məlumatları</li>
                                    <li>• Bütün çat sessiyaları və mesajları</li>
                                    <li>• İstifadəçi parametrləri</li>
                                    <li>• Giriş tarixçəsi</li>
                                </ul>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onDelete}
                            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                            <Icon name="delete" size={18} />
                            <span>Hesabı Sil</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Activity Tab Component
function ActivityTab({ user, t }) {
    // Mock data - bu məlumatlar backend-dən gəlməlidir
    const mockStats = {
        total_messages: user.total_messages || Math.floor(Math.random() * 500) + 10,
        active_days: user.active_days || Math.floor(Math.random() * 30) + 1,
        average_messages_per_day: user.average_messages_per_day || Math.floor(Math.random() * 20) + 1,
        most_active_hour: user.most_active_hour || Math.floor(Math.random() * 24),
        last_seen_device: user.last_seen_device || 'Desktop',
        favorite_topics: user.favorite_topics || ['AI Assistant', 'General Chat', 'Help & Support'],
        login_streak: user.login_streak || Math.floor(Math.random() * 7),
        total_sessions: user.total_sessions || Math.floor(Math.random() * 50) + 5
    };
    
    const getActiveHourText = (hour) => {
        if (hour >= 6 && hour < 12) return 'Səhər';
        if (hour >= 12 && hour < 17) return 'Gündüz';
        if (hour >= 17 && hour < 21) return 'Axşam';
        return 'Gecə';
    };
    
    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-6">
                <Icon name="chart" size={24} className="text-green-500" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">İstifadəçi Aktivliyi və Statistika</h3>
            </div>
            
            {/* Enhanced Activity Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl p-6 text-center">
                    <Icon name="message" size={32} className="mx-auto mb-3 text-blue-600" />
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{mockStats.total_messages}</p>
                    <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">Ümumi Mesajlar</p>
                </div>
                
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30 rounded-xl p-6 text-center">
                    <Icon name="calendar" size={32} className="mx-auto mb-3 text-emerald-600" />
                    <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">{mockStats.active_days}</p>
                    <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">Aktiv Günlər</p>
                </div>
                
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 rounded-xl p-6 text-center">
                    <Icon name="trending_up" size={32} className="mx-auto mb-3 text-orange-600" />
                    <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{mockStats.average_messages_per_day}</p>
                    <p className="text-sm text-orange-700 dark:text-orange-300 font-medium">Günlük Ortalama</p>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-xl p-6 text-center">
                    <Icon name="zap" size={32} className="mx-auto mb-3 text-purple-600" />
                    <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{mockStats.login_streak}</p>
                    <p className="text-sm text-purple-700 dark:text-purple-300 font-medium">Giriş Seriyasi (gün)</p>
                </div>
            </div>
            
            {/* Detailed Activity Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Usage Patterns */}
                <div className="bg-white dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 p-6">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center space-x-2">
                        <Icon name="clock" size={20} className="text-indigo-500" />
                        <span>İstifadə Nümunələri</span>
                    </h4>
                    
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-600/30 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                                    <Icon name="sun" size={16} className="text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Ən Aktiv Vaxt</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{getActiveHourText(mockStats.most_active_hour)}</p>
                                </div>
                            </div>
                            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                {String(mockStats.most_active_hour).padStart(2, '0')}:00
                            </span>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-600/30 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                                    <Icon name="monitor" size={16} className="text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Son Cihaz</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Qoşulma cihazı</p>
                                </div>
                            </div>
                            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                {mockStats.last_seen_device}
                            </span>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-600/30 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                                    <Icon name="activity" size={16} className="text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Ümumi Sessiyalar</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Giriş sayı</p>
                                </div>
                            </div>
                            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                {mockStats.total_sessions}
                            </span>
                        </div>
                    </div>
                </div>
                
                {/* Favorite Topics */}
                <div className="bg-white dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 p-6">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center space-x-2">
                        <Icon name="star" size={20} className="text-yellow-500" />
                        <span>Sevimli Mövzular</span>
                    </h4>
                    
                    <div className="space-y-3">
                        {mockStats.favorite_topics.map((topic, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-600/30 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                        index === 0 ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                                        index === 1 ? 'bg-green-100 dark:bg-green-900/30' :
                                        'bg-blue-100 dark:bg-blue-900/30'
                                    }`}>
                                        <Icon 
                                            name={index === 0 ? 'trophy' : index === 1 ? 'chat' : 'help'} 
                                            size={16} 
                                            className={`${
                                                index === 0 ? 'text-yellow-600' :
                                                index === 1 ? 'text-green-600' :
                                                'text-blue-600'
                                            }`} 
                                        />
                                    </div>
                                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{topic}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className={`w-2 h-2 rounded-full ${
                                        index === 0 ? 'bg-yellow-400' :
                                        index === 1 ? 'bg-green-400' :
                                        'bg-blue-400'
                                    }`}></div>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {Math.floor(Math.random() * 50) + 10}%
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            
            {/* Activity Timeline */}
            <div className="bg-white dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 p-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center space-x-2">
                    <Icon name="timeline" size={20} className="text-gray-600" />
                    <span>Aktivlik Tarixçəsi</span>
                </h4>
                
                <div className="space-y-6">
                    {user.created_at && (
                        <div className="flex items-start space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                                <Icon name="user_plus" size={18} className="text-white" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                        Hesab yaradılıb
                                    </p>
                                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full font-medium">
                                        Başlanğıc
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {formatAzerbaijaniDate(user.created_at, true, true)}
                                </p>
                                <div className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                                    IP: {user.registration_ip || user.last_login_ip || 'Məlum deyil'}
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {user.last_login_at ? (
                        <div className="flex items-start space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                                <Icon name="login" size={18} className="text-white" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                        Son aktiv giriş
                                    </p>
                                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full font-medium">
                                        Aktivlik
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {formatAzerbaijaniDate(user.last_login_at, true, true)}
                                </p>
                                <div className="mt-2 flex items-center space-x-4 text-xs">
                                    <span className="text-gray-400 dark:text-gray-500">
                                        Cihaz: {mockStats.last_seen_device}
                                    </span>
                                    <span className="text-gray-400 dark:text-gray-500">
                                        Sessiya: ~{Math.floor(Math.random() * 60) + 15} dəq
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-gray-50 dark:bg-gray-600/30 rounded-xl">
                            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Icon name="clock" size={32} className="text-gray-400" />
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 font-medium mb-2">Hələ aktiv deyil</p>
                            <p className="text-sm text-gray-500 dark:text-gray-500">
                                İstifadəçi hələ sistemi ziyarət etməyib və ya çatbot istifadə etməyib
                            </p>
                        </div>
                    )}
                    
                    {/* Additional mock activities */}
                    <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <Icon name="message" size={18} className="text-white" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center space-x-2">
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                    İlk mesaj göndərilib
                                </p>
                                <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full font-medium">
                                    Məlumat
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Çatbot ilə əlaqə qurdu və ilk sualını verərək sistemi istifadəyə başladı
                            </p>
                            <div className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                                Mövzu: "Salam və yağ"
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Delete Confirmation Modal
function DeleteConfirmModal({ onConfirm, onCancel, userName, t }) {
    const [confirmText, setConfirmText] = useState('');
    const confirmPhrase = 'SIL';
    const canDelete = confirmText === confirmPhrase;
    
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-start sm:items-center justify-center z-[60] p-2 sm:p-4 overflow-y-auto"
            onClick={onCancel}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="my-6 sm:my-0 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-red-200 dark:border-red-700 w-full max-w-md p-6"
            >
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Icon name="warning" size={32} className="text-red-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                        Hesabı Sil
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                        <strong>"{userName}"</strong> hesabını silmək istədiyinizdən əminsiniz?
                    </p>
                </div>
                
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 mb-6">
                    <p className="text-sm text-red-800 dark:text-red-200 font-medium mb-2">
                        ⚠️ Bu əməliyyat geri alına bilməz!
                    </p>
                    <p className="text-xs text-red-700 dark:text-red-300">
                        Hesabın bütün məlumatları, mesajları və tarixçəsi həmişəlik silinəcək.
                    </p>
                </div>
                
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Təsdiq üçün "<span className="font-bold text-red-600">{confirmPhrase}</span>" yazın:
                    </label>
                    <input
                        type="text"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        placeholder={confirmPhrase}
                        autoComplete="off"
                    />
                </div>
                
                <div className="flex space-x-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                    >
                        {t.cancel}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={!canDelete}
                        className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                    >
                        <Icon name="delete" size={18} />
                        <span>{canDelete ? 'Sil' : 'Təsdiq gözləyir...'}</span>
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

// Block User Modal
function BlockUserModal({ blockData, setBlockData, onConfirm, onCancel, t }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-start sm:items-center justify-center z-[60] p-2 sm:p-4 overflow-y-auto"
            onClick={onCancel}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="my-6 sm:my-0 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-orange-200 dark:border-orange-700 w-full max-w-lg p-6"
            >
                <div className="mb-6">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                            <Icon name="block" size={24} className="text-orange-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                İstifadəçini Blokla
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                İstifadəçinin hesabını və ya IP ünvanını bloklayın
                            </p>
                        </div>
                    </div>
                </div>
                
                <div className="space-y-6">
                    {/* Block Options */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">Bloklanacaq mənbələr</h4>
                        
                        <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={blockData.block_account}
                                onChange={e => setBlockData({ ...blockData, block_account: e.target.checked })}
                                className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                            />
                            <div className="flex-1">
                                <span className="font-medium text-gray-900 dark:text-gray-100">İstifadəçi hesabını blokla</span>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Bu hesab sistemi ziyarət edə bilməyəcək</p>
                            </div>
                        </label>
                        
                        <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={blockData.block_ip}
                                onChange={e => setBlockData({ ...blockData, block_ip: e.target.checked })}
                                className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                            />
                            <div className="flex-1">
                                <span className="font-medium text-gray-900 dark:text-gray-100">IP ünvanını blokla</span>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Bu IP ünvanından heç kim sistemi ziyarət edə bilməyəcək</p>
                            </div>
                        </label>
                        
                        {blockData.block_ip && (
                            <div className="ml-8">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    IP ünvanı
                                </label>
                                <input
                                    type="text"
                                    value={blockData.ip_address}
                                    onChange={e => setBlockData({ ...blockData, ip_address: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                    placeholder="məs: 192.168.1.1"
                                />
                            </div>
                        )}
                    </div>
                    
                    {/* Block Reason */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Bloklanma səbəbi (opsional)
                        </label>
                        <textarea
                            value={blockData.reason}
                            onChange={e => setBlockData({ ...blockData, reason: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            rows={3}
                            placeholder="Bloklanma səbəbini qeyd edin..."
                        />
                    </div>
                </div>
                
                <div className="flex space-x-3 mt-6">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                    >
                        {t.cancel}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={!blockData.block_account && !blockData.block_ip}
                        className="flex-1 px-4 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                    >
                        <Icon name="block" size={18} />
                        <span>Blokla</span>
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
