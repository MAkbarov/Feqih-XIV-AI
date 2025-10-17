<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;
use App\Models\Settings;

class ContactController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Contact', [
            'contact' => [
                'title' => Settings::get('contact_title', 'Əlaqə'),
                'content' => Settings::get('contact_content', 'Bizimlə əlaqə saxlamaq üçün aşağıdakı e-poçtdan istifadə edin.'),
                'email' => Settings::get('contact_email', config('mail.from.address', 'admin@example.com')),
                // Social media contact info
                'social_media' => [
                    'phone' => [
                        'value' => Settings::get('contact_phone', ''),
                        'enabled' => Settings::getBool('contact_phone_enabled', false)
                    ],
                    'whatsapp' => [
                        'value' => Settings::get('contact_whatsapp', ''),
                        'enabled' => Settings::getBool('contact_whatsapp_enabled', false)
                    ],
                    'tiktok' => [
                        'value' => Settings::get('contact_tiktok', ''),
                        'enabled' => Settings::getBool('contact_tiktok_enabled', false)
                    ],
                    'instagram' => [
                        'value' => Settings::get('contact_instagram', ''),
                        'enabled' => Settings::getBool('contact_instagram_enabled', false)
                    ],
                    'github' => [
                        'value' => Settings::get('contact_github', ''),
                        'enabled' => Settings::getBool('contact_github_enabled', false)
                    ],
                    'facebook' => [
                        'value' => Settings::get('contact_facebook', ''),
                        'enabled' => Settings::getBool('contact_facebook_enabled', false)
                    ],
                ]
            ],
            // Theme colors və settings
            'settings' => array_merge(
                Settings::getBrandSettings(),
                [
                    // Əlavə settings bura
                ]
            ),
            'theme' => Settings::getThemeColors(),
        ]);
    }
}
