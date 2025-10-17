<?php

namespace App\Console\Commands;

use App\Models\KnowledgeBase;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class ShowKnowledgeBase extends Command
{
    protected $signature = 'knowledge:show';
    protected $description = 'Show all knowledge base entries with their sources';

    public function handle()
    {
        $this->info("🗂️  Bilik Bazasının Mövcud Məzmunu");
        $this->info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        
        $items = KnowledgeBase::orderBy('created_at', 'desc')->get();
        
        if ($items->isEmpty()) {
            $this->warn("❌ Bilik bazasında heç bir məlumat tapılmadı!");
            return 0;
        }
        
        $this->info("📊 Ümumi məlumat sayı: " . $items->count());
        $this->info("✅ Aktiv məlumatlar: " . $items->where('is_active', true)->count());
        $this->info("❌ Deaktiv məlumatlar: " . $items->where('is_active', false)->count());
        $this->info("");
        
        // Group by source type - prioritize URL field over source text
        $urlItems = $items->filter(function($item) {
            return !empty($item->source_url) && filter_var($item->source_url, FILTER_VALIDATE_URL);
        });
        
        $qaItems = $items->filter(function($item) {
            return $item->category === 'qa' || 
                   (strpos(strtolower($item->source ?? ''), 'q&a') !== false) ||
                   (strpos(strtolower($item->source ?? ''), 'sual') !== false);
        });
        
        $manualItems = $items->filter(function($item) {
            $hasValidUrl = !empty($item->source_url) && filter_var($item->source_url, FILTER_VALIDATE_URL);
            $isQA = $item->category === 'qa' || 
                   (strpos(strtolower($item->source ?? ''), 'q&a') !== false) ||
                   (strpos(strtolower($item->source ?? ''), 'sual') !== false);
                   
            return !$hasValidUrl && !$isQA;
        });
        
        if ($urlItems->count() > 0) {
            $this->info("🔗 URL Mənbələr (" . $urlItems->count() . " ədəd):");
            foreach ($urlItems as $item) {
                $status = $item->is_active ? '✅' : '❌';
                $this->line("  {$status} ID:{$item->id} | {$item->title}");
                $this->line("      📍 URL: {$item->source_url}");
                $this->line("      📂 Kateqoriya: {$item->category}");
                $this->line("      📖 Məzmun: " . Str::limit($item->content, 80));
                $this->line("");
            }
        }
        
        if ($qaItems->count() > 0) {
            $this->info("❓ Q&A Mənbələr (" . $qaItems->count() . " ədəd):");
            foreach ($qaItems as $item) {
                $status = $item->is_active ? '✅' : '❌';
                $this->line("  {$status} ID:{$item->id} | Sual: {$item->title}");
                $this->line("      💬 Mənbə: {$item->source}");
                $this->line("      📂 Kateqoriya: {$item->category}");
                $this->line("      📝 Cavab: " . Str::limit($item->content, 80));
                $this->line("");
            }
        }
        
        if ($manualItems->count() > 0) {
            $this->info("📝 Manual/Ümumi Mənbələr (" . $manualItems->count() . " ədəd):");
            foreach ($manualItems as $item) {
                $status = $item->is_active ? '✅' : '❌';
                $this->line("  {$status} ID:{$item->id} | {$item->title}");
                $this->line("      📍 Mənbə: {$item->source}");
                $this->line("      📂 Kateqoriya: {$item->category}");
                $this->line("      📖 Məzmun: " . Str::limit($item->content, 80));
                $this->line("");
            }
        }
        
        $this->info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        $this->info("🔍 Prioritet sırası (AI cavablarında):");
        $this->info("  1️⃣ URL mənbələr (ən yüksək prioritet)");
        $this->info("  2️⃣ Q&A sual-cavab cütləri");
        $this->info("  3️⃣ Manual/ümumi məlumatlar (ən aşağı prioritet)");
        
        return 0;
    }
}
