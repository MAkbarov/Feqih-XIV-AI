<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('ip_security_logs', function (Blueprint $table) {
            $table->id();
            $table->ipAddress('ip_address');
            $table->string('action_type'); // blocked_duplicate, rate_limit, suspicious_activity
            $table->text('description')->nullable();
            $table->json('request_data')->nullable();
            $table->boolean('is_resolved')->default(false);
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();
            
            $table->index(['ip_address', 'action_type']);
            $table->index(['is_resolved', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ip_security_logs');
    }
};
