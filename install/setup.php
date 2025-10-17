<?php
/**
 * XIV AI - Setup Wizard
 * Versiya 1.0 • Müəllif: DeXIV
 */

// Check if system is already installed
function checkIfInstalled() {
    $basePath = dirname(__DIR__);
    $lockFile = $basePath . '/storage/installed.lock';
    
    // First check: lock file exists
    if (file_exists($lockFile)) {
        return ['installed' => true, 'method' => 'lock_file', 'lock_content' => file_get_contents($lockFile)];
    }
    
    // Second check: try to connect to database and check admin user
    $envPath = $basePath . '/.env';
    if (file_exists($envPath)) {
        $envContent = file_get_contents($envPath);
        if (preg_match('/DB_HOST\s*=\s*(.+)/m', $envContent, $hostMatch) &&
            preg_match('/DB_DATABASE\s*=\s*(.+)/m', $envContent, $dbMatch) &&
            preg_match('/DB_USERNAME\s*=\s*(.+)/m', $envContent, $userMatch)) {
            
            $host = trim($hostMatch[1]);
            $dbname = trim($dbMatch[1]);
            $username = trim($userMatch[1]);
            $password = '';
            
            if (preg_match('/DB_PASSWORD\s*=\s*"?(.*)"?/m', $envContent, $passMatch)) {
                $password = trim($passMatch[1], '"');
            }
            
            try {
                $pdo = new PDO("mysql:host={$host};dbname={$dbname};charset=utf8mb4", $username, $password);
                $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                
                // Check if admin user exists
                $stmt = $pdo->prepare("SELECT id, name, email FROM users WHERE email = 'admin@dexiv.me' OR role_id = 1 LIMIT 1");
                $stmt->execute();
                $adminUser = $stmt->fetch();
                
                if ($adminUser) {
                    return ['installed' => true, 'method' => 'admin_user_exists', 'admin_user' => $adminUser];
                }
            } catch (Exception $e) {
                // Database connection failed, probably not installed
            }
        }
    }
    
    return ['installed' => false];
}

// Check installation status for GET requests only
$installStatus = checkIfInstalled();
if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $installStatus['installed']) {
    // System is already installed, show message and redirect
    if (!isset($_GET['force'])) {
        echo '<!DOCTYPE html>
<html lang="az">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>XIV AI - Artıq Quraşdırılmış</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50 flex items-center justify-center">
    <div class="bg-white/90 backdrop-blur rounded-2xl shadow-2xl p-8 max-w-md w-full border border-gray-200 text-center">
        <div class="text-6xl mb-4">🎉</div>
        <h1 class="text-2xl font-bold text-gray-800 mb-4">XIV AI artıq quraşdırılmış!</h1>
        <p class="text-gray-600 mb-6">Sistem artıq quraşdırılmış və istifadəyə hazırdır.</p>
        <div class="space-y-3">
            <a href="../" class="block w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-xl transition-colors">
                Ana səhifəyə keç
            </a>
            <a href="../admin" class="block w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl transition-colors">
                Admin panelinə keç
            </a>
        </div>
        <div class="mt-6 text-xs text-gray-500">
            Quraşdırılma tarixi: ' . (isset($installStatus['lock_content']) ? $installStatus['lock_content'] : 'Naməlum') . '<br>
            Metodla: ' . $installStatus['method'] . '
        </div>
        <p class="text-xs text-gray-400 mt-4">
            Yenidən quraşdırmaq istəyirsinizsə? <a href="?force=1" class="text-red-500 hover:underline">Məcburi quraşdırma</a>
        </p>
    </div>
</body>
</html>';
        exit;
    } elseif ($_GET['force'] === '1') {
        // Force install requested, show warning
        echo '<!DOCTYPE html>
<html lang="az">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>XIV AI - Məcburi Quraşdırma</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center">
    <div class="bg-white/90 backdrop-blur rounded-2xl shadow-2xl p-8 max-w-lg w-full border border-red-200 text-center">
        <div class="text-6xl mb-4">⚠️</div>
        <h1 class="text-2xl font-bold text-red-800 mb-4">Xəbərdarlıq: Məcburi Yenidən Quraşdırma</h1>
        <p class="text-red-600 mb-6">Bu sistem artıq quraşdırılmışdır. Yenidən quraşdırmaq bütün məlumatları silə bilər!</p>
        <div class="space-y-3">
            <a href="../" class="block w-full bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-xl transition-colors">
                Təhlükəsiz yol: Ana səhifəyə qayıt
            </a>
            <a href="?force=confirm" class="block w-full bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-xl transition-colors">
                Yenə də davam et (Təhlükəli)
            </a>
        </div>
    </div>
</body>
</html>';
        exit;
    }
    // If force=confirm, continue with installation (no exit)
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    header('Content-Type: application/json');
    
    switch ($_POST['action']) {
        case 'check_requirements':
            echo json_encode(checkRequirements());
            break;
            
        case 'test_database':
            echo json_encode(testDatabase($_POST));
            break;
            
        case 'install':
            echo json_encode(performInstallation($_POST));
            break;
        
        case 'post_install_fix':
            echo json_encode(performPostInstallFix());
            break;
    }
    exit;
}

function checkRequirements() {
    $requirements = [
        'php_version' => version_compare(PHP_VERSION, '8.1.0', '>='),
        'openssl' => extension_loaded('openssl'),
        'pdo' => extension_loaded('pdo'),
        'pdo_mysql' => extension_loaded('pdo_mysql'),
        'mbstring' => extension_loaded('mbstring'),
        'tokenizer' => extension_loaded('tokenizer'),
        'xml' => extension_loaded('xml'),
        'ctype' => extension_loaded('ctype'),
        'json' => extension_loaded('json'),
        'curl' => extension_loaded('curl'),
        'storage_writable' => is_writable(dirname(__DIR__) . '/storage'),
        'bootstrap_writable' => is_writable(dirname(__DIR__) . '/bootstrap/cache'),
        'env_writable' => is_writable(dirname(__DIR__)) || !file_exists(dirname(__DIR__) . '/.env'),
    ];
    
    $allPassed = true;
    foreach ($requirements as $req) {
        if (!$req) {
            $allPassed = false;
            break;
        }
    }
    
    return ['success' => $allPassed, 'requirements' => $requirements];
}

function normalizeDbCreds(array $data): array {
    $host = $data['db_host'] ?? '127.0.0.1';
    $port = $data['db_port'] ?? '3306';
    $name = $data['db_database'] ?? ($data['db_name'] ?? '');
    // Username: default to root if empty/missing
    $user = isset($data['db_username']) && $data['db_username'] !== '' ? $data['db_username'] : 'root';
    // Password: FORCE empty string when missing/empty (important for XAMPP)
    $pass = isset($data['db_password']) && $data['db_password'] !== null ? (string)$data['db_password'] : '';
    return [$host, $port, $name, $user, $pass];
}

function testDatabase($data) {
    try {
        list($host, $port, $dbname, $user, $password) = normalizeDbCreds($data);
        $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4";
        $pdo = new PDO($dsn, $user, $password, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        ]);
        return ['success' => true];
    } catch (Exception $e) {
        return ['success' => false, 'error' => $e->getMessage()];
    }
}

function performInstallation($data) {
    try {
        $basePath = dirname(__DIR__);
        
        // Check if this is a forced installation
        $isForceInstall = isset($_GET['force']) && $_GET['force'] === 'confirm';
        
        // If not forced install, check if already installed
        if (!$isForceInstall) {
            $installStatus = checkIfInstalled();
            if ($installStatus['installed']) {
                throw new Exception('Sistem artıq quraşdırılmışdır. Məcburi quraşdırma üçün ?force=confirm parametrini istifadə edin.');
            }
        }
        
        // 1. Create .env file
        $envContent = generateEnvContent($data);
        if (!file_put_contents($basePath . '/.env', $envContent)) {
            throw new Exception('.env faylı yaradıla bilmədi');
        }
        
        // DB bağlantısı (XAMPP üçün şifrəsiz istifadəyə icazə ver)
        list($host, $port, $dbname, $user, $password) = normalizeDbCreds($data);
        $pdo = new PDO(
            "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4",
            $user,
            $password,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );
        
        // 3. Run all migrations
        runAllMigrations($pdo);
        
        // 4. Create admin user
        $adminResult = createAdminUser($pdo, $data);
        
        // 5. Seed default data
        seedDefaultData($pdo);
        
        // 6. Set permissions
        setDirectoryPermissions($basePath);
        
        // 7. Create install lock
        $lockContent = date('Y-m-d H:i:s');
        if (!file_put_contents($basePath . '/storage/installed.lock', $lockContent)) {
            throw new Exception('Quraşdırma kilid faylı yaradıla bilmədi');
        }
        
        // 8. Post-install fix inline (APP_KEY, cache cleanup, asset building)
        $postFixResult = performPostInstallFix();
        $postFixMessage = '';
        if (!$postFixResult['success']) {
            // Don't fail installation for post-fix issues, just log and inform
            $postFixMessage = 'Xəbərdarlıq: Post-install fix uğursuz (' . $postFixResult['error'] . '). Manual cache təmizləməsi lazım ola bilər.';
            error_log('Post-install fix warning: ' . $postFixResult['error']);
        } else {
            $postFixMessage = $postFixResult['message'] ?? 'Cache və asset düzəlişi tamamlandı.';
        }
        
        return [
            'success' => true, 
            'message' => 'Quraşdırma uğurla tamamlandı!',
            'admin_status' => $adminResult,
            'lock_file' => $lockContent,
            'post_fix_message' => $postFixMessage,
            'post_fix_success' => $postFixResult['success']
        ];
        
    } catch (Exception $e) {
        // Detailed error logging
        $errorDetails = [
            'message' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => $e->getTraceAsString()
        ];
        
        // Log to file for debugging
        error_log('Installation Error: ' . json_encode($errorDetails));
        
        return [
            'success' => false, 
            'error' => 'Quraşdırma xətası: ' . $e->getMessage(),
            'debug_info' => $errorDetails
        ];
    }
}

function generateEnvContent($data) {
    $appKey = 'base64:' . base64_encode(random_bytes(32));
    
    // Safely get values with defaults
    $appName = $data['app_name'] ?? 'XIV AI';
    $appUrl = $data['app_url'] ?? 'http://localhost';
    $dbHost = $data['db_host'] ?? 'localhost';
    $dbPort = $data['db_port'] ?? '3306';
    $dbDatabase = $data['db_database'] ?? 'xiv_ai';
    $dbUsername = (isset($data['db_username']) && $data['db_username'] !== '') ? $data['db_username'] : 'root';
    $dbPassword = (isset($data['db_password']) && $data['db_password'] !== null) ? (string)$data['db_password'] : '';
    
    $mailHost = $data['mail_host'] ?? 'smtp.gmail.com';
    $mailPort = $data['mail_port'] ?? '587';
    $mailUsername = $data['mail_username'] ?? '';
    $mailPassword = $data['mail_password'] ?? '';
    
    return "APP_NAME=\"{$appName}\"
APP_ENV=production
APP_KEY={$appKey}
APP_DEBUG=false
APP_TIMEZONE=UTC
APP_URL={$appUrl}

APP_LOCALE=az
APP_FALLBACK_LOCALE=en

LOG_CHANNEL=single
LOG_LEVEL=error

DB_CONNECTION=mysql
DB_HOST={$dbHost}
DB_PORT={$dbPort}
DB_DATABASE={$dbDatabase}
DB_USERNAME={$dbUsername}
DB_PASSWORD=\"{$dbPassword}\"

SESSION_DRIVER=database
SESSION_LIFETIME=120
BROADCAST_CONNECTION=log
FILESYSTEM_DISK=local
QUEUE_CONNECTION=database
CACHE_STORE=database

MAIL_MAILER=smtp
MAIL_HOST={$mailHost}
MAIL_PORT={$mailPort}
MAIL_USERNAME={$mailUsername}
MAIL_PASSWORD=\"{$mailPassword}\"
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=\"{$mailUsername}\"
MAIL_FROM_NAME=\"{$appName}\"

VITE_APP_NAME=\"{$appName}\"
";
}

function runAllMigrations($pdo) {
    // Create migrations table
    $pdo->exec("CREATE TABLE IF NOT EXISTS migrations (
        id int unsigned AUTO_INCREMENT PRIMARY KEY,
        migration varchar(255) NOT NULL,
        batch int NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $migrations = [
        // Core tables
        '0001_01_01_000000_create_users_table' => "
            CREATE TABLE IF NOT EXISTS users (
                id bigint unsigned AUTO_INCREMENT PRIMARY KEY,
                name varchar(255) NOT NULL,
                email varchar(255) NOT NULL UNIQUE,
                email_verified_at timestamp NULL,
                password varchar(255) NOT NULL,
                remember_token varchar(100) NULL,
                role_id bigint unsigned NULL,
                registration_ip varchar(45) NULL,
                created_at timestamp NULL,
                updated_at timestamp NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

        '0001_01_01_000001_create_roles_table' => "
            CREATE TABLE IF NOT EXISTS roles (
                id bigint unsigned AUTO_INCREMENT PRIMARY KEY,
                name varchar(255) NOT NULL UNIQUE,
                created_at timestamp NULL,
                updated_at timestamp NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

        '0001_01_01_000002_create_cache_table' => "
            CREATE TABLE IF NOT EXISTS cache (
                `key` varchar(255) PRIMARY KEY,
                value mediumtext NOT NULL,
                expiration int NOT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

        '0001_01_01_000003_create_jobs_table' => "
            CREATE TABLE IF NOT EXISTS jobs (
                id bigint unsigned AUTO_INCREMENT PRIMARY KEY,
                queue varchar(255) NOT NULL,
                payload longtext NOT NULL,
                attempts tinyint unsigned NOT NULL,
                reserved_at int unsigned NULL,
                available_at int unsigned NOT NULL,
                created_at int unsigned NOT NULL,
                INDEX jobs_queue_index (queue)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

        '0001_01_01_000004_create_sessions_table' => "
            CREATE TABLE IF NOT EXISTS sessions (
                id varchar(255) PRIMARY KEY,
                user_id bigint unsigned NULL,
                ip_address varchar(45) NULL,
                user_agent text NULL,
                payload longtext NOT NULL,
                last_activity int NOT NULL,
                INDEX sessions_user_id_index (user_id),
                INDEX sessions_last_activity_index (last_activity)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

        // Settings tables (PK = key)
        '0002_01_01_000000_create_settings_table' => "
            CREATE TABLE IF NOT EXISTS settings (
                `key` varchar(255) NOT NULL PRIMARY KEY,
                value longtext NULL,
                created_at timestamp NULL,
                updated_at timestamp NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

        '0002_01_01_000001_create_footer_settings_table' => "
            CREATE TABLE IF NOT EXISTS footer_settings (
                `key` varchar(255) NOT NULL PRIMARY KEY,
                value longtext NULL,
                created_at timestamp NULL,
                updated_at timestamp NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

        // AI providers
        '0003_01_01_000000_create_ai_providers_table' => "
            CREATE TABLE IF NOT EXISTS ai_providers (
                id bigint unsigned AUTO_INCREMENT PRIMARY KEY,
                name varchar(255) NOT NULL,
                driver varchar(50) NOT NULL,
                model varchar(255) NULL,
                api_key longtext NULL,
                base_url varchar(255) NULL,
                is_active tinyint(1) DEFAULT 0,
                created_at timestamp NULL,
                updated_at timestamp NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

        // Chat sessions and messages
        '0004_01_01_000000_create_chat_sessions_table' => "
            CREATE TABLE IF NOT EXISTS chat_sessions (
                id bigint unsigned AUTO_INCREMENT PRIMARY KEY,
                session_id varchar(255) NOT NULL UNIQUE,
                user_id bigint unsigned NULL,
                ip_address varchar(45) NULL,
                title varchar(255) NULL,
                is_active tinyint(1) DEFAULT 1,
                created_at timestamp NULL,
                updated_at timestamp NULL,
                INDEX chat_sessions_user_id_index (user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

        '0004_01_01_000001_create_messages_table' => "
            CREATE TABLE IF NOT EXISTS messages (
                id bigint unsigned AUTO_INCREMENT PRIMARY KEY,
                chat_session_id bigint unsigned NOT NULL,
                role varchar(50) NOT NULL,
                content longtext NOT NULL,
                tokens_used int DEFAULT 0,
                created_at timestamp NULL,
                updated_at timestamp NULL,
                INDEX messages_session_id_index (chat_session_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

        // Feedback
        '0005_01_01_000000_create_chat_feedback_table' => "
            CREATE TABLE IF NOT EXISTS chat_feedback (
                id bigint unsigned AUTO_INCREMENT PRIMARY KEY,
                session_id varchar(255) NULL,
                message_id bigint unsigned NULL,
                user_type varchar(20) NULL,
                user_name varchar(255) NULL,
                user_email varchar(255) NULL,
                feedback_type varchar(20) NULL,
                message_content longtext NULL,
                user_comment text NULL,
                ip_address varchar(45) NULL,
                user_agent text NULL,
                created_at timestamp NULL,
                updated_at timestamp NULL,
                INDEX chat_feedback_message_id_index (message_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

        // Limits
        '0006_01_01_000000_create_chat_limits_table' => "
            CREATE TABLE IF NOT EXISTS chat_limits (
                id bigint unsigned AUTO_INCREMENT PRIMARY KEY,
                identifier_type varchar(50) NOT NULL,
                identifier_value varchar(255) NOT NULL,
                message_count int DEFAULT 0,
                daily_limit int DEFAULT 0,
                monthly_limit int DEFAULT 0,
                last_reset_date date NULL,
                last_monthly_reset date NULL,
                created_at timestamp NULL,
                updated_at timestamp NULL,
                INDEX chat_limits_identifier_index (identifier_type, identifier_value)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

        '0006_01_01_000001_create_user_chat_limits_table' => "
            CREATE TABLE IF NOT EXISTS user_chat_limits (
                id bigint unsigned AUTO_INCREMENT PRIMARY KEY,
                user_id bigint unsigned NOT NULL,
                daily_limit int DEFAULT 100,
                monthly_limit int DEFAULT 1000,
                unlimited_access tinyint(1) DEFAULT 0,
                created_at timestamp NULL,
                updated_at timestamp NULL,
                INDEX user_chat_limits_user_id_index (user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

        // IP security logs
        '0007_01_01_000000_create_ip_security_logs_table' => "
            CREATE TABLE IF NOT EXISTS ip_security_logs (
                id bigint unsigned AUTO_INCREMENT PRIMARY KEY,
                ip_address varchar(45) NOT NULL,
                existing_user_id bigint unsigned NULL,
                existing_user_email varchar(255) NULL,
                attempted_email varchar(255) NULL,
                attempted_name varchar(255) NULL,
                action_type varchar(50) NOT NULL,
                additional_data longtext NULL,
                is_resolved tinyint(1) DEFAULT 0,
                admin_notes longtext NULL,
                created_at timestamp NULL,
                updated_at timestamp NULL,
                INDEX ip_security_logs_ip_index (ip_address)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

        // Donation pages
        '0008_01_01_000000_create_donation_pages_table' => "
            CREATE TABLE IF NOT EXISTS donation_pages (
                id bigint unsigned AUTO_INCREMENT PRIMARY KEY,
                is_enabled tinyint(1) DEFAULT 0,
                title varchar(255) NULL,
                content longtext NULL,
                placement varchar(50) NULL,
                display_settings longtext NULL,
                payment_methods longtext NULL,
                custom_texts longtext NULL,
                created_at timestamp NULL,
                updated_at timestamp NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

        // Knowledge base
        '0009_01_01_000000_create_knowledge_base_table' => "
            CREATE TABLE IF NOT EXISTS knowledge_base (
                id bigint unsigned AUTO_INCREMENT PRIMARY KEY,
                title varchar(512) NOT NULL,
                content longtext NOT NULL,
                source varchar(255) NULL,
                source_url varchar(1024) NULL,
                category varchar(255) NULL,
                author varchar(255) NULL,
                language varchar(8) NULL,
                metadata longtext NULL,
                embedding longtext NULL,
                is_active tinyint(1) DEFAULT 1,
                created_at timestamp NULL,
                updated_at timestamp NULL,
                INDEX idx_kb_source_url (source_url(255))
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

        // Knowledge categories
        '0009_01_01_000001_create_knowledge_categories_table' => "
            CREATE TABLE IF NOT EXISTS knowledge_categories (
                id bigint unsigned AUTO_INCREMENT PRIMARY KEY,
                name varchar(255) NOT NULL UNIQUE,
                description text NULL,
                color varchar(7) DEFAULT '#3B82F6',
                is_active tinyint(1) DEFAULT 1,
                sort_order int DEFAULT 0,
                created_at timestamp NULL,
                updated_at timestamp NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

        // Terms & Privacy
        '0010_01_01_000000_create_terms_privacy_table' => "
            CREATE TABLE IF NOT EXISTS terms_and_privacies (
                id bigint unsigned AUTO_INCREMENT PRIMARY KEY,
                type varchar(20) NOT NULL,
                title varchar(255) NOT NULL,
                content longtext NOT NULL,
                is_active tinyint(1) DEFAULT 1,
                created_at timestamp NULL,
                updated_at timestamp NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

        // Admin notifications
        '0011_01_01_000000_create_admin_notifications_table' => "
            CREATE TABLE IF NOT EXISTS admin_notifications (
                id bigint unsigned AUTO_INCREMENT PRIMARY KEY,
                type varchar(50) NULL,
                title varchar(255) NOT NULL,
                message longtext NULL,
                priority varchar(20) DEFAULT 'low',
                data longtext NULL,
                icon varchar(50) NULL,
                color varchar(20) NULL,
                is_read tinyint(1) DEFAULT 0,
                is_important tinyint(1) DEFAULT 0,
                expires_at timestamp NULL,
                created_at timestamp NULL,
                updated_at timestamp NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

        // Usage tracking (UserLimit)
        '0012_01_01_000000_create_user_limits_table' => "
            CREATE TABLE IF NOT EXISTS user_limits (
                id bigint unsigned AUTO_INCREMENT PRIMARY KEY,
                identifier varchar(255) NOT NULL,
                user_type varchar(20) NOT NULL,
                limit_type varchar(20) NOT NULL,
                message_count int DEFAULT 0,
                character_count int DEFAULT 0,
                period_date date NOT NULL,
                created_at timestamp NULL,
                updated_at timestamp NULL,
                INDEX user_limits_idx (identifier, user_type, limit_type, period_date)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

        // SEO Settings (v1.2.0)
        '0013_01_01_000000_create_seo_settings_table' => "
            CREATE TABLE IF NOT EXISTS seo_settings (
                id bigint unsigned AUTO_INCREMENT PRIMARY KEY,
                page varchar(255) NOT NULL UNIQUE,
                title varchar(255) NULL,
                description text NULL,
                keywords text NULL,
                canonical_url varchar(500) NULL,
                og_title text NULL,
                og_description text NULL,
                og_image varchar(500) NULL,
                og_type varchar(50) DEFAULT 'website',
                twitter_title text NULL,
                twitter_description text NULL,
                twitter_image varchar(500) NULL,
                twitter_card varchar(50) DEFAULT 'summary_large_image',
                custom_meta text NULL,
                schema_markup text NULL,
                noindex tinyint(1) DEFAULT 0,
                nofollow tinyint(1) DEFAULT 0,
                created_at timestamp NULL,
                updated_at timestamp NULL,
                INDEX seo_settings_page_index (page)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

        // System Update Logs (v1.2.0)
        '0014_01_01_000000_create_system_update_logs_table' => "
            CREATE TABLE IF NOT EXISTS system_update_logs (
                id bigint unsigned AUTO_INCREMENT PRIMARY KEY,
                version_from varchar(20) NULL,
                version_to varchar(20) NULL,
                status varchar(20) NOT NULL,
                message text NULL,
                release_notes text NULL,
                log_excerpt text NULL,
                created_at timestamp NULL,
                updated_at timestamp NULL,
                INDEX system_update_logs_status_index (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

        // User Background Management (v1.2.1)
        '0015_01_01_000000_create_user_backgrounds_table' => "
            CREATE TABLE IF NOT EXISTS user_backgrounds (
                id bigint unsigned AUTO_INCREMENT PRIMARY KEY,
                user_id bigint unsigned NOT NULL,
                active_type enum('solid','gradient','image') DEFAULT 'solid',
                solid_color varchar(7) DEFAULT '#f3f4f6',
                gradient_value text NULL,
                image_url varchar(255) NULL,
                image_size enum('cover','contain','auto','100% 100%') DEFAULT 'cover',
                image_position varchar(255) DEFAULT 'center',
                created_at timestamp NULL,
                updated_at timestamp NULL,
                UNIQUE KEY unique_user_id (user_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
    ];

    $batch = 1;
    foreach ($migrations as $migration => $sql) {
        // Check if already run
        $stmt = $pdo->prepare("SELECT id FROM migrations WHERE migration = ?");
        $stmt->execute([$migration]);
        if (!$stmt->fetch()) {
            $pdo->exec($sql);
            $stmt = $pdo->prepare("INSERT INTO migrations (migration, batch) VALUES (?, ?)");
            $stmt->execute([$migration, $batch]);
        }
    }
}

function createAdminUser($pdo, $data) {
    // Create admin role
    $stmt = $pdo->prepare("INSERT INTO roles (name, created_at, updated_at) VALUES (?, NOW(), NOW()) ON DUPLICATE KEY UPDATE name = name");
    $stmt->execute(['admin']);
    
    $stmt = $pdo->prepare("INSERT INTO roles (name, created_at, updated_at) VALUES (?, NOW(), NOW()) ON DUPLICATE KEY UPDATE name = name");
    $stmt->execute(['user']);
    
    // Get admin role ID
    $stmt = $pdo->prepare("SELECT id FROM roles WHERE name = 'admin'");
    $stmt->execute();
    $adminRoleId = $stmt->fetchColumn();
    
    // Check if admin user already exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$data['admin_email']]);
    $existingAdmin = $stmt->fetch();
    
    if ($existingAdmin) {
        // Admin user already exists, update password if requested
        $hashedPassword = password_hash($data['admin_password'], PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("UPDATE users SET name = ?, password = ?, role_id = ?, updated_at = NOW() WHERE email = ?");
        $stmt->execute([$data['admin_name'], $hashedPassword, $adminRoleId, $data['admin_email']]);
        return ['action' => 'updated', 'message' => 'Admin istifadəçi yeniləndi'];
    } else {
        // Create new admin user
        try {
            $hashedPassword = password_hash($data['admin_password'], PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("INSERT INTO users (name, email, password, role_id, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())");
            $stmt->execute([$data['admin_name'], $data['admin_email'], $hashedPassword, $adminRoleId]);
            return ['action' => 'created', 'message' => 'Admin istifadəçi yaradıldı'];
        } catch (PDOException $e) {
            // Handle duplicate key error (just in case)
            if ($e->getCode() == '23000') {
                // Try to update instead
                $stmt = $pdo->prepare("UPDATE users SET name = ?, password = ?, role_id = ?, updated_at = NOW() WHERE email = ?");
                $stmt->execute([$data['admin_name'], $hashedPassword, $adminRoleId, $data['admin_email']]);
                return ['action' => 'recovered', 'message' => 'Admin istifadəçi bərpa edildi'];
            }
            throw $e; // Re-throw if it's not a duplicate key error
        }
    }
}

function seedDefaultData($pdo) {
    // Default site settings (align with App\Models\Settings::getDefaults)
    $settings = [
        // Application Settings
        'app_version' => '1.2.1',
        'site_name' => 'XIV AI Chatbot Platform',
        'chatbot_name' => 'XIV AI',
        
        // Brand Settings
        'brand_mode' => 'icon',
        'brand_icon_name' => 'nav_chat',
        'brand_logo_url' => '',
        'favicon_url' => '',
        
        // Theme Settings
        'primary_color' => '#10b981',
        'secondary_color' => '#97a5a1',
        'accent_color' => '#fbbf24',
        'background_gradient' => 'linear-gradient(135deg, #10b981 0%, #065f46 100%)',
        'text_color' => '#1f2937',
        
        // Chat Settings
        'message_input_limit' => '500',
        'ai_output_limit' => '1000',
        'enter_sends_message' => '1',
        'ai_typing_speed' => '50',
        'ai_thinking_time' => '1000',
        'ai_response_type' => 'typewriter',
        'ai_use_knowledge_base' => '1',
        'ai_strict_mode' => '1',
        'ai_topic_restrictions' => '',
        'ai_internet_blocked' => '1',
        'ai_external_learning_blocked' => '1',
        'ai_super_strict_mode' => '0',
        'chat_disclaimer_text' => 'Çatbotun cavablarını yoxlayın, səhv edə bilər!',
        
        // Chat Background Settings
        'chat_background_type' => 'default',
        'chat_background_color' => '#f3f4f6',
        'chat_background_gradient' => 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'chat_background_image' => '',
        
        // Footer Settings
        'footer_enabled' => '1',
        'footer_text' => '© 2025 XIV AI. Bütün hüquqlar qorunur.',
        'footer_text_color' => '#6B7280',
        'footer_author_text' => 'Developed by DeXIV',
        'footer_author_color' => '#6B7280',
        
        // AI System Prompt
        'ai_system_prompt' => 'Sen XIV AI adlı Azərbaycan dilində cavab verən köməkçi süni zəka sistemisiniz. İstifadəçilərə faydalı, dəqiq və təhlükəsiz cavablar ver.',
    ];

    foreach ($settings as $key => $value) {
        $stmt = $pdo->prepare("INSERT INTO settings (`key`, value, created_at, updated_at) VALUES (?, ?, NOW(), NOW()) ON DUPLICATE KEY UPDATE value = ?");
        $stmt->execute([$key, $value, $value]);
    }
    
    // Default knowledge categories
    $categories = [
        ['name' => 'İslam', 'description' => 'İslam dini ilə bağlı məsələlər', 'color' => '#10b981'],
        ['name' => 'Fiqh', 'description' => 'Fiqh məsələləri və hökümlər', 'color' => '#3b82f6'],
        ['name' => 'Əxlaq', 'description' => 'İslam əxlaqı və davranışlar', 'color' => '#8b5cf6'],
        ['name' => 'İbadet', 'description' => 'Namaz, oruc, hac və digər ibadətlər', 'color' => '#f59e0b'],
        ['name' => 'Həyat', 'description' => 'Gündəlik həyatda İslam', 'color' => '#ef4444'],
    ];
    
    foreach ($categories as $index => $category) {
        $stmt = $pdo->prepare("INSERT INTO knowledge_categories (name, description, color, sort_order, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, 1, NOW(), NOW()) ON DUPLICATE KEY UPDATE name = name");
        $stmt->execute([$category['name'], $category['description'], $category['color'], $index]);
    }
}

function setDirectoryPermissions($basePath) {
    $dirs = [
        '/storage',
        '/storage/framework',
        '/storage/framework/cache',
        '/storage/framework/views',
        '/storage/logs',
        '/bootstrap/cache',
        '/public/storage'
    ];

    foreach ($dirs as $dir) {
        $fullPath = $basePath . $dir;
        if (!is_dir($fullPath)) {
            @mkdir($fullPath, 0755, true);
        }
        // attempt chmod if allowed
        @chmod($fullPath, 0755);
    }
}

function performPostInstallFix() {
    try {
        $base = dirname(__DIR__);
        $envPath = $base . '/.env';
        if (!file_exists($envPath)) {
            throw new Exception('.env tapılmadı');
        }
        $env = file_get_contents($envPath);
        if (!preg_match('/^APP_KEY\s*=\s*(.+)$/m', $env, $m) || trim($m[1]) === '') {
            $key = 'base64:' . base64_encode(random_bytes(32));
            if (preg_match('/^APP_KEY\s*=.*$/m', $env)) {
                $env = preg_replace('/^APP_KEY\s*=.*$/m', 'APP_KEY=' . $key, $env);
            } else {
                $env .= "\nAPP_KEY={$key}\n";
            }
            if (file_put_contents($envPath, $env) === false) {
                throw new Exception('APP_KEY yazıla bilmədi');
            }
        }
        
        // Ensure directories
        setDirectoryPermissions($base);
        
        // 1. Clear all Laravel caches
        clearAllCaches($base);
        
        // 2. Build frontend assets if npm available
        buildFrontendAssets($base);
        
        return ['success' => true, 'message' => 'Post-install fix tamamlandı!'];
    } catch (Exception $e) {
        return ['success' => false, 'error' => $e->getMessage()];
    }
}

function clearAllCaches($basePath) {
    // Remove cached config/routes
    @unlink($basePath . '/bootstrap/cache/config.php');
    @unlink($basePath . '/bootstrap/cache/routes.php');
    @unlink($basePath . '/bootstrap/cache/services.php');
    @unlink($basePath . '/bootstrap/cache/packages.php');
    
    // Clear storage framework caches
    $cacheDataPath = $basePath . '/storage/framework/cache/data';
    if (is_dir($cacheDataPath)) {
        $files = glob($cacheDataPath . '/*');
        if ($files !== false && count($files) > 0) {
            foreach ($files as $file) {
                if (is_file($file)) {
                    @unlink($file);
                }
            }
        }
    }
    
    // Clear view cache
    $viewCachePath = $basePath . '/storage/framework/views';
    if (is_dir($viewCachePath)) {
        $files = glob($viewCachePath . '/*.php');
        if ($files !== false && count($files) > 0) {
            foreach ($files as $file) {
                if (is_file($file)) {
                    @unlink($file);
                }
            }
        }
    }
    
    // Try Laravel artisan cache clear if php artisan available
    // Windows compatible command
    $isWindows = (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN');
    if ($isWindows) {
        @exec('cd /d "' . $basePath . '" && php artisan cache:clear 2>nul');
        @exec('cd /d "' . $basePath . '" && php artisan config:clear 2>nul');
        @exec('cd /d "' . $basePath . '" && php artisan route:clear 2>nul');
        @exec('cd /d "' . $basePath . '" && php artisan view:clear 2>nul');
    } else {
        @exec('cd ' . escapeshellarg($basePath) . ' && php artisan cache:clear 2>/dev/null');
        @exec('cd ' . escapeshellarg($basePath) . ' && php artisan config:clear 2>/dev/null');
        @exec('cd ' . escapeshellarg($basePath) . ' && php artisan route:clear 2>/dev/null');
        @exec('cd ' . escapeshellarg($basePath) . ' && php artisan view:clear 2>/dev/null');
    }
}

function buildFrontendAssets($basePath) {
    // Skip asset building during web installation (too slow and can timeout)
    // Assets should be built manually after installation via: npm run build
    error_log('Skipping frontend asset building - run "npm run build" manually after installation');
    return true;
}

?>
<!DOCTYPE html>
<html lang="az">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>XIV AI - Quraşdırma Sihirbazı</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js" defer></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        primary: '#10b981',
                        secondary: '#065f46',
                        accent: '#34d399'
                    },
                    animation: {
                        'fade-in': 'fadeIn 0.5s ease-in-out',
                        'slide-in': 'slideIn 0.3s ease-out',
                        'bounce-slow': 'bounce 2s infinite',
                        'pulse-slow': 'pulse 3s infinite',
                        'spin-slow': 'spin 3s linear infinite'
                    },
                    keyframes: {
                        fadeIn: {
                            '0%': { opacity: '0', transform: 'translateY(10px)' },
                            '100%': { opacity: '1', transform: 'translateY(0)' }
                        },
                        slideIn: {
                            '0%': { opacity: '0', transform: 'translateX(-20px)' },
                            '100%': { opacity: '1', transform: 'translateX(0)' }
                        }
                    }
                }
            }
        }
    </script>
    <style>
        .step { display: none; }
        .step.active { display: block; }
        .requirement-ok { color: #10B981; }
        .requirement-fail { color: #EF4444; }
        .glass-effect {
            backdrop-filter: blur(20px);
            background: rgba(255, 255, 255, 0.9);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .gradient-bg {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%);
            background-size: 400% 400%;
            animation: gradientShift 15s ease infinite;
        }
        @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        .progress-glow {
            box-shadow: 0 0 20px rgba(16, 185, 129, 0.3);
        }
        .card-hover {
            transition: all 0.3s ease;
        }
        .card-hover:hover {
            transform: translateY(-2px);
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
    </style>
</head>
<body class="min-h-screen gradient-bg relative overflow-x-hidden">
    <!-- Floating particles background -->
    <div class="fixed inset-0 overflow-hidden pointer-events-none">
        <div class="absolute top-10 left-10 w-2 h-2 bg-white/30 rounded-full animate-bounce-slow"></div>
        <div class="absolute top-32 right-20 w-3 h-3 bg-white/20 rounded-full animate-pulse-slow"></div>
        <div class="absolute bottom-20 left-20 w-1 h-1 bg-white/40 rounded-full animate-bounce-slow" style="animation-delay: 1s"></div>
        <div class="absolute bottom-32 right-10 w-2 h-2 bg-white/25 rounded-full animate-pulse-slow" style="animation-delay: 2s"></div>
        <div class="absolute top-1/2 left-1/3 w-1 h-1 bg-white/35 rounded-full animate-bounce-slow" style="animation-delay: 0.5s"></div>
    </div>
    
    <div class="min-h-screen flex items-center justify-center p-4 relative z-10">
        <div class="glass-effect rounded-3xl shadow-2xl p-6 max-w-2xl w-full border border-white/20 card-hover" x-data="installer()">
            <!-- Header with animated logo -->
            <div class="text-center mb-8 animate-fade-in">
                <div class="relative inline-block">
                    <div class="absolute -inset-3 bg-gradient-to-r from-primary to-accent rounded-full blur opacity-30 animate-pulse-slow"></div>
                    <div class="relative bg-gradient-to-r from-primary to-secondary p-4 rounded-full">
                        <i class="fas fa-robot text-3xl text-white"></i>
                    </div>
                </div>
                <h1 class="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mt-4 tracking-tight">XIV AI Platform</h1>
                <p class="text-gray-600 mt-1 text-sm">Quraşdırma Sihirbazı • Versiya 1.2.1 • DeXIV</p>
                
                <!-- Modern step progress -->
                <div class="mt-6 relative">
                    <div class="flex justify-center items-center space-x-2">
                        <template x-for="step in 4" :key="step">
                            <div class="flex items-center">
                                <div class="relative">
                                    <div 
                                        :class="{
                                            'bg-gradient-to-r from-primary to-accent progress-glow text-white': currentStep >= step,
                                            'bg-gray-300 text-gray-500': currentStep < step,
                                            'scale-110 ring-2 ring-primary ring-offset-2': currentStep === step
                                        }"
                                        class="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 transform font-semibold text-xs"
                                    >
                                        <span x-text="step"></span>
                                    </div>
                                </div>
                                <div 
                                    x-show="step < 4"
                                    :class="currentStep > step ? 'bg-gradient-to-r from-primary to-accent' : 'bg-gray-300'"
                                    class="w-12 h-0.5 mx-1 transition-all duration-500"
                                ></div>
                            </div>
                        </template>
                    </div>
                    <div class="flex justify-between mt-2 text-xs text-gray-500 px-1">
                        <span class="w-16 text-center">Tələblər</span>
                        <span class="w-16 text-center">Database</span>
                        <span class="w-16 text-center">Admin</span>
                        <span class="w-16 text-center">Quraşdırma</span>
                    </div>
                </div>
            </div>

            <!-- Step 1: Requirements Check -->
            <div id="step-1" class="step active animate-fade-in">
                <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
                    <div class="flex items-center mb-4">
                        <div class="bg-gradient-to-r from-blue-500 to-indigo-600 p-2 rounded-lg">
                            <i class="fas fa-clipboard-check text-white text-lg"></i>
                        </div>
                        <div class="ml-3">
                            <h2 class="text-xl font-bold text-gray-800">Sistem Tələbləri</h2>
                            <p class="text-gray-600 text-sm">Serverinizin uyumlu olduğunu yoxlayırıq</p>
                        </div>
                    </div>
                    
                    <div id="requirements-list" class="space-y-3">
                        <div class="flex items-center justify-center py-8">
                            <div class="text-center">
                                <div class="animate-spin-slow inline-block">
                                    <i class="fas fa-cog text-3xl text-blue-500"></i>
                                </div>
                                <p class="text-gray-600 mt-3">Sistem tələbləri yoxlanılır...</p>
                            </div>
                        </div>
                    </div>
                    
                    <button 
                        id="check-requirements" 
                        class="mt-4 w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-3 px-5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                    >
                        <i class="fas fa-search mr-2"></i>
                        Tələbləri Yoxla
                    </button>
                </div>
            </div>

            <!-- Step 2: Database Configuration -->
            <div id="step-2" class="step animate-fade-in">
                <div class="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-5 border border-emerald-100">
                    <div class="flex items-center mb-4">
                        <div class="bg-gradient-to-r from-emerald-500 to-teal-600 p-2 rounded-lg">
                            <i class="fas fa-database text-white text-lg"></i>
                        </div>
                        <div class="ml-3">
                            <h2 class="text-xl font-bold text-gray-800">Verilənlər Bazası</h2>
                            <p class="text-gray-600 text-sm">Database əlaqə parametrlərini daxil edin</p>
                        </div>
                    </div>
                    
                    <form id="db-form" class="space-y-4">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div class="space-y-2">
                                <label class="flex items-center text-sm font-semibold text-gray-700">
                                    <i class="fas fa-server mr-2 text-emerald-500"></i>
                                    Host
                                </label>
                                <input 
                                    type="text" 
                                    name="db_host" 
                                    value="localhost" 
                                    class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 bg-white/80"
                                    placeholder="localhost"
                                    required
                                >
                            </div>
                            <div class="space-y-2">
                                <label class="flex items-center text-sm font-semibold text-gray-700">
                                    <i class="fas fa-plug mr-2 text-emerald-500"></i>
                                    Port
                                </label>
                                <input 
                                    type="text" 
                                    name="db_port" 
                                    value="3306" 
                                    class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 bg-white/80"
                                    placeholder="3306"
                                    required
                                >
                            </div>
                        </div>
                        
                        <div class="space-y-2">
                            <label class="flex items-center text-sm font-semibold text-gray-700">
                                <i class="fas fa-hdd mr-2 text-emerald-500"></i>
                                Verilənlər Bazası Adı
                            </label>
                            <input 
                                type="text" 
                                name="db_database" 
                                class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 bg-white/80"
                                placeholder="xiv_ai_db"
                                required
                            >
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div class="space-y-2">
                                <label class="flex items-center text-sm font-semibold text-gray-700">
                                    <i class="fas fa-user mr-2 text-emerald-500"></i>
                                    İstifadəçi Adı
                                </label>
                                <input 
                                    type="text" 
                                    name="db_username" 
                                    class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 bg-white/80"
                                    placeholder="root"
                                    required
                                >
                            </div>
                            <div class="space-y-2">
                                <label class="flex items-center text-sm font-semibold text-gray-700">
                                    <i class="fas fa-lock mr-2 text-emerald-500"></i>
                                    Şifrə
                                </label>
                                <input 
                                    type="password" 
                                    name="db_password" 
                                    class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 bg-white/80"
                                    placeholder="Şifrə (boş buraxıla bilər)"
                                >
                            </div>
                        </div>
                        
                        <button 
                            type="button" 
                            id="test-db" 
                            class="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold py-3 px-5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                        >
                            <i class="fas fa-wifi mr-2"></i>
                            Bağlantını Test Et
                        </button>
                    </form>
                    
                    <div id="db-result" class="mt-4"></div>
                </div>
            </div>

            <!-- Step 3: Admin User & Site Settings -->
            <div id="step-3" class="step animate-fade-in">
                <div class="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-100 max-h-[calc(100vh-20rem)] overflow-y-auto">
                    <div class="flex items-center mb-4">
                        <div class="bg-gradient-to-r from-purple-500 to-pink-600 p-2 rounded-lg">
                            <i class="fas fa-user-cog text-white text-lg"></i>
                        </div>
                        <div class="ml-3">
                            <h2 class="text-xl font-bold text-gray-800">Admin və Sayt Parametrləri</h2>
                            <p class="text-gray-600 text-sm">Platformanız üçün əsas parametrləri təyin edin</p>
                        </div>
                    </div>
                    <form id="admin-form" class="space-y-4">
                        <!-- Site Information -->
                        <div class="bg-white/60 rounded-lg p-4 border border-white/40">
                            <h3 class="flex items-center text-base font-bold text-gray-800 mb-3">
                                <i class="fas fa-globe mr-3 text-purple-500"></i>
                                Sayt Məlumatları
                            </h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="space-y-2">
                                    <label class="flex items-center text-sm font-semibold text-gray-700">
                                        <i class="fas fa-tag mr-2 text-purple-500"></i>
                                        Sayt Adı
                                    </label>
                                    <input 
                                        type="text" 
                                        name="app_name" 
                                        value="XIV AI" 
                                        class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white/80"
                                        required
                                    >
                                </div>
                                <div class="space-y-2">
                                    <label class="flex items-center text-sm font-semibold text-gray-700">
                                        <i class="fas fa-link mr-2 text-purple-500"></i>
                                        Sayt URL
                                    </label>
                                    <input 
                                        type="url" 
                                        name="app_url" 
                                        id="app_url" 
                                        class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white/80"
                                        required
                                    >
                                </div>
                            </div>
                        </div>
                        
                        <!-- Admin User -->
                        <div class="bg-white/60 rounded-lg p-4 border border-white/40">
                            <h3 class="flex items-center text-base font-bold text-gray-800 mb-3">
                                <i class="fas fa-user-shield mr-3 text-purple-500"></i>
                                Admin İstifadəçi
                            </h3>
                            <div class="space-y-4">
                                <div class="space-y-2">
                                    <label class="flex items-center text-sm font-semibold text-gray-700">
                                        <i class="fas fa-id-badge mr-2 text-purple-500"></i>
                                        Admin Adı
                                    </label>
                                    <input 
                                        type="text" 
                                        name="admin_name" 
                                        value="Admin" 
                                        class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white/80"
                                        required
                                    >
                                </div>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div class="space-y-2">
                                        <label class="flex items-center text-sm font-semibold text-gray-700">
                                            <i class="fas fa-envelope mr-2 text-purple-500"></i>
                                            Admin Email
                                        </label>
                                        <input 
                                            type="email" 
                                            name="admin_email" 
                                            class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white/80"
                                            placeholder="admin@example.com"
                                            required
                                        >
                                    </div>
                                    <div class="space-y-2">
                                        <label class="flex items-center text-sm font-semibold text-gray-700">
                                            <i class="fas fa-key mr-2 text-purple-500"></i>
                                            Admin Şifrə
                                        </label>
                                        <input 
                                            type="password" 
                                            name="admin_password" 
                                            class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white/80"
                                            placeholder="Güvənli şifrə"
                                            required
                                        >
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Email Settings -->
                        <div class="bg-white/60 rounded-lg p-4 border border-white/40">
                            <h3 class="flex items-center text-base font-bold text-gray-800 mb-2">
                                <i class="fas fa-mail-bulk mr-3 text-purple-500"></i>
                                E-poçt Parametrləri
                                <span class="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">İstəyə bağlı</span>
                            </h3>
                            <p class="text-sm text-gray-600 mb-4">Bu parametrlər sonradan da dəyişilə bilər</p>
                            
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="space-y-2">
                                    <label class="flex items-center text-sm font-semibold text-gray-700">
                                        <i class="fas fa-server mr-2 text-purple-500"></i>
                                        SMTP Host
                                    </label>
                                    <input 
                                        type="text" 
                                        name="mail_host" 
                                        value="smtp.gmail.com" 
                                        class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white/80"
                                        placeholder="smtp.gmail.com"
                                    >
                                </div>
                                <div class="space-y-2">
                                    <label class="flex items-center text-sm font-semibold text-gray-700">
                                        <i class="fas fa-plug mr-2 text-purple-500"></i>
                                        SMTP Port
                                    </label>
                                    <input 
                                        type="text" 
                                        name="mail_port" 
                                        value="587" 
                                        class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white/80"
                                        placeholder="587"
                                    >
                                </div>
                                <div class="space-y-2">
                                    <label class="flex items-center text-sm font-semibold text-gray-700">
                                        <i class="fas fa-at mr-2 text-purple-500"></i>
                                        Email İstifadəçi
                                    </label>
                                    <input 
                                        type="email" 
                                        name="mail_username" 
                                        class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white/80"
                                        placeholder="email@gmail.com"
                                    >
                                </div>
                                <div class="space-y-2">
                                    <label class="flex items-center text-sm font-semibold text-gray-700">
                                        <i class="fas fa-unlock-alt mr-2 text-purple-500"></i>
                                        Email Şifrə
                                    </label>
                                    <input 
                                        type="password" 
                                        name="mail_password" 
                                        class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white/80"
                                        placeholder="App password"
                                    >
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Step 4: Installation -->
            <div id="step-4" class="step animate-fade-in">
                <div class="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5 border border-green-100">
                    <div class="flex items-center mb-4">
                        <div class="bg-gradient-to-r from-green-500 to-emerald-600 p-2 rounded-lg">
                            <i class="fas fa-rocket text-white text-lg"></i>
                        </div>
                        <div class="ml-3">
                            <h2 class="text-xl font-bold text-gray-800">Quraşdırma</h2>
                            <p class="text-gray-600 text-sm">XIV AI platformanızı qurur və optimallaşdırırıq</p>
                        </div>
                    </div>
                    
                    <div id="install-progress" class="bg-white/60 rounded-lg p-4 border border-white/40">
                        <!-- Modern Progress Bar -->
                        <div class="relative">
                            <div class="bg-gray-200 rounded-full h-3 mb-4 overflow-hidden">
                                <div 
                                    id="progress-bar" 
                                    class="bg-gradient-to-r from-green-400 to-emerald-500 h-3 rounded-full transition-all duration-1000 ease-out progress-glow relative overflow-hidden" 
                                    style="width: 0%"
                                >
                                    <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-pulse"></div>
                                </div>
                            </div>
                            <div class="flex justify-between text-xs text-gray-600 mb-6">
                                <span>Başlangıc</span>
                                <span>Database</span>
                                <span>Assets</span>
                                <span>Bitdi</span>
                            </div>
                        </div>
                        
                        <!-- Status Display -->
                        <div class="text-center">
                            <div id="install-status-icon" class="text-4xl mb-3">
                                <i class="fas fa-hourglass-start text-blue-500 animate-pulse"></i>
                            </div>
                            <div id="install-status" class="text-gray-700 font-medium text-lg">
                                Quraşdırma başlamaq üçün hazırdır...
                            </div>
                            <div id="install-substatus" class="text-sm text-gray-500 mt-2"></div>
                        </div>
                    </div>
                    
                    <button 
                        id="start-install" 
                        class="mt-4 w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 px-5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105"
                    >
                        <i class="fas fa-play mr-2"></i>
                        Quraşdırmanı Başlat
                    </button>
                    
                    <div id="install-result" class="mt-4"></div>
                </div>
            </div>

            <!-- Navigation buttons -->
            <div class="flex justify-between items-center mt-6">
                <button 
                    @click="prevStep()" 
                    x-show="currentStep > 1" 
                    class="flex items-center px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-all duration-200 transform hover:-translate-y-1 text-sm"
                >
                    <i class="fas fa-chevron-left mr-2"></i>
                    Əvvəlki
                </button>
                
                <div class="flex items-center space-x-2 text-xs text-gray-500">
                    <i class="fas fa-shield-alt"></i>
                    <span>Təhlükəsiz</span>
                </div>
                
                <button 
                    @click="nextStep()" 
                    x-show="currentStep < 4 && currentStep < maxStep" 
                    class="flex items-center px-5 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:-translate-y-1 text-sm"
                >
                    Növbəti
                    <i class="fas fa-chevron-right ml-2"></i>
                </button>
            </div>
        </div>
    </div>

    <script>
        function installer() {
            return {
                currentStep: 1,
                maxStep: 1,
                requirementsPassed: false,
                dbTested: false,
                isInstalling: false,
                
                init() {
                    // Set app URL automatically
                    document.getElementById('app_url').value = window.location.origin.replace('/install', '');
                    this.showStep(this.currentStep);
                },

                showStep(step) {
                    // Update current step FIRST for Alpine reactivity
                    this.currentStep = step;
                    
                    // Then update DOM
                    document.querySelectorAll('.step').forEach(el => el.classList.remove('active'));
                    document.getElementById(`step-${step}`).classList.add('active');
                },
                
                async checkRequirements() {
                    const button = document.getElementById('check-requirements');
                    const icon = button.querySelector('i');
                    
                    // Disable button and show loading
                    button.disabled = true;
                    button.innerHTML = '<i class="fas fa-spinner animate-spin mr-2"></i> Yoxlanılır...';
                    
                    try {
                        const response = await fetch('setup.php', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                            body: 'action=check_requirements'
                        });
                        const result = await response.json();
                        
                        let html = '<div class="space-y-3">';
                        const requirements = {
                            'php_version': 'PHP 8.1+',
                            'openssl': 'OpenSSL Extension',
                            'pdo': 'PDO Extension',
                            'pdo_mysql': 'PDO MySQL Extension',
                            'mbstring': 'Mbstring Extension',
                            'tokenizer': 'Tokenizer Extension',
                            'xml': 'XML Extension',
                            'ctype': 'Ctype Extension',
                            'json': 'JSON Extension',
                            'curl': 'cURL Extension',
                            'storage_writable': 'Storage Yazıla bilər',
                            'bootstrap_writable': 'Bootstrap Cache Yazıla bilər',
                            'env_writable': 'Environment Yazıla bilər'
                        };
                        
                        for (const [key, label] of Object.entries(requirements)) {
                            const status = result.requirements[key];
                            const statusClass = status ? 'bg-green-100 border-green-200 text-green-800' : 'bg-red-100 border-red-200 text-red-800';
                            const icon = status ? 'fa-check-circle text-green-600' : 'fa-times-circle text-red-600';
                            
                            html += `
                                <div class="flex items-center justify-between p-3 rounded-xl border ${statusClass} animate-slide-in">
                                    <div class="flex items-center">
                                        <i class="fas ${icon} mr-3"></i>
                                        <span class="font-medium">${label}</span>
                                    </div>
                                    <span class="text-sm font-bold">${status ? 'OK' : 'Xəta'}</span>
                                </div>
                            `;
                        }
                        html += '</div>';
                        
                        document.getElementById('requirements-list').innerHTML = html;
                        
                        if (result.success) {
                            this.requirementsPassed = true;
                            this.maxStep = 2;
                            button.innerHTML = '<i class="fas fa-check mr-2"></i> Tələblər Qarşılandı!';
                            button.className = button.className.replace('from-blue-500 to-indigo-600', 'from-green-500 to-emerald-600');
                            
                            setTimeout(() => {
                                this.showStep(2);
                            }, 1500);
                        } else {
                            button.innerHTML = '<i class="fas fa-exclamation-triangle mr-2"></i> Bəzi Tələblər Qarşılanmadı';
                            button.className = button.className.replace('from-blue-500 to-indigo-600', 'from-red-500 to-red-600');
                            button.disabled = false;
                        }
                    } catch (error) {
                        button.innerHTML = '<i class="fas fa-exclamation-triangle mr-2"></i> Yoxlama Xətası';
                        button.disabled = false;
                    }
                },

                async testDatabase() {
                    const button = document.getElementById('test-db');
                    const resultDiv = document.getElementById('db-result');
                    
                    button.disabled = true;
                    button.innerHTML = '<i class="fas fa-spinner animate-spin mr-2"></i> Test edilir...';
                    
                    const formData = new FormData(document.getElementById('db-form'));
                    formData.append('action', 'test_database');
                    
                    try {
                        const response = await fetch('setup.php', {
                            method: 'POST',
                            body: formData
                        });
                        const result = await response.json();
                        
                        if (result.success) {
                            resultDiv.innerHTML = `
                                <div class="bg-green-100 border border-green-200 rounded-xl p-4 animate-fade-in">
                                    <div class="flex items-center">
                                        <i class="fas fa-check-circle text-green-600 mr-3 text-xl"></i>
                                        <div>
                                            <h4 class="font-semibold text-green-800">Bağlantı Uğurlu!</h4>
                                            <p class="text-green-700 text-sm">Verilənlər bazasına uğurla bağlanıldı.</p>
                                        </div>
                                    </div>
                                </div>
                            `;
                            
                            this.dbTested = true;
                            this.maxStep = 4;
                            button.innerHTML = '<i class="fas fa-check mr-2"></i> Bağlantı Uğurlu!';
                            button.className = button.className.replace('from-emerald-500 to-teal-600', 'from-green-500 to-emerald-600');
                            
                            setTimeout(() => {
                                this.showStep(3);
                            }, 1500);
                        } else {
                            resultDiv.innerHTML = `
                                <div class="bg-red-100 border border-red-200 rounded-xl p-4 animate-fade-in">
                                    <div class="flex items-center">
                                        <i class="fas fa-times-circle text-red-600 mr-3 text-xl"></i>
                                        <div>
                                            <h4 class="font-semibold text-red-800">Bağlantı Xətası!</h4>
                                            <p class="text-red-700 text-sm">${result.error}</p>
                                        </div>
                                    </div>
                                </div>
                            `;
                            button.innerHTML = '<i class="fas fa-wifi mr-2"></i> Yenidən Test Et';
                            button.disabled = false;
                        }
                    } catch (error) {
                        resultDiv.innerHTML = `
                            <div class="bg-red-100 border border-red-200 rounded-xl p-4">
                                <div class="flex items-center">
                                    <i class="fas fa-exclamation-triangle text-red-600 mr-3 text-xl"></i>
                                    <div>
                                        <h4 class="font-semibold text-red-800">Xəta!</h4>
                                        <p class="text-red-700 text-sm">${error.message}</p>
                                    </div>
                                </div>
                            </div>
                        `;
                        button.innerHTML = '<i class="fas fa-wifi mr-2"></i> Bağlantını Test Et';
                        button.disabled = false;
                    }
                },

                async startInstallation() {
                    if (this.isInstalling) return;
                    
                    this.isInstalling = true;
                    const button = document.getElementById('start-install');
                    const progressBar = document.getElementById('progress-bar');
                    const statusDiv = document.getElementById('install-status');
                    const statusIcon = document.getElementById('install-status-icon');
                    const substatus = document.getElementById('install-substatus');
                    const resultDiv = document.getElementById('install-result');
                    
                    button.disabled = true;
                    button.innerHTML = '<i class="fas fa-spinner animate-spin mr-2"></i> Quraşdırılır...';
                    
                    // Progress stages
                    const stages = [
                        { percent: 10, status: 'Təyinatlara başlanılır...', icon: 'fa-cogs', substatus: '.env faylı yaradılır' },
                        { percent: 30, status: 'Database hazırlanır...', icon: 'fa-database', substatus: 'Cədvəllər yaradılır və migration-lar işə salınır' },
                        { percent: 60, status: 'Admin istifadəçi yaradılır...', icon: 'fa-user-plus', substatus: 'Admin hesabı və müəssə parametrləri təyin edilir' },
                        { percent: 80, status: 'Cache təmizlənir...', icon: 'fa-broom', substatus: 'Laravel cache və frontend asset-lər hazırlanır' },
                        { percent: 100, status: 'Əla! XIV AI hazırdır!', icon: 'fa-check-circle', substatus: 'Bütün sistemlər işlək vəziyyətdədir' }
                    ];
                    
                    // Simulate progress with real backend call
                    let currentStage = 0;
                    const progressInterval = setInterval(() => {
                        if (currentStage < stages.length - 1) {
                            const stage = stages[currentStage];
                            progressBar.style.width = stage.percent + '%';
                            statusDiv.textContent = stage.status;
                            substatus.textContent = stage.substatus;
                            statusIcon.innerHTML = `<i class="fas ${stage.icon} text-blue-500 animate-pulse"></i>`;
                            currentStage++;
                        }
                    }, 800);
                    
                    try {
                        const dbFormData = new FormData(document.getElementById('db-form'));
                        const adminFormData = new FormData(document.getElementById('admin-form'));
                        
                        const installData = new FormData();
                        installData.append('action', 'install');
                        
                        // Merge all form data
                        for (const [key, value] of dbFormData) {
                            installData.append(key, value);
                        }
                        for (const [key, value] of adminFormData) {
                            installData.append(key, value);
                        }
                        
                        const response = await fetch('setup.php', {
                            method: 'POST',
                            body: installData
                        });
                        
                        const responseText = await response.text();
                        let result;
                        
                        try {
                            result = JSON.parse(responseText);
                        } catch (parseError) {
                            clearInterval(progressInterval);
                            console.error('Response text:', responseText);
                            throw new Error('Server HTML qaytardı (PHP xətası). Console-da tam xəta görünür.');
                        }
                        
                        clearInterval(progressInterval);
                        
                        if (result.success) {
                            // Complete progress
                            const finalStage = stages[stages.length - 1];
                            progressBar.style.width = '100%';
                            statusDiv.textContent = finalStage.status;
                            substatus.textContent = finalStage.substatus;
                            statusIcon.innerHTML = `<i class="fas ${finalStage.icon} text-green-500 animate-bounce"></i>`;
                            
                            // Show success message
                            const postFixStatusClass = result.post_fix_success ? 'border-green-500 bg-green-50' : 'border-yellow-500 bg-yellow-50';
                            const postFixIcon = result.post_fix_success ? '✅' : '⚠️';
                            const postFixTextClass = result.post_fix_success ? 'text-green-700' : 'text-yellow-700';
                            
                            resultDiv.innerHTML = `
                                <div class="bg-gradient-to-r from-green-100 to-emerald-100 border border-green-200 rounded-2xl p-6 animate-fade-in">
                                    <div class="text-center mb-6">
                                        <div class="text-6xl mb-4 animate-bounce">🎉</div>
                                        <h3 class="text-2xl font-bold text-gray-800 mb-2">Uğurla Quraşdırıldı!</h3>
                                        <p class="text-gray-600">XIV AI platformanız hazırdır və istifadəyə amədədir.</p>
                                    </div>
                                    
                                    <div class="border-l-4 ${postFixStatusClass} p-4 mb-6 rounded-r-xl">
                                        <div class="${postFixTextClass} text-sm flex items-center">
                                            <span class="text-xl mr-2">${postFixIcon}</span>
                                            <div>
                                                <strong>Post-Install Status:</strong><br>
                                                ${result.post_fix_message || 'Cache və asset düzəlişi icra edildi'}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <a 
                                            href="../" 
                                            class="flex items-center justify-center px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                                        >
                                            <i class="fas fa-home mr-2"></i>
                                            Sayta Keç
                                        </a>
                                        ${
                                            !result.post_fix_success ? 
                                            '<button onclick="installer().runPostFix()" class="flex items-center justify-center px-6 py-4 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"><i class="fas fa-tools mr-2"></i>Cache Düzəlişini Yenidən Cəhd Et</button>' :
                                            '<button class="flex items-center justify-center px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl shadow-lg opacity-75 cursor-not-allowed" disabled><i class="fas fa-check-circle mr-2"></i>Hər şey Hazırdır!</button>'
                                        }
                                    </div>
                                </div>
                            `;
                        } else {
                            statusDiv.textContent = 'Quraşdırma xətası!';
                            substatus.textContent = result.error || 'Naməlum xəta baş verdi';
                            statusIcon.innerHTML = '<i class="fas fa-times-circle text-red-500"></i>';
                            
                            resultDiv.innerHTML = `
                                <div class="bg-red-100 border border-red-200 rounded-xl p-4 animate-fade-in">
                                    <div class="flex items-center">
                                        <i class="fas fa-exclamation-triangle text-red-600 mr-3 text-xl"></i>
                                        <div>
                                            <h4 class="font-semibold text-red-800">Quraşdırma Xətası!</h4>
                                            <p class="text-red-700 text-sm">${result.error}</p>
                                        </div>
                                    </div>
                                </div>
                            `;
                            
                            button.disabled = false;
                            button.innerHTML = '<i class="fas fa-redo mr-2"></i> Yenidən Cəhd Et';
                        }
                    } catch (error) {
                        clearInterval(progressInterval);
                        statusDiv.textContent = 'Bağlantı xətası!';
                        substatus.textContent = error.message;
                        statusIcon.innerHTML = '<i class="fas fa-wifi text-red-500"></i>';
                        
                        resultDiv.innerHTML = `
                            <div class="bg-red-100 border border-red-200 rounded-xl p-4">
                                <div class="flex items-center">
                                    <i class="fas fa-wifi text-red-600 mr-3 text-xl"></i>
                                    <div>
                                        <h4 class="font-semibold text-red-800">Bağlantı Xətası!</h4>
                                        <p class="text-red-700 text-sm">${error.message}</p>
                                    </div>
                                </div>
                            </div>
                        `;
                        
                        button.disabled = false;
                        button.innerHTML = '<i class="fas fa-play mr-2"></i> Quraşdırmanı Başlat';
                    }
                    
                    this.isInstalling = false;
                },
                
                nextStep() {
                    const nextStepNum = this.currentStep + 1;
                    if (nextStepNum <= 4 && nextStepNum <= this.maxStep) {
                        this.showStep(nextStepNum);
                    }
                },
                
                prevStep() {
                    if (this.currentStep > 1) {
                        this.showStep(this.currentStep - 1);
                    }
                }
            };
        }
        
        // Global functions for event handlers
        document.addEventListener('alpine:init', () => {
            // Initialize Alpine after DOM is ready
        });
        
        document.addEventListener('DOMContentLoaded', function() {
            // Get Alpine instance
            setTimeout(() => {
                const alpineData = Alpine.$data(document.querySelector('[x-data]'));
                
                // Check requirements button
                document.getElementById('check-requirements').addEventListener('click', () => {
                    alpineData.checkRequirements();
                });
                
                // Test database button
                document.getElementById('test-db').addEventListener('click', () => {
                    alpineData.testDatabase();
                });
                
                // Start installation button
                document.getElementById('start-install').addEventListener('click', () => {
                    alpineData.startInstallation();
                });
            }, 100);
        });
    </script>
</body>
</html>
