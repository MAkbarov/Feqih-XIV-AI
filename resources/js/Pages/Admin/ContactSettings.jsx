import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import TextInput from '@/Components/TextInput';
import GlassTextarea from '@/Components/GlassTextarea';
import { useToast } from '@/Components/ToastProvider';
import Icon from '@/Components/Icon';

export default function ContactSettings({ contact }) {
  const toast = useToast();
  const { data, setData, post, processing } = useForm({
    contact_title: contact?.contact_title || 'Əlaqə',
    contact_content: contact?.contact_content || '',
    contact_email: contact?.contact_email || '',
    admin_email: contact?.admin_email || '',
    // Social media settings
    contact_phone: contact?.contact_phone || '',
    contact_phone_enabled: contact?.contact_phone_enabled === '1',
    contact_whatsapp: contact?.contact_whatsapp || '',
    contact_whatsapp_enabled: contact?.contact_whatsapp_enabled === '1',
    contact_tiktok: contact?.contact_tiktok || '',
    contact_tiktok_enabled: contact?.contact_tiktok_enabled === '1',
    contact_instagram: contact?.contact_instagram || '',
    contact_instagram_enabled: contact?.contact_instagram_enabled === '1',
    contact_github: contact?.contact_github || '',
    contact_github_enabled: contact?.contact_github_enabled === '1',
    contact_facebook: contact?.contact_facebook || '',
    contact_facebook_enabled: contact?.contact_facebook_enabled === '1',
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

          {/* Social Media Settings */}
          <div className="backdrop-blur bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-600 p-6 space-y-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <Icon name="share" size={20} className="text-blue-600" />
              Sosial Media Əlaqə Vasitələri
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Hər platforma üçün linklər əlavə edin. Deaktiv edilən linklr contact səhifəsində görünməyəcək.
            </p>
            
            {/* Phone */}
            <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Icon name="phone" size={20} className="text-green-600" />
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Telefon</label>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={data.contact_phone_enabled} 
                    onChange={e => setData('contact_phone_enabled', e.target.checked)}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <TextInput 
                type="tel" 
                value={data.contact_phone} 
                onChange={e => setData('contact_phone', e.target.value)} 
                variant="glass" 
                className="w-full" 
                placeholder="+994 XX XXX XX XX" 
              />
            </div>
            
            {/* WhatsApp */}
            <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Icon name="whatsapp" size={20} className="text-green-500" />
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">WhatsApp</label>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={data.contact_whatsapp_enabled} 
                    onChange={e => setData('contact_whatsapp_enabled', e.target.checked)}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <TextInput 
                type="url" 
                value={data.contact_whatsapp} 
                onChange={e => setData('contact_whatsapp', e.target.value)} 
                variant="glass" 
                className="w-full" 
                placeholder="https://wa.me/994XXXXXXXXX" 
              />
            </div>
            
            {/* TikTok */}
            <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Icon name="tiktok" size={20} className="text-black dark:text-white" />
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">TikTok</label>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={data.contact_tiktok_enabled} 
                    onChange={e => setData('contact_tiktok_enabled', e.target.checked)}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <TextInput 
                type="url" 
                value={data.contact_tiktok} 
                onChange={e => setData('contact_tiktok', e.target.value)} 
                variant="glass" 
                className="w-full" 
                placeholder="https://www.tiktok.com/@username" 
              />
            </div>
            
            {/* Instagram */}
            <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Icon name="instagram" size={20} className="text-pink-500" />
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Instagram</label>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={data.contact_instagram_enabled} 
                    onChange={e => setData('contact_instagram_enabled', e.target.checked)}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <TextInput 
                type="url" 
                value={data.contact_instagram} 
                onChange={e => setData('contact_instagram', e.target.value)} 
                variant="glass" 
                className="w-full" 
                placeholder="https://www.instagram.com/username" 
              />
            </div>
            
            {/* GitHub */}
            <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Icon name="github" size={20} className="text-gray-800 dark:text-gray-200" />
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">GitHub</label>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={data.contact_github_enabled} 
                    onChange={e => setData('contact_github_enabled', e.target.checked)}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <TextInput 
                type="url" 
                value={data.contact_github} 
                onChange={e => setData('contact_github', e.target.value)} 
                variant="glass" 
                className="w-full" 
                placeholder="https://github.com/username" 
              />
            </div>
            
            {/* Facebook */}
            <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Icon name="facebook" size={20} className="text-blue-600" />
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Facebook</label>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={data.contact_facebook_enabled} 
                    onChange={e => setData('contact_facebook_enabled', e.target.checked)}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <TextInput 
                type="url" 
                value={data.contact_facebook} 
                onChange={e => setData('contact_facebook', e.target.value)} 
                variant="glass" 
                className="w-full" 
                placeholder="https://www.facebook.com/username" 
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={processing} className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg disabled:opacity-50 font-medium flex items-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl">
              <Icon name={processing ? 'refresh' : 'save'} size={16} className={processing ? 'animate-spin' : ''} />
              {processing ? 'Yadda saxlanılır...' : 'Yadda saxla'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
