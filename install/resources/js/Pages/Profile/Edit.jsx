import UserLayout from '@/Layouts/UserLayout';
import { Head } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import { useTheme } from '@/Components/ThemeProvider';

export default function Edit({ mustVerifyEmail, status, auth, settings = {}, footerSettings = {} }) {
    const { theme, isDarkMode } = useTheme();
    const primaryColor = theme?.primary_color;
    const bgGradient = theme?.background_gradient;
    
    return (
        <UserLayout auth={auth} settings={settings} footerSettings={footerSettings}>
            <Head title="Profil" />
            
            <div className="container mx-auto px-6 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Profil Parametrlərı
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Hesab məlumatlarınızı və təhlükəsizlik Parametrlərınızı idarə edin
                    </p>
                </div>
                
                <div className="space-y-6">
                    <div className="backdrop-blur bg-white/90 dark:bg-gray-800/90 border border-white/20 dark:border-gray-700/30 rounded-2xl shadow-xl p-6">
                        <h2 className="text-xl font-semibold mb-6 text-gray-800 dark:text-gray-100">
                            Profil Məlumatları
                        </h2>
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                            className="max-w-xl"
                        />
                    </div>

                    <div className="backdrop-blur bg-white/90 dark:bg-gray-800/90 border border-white/20 dark:border-gray-700/30 rounded-2xl shadow-xl p-6">
                        <h2 className="text-xl font-semibold mb-6 text-gray-800 dark:text-gray-100">
                            Şifrə Yeniləmə
                        </h2>
                        <UpdatePasswordForm className="max-w-xl" />
                    </div>

                    <div className="backdrop-blur bg-white/90 dark:bg-gray-800/90 border border-white/20 dark:border-gray-700/30 rounded-2xl shadow-xl p-6">
                        <h2 className="text-xl font-semibold mb-6 text-red-600 dark:text-red-400">
                            Təhlükəli Bölgə
                        </h2>
                        <DeleteUserForm className="max-w-xl" />
                    </div>
                </div>
            </div>
        </UserLayout>
    );
}
