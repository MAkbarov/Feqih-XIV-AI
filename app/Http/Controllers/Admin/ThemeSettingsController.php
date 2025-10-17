<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Settings;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Http\Controllers\Admin\Traits\HasFooterData;

class ThemeSettingsController extends Controller
{
    use HasFooterData;
    /**
     * Display the theme settings page
     */
    public function index()
    {
        $settings = Settings::getAllSettings();

        return Inertia::render('Admin/ThemeSettings', $this->addFooterDataToResponse([
            'settings' => $settings,
        ]));
    }

    /**
     * Update theme settings (colors and background only)
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            'primary_color' => 'required|string|max:50',
            'secondary_color' => 'required|string|max:50', 
            'accent_color' => 'required|string|max:50',
            'background_gradient' => 'required|string|max:500',
            'text_color' => 'required|string|max:50',
        ]);

        // Update color settings
        Settings::set('primary_color', $validated['primary_color']);
        Settings::set('secondary_color', $validated['secondary_color']);
        Settings::set('accent_color', $validated['accent_color']);
        Settings::set('background_gradient', $validated['background_gradient']);
        Settings::set('text_color', $validated['text_color']);

        return redirect()->back()->with('success', 'Mövzu Parametrləri uğurla yeniləndi!');
    }

}