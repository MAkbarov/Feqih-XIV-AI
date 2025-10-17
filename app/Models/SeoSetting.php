<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class SeoSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'page',
        'title',
        'description',
        'keywords',
        'canonical_url',
        'og_title',
        'og_description',
        'og_image',
        'og_type',
        'twitter_title',
        'twitter_description',
        'twitter_image',
        'twitter_card',
        'custom_meta',
        'schema_markup',
        'noindex',
        'nofollow',
    ];

    protected $casts = [
        'custom_meta' => 'array',
        'schema_markup' => 'array',
        'noindex' => 'boolean',
        'nofollow' => 'boolean',
    ];

    /**
     * Get SEO settings for a specific page
     */
    public static function getForPage(string $page): ?self
    {
        return static::where('page', $page)->first();
    }

    /**
     * Get or create SEO settings for a page
     */
    public static function getOrCreateForPage(string $page): self
    {
        return static::firstOrCreate(['page' => $page], [
            'title' => static::getDefaultTitle($page),
            'description' => static::getDefaultDescription($page),
            'keywords' => static::getDefaultKeywords($page),
        ]);
    }

    /**
     * Get default title for page
     */
    private static function getDefaultTitle(string $page): string
    {
        $titles = [
            'home' => 'XIV AI Fəqih - İslami AI Chatbot Platforması',
            'about' => 'Haqqımızda - XIV AI Fəqih',
            'contact' => 'Əlaqə - XIV AI Fəqih',
            'terms' => 'İstifadə Şərtləri - XIV AI Fəqih',
            'privacy' => 'Məxfilik Siyasəti - XIV AI Fəqih',
            'donation' => 'İanə - XIV AI Fəqih Layihəsini Dəstəklə',
        ];

        return $titles[$page] ?? 'XIV AI Fəqih';
    }

    /**
     * Get default description for page
     */
    private static function getDefaultDescription(string $page): string
    {
        $descriptions = [
            'home' => 'XIV AI Fəqih - İslam dininin fəqih məsələləri üzrə AI əsaslı chatbot. Süni zəka ilə İslami hüquq və fəqih suallarına cavab alın.',
            'about' => 'XIV AI Fəqih haqqında ətraflı məlumat. İslami fəqih sahəsində AI texnologiyasının tətbiqi.',
            'contact' => 'XIV AI Fəqih komandası ilə əlaqə qurun. Suallar və təkliflərinizi bizə çatdırın.',
            'terms' => 'XIV AI Fəqih platformasının istifadə şərtləri və qaydaları.',
            'privacy' => 'XIV AI Fəqih məxfilik siyasəti və şəxsi məlumatların qorunması.',
            'donation' => 'XIV AI Fəqih layihəsini dəstəkləyin və İslami texnoloji inkişafa töhfə verin.',
        ];

        return $descriptions[$page] ?? 'XIV AI Fəqih - İslami AI Chatbot Platforması';
    }

    /**
     * Get default keywords for page
     */
    private static function getDefaultKeywords(string $page): string
    {
        $keywords = [
            'home' => 'XIV AI Fəqih, İslami AI, chatbot, fəqih, İslam hüququ, süni zəka, Azerbaycan, DeXIV',
            'about' => 'XIV AI Fəqih haqqında, İslami texnologiya, AI chatbot',
            'contact' => 'əlaqə, XIV AI Fəqih, dəstək, sual',
            'terms' => 'istifadə şərtləri, XIV AI Fəqih, qaydalar',
            'privacy' => 'məxfilik, şəxsi məlumatlar, XIV AI Fəqih',
            'donation' => 'ianə, dəstək, XIV AI Fəqih, töhfə',
        ];

        return $keywords[$page] ?? 'XIV AI Fəqih, İslami AI, chatbot';
    }

    /**
     * Generate robots meta tag
     */
    public function getRobotsAttribute(): string
    {
        $robots = [];
        
        if ($this->noindex) {
            $robots[] = 'noindex';
        } else {
            $robots[] = 'index';
        }
        
        if ($this->nofollow) {
            $robots[] = 'nofollow';
        } else {
            $robots[] = 'follow';
        }
        
        return implode(', ', $robots);
    }
}