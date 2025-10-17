import React, { useState, useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { motion } from 'framer-motion';
import { useToast } from '@/Components/ToastProvider';
import { useTheme } from '@/Components/ThemeProvider';
import Icon from '@/Components/Icon';

const allowedLogoKeys = ['desktop_light','desktop_dark','mobile_light','mobile_dark'];

function getCsrfToken() {
    const el = document.head.querySelector('meta[name="csrf-token"]');
    return el ? el.content : '';
}

function BrandingTabs({ settings }) {
    const toast = useToast();
    const [device, setDevice] = React.useState('desktop'); // 'desktop' | 'mobile'
    const [mode, setMode] = React.useState('light'); // 'light' | 'dark'

    const [logos, setLogos] = React.useState({
        desktop_light: settings?.brand_logo_desktop_light || settings?.brand_logo_url || '',
        desktop_dark: settings?.brand_logo_desktop_dark || settings?.brand_logo_url || '',
        mobile_light: settings?.brand_logo_mobile_light || settings?.brand_logo_url || '',
        mobile_dark: settings?.brand_logo_mobile_dark || settings?.brand_logo_url || ''
    });

    const [favicon, setFavicon] = React.useState(settings?.favicon_url || '');

    const currentKey = `${device}_${mode}`;

    const uploadLogo = async (file) => {
        if (!file) return;
        const form = new FormData();
        form.append('image', file);
        form.append('variant', currentKey);
        try {
            const res = await fetch('/admin/upload/site-logo', { method: 'POST', body: form, headers: { 'X-Requested-With': 'XMLHttpRequest', 'X-CSRF-TOKEN': getCsrfToken() }, credentials: 'same-origin' });
            const js = await res.json();
            if (js.success) {
                setLogos(prev => ({ ...prev, [currentKey]: js.url }));
                toast.success('Logo yükləndi');
            } else {
                toast.error(js.message || 'Yükləmə xətası');
            }
        } catch (e) {
            toast.error('Şəbəkə xətası');
        }
    };

    const uploadFavicon = async (file) => {
        if (!file) return;
        const form = new FormData();
        form.append('image', file);
        form.append('variant', mode); // light | dark
        try {
            const res = await fetch('/admin/upload/favicon', { method: 'POST', body: form, headers: { 'X-Requested-With': 'XMLHttpRequest', 'X-CSRF-TOKEN': getCsrfToken() }, credentials: 'same-origin' });
            const js = await res.json();
            if (js.success) {
                setFavicon(js.url);
                toast.success('Favicon yükləndi');
            } else {
                toast.error(js.message || 'Yükləmə xətası');
            }
        } catch (e) {
            toast.error('Şəbəkə xətası');
        }
    };

    return (
        <div className="space-y-5">
            {/* Device tabs */}
            <div className="flex items-center gap-2">
                {['desktop','mobile'].map(d => (
                    <button
                        key={d}
                        type="button"
                        onClick={() => setDevice(d)}
                        className={`px-3 py-1.5 rounded-lg text-sm border transition ${device===d ? 'bg-emerald-500 text-white border-emerald-500 shadow' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600'}`}
                    >
                        {d === 'desktop' ? 'Masaüstü' : 'Mobil'}
                    </button>
                ))}
                <span className="mx-2 text-gray-400">/</span>
                {['light','dark'].map(m => (
                    <button
                        key={m}
                        type="button"
                        onClick={() => setMode(m)}
                        className={`px-3 py-1.5 rounded-lg text-sm border transition ${mode===m ? 'bg-indigo-500 text-white border-indigo-500 shadow' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600'}`}
                    >
                        {m === 'light' ? 'Aydın' : 'Tünd'}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Logo uploader with drag & drop */}
                <div className="backdrop-blur bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-600 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Logo ({device}, {mode})</h3>
                    <div
                        className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/40"
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const file = e.dataTransfer.files?.[0];
                            if (file) uploadLogo(file);
                        }}
                        onClick={() => document.getElementById(`logo-file-${currentKey}`)?.click()}
                    >
                        <input id={`logo-file-${currentKey}`} type="file" accept="image/*" className="hidden" onChange={e => uploadLogo(e.target.files?.[0])} />
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                            Şəkli buraya atın və ya <span className="text-emerald-600 dark:text-emerald-400 font-medium">seçin</span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Limit: 1MB, max 1024x1024 (keyfiyyət itirmədən ölçüləndirilir)</div>
                        {logos[currentKey] && (
                            <div className="mt-3 flex items-center justify-center">
                                <img src={logos[currentKey]} alt="Logo" className="h-16 w-16 object-contain rounded-lg border" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Favicon uploader (single mode) */}
                <div className="backdrop-blur bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-600 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Favicon</h3>
                    <div
                        className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/40"
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const file = e.dataTransfer.files?.[0];
                            if (file) uploadFavicon(file);
                        }}
                        onClick={() => document.getElementById(`favicon-file` )?.click()}
                    >
                        <input id={`favicon-file`} type="file" accept="image/png,image/jpeg,image/x-icon,image/vnd.microsoft.icon,.ico" className="hidden" onChange={e => uploadFavicon(e.target.files?.[0])} />
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                            Şəkli buraya atın və ya <span className="text-emerald-600 dark:text-emerald-400 font-medium">seçin</span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Tövsiyə: 64x64 PNG/JPG/ICO (max 512KB)</div>
                        {favicon && (
                            <div className="mt-3 flex items-center justify-center gap-2">
                                <img src={favicon} alt="Favicon" className="h-6 w-6 object-contain" />
                                <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[220px]">{favicon}</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

const ThemeSettings = ({ settings }) => {
    const toast = useToast();
    const { loadTheme } = useTheme();
    const [backgroundType, setBackgroundType] = useState('gradient');
    const [gradientStartColor, setGradientStartColor] = useState('#667eea');
    const [gradientEndColor, setGradientEndColor] = useState('#764ba2');
    const [solidColor, setSolidColor] = useState('#667eea');
    
    // Parse existing gradient colors on load
    useEffect(() => {
        if (settings?.background_gradient) {
            const gradientStr = settings.background_gradient;
            // Check if it's solid color or gradient
            if (gradientStr.includes('linear-gradient')) {
                setBackgroundType('gradient');
                // Extract colors from gradient string
                const colorMatches = gradientStr.match(/#[0-9a-fA-F]{6}/g);
                if (colorMatches && colorMatches.length >= 2) {
                    setGradientStartColor(colorMatches[0]);
                    setGradientEndColor(colorMatches[1]);
                }
            } else {
                setBackgroundType('solid');
                setSolidColor(gradientStr);
            }
        }
    }, [settings]);
    
    const { data, setData, post, processing } = useForm({
        primary_color: settings?.primary_color || '#6366F1',
        secondary_color: settings?.secondary_color || '#EC4899',
        accent_color: settings?.accent_color || '#fbbf24',
        background_gradient: settings?.background_gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        text_color: settings?.text_color || '#1f2937',
    });

    const handleColorChange = (field, value) => {
        setData(field, value);
    };
    
    const updateBackgroundGradient = () => {
        if (backgroundType === 'gradient') {
            const gradient = `linear-gradient(135deg, ${gradientStartColor} 0%, ${gradientEndColor} 100%)`;
            setData('background_gradient', gradient);
        } else {
            setData('background_gradient', solidColor);
        }
    };
    
    // Update gradient when colors change
    useEffect(() => {
        updateBackgroundGradient();
    }, [backgroundType, gradientStartColor, gradientEndColor, solidColor]);

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/admin/theme-settings', {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Mövzu Parametrləri uğurla yeniləndi!');
                // Reload theme to apply new settings immediately
                loadTheme();
            },
            onError: (errors) => {
                toast.error('Mövzu Parametrlərini yeniləyərkən xəta baş verdi!');
            }
        });
    };

    return (
        <AdminLayout>
            <Head title="Mövzu Parametrləri" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Header */}
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl shadow-xl p-6 mb-8"
                    >
                        <div className="flex items-center gap-3">
                            <Icon name="edit" size={32} color="#10b981" />
                            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Tema Parametrləri</h1>
                        </div>
                        <p className="mt-2 text-gray-600 dark:text-gray-300">Saytınızın rəng sxemini və arxa fonunu fərdiləşdirin</p>
                    </motion.div>

                    <form onSubmit={handleSubmit}>
                        {/* Branding Media Section - Logo & Favicon with tabs (Desktop/Mobile, Light/Dark) */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl shadow-xl p-8 mb-6"
                        >
                            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                <Icon name="edit" size={22} />
                                Brend Media (Logo və Favicon)
                            </h2>

                            {/* Device and Mode tabs */}
                            <BrandingTabs settings={settings} />
                        </motion.div>

                        {/* Colors Section */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl shadow-xl p-8"
                        >
                            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">Rəng Sxemi</h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Primary Color */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Əsas Rəng
                                    </label>
                                    <div className="flex items-center space-x-3">
                                        <input
                                            type="color"
                                            value={data.primary_color}
                                            onChange={(e) => handleColorChange('primary_color', e.target.value)}
                                            className="h-12 w-20 rounded-lg border-2 border-gray-300 dark:border-gray-600 cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            value={data.primary_color}
                                            onChange={(e) => handleColorChange('primary_color', e.target.value)}
                                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                        />
                                        <div 
                                            className="w-24 h-12 rounded-lg shadow-inner"
                                            style={{ backgroundColor: data.primary_color }}
                                        />
                                    </div>
                                </div>

                                {/* Secondary Color */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        İkinci Rəng
                                    </label>
                                    <div className="flex items-center space-x-3">
                                        <input
                                            type="color"
                                            value={data.secondary_color}
                                            onChange={(e) => handleColorChange('secondary_color', e.target.value)}
                                            className="h-12 w-20 rounded-lg border-2 border-gray-300 dark:border-gray-600 cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            value={data.secondary_color}
                                            onChange={(e) => handleColorChange('secondary_color', e.target.value)}
                                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                        />
                                        <div 
                                            className="w-24 h-12 rounded-lg shadow-inner"
                                            style={{ backgroundColor: data.secondary_color }}
                                        />
                                    </div>
                                </div>

                                {/* Accent Color */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Aksent Rəngi
                                    </label>
                                    <div className="flex items-center space-x-3">
                                        <input
                                            type="color"
                                            value={data.accent_color}
                                            onChange={(e) => handleColorChange('accent_color', e.target.value)}
                                            className="h-12 w-20 rounded-lg border-2 border-gray-300 dark:border-gray-600 cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            value={data.accent_color}
                                            onChange={(e) => handleColorChange('accent_color', e.target.value)}
                                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                        />
                                        <div 
                                            className="w-24 h-12 rounded-lg shadow-inner"
                                            style={{ backgroundColor: data.accent_color }}
                                        />
                                    </div>
                                </div>

                                {/* Text Color */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Mətn Rəngi
                                    </label>
                                    <div className="flex items-center space-x-3">
                                        <input
                                            type="color"
                                            value={data.text_color}
                                            onChange={(e) => handleColorChange('text_color', e.target.value)}
                                            className="h-12 w-20 rounded-lg border-2 border-gray-300 dark:border-gray-600 cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            value={data.text_color}
                                            onChange={(e) => handleColorChange('text_color', e.target.value)}
                                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                        />
                                        <div 
                                            className="w-24 h-12 rounded-lg shadow-inner"
                                            style={{ backgroundColor: data.text_color }}
                                        />
                                    </div>
                                </div>

                                {/* Background Settings */}
                                <div className="col-span-full space-y-4">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Arxa Fon Növü
                                    </label>
                                    
                                    {/* Switch between Gradient and Solid */}
                                    <div className="flex items-center space-x-4 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                        <label className="flex items-center cursor-pointer">
                                            <input
                                                type="radio"
                                                name="backgroundType"
                                                value="gradient"
                                                checked={backgroundType === 'gradient'}
                                                onChange={(e) => setBackgroundType(e.target.value)}
                                                className="mr-2"
                                            />
                                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                                <Icon name="feature_ai" size={16} />
                                                Gradient
                                            </span>
                                        </label>
                                        <label className="flex items-center cursor-pointer">
                                            <input
                                                type="radio"
                                                name="backgroundType"
                                                value="solid"
                                                checked={backgroundType === 'solid'}
                                                onChange={(e) => setBackgroundType(e.target.value)}
                                                className="mr-2"
                                            />
                                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                                <Icon name="edit" size={16} />
                                                Solid Rəng
                                            </span>
                                        </label>
                                    </div>
                                    
                                    {/* Gradient Color Selectors */}
                                    {backgroundType === 'gradient' && (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Başlanğıc Rəng
                                                    </label>
                                                    <div className="flex items-center space-x-3">
                                                        <input
                                                            type="color"
                                                            value={gradientStartColor}
                                                            onChange={(e) => setGradientStartColor(e.target.value)}
                                                            className="h-12 w-20 rounded-lg border-2 border-gray-300 dark:border-gray-600 cursor-pointer"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={gradientStartColor}
                                                            onChange={(e) => setGradientStartColor(e.target.value)}
                                                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Son Rəng
                                                    </label>
                                                    <div className="flex items-center space-x-3">
                                                        <input
                                                            type="color"
                                                            value={gradientEndColor}
                                                            onChange={(e) => setGradientEndColor(e.target.value)}
                                                            className="h-12 w-20 rounded-lg border-2 border-gray-300 dark:border-gray-600 cursor-pointer"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={gradientEndColor}
                                                            onChange={(e) => setGradientEndColor(e.target.value)}
                                                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Solid Color Selector */}
                                    {backgroundType === 'solid' && (
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Arxa Fon Rəngi
                                            </label>
                                            <div className="flex items-center space-x-3">
                                                <input
                                                    type="color"
                                                    value={solidColor}
                                                    onChange={(e) => setSolidColor(e.target.value)}
                                                    className="h-12 w-20 rounded-lg border-2 border-gray-300 dark:border-gray-600 cursor-pointer"
                                                />
                                                <input
                                                    type="text"
                                                    value={solidColor}
                                                    onChange={(e) => setSolidColor(e.target.value)}
                                                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                                />
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Live Preview */}
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Önizləmə
                                        </label>
                                        <div 
                                            className="w-full h-24 rounded-lg shadow-inner border-2 border-gray-200 dark:border-gray-600"
                                            style={{ background: data.background_gradient }}
                                        >
                                            <div className="h-full flex items-center justify-center">
                                                <span className="text-white font-medium text-shadow">
                                                    Arxa Fon Önizləmə
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Save Button */}
                        <div className="mt-8 flex justify-end">
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-8 py-3 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all"
                            >
                                {processing ? 'Yadda saxlanılır...' : 'Parametrləri Saxla'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
};

export default ThemeSettings;