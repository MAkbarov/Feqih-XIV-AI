<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Settings;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MailSettingsController extends Controller
{
    public function index(): Response
    {
        $data = [
            'mail_mailer' => Settings::get('mail_mailer', config('mail.default', 'smtp')),
            'mail_host' => Settings::get('mail_host', config('mail.mailers.smtp.host', '127.0.0.1')),
            'mail_port' => (int) Settings::get('mail_port', config('mail.mailers.smtp.port', 2525)),
            'mail_username' => Settings::get('mail_username', ''),
            'mail_password' => Settings::get('mail_password', ''),
            'mail_encryption' => Settings::get('mail_encryption', config('mail.mailers.smtp.scheme', 'tls')),
            'mail_from_address' => Settings::get('mail_from_address', config('mail.from.address', 'hello@example.com')),
            'mail_from_name' => Settings::get('mail_from_name', config('mail.from.name', 'Example')),
        ];
        return Inertia::render('Admin/MailSettings', [ 'mail' => $data ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'mail_mailer' => 'required|string|in:smtp,log,sendmail,postmark,ses,resend,failover,roundrobin',
            'mail_host' => 'nullable|string|max:255',
            'mail_port' => 'nullable|integer|min:1|max:65535',
            'mail_username' => 'nullable|string|max:255',
            'mail_password' => 'nullable|string|max:1024',
            'mail_encryption' => 'nullable|string|in:tls,ssl,starttls,none',
            'mail_from_address' => 'nullable|email|max:255',
            'mail_from_name' => 'nullable|string|max:255',
        ]);

        foreach ($validated as $k => $v) {
            Settings::set($k, $v);
        }

        return back()->with('success', 'E-poçt parametrləri yeniləndi!');
    }
}
