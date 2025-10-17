import { Head, Link, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import Icon from '@/Components/Icon';
import React from 'react';

export default function Notifications({ notifications = [], page = 1, pages = 1, per_page = 20, total = 0 }) {
  return (
    <AdminLayout>
      <Head title="Bildirişlər" />
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">Bildirişlər</h1>
          <button
            onClick={async () => {
              if (!confirm('Bütün bildirişləri silmək istədiyinizə əminsiniz?')) return;
              try {
                await fetch('/admin/notifications/delete-all', { method: 'POST', headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content') } });
                window.location.reload();
              } catch {}
            }}
            className="px-3 py-2 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600"
          >
            Hamısını sil
          </button>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl">
          {notifications.length === 0 ? (
            <div className="p-6 text-gray-500 dark:text-gray-400">Bildiriş yoxdur</div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {notifications.map(n => (
                <li key={n.id} className="p-4 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                    <Icon name={n.icon || 'info'} size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{n.title}</div>
                      <div className="flex items-center gap-3">
                        <div className="text-xs text-gray-400">{n.created_at ? new Date(n.created_at).toLocaleString('az-AZ') : ''}</div>
                        <button
                          onClick={async () => {
                            if (!confirm('Bu bildirişi silmək istədiyinizə əminsiniz?')) return;
                            try {
                              await fetch(`/admin/notifications/${n.id}`, {
                                method: 'DELETE',
                                headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content') }
                              });
                              window.location.reload();
                            } catch {}
                          }}
                          className="text-xs px-2 py-1 rounded bg-red-500 text-white hover:bg-red-600"
                        >
                          Sil
                        </button>
                      </div>
                    </div>
                    {n.message && <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">{n.message}</div>}
                    {n.link && <a href={n.link} className="text-xs text-emerald-600 hover:text-emerald-700">Keçid</a>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        {/* Pagination */}
        {pages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Səhifə {page} / {pages} — Ümumi: {total}
            </div>
            <div className="flex items-center gap-2">
              {page > 1 && (
                <Link href={`/admin/notifications?page=${page - 1}`} className="px-3 py-1.5 rounded border text-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">
                  Əvvəlki
                </Link>
              )}
              {page < pages && (
                <Link href={`/admin/notifications?page=${page + 1}`} className="px-3 py-1.5 rounded border text-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">
                  Növbəti
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
