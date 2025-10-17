<?php

namespace App\Http\Controllers;

use App\Models\Settings;
use Illuminate\Http\Request;

class ManifestController extends Controller
{
    /**
     * Generate PWA manifest.json dynamically
     */
    public function manifest()
    {
        $siteName = Settings::get('site_name', 'XIV AI Chatbot Platform');
        $faviconUrl = Settings::get('favicon_url');
        $primaryColor = Settings::get('primary_color', '#6366f1');
        
        // Default icons if no favicon is uploaded
        $icons = [];
        if ($faviconUrl) {
            $icons = [
                [
                    "src" => $faviconUrl,
                    "sizes" => "64x64 32x32 24x24 16x16",
                    "type" => "image/x-icon"
                ],
                [
                    "src" => $faviconUrl,
                    "type" => "image/png",
                    "sizes" => "192x192"
                ],
                [
                    "src" => $faviconUrl,
                    "type" => "image/png",
                    "sizes" => "512x512"
                ]
            ];
        } else {
            // Fallback to default icons
            if (file_exists(public_path('favicon.png'))) {
                $icons[] = [
                    "src" => "/favicon.png",
                    "type" => "image/png",
                    "sizes" => "192x192"
                ];
            }
            if (file_exists(public_path('favicon.ico'))) {
                $icons[] = [
                    "src" => "/favicon.ico",
                    "sizes" => "64x64 32x32 24x24 16x16",
                    "type" => "image/x-icon"
                ];
            }
        }
        
        $manifest = [
            "name" => $siteName,
            "short_name" => $siteName,
            "description" => "AI-powered chatbot platform with advanced conversational capabilities",
            "start_url" => "/",
            "display" => "standalone",
            "background_color" => "#ffffff",
            "theme_color" => $primaryColor,
            "orientation" => "portrait-primary",
            "scope" => "/",
            "icons" => $icons,
            "categories" => ["productivity", "utilities", "business"],
            "lang" => "en",
            "dir" => "ltr"
        ];
        
        return response()->json($manifest)
            ->header('Content-Type', 'application/manifest+json')
            ->header('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    }
}