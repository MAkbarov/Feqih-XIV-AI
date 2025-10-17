<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use App\Models\DonationPage;

class DefaultDonationPageSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DonationPage::firstOrCreate(
            ['id' => 1],
            [
                'is_enabled' => false,
                'title' => 'Dəstək Ver',
                'content' => '<p>Layihəmizi dəstəkləmək üçün ianə edə bilərsiniz:</p>

<p><strong>Kart nömrəsi:</strong> 1234 5678 9012 3456</p>
<p><strong>IBAN:</strong> AZ21NABZ00000000137010001944</p>

<p>Hər bir dəstəyiniz bizim üçün çox dəyərlidir! 🙏</p>',
                'placement' => 'sidebar',
                'display_settings' => [
                    'background_color' => '#f0f9ff',
                    'text_color' => '#1f2937',
                    'button_color' => '#3b82f6'
                ],
                'payment_methods' => [
                    'bank_transfer' => [
                        'enabled' => true,
                        'title' => 'Bank Köçürməsi',
                        'description' => 'IBAN: AZ21 NABZ 0123 4567 8901 2345 6789'
                    ],
                    'crypto' => [
                        'enabled' => false,
                        'title' => 'Kripto Valyuta',
                        'description' => 'BTC: 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
                    ],
                    'paypal' => [
                        'enabled' => false,
                        'title' => 'PayPal',
                        'description' => 'donate@example.com'
                    ],
                    'contact' => [
                        'enabled' => true,
                        'title' => 'Əlaqə',
                        'description' => '+994 XX XXX XX XX'
                    ]
                ],
                'custom_texts' => [
                    'payment_methods_title' => 'Dəstək Üsulları',
                    'thank_you_message' => '🙏 Hər hansı məbləğdəki dəstəyinizə görə təşəkkürlər!',
                    'thank_you_description' => 'Sizin köməyiniz sayəsində xidmətimizi daha da yaxşılaşdırırıq.',
                    'back_to_home' => 'Ana Səhifəyə Qayıt'
                ]
            ]
        );
    }
}