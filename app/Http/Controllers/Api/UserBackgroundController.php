<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use App\Models\User;
use App\Models\UserBackground;

class UserBackgroundController extends Controller
{
    /**
     * Get user's current background settings
     */
    public function getSettings(Request $request)
    {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not authenticated'
            ], 401);
        }

        // Get or create user background
        $background = $user->background ?? UserBackground::create([
            'user_id' => $user->id,
            'active_type' => 'solid',
            'solid_color' => '#f3f4f6',
        ]);

        // Parse user's background settings from the new structure
        $settings = [
            'type' => $background->active_type ?? 'solid',
            'color' => $background->solid_color ?? '#f3f4f6',
            'gradient' => $background->gradient_value ?? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'image' => $background->image_url,
            'imageSize' => $background->image_size ?? 'cover',
            'imagePosition' => $background->image_position ?? 'center'
        ];

        \Log::info('Getting user background settings', [
            'user_id' => $user->id,
            'background_id' => $background->id,
            'settings' => $settings
        ]);
        
        return response()->json([
            'success' => true,
            'settings' => $settings
        ]);
    }

    /**
     * Save user's background settings
     */
    public function saveSettings(Request $request)
    {
        \Log::info('Save settings request received', [
            'user_id' => Auth::id(),
            'request_data' => $request->all()
        ]);
        
        $user = Auth::user();
        
        if (!$user) {
            \Log::error('Save settings failed: User not authenticated');
            return response()->json([
                'success' => false,
                'message' => 'User not authenticated'
            ], 401);
        }

        $validator = Validator::make($request->all(), [
            'type' => 'required|in:solid,gradient,image,default',
            'color' => 'nullable|string',
            'gradient' => 'nullable|string',
            'image' => 'nullable|string',
            'imageSize' => 'nullable|string',
            'imagePosition' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            \Log::error('Save settings validation failed', [
                'user_id' => $user->id,
                'errors' => $validator->errors()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Get or create user background record
            $background = $user->background ?? UserBackground::create([
                'user_id' => $user->id,
                'active_type' => 'solid',
                'solid_color' => '#f3f4f6',
            ]);
            
            \Log::info('Current background before save', [
                'user_id' => $user->id,
                'background_id' => $background->id,
                'current_active_type' => $background->active_type,
            ]);
            
            // Prepare update data based on type
            $updateData = [
                'active_type' => $request->type,
            ];
            
            switch ($request->type) {
                case 'solid':
                    $updateData['solid_color'] = $request->color ?: '#f3f4f6';
                    // Clear other types when setting solid
                    $updateData['gradient_value'] = null;
                    $updateData['image_url'] = null;
                    $updateData['image_size'] = 'cover'; // Default instead of NULL
                    $updateData['image_position'] = 'center'; // Default instead of NULL
                    break;
                case 'gradient':
                    $updateData['gradient_value'] = $request->gradient ?: $request->color;
                    // Clear other types when setting gradient
                    $updateData['solid_color'] = null;
                    $updateData['image_url'] = null;
                    $updateData['image_size'] = 'cover'; // Default instead of NULL
                    $updateData['image_position'] = 'center'; // Default instead of NULL
                    break;
                case 'image':
                    if ($request->image) {
                        $updateData['image_url'] = $request->image;
                        $updateData['image_size'] = $request->imageSize ?: 'cover';
                        $updateData['image_position'] = $request->imagePosition ?: 'center';
                        // Clear other types when setting image
                        $updateData['solid_color'] = null;
                        $updateData['gradient_value'] = null;
                    }
                    break;
                case 'default':
                    \Log::info('Processing default reset', [
                        'user_id' => $user->id,
                        'current_image_url' => $background->image_url,
                        'current_active_type' => $background->active_type
                    ]);
                    
                    // Reset everything to default transparent background
                    $updateData['active_type'] = 'default';
                    $updateData['solid_color'] = null;
                    $updateData['gradient_value'] = null;
                    $updateData['image_url'] = null;
                    $updateData['image_size'] = 'cover'; // Default instead of NULL
                    $updateData['image_position'] = 'center'; // Default instead of NULL
                    
                    // Delete any existing background image file
                    if ($background->image_url) {
                        \Log::info('Deleting background image file', [
                            'user_id' => $user->id,
                            'image_url' => $background->image_url
                        ]);
                        $deleteResult = $this->deleteImageFile($background->image_url);
                        \Log::info('Image file deletion result', [
                            'user_id' => $user->id,
                            'delete_success' => $deleteResult,
                            'image_url' => $background->image_url
                        ]);
                    } else {
                        \Log::info('No background image to delete', ['user_id' => $user->id]);
                    }
                    break;
            }
            
            // Update image properties for real-time preview if provided
            if ($request->imageSize && $background->image_url) {
                $updateData['image_size'] = $request->imageSize;
            }
            if ($request->imagePosition && $background->image_url) {
                $updateData['image_position'] = $request->imagePosition;
            }
            
            // Ensure image_size and image_position are never null
            if (!isset($updateData['image_size']) || $updateData['image_size'] === null) {
                $updateData['image_size'] = 'cover';
            }
            if (!isset($updateData['image_position']) || $updateData['image_position'] === null) {
                $updateData['image_position'] = 'center';
            }

            $background->update($updateData);
            
            \Log::info('Background settings saved successfully', [
                'user_id' => $user->id,
                'background_id' => $background->id,
                'type' => $request->type,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Background settings saved successfully'
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Failed to save background settings', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to save settings: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Upload background image for authenticated users
     */
    public function uploadImage(Request $request)
    {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not authenticated'
            ], 401);
        }

        $validator = Validator::make($request->all(), [
            'image' => 'required|file|max:400' // max 400KB, simplified validation
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $file = $request->file('image');
            
            // Manual image type validation (since fileinfo extension is not available)
            $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif'];
            $extension = strtolower($file->getClientOriginalExtension());
            
            if (!in_array($extension, $allowedExtensions)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid file type. Only JPG, JPEG, PNG, and GIF files are allowed.'
                ], 422);
            }
            
            // Check file size manually (400KB = 409600 bytes)
            if ($file->getSize() > 409600) {
                return response()->json([
                    'success' => false,
                    'message' => 'File too large. Maximum size is 400KB.'
                ], 422);
            }
            
            // Get or create user background record
            $background = $user->background ?? UserBackground::create([
                'user_id' => $user->id,
                'active_type' => 'solid',
                'solid_color' => '#f3f4f6',
            ]);
            
            // Delete old image if exists
            if ($background->image_url) {
                $this->deleteImageFile($background->image_url);
            }

            // Store new image directly in public/images/backgrounds
            $filename = 'background_' . $user->id . '_' . time() . '.' . $file->getClientOriginalExtension();
            
            // Ensure directory exists
            $uploadDir = public_path('images/backgrounds');
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0755, true);
            }
            
            // Move file to public directory
            $file->move($uploadDir, $filename);
            $url = asset('images/backgrounds/' . $filename);

            \Log::info('Image uploaded successfully', [
                'user_id' => $user->id,
                'filename' => $filename,
                'url' => $url,
            ]);

            return response()->json([
                'success' => true,
                'url' => $url,
                'message' => 'Image uploaded successfully'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload image: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete user's background image
     */
    public function deleteImage(Request $request)
    {
        $user = Auth::user();
        
        \Log::info('Delete image request received', [
            'user_id' => $user ? $user->id : null,
        ]);
        
        if (!$user) {
            \Log::error('Delete image failed: User not authenticated');
            return response()->json([
                'success' => false,
                'message' => 'User not authenticated'
            ], 401);
        }

        try {
            $background = $user->background;
            if (!$background) {
                return response()->json([
                    'success' => false,
                    'message' => 'No background found for user'
                ], 404);
            }

            $fileDeleted = false;
            
            // Delete image file if exists
            if ($background->image_url) {
                $fileDeleted = $this->deleteImageFile($background->image_url);
            }

            // Update background settings - clear image, reset to solid color
            $background->update([
                'active_type' => 'solid',
                'image_url' => null,
                'image_size' => 'cover',
                'image_position' => 'center',
                'solid_color' => '#f3f4f6'
            ]);
            
            \Log::info('Image deletion completed', [
                'user_id' => $user->id,
                'file_deleted' => $fileDeleted,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Background image deleted successfully'
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Failed to delete background image', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete image: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Helper method to delete image file
     */
    private function deleteImageFile($imageUrl)
    {
        if (!$imageUrl) {
            \Log::info('deleteImageFile called with empty URL');
            return false;
        }

        \Log::info('Attempting to delete image file', ['image_url' => $imageUrl]);

        // Handle both old storage and new public paths
        if (strpos($imageUrl, '/storage/') !== false) {
            // Old storage path
            $oldPath = str_replace(url('/storage/'), '', $imageUrl);
            $oldPath = str_replace('/storage/', '', $oldPath);
            
            \Log::info('Processing storage path', ['old_path' => $oldPath]);
            
            if (Storage::disk('public')->exists($oldPath)) {
                Storage::disk('public')->delete($oldPath);
                \Log::info('File deleted from storage disk', ['path' => $oldPath]);
                return true;
            } else {
                \Log::warning('Storage file not found', ['path' => $oldPath]);
            }
        } elseif (strpos($imageUrl, '/images/backgrounds/') !== false) {
            // New public path
            $filename = basename($imageUrl);
            $oldFile = public_path('images/backgrounds/' . $filename);
            
            \Log::info('Processing public path', [
                'filename' => $filename,
                'full_path' => $oldFile,
                'file_exists' => file_exists($oldFile)
            ]);
            
            if (file_exists($oldFile)) {
                $unlinkResult = unlink($oldFile);
                \Log::info('File deletion attempt from public path', [
                    'path' => $oldFile,
                    'unlink_result' => $unlinkResult,
                    'file_still_exists' => file_exists($oldFile)
                ]);
                return $unlinkResult;
            } else {
                \Log::warning('Public file not found for deletion', ['path' => $oldFile]);
            }
        } else {
            \Log::warning('Unknown image URL format', ['url' => $imageUrl]);
        }

        \Log::warning('Image file not found for deletion', ['url' => $imageUrl]);
        return false;
    }
}