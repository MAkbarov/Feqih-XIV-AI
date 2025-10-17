<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('system_update_logs', function (Blueprint $table) {
            $table->id();
            $table->string('version_from')->nullable();
            $table->string('version_to')->nullable();
            $table->enum('status', ['success', 'failed']);
            $table->text('message')->nullable();
            $table->longText('release_notes')->nullable();
            $table->longText('log_excerpt')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('system_update_logs');
    }
};
