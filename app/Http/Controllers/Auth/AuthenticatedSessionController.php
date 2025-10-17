<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\Settings;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
            'theme' => [
                'primary_color' => Settings::get('primary_color', '#10b981'),
                'secondary_color' => Settings::get('secondary_color', '#059669'),
                'accent_color' => Settings::get('accent_color', '#fbbf24'),
                'background_gradient' => Settings::get('background_gradient', 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'),
                'text_color' => Settings::get('text_color', '#1f2937'),
            ],
            'settings' => [
                'chatbot_name' => Settings::get('chatbot_name', 'AI Assistant'),
                'site_name' => Settings::get('site_name', 'AI Chatbot Platform'),
            ],
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();
        
        // Update last login info
        if ($user = Auth::user()) {
            $user->update([
                'last_login_ip' => $request->ip(),
                'last_login_at' => now(),
            ]);
        }

        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/');
    }
}

