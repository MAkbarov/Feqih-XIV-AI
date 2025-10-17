<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SeoSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Http\Controllers\Admin\Traits\HasFooterData;

class SeoController extends Controller
{
    use HasFooterData;

    /**
     * Display SEO panel
     */
    public function index()
    {
        $pages = [
            'home' => 'Ana Səhifə',
            'about' => 'Haqqımızda', 
            'contact' => 'Əlaqə',
            'terms' => 'İstifadə Şərtləri',
            'privacy' => 'Məxfilik Siyasəti',
            'donation' => 'İanə',
        ];

        $seoSettings = [];
        foreach ($pages as $page => $name) {
            $seoSettings[$page] = SeoSetting::getOrCreateForPage($page);
        }

        return Inertia::render('Admin/SeoPanel', $this->addFooterDataToResponse([
            'pages' => $pages,
            'seoSettings' => $seoSettings,
        ]));
    }

    /**
     * Update SEO settings for specific page
     */
    public function update(Request $request, string $page)
    {
        $request->validate([
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:1000',
            'keywords' => 'nullable|string|max:1000',
            'canonical_url' => 'nullable|string|max:500',
            'og_title' => 'nullable|string|max:255',
            'og_description' => 'nullable|string|max:1000',
            'og_image' => 'nullable|string|max:500',
            'og_type' => 'nullable|string|max:50',
            'twitter_title' => 'nullable|string|max:255',
            'twitter_description' => 'nullable|string|max:1000',
            'twitter_image' => 'nullable|string|max:500',
            'twitter_card' => 'nullable|string|max:50',
            'custom_meta' => 'nullable|array',
            'schema_markup' => 'nullable|array',
            'noindex' => 'boolean',
            'nofollow' => 'boolean',
        ]);

        $seoSetting = SeoSetting::getOrCreateForPage($page);
        $seoSetting->update($request->all());

        return response()->json([
            'success' => true,
            'message' => $page . ' səhifəsi üçün SEO tənzimləri yeniləndi',
            'seoSetting' => $seoSetting->fresh(),
        ]);
    }

    /**
     * Get SEO settings for specific page
     */
    public function show(string $page)
    {
        $seoSetting = SeoSetting::getOrCreateForPage($page);
        
        return response()->json([
            'success' => true,
            'seoSetting' => $seoSetting,
        ]);
    }

    /**
     * Generate sitemap.xml
     */
    public function generateSitemap()
    {
        try {
            $baseUrl = config('app.url');
            $pages = [
                'home' => ['url' => '/', 'priority' => '1.0', 'changefreq' => 'daily'],
                'about' => ['url' => '/about', 'priority' => '0.8', 'changefreq' => 'monthly'],
                'contact' => ['url' => '/contact', 'priority' => '0.7', 'changefreq' => 'monthly'],
                'terms' => ['url' => '/terms', 'priority' => '0.5', 'changefreq' => 'yearly'],
                'privacy' => ['url' => '/privacy', 'priority' => '0.5', 'changefreq' => 'yearly'],
                'donation' => ['url' => '/donation', 'priority' => '0.9', 'changefreq' => 'weekly'],
            ];

            $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
            $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";

            foreach ($pages as $page => $config) {
                $seoSetting = SeoSetting::getForPage($page);
                
                // Skip if page is marked as noindex
                if ($seoSetting && $seoSetting->noindex) {
                    continue;
                }

                $xml .= '  <url>' . "\n";
                $xml .= '    <loc>' . $baseUrl . $config['url'] . '</loc>' . "\n";
                $xml .= '    <lastmod>' . now()->toISOString() . '</lastmod>' . "\n";
                $xml .= '    <changefreq>' . $config['changefreq'] . '</changefreq>' . "\n";
                $xml .= '    <priority>' . $config['priority'] . '</priority>' . "\n";
                $xml .= '  </url>' . "\n";
            }

            $xml .= '</urlset>';

            // Save sitemap to public directory
            $sitemapPath = public_path('sitemap.xml');
            file_put_contents($sitemapPath, $xml);

            return response()->json([
                'success' => true,
                'message' => 'Sitemap uğurla yaradıldı',
                'url' => $baseUrl . '/sitemap.xml'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Sitemap yaradılarkən xəta: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate robots.txt
     */
    public function generateRobots()
    {
        try {
            $baseUrl = config('app.url');
            
            $robots = "User-agent: *\n";
            $robots .= "Allow: /\n\n";
            
            // Add disallowed paths
            $disallowPaths = [
                '/admin',
                '/admin/*',
                '/_debugbar',
                '/api/test*',
                '/storage/logs',
            ];
            
            foreach ($disallowPaths as $path) {
                $robots .= "Disallow: $path\n";
            }
            
            $robots .= "\n# Sitemap\n";
            $robots .= "Sitemap: $baseUrl/sitemap.xml\n";

            // Save robots.txt to public directory
            $robotsPath = public_path('robots.txt');
            file_put_contents($robotsPath, $robots);

            return response()->json([
                'success' => true,
                'message' => 'Robots.txt uğurla yaradıldı',
                'url' => $baseUrl . '/robots.txt'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Robots.txt yaradılarkən xəta: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * SEO analysis for a page
     */
    public function analyzePage(string $page)
    {
        $seoSetting = SeoSetting::getOrCreateForPage($page);
        
        $analysis = [
            'score' => 0,
            'issues' => [],
            'suggestions' => [],
            'good_points' => [],
        ];

        // Title analysis
        if (empty($seoSetting->title)) {
            $analysis['issues'][] = 'Title təyin edilməyib';
        } elseif (strlen($seoSetting->title) < 30) {
            $analysis['issues'][] = 'Title çox qısadır (minimum 30 simvol tövsiyə edilir)';
        } elseif (strlen($seoSetting->title) > 60) {
            $analysis['issues'][] = 'Title çox uzundur (maksimum 60 simvol tövsiyə edilir)';
        } else {
            $analysis['good_points'][] = 'Title optimal uzunluqdadır';
            $analysis['score'] += 20;
        }

        // Description analysis
        if (empty($seoSetting->description)) {
            $analysis['issues'][] = 'Meta description təyin edilməyib';
        } elseif (strlen($seoSetting->description) < 120) {
            $analysis['issues'][] = 'Meta description çox qısadır (minimum 120 simvol tövsiyə edilir)';
        } elseif (strlen($seoSetting->description) > 160) {
            $analysis['issues'][] = 'Meta description çox uzundur (maksimum 160 simvol tövsiyə edilir)';
        } else {
            $analysis['good_points'][] = 'Meta description optimal uzunluqdadır';
            $analysis['score'] += 20;
        }

        // Keywords analysis
        if (empty($seoSetting->keywords)) {
            $analysis['suggestions'][] = 'Açar sözlər əlavə edin';
        } else {
            $keywords = explode(',', $seoSetting->keywords);
            if (count($keywords) > 10) {
                $analysis['suggestions'][] = 'Çox açar söz istifadə etməyin (maksimum 10 tövsiyə edilir)';
            } else {
                $analysis['good_points'][] = 'Açar sözlər sayı optimal';
                $analysis['score'] += 15;
            }
        }

        // Open Graph analysis
        if (!empty($seoSetting->og_title) && !empty($seoSetting->og_description)) {
            $analysis['good_points'][] = 'Open Graph məlumatları tam';
            $analysis['score'] += 15;
        } else {
            $analysis['suggestions'][] = 'Open Graph məlumatlarını tamamlayın';
        }

        // Twitter Card analysis
        if (!empty($seoSetting->twitter_title) && !empty($seoSetting->twitter_description)) {
            $analysis['good_points'][] = 'Twitter Card məlumatları tam';
            $analysis['score'] += 15;
        } else {
            $analysis['suggestions'][] = 'Twitter Card məlumatlarını tamamlayın';
        }

        // Canonical URL analysis
        if (!empty($seoSetting->canonical_url)) {
            $analysis['good_points'][] = 'Canonical URL təyin edilib';
            $analysis['score'] += 15;
        } else {
            $analysis['suggestions'][] = 'Canonical URL təyin edin';
        }

        return response()->json([
            'success' => true,
            'analysis' => $analysis,
            'page' => $page,
        ]);
    }
}