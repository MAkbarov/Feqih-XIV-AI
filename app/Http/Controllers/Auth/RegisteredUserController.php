<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\Settings;
use App\Models\User;
use App\Services\ChatLimitService;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    private ChatLimitService $chatLimitService;
    
    public function __construct(ChatLimitService $chatLimitService)
    {
        $this->chatLimitService = $chatLimitService;
    }
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register', [
            'theme' => [
                'primary_color' => Settings::get('primary_color', '#10b981'),
                'secondary_color' => Settings::get('secondary_color', '#059669'),
                'accent_color' => Settings::get('accent_color', '#fbbf24'),
                'background_gradient' => Settings::get('background_gradient', 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'),
                'text_color' => Settings::get('text_color', '#1f2937'),
            ],
            'settings' => [
                'chatbot_name' => Settings::get('chatbot_name', 'AI Assistant'),
                'site_name' => Settings::get('site_name', 'AI Chatbot Platform'),
            ],
        ]);
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'terms_accepted' => 'required|accepted',
        ]);
        
        // XIV AI IP Security Check
        $ipAddress = $request->ip();
        $ipCheck = $this->chatLimitService->checkIpForDuplicateRegistration(
            $ipAddress,
            $request->email,
            $request->name
        );
        
        if (!$ipCheck['allowed']) {
            return back()->withErrors([
                'ip_security' => $ipCheck['message']
            ]);
        }

        $roleUser = Role::firstOrCreate(['name' => 'user']);
        $roleAdmin = Role::firstOrCreate(['name' => 'admin']);

        $isFirstUser = User::count() === 0;

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role_id' => $isFirstUser ? $roleAdmin->id : $roleUser->id,
            'registration_ip' => $ipAddress,
        ]);

        event(new Registered($user));

        Auth::login($user);

        return redirect(route('dashboard', absolute: false));
    }
}

