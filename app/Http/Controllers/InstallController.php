<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Models\User;
use App\Models\Role;
use App\Models\Setting;
use App\Models\FooterSetting;
use Exception;

class InstallController extends Controller
{
    public function index()
    {
        // Check if already installed
        if ($this->isInstalled()) {
            return view('install.already-installed');
        }
        
        return view('install.index');
    }
    
    public function requirements()
    {
        if ($this->isInstalled()) {
            return redirect()->route('install.complete');
        }
        
        $requirements = $this->checkRequirements();
        
        return view('install.requirements', compact('requirements'));
    }
    
    public function database()
    {
        if ($this->isInstalled()) {
            return redirect()->route('install.complete');
        }
        
        return view('install.database');
    }
    
    public function testDatabase(Request $request)
    {
        $request->validate([
            'db_host' => 'required|string',
            'db_port' => 'required|numeric',
            'db_name' => 'required|string', 
            'db_username' => 'required|string'
            // db_password is completely optional
        ]);
        
        try {
            // Handle empty password for XAMPP
            $password = $request->db_password ?? '';
            
            $connection = new \PDO(
                "mysql:host={$request->db_host};port={$request->db_port};dbname={$request->db_name}",
                $request->db_username,
                $password
            );
            
            return response()->json(['success' => true, 'message' => 'Database connection successful!']);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => 'Database connection failed: ' . $e->getMessage()]);
        }
    }
    
    public function install(Request $request)
    {
        if ($this->isInstalled()) {
            return redirect()->route('install.complete');
        }
        
        $request->validate([
            'site_name' => 'required|string|max:255',
            'admin_name' => 'required|string|max:255',
            'admin_email' => 'required|email|max:255',
            // Strong password: at least 8 chars, 1 uppercase, 1 lowercase, 1 digit
            'admin_password' => ['required','string','min:8','regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/'],
            'db_host' => 'required|string',
            'db_port' => 'required|numeric',
            'db_name' => 'required|string',
            'db_username' => 'required|string'
            // db_password is completely optional - no validation
        ]);
        
        try {
            // Step 1: Create .env file
            $this->createEnvFile($request);
            
            // Step 2: Generate APP_KEY
            Artisan::call('key:generate', ['--force' => true]);
            
            // Step 3: Run migrations
            Artisan::call('migrate:fresh', ['--force' => true]);
            
            // Step 4: Create admin user
            $this->createAdminUser($request);
            
            // Step 5: Seed basic data
            $this->seedBasicData($request);
            
            // Step 6: Create install lock file
            File::put(base_path('.installed'), date('Y-m-d H:i:s'));
            
            return response()->json([
                'success' => true, 
                'message' => 'Installation completed successfully!',
                'redirect' => route('install.complete')
            ]);
            
        } catch (Exception $e) {
            return response()->json([
                'success' => false, 
                'message' => 'Installation failed: ' . $e->getMessage()
            ], 500);
        }
    }
    
    public function complete()
    {
        if (!$this->isInstalled()) {
            return redirect()->route('install.index');
        }
        
        return view('install.complete');
    }
    
    private function isInstalled()
    {
        return File::exists(base_path('.installed'));
    }
    
    private function checkRequirements()
    {
        return [
            'php_version' => [
                'required' => '8.1',
                'current' => phpversion(),
                'status' => version_compare(phpversion(), '8.1.0', '>=')
            ],
            'extensions' => [
                'openssl' => extension_loaded('openssl'),
                'pdo' => extension_loaded('pdo'),
                'mbstring' => extension_loaded('mbstring'),
                'tokenizer' => extension_loaded('tokenizer'),
                'xml' => extension_loaded('xml'),
                'ctype' => extension_loaded('ctype'),
                'json' => extension_loaded('json'),
                'bcmath' => extension_loaded('bcmath'),
                'curl' => extension_loaded('curl'),
                'zip' => extension_loaded('zip')
            ],
            'permissions' => [
                'storage' => is_writable(storage_path()),
                'bootstrap_cache' => is_writable(base_path('bootstrap/cache')),
                'env_file' => is_writable(base_path()) || !file_exists(base_path('.env'))
            ]
        ];
    }
    
    private function createEnvFile($request)
    {
        $envContent = "APP_NAME=\"" . $request->site_name . "\"
";
        $envContent .= "APP_ENV=production
";
        $envContent .= "APP_KEY=
";
        $envContent .= "APP_DEBUG=false
";
        $envContent .= "APP_TIMEZONE=UTC
";
        $envContent .= "APP_URL=" . url('/') . "

";
        
        $envContent .= "APP_LOCALE=az
";
        $envContent .= "APP_FALLBACK_LOCALE=en
";
        $envContent .= "APP_FAKER_LOCALE=en_US

";
        
        $envContent .= "APP_MAINTENANCE_DRIVER=file
";
        $envContent .= "APP_MAINTENANCE_STORE=database

";
        
        $envContent .= "BCRYPT_ROUNDS=12

";
        
        $envContent .= "LOG_CHANNEL=stack
";
        $envContent .= "LOG_STACK=single
";
        $envContent .= "LOG_DEPRECATIONS_CHANNEL=null
";
        $envContent .= "LOG_LEVEL=error

";
        
        $envContent .= "DB_CONNECTION=mysql
";
        $envContent .= "DB_HOST=" . $request->db_host . "
";
        $envContent .= "DB_PORT=" . $request->db_port . "
";
        $envContent .= "DB_DATABASE=" . $request->db_name . "
";
        $envContent .= "DB_USERNAME=" . $request->db_username . "
";
        $envContent .= "DB_PASSWORD=\"" . ($request->db_password ?? '') . "\"

";
        
        $envContent .= "SESSION_DRIVER=database
";
        $envContent .= "SESSION_LIFETIME=120
";
        $envContent .= "SESSION_ENCRYPT=false
";
        $envContent .= "SESSION_PATH=/
";
        // Do not write the literal string "null" here, leave empty to let Laravel handle domain
        $envContent .= "SESSION_DOMAIN=

";
        
        $envContent .= "BROADCAST_CONNECTION=log
";
        $envContent .= "FILESYSTEM_DISK=local
";
        $envContent .= "QUEUE_CONNECTION=database

";
        
        $envContent .= "CACHE_STORE=database
";
        $envContent .= "CACHE_PREFIX=

";
        
        $envContent .= "MEMCACHED_HOST=127.0.0.1

";
        
        $envContent .= "REDIS_CLIENT=phpredis
";
        $envContent .= "REDIS_HOST=127.0.0.1
";
        $envContent .= "REDIS_PASSWORD=null
";
        $envContent .= "REDIS_PORT=6379

";
        
        $envContent .= "MAIL_MAILER=log
";
        $envContent .= "MAIL_HOST=127.0.0.1
";
        $envContent .= "MAIL_PORT=2525
";
        $envContent .= "MAIL_USERNAME=null
";
        $envContent .= "MAIL_PASSWORD=null
";
        $envContent .= "MAIL_ENCRYPTION=null
";
        $envContent .= "MAIL_FROM_ADDRESS=\"hello@example.com\"
";
        $envContent .= "MAIL_FROM_NAME=\"" . $request->site_name . "\"

";
        
        $envContent .= "VITE_APP_NAME=\"" . $request->site_name . "\"

";
        
        $envContent .= "# AI Provider Settings
";
        $envContent .= "ANTHROPIC_API_KEY=
";
        $envContent .= "OPENAI_API_KEY=
";
        
        File::put(base_path('.env'), $envContent);
    }
    
    private function createAdminUser($request)
    {
        // Create admin role if it doesn't exist
        $adminRole = Role::firstOrCreate(
            ['name' => 'admin'],
            ['description' => 'Administrator']
        );
        
        // Create user role if it doesn't exist
        Role::firstOrCreate(
            ['name' => 'user'],
            ['description' => 'Regular User']
        );
        
        // Create admin user
        $adminUser = User::create([
            'name' => $request->admin_name,
            'email' => $request->admin_email,
            'password' => Hash::make($request->admin_password),
            'email_verified_at' => now(),
            'role_id' => $adminRole->id
        ]);
        
        return $adminUser;
    }
    
    private function seedBasicData($request)
    {
        // Basic site settings
        $settings = [
            'site_name' => $request->site_name,
            'chatbot_name' => 'AI Assistant',
            'primary_color' => '#3b82f6',
            'secondary_color' => '#10b981',
            'accent_color' => '#f59e0b',
            'text_color' => '#1f2937',
            'background_gradient' => 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'default_language' => 'az',
            'enable_guest_mode' => 'true',
            'enable_registration' => 'true',
            'guest_character_limit' => '500',
            'guest_message_limit' => '10',
            'maintenance_mode' => 'false',
            'chat_disclaimer_text' => '⚠️ Çatbotun cavablarını yoxlayın, səhv edə bilər!',
            'ai_response_type' => 'typewriter',
            'ai_typing_speed' => '50',
            'ai_thinking_time' => '1000'
        ];
        
        foreach ($settings as $key => $value) {
            Setting::create([
                'key' => $key,
                'value' => $value,
                'created_at' => now(),
                'updated_at' => now()
            ]);
        }
        
        // Footer settings
        FooterSetting::create([
            'key' => 'footer_text',
            'value' => '© ' . date('Y') . ' ' . $request->site_name . '. Bütün hüquqlar qorunur.',
            'created_at' => now(),
            'updated_at' => now()
        ]);
    }
}

