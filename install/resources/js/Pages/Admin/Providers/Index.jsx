import { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import ToggleSwitch from '@/Components/ToggleSwitch';

export default function ProvidersIndex({ providers }) {
    const [showForm, setShowForm] = useState(false);
    const [editingProvider, setEditingProvider] = useState(null);
    
    // Translations
    const t = {
        title: 'AI Provayderlər',
        addProvider: 'Provayder Əlavə Et',
        newProvider: 'Yeni Provayder',
        editProvider: 'Provayderi Redaktə Et',
        name: 'Ad',
        driver: 'Driver',
        model: 'Model',
        apiKey: 'API Açarı',
        baseUrl: 'Əsas URL (tələb olunur)',
        setActive: 'Aktiv Provayder Olaraq Təyin Et',
        create: 'Yarat',
        update: 'Yenilə',
        cancel: 'Ləğv Et',
        delete: 'Sil',
        active: 'Aktiv',
        inactive: 'Qeyri-aktiv',
        status: 'Status',
        actions: 'Əməliyyat',
        edit: 'Redaktə Et',
        noProviders: 'Hələ provayder konfiqurasiya edilməyib',
        apiKeyPlaceholder: 'API açarını daxil edin',
        apiKeyEditPlaceholder: 'Mövcudu saxlamaq üçün boş buraxın',
        confirmDelete: 'Bu provayderi silmək istədiyinizdən əminsiz?',
        deleteSuccess: 'Provayder uğurla silindi'
    };
    
    // Get model placeholder based on selected driver
    const getModelPlaceholder = (driver) => {
        const placeholders = {
            'openai': 'məsələn, gpt-4, gpt-3.5-turbo',
            'anthropic': 'məsələn, claude-3-sonnet-20240229',
            'deepseek': 'məsələn, deepseek-chat, deepseek-coder',
            'custom': 'model adını daxil edin'
        };
        return placeholders[driver] || 'model adını daxil edin';
    };

    const { data, setData, post, patch, reset, processing } = useForm({
        name: '',
        driver: 'openai',
        model: '',
        api_key: '',
        base_url: '',
        is_active: false,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (editingProvider) {
            patch(`/admin/providers/${editingProvider.id}`, {
                onSuccess: () => {
                    reset();
                    setEditingProvider(null);
                    setShowForm(false);
                },
            });
        } else {
            post('/admin/providers', {
                onSuccess: () => {
                    reset();
                    setShowForm(false);
                },
            });
        }
    };

    const startEdit = (provider) => {
        setEditingProvider(provider);
        
        // Handle DeepSeek provider that might be stored as 'deepseek' in DB
        // but might need different handling for form display
        let driverValue = provider.driver;
        
        setData({
            name: provider.name,
            driver: driverValue,
            model: provider.model || '',
            api_key: '', // Don't show existing key for security
            base_url: provider.base_url || '',
            is_active: provider.is_active,
        });
        setShowForm(true);
    };
    
    const toggleProviderStatus = (provider) => {
        const newStatus = !provider.is_active;
        
        router.patch(`/admin/providers/${provider.id}`, {
            is_active: newStatus
        }, {
            preserveScroll: true,
            preserveState: false, // Allow state refresh to show updated data
            onSuccess: () => {
            },
            onError: (errors) => {
                console.error('Toggle failed:', errors);
            }
        });
    };
    
    const deleteProvider = (provider) => {
        if (window.confirm(t.confirmDelete)) {
            router.delete(`/admin/providers/${provider.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    // Could add a toast notification here
                }
            });
        }
    };
    
    const canDeleteProvider = (provider) => {
        // Can only delete if it's not active and there are other providers
        return !provider.is_active && providers.length > 1;
    };
    
    const formatDriverName = (driver) => {
        const driverNames = {
            'openai': 'OpenAI',
            'anthropic': 'Anthropic',
            'deepseek': 'DeepSeek',
            'custom': 'Fərdi'
        };
        return driverNames[driver] || driver;
    };

    return (
        <AdminLayout>
            <Head title={t.title} />

            <div className="p-3 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">{t.title}</h1>
                    <button
                        onClick={() => setShowForm(true)}
                        className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm sm:text-base self-start sm:self-auto"
                    >
                        {t.addProvider}
                    </button>
                </div>

                {showForm && (
                    <div className="backdrop-blur bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-600 p-4 sm:p-6 mb-6">
                        <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                            {editingProvider ? t.editProvider : t.newProvider}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.name}</label>
                                    <input
                                        type="text"
                                        value={data.name}
                                        onChange={e => setData('name', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.driver}</label>
                                    <select
                                        value={data.driver}
                                        onChange={e => {
                                            setData('driver', e.target.value);
                                            // Clear base_url when switching from custom to other providers
                                            // DeepSeek uses predefined URL, others (except custom) don't need base_url
                                            if (e.target.value !== 'custom') {
                                                setData('base_url', '');
                                            }
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                    >
                                        <option value="openai">OpenAI</option>
                                        <option value="anthropic">Anthropic</option>
                                        <option value="deepseek">DeepSeek</option>
                                        <option value="custom">Fərdi</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.model}</label>
                                <input
                                    type="text"
                                    value={data.model}
                                    onChange={e => setData('model', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                    placeholder={getModelPlaceholder(data.driver)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.apiKey}</label>
                                <input
                                    type="password"
                                    value={data.api_key}
                                    onChange={e => setData('api_key', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                    placeholder={editingProvider ? t.apiKeyEditPlaceholder : t.apiKeyPlaceholder}
                                />
                            </div>

                            {data.driver === 'custom' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {t.baseUrl}
                                    </label>
                                    <input
                                        type="url"
                                        value={data.base_url}
                                        onChange={e => setData('base_url', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                        required
                                        placeholder="https://api.example.com/v1"
                                    />
                                </div>
                            )}

                            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.setActive}</label>
                                <ToggleSwitch
                                    enabled={data.is_active}
                                    onToggle={() => setData('is_active', !data.is_active)}
                                />
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2 pt-4">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full sm:w-auto px-4 py-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
                                >
                                    {processing ? '...' : (editingProvider ? t.update : t.create)}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowForm(false);
                                        setEditingProvider(null);
                                        reset();
                                    }}
                                    className="w-full sm:w-auto px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                                >
                                    {t.cancel}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Desktop Table View */}
                <div className="hidden lg:block backdrop-blur bg-white/80 dark:bg-gray-800/80 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-600 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">{t.name}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">{t.driver}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">{t.model}</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">{t.status}</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">{t.actions}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                            {providers.map(provider => (
                                <tr key={provider.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">{provider.name}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{formatDriverName(provider.driver)}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{provider.model || '-'}</td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center space-x-2">
                                            <ToggleSwitch
                                                enabled={provider.is_active}
                                                onToggle={() => toggleProviderStatus(provider)}
                                                size="sm"
                                            />
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                {provider.is_active ? t.active : t.inactive}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end space-x-3">
                                            <button
                                                onClick={() => startEdit(provider)}
                                                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 font-medium transition-colors"
                                            >
                                                {t.edit}
                                            </button>
                                            {canDeleteProvider(provider) && (
                                                <button
                                                    onClick={() => deleteProvider(provider)}
                                                    className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 font-medium transition-colors"
                                                >
                                                    {t.delete}
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {providers.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                        {t.noProviders}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="lg:hidden space-y-4 overflow-x-hidden">
                    {providers.map(provider => (
                        <div key={provider.id} className="backdrop-blur bg-white/80 dark:bg-gray-800/80 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-600 p-4 w-full">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex-1 min-w-0 pr-2">
                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base sm:text-lg truncate">{provider.name}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{formatDriverName(provider.driver)}</p>
                                </div>
                                <div className="flex items-center space-x-2 flex-shrink-0">
                                    <button
                                        onClick={() => startEdit(provider)}
                                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 font-medium text-sm px-2 py-1 rounded"
                                    >
                                        {t.edit}
                                    </button>
                                    {canDeleteProvider(provider) && (
                                        <button
                                            onClick={() => deleteProvider(provider)}
                                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 font-medium text-sm px-2 py-1 rounded"
                                        >
                                            {t.delete}
                                        </button>
                                    )}
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 dark:text-gray-400 flex-shrink-0">{t.model}:</span>
                                    <span className="text-gray-900 dark:text-gray-100 text-right truncate ml-2">{provider.model || '-'}</span>
                                </div>
                                
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">{t.status}:</span>
                                    <div className="flex items-center space-x-2 flex-shrink-0">
                                        <ToggleSwitch
                                            enabled={provider.is_active}
                                            onToggle={() => toggleProviderStatus(provider)}
                                            size="sm"
                                        />
                                        <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                            {provider.is_active ? t.active : t.inactive}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    {providers.length === 0 && (
                        <div className="backdrop-blur bg-white/80 dark:bg-gray-800/80 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-600 p-8 text-center w-full">
                            <p className="text-gray-500 dark:text-gray-400">{t.noProviders}</p>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}