<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Settings;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PasswordResetLinkController extends Controller
{
    /**
     * Display the password reset link request view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/ForgotPassword', [
            'status' => session('status'),
            'theme' => [
                'primary_color' => Settings::get('primary_color', '#10b981'),
                'secondary_color' => Settings::get('secondary_color', '#059669'),
                'accent_color' => Settings::get('accent_color', '#fbbf24'),
                'background_gradient' => Settings::get('background_gradient', 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'),
                'text_color' => Settings::get('text_color', '#1f2937'),
            ],
            'settings' => [
                'site_name' => Settings::get('site_name', 'AI Assistant'),
                'chatbot_name' => Settings::get('chatbot_name', 'AI Assistant'),
            ],
        ]);
    }

    /**
     * Handle an incoming password reset link request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        // We will send the password reset link to this user. Once we have attempted
        // to send the link, we will examine the response then see the message we
        // need to show to the user. Finally, we'll send out a proper response.
        $status = Password::sendResetLink(
            $request->only('email')
        );

        if ($status == Password::RESET_LINK_SENT) {
            return back()->with('status', __($status));
        }

        throw ValidationException::withMessages([
            'email' => [trans($status)],
        ]);
    }
}

