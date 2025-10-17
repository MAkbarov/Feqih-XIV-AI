import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { motion } from 'framer-motion';
import Icon from '@/Components/Icon';
import axios from 'axios';
import { useToast } from '@/Components/ToastProvider';
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
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
    const cardsContainerRef = useRef(null);
    const [dynamicTextColor, setDynamicTextColor] = useState('#111827');
    const [dynamicSubTextColor, setDynamicSubTextColor] = useState('#374151');
    const [isDarkMode, setIsDarkMode] = useState(false);

    const computeColors = useCallback(() => {
        if (typeof window === 'undefined') return;
        const container = cardsContainerRef.current;
        const themeDark = !!(container && container.closest('.dark'));
        setIsDarkMode(themeDark);
        if (themeDark) {
            setDynamicTextColor('#ffffff');
            setDynamicSubTextColor('#d1d5db');
            return;
        }
        const el = container || document.body;
        const rgb = getEffectiveBackgroundColor(el);
        const lum = relLuminance(rgb);
        const darkBg = lum < 0.5;
        // Light mode: keep dark text by default; adjust here if needed
        setDynamicTextColor('#111827');
        setDynamicSubTextColor('#374151');
    }, []);

    useEffect(() => {
        computeColors();
        window.addEventListener('resize', computeColors);
        const onTheme = () => computeColors();
        window.addEventListener('admin-dark-mode-changed', onTheme);
        return () => {
            window.removeEventListener('resize', computeColors);
            window.removeEventListener('admin-dark-mode-changed', onTheme);
        };
    }, [computeColors]);
    const cards = [
        { 
            label: 'İstifadəçilər', 
            value: stats.users, 
            color: '#6366F1',
            icon: 'users',
            description: 'Qeydiyyatdan keçmiş istifadəçilər'
        },
        { 
            label: 'Söhbət Sessiyaları', 
            value: stats.sessions, 
            color: '#EC4899',
            icon: 'feature_chat',
            description: 'Aktiv və keçmiş söhbətlər'
        },
        { 
            label: 'Mesajlar', 
            value: stats.messages, 
            color: '#10B981',
            icon: 'message',
            description: 'Ümumi göndərilmiş mesajlar'
        },
        { 
            label: 'AI Provayderləri', 
            value: stats.providers, 
            color: '#F59E0B',
            icon: 'provider',
            description: 'Quraşdırılmış AI xidmətləri'
        },
        { 
            label: 'IP Təhlükəsizlik', 
            value: ip_security_stats?.unresolved_security_logs || 0, 
            color: '#EF4444',
            icon: 'shield_check',
            description: 'Həll edilməyən təhlükəsizlik logları'
        },
        { 
            label: 'Bildirişlər', 
            value: notification_stats?.unread_notifications || 0, 
            color: '#8B5CF6',
            icon: 'bell',
            description: 'Oxunmamış Admin bildirişləri'
        },
    ];

    return (
        <AdminLayout>
            <Head title="Admin Dashboard" />

            <div className="p-3 md:p-6">
            <div className="mb-6 md:mb-8 backdrop-blur-md bg-white/70 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 md:p-6 shadow-lg">
                    <h1 className="text-xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Admin Panel</h1>
<p className="text-gray-900 dark:text-white text-sm md:text-base">Sistem statistikaları və idarəetmə alətləri</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 mb-6 md:mb-8" ref={cardsContainerRef}>
                    {cards.map((card, idx) => (
                        <motion.div
                            key={card.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: idx * 0.1 }}
                            className="backdrop-blur-md bg-white/85 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 md:p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                            style={{
                                background: `linear-gradient(135deg, ${card.color}15 0%, ${card.color}05 100%)`,
                                borderColor: `${card.color}40`
                            }}
                        
                        >
                            <div className="flex items-center justify-between mb-3">
                                <Icon name={card.icon} size={28} color={card.color} />
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: card.color }}></div>
                            </div>
                            <h3 className="text-sm md:text-base font-semibold mb-1 text-gray-900 dark:text-white">{card.label}</h3>
                            <p className="text-xl md:text-3xl font-bold mb-2 text-gray-900 dark:text-white">
                                {card.value.toLocaleString()}
                            </p>
                            <p className="text-xs md:text-sm text-gray-700 dark:text-gray-300">{card.description}</p>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-6">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4 }}
className="backdrop-blur-md bg-white/85 dark:bg-gray-800/70 rounded-2xl p-4 md:p-6 shadow-xl border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                    >
                        <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 text-gray-800 dark:text-gray-100 flex items-center gap-2">
                            <Icon name="lightning" size={24} color="#3b82f6" />
                            Sürətli Əməliyyatlar
                        </h2>
                        <div className="space-y-2 md:space-y-3">
                            <Link href="/admin/users" className="group flex items-center px-3 md:px-4 py-3 md:py-4 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl text-sm md:text-base transform hover:scale-105">
                                <Icon name="users" size={20} color="white" className="mr-3" />
                                <div className="flex-1">
                                    <div className="font-semibold">İstifadəçi İdarəetmə</div>
                                    <div className="text-xs md:text-sm opacity-80">İstifadəçiləri idarə edin</div>
                                </div>
                            </Link>
                            <Link href="/admin/providers" className="group flex items-center px-3 md:px-4 py-3 md:py-4 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl text-sm md:text-base transform hover:scale-105">
                                <Icon name="provider" size={20} color="white" className="mr-3" />
                                <div className="flex-1">
                                    <div className="font-semibold">AI Provayderlər</div>
                                    <div className="text-xs md:text-sm opacity-80">AI xidmətlərini quraşdırın</div>
                                </div>
                            </Link>
                            <Link href="/admin/ai-training" className="group flex items-center px-3 md:px-4 py-3 md:py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl text-sm md:text-base transform hover:scale-105">
                                <Icon name="graduate" size={20} color="white" className="mr-3" />
                                <div className="flex-1">
                                    <div className="font-semibold">AI Təlimatı</div>
                                    <div className="text-xs md:text-sm opacity-80">Bilik bazası və təlimatlar</div>
                                </div>
                            </Link>
                            <Link href="/admin/settings" className="group flex items-center px-3 md:px-4 py-3 md:py-4 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl text-sm md:text-base transform hover:scale-105">
                                <Icon name="settings" size={20} color="white" className="mr-3" />
                                <div className="flex-1">
                                    <div className="font-semibold">Sayt Tənzimləmələri</div>
                                    <div className="text-xs md:text-sm opacity-80">Ümumi parametrlər</div>
                                </div>
                            </Link>
                            <button
                                onClick={async () => {
                                    try {
                                        const { data } = await axios.post('/admin/system/clear-cache');
                                        if (data?.success) {
                                            toast.success(data.message || 'Keş təmizləndi');
                                        } else {
                                            toast.error(data?.message || 'Keş təmizləmə xətası');
                                        }
                                    } catch (e) {
                                        toast.error('Keş təmizləmə alınmadı');
                                    }
                                }}
                                className="w-full group flex items-center px-3 md:px-4 py-3 md:py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl text-sm md:text-base transform hover:scale-105"
                                type="button"
                            >
                                <Icon name="lightning" size={20} color="white" className="mr-3" />
                                <div className="flex-1">
                                    <div className="font-semibold">Keş təmizlə</div>
                                    <div className="text-xs md:text-sm opacity-80">Sistem keşini təmizlə</div>
                                </div>
                            </button>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4 }}
className="backdrop-blur-md bg-white/85 dark:bg-gray-800/70 rounded-2xl p-4 md:p-6 shadow-xl border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                    >
                        <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 text-gray-800 dark:text-gray-100 flex items-center gap-2">
                            <Icon name="shield_check" size={24} color="#10b981" />
                            Sistem Sağlamlığı
                        </h2>
                        <div className="space-y-3 md:space-y-4">
                            {/* Database Status */}
                            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                                <div className="flex items-center gap-3">
                                    <Icon name="database" size={20} color={system_health?.database?.status === 'healthy' ? '#10b981' : '#ef4444'} />
                                    <div>
                                        <div className="font-medium text-gray-700 dark:text-gray-200">Verilenlər Bazası</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">{system_health?.database?.message || 'MySQL əlaqəsi'}</div>
                                    </div>
                                </div>
                                <span className={`font-semibold text-sm md:text-base px-2 py-1 rounded-full ${
                                    system_health?.database?.status === 'healthy' 
                                        ? 'text-green-600 bg-green-100' 
                                        : 'text-red-600 bg-red-100'
                                }`}>
                                    {system_health?.database?.status === 'healthy' ? '✓ Aktiv' : '✗ Xəta'}
                                </span>
                            </div>
                            
                            {/* AI Provider Status */}
                            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                                <div className="flex items-center gap-3">
                                    <Icon name="provider" size={20} color={system_health?.ai_provider?.status === 'healthy' ? '#8b5cf6' : '#ef4444'} />
                                    <div>
                                        <div className="font-medium text-gray-700 dark:text-gray-200">AI Provayderləri</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">{system_health?.ai_provider?.provider || 'Unknown'}</div>
                                    </div>
                                </div>
                                <span className={`font-semibold text-sm md:text-base px-2 py-1 rounded-full ${
                                    system_health?.ai_provider?.status === 'healthy' 
                                        ? 'text-green-600 bg-green-100' 
                                        : 'text-orange-600 bg-orange-100'
                                }`}>
                                    {system_health?.ai_provider?.status === 'healthy' ? '✓ Aktiv' : '⚠ Problem'}
                                </span>
                            </div>
                            
                            {/* Cache Status */}
                            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                                <div className="flex items-center gap-3">
                                    <Icon name="lightning" size={20} color={system_health?.cache?.status === 'healthy' ? '#f59e0b' : '#ef4444'} />
                                    <div>
                                        <div className="font-medium text-gray-700 dark:text-gray-200">Keş Sistemi</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">{system_health?.cache?.driver || 'Cache'}</div>
                                    </div>
                                </div>
                                <span className={`font-semibold text-sm md:text-base px-2 py-1 rounded-full ${
                                    system_health?.cache?.status === 'healthy' 
                                        ? 'text-green-600 bg-green-100' 
                                        : 'text-red-600 bg-red-100'
                                }`}>
                                    {system_health?.cache?.status === 'healthy' ? '✓ İşləyir' : '✗ Xəta'}
                                </span>
                            </div>
                            
                            {/* Storage Status */}
                            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                                <div className="flex items-center gap-3">
                                    <Icon name="database" size={20} color={system_health?.storage?.status === 'healthy' ? '#06b6d4' : '#ef4444'} />
                                    <div>
                                        <div className="font-medium text-gray-700 dark:text-gray-200">Storage</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">{system_health?.storage?.usage_percentage || 0}% dolu</div>
                                    </div>
                                </div>
                                <span className={`font-semibold text-sm md:text-base px-2 py-1 rounded-full ${
                                    system_health?.storage?.status === 'healthy' 
                                        ? 'text-green-600 bg-green-100' 
                                        : system_health?.storage?.status === 'warning'
                                            ? 'text-yellow-600 bg-yellow-100'
                                            : 'text-red-600 bg-red-100'
                                }`}>
                                    {system_health?.storage?.status === 'healthy' ? '✓ Yaxşı' : 
                                     system_health?.storage?.status === 'warning' ? '⚠ Dolu' : '✗ Xəta'}
                                </span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </AdminLayout>
    );
}