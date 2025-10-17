<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Settings;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\Laravel\Facades\Image;
use Intervention\Image\Drivers\Gd\Driver;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Artisan;

class FileUploadController extends Controller
{
    public function uploadSiteLogo(Request $request)
    {
        try {
            // Basic validation only - no MIME checking
            $request->validate([
                'image' => 'required|file|max:1024', // 1MB limit
                'variant' => 'nullable|string|in:desktop_light,desktop_dark,mobile_light,mobile_dark,default'
            ]);
            
            $file = $request->file('image');
            $variant = $request->input('variant', 'default');
            
            // Get original extension from filename
            $originalName = $file->getClientOriginalName();
            $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
            
            // Allow common image extensions
            $allowedExtensions = ['jpeg', 'jpg', 'png', 'gif', 'webp', 'bmp'];
            if (!in_array($extension, $allowedExtensions)) {
                return response()->json([
                    'success' => false, 
                    'message' => 'Yalnız şəkil formatları qəbul edilir (JPG, PNG, GIF, WebP).'
                ], 422);
            }

            // Simple file handling without image processing
            $filename = 'brand-logo-' . time() . '.' . $extension;
            $path = 'brand/' . $filename;
            
            // Direct file storage
            $fileContent = file_get_contents($file->getRealPath());
            Storage::disk('public')->put($path, $fileContent);

            $relative = Storage::disk('public')->url($path);
            $url = url($relative);

            // Ensure storage symlink exists
            try {
                if (!file_exists(public_path('storage'))) {
                    Artisan::call('storage:link');
                }
            } catch (\Exception $e) {
                // ignore
            }

            // Fallback copy to public directory if storage link fails
            $publicStoragePath = public_path(ltrim($relative, '/'));
            if (!file_exists($publicStoragePath)) {
                $fallbackDir = public_path('brand');
                File::ensureDirectoryExists($fallbackDir);
                $sourcePath = Storage::disk('public')->path($path);
                $fallbackPath = $fallbackDir . DIRECTORY_SEPARATOR . $filename;
                try {
                    File::copy($sourcePath, $fallbackPath);
                    $url = url('brand/' . $filename);
                } catch (\Exception $e) {
                    // keep original URL
                }
            }

            // Save settings
            if (in_array($variant, ['desktop_light','desktop_dark','mobile_light','mobile_dark'])) {
                Settings::set('brand_logo_' . $variant, $url);
            } else {
                Settings::set('brand_logo_url', $url);
            }
            Settings::set('brand_mode', 'logo');

            return response()->json(['success' => true, 'url' => $url, 'variant' => $variant]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function uploadFavicon(Request $request)
    {
        try {
            // Basic validation only - no MIME checking
            $request->validate([
                'image' => 'required|file|max:512', // 512KB limit
            ]);
            
            $file = $request->file('image');
            
            // Get original extension from filename
            $originalName = $file->getClientOriginalName();
            $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
            
            // Allow common favicon extensions
            $allowedExtensions = ['png', 'jpg', 'jpeg', 'ico', 'gif'];
            if (!in_array($extension, $allowedExtensions)) {
                return response()->json([
                    'success' => false, 
                    'message' => 'Yalnız favicon formatları qəbul edilir (PNG, JPG, ICO).'
                ], 422);
            }

            // Simple file handling
            $filename = 'favicon-' . time() . '.' . $extension;
            $path = 'brand/' . $filename;
            
            // Direct file storage
            $fileContent = file_get_contents($file->getRealPath());
            Storage::disk('public')->put($path, $fileContent);

            $relative = Storage::disk('public')->url($path);
            $url = url($relative);

            // Ensure storage symlink exists
            try {
                if (!file_exists(public_path('storage'))) {
                    Artisan::call('storage:link');
                }
            } catch (\Exception $e) {
                // ignore
            }

            // Fallback copy to public directory if storage link fails
            $publicStoragePath = public_path(ltrim($relative, '/'));
            if (!file_exists($publicStoragePath)) {
                $fallbackDir = public_path('brand');
                File::ensureDirectoryExists($fallbackDir);
                $sourcePath = Storage::disk('public')->path($path);
                $fallbackPath = $fallbackDir . DIRECTORY_SEPARATOR . $filename;
                try {
                    File::copy($sourcePath, $fallbackPath);
                    $url = url('brand/' . $filename);
                } catch (\Exception $e) {
                    // keep original URL
                }
            }

            // Save favicon URL
            Settings::set('favicon_url', $url);

            // Copy to public root for browser compatibility
            try {
                $publicTarget = public_path('favicon.' . $extension);
                @copy(Storage::disk('public')->path($path), $publicTarget);
            } catch (\Exception $e) {}

            return response()->json(['success' => true, 'url' => $url]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // Background upload methods removed - now handled by UserBackgroundController
    
    /**
     * Debug upload capabilities
     */
    public function debugUpload()
    {
        $info = [
            'php_version' => PHP_VERSION,
            'max_file_uploads' => ini_get('max_file_uploads'),
            'upload_max_filesize' => ini_get('upload_max_filesize'),
            'post_max_size' => ini_get('post_max_size'),
            'memory_limit' => ini_get('memory_limit'),
            'fileinfo_loaded' => extension_loaded('fileinfo'),
            'gd_loaded' => extension_loaded('gd'),
            'storage_path_writable' => is_writable(storage_path('app/public')),
            'public_path_exists' => file_exists(public_path('storage')),
        ];
        
        return response()->json($info);
    }
}
