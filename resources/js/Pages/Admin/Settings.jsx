import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import TextInput from '@/Components/TextInput';
import GlassTextarea from '@/Components/GlassTextarea';
import GlassSelect from '@/Components/GlassSelect';
import { useToast } from '@/Components/ToastProvider';
import { useTheme } from '@/Components/ThemeProvider';
import Icon from '@/Components/Icon';
import { motion } from 'framer-motion';
import RAGSettingsTab from './Components/RAGSettingsTab';

export default function Settings({ settings }) {
    const toast = useToast();
    const { loadTheme } = useTheme();
    const [activeTab, setActiveTab] = useState('site-settings');
    const { data, setData, post, processing, recentlySuccessful } = useForm({
        chatbot_name: settings.chatbot_name || '',
        message_input_limit: settings.message_input_limit || settings.guest_input_limit || '500',
        ai_typing_speed: settings.ai_typing_speed || '50',
        ai_thinking_time: settings.ai_thinking_time || '1000',
        ai_response_type: settings.ai_response_type || 'typewriter', // 'typewriter' or 'instant'
        ai_use_knowledge_base: settings.ai_use_knowledge_base ?? true,
        ai_strict_mode: settings.ai_strict_mode ?? true,
        ai_topic_restrictions: settings.ai_topic_restrictions || '',
        ai_internet_blocked: settings.ai_internet_blocked ?? true,
        ai_external_learning_blocked: settings.ai_external_learning_blocked ?? true,
        ai_super_strict_mode: Boolean(settings.ai_super_strict_mode),
        // RAG-Specific Strict Modes
        rag_strict_mode: settings.rag_strict_mode ?? true,
        rag_super_strict_mode: settings.rag_super_strict_mode ?? false,
        // AI Process Settings
        ai_search_method: settings.ai_search_method || 'deep_search',
        ai_no_data_message: settings.ai_no_data_message || 'Bu mövzu haqqında məlumat bazamda məlumat yoxdur.',
        ai_restriction_command: settings.ai_restriction_command || 'YALNIZ BU CÜMLƏ İLƏ CAVAB VER VƏ BAŞQA HEÇ NƏ YAZMA:',
        ai_format_islamic_terms: (() => {
            const terms = settings.ai_format_islamic_terms;
            if (typeof terms === 'string' && terms.startsWith('[')) {
                try {
                    return JSON.parse(terms).join(',');
                } catch {
                    return terms;
                }
            }
            return terms || 'dəstəmaz,namaz,oruc,hac,zəkat,qiblə,imam,ayə,hadis,sünnet,fərz,vacib,məkruh,haram,halal,Allah,Peyğəmbər,İslam,Quran';
        })(),
        ai_prompt_strict_identity: settings.ai_prompt_strict_identity || 'Sən İslami köməkçi AI assistantsan və dini məsələlərdə yardım edirsən.',
        ai_prompt_normal_identity: settings.ai_prompt_normal_identity || 'Sən köməkçi AI assistantsan və istifadəçilərə yardım edirsən.',
        // Footer Settings
        footer_text: settings.footer_text || '© 2024 AI Chatbot. Bütün hüquqlar qorunur.',
        footer_enabled: settings.footer_enabled ?? true,
        footer_text_color: settings.footer_text_color || '#6B7280',
        footer_author_text: settings.footer_author_text || 'Developed by Your Company',
        footer_author_color: settings.footer_author_color || '#6B7280',
        // Chat disclaimer
        chat_disclaimer_text: settings.chat_disclaimer_text || 'Çatbotun cavablarını yoxlayın, səhv edə bilər!',
        // Site Settings
        site_name: settings.site_name || 'AI Chatbot Platform',
        brand_mode: settings.brand_mode || 'icon',
        brand_icon_name: settings.brand_icon_name || 'nav_chat',
        brand_logo_url: settings.brand_logo_url || '',
        favicon_url: settings.favicon_url || '',
        // Admin Settings
        admin_email: settings.admin_email || '',
        // RAG System Settings
        rag_enabled: settings.rag_enabled ?? false,
        rag_embedding_provider: settings.rag_embedding_provider || 'openai',
        openai_api_key: settings.openai_api_key || '',
        openai_embedding_model: settings.openai_embedding_model || 'text-embedding-3-small',
        pinecone_api_key: settings.pinecone_api_key || '',
        pinecone_host: settings.pinecone_host || '',
        pinecone_environment: settings.pinecone_environment || '',
        pinecone_index_name: settings.pinecone_index_name || 'chatbot-knowledge',
        rag_chunk_size: settings.rag_chunk_size || '1024',
        rag_chunk_overlap: settings.rag_chunk_overlap || '200',
'rag_top_k': settings.rag_top_k || '5',
        'rag_min_score': settings.rag_min_score || '0',
        'rag_allowed_hosts': settings.rag_allowed_hosts || '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Convert checkbox values to booleans explicitly
        const formData = {
            ...data,
            ai_use_knowledge_base: Boolean(data.ai_use_knowledge_base),
            ai_strict_mode: Boolean(data.ai_strict_mode),
            ai_internet_blocked: Boolean(data.ai_internet_blocked),
            ai_external_learning_blocked: Boolean(data.ai_external_learning_blocked),
            ai_super_strict_mode: Boolean(data.ai_super_strict_mode),
            rag_strict_mode: Boolean(data.rag_strict_mode),
            rag_super_strict_mode: Boolean(data.rag_super_strict_mode),
            footer_enabled: Boolean(data.footer_enabled),
            // AI Process Settings
            ai_search_method: data.ai_search_method,
            ai_no_data_message: data.ai_no_data_message,
            ai_restriction_command: data.ai_restriction_command,
            ai_format_islamic_terms: data.ai_format_islamic_terms,
            ai_prompt_strict_identity: data.ai_prompt_strict_identity,
            ai_prompt_normal_identity: data.ai_prompt_normal_identity,
            // RAG Settings - BÜtÜN parametrləri əlavə et
            rag_enabled: data.rag_enabled === 'true' || data.rag_enabled === true ? 'true' : 'false',
            rag_chunk_size: data.rag_chunk_size,
            rag_chunk_overlap: data.rag_chunk_overlap,
'rag_top_k': data.rag_top_k,
            'rag_min_score': data.rag_min_score,
            'rag_allowed_hosts': data.rag_allowed_hosts,
            // Pinecone Settings
            pinecone_api_key: data.pinecone_api_key,
            pinecone_host: data.pinecone_host,
            pinecone_environment: data.pinecone_environment,
            pinecone_index_name: data.pinecone_index_name,
            _method: 'POST'
        };
        
        post('/admin/settings', {
            data: formData,
            forceFormData: true,
            onSuccess: () => {
                toast.success('Parametrlər uğurla yeniləndi!');
                // Reload theme to apply new settings
                loadTheme();
            },
            onError: (errors) => {
                toast.error('Parametrləri yeniləyərkən xəta baş verdi!');
                console.error('Settings errors:', errors);
            }
        });
    };

    return (
        <AdminLayout>
            <Head title="Sayt Parametrləri" />

            <div className="p-6 max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-gray-100">Sayt Parametrləri</h1>

                {/* Tab Navigation */}
                <div className="mb-8">
                    {/* Desktop tabs */}
                    <div className="hidden md:block">
                        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-100 dark:border-gray-600 overflow-hidden">
                            <div className="flex">
                                <button
                                    onClick={() => setActiveTab('site-settings')}
                                    className={`flex-1 py-4 px-6 font-semibold transition-all duration-300 flex items-center justify-center gap-3 border-r border-gray-100 dark:border-gray-600 last:border-r-0 ${
                                        activeTab === 'site-settings'
                                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105'
                                            : 'text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-800/50 dark:hover:to-indigo-800/50 hover:text-blue-700 dark:hover:text-blue-300'
                                    }`}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    <span className="font-medium">Sayt Parametrləri</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('chatbot-settings')}
                                    className={`flex-1 py-4 px-6 font-semibold transition-all duration-300 flex items-center justify-center gap-3 border-r border-gray-100 dark:border-gray-600 last:border-r-0 ${
                                        activeTab === 'chatbot-settings'
                                            ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg transform scale-105'
                                            : 'text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 dark:hover:from-green-800/50 dark:hover:to-emerald-800/50 hover:text-green-700 dark:hover:text-green-300'
                                    }`}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    <span className="font-medium">Çatbot Parametrləri</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('ai-controls')}
                                    className={`flex-1 py-4 px-6 font-semibold transition-all duration-300 flex items-center justify-center gap-3 border-r border-gray-100 dark:border-gray-600 last:border-r-0 ${
                                        activeTab === 'ai-controls'
                                            ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg transform scale-105'
                                            : 'text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-red-50 hover:to-orange-50 dark:hover:from-red-800/50 dark:hover:to-orange-800/50 hover:text-red-700 dark:hover:text-red-300'
                                    }`}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                    <span className="font-medium">AI Kontrol</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('footer-settings')}
                                    className={`flex-1 py-4 px-6 font-semibold transition-all duration-300 flex items-center justify-center gap-3 border-r border-gray-100 dark:border-gray-600 last:border-r-0 ${
                                        activeTab === 'footer-settings'
                                            ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white shadow-lg transform scale-105'
                                            : 'text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-violet-50 hover:to-pink-50 dark:hover:from-violet-800/50 dark:hover:to-pink-800/50 hover:text-violet-700 dark:hover:text-violet-300'
                                    }`}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v1m0 0h6m-6 0V9a2 2 0 012-2h6a2 2 0 012 2v12a2 2 0 01-2 2H7m-6 0a2 2 0 002 2v0a2 2 0 002-2v0" />
                                    </svg>
                                    <span className="font-medium">Footer</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('rag-settings')}
                                    className={`flex-1 py-4 px-6 font-semibold transition-all duration-300 flex items-center justify-center gap-3 ${
                                        activeTab === 'rag-settings'
                                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg transform scale-105'
                                            : 'text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 dark:hover:from-purple-800/50 dark:hover:to-indigo-800/50 hover:text-purple-700 dark:hover:text-purple-300'
                                    }`}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                    <span className="font-medium">RAG System</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    {/* Mobile tabs */}
                    <div className="md:hidden">
                        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-200 dark:border-gray-600 p-2">
                            <div role="tablist" aria-label="Settings Tabs" className="flex items-center gap-2 overflow-x-auto no-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
                                <button
                                    role="tab"
                                    aria-selected={activeTab === 'site-settings'}
                                    onClick={() => setActiveTab('site-settings')}
                                    className={`shrink-0 px-3 py-2 rounded-full text-sm font-medium inline-flex items-center gap-2 transition-all ${
                                        activeTab === 'site-settings'
                                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                                            : 'bg-blue-50 dark:bg-gray-700 text-blue-700 dark:text-gray-200 hover:bg-blue-100 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    <span>Sayt</span>
                                </button>
                                <button
                                    role="tab"
                                    aria-selected={activeTab === 'chatbot-settings'}
                                    onClick={() => setActiveTab('chatbot-settings')}
                                    className={`shrink-0 px-3 py-2 rounded-full text-sm font-medium inline-flex items-center gap-2 transition-all ${
                                        activeTab === 'chatbot-settings'
                                            ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md'
                                            : 'bg-green-50 dark:bg-gray-700 text-green-700 dark:text-gray-200 hover:bg-green-100 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    <span>Çatbot</span>
                                </button>
                                <button
                                    role="tab"
                                    aria-selected={activeTab === 'ai-controls'}
                                    onClick={() => setActiveTab('ai-controls')}
                                    className={`shrink-0 px-3 py-2 rounded-full text-sm font-medium inline-flex items-center gap-2 transition-all ${
                                        activeTab === 'ai-controls'
                                            ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-md'
                                            : 'bg-red-50 dark:bg-gray-700 text-red-700 dark:text-gray-200 hover:bg-red-100 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                    <span>AI</span>
                                </button>
                                <button
                                    role="tab"
                                    aria-selected={activeTab === 'footer-settings'}
                                    onClick={() => setActiveTab('footer-settings')}
                                    className={`shrink-0 px-3 py-2 rounded-full text-sm font-medium inline-flex items-center gap-2 transition-all ${
                                        activeTab === 'footer-settings'
                                            ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white shadow-md'
                                            : 'bg-violet-50 dark:bg-gray-700 text-violet-700 dark:text-gray-200 hover:bg-violet-100 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v1m0 0h6m-6 0V9a2 2 0 012-2h6a2 2 0 012 2v12a2 2 0 01-2 2H7m-6 0a2 2 0 002 2v0a2 2 0 002-2v0" />
                                    </svg>
                                    <span>Footer</span>
                                </button>
                                <button
                                    role="tab"
                                    aria-selected={activeTab === 'rag-settings'}
                                    onClick={() => setActiveTab('rag-settings')}
                                    className={`shrink-0 px-3 py-2 rounded-full text-sm font-medium inline-flex items-center gap-2 transition-all ${
                                        activeTab === 'rag-settings'
                                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                                            : 'bg-purple-50 dark:bg-gray-700 text-purple-700 dark:text-gray-200 hover:bg-purple-100 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                    <span>RAG</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Site Settings Tab */}
                    {activeTab === 'site-settings' && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="backdrop-blur bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-600 p-6"
                        >
                            <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300 flex items-center gap-3">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                Sayt Parametrləri
                            </h2>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Sayt Adı
                                </label>
                                <TextInput
                                    type="text"
                                    value={data.site_name}
                                    onChange={e => setData('site_name', e.target.value)}
                                    variant="glass"
                                    className="w-full"
                                    placeholder="AI Chatbot Platform"
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Bu ad navbar-da göstəriləcək
                                </p>
                            </div>

                            {/* Branding tabs */}
                            <div className="mt-6">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Brend Göstərişi</label>
                                <div className="flex items-center gap-3 mb-3">
                                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                        <input type="radio" name="brand_mode" checked={data.brand_mode==='icon'} onChange={() => setData('brand_mode','icon')} />
                                        <span>Icon</span>
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                        <input type="radio" name="brand_mode" checked={data.brand_mode==='logo'} onChange={() => setData('brand_mode','logo')} />
                                        <span>Logo</span>
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                        <input type="radio" name="brand_mode" checked={data.brand_mode==='none'} onChange={() => setData('brand_mode','none')} />
                                        <span>Heç biri (yalnız başlıq)</span>
                                    </label>
                                </div>

                                {/* Icon Selection */}
                                {data.brand_mode === 'icon' && (
                                    <div className="backdrop-blur bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-600 rounded-xl p-4 mt-4">
                                        <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Icon seç</h3>
                                        <div className="grid grid-cols-4 gap-2 max-h-48 overflow-auto">
                                            {['nav_chat','home','feature_ai','settings','heart','shield_check','gift','sun','moon','users','message','provider'].map(n => (
                                                <button key={n} type="button" onClick={() => setData('brand_icon_name', n)} className={`flex items-center justify-center p-2 rounded-lg border transition ${data.brand_icon_name===n?'border-blue-500 bg-blue-50 dark:bg-blue-900/20':'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/40'}`}>
                                                    <span className="sr-only">{n}</span>
                                                    <div className="w-6 h-6 flex items-center justify-center">
                                                        <svg viewBox="0 0 24 24" className="hidden" aria-hidden="true"></svg>
                                                        <span>
                                                            <Icon name={n} size={20} color={data.brand_icon_name===n ? '#2563eb' : (typeof window!== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? '#e5e7eb' : '#374151')} />
                                                        </span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Icon rejimi seçilərsə istifadə olunacaq.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        </motion.div>
                    )}

                    {/* Chatbot Settings Tab */}
                    {activeTab === 'chatbot-settings' && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="backdrop-blur bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-600 p-6"
                        >
                            <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300 flex items-center gap-3">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                Çatbot Parametrləri
                            </h2>
                        <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 dark:border-blue-500 p-4 mb-4">
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                <strong>Qeyd:</strong> AI Sistem Təlimatı və Bilik Bazası üçün 
                                <a href="/admin/ai-training" className="underline hover:no-underline text-blue-800 dark:text-blue-200 font-medium">
                                    AI Training səhifəsinə
                                </a> keçin.
                            </p>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Chatbot Adı
                                </label>
                                <TextInput
                                    type="text"
                                    value={data.chatbot_name}
                                    onChange={e => setData('chatbot_name', e.target.value)}
                                    variant="glass"
                                    className="w-full"
                                />
                            </div>


                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Daxiletmə limiti (istifadəçi mətni, simvol)
                                </label>
                                <TextInput
                                    type="number"
                                    value={data.message_input_limit}
                                    onChange={e => setData('message_input_limit', e.target.value)}
                                    variant="glass"
                                    className="w-full"
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    İstifadəçilərin göndərə biləcəyi maksimum simvol sayı
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    AI Cavab Növü
                                </label>
                                <GlassSelect
                                    value={data.ai_response_type}
                                    onChange={e => setData('ai_response_type', e.target.value)}
                                    variant="glass"
                                    className="w-full"
                                >
                                    <option value="typewriter">Hərf-hərf yazma (Typewriter)</option>
                                    <option value="instant">Dərhal göstərmə (Instant)</option>
                                </GlassSelect>
                                <p className="text-xs text-gray-500 mt-1">
                                    Cavabın necə göstəriləcəyini seçin
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Düşünmə vaxtı (ms)
                                    </label>
                                    <input
                                        type="number"
                                        value={data.ai_thinking_time}
                                        onChange={e => setData('ai_thinking_time', e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500"
                                        min="0"
                                        step="100"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        AI cavab yazmadan əvvəl gözləmə vaxtı
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Yazma sürəti (ms/hərf)
                                    </label>
                                    <input
                                        type="number"
                                        value={data.ai_typing_speed}
                                        onChange={e => setData('ai_typing_speed', e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500"
                                        min="10"
                                        max="200"
                                        step="10"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Hər hərf arası gözləmə vaxtı
                                    </p>
                                </div>
                            </div>
                        </div>
                        </motion.div>
                    )}

                    {/* AI Professional Controls Tab - Extended */}
                    {activeTab === 'ai-controls' && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-6"
                        >
                            {/* 1. Search Methods */}
                            <div className="backdrop-blur bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-600 p-6">
                                <h3 className="text-lg font-semibold mb-4 text-blue-700 dark:text-blue-300 flex items-center gap-3">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    1. Axtarış Metodları
                                </h3>
                                <div className="space-y-3">
                                    <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="ai_search_method"
                                            value="deep_search"
                                            checked={data.ai_search_method === 'deep_search'}
                                            onChange={e => setData('ai_search_method', e.target.value)}
                                            className="text-blue-600"
                                        />
                                        <div>
                                            <span className="font-medium text-gray-900 dark:text-gray-100">🔍 Dərin Axtarış</span>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">URL + Q&A + Ümumi məlumatlar (3 prioritet sistemi)</p>
                                        </div>
                                    </label>
                                    <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="ai_search_method"
                                            value="standard_search"
                                            checked={data.ai_search_method === 'standard_search'}
                                            onChange={e => setData('ai_search_method', e.target.value)}
                                            className="text-blue-600"
                                        />
                                        <div>
                                            <span className="font-medium text-gray-900 dark:text-gray-100">⚡ Standart Axtarış</span>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Yalnız URL məlumatları (sürətli performans)</p>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* 2. Basic AI Controls */}
                            <div className="backdrop-blur bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-600 p-6">
                                <h3 className="text-lg font-semibold mb-4 text-green-700 dark:text-green-300 flex items-center gap-3">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    2. Əsas AI Kontrolları
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                checked={data.ai_use_knowledge_base}
                                                onChange={e => setData('ai_use_knowledge_base', e.target.checked)}
                                                className="rounded"
                                            />
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Bilik Bazasını İstifadə Et
                                            </span>
                                        </label>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
                                            Cavabları təlimatlar və öyrəndiklərinə əsaslanacaq
                                        </p>
                                    </div>

                                    <div>
                                        <label className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                checked={data.ai_strict_mode}
                                                onChange={e => setData('ai_strict_mode', e.target.checked)}
                                                className="rounded"
                                            />
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                <span className="text-orange-600 font-bold">Strict Mode</span> - Mövzu Məhdudiyyətləri
                                            </span>
                                        </label>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
                                            Mövzuya fokuslanma və kənar məsələlərdən qaçınma
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Mövzu Məhdudiyyətləri
                                        </label>
                                        <GlassTextarea
                                            value={data.ai_topic_restrictions}
                                            onChange={e => setData('ai_topic_restrictions', e.target.value)}
                                            className="w-full h-20"
                                            placeholder="Məsələn:&#10;- Siyasi məsələlərdən qaçın&#10;- Yalnız fiqh və əxlaqa fokuslan&#10;- Müasəllə mövzularda ehtiyatlı ol"
                                        />
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            Əlavə qadağalar və yönəldirici qərarlar
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* 3. Restriction Messages */}
                            <div className="backdrop-blur bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-600 p-6">
                                <h3 className="text-lg font-semibold mb-4 text-yellow-700 dark:text-yellow-300 flex items-center gap-3">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.634 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                    3. Məhdudiyyət Mesajları
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            "Məlumat Yoxdur" Mesajı
                                        </label>
                                        <TextInput
                                            value={data.ai_no_data_message}
                                            onChange={e => setData('ai_no_data_message', e.target.value)}
                                            variant="glass"
                                            className="w-full"
                                            placeholder="Bu mövzu haqqında məlumat bazamda məlumat yoxdur."
                                        />
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            Məlumat olmadıqda göstəriləcək mesaj
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Məhdudiyyət Komandası
                                        </label>
                                        <TextInput
                                            value={data.ai_restriction_command}
                                            onChange={e => setData('ai_restriction_command', e.target.value)}
                                            variant="glass"
                                            className="w-full"
                                            placeholder="YALNIZ BU CÜMLƏ İLƏ CAVAB VER VƏ BAŞQA HEÇ NƏ YAZMA:"
                                        />
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            Məhdudlaşdırılmış cavab üçün əmr
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* 4. Format Settings */}
                            <div className="backdrop-blur bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-600 p-6">
                                <h3 className="text-lg font-semibold mb-4 text-purple-700 dark:text-purple-300 flex items-center gap-3">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707L16.414 6.5A1 1 0 0015.707 6H9a2 2 0 00-2 2v11z" />
                                    </svg>
                                    4. Format Təmizliyi
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Bold Ediləcək Terminlər (vergüllə ayır)
                                        </label>
                                        <GlassTextarea
                                            value={typeof data.ai_format_islamic_terms === 'string' && data.ai_format_islamic_terms.startsWith('[') ? 
                                                JSON.parse(data.ai_format_islamic_terms).join(',') : 
                                                data.ai_format_islamic_terms || ''
                                            }
                                            onChange={e => setData('ai_format_islamic_terms', e.target.value)}
                                            className="w-full h-20 font-mono"
                                            placeholder="dəstəmaz,namaz,oruc,hac,zəkat,qiblə,imam,ayə,hadis,sünnet,fərz,vacib,məkruh,haram,halal,Allah,Peyğəmbər,İslam,Quran"
                                            style={{ lineHeight: '1.6', fontSize: '14px' }}
                                        />
                                        <div className="mt-2 space-y-2">
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                Bu terminlər cavabda **bold** ediləcək
                                            </p>
                                            {data.ai_format_islamic_terms && (
                                                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-700">
                                                    <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-2">Önizləmə (vergüllə ayrılan terminlər):</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {(typeof data.ai_format_islamic_terms === 'string' && data.ai_format_islamic_terms.startsWith('[') ? 
                                                            JSON.parse(data.ai_format_islamic_terms) : 
                                                            data.ai_format_islamic_terms.split(',').map(term => term.trim()).filter(term => term)
                                                        ).map((term, index) => (
                                                            <span key={index} className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs rounded font-semibold">
                                                                **{term}**
                                                            </span>
                                                        ))}
                                                    </div>
                                                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                                                        Cəmi {(typeof data.ai_format_islamic_terms === 'string' && data.ai_format_islamic_terms.startsWith('[') ? 
                                                            JSON.parse(data.ai_format_islamic_terms).length : 
                                                            data.ai_format_islamic_terms.split(',').map(t => t.trim()).filter(t => t).length
                                                        )} termin bold ediləcək
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 5. System Identity Prompts */}
                            <div className="backdrop-blur bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-600 p-6">
                                <h3 className="text-lg font-semibold mb-4 text-indigo-700 dark:text-indigo-300 flex items-center gap-3">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    5. Sistem Kimlik Təlimatları
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Strict Mode Kimliyi
                                        </label>
                                        <GlassTextarea
                                            value={data.ai_prompt_strict_identity}
                                            onChange={e => setData('ai_prompt_strict_identity', e.target.value)}
                                            className="w-full h-16"
                                            placeholder="Sən İslami köməkçi AI assistantsan və dini məsələlərdə yardım edirsən."
                                        />
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            Strict Mode aktiv olduqda istifadə edilən kimlik
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Normal Mode Kimliyi
                                        </label>
                                        <GlassTextarea
                                            value={data.ai_prompt_normal_identity}
                                            onChange={e => setData('ai_prompt_normal_identity', e.target.value)}
                                            className="w-full h-16"
                                            placeholder="Sən köməkçi AI assistantsan və istifadəçilərə yardım edirsən."
                                        />
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            Normal mode-da istifadə edilən kimlik
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* 6. Advanced Isolation Controls */}
                            <div className="backdrop-blur bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-xl border border-red-200 dark:border-red-600 p-6">
                                <h3 className="text-lg font-semibold text-red-700 dark:text-red-300 mb-4 flex items-center gap-3">
                                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
                                    </svg>
                                    6. ADVANCED İZOLASIYA KONTROLLARI
                                </h3>
                                
                                <div className="space-y-4">
                                    <div>
                                        <label className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                checked={data.ai_internet_blocked}
                                                onChange={e => setData('ai_internet_blocked', e.target.checked)}
                                                className="rounded"
                                            />
                                            <span className="text-sm font-medium text-red-700 dark:text-red-300">
                                                <span className="font-bold">İnternet Əlaqəsini Blokla</span>
                                            </span>
                                        </label>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
                                            AI-nin internet məlumatlarına əlaqəsini təmamən blokla
                                        </p>
                                    </div>

                                    <div>
                                        <label className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                checked={data.ai_external_learning_blocked}
                                                onChange={e => setData('ai_external_learning_blocked', e.target.checked)}
                                                className="rounded"
                                            />
                                            <span className="text-sm font-medium text-red-700 dark:text-red-300">
                                                <span className="font-bold">Xarici Öyrənməni Blokla</span>
                                            </span>
                                        </label>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
                                            AI yalnız sizə verilən təlimatları istifadə edər, öz bazasını deyil
                                        </p>
                                    </div>

                                    <div>
                                        <label className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                checked={data.ai_super_strict_mode}
                                                onChange={e => setData('ai_super_strict_mode', e.target.checked)}
                                                className="rounded"
                                            />
                                            <span className="text-sm font-medium text-red-700 dark:text-red-300 flex items-center gap-2">
                                                <svg className="w-4 h-4 text-red-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                </svg>
                                                <span className="font-bold text-red-800 dark:text-red-400">SUPER STRİCT MODE</span>
                                            </span>
                                        </label>
                                        <p className="text-xs text-red-600 dark:text-red-400 mt-1 ml-6 font-medium">
                                            Təlimatdan kənara çıxmaq ÜÇÜN QADAĞA! Yalnız admin təlimatları!
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Footer Settings Tab */}
                    {activeTab === 'footer-settings' && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="backdrop-blur bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-600 p-6"
                        >
                            <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300 flex items-center gap-3">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v1m0 0h6m-6 0V9a2 2 0 012-2h6a2 2 0 012 2v12a2 2 0 01-2 2H7m-6 0a2 2 0 002 2v0a2 2 0 002-2v0" />
                                </svg>
                                Footer Parametrləri
                            </h2>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={data.footer_enabled}
                                        onChange={e => setData('footer_enabled', e.target.checked)}
                                        className="rounded"
                                    />
                                    <span className="text-sm font-medium text-gray-700">
                                        Footer-i Aktivləşdir
                                    </span>
                                </label>
                                <p className="text-xs text-gray-500 mt-1">
                                    Saytın altında footer göstərilsin
                                </p>
                            </div>
                            
                            {data.footer_enabled && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Footer Mətni (Sol tərəf)
                                        </label>
                                        <GlassTextarea
                                            value={data.footer_text}
                                            onChange={e => setData('footer_text', e.target.value)}
                                            className="w-full h-20"
                                            placeholder="© 2024 AI Chatbot. Bütün hüquqlar qorunur."
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Sol tərəfdə göstəriləcək copyright mətni
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Footer Mətn Rəngi
                                            </label>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="color"
                                                    value={data.footer_text_color}
                                                    onChange={e => setData('footer_text_color', e.target.value)}
                                                    className="w-12 h-10 border-2 border-gray-300 rounded-lg cursor-pointer"
                                                />
                                                <TextInput
                                                    type="text"
                                                    value={data.footer_text_color}
                                                    onChange={e => setData('footer_text_color', e.target.value)}
                                                    variant="glass"
                                                    className="flex-1"
                                                    placeholder="#6B7280"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <hr className="my-4" />
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Müəllif Mətni (Sağ tərəf) - HTML Dəstəkli
                                        </label>
                                        <GlassTextarea
                                            value={data.footer_author_text}
                                            onChange={e => setData('footer_author_text', e.target.value)}
                                            className="w-full min-h-20 max-h-32 font-mono text-sm"
                                            placeholder="Developed by <strong>Your Company</strong>"
                                            rows={3}
                                            style={{
                                                whiteSpace: 'pre-wrap',
                                                overflow: 'auto',
                                                resize: 'vertical',
                                                wordWrap: 'break-word'
                                            }}
                                        />
                                        <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border">
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-medium">Dəstəklənən HTML teqləri:</p>
                                            <div className="flex flex-wrap gap-2 text-xs">
                                                <code className="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded text-gray-800 dark:text-gray-200">&lt;strong&gt;</code>
                                                <code className="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded text-gray-800 dark:text-gray-200">&lt;b&gt;</code>
                                                <code className="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded text-gray-800 dark:text-gray-200">&lt;em&gt;</code>
                                                <code className="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded text-gray-800 dark:text-gray-200">&lt;i&gt;</code>
                                                <code className="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded text-gray-800 dark:text-gray-200">&lt;a href="..."&gt;</code>
                                                <code className="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded text-gray-800 dark:text-gray-200">&lt;img src="..."&gt;</code>
                                            </div>
                                            <div className="mt-3 text-xs text-gray-600 dark:text-gray-400 space-y-2">
                                                <p><strong>Şəkil ölçüləndirmə nümunələri:</strong></p>
                                                <div className="space-y-1 font-mono text-xs bg-gray-100 dark:bg-gray-600 p-2 rounded">
                                                    <div><code>Developer &lt;img src="/logo.png" style="height:20px;width:auto;display:inline;vertical-align:middle;margin:0 4px"&gt; Team</code></div>
                                                    <div><code>Made by &lt;img src="/icon.png" style="height:16px;width:16px;object-fit:contain;display:inline-block"&gt; Company</code></div>
                                                    <div><code>&lt;strong&gt;Bold&lt;/strong&gt; &amp; &lt;em&gt;Italic&lt;/em&gt; &amp; &lt;a href="#"&gt;Link&lt;/a&gt;</code></div>
                                                </div>
                                                <p className="text-red-600 dark:text-red-400"><strong>Qeyd:</strong> Şəkillər üçün mütləq style="height:Xpx;display:inline" istifadə edin!</p>
                                            </div>
                                        </div>
                                        {data.footer_author_text && (
                                            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                                                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-2">Önizləmə:</p>
                                                <div 
                                                    className="preview-content text-sm text-gray-700 dark:text-gray-300 flex items-center flex-wrap gap-1"
                                                    dangerouslySetInnerHTML={{ __html: data.footer_author_text }}
                                                    style={{
                                                        lineHeight: '1.5rem',
                                                        alignItems: 'center',
                                                        wordBreak: 'break-word'
                                                    }}
                                                />
                                            </div>
                                        )}
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                            Sağ tərəfdə göstəriləcək müəllif mətni. HTML teqləri və şəkillər istifadə edə bilərsiniz.
                                        </p>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Müəllif Mətn Rəngi
                                        </label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="color"
                                                value={data.footer_author_color}
                                                onChange={e => setData('footer_author_color', e.target.value)}
                                                className="w-12 h-10 border-2 border-gray-300 rounded-lg cursor-pointer"
                                            />
                                            <TextInput
                                                type="text"
                                                value={data.footer_author_color}
                                                onChange={e => setData('footer_author_color', e.target.value)}
                                                variant="glass"
                                                className="flex-1"
                                                placeholder="#6B7280"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Müəllif mətninin rəng kodu
                                        </p>
                                    </div>
                                    
                                    <hr className="my-6" />
                                    
                                    <h3 className="text-lg font-medium text-gray-800 mb-4">
                                        Əlavə Footer Elementləri
                                    </h3>
                                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                                        <div className="flex">
                                            <div className="ml-3">
                                                <p className="text-sm text-blue-700">
                                                    <strong>Rəng Sistemi:</strong> Sol tərəf elementlər "Footer Mətn Rəngi" istifadə edir, Sağ tərəf elementlər "Müəllif Mətn Rəngi" istifadə edir.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Çat Xəbərdarlıq Mətni
                                            </label>
                                            <GlassTextarea
                                                value={data.chat_disclaimer_text}
                                                onChange={e => setData('chat_disclaimer_text', e.target.value)}
                                                className="w-full h-20"
                                                placeholder="Çatbotun cavablarını yoxlayın, səhv edə bilər!"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                Mesaj inputunun altında göstəriləcək xəbərdarlıq mətni
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        </motion.div>
                    )}

                    {/* RAG Settings Tab */}
                    {activeTab === 'rag-settings' && (
                        <RAGSettingsTab data={data} setData={setData} />
                    )}

                    <div className="flex justify-end mt-8">
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                        >
                            {processing ? 'Saxlanılır...' : 'Parametrləri Yadda Saxla'}
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}