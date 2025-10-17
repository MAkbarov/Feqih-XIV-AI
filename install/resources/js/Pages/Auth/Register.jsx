import { Head, Link, useForm } from '@inertiajs/react';
import { useTheme } from '@/Components/ThemeProvider';
import Icon from '@/Components/Icon';

export default function Register({ theme = {}, settings = {} }) {
    const { isDarkMode, toggleDarkMode } = useTheme();
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        terms_accepted: false,
    });

    // Apply theme colors
    const primaryColor = theme?.primary_color;
    const secondaryColor = theme?.secondary_color;
    const accentColor = theme?.accent_color;
    const bgGradient = theme?.background_gradient;
    const siteName = settings.site_name || 'AI Chatbot Platform';

    const submit = (e) => {
        e.preventDefault();

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <div className={`min-h-screen flex items-center justify-center p-4 ${isDarkMode ? 'dark' : ''}`} style={{ background: isDarkMode ? 'linear-gradient(135deg, #1f2937 0%, #111827 100%)' : bgGradient }}>
            <Head title={`Qeydiyyat - ${siteName}`} />

            {/* Home button */}
            <div className="fixed top-2 left-2 sm:top-4 sm:left-4 z-50">
                <Link href="/" className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow hover:shadow-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200">
                    <Icon name="home" size={16} />
                    <span className="hidden sm:inline text-sm">Ana səhifə</span>
                </Link>
            </div>

            {/* Dark mode toggle - positioned higher for mobile visibility */}
            <div className="fixed top-2 right-2 sm:top-4 sm:right-4 z-50">
                <div className="flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full px-3 py-2 shadow-lg">
                    <Icon name="sun" size={14} color={!isDarkMode ? '#fbbf24' : '#9ca3af'} />
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={isDarkMode} 
                            onChange={() => toggleDarkMode()}
                            className="sr-only peer" 
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                    <Icon name="moon" size={14} color={isDarkMode ? '#60a5fa' : '#9ca3af'} />
                </div>
            </div>

            <div className="w-full max-w-md">
                <div className="backdrop-blur bg-white/90 dark:bg-gray-800/90 border border-white/20 dark:border-gray-700/30 rounded-2xl shadow-xl p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">{siteName}</h1>
                        <p className="text-gray-600 dark:text-gray-400">Yeni hesab yaratın</p>
                    </div>

                    <form onSubmit={submit} className="space-y-6">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                Ad Soyad
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                value={data.name}
className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent transition-all bg-white text-gray-900 placeholder-gray-400 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 dark:border-gray-600"
                                style={{ '--tw-ring-color': primaryColor }}
                                autoComplete="name"
                                autoFocus
                                onChange={(e) => setData('name', e.target.value)}
                                required
                            />
                            {errors.name && <p className="mt-2 text-sm text-red-600">{errors.name}</p>}
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent transition-all bg-white text-gray-900 placeholder-gray-400 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 dark:border-gray-600"
                                style={{ '--tw-ring-color': primaryColor }}
                                autoComplete="username"
                                onChange={(e) => setData('email', e.target.value)}
                                required
                            />
                            {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email}</p>}
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Şifrə
                            </label>
                            <input
                                id="password"
                                type="password"
                                name="password"
                                value={data.password}
className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent transition-all bg-white text-gray-900 placeholder-gray-400 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 dark:border-gray-600"
                                style={{ '--tw-ring-color': primaryColor }}
                                autoComplete="new-password"
                                onChange={(e) => setData('password', e.target.value)}
                                required
                            />
                            {errors.password && <p className="mt-2 text-sm text-red-600">{errors.password}</p>}
                        </div>

                        <div>
                            <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700 mb-2">
                                Şifrəni təkrarla
                            </label>
                            <input
                                id="password_confirmation"
                                type="password"
                                name="password_confirmation"
                                value={data.password_confirmation}
className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent transition-all bg-white text-gray-900 placeholder-gray-400 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 dark:border-gray-600"
                                style={{ '--tw-ring-color': primaryColor }}
                                autoComplete="new-password"
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                required
                            />
                            {errors.password_confirmation && <p className="mt-2 text-sm text-red-600">{errors.password_confirmation}</p>}
                        </div>

                        <div>
                            <label className="flex items-start space-x-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={data.terms_accepted}
                                    onChange={(e) => setData('terms_accepted', e.target.checked)}
                                    className="mt-1 rounded border-gray-300 dark:border-gray-600 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                    required
                                />
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    <span className="text-red-500">*</span> 
                                    <a href="/terms" target="_blank" className="underline hover:text-gray-800 dark:hover:text-gray-200 transition-colors" style={{ color: primaryColor }}>
                                        İstifadə şərtləri
                                    </a>
                                    {' və '}
                                    <a href="/privacy" target="_blank" className="underline hover:text-gray-800 dark:hover:text-gray-200 transition-colors" style={{ color: primaryColor }}>
                                        Məxfilik siyasəti
                                    </a>
                                    ni oxuyub qəbul edirəm
                                </span>
                            </label>
                            {errors.terms_accepted && <p className="mt-2 text-sm text-red-600">{errors.terms_accepted}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full py-3 px-4 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg"
                            style={{ backgroundColor: primaryColor }}
                        >
                            {processing ? 'Qeydiyyat olunur...' : 'Qeydiyyatdan keç'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Artıq hesabınız var?
                            <Link 
                                href={route('login')} 
                                className="ml-1 font-medium hover:underline transition-colors"
                                style={{ color: primaryColor }}
                            >
                                Daxil olun
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
