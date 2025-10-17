/**
 * XIV AI - Advanced AI Chatbot Platform
 * Version: v1.0.0
 * Release Date: 28.09.2025
 * Author: DeXIV
 * 
 * Admin Chat Limits Page - Manage message limits and IP security
 */

import { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { motion } from 'framer-motion';
import Icon from '@/Components/Icon';

export default function ChatLimitIndex({ settings, statistics, recent_limits }) {
    const [showResetAllModal, setShowResetAllModal] = useState(false);
    const [showClearModal, setShowClearModal] = useState(false);
    const [confirmationText, setConfirmationText] = useState('');
    
    // Translations
    const t = {
        title: 'Mesaj Limitləri',
        subtitle: 'Qonaq və istifadəçi mesaj limitlərini idarə edin',
        guestLimits: 'Qonaq Limitləri',
        userLimits: 'İstifadəçi Limitləri',
        dailyLimit: 'Gündəlik Limit',
        monthlyLimit: 'Aylıq Limit',
        enableChatLimits: 'Chat limitlərini aktivləşdir',
        enableIpSecurity: 'IP təhlükəsizliyini aktivləşdir',
        chatLimitMessage: 'Limit aşıldığında göstəriləcək mesaj',
        ipDuplicateMessage: 'Duplikat IP halında göstəriləcək mesaj',
        statistics: 'Statistikalar',
        totalLimits: 'Ümumi Limitlər',
        activeLimits: 'Aktiv Limitlər',
        ipBasedLimits: 'IP Əsaslı Limitlər',
        userBasedLimits: 'İstifadəçi Əsaslı Limitlər',
        securityLogs: 'Təhlükəsizlik Logları',
        unresolvedLogs: 'Həll edilməmiş',
        blockedAttempts: 'Blok edilmiş cəhdlər',
        recentActivity: 'Son Aktivlik',
        resetAll: 'Hamısını sıfırla',
        save: 'Yadda saxla',
        cancel: 'Ləğv et',
        confirm: 'Təsdiq et',
        resetAllConfirm: 'Bütün limitləri sıfırlamaq istədiyinizdən əminsiz?',
        resetAllConfirmDesc: 'Bu əməl geri alına bilməz. Bütün mesaj limitləri sıfırlanacaq.',
        typeToConfirm: 'Təsdiq üçün "LIMITI_SIFIRLA" yazın:',
        loading: 'Yüklənir...',
        noRecentActivity: 'Son aktivlik yoxdur',
        messages: 'mesaj',
        user: 'İstifadəçi',
        guest: 'Qonaq',
        ipAddress: 'IP Ünvanı',
        lastReset: 'Son Sıfırlama',
        lastActivity: 'Son Aktivlik',
        recentActivityDesc: 'Bu bölmədə son vaxtlar aktivlik göstərən qonaq və istifadəçilərin limit məlumatlarını görə bilərsiniz. Təmizlə butonu ilə köhnə qeydləri silib yenidən tərtib edə bilərsiniz.',
        clearActivity: 'Aktivlik Təmizlə',
        clearActivityConfirm: 'Son aktivlik cədvəlini təmizləmək istədiyinizdz əminsiniz?',
        clearActivityDesc: 'Bu əməl bütün limit qeydlərinin "son görünmə" vaxtını dahi geriylə çevirərək onları bu cədvəldən gizləyəcək.'
    };
    
    const { data, setData, post, processing, errors } = useForm({
        guest_daily_limit: settings.guest_daily_limit || 5,
        guest_monthly_limit: settings.guest_monthly_limit || 100,
        user_daily_limit: settings.user_daily_limit || 50,
        user_monthly_limit: settings.user_monthly_limit || 1000,
        guest_limit_type: settings.guest_limit_type || 'daily',
        user_limit_type: settings.user_limit_type || 'daily',
        enable_chat_limits: settings.enable_chat_limits ?? true,
        enable_ip_security: settings.enable_ip_security ?? true,
        chat_limit_message: settings.chat_limit_message || '',
        ip_duplicate_message: settings.ip_duplicate_message || ''
    });
    
    const resetAllForm = useForm({
        confirmation: ''
    });
    
    // Handle form submission
    const handleSubmit = (e) => {
        e.preventDefault();
        post('/admin/chat-limits/settings');
    };
    
    // Handle reset all
    const handleResetAll = () => {
        if (confirmationText !== 'LIMITI_SIFIRLA' || resetAllForm.processing) return;
        
        resetAllForm.setData('confirmation', confirmationText);
        resetAllForm.post('/admin/chat-limits/reset-all', {
            onSuccess: () => {
                setShowResetAllModal(false);
                setConfirmationText('');
            }
        });
    };
    
    return (
        <AdminLayout>
            <Head title={t.title} />
            
            <div className="p-3 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">{t.title}</h1>
                        <p className="text-gray-600 dark:text-gray-300 mt-1">{t.subtitle}</p>
                    </div>
                    
                    <button
                        onClick={() => setShowResetAllModal(true)}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                    >
                        <Icon name="trash" size={16} color="white" />
                        {t.resetAll}
                    </button>
                </div>
                
                {/* Statistics Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white/90 dark:bg-gray-800/90 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                        <div className="flex items-center justify-between mb-2">
                            <Icon name="chart" size={24} color="#3b82f6" />
                            <div className="text-2xl font-bold text-blue-600">{statistics.limits.total}</div>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">{t.totalLimits}</div>
                    </div>
                    
                    <div className="bg-white/90 dark:bg-gray-800/90 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                        <div className="flex items-center justify-between mb-2">
                            <Icon name="activity" size={24} color="#10b981" />
                            <div className="text-2xl font-bold text-green-600">{statistics.limits.active}</div>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">{t.activeLimits}</div>
                    </div>
                    
                    <div className="bg-white/90 dark:bg-gray-800/90 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                        <div className="flex items-center justify-between mb-2">
                            <Icon name="shield_check" size={24} color="#f59e0b" />
                            <div className="text-2xl font-bold text-orange-600">{statistics.security.unresolved}</div>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">{t.unresolvedLogs}</div>
                    </div>
                    
                    <div className="bg-white/90 dark:bg-gray-800/90 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                        <div className="flex items-center justify-between mb-2">
                            <Icon name="close" size={24} color="#ef4444" />
                            <div className="text-2xl font-bold text-red-600">{statistics.security.blocked_attempts}</div>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">{t.blockedAttempts}</div>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Settings Form */}
                    <div className="bg-white/90 dark:bg-gray-800/90 rounded-xl border border-gray-200 dark:border-gray-600 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                            <Icon name="settings" size={20} color="#6366f1" />
                            Limit Parametrlərı
                        </h2>
                        
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Guest Limits */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-medium text-gray-700 dark:text-gray-200">{t.guestLimits}</h3>
                                    <select
                                        value={data.guest_limit_type}
                                        onChange={(e) => setData('guest_limit_type', e.target.value)}
                                        className="text-sm px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                                    >
                                        <option value="daily">Günlük Limit</option>
                                        <option value="monthly">Aylıq Limit</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                                            {t.dailyLimit}
                                        </label>
                                        <input
                                            type="number"
                                            value={data.guest_daily_limit}
                                            onChange={(e) => setData('guest_daily_limit', parseInt(e.target.value))}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                            min="1"
                                            max="1000"
                                            disabled={data.guest_limit_type === 'monthly'}
                                        />
                                        {errors.guest_daily_limit && (
                                            <p className="text-red-500 text-xs mt-1">{errors.guest_daily_limit}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                                            {t.monthlyLimit}
                                        </label>
                                        <input
                                            type="number"
                                            value={data.guest_monthly_limit}
                                            onChange={(e) => setData('guest_monthly_limit', parseInt(e.target.value))}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                            min="1"
                                            max="10000"
                                            disabled={data.guest_limit_type === 'daily'}
                                        />
                                        {errors.guest_monthly_limit && (
                                            <p className="text-red-500 text-xs mt-1">{errors.guest_monthly_limit}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            {/* User Limits */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-medium text-gray-700 dark:text-gray-200">{t.userLimits}</h3>
                                    <select
                                        value={data.user_limit_type}
                                        onChange={(e) => setData('user_limit_type', e.target.value)}
                                        className="text-sm px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                                    >
                                        <option value="daily">Günlük Limit</option>
                                        <option value="monthly">Aylıq Limit</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                                            {t.dailyLimit}
                                        </label>
                                        <input
                                            type="number"
                                            value={data.user_daily_limit}
                                            onChange={(e) => setData('user_daily_limit', parseInt(e.target.value))}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                            min="1"
                                            max="10000"
                                            disabled={data.user_limit_type === 'monthly'}
                                        />
                                        {errors.user_daily_limit && (
                                            <p className="text-red-500 text-xs mt-1">{errors.user_daily_limit}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                                            {t.monthlyLimit}
                                        </label>
                                        <input
                                            type="number"
                                            value={data.user_monthly_limit}
                                            onChange={(e) => setData('user_monthly_limit', parseInt(e.target.value))}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                            min="1"
                                            max="100000"
                                            disabled={data.user_limit_type === 'daily'}
                                        />
                                        {errors.user_monthly_limit && (
                                            <p className="text-red-500 text-xs mt-1">{errors.user_monthly_limit}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Toggle Settings */}
                            <div className="space-y-4">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={data.enable_chat_limits}
                                        onChange={(e) => setData('enable_chat_limits', e.target.checked)}
                                        className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                    />
                                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{t.enableChatLimits}</span>
                                </label>
                                
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={data.enable_ip_security}
                                        onChange={(e) => setData('enable_ip_security', e.target.checked)}
                                        className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                    />
                                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{t.enableIpSecurity}</span>
                                </label>
                            </div>
                            
                            {/* Custom Messages */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                                        {t.chatLimitMessage}
                                    </label>
                                    <textarea
                                        value={data.chat_limit_message}
                                        onChange={(e) => setData('chat_limit_message', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                                        rows={3}
                                        maxLength={500}
                                    />
                                    {errors.chat_limit_message && (
                                        <p className="text-red-500 text-xs mt-1">{errors.chat_limit_message}</p>
                                    )}
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                                        {t.ipDuplicateMessage}
                                    </label>
                                    <textarea
                                        value={data.ip_duplicate_message}
                                        onChange={(e) => setData('ip_duplicate_message', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                                        rows={3}
                                        maxLength={500}
                                    />
                                    {errors.ip_duplicate_message && (
                                        <p className="text-red-500 text-xs mt-1">{errors.ip_duplicate_message}</p>
                                    )}
                                </div>
                            </div>
                            
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {processing ? (
                                    <>
                                        <Icon name="activity" size={16} color="white" className="animate-spin" />
                                        {t.loading}
                                    </>
                                ) : (
                                    <>
                                        <Icon name="check" size={16} color="white" />
                                        {t.save}
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                    
                    {/* Recent Activity */}
                    <div className="bg-white/90 dark:bg-gray-800/90 rounded-xl border border-gray-200 dark:border-gray-600 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                <Icon name="activity" size={20} color="#10b981" />
                                {t.recentActivity}
                            </h2>
                            {recent_limits && recent_limits.length > 0 && (
                                <button
                                    onClick={() => setShowClearModal(true)}
                                    className="px-3 py-1 text-xs bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors flex items-center gap-1"
                                >
                                    <Icon name="trash" size={12} color="white" />
                                    Təmizlə
                                </button>
                            )}
                        </div>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{t.recentActivityDesc}</p>
                        
                        {recent_limits && recent_limits.length > 0 ? (
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {recent_limits.map((limit) => (
                                    <div key={limit.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <Icon name={limit.type === 'user' ? 'users' : (limit.type === 'ip' ? 'globe' : 'user')} size={16} color="#6b7280" />
                                                <span className="font-medium text-sm text-gray-800 dark:text-gray-200">
                                                    {limit.type === 'user' 
                                                        ? (limit.user_name || t.user) 
                                                        : limit.type === 'ip' 
                                                            ? `${t.guest} (IP: ${limit.identifier})` 
                                                            : `${t.guest} (${limit.identifier})`
                                                    }
                                                </span>
                                            </div>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">{limit.last_activity}</span>
                                        </div>
                                        <div className="text-xs text-gray-600 dark:text-gray-300">
                                            {limit.message_count} {t.messages} / {limit.daily_limit} gündəlik
                                        </div>
                                        {limit.last_reset && (
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                {t.lastReset}: {limit.last_reset}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <Icon name="activity" size={48} color="#d1d5db" className="mx-auto mb-3" />
                                <p className="text-gray-500 dark:text-gray-400">{t.noRecentActivity}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Reset All Modal */}
            {showResetAllModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t.resetAllConfirm}</h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-4">{t.resetAllConfirmDesc}</p>
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t.typeToConfirm}
                            </label>
                            <input
                                type="text"
                                value={confirmationText}
                                onChange={(e) => setConfirmationText(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                                placeholder="LIMITI_SIFIRLA"
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowResetAllModal(false);
                                    setConfirmationText('');
                                }}
                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800"
                            >
                                {t.cancel}
                            </button>
                            <button
                                onClick={handleResetAll}
                                disabled={resetAllForm.processing || confirmationText !== 'LIMITI_SIFIRLA'}
                                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                            >
                                {resetAllForm.processing ? t.loading : t.confirm}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Clear Recent Activity Modal */}
            {showClearModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full border border-gray-200 dark:border-gray-600">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="flex-shrink-0 w-10 h-10 bg-yellow-100 dark:bg-yellow-900/50 rounded-full flex items-center justify-center">
                                <Icon name="warning" size={20} color="#f59e0b" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t.clearActivity}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{t.clearActivityConfirm}</p>
                            </div>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm">{t.clearActivityDesc}</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowClearModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 transition-colors"
                            >
                                {t.cancel}
                            </button>
                            <button
                                onClick={() => {
                                    router.post('/admin/chat-limits/clear-recent-activity');
                                    setShowClearModal(false);
                                }}
                                className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors flex items-center justify-center gap-2"
                            >
                                <Icon name="check" size={16} color="white" />
                                {t.confirm}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
