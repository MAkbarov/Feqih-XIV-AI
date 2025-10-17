<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Settings;
use App\Models\FooterSetting;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();
        $user->load('role');
        
        // Get settings for site functionality
        try {
            $settings = array_merge(
                Settings::getBrandSettings(),
                ['chatbot_name' => Settings::get('chatbot_name', 'AI Assistant')]
            );
        } catch (\Exception $e) {
            $settings = ['site_name' => 'AI Chatbot Platform', 'chatbot_name' => 'AI Assistant'];
        }
        
        // Get footer settings
        try {
            $footerSettings = FooterSetting::all()->mapWithKeys(function ($item) {
                return [$item->key => $item->value];
            })->toArray();
        } catch (\Exception $e) {
            $footerSettings = ['footer_text' => '© 2025 AI Chatbot Platform'];
        }
        
        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $user instanceof MustVerifyEmail,
            'status' => session('status'),
            'auth' => [
                'user' => $user,
            ],
            'settings' => $settings,
            'footerSettings' => $footerSettings,
            'theme' => Settings::getThemeColors(),
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        if (array_key_exists('email_news_opt_in', $validated)) {
            $validated['email_news_opt_in'] = (bool)$validated['email_news_opt_in'];
        }
        $request->user()->fill($validated);

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        return Redirect::route('profile.edit');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}

