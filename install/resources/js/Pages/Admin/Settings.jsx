import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import TextInput from '@/Components/TextInput';
import GlassTextarea from '@/Components/GlassTextarea';
import GlassSelect from '@/Components/GlassSelect';
import { useToast } from '@/Components/ToastProvider';
import { useTheme } from '@/Components/ThemeProvider';
import Icon from '@/Components/Icon';

export default function Settings({ settings }) {
    const toast = useToast();
    const { loadTheme } = useTheme();
    const { data, setData, post, processing, recentlySuccessful } = useForm({
        chatbot_name: settings.chatbot_name || '',
        message_input_limit: settings.message_input_limit || settings.guest_input_limit || '500',
        ai_output_limit: settings.ai_output_limit || settings.guest_output_limit || '1000',
        ai_typing_speed: settings.ai_typing_speed || '50',
        ai_thinking_time: settings.ai_thinking_time || '1000',
        ai_response_type: settings.ai_response_type || 'typewriter', // 'typewriter' or 'instant'
        ai_use_knowledge_base: settings.ai_use_knowledge_base ?? true,
        ai_strict_mode: settings.ai_strict_mode ?? true,
        ai_topic_restrictions: settings.ai_topic_restrictions || '',
        ai_internet_blocked: settings.ai_internet_blocked ?? true,
        ai_external_learning_blocked: settings.ai_external_learning_blocked ?? true,
        ai_super_strict_mode: Boolean(settings.ai_super_strict_mode),
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
        // Chat Background Settings
        chat_background_type: settings.chat_background_type || 'default',
        chat_background_color: settings.chat_background_color || '#f3f4f6',
        chat_background_gradient: settings.chat_background_gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        chat_background_image: settings.chat_background_image || '',
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
            footer_enabled: Boolean(data.footer_enabled)
        };
        
        post('/admin/settings', {
            data: formData,
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

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Site Settings */}
                    <div className="backdrop-blur bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-600 p-6">
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

                                {/* Tabs */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Icon tab */}
                                    <div className="backdrop-blur bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-600 rounded-xl p-4">
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

                                </div>

                            </div>
                        </div>
                    </div>

                    {/* Chatbot Settings */}
                    <div className="backdrop-blur bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-600 p-6">
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


                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Çıxış limiti (AI cavabı, token)
                                    </label>
                                    <TextInput
                                        type="number"
                                        value={data.ai_output_limit}
                                        onChange={e => setData('ai_output_limit', e.target.value)}
                                        variant="glass"
                                        className="w-full"
                                    />
                                </div>
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
                    </div>

                    {/* AI Professional Controls */}
                    <div className="backdrop-blur bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-600 p-6">
                        <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300 flex items-center gap-3">
                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            AI Professional Controls
                        </h2>
                        
                        <div className="space-y-6">
                            <div>
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={data.ai_use_knowledge_base}
                                        onChange={e => setData('ai_use_knowledge_base', e.target.checked)}
                                        className="rounded"
                                    />
                                    <span className="text-sm font-medium text-gray-700">
                                        Bilik Bazaını İstifadə Et
                                    </span>
                                </label>
                                <p className="text-xs text-gray-500 mt-1">
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
                                    <span className="text-sm font-medium text-gray-700">
                                        <span className="text-red-600 font-bold">Strict Mode</span> - Professional Qadağalar
                                    </span>
                                </label>
                                <p className="text-xs text-gray-500 mt-1">
                                    Yalnız dini mövzularda cavab verər, kənara çıxmaz
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Mövzu Məhdudiyyətləri
                                </label>
                                <textarea
                                    value={data.ai_topic_restrictions}
                                    onChange={e => setData('ai_topic_restrictions', e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg h-24"
                                    placeholder="Məsələn:&#10;- Siyasi məsələlərdən qacın&#10;- Yalnız fiqh və əxlaqa fokuslan&#10;- Müasəllə mövzularda ehtiyatlı ol"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Əlavə qadağalar və yönəldirici qərarlar
                                </p>
                            </div>

                            <div className="border-t pt-4">
                                <h3 className="text-lg font-semibold text-red-600 mb-4 flex items-center gap-3">
                                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
                                    </svg>
                                    ADVANCED İZOLASIYA KONTROLLARI
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
                                            <span className="text-sm font-medium text-red-700">
                                                <span className="font-bold">İnternet Əlaqəsini Blokla</span>
                                            </span>
                                        </label>
                                        <p className="text-xs text-gray-500 mt-1">
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
                                            <span className="text-sm font-medium text-red-700">
                                                <span className="font-bold">Xarici Öyrənməni Blokla</span>
                                            </span>
                                        </label>
                                        <p className="text-xs text-gray-500 mt-1">
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
                                            <span className="text-sm font-medium text-red-700 flex items-center gap-2">
                                                <svg className="w-4 h-4 text-red-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                </svg>
                                                <span className="font-bold text-red-800">SUPER STRİCT MODE</span>
                                            </span>
                                        </label>
                                        <p className="text-xs text-red-600 mt-1 font-medium">
                                            Təlimatdan kənara çıxmaq ÜÇÜN QADAĞA! Yalnız admin təlimatları!
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>



                    {/* Chat Background Settings */}
                    <div className="backdrop-blur bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-600 p-6">
                        <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300 flex items-center gap-3">
                            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Çatbot Arxa Fon Parametrlərı
                        </h2>
                        
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                    Arxa Fon Növü
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <label className={`cursor-pointer border-2 rounded-lg p-4 text-center transition-all ${
                                        data.chat_background_type === 'default' 
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                                    }`}>
                                        <input
                                            type="radio"
                                            name="chat_background_type"
                                            value="default"
                                            checked={data.chat_background_type === 'default'}
                                            onChange={e => setData('chat_background_type', e.target.value)}
                                            className="sr-only"
                                        />
                                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Defolt</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">Sistem defolt fonunu istifadə et</div>
                                    </label>
                                    
                                    <label className={`cursor-pointer border-2 rounded-lg p-4 text-center transition-all ${
                                        data.chat_background_type === 'solid' 
                                            ? 'border-blue-500 bg-blue-50' 
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}>
                                        <input
                                            type="radio"
                                            name="chat_background_type"
                                            value="solid"
                                            checked={data.chat_background_type === 'solid'}
                                            onChange={e => setData('chat_background_type', e.target.value)}
                                            className="sr-only"
                                        />
                                        <div className="text-sm font-medium mb-2">Solid Rəng</div>
                                        <div className="text-xs text-gray-500">Tək rəng istifadə et</div>
                                    </label>
                                    
                                    <label className={`cursor-pointer border-2 rounded-lg p-4 text-center transition-all ${
                                        data.chat_background_type === 'gradient' 
                                            ? 'border-blue-500 bg-blue-50' 
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}>
                                        <input
                                            type="radio"
                                            name="chat_background_type"
                                            value="gradient"
                                            checked={data.chat_background_type === 'gradient'}
                                            onChange={e => setData('chat_background_type', e.target.value)}
                                            className="sr-only"
                                        />
                                        <div className="text-sm font-medium mb-2">Gradient</div>
                                        <div className="text-xs text-gray-500">Keçici rəng istifadə et</div>
                                    </label>
                                    
                                    <label className={`cursor-pointer border-2 rounded-lg p-4 text-center transition-all ${
                                        data.chat_background_type === 'image' 
                                            ? 'border-blue-500 bg-blue-50' 
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}>
                                        <input
                                            type="radio"
                                            name="chat_background_type"
                                            value="image"
                                            checked={data.chat_background_type === 'image'}
                                            onChange={e => setData('chat_background_type', e.target.value)}
                                            className="sr-only"
                                        />
                                        <div className="text-sm font-medium mb-2">Şəkil</div>
                                        <div className="text-xs text-gray-500">Xüsusi şəkil yükləyin</div>
                                    </label>
                                </div>
                            </div>
                            
                            {/* Solid Color Settings */}
                            {data.chat_background_type === 'solid' && (
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Solid Rəng
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="color"
                                            value={data.chat_background_color}
                                            onChange={e => setData('chat_background_color', e.target.value)}
                                            className="w-16 h-12 border-2 border-gray-300 rounded-lg cursor-pointer"
                                        />
                                        <TextInput
                                            type="text"
                                            value={data.chat_background_color}
                                            onChange={e => setData('chat_background_color', e.target.value)}
                                            variant="glass"
                                            className="flex-1"
                                            placeholder="#f3f4f6"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">
                                        Çatbot arxa fonunda istifadə ediləcək solid rəng
                                    </p>
                                </div>
                            )}
                            
                            {/* Gradient Settings */}
                            {data.chat_background_type === 'gradient' && (
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Gradient CSS
                                    </label>
                                    <GlassTextarea
                                        value={data.chat_background_gradient}
                                        onChange={e => setData('chat_background_gradient', e.target.value)}
                                        className="w-full h-20 font-mono text-sm"
                                        placeholder="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                                    />
                                    <p className="text-xs text-gray-500 mt-2">
                                        CSS gradient kodu. Nümunə: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
                                    </p>
                                    
                                    <div className="mt-4">
                                        <p className="text-sm font-medium text-gray-700 mb-2">Hazır Gradientlər:</p>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                            {[
                                                { name: 'Göy-Bənövşəyi', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
                                                { name: 'Çəhrayı-Narıncı', value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
                                                { name: 'Yaşıl-Mavi', value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
                                                { name: 'Qızıl-Narıncı', value: 'linear-gradient(135deg, #ffa751 0%, #ff6b6b 100%)' },
                                                { name: 'Bənövşəyi-Çəhrayı', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
                                                { name: 'Tünd Mavi', value: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)' }
                                            ].map((gradient, index) => (
                                                <button
                                                    key={index}
                                                    type="button"
                                                    onClick={() => setData('chat_background_gradient', gradient.value)}
                                                    className="text-xs px-2 py-1 border rounded text-left hover:bg-white transition-colors"
                                                    style={{ background: gradient.value }}
                                                >
                                                    <span className="text-white font-medium shadow-sm">
                                                        {gradient.name}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {/* Image Upload Settings */}
                            {data.chat_background_type === 'image' && (
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Arxa Fon Şəkli
                                    </label>
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        <div className="mt-4">
                                            <label htmlFor="background-image" className="cursor-pointer">
                                                <span className="mt-2 block text-sm font-medium text-gray-900">
                                                    Şəkil yükləyin
                                                </span>
                                                <span className="mt-1 block text-sm text-gray-500">
                                                    PNG, JPG, GIF (Maksimum 400KB)
                                                </span>
                                                <input
                                                    id="background-image"
                                                    name="background-image"
                                                    type="file"
                                                    accept="image/*"
                                                    className="sr-only"
                                                    onChange={(e) => {
                                                        const file = e.target.files[0];
                                                        if (file && file.size > 400 * 1024) {
                                                            toast.error('Şəkil ölçüsü 400KB-dan böyük ola bilməz!');
                                                            return;
                                                        }
                                                        
                                                        if (file) {
                                                            const formData = new FormData();
                                                            formData.append('image', file);
                                                            
                                                            toast.info('Şəkil yüklənir...');
                                                            
                                                            fetch('/admin/upload/background-image', {
                                                                method: 'POST',
                                                                body: formData,
                                                                headers: {
                                                                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                                                                }
                                                            })
                                                            .then(async response => {
                                                                const text = await response.text();
                                                                try {
                                                                    const data = JSON.parse(text);
                                                                    if (data.success) {
                                                                        setData('chat_background_image', data.url);
                                                                        setData('chat_background_type', 'image');
                                                                        toast.success(data.message);
                                                                    } else {
                                                                        toast.error(data.message || 'Şəkil yükləmə xətası!');
                                                                    }
                                                                } catch (e) {
                                                                    console.error('JSON Parse Error:', e);
                                                                    console.error('Response text:', text);
                                                                    toast.error('Server xətası! JSON parse uğursuz oldu.');
                                                                }
                                                            })
                                                            .catch(error => {
                                                                console.error('Upload error:', error);
                                                                toast.error('Şəkil yükləmə xətası: ' + error.message);
                                                            });
                                                        }
                                                    }}
                                                />
                                            </label>
                                        </div>
                                    </div>
                                    
                                    {data.chat_background_image && (
                                        <div className="mt-4">
                                            <p className="text-sm font-medium text-gray-700 mb-2">Cari Şəkil:</p>
                                            <div className="relative inline-block">
                                                <img
                                                    src={data.chat_background_image}
                                                    alt="Background"
                                                    className="w-32 h-20 object-cover rounded border"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        fetch('/admin/upload/background-image', {
                                                            method: 'DELETE',
                                                            headers: {
                                                                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                                                                'Content-Type': 'application/json'
                                                            }
                                                        })
                                                        .then(async response => {
                                                            const text = await response.text();
                                                            try {
                                                                const data = JSON.parse(text);
                                                                if (data.success) {
                                                                    setData('chat_background_image', '');
                                                                    setData('chat_background_type', 'default');
                                                                    toast.success(data.message);
                                                                } else {
                                                                    toast.error(data.message || 'Şəkil silmə xətası!');
                                                                }
                                                            } catch (e) {
                                                                console.error('JSON Parse Error:', e);
                                                                console.error('Response text:', text);
                                                                toast.error('Server xətası! JSON parse uğursuz oldu.');
                                                            }
                                                        })
                                                        .catch(error => {
                                                            console.error('Delete error:', error);
                                                            toast.error('Şəkil silmə xətası: ' + error.message);
                                                        });
                                                    }}
                                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    
                                    <p className="text-xs text-gray-500 mt-3">
                                        Şəkil avtomatik olaraq ölçüləndiriləcək və çatbot səhifəsinin tam arxa fonunu tutacaq.
                                    </p>
                                </div>
                            )}
                            
                            {/* Preview */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-sm font-medium text-gray-700 mb-3">Önizləmə:</p>
                                <div 
                                    className="w-full h-32 rounded-lg border-2 border-gray-200 flex items-center justify-center text-white font-medium"
                                    style={{
                                        background: data.chat_background_type === 'default' 
                                            ? 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)' 
                                            : data.chat_background_type === 'solid'
                                            ? data.chat_background_color
                                            : data.chat_background_type === 'gradient'
                                            ? data.chat_background_gradient
                                            : data.chat_background_image 
                                            ? `url(${data.chat_background_image}) center/cover`
                                            : '#f3f4f6'
                                    }}
                                >
                                    <span className="bg-black/20 px-3 py-1 rounded text-sm backdrop-blur-sm">
                                        Çatbot Arxa Fon Nümunəsi
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Footer Settings */}
                    <div className="backdrop-blur bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-600 p-6">
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
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium"
                        >
                            Parametri Yadda Saxla
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}