<?php

namespace App\Http\Controllers\Admin\Traits;

use App\Models\Settings;

trait HasFooterData
{
    protected function getFooterSettings(): array
    {
        try {
            return [
                'footer_enabled' => (bool) Settings::get('footer_enabled', true),
                'footer_text' => Settings::get('footer_text', '© 2025 XIV AI. Bütün hüquqlar qorunur.'),
                'footer_text_color' => Settings::get('footer_text_color', '#6B7280'),
                'footer_author_text' => Settings::get('footer_author_text', 'Developed by DeXIV'),
                'footer_author_color' => Settings::get('footer_author_color', '#6B7280'),
                'site_name' => Settings::get('site_name', 'XIV AI'),
            ];
        } catch (\Exception $e) {
            return [
                'footer_enabled' => true,
                'footer_text' => '© 2025 XIV AI. Bütün hüquqlar qorunur.',
                'footer_text_color' => '#6B7280',
                'footer_author_text' => 'Developed by DeXIV',
                'footer_author_color' => '#6B7280',
                'site_name' => 'XIV AI',
            ];
        }
    }

    protected function addFooterDataToResponse(array $data): array
    {
        $data['footerSettings'] = $this->getFooterSettings();
        return $data;
    }
}
