<?php

/**
 * XIV AI - Advanced AI Chatbot Platform
 * Version: v1.0.0
 * Release Date: 28.09.2025
 * Author: DeXIV
 * 
 * Chat Management Controller - Admin chat management functionality
 * Handles viewing, deleting individual and bulk chat operations.
 */

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ChatSession;
use App\Models\Message;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class ChatManagementController extends Controller
{
    /**
     * Display chat management page
     */
    public function index(Request $request)
    {
        $search = $request->get('search');
        $perPage = $request->get('per_page', 25);
        
        $query = ChatSession::with(['user', 'messages'])
            ->withCount('messages');
            
        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhereHas('user', function($userQuery) use ($search) {
                      $userQuery->where('name', 'like', "%{$search}%")
                               ->orWhere('email', 'like', "%{$search}%");
                  })
                  ->orWhere('session_id', 'like', "%{$search}%");
            });
        }
        
        $chatSessions = $query->latest()
            ->paginate($perPage)
            ->withQueryString();
            
        // Get statistics
        $stats = [
            'total_chats' => ChatSession::count(),
            'total_messages' => Message::count(),
            'active_chats' => ChatSession::where('is_active', true)->count(),
            'guest_chats' => ChatSession::whereNull('user_id')->count(),
            'user_chats' => ChatSession::whereNotNull('user_id')->count(),
            'today_chats' => ChatSession::whereDate('created_at', today())->count(),
        ];
        
        return Inertia::render('Admin/ChatManagement/Index', [
            'chatSessions' => $chatSessions,
            'stats' => $stats,
            'filters' => [
                'search' => $search,
                'per_page' => $perPage
            ]
        ]);
    }
    
    /**
     * Delete individual chat session
     */
    public function deleteSession($sessionId)
    {
        $session = ChatSession::where('session_id', $sessionId)
            ->orWhere('id', $sessionId)
            ->firstOrFail();
            
        $session->delete();
        
        return back()->with('success', 'Söhbət uğurla silindi');
    }
    
    /**
     * Bulk delete selected chat sessions
     */
    public function bulkDelete(Request $request)
    {
        $request->validate([
            'session_ids' => 'required|array',
            'session_ids.*' => 'string'
        ]);
        
        $deletedCount = ChatSession::whereIn('session_id', $request->session_ids)
            ->orWhereIn('id', $request->session_ids)
            ->delete();
            
        return back()->with('success', "{$deletedCount} söhbət uğurla silindi");
    }
    
    /**
     * Delete all chat sessions
     */
    public function deleteAll(Request $request)
    {
        $request->validate([
            'confirmation' => 'required|string|in:HAMISINI_SIL'
        ]);
        
        $deletedCount = 0;
        
        DB::transaction(function() use (&$deletedCount) {
            // Count sessions before deletion
            $deletedCount = ChatSession::count();
            
            // Avoid foreign key constraint issues by deleting in correct order
            Message::query()->delete();
            ChatSession::query()->delete();
        });
        
        return back()->with('success', "Bütün söhbətlər uğurla silindi ({$deletedCount} söhbət)");
    }
    
    /**
     * View detailed chat session
     */
    public function show(Request $request, $sessionId)
    {
        $session = ChatSession::with(['user'])
            ->where('session_id', $sessionId)
            ->orWhere('id', $sessionId)
            ->firstOrFail();

        $perPage = 10; // paginate 10 per page (requested 10/10)

        $messages = Message::where('chat_session_id', $session->id)
            ->orderBy('created_at', 'asc')
            ->paginate($perPage)
            ->through(function ($m) {
                return [
                    'id' => $m->id,
                    'sender' => $m->role === 'user' ? 'user' : 'assistant',
                    'message' => $m->content,
                    'created_at' => $m->created_at,
                ];
            })
            ->withQueryString();
        
        return Inertia::render('Admin/ChatManagement/Show', [
            'session' => $session,
            'messages' => $messages,
        ]);
    }
    
    /**
     * Get chat statistics for dashboard
     */
    public function getStats()
    {
        $stats = [
            'total_chats' => ChatSession::count(),
            'total_messages' => Message::count(),
            'active_chats' => ChatSession::where('is_active', true)->count(),
            'guest_chats' => ChatSession::whereNull('user_id')->count(),
            'user_chats' => ChatSession::whereNotNull('user_id')->count(),
            'today_chats' => ChatSession::whereDate('created_at', today())->count(),
            'this_week_chats' => ChatSession::whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()])->count(),
            'this_month_chats' => ChatSession::whereMonth('created_at', now()->month)->count(),
        ];
        
        return response()->json($stats);
    }
}
