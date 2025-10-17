import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';
import { Link, useForm, usePage } from '@inertiajs/react';
import { useTheme } from '@/Components/ThemeProvider';

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = '',
}) {
    const user = usePage().props.auth.user;
    const { theme } = useTheme();
    const primaryColor = theme?.primary_color;

    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm({
            name: user.name,
            email: user.email,
            email_news_opt_in: Boolean(user.email_news_opt_in ?? false),
        });

    const submit = (e) => {
        e.preventDefault();

        patch(route('profile.update'));
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    Profil Məlumatları
                </h2>

                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Hesabınızın profil məlumatlarını və email ünvanını yeniləyin.
                </p>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-6">
                <div>
                    <InputLabel htmlFor="name" value="Ad" />

                    <TextInput
                        id="name"
                        variant="glass"
                        className="mt-1 block w-full dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        isFocused
                        autoComplete="name"
                    />

                    <InputError className="mt-2" message={errors.name} />
                </div>

                <div>
                    <InputLabel htmlFor="email" value="Email" />

                    <TextInput
                        id="email"
                        type="email"
                        variant="glass"
                        className="mt-1 block w-full dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        required
                        autoComplete="username"
                    />

                    <InputError className="mt-2" message={errors.email} />
                </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div>
                        <p className="mt-2 text-sm text-gray-800 dark:text-gray-200">
                            Your email address is unverified.
                            <Link
                                href={route('verification.send')}
                                method="post"
                                as="button"
                                className="rounded-md text-sm text-gray-600 dark:text-gray-400 underline hover:text-gray-900 dark:hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            >
                                Click here to re-send the verification email.
                            </Link>
                        </p>

                        {status === 'verification-link-sent' && (
                            <div className="mt-2 text-sm font-medium text-green-600">
                                A new verification link has been sent to your
                                email address.
                            </div>
                        )}
                    </div>
                )}

                <div>
                    <label className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            checked={data.email_news_opt_in}
                            onChange={(e) => setData('email_news_opt_in', e.target.checked)}
                            className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">E-poçt ünvanıma xəbər/yeniliklər gəlsin</span>
                    </label>
                </div>

                <div className="flex items-center gap-4 mt-4">
                    <PrimaryButton disabled={processing} style={{ backgroundColor: primaryColor }}>Saxla</PrimaryButton>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Saxlanıldı.
                        </p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
