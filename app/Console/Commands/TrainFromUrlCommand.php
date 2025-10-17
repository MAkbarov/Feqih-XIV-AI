<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\TrainingService;
use Illuminate\Support\Facades\Log;

class TrainFromUrlCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'train:url {url} {--category=imported} {--single=true}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Train chatbot from URL content';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $url = $this->argument('url');
        $category = $this->option('category');
        $single = $this->option('single');
        
        $this->info("🚀 URL Training başlanır: {$url}");
        $this->info("Kategoriya: {$category}");
        
        try {
            $trainingService = new TrainingService();
            
            $result = $trainingService->trainFromUrl($url, [
                'single' => $single === 'true',
                'category' => $category,
                'source' => 'Console Command',
                'language' => 'az'
            ]);
            
            if ($result['success']) {
                $this->info("✅ Training uğurla tamamlandı!");
                $this->info("Trained pages: {$result['trained_pages']}");
            } else {
                $this->error("❌ Training uğursuz oldu!");
            }
            
        } catch (\Exception $e) {
            $this->error("❌ Xəta baş verdi: {$e->getMessage()}");
            Log::error('Console URL training error', [
                'url' => $url,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }
    }
}

