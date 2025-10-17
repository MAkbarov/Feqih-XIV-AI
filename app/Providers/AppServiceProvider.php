<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use App\Models\Settings;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // ==================== RAG SYSTEM BINDINGS ====================
        
        // Bind EmbeddingProviderInterface - Dinamik olaraq aktiv provider-dən yaradır
        $this->app->singleton(\App\Interfaces\EmbeddingProviderInterface::class, function ($app) {
            return new \App\Services\UniversalEmbeddingProvider();
        });
        
        // Bind ChatProviderInterface - Dinamik olaraq aktiv provider-dən yaradır
        $this->app->singleton(\App\Interfaces\ChatProviderInterface::class, function ($app) {
            return new \App\Services\UniversalChatProvider();
        });
        
        // Bind VectorStoreInterface to PineconeVectorStore
        $this->app->singleton(\App\Interfaces\VectorStoreInterface::class, function ($app) {
            return new \App\Services\PineconeVectorStore();
        });
        
        // Register RAGQueryService
        $this->app->singleton(\App\Services\RAGQueryService::class, function ($app) {
            return new \App\Services\RAGQueryService(
                $app->make(\App\Interfaces\EmbeddingProviderInterface::class),
                $app->make(\App\Interfaces\ChatProviderInterface::class),
                $app->make(\App\Interfaces\VectorStoreInterface::class)
            );
        });
        
        // ==================== LEGACY SERVICES ====================
        
        // Register EmbeddingService first (no dependencies)
        $this->app->singleton(\App\Services\EmbeddingService::class, function ($app) {
            return new \App\Services\EmbeddingService();
        });
        
        // Register TrainingService (needs EmbeddingService, but not AiService)
        $this->app->singleton(\App\Services\TrainingService::class, function ($app) {
            $embeddingService = $app->make(\App\Services\EmbeddingService::class);
            return new \App\Services\TrainingService($embeddingService, null); // AiService optional
        });
        
        // Register AiService last (needs TrainingService and EmbeddingService)
        $this->app->singleton(\App\Services\AiService::class, function ($app) {
            $trainingService = $app->make(\App\Services\TrainingService::class);
            $embeddingService = $app->make(\App\Services\EmbeddingService::class);
            return new \App\Services\AiService($trainingService, $embeddingService);
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        // Apply mail settings from database (runtime override)
        try {
            $default = Settings::get('mail_mailer', config('mail.default', 'smtp'));
            $host = Settings::get('mail_host', config('mail.mailers.smtp.host'));
            $port = (int) Settings::get('mail_port', config('mail.mailers.smtp.port'));
            $username = Settings::get('mail_username', config('mail.mailers.smtp.username'));
            $password = Settings::get('mail_password', config('mail.mailers.smtp.password'));
            $encryption = Settings::get('mail_encryption', config('mail.mailers.smtp.scheme'));
            $fromAddr = Settings::get('mail_from_address', config('mail.from.address'));
            $fromName = Settings::get('mail_from_name', config('mail.from.name'));

            if ($default) config(['mail.default' => $default]);
            if ($host) config(['mail.mailers.smtp.host' => $host]);
            if ($port) config(['mail.mailers.smtp.port' => $port]);
            if ($username !== null) config(['mail.mailers.smtp.username' => $username]);
            if ($password !== null) config(['mail.mailers.smtp.password' => $password]);
            if ($encryption && $encryption !== 'none') config(['mail.mailers.smtp.scheme' => $encryption]);
            if ($fromAddr) config(['mail.from.address' => $fromAddr]);
            if ($fromName) config(['mail.from.name' => $fromName]);
        } catch (\Throwable $e) {
            // Ignore runtime config errors to avoid blocking app
        }
    }
}

