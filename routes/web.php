<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\TermsController;
use App\Http\Controllers\ManifestController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\Admin\AiProviderController as AdminAiProviderController;
use App\Http\Controllers\Admin\SettingsController as AdminSettingsController;
use App\Http\Controllers\Admin\ThemeSettingsController;
use App\Http\Controllers\Admin\TermsAndPrivacyController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', [ChatController::class, 'index'])->name('home');
Route::get('/donation', [ChatController::class, 'donation'])->name('donation');

// PWA Manifest
Route::get('/manifest.json', [ManifestController::class, 'manifest'])->name('manifest');

// Terms and Privacy routes
Route::get('/terms', [TermsController::class, 'terms'])->name('terms');
Route::get('/privacy', [TermsController::class, 'privacy'])->name('privacy');
Route::get('/contact', [\App\Http\Controllers\ContactController::class, 'index'])->name('contact');

Route::get('/dashboard', function () {
    return redirect('/');
})->middleware(['auth', 'verified'])->name('dashboard');

// Chat routes
Route::post('/chat/send', [ChatController::class, 'sendMessage'])->name('chat.send');
Route::post('/chat/stop', [ChatController::class, 'stopGeneration'])->name('chat.stop');
Route::get('/chat/{sessionId}', [ChatController::class, 'getSession'])->name('chat.get');
Route::delete('/chat/{sessionId}', [ChatController::class, 'deleteSession'])->name('chat.delete');
Route::post('/chat/{sessionId}/delete', [ChatController::class, 'deleteSession'])->name('chat.delete.post');
Route::post('/chat/report-feedback', [ChatController::class, 'reportFeedback'])->name('chat.report-feedback');
Route::post('/chat/feedback', [ChatController::class, 'submitFeedback'])->name('chat.feedback');

// RAG System API Routes
Route::post('/api/rag/query', [\App\Http\Controllers\Api\RAGChatController::class, 'query'])->name('api.rag.query');
Route::post('/api/rag/query-stream', [\App\Http\Controllers\Api\RAGChatController::class, 'queryStream'])->name('api.rag.query-stream');

// RAG Health Check API (Admin only)
Route::middleware(['auth', 'admin'])->prefix('api/rag/health')->name('api.rag.health.')->group(function () {
    Route::get('/embedding', [\App\Http\Controllers\Api\RAGHealthController::class, 'checkEmbeddingProvider'])->name('embedding');
    Route::get('/pinecone', [\App\Http\Controllers\Api\RAGHealthController::class, 'checkPinecone'])->name('pinecone');
    Route::get('/system', [\App\Http\Controllers\Api\RAGHealthController::class, 'checkRAGSystem'])->name('system');
    Route::get('/compatibility', [\App\Http\Controllers\Api\RAGHealthController::class, 'checkCompatibility'])->name('compatibility');
    Route::get('/embedding-providers', [\App\Http\Controllers\Api\RAGHealthController::class, 'getEmbeddingProviders'])->name('embedding-providers');
});
Route::get('/api/footer-settings', [ChatController::class, 'getFooterSettings'])->name('api.footer-settings');
Route::get('/api/theme', [AdminSettingsController::class, 'theme'])->name('api.theme');
Route::get('/api/guest-terms', [\App\Http\Controllers\Admin\TermsAndPrivacyController::class, 'getGuestTerms'])->name('api.guest-terms');
Route::get('/api/chat-limits', [ChatController::class, 'getChatLimits'])->name('api.chat-limits');


// User Background Settings API (Guest and Authenticated)
Route::prefix('api/user')->name('api.user.')->group(function () {
    Route::middleware('auth')->group(function () {
        Route::get('/background-settings', [\App\Http\Controllers\Api\UserBackgroundController::class, 'getSettings'])->name('background-settings.get');
        Route::post('/background-settings', [\App\Http\Controllers\Api\UserBackgroundController::class, 'saveSettings'])->name('background-settings.save');
        Route::post('/upload-background-image', [\App\Http\Controllers\Api\UserBackgroundController::class, 'uploadImage'])->name('background-image.upload');
        Route::delete('/background-image', [\App\Http\Controllers\Api\UserBackgroundController::class, 'deleteImage'])->name('background-image.delete');
    });
});
Route::get('/api/app-version', function () {
    try {
        $versionFile = base_path('version.json');
        if (file_exists($versionFile)) {
            $versionData = json_decode(file_get_contents($versionFile), true);
            return response()->json([
                'version' => $versionData['version'] ?? '1.0.0',
                'name' => $versionData['name'] ?? 'XIV AI Fəqih',
                'updated_at' => $versionData['release_date'] ?? $versionData['updated_at'] ?? null,
                'build' => $versionData['build'] ?? null
            ]);
        }
        return response()->json(['version' => '1.0.0', 'name' => 'XIV AI Fəqih']);
    } catch (\Exception $e) {
        return response()->json(['version' => '1.0.0', 'name' => 'XIV AI Fəqih']);
    }
})->name('api.app-version');
// Test API first


Route::get('/api/donation-settings', function () {
    try {
        // Log the request
        \Log::info('Donation API called');
        
        // Try to get the model
        $donationPage = \App\Models\DonationPage::first();
        \Log::info('DonationPage query result: ' . ($donationPage ? 'found' : 'not found'));
        
        if (!$donationPage) {
            \Log::info('No donation page found in database');
            return response()->json(['enabled' => false, 'reason' => 'no_data']);
        }
        
        if (!$donationPage->is_enabled) {
            \Log::info('Donation page is disabled');
            return response()->json(['enabled' => false, 'reason' => 'disabled']);
        }
        
        // Get display_settings (already parsed as array by Eloquent cast)
        $displaySettings = $donationPage->display_settings ?: [];
        \Log::info('Display settings parsed', ['settings' => $displaySettings]);
        
        $response = [
            'enabled' => true,
            'title' => $donationPage->title,
            'content' => $donationPage->content,
            'background_color' => $displaySettings['background_color'] ?? '#f8f9fa',
            'text_color' => $displaySettings['text_color'] ?? '#333333',
            'button_color' => $displaySettings['button_color'] ?? '#3b82f6',
        ];
        
        \Log::info('Donation API response', ['response' => $response]);
        return response()->json($response);
        
    } catch (\Exception $e) {
        \Log::error('Donation API error: ' . $e->getMessage());
        \Log::error('Stack trace: ' . $e->getTraceAsString());
        return response()->json(['enabled' => false, 'error' => $e->getMessage()], 500);
    }
})->name('api.donation-settings');

// Profile
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Admin routes
Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', [AdminDashboardController::class, 'index'])->name('dashboard');
    
    // Analytics API
    Route::get('/analytics/dashboard', [\App\Http\Controllers\Admin\AnalyticsController::class, 'getDashboardAnalytics'])->name('analytics.dashboard');

    Route::get('/users', [AdminUserController::class, 'index'])->name('users.index');
    Route::patch('/users/{user}', [AdminUserController::class, 'update'])->name('users.update');
    Route::post('/users/{user}/block', [AdminUserController::class, 'block'])->name('users.block');
    Route::delete('/users/{user}', [AdminUserController::class, 'destroy'])->name('users.destroy');

    Route::get('/providers', [AdminAiProviderController::class, 'index'])->name('providers.index');
    Route::post('/providers', [AdminAiProviderController::class, 'store'])->name('providers.store');
    Route::patch('/providers/{provider}', [AdminAiProviderController::class, 'update'])->name('providers.update');
    Route::delete('/providers/{provider}', [AdminAiProviderController::class, 'destroy'])->name('providers.destroy');

    Route::get('/settings', [AdminSettingsController::class, 'index'])->name('settings.index');
    Route::post('/settings', [AdminSettingsController::class, 'update'])->name('settings.update');
    Route::post('/settings/pinecone', [AdminSettingsController::class, 'updatePinecone'])->name('settings.update.pinecone');
    Route::get('/settings/theme', [AdminSettingsController::class, 'theme'])->name('settings.theme');
    
    // AI Training & Knowledge Base - ADVANCED TRAINING SYSTEM
    Route::get('/ai-training', [\App\Http\Controllers\Admin\AiTrainingController::class, 'index'])->name('ai-training.index');
    Route::post('/ai-training/knowledge', [\App\Http\Controllers\Admin\AiTrainingController::class, 'storeKnowledge'])->name('ai-training.knowledge.store');
    Route::post('/ai-training/qa', [\App\Http\Controllers\Admin\AiTrainingController::class, 'trainQA'])->name('ai-training.qa.store');
    Route::post('/ai-training/system-prompt', [\App\Http\Controllers\Admin\AiTrainingController::class, 'updateSystemPrompt'])->name('ai-training.system-prompt');
    Route::post('/ai-training/import-url', [\App\Http\Controllers\Admin\AiTrainingController::class, 'importFromUrl'])->name('ai-training.import-url');
    Route::get('/ai-training/import-progress', [\App\Http\Controllers\Admin\AiTrainingController::class, 'importProgress'])
        ->withoutMiddleware([\App\Http\Middleware\Authenticate::class, \Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class])
        ->name('ai-training.import-progress');
    Route::post('/ai-training/import-stop', [\App\Http\Controllers\Admin\AiTrainingController::class, 'importStop'])->name('ai-training.import-stop');
    Route::get('/ai-training/knowledge/{id}/edit', [\App\Http\Controllers\Admin\AiTrainingController::class, 'editKnowledge'])->name('ai-training.knowledge.edit');
    Route::put('/ai-training/knowledge/{id}', [\App\Http\Controllers\Admin\AiTrainingController::class, 'updateKnowledge'])->name('ai-training.knowledge.update');
    Route::post('/ai-training/knowledge/{id}/toggle', [\App\Http\Controllers\Admin\AiTrainingController::class, 'toggleKnowledge'])->name('ai-training.knowledge.toggle');
    Route::post('/ai-training/knowledge/{id}/delete', [\App\Http\Controllers\Admin\AiTrainingController::class, 'deleteKnowledge'])->name('ai-training.knowledge.delete');
    Route::delete('/ai-training/knowledge/all', [\App\Http\Controllers\Admin\AiTrainingController::class, 'deleteAllKnowledge'])->name('ai-training.knowledge.delete-all');
    // Compatibility route (POST) in case DELETE fails from some clients
    Route::post('/ai-training/knowledge/delete-all', [\App\Http\Controllers\Admin\AiTrainingController::class, 'deleteAllKnowledge'])->name('ai-training.knowledge.delete-all.post');
    Route::post('/ai-training/knowledge/{id}/reindex', [\App\Http\Controllers\Admin\AiTrainingController::class, 'reindexKnowledge'])->name('ai-training.knowledge.reindex');

    // Knowledge Categories Management (Admin)
    Route::get('/ai-training/categories', [\App\Http\Controllers\Admin\KnowledgeCategoryController::class, 'index'])->name('ai-training.categories.index');
    Route::post('/ai-training/categories', [\App\Http\Controllers\Admin\KnowledgeCategoryController::class, 'store'])->name('ai-training.categories.store');
    Route::patch('/ai-training/categories/{category}', [\App\Http\Controllers\Admin\KnowledgeCategoryController::class, 'update'])->name('ai-training.categories.update');
    Route::delete('/ai-training/categories/{category}', [\App\Http\Controllers\Admin\KnowledgeCategoryController::class, 'destroy'])->name('ai-training.categories.destroy');
    Route::get('/ai-training/search', [\App\Http\Controllers\Admin\AiTrainingController::class, 'searchKnowledge'])->name('ai-training.search');
    Route::get('/ai-training/export', [\App\Http\Controllers\Admin\AiTrainingController::class, 'exportKnowledge'])->name('ai-training.export');
    Route::post('/ai-training/import', [\App\Http\Controllers\Admin\AiTrainingController::class, 'importKnowledge'])->name('ai-training.import');
    
    // Theme Settings (Colors & Background Only)
    Route::get('/theme-settings', [ThemeSettingsController::class, 'index'])->name('theme-settings.index');
    Route::post('/theme-settings', [ThemeSettingsController::class, 'update'])->name('theme-settings.update');
    
    // Chat Analytics - Söhbətlər siyahısı
    Route::get('/chat-analytics', [\App\Http\Controllers\Admin\ChatAnalyticsController::class, 'sessions'])->name('chat-analytics.index');
    Route::get('/chat-analytics/feedback', [\App\Http\Controllers\Admin\ChatAnalyticsController::class, 'index'])->name('chat-analytics.feedback.index');
    Route::post('/chat-analytics/reset-all', [\App\Http\Controllers\Admin\ChatAnalyticsController::class, 'resetAll'])->name('chat-analytics.reset-all');
    Route::get('/chat-analytics/feedback/list', [\App\Http\Controllers\Admin\ChatAnalyticsController::class, 'feedbackList'])->name('chat-analytics.feedback');
    Route::delete('/chat-analytics/{feedback}', [\App\Http\Controllers\Admin\ChatAnalyticsController::class, 'deleteFeedback'])->name('chat-analytics.delete');
    Route::get('/chat-analytics/export', [\App\Http\Controllers\Admin\ChatAnalyticsController::class, 'export'])->name('chat-analytics.export');
    
    // Donation settings
    Route::get('/donation', [\App\Http\Controllers\Admin\DonationController::class, 'index'])->name('donation.index');
    Route::post('/donation', [\App\Http\Controllers\Admin\DonationController::class, 'update'])->name('donation.update');
    Route::post('/donation/toggle', [\App\Http\Controllers\Admin\DonationController::class, 'toggle'])->name('donation.toggle');
    
    // Chat Management
    Route::get('/chat-management', [\App\Http\Controllers\Admin\ChatManagementController::class, 'index'])->name('chat-management.index');
    Route::get('/chat-management/{sessionId}', [\App\Http\Controllers\Admin\ChatManagementController::class, 'show'])->name('chat-management.show');
    Route::delete('/chat-management/{sessionId}', [\App\Http\Controllers\Admin\ChatManagementController::class, 'destroy'])->name('chat-management.destroy');
    Route::post('/chat-management/bulk-delete', [\App\Http\Controllers\Admin\ChatManagementController::class, 'bulkDelete'])->name('chat-management.bulk-delete');
    Route::post('/chat-management/delete-all', [\App\Http\Controllers\Admin\ChatManagementController::class, 'deleteAll'])->name('chat-management.delete-all');
    
    // Chat Limits & IP Security
    Route::get('/chat-limits', [\App\Http\Controllers\Admin\ChatLimitController::class, 'index'])->name('chat-limits.index');
    Route::post('/chat-limits/settings', [\App\Http\Controllers\Admin\ChatLimitController::class, 'updateSettings'])->name('chat-limits.settings');
    Route::post('/chat-limits/reset-all', [\App\Http\Controllers\Admin\ChatLimitController::class, 'resetAll'])->name('chat-limits.reset-all');
    Route::post('/chat-limits/reset-limit', [\App\Http\Controllers\Admin\ChatLimitController::class, 'resetLimit'])->name('chat-limits.reset-limit');
    Route::post('/chat-limits/clear-recent-activity', [\App\Http\Controllers\Admin\ChatLimitController::class, 'clearRecentActivity'])->name('chat-limits.clear-recent-activity');
    
    // IP Security
    Route::get('/ip-security', [\App\Http\Controllers\Admin\ChatLimitController::class, 'ipSecurity'])->name('ip-security.index');
    Route::post('/ip-security/{log}/resolve', [\App\Http\Controllers\Admin\ChatLimitController::class, 'resolveSecurityLog'])->name('ip-security.resolve');
    Route::delete('/ip-security/{log}', [\App\Http\Controllers\Admin\ChatLimitController::class, 'deleteSecurityLog'])->name('ip-security.delete');
    
    // System Management API
    Route::post('/system/clear-cache', [\App\Http\Controllers\Admin\SystemController::class, 'clearCache'])->name('system.clear-cache');
    Route::get('/system/health', [\App\Http\Controllers\Admin\SystemController::class, 'getSystemHealth'])->name('system.health');
    Route::get('/system/info', [\App\Http\Controllers\Admin\SystemController::class, 'getSystemInfo'])->name('system.info');
    Route::post('/system/artisan', [\App\Http\Controllers\Admin\SystemController::class, 'runArtisanCommand'])->name('system.artisan');
    
    // Database Repair System - SSH-free hosting solution
    Route::post('/system/repair-database', [\App\Http\Controllers\Admin\SystemController::class, 'repairDatabase'])->name('system.repair-database');
    Route::post('/system/create-user-backgrounds', [\App\Http\Controllers\Admin\SystemController::class, 'createUserBackgroundsTable'])->name('system.create-user-backgrounds');
    
    // Mail Settings
    Route::get('/mail-settings', [\App\Http\Controllers\Admin\MailSettingsController::class, 'index'])->name('mail-settings.index');
    Route::post('/mail-settings', [\App\Http\Controllers\Admin\MailSettingsController::class, 'update'])->name('mail-settings.update');
    Route::post('/mail/bulk-send', [\App\Http\Controllers\Admin\MailController::class, 'bulkSend'])->name('mail.bulk-send');

    // Notification Management API
    Route::get('/notifications', [\App\Http\Controllers\Admin\NotificationController::class, 'index'])->name('notifications.index');
    Route::get('/notifications/recent', [\App\Http\Controllers\Admin\NotificationController::class, 'recent'])->name('notifications.recent');
    Route::get('/notifications/stats', [\App\Http\Controllers\Admin\NotificationController::class, 'stats'])->name('notifications.stats');
    Route::post('/notifications/{id}/read', [\App\Http\Controllers\Admin\NotificationController::class, 'markAsRead'])->name('notifications.read');
    Route::post('/notifications/{id}/important', [\App\Http\Controllers\Admin\NotificationController::class, 'markAsImportant'])->name('notifications.important');
    Route::post('/notifications/read-all', [\App\Http\Controllers\Admin\NotificationController::class, 'markAllAsRead'])->name('notifications.read-all');
    Route::post('/notifications', [\App\Http\Controllers\Admin\NotificationController::class, 'create'])->name('notifications.create');
    Route::post('/notifications/clean-expired', [\App\Http\Controllers\Admin\NotificationController::class, 'cleanExpired'])->name('notifications.clean');
    Route::post('/notifications/delete-all', [\App\Http\Controllers\Admin\NotificationController::class, 'destroyAll'])->name('notifications.delete-all');
    Route::delete('/notifications/{id}', [\App\Http\Controllers\Admin\NotificationController::class, 'destroy'])->name('notifications.delete');
    
    // Terms and Privacy management
    Route::get('/terms-privacy', [TermsAndPrivacyController::class, 'index'])->name('terms-privacy.index');
    Route::post('/terms-privacy', [TermsAndPrivacyController::class, 'update'])->name('terms-privacy.update');

    // Contact page management
    Route::get('/contact-settings', [\App\Http\Controllers\Admin\ContactSettingsController::class, 'index'])->name('contact-settings.index');
    Route::post('/contact-settings', [\App\Http\Controllers\Admin\ContactSettingsController::class, 'update'])->name('contact-settings.update');
    
    // SEO Panel routes
    Route::get('/seo', [\App\Http\Controllers\Admin\SeoController::class, 'index'])->name('seo.index');
    Route::get('/seo/{page}', [\App\Http\Controllers\Admin\SeoController::class, 'show'])->name('seo.show');
    Route::post('/seo/{page}', [\App\Http\Controllers\Admin\SeoController::class, 'update'])->name('seo.update');
    Route::post('/seo/generate/sitemap', [\App\Http\Controllers\Admin\SeoController::class, 'generateSitemap'])->name('seo.generate-sitemap');
    Route::post('/seo/generate/robots', [\App\Http\Controllers\Admin\SeoController::class, 'generateRobots'])->name('seo.generate-robots');
    Route::get('/seo/{page}/analyze', [\App\Http\Controllers\Admin\SeoController::class, 'analyzePage'])->name('seo.analyze');
    
    // System Update routes
    Route::get('/system/update', [\App\Http\Controllers\Admin\SystemUpdateController::class, 'index'])->name('system.update');
    Route::get('/system/check-updates', [\App\Http\Controllers\Admin\SystemUpdateController::class, 'checkUpdates'])->name('system.check-updates');
    Route::post('/system/perform-update', [\App\Http\Controllers\Admin\SystemUpdateController::class, 'performUpdate'])
        ->withoutMiddleware([\Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class])
        ->name('system.perform-update');
    Route::get('/system/update-log', [\App\Http\Controllers\Admin\SystemUpdateController::class, 'getUpdateLog'])
        ->withoutMiddleware([\Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class])
        ->name('system.update-log');
    Route::get('/system/update-history', [\App\Http\Controllers\Admin\SystemUpdateController::class, 'getUpdateHistory'])->name('system.update-history');
    Route::post('/system/force-version-check', [\App\Http\Controllers\Admin\SystemUpdateController::class, 'forceVersionCheck'])->name('system.force-version-check');
    Route::post('/system/fix-and-repair', [\App\Http\Controllers\Admin\SystemUpdateController::class, 'systemFixAndRepair'])
        ->withoutMiddleware([\Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class])
        ->name('system.fix-and-repair');
    Route::get('/system/operation-progress', [\App\Http\Controllers\Admin\SystemUpdateController::class, 'getOperationProgress'])
        ->withoutMiddleware([\Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class])
        ->name('system.operation-progress');
    Route::post('/system/clear-cache-comprehensive', [\App\Http\Controllers\Admin\SystemUpdateController::class, 'clearCacheComprehensive'])->name('system.clear-cache-comprehensive');
    
    // File Upload routes

    // Branding uploads
    Route::post('/upload/site-logo', [\App\Http\Controllers\Admin\FileUploadController::class, 'uploadSiteLogo'])->name('upload.site-logo');
    Route::post('/upload/favicon', [\App\Http\Controllers\Admin\FileUploadController::class, 'uploadFavicon'])->name('upload.favicon');
    Route::get('/debug/upload', [\App\Http\Controllers\Admin\FileUploadController::class, 'debugUpload'])->name('debug.upload');
});

// Installation routes (only accessible if not installed)
Route::middleware('install.check')->prefix('install')->name('install.')->group(function () {
    Route::get('/', [\App\Http\Controllers\InstallController::class, 'index'])->name('index');
    Route::get('/requirements', [\App\Http\Controllers\InstallController::class, 'requirements'])->name('requirements');
    Route::get('/database', [\App\Http\Controllers\InstallController::class, 'database'])->name('database');
    Route::post('/test-database', [\App\Http\Controllers\InstallController::class, 'testDatabase'])->name('test-database');
    Route::post('/install', [\App\Http\Controllers\InstallController::class, 'install'])->name('process');
    Route::get('/complete', [\App\Http\Controllers\InstallController::class, 'complete'])->name('complete');
});

require __DIR__.'/auth.php';

