# XIV AI - Quraşdırma Təlimatı

## Sistem Tələbləri

- PHP 8.1 və ya yuxarı versiya
- MySQL/MariaDB verilənlər bazası
- OpenSSL, PDO, PDO MySQL, Mbstring, Tokenizer, XML, Ctype, JSON, cURL extension-ları
- Yazma icazəsi: `storage/`, `bootstrap/cache/`
- Node.js və NPM (frontend assets üçün - tövsiyə olunur)

## Quraşdırma Addımları

### 1. Faylları yükləyin
Bütün layihə fayllarını web serverin root qovluğuna kopyalayın.

### 2. Verilənlər bazası yaradın  
MySQL/MariaDB-də yeni verilənlər bazası yaradın.

### 3. İcazələri təyin edin
```bash
chmod -R 755 storage/
chmod -R 755 bootstrap/cache/
```

### 4. Quraşdırma sihirbazını işə salın
Brauzerinizi açıb `http://your-domain.com/install/setup.php` ünvanına daxil olun.

### 5. Addımları izləyin
- **Addım 1**: Sistem tələbləri yoxlanılır
- **Addım 2**: Verilənlər bazası parametrləri
- **Addım 3**: Admin istifadəçi və sayt parametrləri  
- **Addım 4**: Quraşdırmanı başladın

## Nəyə Diqqət Etmək Lazımdır

### Cache və Asset Problemləri
Quraşdırmadan sonra əgər səhifələr düzgün açılmırsa:

1. **"Vite manifest not found" xətası varsa**:
   - Post-Install Fix butonuna basın
   - Və ya manual: `npm install && npm run build`

2. **500 Server xətası varsa**:
   - Laravel loglarını yoxlayın: `storage/logs/laravel.log`
   - Cache-ləri təmizləyin: `php artisan cache:clear`

### NPM/Node.js olmadıqda
Əgər serverdə NPM yoxdursa:
- Yerli mühitdə `npm run build` icra edin
- `public/build/` qovluğunu serverə kopyalayın

### XAMPP İstifadəçiləri
- Database istifadəçi: `root`
- Database şifrə: boş buraxın
- Host: `localhost` və ya `127.0.0.1`

### Məsələ Həlli
1. **Composer packages yoxdursa**: `composer install`
2. **Asset build olmursa**: `npm install && npm run build`  
3. **Cache problemləri**: `php artisan cache:clear`
4. **İcazə problemləri**: `chmod -R 755 storage bootstrap/cache`

## Təhlükəsizlik

Quraşdırmadan sonra `install/` qovluğunu mütlək silin və ya adını dəyişdirin.

Avtomatik silmə işləməzsə:
```bash
rm -rf install/
# və ya 
mv install/ install_backup/
```

## Dəstək

Əgər problemlə rastlaşırsınızsa:
- Laravel loglarını yoxlayın
- Brauzer Developer Console-nu açın
- PHP error loglarını yoxlayın
- Sistem tələblərinin hamısının qarşılandığını təsdiq edin

**XIV AI - v1.0**  
*Müəllif: DeXIV*