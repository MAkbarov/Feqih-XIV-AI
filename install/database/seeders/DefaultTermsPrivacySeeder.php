<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use App\Models\TermsAndPrivacy;

class DefaultTermsPrivacySeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Terms of Service
        TermsAndPrivacy::firstOrCreate(
            ['type' => 'terms'],
            [
                'title' => 'İstifadə Şərtləri',
                'content' => '<h2>1. Xidmət Şərtləri</h2>
<p>Bu platformadan istifadə etməklə, aşağıdaki şərtləri qəbul etmiş olursunuz:</p>

<h3>1.1 Ümumi Şərtlər</h3>
<ul>
<li>Platformadan yalnız qanuni məqsədlər üçün istifadə edin</li>
<li>Digər istifadəçilərə hörmət göstərin</li>
<li>Spam, zərərli və ya uyğunsuz məzmun paylaşmayın</li>
</ul>

<h3>1.2 Məsuliyyət</h3>
<p>AI-nin verdiyi cavablar informativ məqsədlərdir və həmişə dəqiq olmaya bilər. Mühüm qərarlar üçün mütəxəssis məsləhəti alın.</p>

<h2>2. İstifadəçi Öhdəlikləri</h2>
<p>Platformadan düzgün istifadə etmək və qaydaları pozmamanız gözlənilir.</p>',
                'is_active' => true
            ]
        );

        // Privacy Policy
        TermsAndPrivacy::firstOrCreate(
            ['type' => 'privacy'],
            [
                'title' => 'Məxfilik Siyasəti',
                'content' => '<h2>1. Məlumatların Toplanması</h2>
<p>Platformamız aşağıdaki məlumatları toplaya bilər:</p>

<h3>1.1 Şəxsi Məlumatlar</h3>
<ul>
<li>Adınız və e-poçt ünvanınız (qeydiyyat zamanı)</li>
<li>Chat tarixçəniz və mesajlarınız</li>
<li>IP ünvanınız və brauzər məlumatları</li>
</ul>

<h2>2. Məlumatların İstifadəsi</h2>
<p>Toplanan məlumatlar yalnız xidmət keyfiyyətini artırmaq üçün istifadə olunur:</p>
<ul>
<li>Sizə daha yaxşı AI cavabları təqdim etmək</li>
<li>Texniki dəstək göstərmək</li>
<li>Platformanın təhlükəsizliyini təmin etmək</li>
</ul>

<h2>3. Məlumatların Qorunması</h2>
<p>Şəxsi məlumatlarınızın təhlükəsizliyi bizim üçün prioritetdir. Müasir şifrələmə metodları istifadə edirik.</p>

<h2>4. Üçüncü Tərəflər</h2>
<p>Məlumatlarınız üçüncü tərəflərə satılmır və ya paylaşılmır.</p>',
                'is_active' => true
            ]
        );
    }
}