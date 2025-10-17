<?php

namespace App\Console\Commands;

use App\Services\TrainingService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class TrainText extends Command
{
    protected $signature = 'train:text {title} {content} {--category=general} {--source=Manual} {--language=az}';
    protected $description = 'Train the chatbot with text content';

    public function handle()
    {
        $title = $this->argument('title');
        $content = $this->argument('content');
        $category = $this->option('category');
        $source = $this->option('source');
        $language = $this->option('language');
        
        $this->info("📝 Text Training başlanır...");
        $this->info("📋 Başlıq: {$title}");
        $this->info("📄 Məzmun uzunluğu: " . strlen($content) . " simvol");
        $this->info("🏷️ Kateqoriya: {$category}");
        
        try {
            $trainingService = app(TrainingService::class);
            
            $result = $trainingService->trainFromText($title, $content, [
                'source' => $source,
                'category' => $category,
                'language' => $language
            ]);
            
            $this->info("✅ Məlumat uğurla əlavə edildi!");
            $this->info("🆔 ID: {$result->id}");
            $this->info("📋 Başlıq: {$result->title}");
            $this->info("📄 Məzmun: " . substr($result->content, 0, 100) . "...");
            
        } catch (\Exception $e) {
            $this->error("❌ Xəta baş verdi: " . $e->getMessage());
            Log::error('Text training error', [
                'title' => $title,
                'error' => $e->getMessage()
            ]);
        }
        
        return 0;
    }
}
