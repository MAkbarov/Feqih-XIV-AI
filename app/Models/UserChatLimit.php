<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserChatLimit extends Model
{
    use HasFactory;

    protected $table = 'user_chat_limits';

    protected $fillable = [
        'user_id',
        'daily_limit',
        'monthly_limit',
        'unlimited_access',
    ];

    protected $casts = [
        'unlimited_access' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}