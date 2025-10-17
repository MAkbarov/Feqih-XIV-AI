import { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import ToggleSwitch from '@/Components/ToggleSwitch';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '@/Components/Icon';

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
        contextWindow: 'Kontekst Pəncərəsi (token)',
        maxOutput: 'Maksimum Çıxış Token',
        contextWindowPlaceholder: 'məs. 32768',
        maxOutputPlaceholder: 'məs. 4096',
        confirmDelete: 'Bu provayderi silmək istədiyinizdən əminsiz?',
        deleteSuccess: 'Provayder uğurla silindi'
    };
    
    // Get model placeholder based on selected driver
    const getModelPlaceholder = (driver) => {
        const placeholders = {
            'openai': 'məsələn, gpt-4, gpt-3.5-turbo',
            'anthropic': 'məsələn, claude-3-sonnet-20240229',
            'deepseek': 'məsələn, deepseek-chat, deepseek-coder',
            'gemini': 'məsələn, gemini-pro, gemini-1.5-flash',
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
        // RAG/Embedding spesifik sahələr
        embedding_model: '',
        embedding_base_url: '',
        embedding_dimension: '',
        context_window: '',
        max_output: '',
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
        
        // Parse custom_params if available
        let customParams = {};
        if (provider.custom_params) {
            try {
                customParams = JSON.parse(provider.custom_params);
            } catch (e) {
                customParams = {};
            }
        }
        
        setData({
            name: provider.name,
            driver: driverValue,
            model: provider.model || '',
            api_key: '', // Don't show existing key for security
            base_url: provider.base_url || '',
            // RAG/Embedding sahələr
            embedding_model: provider.embedding_model || '',
            embedding_base_url: provider.embedding_base_url || '',
            embedding_dimension: provider.embedding_dimension || '',
            context_window: customParams.context_window || '',
            max_output: customParams.max_output || '',
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
            'gemini': 'Google Gemini',
            'custom': 'Fərdi'
        };
        return driverNames[driver] || driver;
    };

    return (
        <AdminLayout>
            <Head title={t.title} />

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="p-3 sm:p-6"
            >
                {/* Header */}
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8"
                >
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                            <Icon name="provider" size={24} color="white" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                {t.title}
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                AI provayderlərini idarə edin və konfiqurasiya edin
                            </p>
                        </div>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowForm(true)}
                        className="group px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2"
                    >
                        <Icon name="plus" size={16} color="white" />
                        <span className="font-medium">{t.addProvider}</span>
                    </motion.button>
                </motion.div>

                {/* Stats Cards */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
                >
                    <div className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-xl border border-green-200 dark:border-green-700">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                                <Icon name="check" size={20} color="white" />
                            </div>
                            <div>
                                <p className="text-sm text-green-600 dark:text-green-400">Aktiv</p>
                                <p className="text-xl font-bold text-green-700 dark:text-green-300">
                                    {providers.filter(p => p.is_active).length}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-700">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                                <Icon name="provider" size={20} color="white" />
                            </div>
                            <div>
                                <p className="text-sm text-blue-600 dark:text-blue-400">Toplam</p>
                                <p className="text-xl font-bold text-blue-700 dark:text-blue-300">
                                    {providers.length}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-900/20 dark:to-violet-900/20 p-4 rounded-xl border border-purple-200 dark:border-purple-700">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                                <Icon name="activity" size={20} color="white" />
                            </div>
                            <div>
                                <p className="text-sm text-purple-600 dark:text-purple-400">OpenAI</p>
                                <p className="text-xl font-bold text-purple-700 dark:text-purple-300">
                                    {providers.filter(p => p.driver === 'openai').length}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-red-100 dark:from-orange-900/20 dark:to-red-900/20 p-4 rounded-xl border border-orange-200 dark:border-orange-700">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                                <Icon name="control-panel" size={20} color="white" />
                            </div>
                            <div>
                                <p className="text-sm text-orange-600 dark:text-orange-400">Digər</p>
                                <p className="text-xl font-bold text-orange-700 dark:text-orange-300">
                                    {providers.filter(p => p.driver !== 'openai').length}
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <AnimatePresence>
                    {showForm && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="backdrop-blur bg-white/95 dark:bg-gray-800/95 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-600 p-4 sm:p-6 mb-8"
                        >
                            <div className="flex items-center space-x-3 mb-6">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${editingProvider ? 'bg-blue-500' : 'bg-green-500'}`}>
                                    <Icon name={editingProvider ? 'edit' : 'plus'} size={20} color="white" />
                                </div>
                                <h2 className={`text-lg sm:text-xl font-bold ${
                                    editingProvider 
                                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent'
                                        : 'bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent'
                                }`}>
                                    {editingProvider ? t.editProvider : t.newProvider}
                                </h2>
                            </div>
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
                                        <option value="gemini">Google Gemini</option>
                                        <option value="custom">Fərdi</option>
                                    </select>
                                </div>
                            </div>

                            {/* Chat Model Bölməsi */}
                            <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 flex items-center space-x-2">
                                    <Icon name="feature_ai" size={16} color="currentColor" />
                                    <span>Çat Modeli (Chatbot üçün)</span>
                                </h3>
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
                            </div>

                            {/* RAG/Embedding Model Bölməsi */}
                            <div className="space-y-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                                <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-300 flex items-center space-x-2">
                                    <Icon name="database" size={16} color="currentColor" />
                                    <span>RAG/Embedding Modeli (Bilik Bazaı üçün)</span>
                                </h3>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Embedding Model
                                        <span className="text-xs text-gray-500 ml-1">(məs. text-embedding-3-small)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={data.embedding_model}
                                        onChange={e => setData('embedding_model', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                        placeholder={data.driver === 'openai' ? 'text-embedding-3-small' : 
                                                    data.driver === 'deepseek' ? 'deepseek-embedder' :
                                                    data.driver === 'gemini' ? 'models/embedding-001' :
                                                    data.driver === 'anthropic' ? 'voyage-2' : 'embedding model adı'}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Embedding Base URL
                                        <span className="text-xs text-gray-500 ml-1">(boş buraxıla bilər)</span>
                                    </label>
                                    <input
                                        type="url"
                                        value={data.embedding_base_url}
                                        onChange={e => setData('embedding_base_url', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                        placeholder={data.driver === 'openai' ? 'https://api.openai.com/v1' : 
                                                    data.driver === 'deepseek' ? 'https://api.deepseek.com/v1' :
                                                    data.driver === 'gemini' ? 'https://generativelanguage.googleapis.com/v1beta' :
                                                    data.driver === 'anthropic' ? 'https://api.voyageai.com/v1' : 'Base URL'}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Embedding Dimension
                                        <span className="text-xs text-gray-500 ml-1">(avto-detect, boş buraxıla bilər)</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={data.embedding_dimension}
                                        onChange={e => setData('embedding_dimension', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                        placeholder="1536"
                                        min="128"
                                        max="4096"
                                    />
                                </div>
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

                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {t.contextWindow}
                                    </label>
                                    <input
                                        type="number"
                                        value={data.context_window}
                                        onChange={e => setData('context_window', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                        placeholder={data.driver === 'openai' ? '128000' : data.driver === 'anthropic' ? '200000' : data.driver === 'deepseek' ? '64000' : t.contextWindowPlaceholder}
                                        min="1024"
                                        max="2000000"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {t.maxOutput}
                                    </label>
                                    <input
                                        type="number"
                                        value={data.max_output}
                                        onChange={e => setData('max_output', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                        placeholder={data.driver === 'openai' ? '16384' : data.driver === 'anthropic' ? '8192' : data.driver === 'deepseek' ? '8192' : t.maxOutputPlaceholder}
                                        min="1"
                                        max="32768"
                                    />
                                </div>
                            </div>

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
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Desktop Table View */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="hidden lg:block backdrop-blur bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-600 overflow-hidden"
                >
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
                            {providers.map((provider, index) => (
                                <motion.tr 
                                    key={provider.id} 
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.4, delay: index * 0.1 }}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 group"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                                provider.driver === 'openai' ? 'bg-green-100 dark:bg-green-900/30' :
                                                provider.driver === 'anthropic' ? 'bg-orange-100 dark:bg-orange-900/30' :
                                                provider.driver === 'deepseek' ? 'bg-blue-100 dark:bg-blue-900/30' :
                                                'bg-purple-100 dark:bg-purple-900/30'
                                            }`}>
                                                <Icon name={
                                                    provider.driver === 'openai' ? 'feature_ai' :
                                                    provider.driver === 'anthropic' ? 'provider' :
                                                    provider.driver === 'deepseek' ? 'activity' :
                                                    'control-panel'
                                                } size={16} color={
                                                    provider.driver === 'openai' ? '#059669' :
                                                    provider.driver === 'anthropic' ? '#dc2626' :
                                                    provider.driver === 'deepseek' ? '#2563eb' :
                                                    '#7c3aed'
                                                } />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{provider.name}</p>
                                                {provider.is_active && (
                                                    <p className="text-xs text-green-600 dark:text-green-400 flex items-center space-x-1">
                                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                                        <span>Aktiv</span>
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-2">
                                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                provider.driver === 'openai' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                                provider.driver === 'anthropic' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                                                provider.driver === 'deepseek' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                                                'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                                            }`}>
                                                {formatDriverName(provider.driver)}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900 dark:text-gray-100 font-mono bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded">
                                            {provider.model || '-'}
                                        </div>
                                    </td>
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
                                        <div className="flex items-center justify-end space-x-2">
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => startEdit(provider)}
                                                className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg transition-all duration-200 flex items-center space-x-1"
                                            >
                                                <Icon name="edit" size={14} />
                                                <span className="text-xs font-medium">{t.edit}</span>
                                            </motion.button>
                                            {canDeleteProvider(provider) && (
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => deleteProvider(provider)}
                                                    className="px-3 py-1.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition-all duration-200 flex items-center space-x-1"
                                                >
                                                    <Icon name="delete" size={14} />
                                                    <span className="text-xs font-medium">{t.delete}</span>
                                                </motion.button>
                                            )}
                                        </div>
                                    </td>
                                </motion.tr>
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
                </motion.div>

                {/* Mobile Card View */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="lg:hidden space-y-4 overflow-x-hidden"
                >
                    {providers.map((provider, index) => (
                        <motion.div 
                            key={provider.id} 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: index * 0.1 }}
                            className="backdrop-blur bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-600 p-4 w-full hover:shadow-3xl transition-all duration-300"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center space-x-3 flex-1 min-w-0 pr-2">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                        provider.driver === 'openai' ? 'bg-green-100 dark:bg-green-900/30' :
                                        provider.driver === 'anthropic' ? 'bg-orange-100 dark:bg-orange-900/30' :
                                        provider.driver === 'deepseek' ? 'bg-blue-100 dark:bg-blue-900/30' :
                                        'bg-purple-100 dark:bg-purple-900/30'
                                    }`}>
                                        <Icon name={
                                            provider.driver === 'openai' ? 'feature_ai' :
                                            provider.driver === 'anthropic' ? 'provider' :
                                            provider.driver === 'deepseek' ? 'activity' :
                                            'control-panel'
                                        } size={18} color={
                                            provider.driver === 'openai' ? '#059669' :
                                            provider.driver === 'anthropic' ? '#dc2626' :
                                            provider.driver === 'deepseek' ? '#2563eb' :
                                            '#7c3aed'
                                        } />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-2">
                                            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base truncate">{provider.name}</h3>
                                            {provider.is_active && (
                                                <div className="flex items-center space-x-1">
                                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">Aktiv</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                                            provider.driver === 'openai' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                            provider.driver === 'anthropic' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                                            provider.driver === 'deepseek' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                                            'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                                        }`}>
                                            {formatDriverName(provider.driver)}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2 flex-shrink-0">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => startEdit(provider)}
                                        className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg transition-all duration-200 flex items-center space-x-1"
                                    >
                                        <Icon name="edit" size={12} />
                                        <span className="text-xs font-medium">{t.edit}</span>
                                    </motion.button>
                                    {canDeleteProvider(provider) && (
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => deleteProvider(provider)}
                                            className="px-3 py-1.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition-all duration-200 flex items-center space-x-1"
                                        >
                                            <Icon name="delete" size={12} />
                                            <span className="text-xs font-medium">{t.delete}</span>
                                        </motion.button>
                                    )}
                                </div>
                            </div>
                            
                            <div className="space-y-3 mt-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">{t.model}:</span>
                                    <div className="text-sm text-gray-900 dark:text-gray-100 font-mono bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded text-right">
                                        {provider.model || '-'}
                                    </div>
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
                        </motion.div>
                    ))}
                    
                    {providers.length === 0 && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4 }}
                            className="backdrop-blur bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-600 p-8 text-center w-full"
                        >
                            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Icon name="provider" size={32} color="#6b7280" />
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">{t.noProviders}</p>
                            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                                Başlamaq üçün yuxarıdakı "Provayder Əlavə Et" düyməsini klikləyin
                            </p>
                        </motion.div>
                    )}
                </motion.div>
            </motion.div>
        </AdminLayout>
    );
}