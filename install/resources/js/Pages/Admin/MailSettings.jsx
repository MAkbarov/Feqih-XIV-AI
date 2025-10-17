import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import TextInput from '@/Components/TextInput';
import { useToast } from '@/Components/ToastProvider';

function BulkEmailForm() {
  const toast = useToast();
  const [sending, setSending] = React.useState(false);
  const [subject, setSubject] = React.useState('');
  const [body, setBody] = React.useState('');

  const sendBulk = async () => {
    if (!subject.trim() || !body.trim()) {
      toast.error('Başlıq və məzmun tələb olunur');
      return;
    }
    try {
      setSending(true);
      const res = await fetch('/admin/mail/bulk-send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
        },
        body: JSON.stringify({ subject, body_html: body })
      });
      const js = await res.json();
      if (res.ok && js.success) {
        toast.success(`Göndərildi: ${js.sent_count}`);
        setSubject('');
        setBody('');
      } else {
        toast.error(js.message || 'Göndərmə xətası');
      }
    } catch (e) {
      toast.error('Şəbəkə xətası');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Başlıq</label>
          <TextInput value={subject} onChange={e=>setSubject(e.target.value)} variant="glass" className="w-full" placeholder="Mövzu" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Məzmun (HTML)</label>
        <textarea
          value={body}
          onChange={(e)=>setBody(e.target.value)}
          rows={12}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
          placeholder="HTML məzmun daxil edin..."
          dir="ltr"
          style={{ direction: 'ltr', unicodeBidi: 'plaintext', textAlign: 'left' }}
        />
      </div>
      <div className="flex justify-end">
        <button type="button" onClick={sendBulk} disabled={sending} className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg disabled:opacity-50">
          {sending ? 'Göndərilir...' : 'Göndər'}
        </button>
      </div>
    </div>
  );
}

export default function MailSettings({ mail }) {
  const toast = useToast();
  const { data, setData, post, processing } = useForm({
    mail_mailer: mail?.mail_mailer || 'smtp',
    mail_host: mail?.mail_host || '',
    mail_port: mail?.mail_port || 587,
    mail_username: mail?.mail_username || '',
    mail_password: mail?.mail_password || '',
    mail_encryption: mail?.mail_encryption || 'tls',
    mail_from_address: mail?.mail_from_address || '',
    mail_from_name: mail?.mail_from_name || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    post('/admin/mail-settings', {
      onSuccess: () => toast.success('E-poçt parametrləri yadda saxlandı!'),
      onError: () => toast.error('Yadda saxlanma xətası!')
    });
  };

  return (
    <AdminLayout>
      <Head title="E-poçt Parametrləri" />
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">E-poçt Parametrləri</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="backdrop-blur bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-600 p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mailer</label>
              <select value={data.mail_mailer} onChange={e=>setData('mail_mailer', e.target.value)} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                <option value="smtp">SMTP</option>
                <option value="log">Log</option>
                <option value="sendmail">Sendmail</option>
                <option value="postmark">Postmark</option>
                <option value="ses">SES</option>
                <option value="resend">Resend</option>
                <option value="failover">Failover</option>
                <option value="roundrobin">Round Robin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Şifrələmə</label>
              <select value={data.mail_encryption} onChange={e=>setData('mail_encryption', e.target.value)} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                <option value="tls">TLS</option>
                <option value="ssl">SSL</option>
                <option value="starttls">STARTTLS</option>
                <option value="none">None</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Host</label>
              <TextInput value={data.mail_host} onChange={e=>setData('mail_host', e.target.value)} variant="glass" className="w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Port</label>
              <TextInput type="number" value={data.mail_port} onChange={e=>setData('mail_port', e.target.value)} variant="glass" className="w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">İstifadəçi adı</label>
              <TextInput value={data.mail_username} onChange={e=>setData('mail_username', e.target.value)} variant="glass" className="w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Şifrə</label>
              <TextInput type="password" value={data.mail_password} onChange={e=>setData('mail_password', e.target.value)} variant="glass" className="w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Göndərən ünvan</label>
              <TextInput type="email" value={data.mail_from_address} onChange={e=>setData('mail_from_address', e.target.value)} variant="glass" className="w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Göndərənin adı</label>
              <TextInput value={data.mail_from_name} onChange={e=>setData('mail_from_name', e.target.value)} variant="glass" className="w-full" />
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={processing} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg disabled:opacity-50">{processing ? 'Yadda saxlanılır...' : 'Yadda saxla'}</button>
          </div>
        </form>

        {/* Bulk Email to Users */}
        <div className="mt-10 backdrop-blur bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-600 p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">İstifadəçilərə Toplu Mesaj</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Bütün qeydiyyatlı istifadəçilərə göndərilir.</p>
          <BulkEmailForm />
        </div>
      </div>
    </AdminLayout>
  );
}
