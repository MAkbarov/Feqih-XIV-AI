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
        Schema::create('admin_notifications', function (Blueprint $table) {
            $table->id();
            $table->string('type'); // info, warning, error, feedback, system
            $table->string('title');
            $table->text('message')->nullable();
            $table->string('link')->nullable();
            $table->string('icon')->nullable();
            $table->boolean('is_read')->default(false);
            $table->boolean('is_important')->default(false);
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
            
            $table->index(['is_read', 'created_at']);
            $table->index(['is_important', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('admin_notifications');
    }
};
