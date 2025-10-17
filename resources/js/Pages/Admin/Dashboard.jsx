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
import { format, parseISO } from 'date-fns';

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
function parseRGB(c) {
  try {
    const m = c.match(/rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d\.]+))?\)/i);
    if (!m) return { r: 255, g: 255, b: 255, a: 1 };
    return { r: parseInt(m[1], 10), g: parseInt(m[2], 10), b: parseInt(m[3], 10), a: m[4] !== undefined ? parseFloat(m[4]) : 1 };
  } catch { return { r: 255, g: 255, b: 255, a: 1 }; }
}
function relLuminance({ r, g, b }) {
  const srgbToLin = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const R = srgbToLin(r);
  const G = srgbToLin(g);
  const B = srgbToLin(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}
function getEffectiveBackgroundColor(el) {
  let node = el;
  while (node) {
    try {
      const style = window.getComputedStyle(node);
      const bg = style.backgroundColor;
      const { r, g, b, a } = parseRGB(bg || 'rgba(0,0,0,0)');
      if (a > 0 && !(r === 0 && g === 0 && b === 0 && a === 0)) {
        return { r, g, b };
      }
    } catch {}
    node = node.parentElement;
  }
  return { r: 255, g: 255, b: 255 };
}

export default function AdminDashboard({ stats, system_health, notification_stats, ip_security_stats }) {
    const toast = useToast();
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedTimeframe, setSelectedTimeframe] = useState('30d');
    const [refreshInterval, setRefreshInterval] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(new Date());

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
            toast.error('Analitika məlumatları yüklənmədi!');
        } finally {
            setLoading(false);
        }
    }, [toast]);

    // Load data on component mount
    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    // Set up auto-refresh
    useEffect(() => {
        const interval = setInterval(() => {
            fetchAnalytics();
        }, 30000); // Refresh every 30 seconds
        
        setRefreshInterval(interval);
        
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [fetchAnalytics]);
    // Chart options
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'top',
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(156, 163, 175, 0.1)'
                }
            },
            x: {
                grid: {
                    display: false
                }
            }
        }
    };
    
    // Loading component
    const LoadingSpinner = () => (
        <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-2 text-gray-600 dark:text-gray-400">Yüklənir...</span>
        </div>
    );
    
    // Error component
    const ErrorDisplay = ({ error }) => (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div className="flex items-center">
                <Icon name="alert" size={20} color="#dc2626" />
                <span className="ml-2 text-red-700 dark:text-red-400 font-medium">{error}</span>
            </div>
        </div>
    );

    if (loading) {
        return (
            <AdminLayout>
                <Head title="Admin Dashboard - Analitika" />
                <LoadingSpinner />
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <Head title="Admin Dashboard - Analitika" />

            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-3 md:p-6 space-y-6"
            >
                {/* Header */}
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8"
                >
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            📊 Analitika Dashboard
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Real-vaxt statistika və performans analizləri
                        </p>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={fetchAnalytics}
                            className="flex items-center space-x-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
                            disabled={loading}
                        >
                            <Icon name="refresh" size={16} />
                            <span>Yenilə</span>
                        </button>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                            Son yenilənmə: {lastUpdated.toLocaleTimeString('az-AZ')}
                        </div>
                    </div>
                </motion.div>

                {error && <ErrorDisplay error={error} />}

                {analytics && (
                    <>
                        {/* Key Metrics Cards */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
                        >
                            {/* Users Card */}
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-2xl border border-blue-200 dark:border-blue-700 shadow-lg">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                                        <Icon name="users" size={24} color="white" />
                                    </div>
                                    <div className={`text-sm font-medium px-2 py-1 rounded-full ${
                                        analytics.stats.users.growth_percentage >= 0 
                                        ? 'text-green-700 bg-green-100' 
                                        : 'text-red-700 bg-red-100'
                                    }`}>
                                        {analytics.stats.users.growth_percentage >= 0 ? '+' : ''}{analytics.stats.users.growth_percentage}%
                                    </div>
                                </div>
                                <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                                    {analytics.stats.users.total?.toLocaleString() || 0}
                                </h3>
                                <p className="text-blue-600 dark:text-blue-400 font-medium mb-2">İstifadəçilər</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Bu gün aktiv: {analytics.stats.users.active_today || 0}
                                </p>
                            </div>

                            {/* Messages Card */}
                            <div className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-2xl border border-green-200 dark:border-green-700 shadow-lg">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                                        <Icon name="message" size={24} color="white" />
                                    </div>
                                    <div className={`text-sm font-medium px-2 py-1 rounded-full ${
                                        analytics.stats.messages.growth_percentage >= 0 
                                        ? 'text-green-700 bg-green-100' 
                                        : 'text-red-700 bg-red-100'
                                    }`}>
                                        {analytics.stats.messages.growth_percentage >= 0 ? '+' : ''}{analytics.stats.messages.growth_percentage}%
                                    </div>
                                </div>
                                <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                                    {analytics.stats.messages.total?.toLocaleString() || 0}
                                </h3>
                                <p className="text-green-600 dark:text-green-400 font-medium mb-2">Mesajlar</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Bu gün: {analytics.stats.messages.today || 0}
                                </p>
                            </div>

                            {/* Sessions Card */}
                            <div className="bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-900/20 dark:to-violet-900/20 p-6 rounded-2xl border border-purple-200 dark:border-purple-700 shadow-lg">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                                        <Icon name="feature_chat" size={24} color="white" />
                                    </div>
                                    <div className={`text-sm font-medium px-2 py-1 rounded-full ${
                                        analytics.stats.sessions.growth_percentage >= 0 
                                        ? 'text-green-700 bg-green-100' 
                                        : 'text-red-700 bg-red-100'
                                    }`}>
                                        {analytics.stats.sessions.growth_percentage >= 0 ? '+' : ''}{analytics.stats.sessions.growth_percentage}%
                                    </div>
                                </div>
                                <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                                    {analytics.stats.sessions.total?.toLocaleString() || 0}
                                </h3>
                                <p className="text-purple-600 dark:text-purple-400 font-medium mb-2">Söhbət Sessiyaları</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Ortalama müddət: {analytics.stats.sessions.average_duration || 0} dəq
                                </p>
                            </div>

                            {/* AI Models Card */}
                            <div className="bg-gradient-to-br from-orange-50 to-red-100 dark:from-orange-900/20 dark:to-red-900/20 p-6 rounded-2xl border border-orange-200 dark:border-orange-700 shadow-lg">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                                        <Icon name="provider" size={24} color="white" />
                                    </div>
                                </div>
                                <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                                    {analytics.stats.ai_providers.total || 0}
                                </h3>
                                <p className="text-orange-600 dark:text-orange-400 font-medium mb-2">AI Provayderlər</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Aktiv: {analytics.stats.ai_providers.active || 0} | Ən çox: {analytics.stats.ai_providers.most_used || 'N/A'}
                                </p>
                            </div>
                        </motion.div>

                        <div className="text-center text-gray-500 dark:text-gray-400 text-sm mt-4">
                            🚧 Geniş analitika sistemini hazırlayırıq... Chart-lar və ətraflı statistikalar tezliklə əlavə ediləcək!
                        </div>
                    </>
                )}
            </motion.div>
        </AdminLayout>
    );
}