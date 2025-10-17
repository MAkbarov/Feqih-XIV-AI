import React, { useState } from 'react';
import { motion } from 'framer-motion';
import TextInput from '@/Components/TextInput';
import axios from 'axios';

export default function RAGSettingsTab({ data, setData }) {
    const [testing, setTesting] = useState({ deepseek: false, pinecone: false, system: false });
    const [testResults, setTestResults] = useState({ deepseek: null, pinecone: null, system: null });
    const [compatibilityCheck, setCompatibilityCheck] = useState(null);
    const [checkingCompatibility, setCheckingCompatibility] = useState(false);
    const [showProviderWarning, setShowProviderWarning] = useState(false);
    const [savingPinecone, setSavingPinecone] = useState(false);
    const [saveResult, setSaveResult] = useState(null);

    const testEmbeddingConnection = async () => {
        setTesting({ ...testing, deepseek: true });
        setTestResults({ ...testResults, deepseek: null });
        
        try {
            const response = await axios.get('/api/rag/health/embedding');
            setTestResults({ 
                ...testResults, 
                deepseek: { 
                    success: true, 
                    message: response.data.message,
                    provider: response.data.provider,
                    model: response.data.model
                } 
            });
        } catch (error) {
            const errorData = error.response?.data;
            setTestResults({ 
                ...testResults, 
                deepseek: { 
                    success: false, 
                    message: errorData?.message || 'Bağlantı xətası',
                    provider: errorData?.provider,
                    status: errorData?.status
                } 
            });
        } finally {
            setTesting({ ...testing, deepseek: false });
        }
    };

    const savePineconeSettings = async () => {
        setSavingPinecone(true);
        setSaveResult(null);
        try {
            await axios.post('/admin/settings/pinecone', {
                pinecone_api_key: data.pinecone_api_key || '',
                pinecone_host: (data.pinecone_host || '').trim(),
                pinecone_environment: (data.pinecone_environment || '').trim(),
                pinecone_index_name: (data.pinecone_index_name || '').trim(),
                rag_chunk_size: data.rag_chunk_size || '1024',
                rag_chunk_overlap: data.rag_chunk_overlap || '200',
                rag_top_k: data.rag_top_k || '5',
                rag_min_score: data.rag_min_score || '0',
                rag_allowed_hosts: (data.rag_allowed_hosts || '').trim(),
            });
            setSaveResult({ success: true, message: 'Pinecone parametrləri yadda saxlandı' });
        } catch (error) {
            setSaveResult({ success: false, message: 'Yadda saxlama xətası' });
        } finally {
            setSavingPinecone(false);
        }
    };

    const testPineconeConnection = async () => {
        setTesting({ ...testing, pinecone: true });
        setTestResults({ ...testResults, pinecone: null });
        
        try {
            const response = await axios.get('/api/rag/health/pinecone');
            setTestResults({ ...testResults, pinecone: { success: true, message: response.data.message, base_url: response.data.base_url } });
        } catch (error) {
            setTestResults({ 
                ...testResults, 
                pinecone: { 
                    success: false, 
                    message: error.response?.data?.message || 'Bağlantı xətası',
                    base_url: error.response?.data?.base_url || null,
                } 
            });
        } finally {
            setTesting({ ...testing, pinecone: false });
        }
    };

    const testRAGSystem = async () => {
        setTesting({ ...testing, system: true });
        setTestResults({ ...testResults, system: null });
        
        try {
            const response = await axios.get('/api/rag/health/system');
            setTestResults({ 
                ...testResults, 
                system: { 
                    success: response.data.success, 
                    results: response.data.results 
                } 
            });
        } catch (error) {
            setTestResults({ 
                ...testResults, 
                system: { 
                    success: false, 
                    message: 'Sistem yoxlaması xətası' 
                } 
            });
        } finally {
            setTesting({ ...testing, system: false });
        }
    };

    // Check if RAG can be enabled
    const handleRAGToggle = async (enabled) => {
        if (!enabled) {
            // Disabling RAG - no check needed
            setData('rag_enabled', false);
            setShowProviderWarning(false);
            setCompatibilityCheck(null);
            return;
        }

        // Enabling RAG - check compatibility
        setCheckingCompatibility(true);
        
        try {
            const response = await axios.get('/api/rag/health/compatibility');
            
            if (response.data.can_enable) {
                // All good - enable RAG
                setData('rag_enabled', true);
                setCompatibilityCheck(response.data);
                setShowProviderWarning(false);
            }
        } catch (error) {
            // Cannot enable - show warning
            if (error.response?.status === 400) {
                setCompatibilityCheck(error.response.data);
                setShowProviderWarning(true);
                setData('rag_enabled', false);
            } else {
                console.error('Compatibility check error:', error);
                setData('rag_enabled', false);
            }
        } finally {
            setCheckingCompatibility(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
        >
            {/* RAG System Enable/Disable */}
            <div className="backdrop-blur bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-600 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-3">
                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            RAG Sistemi
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Yüksək dəqiqliyə malik Retrieval-Augmented Generation sistemi
                        </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={data.rag_enabled === 'true' || data.rag_enabled === true}
                            onChange={(e) => handleRAGToggle(e.target.checked)}
                            disabled={checkingCompatibility}
                            className="sr-only peer"
                        />
                        <div className={`w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600 ${checkingCompatibility ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
                        {checkingCompatibility && (
                            <div className="absolute -right-8 top-1">
                                <svg className="animate-spin h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            </div>
                        )}
                    </label>
                </div>

                {showProviderWarning && compatibilityCheck && (
                    <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-600 rounded-lg">
                        <div className="flex items-start gap-3">
                            <svg className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.634 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            <div className="flex-1">
                                <p className="font-semibold text-red-800 dark:text-red-200 mb-2">
                                    ❌ RAG sistemi aktiv edilə bilməz!
                                </p>
                                <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                                    {compatibilityCheck.message}
                                </p>
                                
                                {compatibilityCheck.action === 'change_provider' && compatibilityCheck.compatible_providers?.length > 0 && (
                                    <div className="mt-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded border border-red-200 dark:border-red-700">
                                        <p className="text-xs font-semibold text-red-800 dark:text-red-200 mb-2">
                                            🔄 Uygun provider-lər:
                                        </p>
                                        <div className="space-y-2">
                                            {compatibilityCheck.compatible_providers.map((provider) => (
                                                <div key={provider.id} className={`flex items-center justify-between p-2 rounded ${
                                                    provider.is_active 
                                                        ? 'bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700' 
                                                        : 'bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600'
                                                }`}>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                                            {provider.name} ({provider.driver})
                                                        </p>
                                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                                            Embedding: {provider.embedding_model}
                                                        </p>
                                                    </div>
                                                    {provider.is_active && (
                                                        <span className="text-xs px-2 py-1 bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 rounded font-semibold">
                                                            Aktiv
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        <a 
                                            href="/admin/providers" 
                                            className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            AI Providers səhifəsinə keç
                                        </a>
                                    </div>
                                )}

                                {compatibilityCheck.action === 'activate_provider' && (
                                    <a 
                                        href="/admin/providers" 
                                        className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                                    >
                                        AI Provider aktiv et
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {!showProviderWarning && (data.rag_enabled === 'true' || data.rag_enabled === true) && compatibilityCheck?.can_enable && (
                    <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <p className="text-sm font-semibold text-green-800 dark:text-green-200">
                                    ✅ RAG sistemi aktiv - Çatbot yalnız knowledge base-dən cavab verəcək
                                </p>
                                {compatibilityCheck.active_provider && (
                                    <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                                        Embedding Provider: {compatibilityCheck.active_provider.name} ({compatibilityCheck.active_provider.embedding_model})
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {!showProviderWarning && !(data.rag_enabled === 'true' || data.rag_enabled === true) && (
                    <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                        <p className="text-sm text-amber-800 dark:text-amber-200">
                            ⚠️ RAG sistemi deaktiv - Köhnə sistem istifadə olunur
                        </p>
                    </div>
                )}
            </div>

            {/* AI Provider Info */}
            <div className="backdrop-blur bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-xl border border-blue-200 dark:border-blue-600 p-6">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    AI Provider (Embedding & Chat)
                </h3>

                <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 dark:border-blue-500 p-4">
                    <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                                RAG sistemi aktiv AI Provider-dən istifadə edir
                            </p>
                            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                                AI Provider parametrlərini konfigurasiya etmək üçün 
                                <a href="/admin/ai-providers" className="underline hover:no-underline font-semibold">
                                    AI Providers səhifəsinə
                                </a> keçin.
                            </p>
                            <div className="mt-3 p-2 bg-white/50 dark:bg-gray-800/50 rounded border border-blue-200 dark:border-blue-700">
                                <p className="text-xs font-mono text-blue-900 dark:text-blue-100">
                                    💡 <strong>Qeyd:</strong> Həm embedding (mətnin vektorlaşması), həm də chat (cavab generasiyası) eyni provider istifadə edir.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Test Connection Button */}
                    <div className="flex items-center gap-3 pt-4">
                        <button
                            type="button"
                            onClick={testEmbeddingConnection}
                            disabled={testing.deepseek}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
                    >
                        {testing.deepseek ? (
                            <>
                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Yoxlanılır...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                AI Provider Bağlantısını Yoxla
                            </>
                        )}
                    </button>

                    {testResults.deepseek && (
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                            testResults.deepseek.success 
                                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' 
                                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                        }`}>
                            {testResults.deepseek.success ? '✅' : '❌'} {testResults.deepseek.message}
                        </div>
                    )}
                </div>
            </div>

            {/* Pinecone & RAG Settings */}
            <div className="backdrop-blur bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-600 p-6">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                    </svg>
                    Pinecone Vector Database
                </h3>

                <div className="space-y-4">
                    {/* RAG Retrieval Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Min Relevance Score (0–1)
                            </label>
                            <TextInput
                                type="number"
                                step="0.01"
                                min="0"
                                max="1"
                                value={data.rag_min_score || ''}
                                onChange={e => setData('rag_min_score', e.target.value)}
                                variant="glass"
                                className="w-full"
                                placeholder="0.25"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Bu dəyərdən aşağı skorlu parçalar istifadə olunmayacaq
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Allowed Hosts (vergüllə ayırın)
                            </label>
                            <TextInput
                                type="text"
                                value={data.rag_allowed_hosts || ''}
                                onChange={e => setData('rag_allowed_hosts', e.target.value)}
                                variant="glass"
                                className="w-full font-mono text-sm"
                                placeholder="www.sistani.org, www.example.com"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Yalnız bu host-lardan gələn məzmun RAG cavabı üçün istifadə ediləcək
                            </p>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            API Key <span className="text-red-500">*</span>
                        </label>
                        <TextInput
                            type="password"
                            value={data.pinecone_api_key || ''}
                            onChange={e => setData('pinecone_api_key', e.target.value)}
                            variant="glass"
                            className="w-full"
                            placeholder="pcsk_..."
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Pinecone API açarınız
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Host URL <span className="text-gray-400">(opsiyonel)</span>
                        </label>
                        <TextInput
                            type="text"
                            value={data.pinecone_host || ''}
                            onChange={e => setData('pinecone_host', e.target.value)}
                            variant="glass"
                            className="w-full font-mono text-sm"
                            placeholder="https://your-index-xxxx.svc.pinecone.io"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            💡 <strong>Təklif:</strong> Pinecone konsolundan tam host URL-ni kopyalayıb buraya yapışdırın
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            Boş qoyulsam, Environment və Index Name-dən avtomatik qurulacaq
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Environment <span className="text-gray-400">(opsiyonel)</span>
                            </label>
                            <TextInput
                                type="text"
                                value={data.pinecone_environment || ''}
                                onChange={e => setData('pinecone_environment', e.target.value)}
                                variant="glass"
                                className="w-full"
                                placeholder="us-east-1-gcp"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Host URL boş olarsa istifadə olunacaq
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Index Name <span className="text-gray-400">(opsiyonel)</span>
                            </label>
                            <TextInput
                                type="text"
                                value={data.pinecone_index_name || 'chatbot-knowledge'}
                                onChange={e => setData('pinecone_index_name', e.target.value)}
                                variant="glass"
                                className="w-full"
                                placeholder="chatbot-knowledge"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Host URL boş olarsa istifadə olunacaq
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400 dark:border-amber-600 rounded">
                        <div className="flex items-start gap-2">
                            <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">İki Üsul:</p>
                                <ul className="text-xs text-amber-700 dark:text-amber-300 mt-1 space-y-1 ml-4 list-disc">
                                    <li><strong>Üsul 1 (Asan):</strong> Pinecone konsolundan tam Host URL kopyalayın və "Host URL" sahəsinə yapışdırın</li>
                                    <li><strong>Üsul 2 (Əl ilə):</strong> Host URL boş qoyun, Environment və Index Name yazın (avtomatik qurulacaq)</li>
                                </ul>
                                <p className="text-xs text-amber-800 dark:text-amber-200 mt-2 font-mono bg-white/50 dark:bg-gray-800/50 p-2 rounded">
                                    Nümunə: https://chatbot-knowledge-abc123.svc.us-east-1-gcp.pinecone.io
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Test Connection Button */}
                    <div className="flex items-center gap-3 pt-2">
                        <button
                            type="button"
                            onClick={savePineconeSettings}
                            disabled={savingPinecone}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
                        >
                            {savingPinecone ? (
                                <>
                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Yadda saxlanır...
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Pinecone Parametrlərini Saxla
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={testPineconeConnection}
                            disabled={testing.pinecone || !data.pinecone_api_key || (!data.pinecone_host && !data.pinecone_environment)}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
                        >
                            {testing.pinecone ? (
                                <>
                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Yoxlanılır...
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Bağlantını Yoxla
                                </>
                            )}
                        </button>

                        {saveResult && (
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                                saveResult.success
                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                            }`}>
                                {saveResult.success ? 'ℹ️' : '❌'} {saveResult.message}
                            </div>
                        )}

                        {testResults.pinecone && (
                            <div className={`flex flex-col gap-1 px-3 py-2 rounded-lg ${
                                testResults.pinecone.success 
                                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' 
                                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                            }`}>
                                <div>{testResults.pinecone.success ? '✅' : '❌'} {testResults.pinecone.message}</div>
                                {testResults.pinecone.base_url && (
                                    <div className="text-xs opacity-80 font-mono">Base URL: {testResults.pinecone.base_url}</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* RAG Strict Mode Controls */}
            <div className="backdrop-blur bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-xl border border-red-200 dark:border-red-600 p-6">
                <h3 className="text-lg font-semibold text-red-700 dark:text-red-300 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    RAG Strict Mode - Cavab Məhdudiyyətləri
                </h3>

                <div className="space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 dark:border-blue-500 p-4 mb-4">
                        <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                            💡 Bu ayarlar AI-nin cavab verərkən knowledge base-dəki məlumatlara necə riayət edəcəyini müəyyən edir.
                        </p>
                    </div>

                    {/* RAG Strict Mode Toggle */}
                    <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                        <label className="flex items-start space-x-3">
                            <input
                                type="checkbox"
                                checked={data.rag_strict_mode}
                                onChange={e => setData('rag_strict_mode', e.target.checked)}
                                className="mt-1 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                            />
                            <div className="flex-1">
                                <span className="text-sm font-bold text-orange-700 dark:text-orange-300 flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.634 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                    RAG STRICT MODE
                                </span>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                    AI yalnız knowledge base-dəki məlumatlardan istifadə edərək cavab verəcək.
                                    Kontekstdən kənara çıxmağa məhdudiyyət qoyulur.
                                </p>
                                <div className="mt-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded text-xs">
                                    <p className="text-orange-700 dark:text-orange-300">
                                        <strong>Aktiv olduqda:</strong> AI konteksti əsas götürər, amma öz sözləri ilə izah edə bilər.
                                    </p>
                                </div>
                            </div>
                        </label>
                    </div>

                    {/* RAG Super Strict Mode Toggle */}
                    <div className="border-2 border-red-300 dark:border-red-600 rounded-lg p-4 bg-red-50/50 dark:bg-red-900/10">
                        <label className="flex items-start space-x-3">
                            <input
                                type="checkbox"
                                checked={data.rag_super_strict_mode}
                                onChange={e => setData('rag_super_strict_mode', e.target.checked)}
                                disabled={!data.rag_strict_mode}
                                className="mt-1 rounded border-gray-300 text-red-600 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <div className="flex-1">
                                <span className="text-sm font-bold text-red-800 dark:text-red-300 flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    RAG SUPER STRICT MODE (ULTRA-STRICT)
                                </span>
                                <p className="text-xs text-red-700 dark:text-red-400 mt-1 font-medium">
                                    ⚠️ ƏN SƏRT REJİM: AI YALNIZ kontekstdən HƏRF-HƏRF kopyalaya bilər. 
                                    Heç bir dəyişiklik, yenidən yazma və ya yozma QADAĞANDIR!
                                </p>
                                <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/30 rounded text-xs border border-red-300 dark:border-red-700">
                                    <p className="text-red-800 dark:text-red-300 font-semibold mb-1">⛔ QADAĞALAR:</p>
                                    <ul className="list-disc list-inside space-y-0.5 text-red-700 dark:text-red-400">
                                        <li>Cümlələri yenidən yazmaq QADAĞAN</li>
                                        <li>Öz sözləri ilə izah etmək QADAĞAN</li>
                                        <li>Kontekstdə olmayan məlumat əlavə etmək QADAĞAN</li>
                                    </ul>
                                    <p className="text-red-800 dark:text-red-300 mt-2">
                                        <strong>NƏTİCƏ:</strong> AI tapılmış məlumatı olduğu kimi kopyalayacaq, YAXUD "məlumat yoxdur" cavabı verəcək.
                                    </p>
                                </div>
                                {!data.rag_strict_mode && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">
                                        💡 Bu seçimi aktivləşdirmək üçün əvvəlcə "RAG Strict Mode" aktivləşdirin.
                                    </p>
                                )}
                            </div>
                        </label>
                    </div>

                    {/* Mode Comparison */}
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">📊 REJİMLƏRİN MÜQAYISƏSI:</p>
                        <div className="space-y-2 text-xs">
                            <div className="flex items-start gap-2">
                                <span className="flex-shrink-0 w-4 h-4 rounded-full bg-green-500 mt-0.5"></span>
                                <div>
                                    <p className="font-semibold text-gray-700 dark:text-gray-300">Normal Mode (Hər ikisi deaktiv):</p>
                                    <p className="text-gray-600 dark:text-gray-400">AI konteksti istifadə edər, amma lazım olduqda öz biliyini də əlavə edə bilər.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="flex-shrink-0 w-4 h-4 rounded-full bg-orange-500 mt-0.5"></span>
                                <div>
                                    <p className="font-semibold text-gray-700 dark:text-gray-300">Strict Mode (Yalnız Strict aktiv):</p>
                                    <p className="text-gray-600 dark:text-gray-400">AI konteksti əsas götürər və öz sözləri ilə izah edər. Daha rahat oxunur. <strong>✅ TÖVSİYƏ EDİLİR</strong></p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="flex-shrink-0 w-4 h-4 rounded-full bg-red-600 mt-0.5"></span>
                                <div>
                                    <p className="font-semibold text-gray-700 dark:text-gray-300">Super Strict Mode (Hər ikisi aktiv):</p>
                                    <p className="text-gray-600 dark:text-gray-400">AI YALNIZ hərf-hərf kopyalayar. Çox sərt, bəzən "məlumat yoxdur" cavabı verə bilər.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* RAG Parameters */}
            <div className="backdrop-blur bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-600 p-6">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                    RAG Parametrləri
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Chunk Size
                        </label>
                        <TextInput
                            type="number"
                            value={data.rag_chunk_size || '1024'}
                            onChange={e => setData('rag_chunk_size', e.target.value)}
                            variant="glass"
                            className="w-full"
                            min="256"
                            max="4096"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Mətn hissəsinin ölçüsü (256-4096)
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Chunk Overlap
                        </label>
                        <TextInput
                            type="number"
                            value={data.rag_chunk_overlap || '200'}
                            onChange={e => setData('rag_chunk_overlap', e.target.value)}
                            variant="glass"
                            className="w-full"
                            min="0"
                            max="512"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Hissələr arası üst-üstə düşmə (0-512)
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Top K Results
                        </label>
                        <TextInput
                            type="number"
                            value={data.rag_top_k || '5'}
                            onChange={e => setData('rag_top_k', e.target.value)}
                            variant="glass"
                            className="w-full"
                            min="1"
                            max="20"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Axtarış nəticə sayı (1-20)
                        </p>
                    </div>
                </div>
            </div>

            {/* System Test */}
            <div className="backdrop-blur bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-600 p-6">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Sistem Yoxlaması
                </h3>

                <button
                    type="button"
                    onClick={testRAGSystem}
                    disabled={testing.system}
                    className="w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2"
                >
                    {testing.system ? (
                        <>
                            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Sistem yoxlanılır...
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Bütün Sistemi Yoxla
                        </>
                    )}
                </button>

                {testResults.system && (
                    <div className="mt-4 space-y-3">
                        <div className={`p-4 rounded-lg border ${
                            testResults.system.results?.overall?.status === 'healthy'
                                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                        }`}>
                            <p className="font-semibold text-gray-800 dark:text-gray-200">
                                {testResults.system.results?.overall?.status === 'healthy' ? '✅' : '❌'} {testResults.system.results?.overall?.message}
                            </p>
                        </div>

                        {testResults.system.results && (
                            <div className="grid grid-cols-2 gap-3">
                                <div className={`p-3 rounded-lg border ${
                                    testResults.system.results.embedding_provider?.status === 'connected'
                                        ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                                        : testResults.system.results.embedding_provider?.status === 'not_supported'
                                        ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800'
                                        : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                                }`}>
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {testResults.system.results.embedding_provider?.name || 'Embedding Provider'}
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                        {testResults.system.results.embedding_provider?.message}
                                    </p>
                                    {testResults.system.results.embedding_provider?.model && (
                                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                            Model: {testResults.system.results.embedding_provider.model}
                                        </p>
                                    )}
                                </div>

                                <div className={`p-3 rounded-lg border ${
                                    testResults.system.results.pinecone?.status === 'connected'
                                        ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                                        : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                                }`}>
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Pinecone</p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                        {testResults.system.results.pinecone?.message}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
