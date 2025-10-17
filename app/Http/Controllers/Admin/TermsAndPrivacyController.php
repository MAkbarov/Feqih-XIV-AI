<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\TermsAndPrivacy;
use App\Models\Settings;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Http\Controllers\Admin\Traits\HasFooterData;

class TermsAndPrivacyController extends Controller
{
    use HasFooterData;
    public function index()
    {
        $terms = TermsAndPrivacy::where('type', 'terms')->first();
        $privacy = TermsAndPrivacy::where('type', 'privacy')->first();
        
        // Get theme settings from Settings model
        $theme = [
            'primary_color' => Settings::get('primary_color', '#10b981'),
            'secondary_color' => Settings::get('secondary_color', '#97a5a1'),
            'accent_color' => Settings::get('accent_color', '#fbbf24'),
            'background_gradient' => Settings::get('background_gradient', 'linear-gradient(135deg, #10b981 0%, #065f46 100%)'),
        ];
        
        return Inertia::render('Admin/TermsAndPrivacy', $this->addFooterDataToResponse([
            'terms' => $terms,
            'privacy' => $privacy,
            'theme' => $theme
        ]));
    }
    
    public function update(Request $request)
    {
        $request->validate([
            'type' => 'required|in:terms,privacy',
            'title' => 'required|string|max:255',
            'content' => 'required|string'
        ]);
        
        TermsAndPrivacy::updateOrCreate(
            ['type' => $request->type],
            [
                'title' => $request->title,
                'content' => $request->content,
                'is_active' => true
            ]
        );
        
        return redirect()->back()->with('success', 'Məlumat uğurla yeniləndi!');
    }
    
    public function getGuestTerms()
    {
        $terms = TermsAndPrivacy::where('type', 'terms')->where('is_active', true)->first();
        
        if (!$terms) {
            return response()->json([
                'title' => 'İstifadə Şərtləri',
                'content' => '<p>İstifadə şərtləri hələ təyin edilməyib.</p>'
            ]);
        }
        
        return response()->json([
            'title' => $terms->title,
            'content' => $terms->content
        ]);
    }
}
