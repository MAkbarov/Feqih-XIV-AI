<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\TrainingServiceEnhanced;
use App\Services\EmbeddingService;
use App\Models\KnowledgeBase;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class UpgradeTrainingService extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'training:upgrade {--fix-encoding : Fix encoding issues in existing data} {--reimport-url= : Re-import specific URL with enhanced service}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Upgrade the training service to enhanced version with better encoding and extraction';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🚀 Training Service Upgrade Tool');
        $this->info('=================================');
        
        if ($this->option('fix-encoding')) {
            $this->fixExistingEncoding();
        }
        
        if ($url = $this->option('reimport-url')) {
            $this->reimportUrl($url);
        }
        
        if (!$this->option('fix-encoding') && !$this->option('reimport-url')) {
            $this->showMenu();
        }
        
        return Command::SUCCESS;
    }
    
    /**
     * Show interactive menu
     */
    protected function showMenu()
    {
        $choice = $this->choice(
            'What would you like to do?',
            [
                '1' => 'Fix encoding issues in existing knowledge base',
                '2' => 'Re-import a specific URL with enhanced extraction',
                '3' => 'Test enhanced service with a URL',
                '4' => 'Show statistics',
                '5' => 'Exit'
            ],
            '5'
        );
        
        switch ($choice) {
            case '1':
                $this->fixExistingEncoding();
                break;
            case '2':
                $url = $this->ask('Enter the URL to re-import');
                if ($url) {
                    $this->reimportUrl($url);
                }
                break;
            case '3':
                $url = $this->ask('Enter URL to test');
                if ($url) {
                    $this->testEnhancedService($url);
                }
                break;
            case '4':
                $this->showStatistics();
                break;
            case '5':
                $this->info('Goodbye!');
                break;
        }
    }
    
    /**
     * Fix encoding issues in existing data
     */
    protected function fixExistingEncoding()
    {
        $this->info('🔧 Fixing encoding issues in existing knowledge base...');
        
        $items = KnowledgeBase::all();
        $fixed = 0;
        $failed = 0;
        
        $bar = $this->output->createProgressBar(count($items));
        $bar->start();
        
        foreach ($items as $item) {
            try {
                $originalContent = $item->content;
                $originalTitle = $item->title;
                
                // Fix content encoding
                $fixedContent = $this->fixEncodingIssues($originalContent);
                $fixedTitle = $this->fixEncodingIssues($originalTitle);
                
                // Check if anything changed
                if ($fixedContent !== $originalContent || $fixedTitle !== $originalTitle) {
                    $item->content = $fixedContent;
                    $item->title = $fixedTitle;
                    
                    // Update metadata
                    $metadata = $item->metadata ?? [];
                    $metadata['encoding_fixed'] = true;
                    $metadata['encoding_fixed_at'] = now()->toISOString();
                    $item->metadata = $metadata;
                    
                    $item->save();
                    $fixed++;
                    
                    Log::info('Encoding fixed for item', [
                        'id' => $item->id,
                        'title' => $fixedTitle
                    ]);
                }
                
            } catch (\Exception $e) {
                $failed++;
                Log::error('Failed to fix encoding', [
                    'id' => $item->id,
                    'error' => $e->getMessage()
                ]);
            }
            
            $bar->advance();
        }
        
        $bar->finish();
        $this->newLine();
        
        $this->info("✅ Encoding fix complete!");
        $this->info("   Fixed: {$fixed} items");
        $this->info("   Failed: {$failed} items");
        $this->info("   Total: " . count($items) . " items");
    }
    
    /**
     * Fix encoding issues in text
     */
    protected function fixEncodingIssues(string $text): string
    {
        if (empty($text)) {
            return '';
        }
        
        // Common Azerbaijani mojibake patterns
        $replacements = [
            'Ã¶' => 'ö',
            'Ã§' => 'ç',
            'Ã¼' => 'ü',
            'Ä±' => 'ı',
            'Åŧ' => 'ş',
            'ÄŸ' => 'ğ',
            'Ä°' => 'İ',
            'Ã‡' => 'Ç',
            'Ã–' => 'Ö',
            'Ãœ' => 'Ü',
            'Åž' => 'Ş',
            'Äž' => 'Ğ',
            'É™' => 'ə',
            'Æ' => 'Ə',
            'Ã¤' => 'ə',
            '�' => '',
            '□' => '',
            '■' => '',
        ];
        
        $text = str_replace(array_keys($replacements), array_values($replacements), $text);
        
        // Remove control characters
        $text = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $text);
        
        // Ensure valid UTF-8
        if (!mb_check_encoding($text, 'UTF-8')) {
            $text = @iconv('UTF-8', 'UTF-8//IGNORE', $text);
        }
        
        return $text;
    }
    
    /**
     * Re-import URL with enhanced service
     */
    protected function reimportUrl(string $url)
    {
        $this->info("🌐 Re-importing URL: {$url}");
        
        try {
            // Check if URL exists in database
            $existing = KnowledgeBase::where('source_url', $url)->first();
            
            if ($existing) {
                $this->warn("URL already exists in database (ID: {$existing->id})");
                if (!$this->confirm('Do you want to update it with enhanced extraction?')) {
                    return;
                }
            }
            
            // Use enhanced service
            $embedding = app(EmbeddingService::class);
            $service = new TrainingServiceEnhanced($embedding);
            
            $single = $this->confirm('Import as single page?', true);
            
            $this->info('Starting enhanced import...');
            
            $result = $service->trainFromUrl($url, [
                'single' => $single,
                'max_depth' => $single ? 1 : 3,
                'max_pages' => $single ? 1 : 100,
                'category' => 'enhanced_import',
                'source' => 'Enhanced CLI Import'
            ]);
            
            if ($result['success']) {
                $this->info("✅ Successfully imported {$result['trained_pages']} page(s)");
                
                // Show imported content details
                foreach ($result['results'] as $item) {
                    $this->info("   - {$item->title}");
                    $this->info("     Content length: " . strlen($item->content) . " chars");
                    $this->info("     Quality: " . ($item->metadata['content_quality'] ?? 'N/A'));
                }
            } else {
                $this->error('Import failed!');
            }
            
        } catch (\Exception $e) {
            $this->error('Error: ' . $e->getMessage());
            Log::error('URL reimport failed', [
                'url' => $url,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }
    }
    
    /**
     * Test enhanced service
     */
    protected function testEnhancedService(string $url)
    {
        $this->info("🧪 Testing enhanced service with URL: {$url}");
        
        try {
            $embedding = app(EmbeddingService::class);
            $service = new TrainingServiceEnhanced($embedding);
            
            // Test fetch
            $this->info('Testing content fetch...');
            $content = $this->callProtectedMethod($service, 'fetchContentEnhanced', [$url]);
            
            if ($content) {
                $this->info('✅ Content fetched successfully');
                $this->info('   Size: ' . strlen($content) . ' bytes');
                
                // Test processing
                $this->info('Testing content processing...');
                $processed = $this->callProtectedMethod($service, 'processContentEnhanced', [$content, $url]);
                
                $this->info('✅ Content processed successfully');
                $this->info('   Title: ' . $processed['title']);
                $this->info('   Content length: ' . strlen($processed['content']) . ' chars');
                $this->info('   Language: ' . ($processed['metadata']['language'] ?? 'N/A'));
                
                // Check for Azerbaijani characters
                $azCount = preg_match_all('/[əƏçÇğĞıIiİöÖşŞüÜ]/u', $processed['content']);
                $this->info('   Azerbaijani characters found: ' . $azCount);
                
                // Show content preview
                if ($this->confirm('Show content preview?')) {
                    $preview = mb_substr($processed['content'], 0, 500);
                    $this->info("\nContent preview:\n" . $preview . '...');
                }
                
            } else {
                $this->error('Failed to fetch content');
            }
            
        } catch (\Exception $e) {
            $this->error('Test failed: ' . $e->getMessage());
        }
    }
    
    /**
     * Show database statistics
     */
    protected function showStatistics()
    {
        $this->info('📊 Knowledge Base Statistics');
        $this->info('============================');
        
        $total = KnowledgeBase::count();
        $active = KnowledgeBase::where('is_active', true)->count();
        $urls = KnowledgeBase::whereNotNull('source_url')->count();
        $manualEntries = KnowledgeBase::whereNull('source_url')->count();
        
        // Check for encoding issues
        $mojibakeCount = KnowledgeBase::where('content', 'LIKE', '%Ã%')
            ->orWhere('content', 'LIKE', '%É™%')
            ->orWhere('content', 'LIKE', '%Ä%')
            ->orWhere('content', 'LIKE', '%�%')
            ->count();
            
        // Content quality distribution
        $qualityStats = DB::table('knowledge_base')
            ->selectRaw("JSON_EXTRACT(metadata, '$.content_quality') as quality, COUNT(*) as count")
            ->groupBy('quality')
            ->get();
        
        $this->info("Total entries: {$total}");
        $this->info("Active entries: {$active}");
        $this->info("URL imports: {$urls}");
        $this->info("Manual entries: {$manualEntries}");
        $this->info("Potential encoding issues: {$mojibakeCount}");
        
        $this->newLine();
        $this->info('Content Quality Distribution:');
        foreach ($qualityStats as $stat) {
            $quality = str_replace('"', '', $stat->quality ?? 'unknown');
            $this->info("  {$quality}: {$stat->count}");
        }
        
        // Recent imports
        $recent = KnowledgeBase::orderBy('created_at', 'desc')->take(5)->get();
        $this->newLine();
        $this->info('Recent imports:');
        foreach ($recent as $item) {
            $this->info("  - [{$item->created_at->format('Y-m-d H:i')}] {$item->title}");
        }
    }
    
    /**
     * Call protected method for testing
     */
    protected function callProtectedMethod($obj, $method, array $args)
    {
        $reflection = new \ReflectionMethod(get_class($obj), $method);
        $reflection->setAccessible(true);
        return $reflection->invokeArgs($obj, $args);
    }
}