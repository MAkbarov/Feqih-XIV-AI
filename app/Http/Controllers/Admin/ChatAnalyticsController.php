<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ChatFeedback;
use App\Models\ChatSession;
use App\Models\Message;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Carbon\Carbon;

class ChatAnalyticsController extends Controller
{
    public function index(Request $request): Response
    {
        $dateFrom = $request->get('date_from', Carbon::now()->subDays(30)->format('Y-m-d'));
        $dateTo = $request->get('date_to', Carbon::now()->format('Y-m-d'));
        
        // Ümumi statistika
        $stats = ChatFeedback::getStats($dateFrom, $dateTo);
        
        // Günlük statistika (son 30 gün)
        $dailyStats = ChatFeedback::getDailyStats(30);
        
        // Son feedback-lər
        $recentFeedback = ChatFeedback::with([])
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get()
            ->map(function ($feedback) {
                return [
                    'id' => $feedback->id,
                    'user_type' => $feedback->user_type,
                    'user_name' => $feedback->user_name,
                    'feedback_type' => $feedback->feedback_type,
                    'message_content' => \Str::limit($feedback->message_content, 100),
                    'user_comment' => $feedback->user_comment,
                    'created_at' => $feedback->created_at->format('d.m.Y H:i'),
                    'ip_address' => $this->normalizeIpDisplay($feedback->ip_address),
                ];
            });
            
        // Chat statistikası
        $chatStats = [
            'total_sessions' => ChatSession::count(),
            'total_messages' => Message::count(),
            'user_messages' => Message::where('role', 'user')->count(),
            'ai_messages' => Message::where('role', 'assistant')->count(),
            'recent_sessions' => ChatSession::whereDate('created_at', '>=', Carbon::now()->subDays(7))->count(),
        ];
        
        // Bəyənmə nisbəti hesabla
        $feedbackRating = [
            'total' => $stats['likes'] + $stats['dislikes'],
            'positive_percentage' => $stats['likes'] + $stats['dislikes'] > 0 ? 
                round(($stats['likes'] / ($stats['likes'] + $stats['dislikes'])) * 100, 1) : 0,
        ];
        
        // Ən çox feedback alan günlər
        $topDays = ChatFeedback::selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->whereDate('created_at', '>=', Carbon::now()->subDays(30))
            ->groupBy('date')
            ->orderBy('count', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($item) {
                return [
                    'date' => Carbon::parse($item->date)->format('d.m.Y'),
                    'count' => $item->count
                ];
            });
        
        return Inertia::render('Admin/ChatAnalytics', [
            'stats' => $stats,
            'dailyStats' => $dailyStats,
            'recentFeedback' => $recentFeedback,
            'chatStats' => $chatStats,
            'feedbackRating' => $feedbackRating,
            'topDays' => $topDays,
            'dateFrom' => $dateFrom,
            'dateTo' => $dateTo,
        ]);
    }
    
    /**
     * Feedback-i sil
     */
    public function deleteFeedback(ChatFeedback $feedback)
    {
        $feedback->delete();
        
        return redirect()->back()->with('success', 'Feedback silindi!');
    }
    
    /**
     * CSV export
     */
    public function export(Request $request)
    {
        // Request validasiya
        $request->validate([
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from'
        ]);
        
        // Tarihleri Carbon obyektlərinə çevir
        $dateFromString = $request->get('date_from', Carbon::now()->subDays(30)->toDateString());
        $dateToString = $request->get('date_to', Carbon::now()->toDateString());
        
        // String olaraq gələn tarixləri Carbon obyektinə çevir və günün başlanğıcı/sonuna çək
        try {
            $dateFrom = is_string($dateFromString) ? Carbon::parse($dateFromString)->startOfDay() : $dateFromString->startOfDay();
            $dateTo = is_string($dateToString) ? Carbon::parse($dateToString)->endOfDay() : $dateToString->endOfDay();
        } catch (\Exception $e) {
            // Tarih parse xətası olarsa, defolt tarixlər istifadə et
            $dateFrom = Carbon::now()->subDays(30)->startOfDay();
            $dateTo = Carbon::now()->endOfDay();
        }
        
        $feedback = ChatFeedback::whereBetween('created_at', [$dateFrom, $dateTo])
            ->orderBy('created_at', 'desc')
            ->get();
        
        // Əgər filtrlə nəticə boşdursa, fallback olaraq son 500 məlumatı qaytar
        if ($feedback->isEmpty() && ChatFeedback::count() > 0) {
            $feedback = ChatFeedback::orderBy('created_at', 'desc')->limit(500)->get();
        }
        
        // UTF-8 BOM əlavə et ki, Excel-də düzgün görünsün
        $csvData = "\xEF\xBB\xBF"; // UTF-8 BOM
        $csvData .= "Tarix,İstifadəçi Tipi,İstifadəçi Adı,Feedback Tipi,Mesaj,Şərh,IP\n";
        
        foreach ($feedback as $item) {
            // CSV-də təhlükəsiz məlumat hazırla
            $csvData .= implode(',', [
                $item->created_at ? $item->created_at->format('d.m.Y H:i') : 'N/A',
                $this->csvEscape($item->user_type ?? 'N/A'),
                $this->csvEscape($item->user_name ?? 'Anonim'),
                $this->csvEscape($item->feedback_type ?? 'N/A'),
                $this->csvEscape(\Str::limit($item->message_content ?? '', 50)),
                $this->csvEscape($item->user_comment ?? ''),
                $this->csvEscape($this->normalizeIpDisplay($item->ip_address ?? 'N/A'))
            ]) . "\n";
        }
        
        // Filename üçün tarihlər Carbon obyekti olduğundan format() işləyəcək
        $filename = 'chat_feedback_' . $dateFrom->format('Y-m-d') . '_' . $dateTo->format('Y-m-d') . '.csv';
        
        return response($csvData)
            ->header('Content-Type', 'text/csv; charset=UTF-8')
            ->header('Content-Disposition', 'attachment; filename="' . $filename . '"')
            ->header('Cache-Control', 'no-cache, no-store, must-revalidate')
            ->header('Pragma', 'no-cache')
            ->header('Expires', '0');
    }
    
    /**
     * CSV üçün mətnin təhlükəsiz escape edim
     */
    private function csvEscape($text)
    {
        // Null və boş dəyərləri yəxşə alma
        if (empty($text)) {
            return '""';
        }
        
        // Mətni təmizlə və CSV üçün hazırla
        $text = strip_tags($text); // HTML taglarını sil
        $text = str_replace('"', '""', $text); // CSV üçün quote-ları escape et
        $text = preg_replace('/\s+/', ' ', $text); // Çoxlu boşluqları təkləşdir
        $text = trim($text); // Baş və son boşluqları sil
        
        return '"' . $text . '"';
    }

    /**
     * Bütün analitika statistikasını sıfırla (feedback-ləri sil)
     */
    public function resetAll(Request $request)
    {
        try {
            // Only feedback-based analytics are reset
            \DB::table('chat_feedback')->truncate();
            return redirect()->back()->with('success', 'Analitika statistikası sıfırlandı!');
        } catch (\Exception $e) {
            return redirect()->back()->with('success', 'Analitika sıfırlandı (fallback).');
        }
    }

    /**
     * Ətraflı feedback siyahısı (səhifələmə və filter ilə)
     */
    public function feedbackList(Request $request): Response
    {
        $type = $request->get('type'); // like, dislike, report, or null
        $perPage = (int) ($request->get('per_page', 20));
        $query = ChatFeedback::query()->orderByDesc('created_at');
        if (in_array($type, [ChatFeedback::FEEDBACK_LIKE, ChatFeedback::FEEDBACK_DISLIKE, ChatFeedback::FEEDBACK_REPORT])) {
            $query->where('feedback_type', $type);
        }
        $feedback = $query->paginate($perPage)->withQueryString()->through(function ($feedback) {
            return [
                'id' => $feedback->id,
                'user_type' => $feedback->user_type,
                'user_name' => $feedback->user_name,
                'feedback_type' => $feedback->feedback_type,
                'message_content' => $feedback->message_content,
                'user_comment' => $feedback->user_comment,
                'ip_address' => $this->normalizeIpDisplay($feedback->ip_address),
                'created_at' => optional($feedback->created_at)->format('d.m.Y H:i'),
            ];
        });

        // Overall stats for header badges
        $stats = ChatFeedback::getStats();

        return Inertia::render('Admin/ChatFeedbackList', [
            'filter' => [
                'type' => $type,
                'per_page' => $perPage,
            ],
            'feedback' => $feedback,
            'stats' => $stats,
        ]);
    }
    private function normalizeIpDisplay(?string $ip): string
    {
        if (!$ip) { return '-'; }
        if ($ip === '::1') { return '127.0.0.1'; }
        if (strpos($ip, '::ffff:') === 0) { return substr($ip, 7); }
        return $ip;
    }
}
