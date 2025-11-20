import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '@/Components/Icon';
import axios from 'axios';
import { useToast } from '@/Components/ToastProvider';
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line, Doughnut, Pie } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function AdminDashboard({ stats, system_health, notification_stats, ip_security_stats, admin_background }) {
    const toast = useToast();
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(new Date());

    // Admin color theme
    const themeColor = useMemo(() => {
        if (!admin_background) return '#6366f1';
        
        if (admin_background.type === 'solid') {
            return admin_background.color || '#6366f1';
        } else if (admin_background.type === 'gradient') {
            // Extract first color from gradient
            const match = admin_background.gradient?.match(/#[0-9a-fA-F]{6}/);
            return match ? match[0] : '#6366f1';
        }
        return '#6366f1';
    }, [admin_background]);

    // Get lighter/darker variations
    const getLighterColor = (hex, percent = 20) => {
        const num = parseInt(hex.replace('#', ''), 16);
        const r = Math.min(255, Math.floor((num >> 16) + (255 - (num >> 16)) * percent / 100));
        const g = Math.min(255, Math.floor(((num >> 8) & 0x00FF) + (255 - ((num >> 8) & 0x00FF)) * percent / 100));
        const b = Math.min(255, Math.floor((num & 0x0000FF) + (255 - (num & 0x0000FF)) * percent / 100));
        return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
    };

    const getDarkerColor = (hex, percent = 20) => {
        const num = parseInt(hex.replace('#', ''), 16);
        const r = Math.max(0, Math.floor((num >> 16) * (1 - percent / 100)));
        const g = Math.max(0, Math.floor(((num >> 8) & 0x00FF) * (1 - percent / 100)));
        const b = Math.max(0, Math.floor((num & 0x0000FF) * (1 - percent / 100)));
        return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
    };

    // Fetch analytics data
    const fetchAnalytics = useCallback(async () => {
        try {
            setLoading(true);
            const response = await axios.get('/admin/analytics/dashboard');
            if (response.data.success) {
                setAnalytics(response.data.data);
                setError(null);
                setLastUpdated(new Date());
            } else {
                setError(response.data.error || 'Məlumat yüklənərkən xəta baş verdi.');
            }
        } catch (err) {
            console.error('Analytics fetch error:', err);
            setError('Analitika məlumatları yüklənərkən xəta baş verdi.');
        } finally {
            setLoading(false);
        }
    }, []);

    // Load data on component mount
    useEffect(() => {
        fetchAnalytics();
        
        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchAnalytics, 30000);
        return () => clearInterval(interval);
    }, [fetchAnalytics]);

    // Quick Actions
    const quickActions = [
        { title: 'İstifadəçilər', icon: 'users', link: '/admin/users', color: 'blue' },
        { title: 'Provayderlər', icon: 'provider', link: '/admin/providers', color: 'purple' },
        { title: 'Söhbətlər', icon: 'feature_chat', link: '/admin/chat-analytics', color: 'green' },
        { title: 'Bilik Bazısı', icon: 'graduate', link: '/admin/ai-training', color: 'indigo' },
        { title: 'Təhlükəsizlik', icon: 'shield_check', link: '/admin/ip-security', color: 'red' },
        { title: 'Parametrlər', icon: 'settings', link: '/admin/settings', color: 'gray' },
    ];

    // Loading component
    if (loading && !analytics) {
        return (
            <AdminLayout>
                <Head title="Admin Dashboard" />
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 mx-auto mb-4" style={{ borderColor: themeColor }}></div>
                        <p className="text-gray-600 dark:text-gray-400">Yüklənir...</p>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <Head title="Admin Dashboard" />

            <div className="p-4 md:p-6 space-y-6">
                {/* Header */}
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
                >
                    <div className="flex items-center space-x-3">
                        <div className="p-3 rounded-xl" style={{ backgroundColor: `${themeColor}20` }}>
                            <Icon name="analytics" size={32} style={{ color: themeColor }} />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-1">
                                Dashboard
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                Real-vaxt statistika və performans analizləri
                            </p>
                        </div>
                    </div>
                    
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={fetchAnalytics}
                        disabled={loading}
                        className="flex items-center space-x-2 px-6 py-3 rounded-xl text-white shadow-lg backdrop-blur-md transition-all disabled:opacity-50"
                        style={{ 
                            background: admin_background?.type === 'gradient' 
                                ? admin_background.gradient 
                                : `linear-gradient(135deg, ${themeColor}, ${getDarkerColor(themeColor, 30)})`
                        }}
                    >
                        <Icon name="refresh" size={18} />
                        <span className="font-medium">Yenilə</span>
                    </motion.button>
                </motion.div>

                {/* Quick Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="flex items-center space-x-2 mb-4">
                        <Icon name="lightning" size={24} style={{ color: themeColor }} />
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Qısayollar</h2>
                    </div>
                    <div className="bg-white/80 dark:bg-gray-900/60 rounded-2xl border border-gray-200/70 dark:border-gray-700/70 shadow-xl backdrop-blur-2xl p-4 md:p-5">
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
                            {quickActions.map((action, index) => (
                                <Link
                                    key={index}
                                    href={action.link}
                                    className="group"
                                >
                                    <motion.div
                                        whileHover={{ scale: 1.05, y: -4 }}
                                        whileTap={{ scale: 0.97 }}
                                        className="relative overflow-hidden rounded-2xl p-3 md:p-4 shadow-md hover:shadow-2xl transition-all duration-200 border border-gray-100/70 dark:border-gray-700/70 bg-white/90 dark:bg-gray-800/80 backdrop-blur-xl"
                                    >
                                        <div
                                            className="absolute inset-0 opacity-60 pointer-events-none"
                                            style={{
                                                background: `linear-gradient(135deg, ${themeColor}11, ${getLighterColor(themeColor, 40)}33)`
                                            }}
                                        />
                                        <div className="relative flex flex-col items-center text-center space-y-2">
                                            <div
                                                className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center shadow-sm"
                                                style={{ backgroundColor: `${themeColor}1A` }}
                                            >
                                                <Icon name={action.icon} size={22} style={{ color: themeColor }} />
                                            </div>
                                            <span className="text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white truncate max-w-[110px] md:max-w-[140px]">
                                                {action.title}
                                            </span>
                                        </div>
                                    </motion.div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Key Metrics */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="flex items-center space-x-2 mb-4">
                        <Icon name="chart" size={24} style={{ color: themeColor }} />
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Əsas Metrikalar</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {analytics && (
                            <>
                                {/* Users */}
                                <motion.div 
                                    whileHover={{ scale: 1.02 }}
                                    className="relative overflow-hidden rounded-2xl p-6 backdrop-blur-xl border shadow-lg bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-700"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div 
                                            className="w-14 h-14 rounded-xl flex items-center justify-center shadow-md"
                                            style={{ backgroundColor: themeColor }}
                                        >
                                            <Icon name="users" size={28} color="white" />
                                        </div>
                                        {analytics.stats?.users?.growth_percentage !== undefined && (
                                            <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                                                analytics.stats.users.growth_percentage >= 0 
                                                    ? 'bg-green-100 text-green-700' 
                                                    : 'bg-red-100 text-red-700'
                                            }`}>
                                                {analytics.stats.users.growth_percentage >= 0 ? '↑' : '↓'} {Math.abs(analytics.stats.users.growth_percentage)}%
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="text-4xl font-black text-blue-900 dark:text-blue-100 mb-1">
                                        {analytics.stats?.users?.total?.toLocaleString() || stats.users?.toLocaleString() || 0}
                                    </h3>
                                    <p className="text-blue-700 dark:text-blue-400 font-semibold mb-2">İstifadəçilər</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Aktiv bu gün: <span className="font-bold">{analytics.stats?.users?.active_today || 0}</span>
                                    </p>
                                </motion.div>

                                {/* Messages */}
                                <motion.div 
                                    whileHover={{ scale: 1.02 }}
                                    className="relative overflow-hidden rounded-2xl p-6 backdrop-blur-xl border border-gray-200 dark:border-gray-700 shadow-lg bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="w-14 h-14 bg-green-500 rounded-xl flex items-center justify-center shadow-md">
                                            <Icon name="message" size={28} color="white" />
                                        </div>
                                        {analytics.stats?.messages?.growth_percentage !== undefined && (
                                            <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                                                analytics.stats.messages.growth_percentage >= 0 
                                                    ? 'bg-green-100 text-green-700' 
                                                    : 'bg-red-100 text-red-700'
                                            }`}>
                                                {analytics.stats.messages.growth_percentage >= 0 ? '↑' : '↓'} {Math.abs(analytics.stats.messages.growth_percentage)}%
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="text-4xl font-black text-green-900 dark:text-green-100 mb-1">
                                        {analytics.stats?.messages?.total?.toLocaleString() || stats.messages?.toLocaleString() || 0}
                                    </h3>
                                    <p className="text-green-700 dark:text-green-400 font-semibold mb-2">Mesajlar</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Bu gün: <span className="font-bold">{analytics.stats?.messages?.today || 0}</span>
                                    </p>
                                </motion.div>

                                {/* Sessions */}
                                <motion.div 
                                    whileHover={{ scale: 1.02 }}
                                    className="relative overflow-hidden rounded-2xl p-6 backdrop-blur-xl border border-gray-200 dark:border-gray-700 shadow-lg bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-900/20 dark:to-violet-900/20"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="w-14 h-14 bg-purple-500 rounded-xl flex items-center justify-center shadow-md">
                                            <Icon name="feature_chat" size={28} color="white" />
                                        </div>
                                        {analytics.stats?.sessions?.growth_percentage !== undefined && (
                                            <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                                                analytics.stats.sessions.growth_percentage >= 0 
                                                    ? 'bg-green-100 text-green-700' 
                                                    : 'bg-red-100 text-red-700'
                                            }`}>
                                                {analytics.stats.sessions.growth_percentage >= 0 ? '↑' : '↓'} {Math.abs(analytics.stats.sessions.growth_percentage)}%
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="text-4xl font-black text-purple-900 dark:text-purple-100 mb-1">
                                        {analytics.stats?.sessions?.total?.toLocaleString() || stats.sessions?.toLocaleString() || 0}
                                    </h3>
                                    <p className="text-purple-700 dark:text-purple-400 font-semibold mb-2">Söhbətlər</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Orta müddət: <span className="font-bold">{analytics.stats?.sessions?.average_duration || 0} dəq</span>
                                    </p>
                                </motion.div>

                                {/* AI Providers */}
                                <motion.div 
                                    whileHover={{ scale: 1.02 }}
                                    className="relative overflow-hidden rounded-2xl p-6 backdrop-blur-xl border border-gray-200 dark:border-gray-700 shadow-lg bg-gradient-to-br from-orange-50 to-red-100 dark:from-orange-900/20 dark:to-red-900/20"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="w-14 h-14 bg-orange-500 rounded-xl flex items-center justify-center shadow-md">
                                            <Icon name="provider" size={28} color="white" />
                                        </div>
                                    </div>
                                    <h3 className="text-4xl font-black text-orange-900 dark:text-orange-100 mb-1">
                                        {analytics.stats?.ai_providers?.total || stats.providers || 0}
                                    </h3>
                                    <p className="text-orange-700 dark:text-orange-400 font-semibold mb-2">AI Provayderlər</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Aktiv: <span className="font-bold">{analytics.stats?.ai_providers?.active || 0}</span>
                                    </p>
                                </motion.div>
                            </>
                        )}
                    </div>
                </motion.div>

                {/* Charts Section */}
                {analytics && (
                    <>
                        {/* Daily Messages Chart */}
                        {analytics.time_analytics?.daily_messages && analytics.time_analytics.daily_messages.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg backdrop-blur-xl border border-gray-200 dark:border-gray-700"
                            >
                                <div className="flex items-center space-x-2 mb-4">
                                    <Icon name="chart" size={24} style={{ color: themeColor }} />
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Günlük Mesajlar (Son 30 Gün)</h3>
                                </div>
                                <div className="h-80">
                                    <Line
                                        data={{
                                            labels: analytics.time_analytics.daily_messages.map(d => d.day),
                                            datasets: [{
                                                label: 'Mesajlar',
                                                data: analytics.time_analytics.daily_messages.map(d => d.count),
                                                borderColor: themeColor,
                                                backgroundColor: `${themeColor}20`,
                                                fill: true,
                                                tension: 0.4,
                                                borderWidth: 3,
                                                pointRadius: 4,
                                                pointHoverRadius: 6,
                                                pointBackgroundColor: themeColor,
                                                pointBorderColor: '#fff',
                                                pointBorderWidth: 2,
                                            }]
                                        }}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: {
                                                legend: { display: false },
                                                tooltip: {
                                                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                                    padding: 12,
                                                    titleColor: '#fff',
                                                    bodyColor: '#fff',
                                                    borderColor: themeColor,
                                                    borderWidth: 1,
                                                }
                                            },
                                            scales: {
                                                y: {
                                                    beginAtZero: true,
                                                    grid: { color: 'rgba(156, 163, 175, 0.1)' },
                                                    ticks: { color: '#9ca3af' }
                                                },
                                                x: {
                                                    grid: { display: false },
                                                    ticks: { color: '#9ca3af' }
                                                }
                                            }
                                        }}
                                    />
                                </div>
                            </motion.div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Hourly Activity Chart */}
                            {analytics.time_analytics?.hourly_activity && analytics.time_analytics.hourly_activity.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                    className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg backdrop-blur-xl border border-gray-200 dark:border-gray-700"
                                >
                                    <div className="flex items-center space-x-2 mb-4">
                                        <Icon name="activity" size={24} style={{ color: themeColor }} />
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Saatlıq Fəaliyyət</h3>
                                    </div>
                                    <div className="h-80">
                                        <Bar
                                            data={{
                                                labels: analytics.time_analytics.hourly_activity.map(d => d.hour),
                                                datasets: [{
                                                    label: 'Mesajlar',
                                                    data: analytics.time_analytics.hourly_activity.map(d => d.count),
                                                    backgroundColor: `${themeColor}80`,
                                                    borderColor: themeColor,
                                                    borderWidth: 2,
                                                    borderRadius: 8,
                                                }]
                                            }}
                                            options={{
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                plugins: {
                                                    legend: { display: false },
                                                    tooltip: {
                                                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                                        padding: 12,
                                                    }
                                                },
                                                scales: {
                                                    y: {
                                                        beginAtZero: true,
                                                        grid: { color: 'rgba(156, 163, 175, 0.1)' },
                                                        ticks: { color: '#9ca3af' }
                                                    },
                                                    x: {
                                                        grid: { display: false },
                                                        ticks: { color: '#9ca3af', maxRotation: 45, minRotation: 45 }
                                                    }
                                                }
                                            }}
                                        />
                                    </div>
                                </motion.div>
                            )}

                            {/* Session Duration Distribution */}
                            {analytics.user_behavior?.session_duration_distribution && analytics.user_behavior.session_duration_distribution.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.6 }}
                                    className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg backdrop-blur-xl border border-gray-200 dark:border-gray-700"
                                >
                                    <div className="flex items-center space-x-2 mb-4">
                                        <Icon name="activity" size={24} style={{ color: themeColor }} />
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Söhbət Müddəti</h3>
                                    </div>
                                    <div className="h-80 flex items-center justify-center">
                                        <Doughnut
                                            data={{
                                                labels: analytics.user_behavior.session_duration_distribution.map(d => d.range),
                                                datasets: [{
                                                    data: analytics.user_behavior.session_duration_distribution.map(d => d.count),
                                                    backgroundColor: [
                                                        `${themeColor}`,
                                                        `${getLighterColor(themeColor, 20)}`,
                                                        `${getLighterColor(themeColor, 40)}`,
                                                        `${getLighterColor(themeColor, 60)}`,
                                                        `${getLighterColor(themeColor, 80)}`,
                                                    ],
                                                    borderWidth: 2,
                                                    borderColor: '#fff',
                                                }]
                                            }}
                                            options={{
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                plugins: {
                                                    legend: {
                                                        position: 'bottom',
                                                        labels: { 
                                                            color: '#9ca3af',
                                                            padding: 15,
                                                            font: { size: 12 }
                                                        }
                                                    },
                                                    tooltip: {
                                                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                                        padding: 12,
                                                    }
                                                }
                                            }}
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Most Active Users Table */}
                        {analytics.user_behavior?.most_active_users && analytics.user_behavior.most_active_users.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7 }}
                                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg backdrop-blur-xl border border-gray-200 dark:border-gray-700"
                            >
                                <div className="flex items-center space-x-2 mb-4">
                                    <Icon name="users" size={24} style={{ color: themeColor }} />
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Ən Aktiv İstifadəçilər</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-gray-200 dark:border-gray-700">
                                                <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-semibold">Rank</th>
                                                <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-semibold">İstifadəçi</th>
                                                <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-semibold">Sessiyalar</th>
                                                <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-semibold">Mesajlar</th>
                                                <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-semibold">Qoşulma</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {analytics.user_behavior.most_active_users.map((user, idx) => (
                                                <motion.tr 
                                                    key={idx}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.6 + idx * 0.05 }}
                                                    className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                                >
                                                    <td className="py-3 px-4">
                                                        <span 
                                                            className="inline-flex items-center justify-center w-8 h-8 rounded-full text-white font-bold text-sm"
                                                            style={{ backgroundColor: idx < 3 ? themeColor : '#9ca3af' }}
                                                        >
                                                            {user.rank}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">{user.user_id}</td>
                                                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{user.sessions}</td>
                                                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400 font-bold">{user.messages}</td>
                                                    <td className="py-3 px-4 text-gray-500 dark:text-gray-500 text-sm">{user.joined}</td>
                                                </motion.tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        )}

                        {/* Popular Topics */}
                        {analytics.topic_analytics?.popular_topics && analytics.topic_analytics.popular_topics.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.8 }}
                                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg backdrop-blur-xl border border-gray-200 dark:border-gray-700"
                            >
                                <div className="flex items-center space-x-2 mb-4">
                                    <Icon name="chart" size={24} style={{ color: themeColor }} />
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Populyar Mövzular</h3>
                                </div>
                                <div className="space-y-3">
                                    {analytics.topic_analytics.popular_topics.map((topic, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.7 + idx * 0.05 }}
                                            className="flex items-center justify-between"
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3 mb-2">
                                                    <span className="font-semibold text-gray-900 dark:text-gray-100 capitalize">{topic.topic}</span>
                                                    <span className="text-sm text-gray-500 dark:text-gray-400">({topic.count} mesaj)</span>
                                                </div>
                                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${topic.percentage}%` }}
                                                        transition={{ duration: 1, delay: 0.8 + idx * 0.05 }}
                                                        className="h-full rounded-full"
                                                        style={{ backgroundColor: themeColor }}
                                                    />
                                                </div>
                                            </div>
                                            <span className="ml-4 font-bold text-lg" style={{ color: themeColor }}>
                                                {topic.percentage}%
                                            </span>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </>
                )}

                {/* Last Update Info */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9 }}
                    className="text-center text-sm text-gray-500 dark:text-gray-400"
                >
                    Son yenilənmə: {lastUpdated.toLocaleString('az-AZ')} • Avtomatik yenilənir hər 30 saniyə
                </motion.div>
            </div>
        </AdminLayout>
    );
}
