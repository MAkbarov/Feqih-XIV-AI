import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import Icon from '@/Components/Icon';
import { useToast } from '@/Components/ToastProvider';

export default function TermsAndPrivacy({ terms, privacy, theme, footerSettings = {} }) {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('terms');
  
  const { data: termsData, setData: setTermsData, post: postTerms, processing: processingTerms, errors: termsErrors } = useForm({
    type: 'terms',
    title: terms?.title || 'İstifadə Şərtləri',
    content: terms?.content || ''
  });

  const { data: privacyData, setData: setPrivacyData, post: postPrivacy, processing: processingPrivacy, errors: privacyErrors } = useForm({
    type: 'privacy', 
    title: privacy?.title || 'Məxfilik Siyasəti',
    content: privacy?.content || ''
  });

  const handleSubmit = (type) => {
    if (type === 'terms') {
      postTerms(route('admin.terms-privacy.update'), {
        onSuccess: () => {
          toast.success('İstifadə şərtləri uğurla yeniləndi!');
        },
        onError: () => {
          toast.error('Xəta baş verdi!');
        }
      });
    } else {
      postPrivacy(route('admin.terms-privacy.update'), {
        onSuccess: () => {
          toast.success('Məxfilik siyasəti uğurla yeniləndi!');
        },
        onError: () => {
          toast.error('Xəta baş verdi!');
        }
      });
    }
  };

  return (
    <AdminLayout footerSettings={footerSettings}>
      <Head title="İstifadə Şərtləri və Məxfilik Siyasəti" />

      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            İstifadə Şərtləri və Məxfilik Siyasəti
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            İstifadə şərtləri və məxfilik siyasəti mətnlərini HTML formatında redaktə edə bilərsiniz
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('terms')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === 'terms'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Icon name="shield_check" size={18} />
                  <span>İstifadə Şərtləri</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('privacy')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === 'privacy'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Icon name="activity" size={18} />
                  <span>Məxfilik Siyasəti</span>
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Terms Tab */}
        {activeTab === 'terms' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                İstifadə Şərtləri Redaktəsi
              </h2>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Başlıq
                </label>
                <input
                  type="text"
                  value={termsData.title}
                  onChange={(e) => setTermsData('title', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
                  placeholder="İstifadə Şərtləri"
                />
                {termsErrors.title && (
                  <p className="mt-1 text-sm text-red-600">{termsErrors.title}</p>
                )}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Məzmun (HTML dəstəklənir)
                </label>
                <textarea
                  value={termsData.content}
                  onChange={(e) => setTermsData('content', e.target.value)}
                  rows={15}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors font-mono text-sm"
                  placeholder="<h1>İstifadə Şərtləri</h1><p>Bu AI çatbot platformasından istifadə etməklə...</p>"
                />
                {termsErrors.content && (
                  <p className="mt-1 text-sm text-red-600">{termsErrors.content}</p>
                )}
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  HTML tağları dəstəklənir: &lt;h1&gt;, &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;a&gt;, &lt;br&gt;
                </p>
              </div>

              <div className="flex items-center space-x-4">
                <button
                  onClick={() => handleSubmit('terms')}
                  disabled={processingTerms}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  {processingTerms ? (
                    <>
                      <Icon name="loading" size={16} className="animate-spin" />
                      <span>Yadda saxlanır...</span>
                    </>
                  ) : (
                    <>
                      <Icon name="edit" size={16} />
                      <span>Yadda saxla</span>
                    </>
                  )}
                </button>

                <a
                  href="/terms"
                  target="_blank"
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
                >
                  <Icon name="nav_chat" size={16} />
                  <span>Görüntülə</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Privacy Tab */}
        {activeTab === 'privacy' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Məxfilik Siyasəti Redaktəsi
              </h2>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Başlıq
                </label>
                <input
                  type="text"
                  value={privacyData.title}
                  onChange={(e) => setPrivacyData('title', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
                  placeholder="Məxfilik Siyasəti"
                />
                {privacyErrors.title && (
                  <p className="mt-1 text-sm text-red-600">{privacyErrors.title}</p>
                )}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Məzmun (HTML dəstəklənir)
                </label>
                <textarea
                  value={privacyData.content}
                  onChange={(e) => setPrivacyData('content', e.target.value)}
                  rows={15}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors font-mono text-sm"
                  placeholder="<h1>Məxfilik Siyasəti</h1><p>Biz sizin məxfiliyinizə hörmət edirik...</p>"
                />
                {privacyErrors.content && (
                  <p className="mt-1 text-sm text-red-600">{privacyErrors.content}</p>
                )}
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  HTML tağları dəstəklənir: &lt;h1&gt;, &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;a&gt;, &lt;br&gt;
                </p>
              </div>

              <div className="flex items-center space-x-4">
                <button
                  onClick={() => handleSubmit('privacy')}
                  disabled={processingPrivacy}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  {processingPrivacy ? (
                    <>
                      <Icon name="loading" size={16} className="animate-spin" />
                      <span>Yadda saxlanır...</span>
                    </>
                  ) : (
                    <>
                      <Icon name="edit" size={16} />
                      <span>Yadda saxla</span>
                    </>
                  )}
                </button>

                <a
                  href="/privacy"
                  target="_blank"
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
                >
                  <Icon name="nav_chat" size={16} />
                  <span>Görüntülə</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Preview Section */}
        <div className="mt-8 bg-gray-50 dark:bg-gray-900 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            HTML Nümunəsi
          </h3>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border">
            <div 
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ 
                __html: activeTab === 'terms' ? termsData.content : privacyData.content 
              }}
            />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}