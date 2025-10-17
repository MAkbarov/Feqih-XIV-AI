import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import TextInput from '@/Components/TextInput';
import GlassTextarea from '@/Components/GlassTextarea';
import { useToast } from '@/Components/ToastProvider';

export default function ContactSettings({ contact }) {
  const toast = useToast();
  const { data, setData, post, processing } = useForm({
    contact_title: contact?.contact_title || 'Əlaqə',
    contact_content: contact?.contact_content || '',
    contact_email: contact?.contact_email || '',
    admin_email: contact?.admin_email || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    post('/admin/contact-settings', {
      onSuccess: () => toast.success('Yadda saxlandı!'),
      onError: () => toast.error('Yeniləmə xətası!')
    });
  };

  return (
    <AdminLayout>
      <Head title="Əlaqə Parametrləri" />
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">Əlaqə Parametrləri</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="backdrop-blur bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-600 p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Səhifə Başlığı</label>
              <TextInput value={data.contact_title} onChange={e=>setData('contact_title', e.target.value)} variant="glass" className="w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Səhifə Məzmunu (HTML dəstəklənir)</label>
              <textarea
                value={data.contact_content}
                onChange={(e)=>setData('contact_content', e.target.value)}
                className="w-full h-72 min-h-56 resize-y px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono text-sm placeholder-gray-400 dark:placeholder-gray-400"
                placeholder="HTML yazın: \u003cp\u003eƏlaqə barədə məlumat...\u003c/p\u003e\nLink: \u003ca href='https://example.com'\u003eKeçid\u003c/a\u003e"
                spellCheck={false}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">HTML teqləri və linklər dəstəklənir. Xahiş edirik təhlükəsiz məzmun daxil edin.</p>
            </div>
          </div>

          <div className="backdrop-blur bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-600 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">E-poçt Parametrləri</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Əlaqə E-poçtu</label>
              <TextInput type="email" value={data.contact_email} onChange={e=>setData('contact_email', e.target.value)} variant="glass" className="w-full" placeholder="contact@example.com" />
              <p className="text-xs text-gray-500 mt-1">Əlaqə səhifəsində göstəriləcək e-poçt ünvanı</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Admin Bildiriş E-poçtu</label>
              <TextInput type="email" value={data.admin_email} onChange={e=>setData('admin_email', e.target.value)} variant="glass" className="w-full" placeholder="admin@example.com" />
              <p className="text-xs text-gray-500 mt-1">Feedback və sistem xətaları bu ünvana gələcək</p>
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={processing} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg disabled:opacity-50">{processing ? 'Yadda saxlanılır...' : 'Yadda saxla'}</button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
