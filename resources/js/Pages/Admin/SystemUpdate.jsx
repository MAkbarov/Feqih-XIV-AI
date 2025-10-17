import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { motion } from 'framer-motion';
import { useToast } from '@/Components/ToastProvider';
import Icon from '@/Components/Icon';
import { useTheme } from '@/Components/ThemeProvider';
import ConfirmModal from '@/Components/ConfirmModal';

// Helper function to get cookie value
const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        return parts.pop().split(';').shift();
    }
    return null;
};

const SystemUpdate = ({ footerSettings, currentVersion, updateAvailable, latestVersion, lastUpdated }) => {
    const toast = useToast();
    const { isDarkMode } = useTheme();
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateLog, setUpdateLog] = useState([]);
    const [updateStatus, setUpdateStatus] = useState('idle'); // idle, checking, updating, completed, error
    const [updateProgress, setUpdateProgress] = useState(0);
    const [updateSize, setUpdateSize] = useState(null);
    const [downloadSpeed, setDownloadSpeed] = useState(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [history, setHistory] = useState([]);
    
    // Modal states
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [showRepairModal, setShowRepairModal] = useState(false);
    const [showCacheModal, setShowCacheModal] = useState(false);

    const loadHistory = async () => {
        try {
            const res = await fetch('/admin/system/update-history', {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
                    'X-XSRF-TOKEN': getCookie('XSRF-TOKEN')
                },
                credentials: 'same-origin',
                redirect: 'follow',
            });
            
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }

            const raw = await res.text();
            let data;
            try {
                data = JSON.parse(raw);
            } catch (parseErr) {
                console.warn('History API response not JSON:', raw.slice(0, 200));
                // Don't show error to user for history loading failures
                return;
            }

            if (data?.success && Array.isArray(data.items)) {
                setHistory(data.items);
            } else {
                console.warn('History API returned invalid data:', data);
            }
        } catch (e) {
            console.warn('History loading failed:', e.message);
            // Don't add history loading errors to update log - it's not critical
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


    // Define progress calculation based on backend steps
    const updateStepNames = [
        'Yeniləmə başlandı',
        'Sistem hazırlığı yoxlanılır', 
        'Backup yaradılır',
        'Bakım rejimi aktivləşir',
        'Update paketi endirilir',
        'Paket yüklənir',
        'Fayllar kopyalanır',
        'Frontend assets quraşdırılır',
        'Verilənlər bazası yenilənir',
        'Asılılıqlar yoxlanılır',
        'Sistem cache-i yenilənir', 
        'Quraşdırma doğrulanır',
        'Versiya yenilənir',
        'Yeniləmə tamamlandı'
    ];
    
    const calculateProgressFromLogs = (logs) => {
        const progressSteps = [
            { pattern: /KÖKLÜ AVTOMATİK YENİLƏMƏ BAŞLANDI/, progress: 5, step: 0 },
            { pattern: /Sistem hazırlığı yoxlanılır/, progress: 10, step: 1 },
            { pattern: /Atom backup yaradılır/, progress: 15, step: 2 },
            { pattern: /Maintenance mode aktivləşir/, progress: 20, step: 3 },
            { pattern: /Update paketi endirilir/, progress: 25, step: 4 },
            { pattern: /Downloaded via/, progress: 35, step: 5 },
            { pattern: /Fayllar deploy edilir/, progress: 45, step: 6 },
            { pattern: /Frontend assets deploy edilir/, progress: 55, step: 7 },
            { pattern: /Database yenilənir/, progress: 65, step: 8 },
            { pattern: /Dependencies yoxlanılır/, progress: 75, step: 9 },
            { pattern: /System cache yenilənir/, progress: 85, step: 10 },
            { pattern: /Deployment yoxlanılır/, progress: 90, step: 11 },
            { pattern: /Versiya yenilənir/, progress: 95, step: 12 },
            { pattern: /YENİLƏMƏ TAMAMILƏ UĞURLU/, progress: 100, step: 13 }
        ];

        let maxProgress = 0;
        let currentStepIndex = 0;
        
        // Find the highest matching progress step
        for (const log of logs) {
            for (const step of progressSteps) {
                if (step.pattern.test(log)) {
                    if (step.progress > maxProgress) {
                        maxProgress = step.progress;
                        currentStepIndex = step.step;
                    }
                }
            }
        }
        
        return { progress: maxProgress, step: currentStepIndex };
    };

    // Ayrıca funksiyalar
    const handleSystemRepair = async () => {
        setShowRepairModal(false);
        setIsUpdating(true);
        setUpdateStatus('updating');
        setUpdateLog(['🔧 Sistem təmiri başlandı...']);
        setUpdateProgress(0);
        
        // Start aggressive polling for hosting compatibility 
        let pollAttempts = 0;
        const maxPollAttempts = 120; // 2 minutes for repair
        
        const progressInterval = setInterval(async () => {
            pollAttempts++;
            
            try {
                const progressRes = await fetch('/admin/system/operation-progress?' + Math.random(), {
                    headers: {
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache', 
                        'Expires': '0'
                    }
                });
                const progressData = await progressRes.json();
                
                if (progressData.progress !== undefined) {
                    setUpdateProgress(progressData.progress);
                }
                
                if (progressData.current_step !== undefined) {
                    setCurrentStep(progressData.current_step);
                }
                
                if (progressData.logs && Array.isArray(progressData.logs)) {
                    setUpdateLog(progressData.logs);
                }
                
                if (progressData.status === 'completed' || progressData.status === 'success') {
                    clearInterval(progressInterval);
                    setUpdateProgress(100);
                    setUpdateStatus('completed');
                    return;
                }
                
                if (progressData.status === 'failed' || progressData.status === 'error') {
                    clearInterval(progressInterval);
                    setUpdateStatus('error');
                    return;
                }
                
                if (pollAttempts >= maxPollAttempts) {
                    clearInterval(progressInterval);
                    setUpdateLog(prev => [...prev, '⚠️ Repair polling timeout']);
                }
                
            } catch (e) {
                console.warn('Repair poll error:', e.message);
                if (pollAttempts >= maxPollAttempts) {
                    clearInterval(progressInterval);
                }
            }
        }, 500); // Poll every 500ms
        
        try {
            const response = await fetch('/admin/system/fix-and-repair', {
                method: 'POST',
                headers: {
                    'Accept': 'text/plain',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
                    'X-XSRF-TOKEN': getCookie('XSRF-TOKEN')
                },
                credentials: 'same-origin'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop(); // Keep incomplete line
                
                for (const line of lines) {
                    if (line.trim()) {
                        setUpdateLog(prev => [...prev, line.trim()]);
                        
                        // Update progress based on repair steps
                        if (line.includes('Step 1:')) setUpdateProgress(10);
                        else if (line.includes('Step 2:')) setUpdateProgress(20);
                        else if (line.includes('Step 3:')) setUpdateProgress(30);
                        else if (line.includes('Step 4:')) setUpdateProgress(40);
                        else if (line.includes('Step 5:')) setUpdateProgress(50);
                        else if (line.includes('Step 6:')) setUpdateProgress(60);
                        else if (line.includes('Step 7:')) setUpdateProgress(70);
                        else if (line.includes('Step 8:')) setUpdateProgress(80);
                        else if (line.includes('Step 9:')) setUpdateProgress(90);
                        else if (line.includes('REPAIR COMPLETED SUCCESSFULLY')) {
                            setUpdateProgress(100);
                            setUpdateStatus('completed');
                            toast.success('Sistem təmiri uğurla tamamlandı!');
                        }
                        
                        if (line.includes('[[REPAIR_SUCCESS]]')) {
                            setUpdateStatus('completed');
                            toast.success('Sistem təmiri uğurla tamamlandı!');
                        } else if (line.includes('[[REPAIR_FAILED]]')) {
                            setUpdateStatus('error');
                            toast.error('Sistem təmiri zamanı xəta baş verdi!');
                        }
                    }
                }
            }
            
        } catch (error) {
            console.error('System repair error:', error);
            setUpdateLog(prev => [...prev, '❌ Təmir xətası: ' + error.message]);
            setUpdateStatus('error');
            toast.error('Sistem təmiri xətası: ' + error.message);
        } finally {
            clearInterval(progressInterval);
            setIsUpdating(false);
        }
    };
    
    const handleCacheClear = async () => {
        setShowCacheModal(false);
        setUpdateLog(['🧹 Comprehensive cache təmizləmə başlandı...']);
        
        try {
            const response = await fetch('/admin/system/clear-cache-comprehensive', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
                    'X-XSRF-TOKEN': getCookie('XSRF-TOKEN')
                },
                credentials: 'same-origin'
            });
            
            const data = await response.json();
            
            if (data.success) {
                setUpdateLog(prev => [
                    ...prev,
                    '✅ Config cache təmizləndi',
                    '✅ Application cache təmizləndi',
                    '✅ View cache təmizləndi', 
                    '✅ Route cache təmizləndi',
                    '✅ Optimize cache təmizləndi',
                    '✅ Queue restart edildi',
                    '🎉 Cache təmizləmə tamamlandı!'
                ]);
                toast.success(data.message || 'Bütün cache-lər uğurla təmizləndi!');
            } else {
                setUpdateLog(prev => [...prev, '❌ Cache təmizləmə xətası: ' + (data.message || 'Bilinməyən xəta')]);
                toast.error(data.message || 'Cache təmizləmə xətası');
            }
        } catch (error) {
            console.error('Cache clear error:', error);
            setUpdateLog(prev => [...prev, '❌ Cache təmizləmə xətası: ' + error.message]);
            toast.error('Cache təmizləmə alınmadı: ' + error.message);
        }
    };

    const performUpdate = async () => {
        setShowUpdateModal(false);

        if (!window.updateDownloadUrl) {
            toast.error('Download URL tapılmadı. Əvvəlcə yeniliklər yoxlayın.');
            return;
        }

        setIsUpdating(true);
        setUpdateStatus('updating');
        setUpdateLog(['⟳ Sistem yenilənməsi başlandı...']);
        setUpdateProgress(0);
        setCurrentStep(0);
        
        // Start aggressive polling for hosting compatibility
        let pollAttempts = 0;
        const maxPollAttempts = 240; // 4 minutes max
        
        const progressInterval = setInterval(async () => {
            pollAttempts++;
            
            try {
                const progressRes = await fetch('/admin/system/operation-progress?' + Math.random(), {
                    headers: {
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache',
                        'Expires': '0'
                    }
                });
                const progressData = await progressRes.json();
                
                // Update progress and step info
                if (progressData.progress !== undefined) {
                    setUpdateProgress(progressData.progress);
                }
                
                if (progressData.current_step !== undefined) {
                    setCurrentStep(progressData.current_step);
                }
                
                if (progressData.logs && Array.isArray(progressData.logs)) {
                    setUpdateLog(progressData.logs);
                }
                
                // Check for completion
                if (progressData.status === 'completed' || progressData.status === 'success') {
                    clearInterval(progressInterval);
                    setUpdateProgress(100);
                    setUpdateStatus('completed');
                    return;
                }
                
                if (progressData.status === 'failed' || progressData.status === 'error') {
                    clearInterval(progressInterval);
                    setUpdateStatus('error');
                    return;
                }
                
                // Auto-stop after max attempts
                if (pollAttempts >= maxPollAttempts) {
                    clearInterval(progressInterval);
                    setUpdateLog(prev => [...prev, '⚠️ Progress polling timeout - əməliyyat hələ də davam edə bilər']);
                }
                
            } catch (e) {
                console.warn('Progress poll error:', e.message);
                // Continue polling even on errors (hosting issues)
                if (pollAttempts >= maxPollAttempts) {
                    clearInterval(progressInterval);
                }
            }
        }, 500); // Poll every 500ms for better responsiveness

            try {
            const response = await fetch('/admin/system/perform-update', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                    'X-XSRF-TOKEN': getCookie('XSRF-TOKEN')
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    download_url: window.updateDownloadUrl
                })
            });

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
                    
                    // Calculate and update progress based on current logs
                    const { progress, step } = calculateProgressFromLogs(lines);
                    if (progress > 0) {
                        setUpdateProgress(progress);
                        setCurrentStep(step);
                    }
                }
            } else {
                // Fallback: non-streaming environments
                accumulatedText = await response.text();
                const lines = accumulatedText.split('\n').filter(line => line.trim());
                setUpdateLog(lines);
                
                // Calculate progress for non-streaming fallback
                const { progress, step } = calculateProgressFromLogs(lines);
                if (progress > 0) {
                    setUpdateProgress(progress);
                    setCurrentStep(step);
                }
            }

            // Handle 419 CSRF Token Mismatch specifically
            if (response.status === 419) {
                throw new Error('CSRF token uyuşmazlığı. Səhifəni yeniləyib yenidən cəhd edin.');
            }

            // Determine success by checking for explicit markers in the streamed text
            const hasSuccessMarker = /\[\[UPDATE_SUCCESS\]\]/.test(accumulatedText);
            const hasFailureMarker = /\[\[UPDATE_FAILED\]\]/.test(accumulatedText);
            const succeeded = hasSuccessMarker || /YENİLƏMƏ TAMAMILƏ UĞURLU/i.test(accumulatedText);

            if (response.ok && succeeded && !hasFailureMarker) {
                // Try to extract version change like: ✨ 1.2.7 → 1.2.9
                const versionMatch = accumulatedText.match(/\u2728\s*([0-9.]+)\s*(?:\u2192|->)\s*v?([0-9.]+)/);
                const fromVer = versionMatch?.[1] || currentVersion;
                const toVer = versionMatch?.[2] || latestVersion || 'latest';

                setUpdateProgress(100);
                setUpdateStatus('completed');
                setUpdateLog(prev => [...prev, `✓ Son versiyaya müvəffəqiyyətlə yeniləndi! v${fromVer} → v${toVer}`]);
                toast.success(`Son versiyaya müvəffəqiyyətlə yeniləndi! v${fromVer} → v${toVer}`);

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
            clearInterval(progressInterval);
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
                                        {(() => {
                                            try {
                                                const d = new Date(lastUpdated);
                                                const y = d.getFullYear();
                                                const m = String(d.getMonth()+1).padStart(2,'0');
                                                const day = String(d.getDate()).padStart(2,'0');
                                                const hh = String(d.getHours()).padStart(2,'0');
                                                const mm = String(d.getMinutes()).padStart(2,'0');
                                                return `Son yenilənmə: ${y}-${m}-${day} ${hh}:${mm}`;
                                            } catch { return 'Son yenilənmə: -'; }
                                        })()}
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
                                            {updateStepNames[currentStep] && (
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    Addım {currentStep + 1}/{updateStepNames.length}: {updateStepNames[currentStep]}
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

                                    {/* System Fix and Repair Button */}
                                    <button
                                        onClick={() => setShowRepairModal(true)}
                                        disabled={isUpdating}
                                        className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Icon name="tools" size={16} />
                                        {isUpdating && updateStatus === 'updating' ? 'Təmir edilir...' : 'Fiksasiya və Bərpa'}
                                    </button>
                                    
                                    {/* Comprehensive Cache Clear Button */}
                                    <button
                                        onClick={() => setShowCacheModal(true)}
                                        disabled={isUpdating}
                                        className="w-full py-3 px-4 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Icon name="lightning" size={16} />
                                        Keş Təmizləmə
                                    </button>

                                    {updateStatus === 'update-available' && (
                                        <button
                                            onClick={() => setShowUpdateModal(true)}
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
                <div className="text-center py-8">
                    <div className="text-gray-400 dark:text-gray-500 mb-2">
                        <Icon name="history" size={48} className="mx-auto mb-3 opacity-50" />
                        Hələ heç bir yeniləmə qeydi tapılmadı
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                        İlk yeniləmədən sonra tarix burada görünəcək
                    </div>
                </div>
            ) : (
                <>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                        Ümumi {history.length} qeyd
                    </div>
                    <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                        {history.map((item, index) => (
                            <div key={item.id} className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-1 rounded-full text-white text-xs font-medium ${
                                            item.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                                        }`}>
                                            {item.status === 'success' ? '✓ Uğurlu' : '✗ Uğursuz'}
                                        </span>
                                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                            v{item.version_from || '?'} → v{item.version_to || '?'}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                        {new Date(item.created_at).toLocaleString('az-AZ', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </div>
                                </div>
                                {item.message && (
                                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                                        {item.message}
                                    </div>
                                )}
                                {item.release_notes && (
                                    <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                                        📝 {item.release_notes.slice(0, 100)}...
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </>
            )}
                        </motion.div>
                    </div>
                </div>
            </div>
            
            {/* Confirmation Modals */}
            <ConfirmModal
                isOpen={showUpdateModal}
                onConfirm={performUpdate}
                onCancel={() => setShowUpdateModal(false)}
                title="Sistem Yeniləməsi"
                message={`Sistem yeniləməyə başlayacaq. Bu proses 2-5 dəqiqə çəkə bilər.

Davam etmək istəyirsiniz?`}
                confirmText="Yenilə"
                cancelText="İmtina"
                confirmButtonColor="bg-green-500 hover:bg-green-600"
                cancelButtonColor="bg-gray-500 hover:bg-gray-600"
                icon="download"
                iconColor="#10b981"
            />
            
            <ConfirmModal
                isOpen={showRepairModal}
                onConfirm={handleSystemRepair}
                onCancel={() => setShowRepairModal(false)}
                title="Sistem Təmiri"
                message={`Sistem təmiri başlayacaq. Migration-lar işlədilib, cache təmizlənəcək və database strukturu yoxlanılacaq.

Bu proses 1-3 dəqiqə çəkə bilər.

Davam etmək istəyirsiniz?`}
                confirmText="Təmir Et"
                cancelText="İmtina"
                confirmButtonColor="bg-orange-500 hover:bg-orange-600"
                cancelButtonColor="bg-gray-500 hover:bg-gray-600"
                icon="tools"
                iconColor="#f97316"
            />
            
            <ConfirmModal
                isOpen={showCacheModal}
                onConfirm={handleCacheClear}
                onCancel={() => setShowCacheModal(false)}
                title="Cache Təmizləmə"
                message={`Bütün sistem cache-ləri təmizlənəcək:

• Config cache
• Application cache
• View cache
• Route cache
• OPcache
• Queue restart

Bu əməliyyat təhlükəsizdir və data itməyəcək.

Davam etmək istəyirsiniz?`}
                confirmText="Təmizlə"
                cancelText="İmtina"
                confirmButtonColor="bg-yellow-500 hover:bg-yellow-600"
                cancelButtonColor="bg-gray-500 hover:bg-gray-600"
                icon="lightning"
                iconColor="#eab308"
            />
        </AdminLayout>
    );
};

export default SystemUpdate;
