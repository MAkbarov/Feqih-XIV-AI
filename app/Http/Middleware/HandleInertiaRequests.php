<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use App\Models\Settings;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        if ($user) {
            $user->load('role');
        }
        
        return [
            ...parent::share($request),
            'csrf_token' => csrf_token(),
            'auth' => [
                'user' => $user ? [
                    ...$user->toArray(),
                    'isAdmin' => $user->isAdmin()
                ] : null,
            ],
            'theme' => [
                'primary_color' => Settings::get('primary_color', '#10b981'),
                'secondary_color' => Settings::get('secondary_color', '#97a5a1'),
                'accent_color' => Settings::get('accent_color', '#fbbf24'),
                'background_gradient' => Settings::get('background_gradient', 'linear-gradient(135deg, green 10%, black 100%)'),
                'text_color' => Settings::get('text_color', '#1f2937'),
            ],
            'site_name' => Settings::get('site_name', 'AI Chatbot Platform'),
        ];
    }
}

