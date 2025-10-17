<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Settings;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ContactSettingsController extends Controller
{
    public function index(): Response
    {
        $data = [
            'contact_title' => Settings::get('contact_title', 'Əlaqə'),
            'contact_content' => Settings::get('contact_content', 'Bizimlə əlaqə saxlamaq üçün aşağıdakı e-poçtdan istifadə edin.'),
            'contact_email' => Settings::get('contact_email', config('mail.from.address', 'admin@example.com')),
            'admin_email' => Settings::get('admin_email', config('mail.from.address', 'admin@example.com')),
            // Social media settings
            'contact_phone' => Settings::get('contact_phone', ''),
            'contact_phone_enabled' => Settings::get('contact_phone_enabled', '0'),
            'contact_whatsapp' => Settings::get('contact_whatsapp', ''),
            'contact_whatsapp_enabled' => Settings::get('contact_whatsapp_enabled', '0'),
            'contact_tiktok' => Settings::get('contact_tiktok', ''),
            'contact_tiktok_enabled' => Settings::get('contact_tiktok_enabled', '0'),
            'contact_instagram' => Settings::get('contact_instagram', ''),
            'contact_instagram_enabled' => Settings::get('contact_instagram_enabled', '0'),
            'contact_github' => Settings::get('contact_github', ''),
            'contact_github_enabled' => Settings::get('contact_github_enabled', '0'),
            'contact_facebook' => Settings::get('contact_facebook', ''),
            'contact_facebook_enabled' => Settings::get('contact_facebook_enabled', '0'),
        ];

        return Inertia::render('Admin/ContactSettings', [
            'contact' => $data,
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'contact_title' => 'required|string|max:100',
            'contact_content' => 'nullable|string|max:20000',
            'contact_email' => 'nullable|email|max:255',
            'admin_email' => 'nullable|email|max:255',
            // Social media validations
            'contact_phone' => 'nullable|string|max:255',
            'contact_phone_enabled' => 'boolean',
            'contact_whatsapp' => 'nullable|url|max:255',
            'contact_whatsapp_enabled' => 'boolean',
            'contact_tiktok' => 'nullable|url|max:255',
            'contact_tiktok_enabled' => 'boolean',
            'contact_instagram' => 'nullable|url|max:255',
            'contact_instagram_enabled' => 'boolean',
            'contact_github' => 'nullable|url|max:255',
            'contact_github_enabled' => 'boolean',
            'contact_facebook' => 'nullable|url|max:255',
            'contact_facebook_enabled' => 'boolean',
        ]);

        foreach ($validated as $key => $value) {
            // Convert boolean values to string for database storage
            if (is_bool($value)) {
                $value = $value ? '1' : '0';
            }
            Settings::set($key, $value);
        }

        return redirect()->back()->with('success', 'Əlaqə səhifəsi və sosial media parametrləri yeniləndi!');
    }
}
