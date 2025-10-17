<?php

namespace App\Services;

use App\Models\AiProvider;
use App\Interfaces\ChatProviderInterface;

class ChatProviderFactory
{
    /**
     * Aktiv AI Provider-dən müvafiq Chat Provider yaradır
     * 
     * @throws \Exception
     */
    public static function createFromActiveProvider(): ChatProviderInterface
    {
        $provider = AiProvider::getActive();

        if (!$provider) {
            throw new \Exception('Aktiv AI provayder tapılmadı. Admin paneldən bir provayder aktivləşdirin.');
        }

        return self::createFromProvider($provider);
    }

    /**
     * Verilmiş provider-dən chat service yaradır
     */
    public static function createFromProvider(AiProvider $provider): ChatProviderInterface
    {
        // Burada hər bir driver üçün chat provider class-ları əlavə olunacaq
        // Hal-hazırda universal OpenAI-compatible provider istifadə edək
        
        // DeepSeekProvider-i OpenAI-compatible olaraq istifadə edə bilərik
        // Çünki DeepSeek OpenAI API formatını dəstəkləyir
        
        // Sadəlik üçün, hamı üçün DeepSeekProvider istifadə edək (o universal OpenAI format işlətir)
        return new DeepSeekProvider();
    }
}
