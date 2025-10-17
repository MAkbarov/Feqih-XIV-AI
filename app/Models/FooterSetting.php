<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FooterSetting extends Model
{
    protected $primaryKey = 'key';
    public $incrementing = false;
    protected $keyType = 'string';
    
    protected $fillable = ['key', 'value'];

    protected $casts = [
        'value' => 'string',
    ];

    public $timestamps = true;
}

