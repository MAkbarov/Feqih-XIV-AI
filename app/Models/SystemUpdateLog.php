<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SystemUpdateLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'version_from',
        'version_to',
        'status', // success | failed
        'message',
        'release_notes',
        'log_excerpt',
    ];
}
