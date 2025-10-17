<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DonationPage;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Http\Controllers\Admin\Traits\HasFooterData;

class DonationController extends Controller
{
    use HasFooterData;
    
    public function index()
    {
        $donation = DonationPage::first() ?: new DonationPage();
        
        return Inertia::render('Admin/DonationSettings', $this->addFooterDataToResponse([
            'donation' => $donation
        ]));
    }
    
    public function update(Request $request)
    {
        $validated = $request->validate([
            'is_enabled' => 'required|boolean',
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'display_settings' => 'nullable|array',
            'payment_methods' => 'nullable|array',
            'custom_texts' => 'nullable|array'
        ]);
        
        $donation = DonationPage::first();
        
        if ($donation) {
            $donation->update($validated);
        } else {
            DonationPage::create($validated);
        }
        
        return redirect()->back()->with('success', 'İanə səhifəsi Parametrləri yenidən edildi!');
    }
    
    public function toggle(Request $request)
    {
        $donation = DonationPage::first();
        
        if ($donation) {
            $donation->update([
                'is_enabled' => !$donation->is_enabled
            ]);
        }
        
        return response()->json([
            'success' => true,
            'is_enabled' => $donation ? $donation->is_enabled : false
        ]);
    }
}

