import { Head } from '@inertiajs/react';
import UserLayout from '@/Layouts/UserLayout';

export default function Contact({ contact = {}, auth, settings = {}, footerSettings = {} }) {
  const title = contact.title || 'Əlaqə';
  const content = contact.content || '';
  const email = contact.email || '';

  return (
    <UserLayout auth={auth} settings={settings} footerSettings={footerSettings}>
      <Head title={title} />
      <section className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl">
            <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
                {title}
              </h1>
              {content && (
                <div className="prose prose-sm sm:prose md:prose-lg dark:prose-invert max-w-none text-gray-800 dark:text-gray-100">
                  <div dangerouslySetInnerHTML={{ __html: content }} />
                </div>
              )}
              {email && (
                <div className="mt-4">
                  <a href={`mailto:${email}`} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-90"><path d="M4 4h16v16H4z" fill="none"/><path d="M22 6l-10 7L2 6"/></svg>
                    E-poçt: {email}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </UserLayout>
  );
}
