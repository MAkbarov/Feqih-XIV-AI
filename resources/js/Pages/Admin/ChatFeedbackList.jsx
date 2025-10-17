import { Head, Link, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import Icon from '@/Components/Icon';
import { useMemo } from 'react';

export default function ChatFeedbackList({ feedback, filter, stats }) {
  const { url } = usePage().props;
  const activeType = filter?.type || 'all';

  const tabs = useMemo(() => ([
    { key: 'all', label: 'Hamısı', count: stats.total_feedback, color: 'text-gray-700 dark:text-gray-200' },
    { key: 'like', label: 'Bəyənilən', count: stats.likes, color: 'text-green-600 dark:text-green-300' },
    { key: 'dislike', label: 'Bəyənilməyən', count: stats.dislikes, color: 'text-red-600 dark:text-red-300' },
    { key: 'report', label: 'Bildirilən', count: stats.reports, color: 'text-orange-600 dark:text-orange-300' },
  ]), [stats]);

  const makeUrl = (type, page = 1) => `/admin/chat-analytics/feedback?${new URLSearchParams({ type: type === 'all' ? '' : type, page }).toString()}`.replace(/%3D/g,'=');

  return (
    <AdminLayout>
      <Head title="Çat Feedback Siyahısı" />

      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <Icon name="clipboard" size={28} color="#6366f1" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Çat Feedback Siyahısı</h1>
          </div>
          <Link
            href="/admin/chat-analytics"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-white text-sm font-medium bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
          >
            <Icon name="chart" size={16} color="#fff" /> Analitikaya qayıt
          </Link>
        </div>

        {/* Tabs / Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-2 mb-4">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {tabs.map(t => (
              <Link
                key={t.key}
                href={makeUrl(t.key, 1)}
                className={`shrink-0 px-3 py-2 rounded-full text-sm font-medium inline-flex items-center gap-2 transition-all ${
                  activeType === t.key
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                    : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                {t.key === 'like' && <Icon name="heart" size={16} color="#16a34a" />}
                {t.key === 'dislike' && <Icon name="close" size={16} color="#dc2626" />}
                {t.key === 'report' && <Icon name="warning" size={16} color="#ea580c" />}
                {t.key === 'all' && <Icon name="inbox" size={16} color="#6b7280" />}
                <span>{t.label}</span>
                <span className={`ml-1 px-2 py-0.5 rounded-full text-[11px] ${t.color} bg-gray-100 dark:bg-gray-700`}>{t.count}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="hidden md:grid grid-cols-12 gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400">
            <div className="col-span-2">Tarix</div>
            <div className="col-span-2">İstifadəçi</div>
            <div className="col-span-2">Tip</div>
            <div className="col-span-5">Mesaj</div>
            <div className="col-span-1 text-right">IP</div>
          </div>
          <div>
            {(feedback?.data?.length ?? 0) === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                Heç bir məlumat yoxdur.
              </div>
            ) : feedback.data.map(item => (
              <div key={item.id} className="border-b border-gray-100 dark:border-gray-700 px-4 py-3">
                <div className="grid md:grid-cols-12 gap-3">
                  <div className="md:col-span-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <Icon name="calendar" size={14} /> {item.created_at}
                  </div>
                  <div className="md:col-span-2">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.user_name || 'Anonim'}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{item.user_type === 'guest' ? 'Qonaq' : 'İstifadəçi'}</div>
                  </div>
                  <div className="md:col-span-2">
                    {item.feedback_type === 'like' && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                        <Icon name="heart" size={12} /> Bəyənilib
                      </span>
                    )}
                    {item.feedback_type === 'dislike' && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                        <Icon name="close" size={12} /> Bəyənilməyib
                      </span>
                    )}
                    {item.feedback_type === 'report' && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
                        <Icon name="warning" size={12} /> Bildirilib
                      </span>
                    )}
                  </div>
                  <div className="md:col-span-5">
                    <div className="text-sm text-gray-800 dark:text-gray-200 break-words">{item.message_content}</div>
                    {item.user_comment && (
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/40 p-2 rounded">
                        <Icon name="edit" size={12} /> {item.user_comment}
                      </div>
                    )}
                  </div>
                  <div className="md:col-span-1 text-right text-xs text-gray-500 dark:text-gray-400 break-all">{item.ip_address || '-'}</div>
                </div>
              </div>
            ))}
          </div>
          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
            <div>
              {(() => {
                const current = feedback.current_page ?? feedback.meta?.current_page ?? 1;
                const last = feedback.last_page ?? feedback.meta?.last_page ?? 1;
                const total = feedback.total ?? feedback.meta?.total ?? feedback.data?.length ?? 0;
                return (<>
                  Səhifə {current} / {last} (cəm {total})
                </>);
              })()}
            </div>
            <div className="flex items-center gap-2">
              {(() => {
                const current = feedback.current_page ?? feedback.meta?.current_page ?? 1;
                const last = feedback.last_page ?? feedback.meta?.last_page ?? 1;
                return (
                  <>
                    <Link
                      href={makeUrl(activeType, Math.max(1, current - 1))}
                      className={`px-3 py-1 rounded-lg border ${current === 1 ? 'opacity-50 pointer-events-none' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'} border-gray-200 dark:border-gray-700`}
                    >
                      <Icon name="arrow_left" size={14} />
                    </Link>
                    <Link
                      href={makeUrl(activeType, Math.min(last, current + 1))}
                      className={`px-3 py-1 rounded-lg border ${current === last ? 'opacity-50 pointer-events-none' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'} border-gray-200 dark:border-gray-700`}
                    >
                      <Icon name="arrow_right" size={14} />
                    </Link>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
