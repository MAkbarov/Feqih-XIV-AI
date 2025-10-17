<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('chat_feedback', function (Blueprint $table) {
            $table->id();
            $table->string('session_id')->nullable()->index();
            $table->unsignedBigInteger('message_id')->nullable()->index();
            $table->string('user_type', 20)->default('guest'); // guest|user
            $table->string('user_name')->nullable();
            $table->string('user_email')->nullable();
            $table->string('feedback_type', 20); // like|dislike|report
            $table->longText('message_content');
            $table->text('user_comment')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chat_feedback');
    }
};
