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
        if (!Schema::hasTable('user_backgrounds')) {
            Schema::create('user_backgrounds', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->enum('active_type', ['solid', 'gradient', 'image', 'default'])->default('solid');
                $table->string('solid_color', 7)->nullable(); // Hex color
                $table->text('gradient_value')->nullable(); // CSS gradient
                $table->string('image_url')->nullable(); // Image URL
                $table->enum('image_size', ['cover', 'contain', 'auto', '100% 100%'])->default('cover');
                $table->string('image_position')->default('center'); // CSS position
                $table->timestamps();
                
                $table->unique('user_id'); // One background per user
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_backgrounds');
    }
};
