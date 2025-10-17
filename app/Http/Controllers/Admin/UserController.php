<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Role;
use App\Models\ChatLimit;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;
use App\Models\Settings;
use App\Http\Controllers\Admin\Traits\HasFooterData;

class UserController extends Controller
{
    use HasFooterData;
    public function index(): Response
    {
        $users = User::with(['role'])
            ->leftJoin('user_chat_limits', 'users.id', '=', 'user_chat_limits.user_id')
            ->select('users.*', 
                'user_chat_limits.daily_limit', 
                'user_chat_limits.monthly_limit',
                'user_chat_limits.unlimited_access'
            )
            ->orderBy('users.created_at', 'desc')
            ->paginate(15)
            ->withQueryString();
        
        $roles = Role::all();

        // Provide blocked maps for UI badges (optional)
        $blockedUsers = json_decode(\App\Models\Settings::get('blocked_users', '{}') ?: '{}', true) ?: [];
        $blockedIps = json_decode(\App\Models\Settings::get('blocked_ips', '{}') ?: '{}', true) ?: [];

        return Inertia::render('Admin/Users/Index', $this->addFooterDataToResponse([
            'users' => $users,
            'roles' => $roles,
            'blockedUsers' => $blockedUsers,
            'blockedIps' => $blockedIps,
        ]));
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|max:255|unique:users,email,' . $user->id,
            'role_id' => 'sometimes|required|exists:roles,id',
            'daily_limit' => 'nullable|integer|min:0',
            'monthly_limit' => 'nullable|integer|min:0',
            'limit_type' => 'nullable|in:daily,monthly',
            'unlimited_access' => 'sometimes|boolean',
            'reset_limits' => 'sometimes|boolean',
        ]);

        DB::transaction(function() use ($user, $validated) {
            // Update user core fields only if provided
            $userData = [];
            if (array_key_exists('name', $validated)) $userData['name'] = $validated['name'];
            if (array_key_exists('email', $validated)) $userData['email'] = $validated['email'];
            if (array_key_exists('role_id', $validated)) $userData['role_id'] = $validated['role_id'];
            if (!empty($userData)) {
                $user->update($userData);
            }

            // Update or create user-specific chat limits if any of these fields present
            if (array_key_exists('unlimited_access', $validated) || array_key_exists('daily_limit', $validated) || array_key_exists('monthly_limit', $validated) || array_key_exists('limit_type', $validated) || array_key_exists('reset_limits', $validated)) {
                $limit = \App\Models\UserChatLimit::firstOrNew(['user_id' => $user->id]);
                if (array_key_exists('unlimited_access', $validated)) {
                    $limit->unlimited_access = (bool)$validated['unlimited_access'];
                }
                // Enforce single limit type
                $type = $validated['limit_type'] ?? null;
                if ($type === 'daily') {
                    $limit->daily_limit = $validated['daily_limit'] ?? $limit->daily_limit;
                    $limit->monthly_limit = null;
                } elseif ($type === 'monthly') {
                    $limit->monthly_limit = $validated['monthly_limit'] ?? $limit->monthly_limit;
                    $limit->daily_limit = null;
                } else {
                    // If no type provided, keep existing type but update provided values
                    if (array_key_exists('daily_limit', $validated)) {
                        $limit->daily_limit = $validated['daily_limit'];
                        // Clear monthly if daily provided
                        $limit->monthly_limit = null;
                    }
                    if (array_key_exists('monthly_limit', $validated)) {
                        $limit->monthly_limit = $validated['monthly_limit'];
                        // Clear daily if monthly provided
                        $limit->daily_limit = null;
                    }
                }
                $limit->save();

                // Optionally reset counters immediately if requested
                if (!empty($validated['reset_limits'])) {
                    if (class_exists(\App\Services\ChatLimitService::class)) {
                        try {
                            app(\App\Services\ChatLimitService::class)->resetUserLimits($user->id);
                        } catch (\Throwable $e) {
                            \Log::warning('Failed to reset user limits: '.$e->getMessage());
                        }
                    }
                }
            }
        });

        return back()->with('success', 'User updated');
    }

    public function destroy(User $user)
    {
        $user->delete();
        return back()->with('success', 'User deleted');
    }


    /**
     * Block a user and/or their IP with a reason.
     */
    public function block(Request $request, User $user)
    {
        $validated = $request->validate([
            'block_account' => 'sometimes|boolean',
            'block_ip' => 'sometimes|boolean',
            'ip_address' => 'nullable|ip',
            'reason' => 'nullable|string|max:1000',
        ]);

        // Load existing JSON settings or init to arrays
        $blockedUsersJson = Settings::get('blocked_users', '{}');
        $blockedIpsJson = Settings::get('blocked_ips', '{}');
        
        $blockedUsers = json_decode($blockedUsersJson ?: '{}', true);
        if (!is_array($blockedUsers)) { $blockedUsers = []; }
        $blockedIps = json_decode($blockedIpsJson ?: '{}', true);
        if (!is_array($blockedIps)) { $blockedIps = []; }

        $reason = $validated['reason'] ?? null;
        $now = now()->toDateTimeString();

        // Block account
        if (!empty($validated['block_account'])) {
            $blockedUsers[(string)$user->id] = [
                'reason' => $reason,
                'timestamp' => $now,
                'email' => $user->email,
                'name' => $user->name,
            ];
        }

        // Block IP
        if (!empty($validated['block_ip'])) {
            $ip = $validated['ip_address'] ?? $user->registration_ip;
            if ($ip) {
                $blockedIps[$ip] = [
                    'reason' => $reason,
                    'timestamp' => $now,
                    'user_id' => $user->id,
                    'email' => $user->email,
                ];
            }
        }

        // Persist back to settings
        Settings::set('blocked_users', json_encode($blockedUsers));
        Settings::set('blocked_ips', json_encode($blockedIps));

        return back()->with('success', 'Hesab/IP bloklandı');
    }
}

