import { Head, Link, useForm } from '@inertiajs/react';
import { ThemeProvider, useTheme } from '@/Components/ThemeProvider';
import Icon from '@/Components/Icon';
import { useState } from 'react';

function ForgotPasswordContent({ status, theme = {}, settings = {} }) {
    const { isDarkMode, toggleDarkMode } = useTheme();
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    // Apply theme colors
    const primaryColor = theme?.primary_color;
    const secondaryColor = theme?.secondary_color;
    const accentColor = theme?.accent_color;
    const bgGradient = theme?.background_gradient;
    const siteName = settings.site_name || 'AI Assistant';

    const submit = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <div className={`min-h-screen flex items-center justify-center p-4 transition-all duration-300 ${
            isDarkMode ? 'dark' : ''
        }`} style={{ background: isDarkMode ? 'linear-gradient(135deg, #1f2937 0%, #111827 100%)' : bgGradient }}>
            <Head title={`Şifrə bərpası - ${siteName}`} />

            {/* Home button */}
            <div className="fixed top-2 left-2 sm:top-4 sm:left-4 z-50">
                <Link href="/" className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow hover:shadow-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200">
                    <Icon name="home" size={16} />
                    <span className="hidden sm:inline text-sm">Ana səhifə</span>
                </Link>
            </div>

            {/* Dark Mode Toggle */}
            <div className="absolute top-4 right-4">
                <button
                    onClick={toggleDarkMode}
                    className={`p-3 rounded-xl transition-all duration-300 hover:scale-110 ${
                        isDarkMode 
                            ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' 
                            : 'bg-white/20 text-gray-600 hover:bg-white/30'
                    }`}
                    title={isDarkMode ? 'Gündüz rejimi' : 'Gecə rejimi'}
                >
                    <Icon name={isDarkMode ? 'sunny' : 'moon'} size={20} />
                </button>
            </div>

            <div className="w-full max-w-md">
                <div className={`backdrop-blur rounded-2xl shadow-xl p-8 transition-all duration-300 ${
                    isDarkMode 
                        ? 'bg-gray-800/90 border border-gray-700/50 text-white' 
                        : 'bg-white/90 border border-white/20'
                }`}>
                    <div className="text-center mb-8">
                        <h1 className={`text-3xl font-bold mb-2 ${
                            isDarkMode ? 'text-white' : 'text-gray-800'
                        }`}>{siteName}</h1>
                        <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Şifrəni unutdunuz?</p>
                    </div>

                    <div className={`mb-6 text-sm text-center ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                        Email ünvanınızı daxil edin və biz sizə şifrə bərpa linkini göndərəcəyik.
                    </div>

                    {status && (
                        <div className={`mb-6 text-sm font-medium p-3 rounded-lg text-center ${
                            isDarkMode 
                                ? 'text-green-400 bg-green-900/50 border border-green-700' 
                                : 'text-green-600 bg-green-50'
                        }`}>
                            {status}
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-6">
                        <div>
                            <label htmlFor="email" className={`block text-sm font-medium mb-2 ${
                                isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                className={`w-full px-4 py-3 rounded-xl focus:ring-2 focus:border-transparent transition-all ${
                                    isDarkMode 
                                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:bg-gray-600' 
                                        : 'bg-white border-gray-300 text-gray-900'
                                }`}
                                style={{ '--tw-ring-color': primaryColor }}
                                autoFocus
                                onChange={(e) => setData('email', e.target.value)}
                                required
                            />
                            {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full py-3 px-4 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:scale-[1.02]"
                            style={{ backgroundColor: primaryColor }}
                        >
                            {processing ? 'Göndərilir...' : 'Bərpa linki göndər'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <Link 
                            href={route('login')} 
                            className="text-sm font-medium hover:underline transition-colors"
                            style={{ color: primaryColor }}
                        >
                            Geri dön
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ForgotPassword(props) {
    return (
        <ThemeProvider>
            <ForgotPasswordContent {...props} />
        </ThemeProvider>
    );
}
