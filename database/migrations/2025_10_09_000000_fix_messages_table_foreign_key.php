<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;


return new class extends Migration {
    public function up(): void
    {
        // First, clean up orphaned records that don't have valid chat_session_id
        \DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        
        // Delete messages that reference non-existent chat sessions
        \DB::statement('
            DELETE messages FROM messages 
            LEFT JOIN chat_sessions ON messages.chat_session_id = chat_sessions.id 
            WHERE chat_sessions.id IS NULL AND messages.chat_session_id IS NOT NULL
        ');
        
        // Also handle NULL chat_session_id - set to a default session or delete
        $defaultSession = \DB::table('chat_sessions')->first();
        if ($defaultSession) {
            \DB::table('messages')
                ->whereNull('chat_session_id')
                ->update(['chat_session_id' => $defaultSession->id]);
        } else {
            // If no sessions exist, delete orphaned messages
            \DB::table('messages')->whereNull('chat_session_id')->delete();
        }
        
        \DB::statement('SET FOREIGN_KEY_CHECKS=1;');
        
        // Now safely add the foreign key constraint
        Schema::table('messages', function (Blueprint $table) {
            // Check if foreign key already exists first
            $foreignKeys = \DB::select(
                "SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
                 WHERE TABLE_SCHEMA = DATABASE() 
                 AND TABLE_NAME = 'messages' 
                 AND COLUMN_NAME = 'chat_session_id' 
                 AND REFERENCED_TABLE_NAME = 'chat_sessions'"
            );
            
            if (empty($foreignKeys)) {
                $table->foreign('chat_session_id')->references('id')->on('chat_sessions')->onDelete('cascade');
            }
        });
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropForeign(['chat_session_id']);
        });
    }
};