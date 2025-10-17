import React, { useState, useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { motion } from 'framer-motion';
import { useToast } from '@/Components/ToastProvider';
import { useTheme } from '@/Components/ThemeProvider';
import Icon from '@/Components/Icon';

const DonationSettings = ({ donation, footerSettings }) => {
    const toast = useToast();
    const { isDarkMode } = useTheme();
    const [isEditing, setIsEditing] = useState(false);
    
    const { data, setData, post, processing } = useForm({
        is_enabled: donation?.is_enabled || false,
        title: donation?.title || 'Dəstək Ver',
        content: donation?.content || '<p>Layihəmizi dəstəkləmək üçün ianə edə bilərsiniz:</p>\n\n<p><strong>Kart nömrəsi:</strong> 1234 5678 9012 3456</p>\n<p><strong>IBAN:</strong> AZ21NABZ00000000137010001944</p>\n\n<p>Hər bir dəstəyiniz bizim üçün çox dəyərlidir! 🙏</p>',
        display_settings: donation?.display_settings || {
            background_color: '#f0f9ff',
            text_color: '#1f2937',
            button_color: '#3b82f6'
        },
        custom_texts: donation?.custom_texts || {
            payment_methods_title: 'Dəstək Üsulları',
            thank_you_message: '🙏 Hər hansı məbləğdəki dəstəyinizə görə təşəkkürlər!',
            thank_you_description: 'Sizin köməyiniz sayəsində xidmətimizi daha da yaxşılaşdırırıq.',
            back_to_home: 'Ana Səhifəyə Qayıt'
        },
        payment_methods: donation?.payment_methods || {
            bank_transfer: {
                enabled: true,
                title: 'Bank Köçürməsi',
                description: 'IBAN: AZ21 NABZ 0123 4567 8901 2345 6789'
            },
            crypto: {
                enabled: false,
                title: 'Kripto Valyuta',
                description: 'BTC: 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
            },
            paypal: {
                enabled: false,
                title: 'PayPal',
                description: 'donate@example.com'
            },
            contact: {
                enabled: true,
                title: 'Ələqə',
                description: '+994 XX XXX XX XX'
            }
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/admin/donation', {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('İanə səhifəsi Parametrləri yeniləndi!');
                setIsEditing(false);
            },
            onError: () => {
                toast.error('Parametrləri yeniləyərkən xəta baş verdi!');
            }
        });
    };


    return (
        <AdminLayout footerSettings={footerSettings}>
            <Head title="İanə Səhifəsi Parametrləri" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Header */}
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl shadow-xl p-6 mb-8 border border-gray-200 dark:border-gray-700"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
                                    <Icon name="heart" size={32} color="#ef4444" />
                                    İanə Səhifəsi Parametrləri
                                </h1>
                                <p className="mt-2 text-gray-600 dark:text-gray-300">Ziyarətçilərdən maddi dəstək üçün səhifə yaradın</p>
                            </div>
                            
                            {/* Quick Toggle */}
                            <div className="flex items-center gap-4">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={data.is_enabled} 
                                        onChange={(e) => setData('is_enabled', e.target.checked)}
                                        className="sr-only peer" 
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-200">
                                        {data.is_enabled ? 'Aktiv' : 'Deaktiv'}
                                    </span>
                                </label>
                            </div>
                        </div>
                    </motion.div>

                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            {/* Settings Panel */}
                            <div className="xl:col-span-1">
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl shadow-xl p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto border border-gray-200 dark:border-gray-700"
                                >
                                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                        <Icon name="settings" size={20} />
                                        Əsas Parametrlər
                                    </h2>

                                    {/* Title */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Başlıq
                                        </label>
<input
                                            type="text"
                                            value={data.title}
                                            onChange={(e) => setData('title', e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                            placeholder="İanə səhifəsinin başlığı"
                                        />
                                    </div>


                                    {/* Colors */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                            Rəng Parametrlərı
                                        </label>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Arxa fon</label>
<input
                                                    type="color"
                                                    value={data.display_settings?.background_color || '#f0f9ff'}
                                                    onChange={(e) => setData('display_settings', {
                                                        ...data.display_settings,
                                                        background_color: e.target.value
                                                    })}
                                                    className="w-full h-8 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Mətn rəngi</label>
<input
                                                    type="color"
                                                    value={data.display_settings?.text_color || '#1f2937'}
                                                    onChange={(e) => setData('display_settings', {
                                                        ...data.display_settings,
                                                        text_color: e.target.value
                                                    })}
                                                    className="w-full h-8 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Buton rəngi</label>
<input
                                                    type="color"
                                                    value={data.display_settings?.button_color || '#3b82f6'}
                                                    onChange={(e) => setData('display_settings', {
                                                        ...data.display_settings,
                                                        button_color: e.target.value
                                                    })}
                                                    className="w-full h-8 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Payment Methods */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                            Ödəniş Metodları
                                        </label>
<div className="space-y-3">
                                            {Object.entries(data.payment_methods).map(([key, method]) => (
                                                <div key={key} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-700">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <label className="flex items-center cursor-pointer">
<input
                                                                type="checkbox"
                                                                checked={method.enabled}
                                                                onChange={(e) => setData('payment_methods', {
                                                                    ...data.payment_methods,
                                                                    [key]: {
                                                                        ...method,
                                                                        enabled: e.target.checked
                                                                    }
                                                                })}
                                                                className="mr-2 accent-emerald-600"
                                                            />
<span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                                                {method.title || key}
                                                            </span>
                                                        </label>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const newPaymentMethods = { ...data.payment_methods };
                                                                delete newPaymentMethods[key];
                                                                setData('payment_methods', newPaymentMethods);
                                                            }}
className="text-red-500 hover:text-red-700 dark:hover:text-red-300 text-sm px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                                                            title="Sil"
                                                        >
                                                            <Icon name="trash" size={14} />
                                                        </button>
                                                    </div>
                                                    <div className="space-y-2">
<input
                                                            type="text"
                                                            placeholder="Metod adı (məs: Bank, Crypto, ePay...)"
                                                            value={method.title}
                                                            onChange={(e) => setData('payment_methods', {
                                                                ...data.payment_methods,
                                                                [key]: {
                                                                    ...method,
                                                                    title: e.target.value
                                                                }
                                                            })}
                                                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                                        />
                                                        {method.enabled && (
<textarea
                                                                placeholder="Açıqlama (IBAN, email, telefon, address və.s)"
                                                                value={method.description}
                                                                onChange={(e) => setData('payment_methods', {
                                                                    ...data.payment_methods,
                                                                    [key]: {
                                                                        ...method,
                                                                        description: e.target.value
                                                                    }
                                                                })}
                                                                rows={2}
                                                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            
                                            {/* Add new payment method button */}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newKey = `method_${Date.now()}`;
                                                    setData('payment_methods', {
                                                        ...data.payment_methods,
                                                        [newKey]: {
                                                            enabled: true,
                                                            title: 'Yeni metod',
                                                            description: 'Metod məlumatını daxil edin'
                                                        }
                                                    });
                                                }}
className="w-full py-2 px-4 border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                                            >
                                                <Icon name="plus" size={16} />
                                                Yeni Ödəniş Metodu Əlavə Et
                                            </button>
                                        </div>
                                    </div>
                                    
                                    {/* Custom Texts */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                            Fərdiləşdirilmiş Mətnlər
                                        </label>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Dəstək Üsulları Başlığı</label>
                                                <input
                                                    type="text"
                                                    value={data.custom_texts?.payment_methods_title || ''}
                                                    onChange={(e) => setData('custom_texts', {
                                                        ...data.custom_texts,
                                                        payment_methods_title: e.target.value
                                                    })}
                                                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                                    placeholder="Dəstək Üsulları"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Təşəkkür Mesajı</label>
                                                <input
                                                    type="text"
                                                    value={data.custom_texts?.thank_you_message || ''}
                                                    onChange={(e) => setData('custom_texts', {
                                                        ...data.custom_texts,
                                                        thank_you_message: e.target.value
                                                    })}
                                                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                                    placeholder="🙏 Hər hansı məbləğdəki dəstəyinizə görə təşəkkürlər!"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Təşəkkür Açıqlası</label>
                                                <textarea
                                                    value={data.custom_texts?.thank_you_description || ''}
                                                    onChange={(e) => setData('custom_texts', {
                                                        ...data.custom_texts,
                                                        thank_you_description: e.target.value
                                                    })}
                                                    rows={2}
                                                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                                    placeholder="Sizin köməyiniz sayəsində xidmətimizi daha da yaxşılaşdırırıq."
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Ana Səhifəyə Qayıt Mətni</label>
                                                <input
                                                    type="text"
                                                    value={data.custom_texts?.back_to_home || ''}
                                                    onChange={(e) => setData('custom_texts', {
                                                        ...data.custom_texts,
                                                        back_to_home: e.target.value
                                                    })}
                                                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                                    placeholder="Ana Səhifəyə Qayıt"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>

                            {/* Content Editor */}
                            <div className="xl:col-span-1">
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl shadow-xl p-6 max-h-[calc(100vh-200px)] overflow-y-auto border border-gray-200 dark:border-gray-700"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                            <Icon name="edit" size={20} />
                                            İanə Məzmunu
                                        </h2>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setIsEditing(!isEditing)}
className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                            >
                                                {isEditing ? 'Önizləmə' : 'Redaktə et'}
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={processing}
                                                className="px-6 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all flex items-center gap-2 text-sm"
                                            >
                                                <Icon name="check" size={16} />
                                                {processing ? 'Saxlanılır...' : 'Yadda Saxla'}
                                            </button>
                                        </div>
                                    </div>

                                    {isEditing ? (
                                        <div>
                                            <textarea
                                                value={data.content}
                                                onChange={(e) => setData('content', e.target.value)}
                                                rows={15}
                                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                                placeholder="HTML məzmun daxil edin..."
                                            />
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                                HTML teqləri istifadə edə bilərsiniz: &lt;p&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;a&gt;, &lt;br&gt;, və s.
                                            </p>
                                        </div>
                                    ) : (
                                        <div 
                                            className={`min-h-[300px] p-6 border rounded-xl relative overflow-hidden ${
                                                isDarkMode ? 'border-gray-600' : 'border-gray-200'
                                            }`}
                                            style={{
                                                background: data.display_settings?.background_color ? 
                                                    data.display_settings.background_color :
                                                    (isDarkMode 
                                                        ? 'linear-gradient(135deg, rgba(31, 41, 55, 0.95) 0%, rgba(17, 24, 39, 0.98) 100%)'
                                                        : 'linear-gradient(135deg, rgba(249, 250, 251, 0.95) 0%, rgba(255, 255, 255, 0.98) 100%)'),
                                                color: data.display_settings?.text_color ? 
                                                    data.display_settings.text_color :
                                                    (isDarkMode ? '#ffffff' : '#1f2937'),
                                                backdropFilter: 'blur(10px)',
                                                boxShadow: isDarkMode 
                                                    ? '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05)'
                                                    : '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.1)'
                                            }}
                                        >
                                            <div className={`absolute top-2 right-2 px-2 py-1 text-xs rounded-full font-medium ${
                                                isDarkMode 
                                                    ? 'bg-gray-700 text-gray-200 border border-gray-600' 
                                                    : 'bg-blue-500 text-white'
                                            }`}>
                                                Önizləmə
                                            </div>
                                            <h3 className="text-xl font-bold mb-6 leading-tight" style={{ 
                                                color: data.display_settings?.text_color ? 
                                                    data.display_settings.text_color :
                                                    (isDarkMode ? '#ffffff' : '#1f2937') 
                                            }}>
                                                {data.title}
                                            </h3>
                                            <div 
                                                dangerouslySetInnerHTML={{ __html: data.content }} 
                                                className={`prose max-w-none ${isDarkMode ? 'prose-invert' : ''}`}
                                                style={{
                                                    color: data.display_settings?.text_color ? 
                                                        data.display_settings.text_color :
                                                        (isDarkMode ? '#ffffff' : '#1f2937'),
                                                    '--tw-prose-body': data.display_settings?.text_color ? 
                                                        data.display_settings.text_color :
                                                        (isDarkMode ? '#ffffff' : '#1f2937'),
                                                    '--tw-prose-headings': data.display_settings?.text_color ? 
                                                        data.display_settings.text_color :
                                                        (isDarkMode ? '#ffffff' : '#1f2937'),
                                                    '--tw-prose-bold': data.display_settings?.text_color ? 
                                                        data.display_settings.text_color :
                                                        (isDarkMode ? '#ffffff' : '#1f2937'),
                                                    '--tw-prose-links': data.display_settings?.text_color ? 
                                                        data.display_settings.text_color :
                                                        (isDarkMode ? '#ffffff' : '#1f2937')
                                                }}
                                            />
                                        </div>
                                    )}
                                </motion.div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
};

export default DonationSettings;