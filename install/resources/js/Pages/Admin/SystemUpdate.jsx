import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { motion } from 'framer-motion';
import { useToast } from '@/Components/ToastProvider';
import Icon from '@/Components/Icon';
import { useTheme } from '@/Components/ThemeProvider';

const SystemUpdate = ({ footerSettings, currentVersion, updateAvailable, latestVersion, lastUpdated }) => {
    const toast = useToast();
    const { isDarkMode } = useTheme();
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateLog, setUpdateLog] = useState([]);
    const [updateStatus, setUpdateStatus] = useState('idle'); // idle, checking, updating, completed, error
    const [updateProgress, setUpdateProgress] = useState(0);
    const [updateSize, setUpdateSize] = useState(null);
    const [downloadSpeed, setDownloadSpeed] = useState(null);
    const [updateSteps, setUpdateSteps] = useState([]);
    const [currentStep, setCurrentStep] = useState(0);

    const [history, setHistory] = useState([]);
    
    const updateStepsList = [
        '🔧 Maintenance modu aktivləşdirilir...',
        '📦 Verilənlər bazası backup edilir...',
        '⬇️ Yenilik faylları endirilir...',
        '📂 Fayllar çıxardılır və köçürülür...',
        '🗄️ Verilənlər bazası yenilənir...',
        '🧹 Cache təmizlənir...',
        '📚 Dependencies yenilənir...',
        '🔧 Cache yenidən qurulur...',
        '🔗 Storage linklər yenilənir...',
        '📝 Versiya məlumatları yenilənir...',
        '🟢 Sayt yenidən aktiv edilir...'
    ];

    const loadHistory = async () => {
        try {
            const res = await fetch('/admin/system/update-history', {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
                redirect: 'follow',
            });

            const raw = await res.text();
            let data;
            try {
                data = JSON.parse(raw);
            } catch (parseErr) {
                throw new Error('Tarix JSON deyil. ' + raw.slice(0, 200));
            }

            if (data?.success && Array.isArray(data.items)) {
                setHistory(data.items);
            } else {
                throw new Error(data?.message || 'Bilinməyən xəta');
            }
        } catch (e) {
            setUpdateLog(prev => [...prev, '⚠️ Tarix yüklənmə xətası: ' + e.message]);
        }
    };

    const checkForUpdates = async () => {
        setUpdateStatus('checking');
        setUpdateLog(['🔍 Yeniliklər yoxlanılır...']);
        setUpdateProgress(0);
        
        try {
            const response = await fetch('/admin/system/check-updates', {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
                redirect: 'follow',
            });

            // Read as text first, then try to parse JSON to avoid '<!DOCTYPE' parse crashes
            const raw = await response.text();
            let data;
            try {
                data = JSON.parse(raw);
            } catch (parseErr) {
                throw new Error((response.redirected ? 'Yönləndirmə baş verdi. ' : '') + (raw ? raw.slice(0, 200) : 'Server JSON qaytarmadı.'));
            }
            
            if (data.success) {
                if (data.has_update) {
                    setUpdateLog(prev => [...prev, `🆕 Yeni versiya mövcuddur! v${data.latest_version}`]);
                    if (data.release_notes) {
                        setUpdateLog(prev => [...prev, `📝 Dəyişikliklər: ${data.release_notes.slice(0, 100)}...`]);
                    }
                    setUpdateStatus('update-available');
                    setUpdateSteps(updateStepsList);
                    // Store download URL for later use
                    window.updateDownloadUrl = data.download_url;
                } else {
                    setUpdateLog(prev => [...prev, '✅ Skriptiniz son versiyadır!']);
                    setUpdateStatus('up-to-date');
                }
            } else {
                throw new Error(data.message || 'Bilinməyən xəta');
            }
        } catch (error) {
            setUpdateLog(prev => [...prev, '❌ Yoxlama xətası: ' + error.message]);
            setUpdateStatus('error');
        }
    };

    const simulateProgress = () => {
        let step = 0;
        let progress = 0;
        const totalSteps = updateSteps.length;
        
        const progressInterval = setInterval(() => {
            if (step < totalSteps) {
                const stepProgress = Math.floor((step / totalSteps) * 100);
                const randomIncrement = Math.random() * 10 + 5;
                progress = Math.min(100, stepProgress + randomIncrement);
                
                setUpdateProgress(Math.floor(progress));
                setCurrentStep(step);
                
                if (step < totalSteps) {
                    setUpdateLog(prev => [...prev, updateSteps[step]]);
                    step++;
                }
                
                if (progress >= 100) {
                    clearInterval(progressInterval);
                    setUpdateStatus('completed');
                    setUpdateProgress(100);
                    setCurrentStep(totalSteps - 1);
                    toast.success('Sistem uğurla yeniləndi!');
                    
                    setTimeout(() => {
                        window.location.reload();
                    }, 3000);
                }
            }
        }, 2000);
        
        return progressInterval;
    };

    const performUpdate = async () => {
        if (!confirm('Sistem yeniləməyə başlayacaq. Bu proses 2-5 dəqiqə çəkə bilər.\n\nDavam etmək istəyirsiniz?')) {
            return;
        }

        if (!window.updateDownloadUrl) {
            toast.error('Download URL tapılmadı. Əvvəlcə yeniliklər yoxlayın.');
            return;
        }

        setIsUpdating(true);
        setUpdateStatus('updating');
        setUpdateLog(['⟳ Sistem yenilənməsi başlandı...']);
        setUpdateProgress(0);
        setCurrentStep(0);

        try {
            // Start real-time log fetching
            const logInterval = setInterval(async () => {
                try {
                    const logResponse = await fetch('/admin/system/update-log', {
                        headers: {
                            'Accept': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        credentials: 'same-origin',
                    });
                    const logData = await logResponse.json();
                    if (logData.log) {
                        const logLines = logData.log.split('\n').filter(line => line.trim());
                        setUpdateLog(logLines);
                    }
                } catch (e) {
                    // Silently ignore log fetch errors
                }
            }, 1000);
            
            // Resolve CSRF token from meta or cookie
            const meta = document.querySelector('meta[name="csrf-token"]');
            const csrf = meta ? meta.getAttribute('content') : null;
            const xsrfCookie = document.cookie.split('; ').find(c => c.startsWith('XSRF-TOKEN='));
            const xsrf = xsrfCookie ? decodeURIComponent(xsrfCookie.split('=')[1]) : null;

            const response = await fetch('/admin/system/perform-update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'text/plain, application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(csrf ? { 'X-CSRF-TOKEN': csrf } : {}),
                    ...(xsrf ? { 'X-XSRF-TOKEN': xsrf } : {}),
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    download_url: window.updateDownloadUrl
                })
            });

            if (response.status === 419) {
                throw new Error('Sessiya vaxtı bitdi (419). Səhifəni yeniləyib yenidən cəhd edin.');
            }

            // The backend streams plain text logs (text/plain), not JSON.
            // Read the response as text and reflect it in the UI.
            const reader = response.body?.getReader();
            const decoder = new TextDecoder('utf-8');
            let accumulatedText = '';

            if (reader) {
                // Read the streamed chunks progressively
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    const chunk = decoder.decode(value, { stream: true });
                    accumulatedText += chunk;

                    // Update on-screen log incrementally
                    const lines = accumulatedText.split('\n').filter(line => line.trim());
                    setUpdateLog(lines);
                }
            } else {
                // Fallback: non-streaming environments
                accumulatedText = await response.text();
                const lines = accumulatedText.split('\n').filter(line => line.trim());
                setUpdateLog(lines);
            }

            clearInterval(logInterval);

            // Determine success by checking for success markers in the streamed text
            const succeeded = /✅\s*Sistem uğurla yeniləndi!/u.test(accumulatedText) || /Yeniləmə tamamlandı/i.test(accumulatedText);

            if (response.ok && succeeded) {
                setUpdateProgress(100);
                setUpdateStatus('completed');
                setUpdateLog(prev => [...prev, '✓ Sistem uğurla yeniləndi!']);
                toast.success('Sistem uğurla yeniləndi!');

                // Refresh history after successful update
                await loadHistory();
                
                setTimeout(() => {
                    window.location.reload();
                }, 3000);
            } else {
                // Try to extract some last error line from the log
                const lastLines = accumulatedText.split('\n').slice(-5).join('\n');
                throw new Error(lastLines || 'Bilinməyən xəta');
            }
            
        } catch (error) {
            setUpdateLog(prev => [...prev, '❌ Yeniləmə xətası: ' + error.message]);
            setUpdateStatus('error');
            setUpdateProgress(0);
            toast.error('Yeniləmə uğursuz oldu!');
        } finally {
            setIsUpdating(false);
        }
    };

    useEffect(() => {
        // Auto-check on load
        checkForUpdates();
        loadHistory();
    }, []);

    return (
        <AdminLayout>
            <Head title="Sistem Yenilikləri" />

            <div className="py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    {/* Header */}
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl shadow-xl p-6 mb-8 border border-gray-200 dark:border-gray-700"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
                                    <Icon name="settings" size={32} color="#10b981" />
                                    Sistem Yeniləmələri
                                </h1>
                                <p className="mt-2 text-gray-600 dark:text-gray-300">
                                    Sistemi yeni versiyaya yeniləyin
                                </p>
                            </div>
                            
                            <div className="text-right">
                                <div className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                                    Cari Versiya: v{currentVersion}
                                </div>
                                {latestVersion && (
                                    <div className="text-sm text-green-600 dark:text-green-400">
                                        Son Versiya: v{latestVersion}
                                    </div>
                                )}
                                {lastUpdated && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Son yenilənmə: {new Date(lastUpdated).toLocaleDateString('az-AZ', {
                                            year: 'numeric',
                                            month: 'short', 
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Control Panel */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700"
                        >
                            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-6 flex items-center gap-2">
                                <Icon name="settings" size={20} />
                                İdarə Paneli
                            </h2>

                            <div className="space-y-4">
                                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <div className="font-medium text-gray-900 dark:text-gray-100">
                                                Sistem Statusu
                                            </div>
                                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                                {updateStatus === 'checking' && '🔍 Yoxlanır...'}
                                                {updateStatus === 'update-available' && `🆕 Yeniləmə var${updateSize ? ` (${updateSize})` : ''}`}
                                                {updateStatus === 'up-to-date' && '✓ Aktual versiya'}
                                                {updateStatus === 'updating' && '⟳ Yenilənir...'}
                                                {updateStatus === 'completed' && '✓ Tamamlandı'}
                                                {updateStatus === 'error' && '⚠︎ Xəta'}
                                                {updateStatus === 'idle' && '⏳ Hazır'}
                                            </div>
                                        </div>
                                        <div className={`w-3 h-3 rounded-full ${
                                            updateStatus === 'update-available' ? 'bg-orange-500 animate-pulse' :
                                            updateStatus === 'up-to-date' || updateStatus === 'completed' ? 'bg-green-500' :
                                            updateStatus === 'updating' || updateStatus === 'checking' ? 'bg-blue-500 animate-pulse' :
                                            updateStatus === 'error' ? 'bg-red-500' : 'bg-gray-400'
                                        }`}></div>
                                    </div>
                                    
                                    {/* Progress Bar */}
                                    {updateStatus === 'updating' && (
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                                                <span>Yenilənmə tərəqqüsi</span>
                                                <span>{updateProgress}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3 overflow-hidden">
                                                <div 
                                                    className="h-3 bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-300 ease-out relative"
                                                    style={{ width: `${updateProgress}%` }}
                                                >
                                                    <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full"></div>
                                                </div>
                                            </div>
                                            {currentStep < updateSteps.length && (
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    Addım {currentStep + 1}/{updateSteps.length}: {updateSteps[currentStep]?.split(' ').slice(1).join(' ')}
                                                </div>
                                            )}
                                            {downloadSpeed && (
                                                <div className="text-xs text-blue-600 dark:text-blue-400">
                                                    ⬇️ Yükləmə sürəti: {downloadSpeed}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 gap-3">
                                    <button
                                        onClick={checkForUpdates}
                                        disabled={isUpdating || updateStatus === 'checking'}
                                        className="w-full py-3 px-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Icon name="search" size={16} />
                                        {updateStatus === 'checking' ? 'Yoxlanır...' : 'Yenilikləri Yoxla'}
                                    </button>

                                    {updateStatus === 'update-available' && (
                                        <button
                                            onClick={performUpdate}
                                            disabled={isUpdating}
                                            className="w-full py-3 px-4 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Icon name="download" size={16} />
                                            {isUpdating ? 'Yenilənir...' : `v${latestVersion} Yenilə`}
                                        </button>
                                    )}
                                </div>

                                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                                    <div className="flex">
                                        <Icon name="warning" size={16} color="#f59e0b" />
                                        <div className="ml-3">
                                            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                                                Diqqət
                                            </h3>
                                            <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                                                <ul className="list-disc pl-5 space-y-1">
                                                    <li>Yenilik prosesi 2-5 dəqiqə çəkə bilər</li>
                                                    <li>Bu müddətdə sayt əlçatan olmayacaq</li>
                                                    <li>Avtomatik backup yaradılacaq</li>
                                                    <li>Brauzer səhifəsini bağlamayın</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Update Log */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700"
                        >
                            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                                <Icon name="copy" size={20} />
                                Proses Logu
                            </h2>

                            <div className="bg-gray-900 rounded-lg p-4 h-80 overflow-y-auto">
                                <div className="font-mono text-sm space-y-1">
                                    {updateLog.length === 0 ? (
                                        <div className="text-gray-400">Yenilik logu burada görünəcək...</div>
                                    ) : (
                                        updateLog.map((log, index) => (
                                            <div key={index} className="text-green-400">
                                                {log}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </motion.div>

                        {/* Update History */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700"
                        >
                            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                                <Icon name="history" size={20} />
                                Yeniləmə Tarixi
                            </h2>

                            {history.length === 0 ? (
                                <div className="text-gray-500">Hələ heç bir yeniləmə qeydi tapılmadı.</div>
                            ) : (
                                <div className="space-y-3 max-h-80 overflow-y-auto">
                                    {history.map((item) => (
                                        <div key={item.id} className="p-3 rounded-md border border-gray-200 dark:border-gray-700">
                                            <div className="flex items-center justify-between">
                                                <div className="text-sm text-gray-700 dark:text-gray-200">
                                                    <span className={`px-2 py-0.5 rounded text-white text-xs mr-2 ${item.status === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>{item.status}</span>
                                                    <span>v{item.version_from || '—'} → v{item.version_to || '—'}</span>
                                                </div>
                                                <div className="text-xs text-gray-500">{new Date(item.created_at).toLocaleString('az-AZ')}</div>
                                            </div>
                                            {item.message && (
                                                <div className="text-xs text-gray-500 mt-1">{item.message}</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default SystemUpdate;