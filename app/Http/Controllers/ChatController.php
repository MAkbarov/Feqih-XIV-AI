<?php

/**
 * XIV AI - Advanced AI Chatbot Platform
 * Version: v1.0.0
 * Release Date: 28.09.2025
 * Author: DeXIV
 * 
 * Chat Controller - Main chat functionality handler
 * Handles chat sessions, messages, limits, and AI interactions.
 */

namespace App\Http\Controllers;

use App\Models\ChatSession;
use App\Models\Message;
use App\Models\Settings;
use App\Models\UserLimit;
use App\Models\DonationPage;
use App\Models\ChatFeedback;
use App\Services\AiService;
use App\Services\AiServiceEnhanced;
use App\Services\ChatLimitService;
use App\Services\TrainingService;
use App\Services\EmbeddingService;
use App\Services\QueryIntentService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use App\Mail\FeedbackReportMail;

class ChatController extends Controller
{
    protected $aiService;
    protected $chatLimitService;
    protected QueryIntentService $intentService;

    public function __construct(
        TrainingService $trainingService,
        EmbeddingService $embeddingService,
        ChatLimitService $chatLimitService,
        QueryIntentService $intentService
    ) {
        // Enhanced AI service istifadə et - daha yaxşı query understanding
        $this->aiService = new AiServiceEnhanced($trainingService, $embeddingService);
        $this->chatLimitService = $chatLimitService;
        $this->intentService = $intentService;
    }

    public function index(): Response
    {
        $sessions = auth()->check()
            ? auth()->user()->chatSessions()->where('is_active', true)->latest()->get()
            : [];

        $user = auth()->user();
        if ($user) {
            $user->load('role');
        }
        
        return Inertia::render('Chat/Index', [
            'auth' => [ 'user' => $user ],
            'sessions' => $sessions,
'settings' => [
                'chatbot_name' => Settings::get('chatbot_name', 'XIV AI'),
                'site_name' => Settings::get('site_name', 'XIV AI Chatbot Platform'),
                // Branding
                'brand_mode' => Settings::get('brand_mode', 'icon'),
                'brand_icon_name' => Settings::get('brand_icon_name', 'nav_chat'),
                'brand_logo_url' => Settings::get('brand_logo_url', ''),
                // Variant logos for auto-adapt (desktop/mobile, light/dark)
                'brand_logo_desktop_light' => Settings::get('brand_logo_desktop_light', ''),
                'brand_logo_desktop_dark' => Settings::get('brand_logo_desktop_dark', ''),
                'brand_logo_mobile_light' => Settings::get('brand_logo_mobile_light', ''),
                'brand_logo_mobile_dark' => Settings::get('brand_logo_mobile_dark', ''),
                // Chat settings
                'message_input_limit' => (int) Settings::get('message_input_limit', (int) Settings::get('guest_input_limit', 500)),
                'guest_input_limit' => (int) Settings::get('message_input_limit', (int) Settings::get('guest_input_limit', 500)),
                'guest_output_limit' => (int) Settings::get('guest_output_limit', 1000),
                'enter_sends_message' => (bool) Settings::get('enter_sends_message', true),
                'ai_response_type' => Settings::get('ai_response_type', 'typewriter'),
                'ai_typing_speed' => (int) Settings::get('ai_typing_speed', 50),
                'ai_thinking_time' => (int) Settings::get('ai_thinking_time', 1000),
                'chat_disclaimer_text' => Settings::get('chat_disclaimer_text', 'Çatbotun cavablarını yoxlayın, səhv edə bilər!'),
            ],
            'theme' => Settings::getThemeColors(),
            'footerSettings' => [
                'footer_enabled' => (bool) Settings::get('footer_enabled', true),
                'footer_text' => Settings::get('footer_text', '© 2025 XIV AI. Bütün hüquqlar qorunur.'),
                'footer_text_color' => Settings::get('footer_text_color', '#6B7280'),
                'footer_author_text' => Settings::get('footer_author_text', 'Developed by DeXIV'),
                'footer_author_color' => Settings::get('footer_author_color', '#6B7280'),
                'site_name' => Settings::get('site_name', 'XIV AI'),
            ],
        ]);
    }

    public function sendMessage(Request $request)
    {
        $request->validate(['message' => 'required|string']);

        $message = $request->input('message');
        
        // Enforce input length (admin-configured)
        $maxInput = (int) \App\Models\Settings::get('message_input_limit', (int) \App\Models\Settings::get('guest_input_limit', 500));
        if ($maxInput > 0 && mb_strlen($message) > $maxInput) {
            $message = mb_substr($message, 0, $maxInput);
        }
        $sessionId = $request->input('session_id');
        $messageLength = strlen($message);
        
        // XIV AI Chat Limit System
        $user = auth()->user();
        $ipAddress = $this->getClientIp($request);
        [$deviceId, $deviceCookie] = $this->getOrCreateDeviceId($request);
        
        // Check message limits
        $limitCheck = $this->chatLimitService->checkMessageLimit($user, $ipAddress, $deviceId);
        if (!$limitCheck['allowed']) {
            $resp = response()->json([
                'error' => $this->chatLimitService->getLimitMessage(),
                'limit_exceeded' => true,
                'remaining' => $limitCheck['remaining'] ?? 0,
                'daily_remaining' => $limitCheck['daily_remaining'] ?? 0,
                'monthly_remaining' => $limitCheck['monthly_remaining'] ?? 0,
                'reset_time' => $limitCheck['reset_time'] ?? null,
                'monthly_reset_time' => $limitCheck['monthly_reset_time'] ?? null,
                'limit_type' => $limitCheck['limit_type'] ?? null,
                'limit_value' => $limitCheck['limit_value'] ?? null
            ], 429); // Too Many Requests
            if ($deviceCookie) { $resp->headers->setCookie($deviceCookie); }
            return $resp;
        }

        // Get or create session
        if (!$sessionId) {
            $sessionId = Str::uuid()->toString();
        }

        $chatSession = ChatSession::firstOrCreate(
            ['session_id' => $sessionId],
            [
                'user_id' => auth()->id(),
                'title' => Str::limit($message, 50),
                'is_active' => true,
                'ip_address' => $ipAddress,
            ]
        );

        // Save user message
        $userMessage = $chatSession->messages()->create([
            'role' => 'user',
            'content' => $message,
        ]);

        try {
            // Prepare messages for AI - System prompt will be handled by AiService
            $messages = [];

            // Include recent message history
            $recentMessages = $chatSession->messages()
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get()
                ->reverse()
                ->map(fn($msg) => ['role' => $msg->role, 'content' => $msg->content])
                ->toArray();

            $messages = array_merge($messages, $recentMessages);

            // If RAG is enabled, ONLY use RAG - no fallback to general AI
            $useRag = (bool) \App\Models\Settings::get('rag_enabled', false);
            if ($useRag) {
                // Intent-based routing (small-talk/meta/out-of-scope) for RAG path
                $intentRoutingEnabled = (bool) Settings::get('rag_intent_routing_enabled', true);
                $isContinuation = $request->boolean('continue') && $request->filled('kb_id');

                try {
                    /** @var \App\Services\RAGQueryService $rag */
                    $rag = app(\App\Services\RAGQueryService::class);

                    $ragOptions = [];
                    if ($isContinuation) {
                        $ragOptions['continue'] = true;
                        $ragOptions['kb_id'] = (int) $request->input('kb_id');
                        $ragOptions['start_after_index'] = (int) $request->input('start_after_index', -1);
                    }
                    // Optional topic anchoring from UI
                    if ($request->filled('context_kb_id')) {
                        $ragOptions['restrict_kb_id'] = (int) $request->input('context_kb_id');
                    }

                    $intent = null;
                    if ($intentRoutingEnabled && !$isContinuation) {
                        $intent = $this->intentService->detectIntent($message);
                    }

                    // Route SMALL_TALK / META / OUT_OF_SCOPE away from RAG
                    if ($intentRoutingEnabled && !$isContinuation && $intent !== null && $intent !== \App\Services\QueryIntentService::INTENT_FIQH_QUESTION) {
                        $answer = '';

                        if ($intent === \App\Services\QueryIntentService::INTENT_SMALL_TALK) {
                            $variants = [
                                'Salam! Necə kömək edə bilərəm? İslami məsələlərlə bağlı sualınız varsa, məmnuniyyətlə cavab verərəm.',
                                'Salamlar! Sizə necə kömək edə bilərəm? Dini mövzuları soruşa bilərsiniz.',
                                'Salam! Buyurun, sualınız varmı? Şəriət, ibadət və ya digər İslami məsələlər haqqında soruşa bilərsiniz.',
                                'Salam! Xoş gördük. İslami biliklərlə bağlı sualınızı yaza bilərsiniz.',
                                'Salamlar! Necəsən? Şəriət və ibadət mövzularında köməyə ehtiyacınız varsa, buyurun.',
                            ];
                            $answer = $variants[array_rand($variants)];
                        } elseif ($intent === \App\Services\QueryIntentService::INTENT_META) {
                            $defaultMeta = 'Mən yalnız İslam fiqhi və şəriət mövzularında, admin tərəfindən əlavə edilmiş etibarlı mənbələr əsasında cavab verirəm. Digər mövzularda və ya şəxsi fətva tələb edən suallarda cavab vermirəm.';
                            $answer = (string) Settings::get('ai_meta_message', $defaultMeta);
                        } elseif ($intent === \App\Services\QueryIntentService::INTENT_OUT_OF_SCOPE) {
                            $defaultOoS = 'Bu sistem yalnız İslam fiqhi və şəriət mövzularına aid suallara cavab verir. Bu mövzudan kənar suallara cavab vermir.';
                            $answer = (string) Settings::get('ai_out_of_scope_message', $defaultOoS);
                        }

                        if ($answer === '') {
                            // Safety: if for some reason we ended up here without an answer, fall back to RAG.
                            $intent = \App\Services\QueryIntentService::INTENT_FIQH_QUESTION;
                        } else {
                            // Save assistant message (non-RAG path)
                            $assistantMessage = $chatSession->messages()->create([
                                'role' => 'assistant',
                                'content' => $answer,
                                'tokens_used' => 0,
                            ]);

                            // Track message count for limits
                            $this->chatLimitService->incrementMessageCount($user, $ipAddress, $deviceId);
                            $updatedLimitCheck = $this->chatLimitService->checkMessageLimit($user, $ipAddress, $deviceId);

                            $resp = response()->json([
                                'session_id' => $sessionId,
                                'message' => $assistantMessage->content,
                                'tokens' => 0,
                                'rag' => [
                                    'used' => false,
                                    'intent' => $intent,
                                    'sources' => [],
                                    'metadata' => [],
                                ],
                                'continuation' => false,
                                'limit_info' => [
                                    'remaining' => $updatedLimitCheck['remaining'] ?? 0,
                                    'daily_remaining' => $updatedLimitCheck['daily_remaining'] ?? 0,
                                    'monthly_remaining' => $updatedLimitCheck['monthly_remaining'] ?? 0,
                                    'reset_time' => $updatedLimitCheck['reset_time'] ?? null,
                                    'monthly_reset_time' => $updatedLimitCheck['monthly_reset_time'] ?? null,
                                    'limit_type' => $updatedLimitCheck['limit_type'] ?? null,
                                    'limit_value' => $updatedLimitCheck['limit_value'] ?? null
                                ]
                            ]);
                            if ($deviceCookie) { $resp->headers->setCookie($deviceCookie); }
                            return $resp;
                        }
                    }

                    // Default / fiqh questions / continuations → full RAG path
                    $ragResult = $rag->query($message, $ragOptions);
                    $ragAnswer = is_string($ragResult['answer'] ?? null) ? $ragResult['answer'] : '';

                    // Save assistant message from RAG
                    $assistantMessage = $chatSession->messages()->create([
                        'role' => 'assistant',
                        'content' => $ragAnswer,
                        'tokens_used' => 0,
                    ]);

                    // Track message count for limits
                    $this->chatLimitService->incrementMessageCount($user, $ipAddress, $deviceId);

                    // Get updated limit info
                    $updatedLimitCheck = $this->chatLimitService->checkMessageLimit($user, $ipAddress, $deviceId);

                    $ragMeta = $ragResult['metadata'] ?? [];
                    if (!isset($ragMeta['intent']) && $intent !== null) {
                        $ragMeta['intent'] = $intent;
                    }

                    $resp = response()->json([
                        'session_id' => $sessionId,
                        'message' => $assistantMessage->content,
                        'tokens' => 0,
                        'rag' => [
                            'used' => true,
                            'sources' => $ragResult['sources'] ?? [],
                            'metadata' => $ragMeta,
                        ],
                        'continuation' => $ragResult['metadata']['continuation'] ?? false,
                        'limit_info' => [
                            'remaining' => $updatedLimitCheck['remaining'] ?? 0,
                            'daily_remaining' => $updatedLimitCheck['daily_remaining'] ?? 0,
                            'monthly_remaining' => $updatedLimitCheck['monthly_remaining'] ?? 0,
                            'reset_time' => $updatedLimitCheck['reset_time'] ?? null,
                            'monthly_reset_time' => $updatedLimitCheck['monthly_reset_time'] ?? null,
                            'limit_type' => $updatedLimitCheck['limit_type'] ?? null,
                            'limit_value' => $updatedLimitCheck['limit_value'] ?? null
                        ]
                    ]);
                    if ($deviceCookie) { $resp->headers->setCookie($deviceCookie); }
                    return $resp;
                } catch (\Throwable $e) {
                    \Log::error('RAG query failed', ['error' => $e->getMessage()]);
                    
                    // Return error message when RAG fails - no fallback to general AI
                    $noDataMessage = \App\Models\Settings::get('ai_no_data_message', 'Bağışlayın, bu mövzu haqqında məlumat bazamda dəqiq məlumat tapılmadı.');
                    $assistantMessage = $chatSession->messages()->create([
                        'role' => 'assistant',
                        'content' => $noDataMessage,
                        'tokens_used' => 0,
                    ]);

                    $this->chatLimitService->incrementMessageCount($user, $ipAddress, $deviceId);
                    $updatedLimitCheck = $this->chatLimitService->checkMessageLimit($user, $ipAddress, $deviceId);

                    $resp = response()->json([
                        'session_id' => $sessionId,
                        'message' => $assistantMessage->content,
                        'tokens' => 0,
                        'rag' => [
                            'used' => true,
                            'error' => true,
                            'sources' => [],
                            'metadata' => []
                        ],
                        'limit_info' => [
                            'remaining' => $updatedLimitCheck['remaining'] ?? 0,
                            'daily_remaining' => $updatedLimitCheck['daily_remaining'] ?? 0,
                            'monthly_remaining' => $updatedLimitCheck['monthly_remaining'] ?? 0,
                            'reset_time' => $updatedLimitCheck['reset_time'] ?? null,
                            'monthly_reset_time' => $updatedLimitCheck['monthly_reset_time'] ?? null,
                            'limit_type' => $updatedLimitCheck['limit_type'] ?? null,
                            'limit_value' => $updatedLimitCheck['limit_value'] ?? null
                        ]
                    ]);
                    if ($deviceCookie) { $resp->headers->setCookie($deviceCookie); }
                    return $resp;
                }
            }

            // Get AI response - no output limit, let AI decide based on context
            $aiResponse = $this->aiService->chat($messages);

            // Save AI message
            $assistantMessage = $chatSession->messages()->create([
                'role' => 'assistant',
                'content' => $aiResponse['content'],
                'tokens_used' => $aiResponse['tokens'] ?? 0,
            ]);
            
            // Track message count for limits
            $this->chatLimitService->incrementMessageCount($user, $ipAddress, $deviceId);

            // Get updated limit info
            $updatedLimitCheck = $this->chatLimitService->checkMessageLimit($user, $ipAddress, $deviceId);
            
            $resp = response()->json([
                'session_id' => $sessionId,
                'message' => $assistantMessage->content,
                'tokens' => $aiResponse['tokens'] ?? 0,
                'rag' => [ 'used' => false ],
                'limit_info' => [
                    'remaining' => $updatedLimitCheck['remaining'] ?? 0,
                    'daily_remaining' => $updatedLimitCheck['daily_remaining'] ?? 0,
                    'monthly_remaining' => $updatedLimitCheck['monthly_remaining'] ?? 0,
                    'reset_time' => $updatedLimitCheck['reset_time'] ?? null,
                    'monthly_reset_time' => $updatedLimitCheck['monthly_reset_time'] ?? null,
                    'limit_type' => $updatedLimitCheck['limit_type'] ?? null,
                    'limit_value' => $updatedLimitCheck['limit_value'] ?? null
                ]
            ]);
            if ($deviceCookie) { $resp->headers->setCookie($deviceCookie); }
            return $resp;

        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to get AI response: ' . $e->getMessage()], 500);
        }
    }

    public function getSession(string $sessionId)
    {
        $session = ChatSession::where('session_id', $sessionId)
            ->when(auth()->check(), fn($q) => $q->where('user_id', auth()->id()))
            ->firstOrFail();

        $messages = $session->messages()->orderBy('created_at')->get();

        return response()->json([
            'session' => $session,
            'messages' => $messages,
        ]);
    }

    public function deleteSession(Request $request, string $sessionId)
    {
        $user = auth()->user();
        $ipAddress = $this->getClientIp($request);
        
        $query = ChatSession::where('session_id', $sessionId);
        
        if ($user) {
            // Authenticated users must own the session
            $query->where('user_id', $user->id);
        } else {
            // Guests: on some hosts IP detection may differ behind proxies/CF.
            // Allow deleting guest sessions by session_id when user_id is null,
            // and do not hard-enforce IP equality to avoid false negatives.
            $query->whereNull('user_id');
        }
        
        $session = $query->firstOrFail();
        $session->delete();

        return response()->json(['success' => true]);
    }

    public function stopGeneration(Request $request)
    {
        // For now, we'll just return success since the frontend will handle the actual stopping
        // In a more advanced implementation, you could track active generations and cancel them
        return response()->json(['success' => true, 'message' => 'Generation stopped']);
    }

    /**
     * Köhnə feedback sistemi - şikayət göndərmək üçün
     */
public function reportFeedback(Request $request)
    {
        $request->validate([
            'message_content' => 'required|string',
            'message_id' => 'nullable|string',
            'session_id' => 'nullable|string',
            'timestamp' => 'nullable|string',
            'user_info' => 'nullable',
            'comment' => 'nullable|string|max:1000',
        ]);

        // Cədvələ yaz (optional user comment supported)
        $this->saveFeedback($request, ChatFeedback::FEEDBACK_REPORT, $request->comment);

        $feedbackData = [
            'message_content' => $request->message_content,
            'message_id' => $request->message_id,
            'session_id' => $request->session_id,
            'timestamp' => $request->timestamp,
            'user_info' => $request->user_info,
            'reported_at' => now()->format('d.m.Y H:i:s'),
            'ip_address' => $request->ip(),
            'user_message' => null,
            'assistant_message' => $request->message_content,
        ];

        // Enrich with conversation context: prior user message and assistant message
        try {
            $assistantMessage = null;
            if (!empty($request->message_id) && is_numeric($request->message_id)) {
                $assistantMessage = \App\Models\Message::find((int)$request->message_id);
            }
            if (!$assistantMessage && !empty($request->session_id)) {
                // Fallback: latest assistant message in session
                $assistantMessage = \App\Models\Message::whereHas('chatSession', function($q) use ($request) {
                        $q->where('session_id', $request->session_id);
                    })
                    ->where('role', 'assistant')
                    ->orderBy('id', 'desc')
                    ->first();
            }
            if ($assistantMessage) {
                $feedbackData['assistant_message'] = $assistantMessage->content;
                // Find immediately preceding user message in same session
                $userMsg = \App\Models\Message::where('chat_session_id', $assistantMessage->chat_session_id)
                    ->where('role', 'user')
                    ->where('id', '<', $assistantMessage->id)
                    ->orderBy('id', 'desc')
                    ->first();
                if ($userMsg) {
                    $feedbackData['user_message'] = $userMsg->content;
                }
            }
        } catch (\Throwable $e) {
            \Log::warning('Failed to enrich feedback email with context: '.$e->getMessage());
        }

        try {
            // Get admin email from settings, fallback to app admin email
            $adminEmail = Settings::get('admin_email', config('mail.from.address', 'admin@example.com'));
            
            // Log feedback for debugging
            \Log::info('Feedback report received', $feedbackData);

            // Create admin notification (Settings-backed)
            try {
                $items = json_decode(\App\Models\Settings::get('admin_notifications', '[]') ?: '[]', true) ?: [];
                $items[] = [
                    'id' => (string) \Illuminate\Support\Str::uuid(),
                    'type' => 'feedback',
                    'title' => 'Yeni feedback göndərildi',
'message' => Str::limit($request->message_content, 140),
                    'link' => '/admin/chat-analytics',
                    'icon' => 'warning',
                    'read' => false,
                    'created_at' => now()->toIso8601String(),
                ];
                \App\Models\Settings::set('admin_notifications', json_encode($items));
            } catch (\Throwable $e) { \Log::warning('Notify store failed: '.$e->getMessage()); }
            
            // Send email to admin
            Mail::to($adminEmail)->send(new FeedbackReportMail($feedbackData));
            
            // Log successful email
            \Log::info('Feedback email sent successfully to: ' . $adminEmail);

            return response()->json([
                'success' => true,
                'message' => 'Geribildiriş uğurla göndərildi!'
            ]);

        } catch (\Exception $e) {
            \Log::error('Feedback report email failed: ' . $e->getMessage(), [
                'exception' => $e,
                'request_data' => $feedbackData
            ]);
            
            return response()->json([
                'error' => 'Email göndərmə xətası baş verdi: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Yeni feedback sistemi - bəyənmə/bəyənməmə
     */
    public function submitFeedback(Request $request)
    {
        $request->validate([
            'message_id' => 'nullable|string',
            'session_id' => 'nullable|string',
            'message_content' => 'required|string',
            'feedback_type' => 'required|in:like,dislike',
            'comment' => 'nullable|string|max:1000'
        ]);

        try {
            $this->saveFeedback($request, $request->feedback_type, $request->comment);
            
            $message = $request->feedback_type === 'like' ? 'Bəyəndiyiniz göndərildi!' : 'Rəyiniz qeyd edildi!';
            
            return response()->json([
                'success' => true,
                'message' => $message
            ]);
        } catch (\Exception $e) {
            \Log::error('Feedback submission failed: ' . $e->getMessage());
            
            return response()->json([
                'error' => 'Reaksiya göndərilmədi!'
            ], 500);
        }
    }

    /**
     * Feedback-i cədvələ yaz
     */
    private function saveFeedback(Request $request, string $feedbackType, string $comment = null)
    {
        $user = auth()->user();
        
        ChatFeedback::create([
            'session_id' => $request->session_id,
            // Store numeric IDs only; ignore string UI IDs to avoid DB type conflicts on some installs
            'message_id' => is_numeric($request->message_id) ? (int) $request->message_id : null,
            'user_type' => $user ? ChatFeedback::USER_TYPE_USER : ChatFeedback::USER_TYPE_GUEST,
            'user_name' => $user ? $user->name : 'Qonaq',
            'user_email' => $user ? $user->email : null,
            'feedback_type' => $feedbackType,
            'message_content' => $request->message_content,
            'user_comment' => $comment,
            'ip_address' => $this->getClientIp($request),
            'user_agent' => $request->userAgent()
        ]);
    }
    
    public function getChatLimits(Request $request)
    {
        $user = auth()->user();
        $ipAddress = $this->getClientIp($request);
        [$deviceId, $deviceCookie] = $this->getOrCreateDeviceId($request);
        
        $limitCheck = $this->chatLimitService->checkMessageLimit($user, $ipAddress, $deviceId);
        
        $resp = response()->json([
            'allowed' => $limitCheck['allowed'],
            'remaining' => $limitCheck['remaining'] ?? 0,
            'daily_remaining' => $limitCheck['daily_remaining'] ?? 0,
            'monthly_remaining' => $limitCheck['monthly_remaining'] ?? 0,
            'reset_time' => $limitCheck['reset_time'] ?? null,
            'monthly_reset_time' => $limitCheck['monthly_reset_time'] ?? null,
            'limit_type' => $limitCheck['limit_type'] ?? null,
            'limit_value' => $limitCheck['limit_value'] ?? null,
            'is_guest' => !$user,
            'user_type' => $user ? 'user' : 'guest'
        ]);
        if ($deviceCookie) { $resp->headers->setCookie($deviceCookie); }
        return $resp;
    }
    
    public function getFooterSettings()
    {
        return response()->json([
            'footer_enabled' => (bool) Settings::get('footer_enabled', true),
            'footer_text' => Settings::get('footer_text', '© 2025 XIV AI. Bütün hüquqlar qorunur.'),
            'footer_text_color' => Settings::get('footer_text_color', '#6B7280'),
            'footer_author_text' => Settings::get('footer_author_text', 'Developed by DeXIV'),
            'footer_author_color' => Settings::get('footer_author_color', '#6B7280'),
            // Additional Footer Elements (removed security texts)
            // Site branding
            'site_name' => Settings::get('site_name', 'XIV AI Chatbot Platform'),
            // Chat disclaimer
            'chat_disclaimer_text' => Settings::get('chat_disclaimer_text', 'Çatbotun cavablarını yoxlayın, səhv edə bilər!'),
        ]);
    }
    
    public function donation(): Response
    {
        $donationPage = DonationPage::where('is_enabled', true)->first();
        
        if (!$donationPage) {
            return redirect()->route('home')->with('error', 'İanə səhifəsi mövcud deyil.');
        }
        
        $user = auth()->user();
        if ($user) {
            $user->load('role');
        }
        
        return Inertia::render('Donation', [
            'auth' => [ 'user' => $user ],
            'donation' => [
                'title' => $donationPage->title,
                'content' => $donationPage->content,
                'display_settings' => is_array($donationPage->display_settings) ? $donationPage->display_settings : ($donationPage->display_settings ? json_decode($donationPage->display_settings, true) : []),
                'payment_methods' => is_array($donationPage->payment_methods) ? $donationPage->payment_methods : ($donationPage->payment_methods ? json_decode($donationPage->payment_methods, true) : []),
            ],
            'theme' => [
                'primary_color' => Settings::get('primary_color', '#10b981'),
                'secondary_color' => Settings::get('secondary_color', '#97a5a1'),
                'accent_color' => Settings::get('accent_color', '#fbbf24'),
                'background_gradient' => Settings::get('background_gradient', 'linear-gradient(135deg, #10b981 0%, #065f46 100%)'),
                'text_color' => Settings::get('text_color', '#1f2937'),
            ],
        ]);
    }
    /**
     * Extract real client IP, considering proxies and normalizing localhost.
     */
    private function getClientIp(\Illuminate\Http\Request $request): string
    {
        // Priority: CF-Connecting-IP, X-Forwarded-For (first), X-Real-IP, then remote addr
        $candidates = [];
        $cf = $request->headers->get('CF-Connecting-IP');
        if ($cf) { $candidates[] = $cf; }
        $xff = $request->headers->get('X-Forwarded-For');
        if ($xff) {
            // XFF may contain multiple IPs, client first
            foreach (explode(',', $xff) as $part) {
                $ip = trim($part);
                if ($ip) { $candidates[] = $ip; }
            }
        }
        $xri = $request->headers->get('X-Real-IP');
        if ($xri) { $candidates[] = $xri; }
        $candidates[] = $request->ip();

        foreach ($candidates as $ip) {
            // Normalize IPv4-mapped IPv6 addresses like ::ffff:192.0.2.128
            if (strpos($ip, '::ffff:') === 0) {
                $ip = substr($ip, 7);
            }
            if ($ip === '::1') {
                return '127.0.0.1';
            }
            if (filter_var($ip, FILTER_VALIDATE_IP)) {
                return $ip;
            }
        }
        return '0.0.0.0';
    }

    /**
     * Get or create a signed deviceId cookie to persist guest identity across browsers on same device.
     * Returns [deviceId, cookieToAttach|null].
     */
    private function getOrCreateDeviceId(\Illuminate\Http\Request $request): array
    {
        $existing = $request->cookie('device_id');
        if ($existing) {
            return [$existing, null];
        }
        $id = (string) \Illuminate\Support\Str::uuid();
        // One year, httpOnly, SameSite=Lax
        $cookie = cookie(
            'device_id',
            $id,
            60 * 24 * 365,
            '/',
            null,
            (bool) config('session.secure'),
            true,
            false,
            'Lax'
        );
        return [$id, $cookie];
    }
}

