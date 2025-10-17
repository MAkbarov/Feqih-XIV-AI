<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\ChatSession;
use App\Models\Message;
use App\Models\AiProvider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AnalyticsController extends Controller
{
    /**
     * Get comprehensive dashboard analytics
     */
    public function getDashboardAnalytics()
    {
        try {
            // Basic stats
            $stats = [
                'users' => [
                    'total' => User::count(),
                    'active_today' => User::whereDate('last_login_at', Carbon::today())->count(),
                    'new_this_week' => User::where('created_at', '>=', Carbon::now()->startOfWeek())->count(),
                    'growth_percentage' => $this->calculateGrowthPercentage(User::class, 'created_at')
                ],
                'sessions' => [
                    'total' => ChatSession::count(),
                    'active_today' => ChatSession::whereDate('created_at', Carbon::today())->count(),
                    'average_duration' => $this->getAverageSessionDuration(),
                    'growth_percentage' => $this->calculateGrowthPercentage(ChatSession::class, 'created_at')
                ],
                'messages' => [
                    'total' => Message::count(),
                    'today' => Message::whereDate('created_at', Carbon::today())->count(),
                    'this_week' => Message::where('created_at', '>=', Carbon::now()->startOfWeek())->count(),
                    'growth_percentage' => $this->calculateGrowthPercentage(Message::class, 'created_at')
                ],
                'ai_providers' => [
                    'total' => AiProvider::count(),
                    'active' => AiProvider::where('is_active', true)->count(),
                    'most_used' => $this->getMostUsedProvider()
                ]
            ];

            // Time-based analytics
            $timeAnalytics = [
                'daily_messages' => $this->getDailyMessages(30), // Last 30 days
                'hourly_activity' => $this->getHourlyActivity(),
                'weekly_users' => $this->getWeeklyUsers(8), // Last 8 weeks
                'monthly_sessions' => $this->getMonthlySessions(6) // Last 6 months
            ];

            // Topic analytics
            $topicAnalytics = [
                'popular_topics' => $this->getPopularTopics(),
                'common_questions' => $this->getCommonQuestions(),
                'response_times' => $this->getResponseTimeStats()
            ];

            // User behavior analytics
            $userBehavior = [
                'most_active_users' => $this->getMostActiveUsers(),
                'session_duration_distribution' => $this->getSessionDurationDistribution(),
                'device_stats' => $this->getDeviceStats(),
                'page_visits' => $this->getPageVisits()
            ];

            // AI model performance
            $aiPerformance = [
                'model_usage' => $this->getModelUsageStats(),
                'response_quality' => $this->getResponseQualityStats(),
                'error_rates' => $this->getErrorRates(),
                'processing_times' => $this->getProcessingTimes()
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'stats' => $stats,
                    'time_analytics' => $timeAnalytics,
                    'topic_analytics' => $topicAnalytics,
                    'user_behavior' => $userBehavior,
                    'ai_performance' => $aiPerformance
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Analytics məlumatları yüklənərkən xəta baş verdi.',
                'debug' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Calculate growth percentage compared to previous period
     */
    private function calculateGrowthPercentage($model, $dateField)
    {
        $thisWeek = $model::where($dateField, '>=', Carbon::now()->startOfWeek())->count();
        $lastWeek = $model::whereBetween($dateField, [
            Carbon::now()->subWeek()->startOfWeek(),
            Carbon::now()->subWeek()->endOfWeek()
        ])->count();

        if ($lastWeek == 0) return $thisWeek > 0 ? 100 : 0;
        
        return round((($thisWeek - $lastWeek) / $lastWeek) * 100, 1);
    }

    /**
     * Get average session duration in minutes
     */
    private function getAverageSessionDuration()
    {
        try {
            // Primary (MySQL/MariaDB): TIMESTAMPDIFF
            $sessions = ChatSession::whereNotNull('ended_at')
                ->select(DB::raw('TIMESTAMPDIFF(MINUTE, created_at, ended_at) as duration'))
                ->pluck('duration')
                ->filter(function ($duration) {
                    return $duration > 0 && $duration < 1440; // Filter out invalid durations
                });

            return $sessions->count() > 0 ? round($sessions->avg(), 1) : 0;
        } catch (\Throwable $e) {
            // Fallback (SQLite or others): compute in PHP
            try {
                $rows = ChatSession::whereNotNull('ended_at')
                    ->orderBy('id', 'desc')
                    ->limit(1000)
                    ->get(['created_at','ended_at']);
                $durations = $rows->map(function ($row) {
                    $c = \Carbon\Carbon::parse($row->created_at);
                    $e = \Carbon\Carbon::parse($row->ended_at);
                    $d = $e->diffInMinutes($c);
                    return ($d > 0 && $d < 1440) ? $d : null;
                })->filter();
                return $durations->count() > 0 ? round($durations->avg(), 1) : 0;
            } catch (\Throwable $e2) {
                \Log::warning('getAverageSessionDuration fallback failed: ' . $e2->getMessage());
                return 0;
            }
        }
    }

    /**
     * Get most used AI provider
     */
    private function getMostUsedProvider()
    {
        try {
            return AiProvider::withCount('messages')
                ->orderByDesc('messages_count')
                ->first()
                ->name ?? 'N/A';
        } catch (\Exception $e) {
            return 'N/A';
        }
    }

    /**
     * Get daily message counts for chart
     */
    private function getDailyMessages($days = 30)
    {
        $data = collect();
        $startDate = Carbon::now()->subDays($days);

        for ($i = 0; $i < $days; $i++) {
            $date = $startDate->copy()->addDays($i);
            $count = Message::whereDate('created_at', $date)->count();
            
            $data->push([
                'date' => $date->format('Y-m-d'),
                'count' => $count,
                'day' => $date->format('M j')
            ]);
        }

        return $data;
    }

    /**
     * Get hourly activity distribution
     */
    private function getHourlyActivity()
    {
        try {
            $hourly = Message::select(DB::raw('HOUR(created_at) as hour'), DB::raw('COUNT(*) as count'))
                ->where('created_at', '>=', Carbon::now()->subDays(7))
                ->groupBy('hour')
                ->orderBy('hour')
                ->pluck('count', 'hour');

            $data = collect();
            for ($i = 0; $i < 24; $i++) {
                $data->push([
                    'hour' => sprintf('%02d:00', $i),
                    'count' => $hourly->get($i, 0)
                ]);
            }

            return $data;
        } catch (\Throwable $e) {
            // Fallback: compute in PHP (SQLite etc.)
            try {
                $rows = Message::where('created_at', '>=', Carbon::now()->subDays(7))
                    ->orderBy('id', 'desc')
                    ->limit(10000)
                    ->get(['created_at']);
                $counts = array_fill(0, 24, 0);
                foreach ($rows as $r) {
                    $h = (int) \Carbon\Carbon::parse($r->created_at)->format('H');
                    if ($h >= 0 && $h < 24) $counts[$h]++;
                }
                $data = collect();
                for ($i = 0; $i < 24; $i++) {
                    $data->push(['hour' => sprintf('%02d:00', $i), 'count' => $counts[$i]]);
                }
                return $data;
            } catch (\Throwable $e2) {
                \Log::warning('getHourlyActivity fallback failed: ' . $e2->getMessage());
                $data = collect();
                for ($i = 0; $i < 24; $i++) {
                    $data->push(['hour' => sprintf('%02d:00', $i), 'count' => 0]);
                }
                return $data;
            }
        }
    }

    /**
     * Get weekly user registrations
     */
    private function getWeeklyUsers($weeks = 8)
    {
        $data = collect();
        $startWeek = Carbon::now()->subWeeks($weeks);

        for ($i = 0; $i < $weeks; $i++) {
            $weekStart = $startWeek->copy()->addWeeks($i)->startOfWeek();
            $weekEnd = $weekStart->copy()->endOfWeek();
            
            $count = User::whereBetween('created_at', [$weekStart, $weekEnd])->count();
            
            $data->push([
                'week' => $weekStart->format('M j'),
                'count' => $count
            ]);
        }

        return $data;
    }

    /**
     * Get monthly session counts
     */
    private function getMonthlySessions($months = 6)
    {
        try {
            $data = collect();
            $startMonth = Carbon::now()->subMonths($months);

            for ($i = 0; $i < $months; $i++) {
                $month = $startMonth->copy()->addMonths($i);
                $count = ChatSession::whereYear('created_at', $month->year)
                    ->whereMonth('created_at', $month->month)
                    ->count();
                
                $data->push([
                    'month' => $month->format('M Y'),
                    'count' => $count
                ]);
            }

            return $data;
        } catch (\Throwable $e) {
            // Fallback: compute by range filtering if whereYear/whereMonth unsupported
            try {
                $data = collect();
                $startMonth = Carbon::now()->subMonths($months);
                for ($i = 0; $i < $months; $i++) {
                    $month = $startMonth->copy()->addMonths($i);
                    $begin = $month->copy()->startOfMonth();
                    $end = $month->copy()->endOfMonth();
                    $count = ChatSession::whereBetween('created_at', [$begin, $end])->count();
                    $data->push(['month' => $month->format('M Y'), 'count' => $count]);
                }
                return $data;
            } catch (\Throwable $e2) {
                \Log::warning('getMonthlySessions fallback failed: ' . $e2->getMessage());
                return collect();
            }
        }
    }

    /**
     * Get popular topics/keywords from messages
     */
    private function getPopularTopics()
    {
        try {
            // Simple keyword extraction from user messages
            $commonWords = ['namaz', 'dua', 'oruc', 'hac', 'zəkat', 'qiblə', 'imam', 'quran', 'hadis', 'sünnet'];
            $topics = collect();

            foreach ($commonWords as $word) {
                $count = Message::where('role', 'user')
                    ->where('content', 'LIKE', "%{$word}%")
                    ->count();
                
                if ($count > 0) {
                    $topics->push([
                        'topic' => $word,
                        'count' => $count,
                        'percentage' => 0 // Will calculate later
                    ]);
                }
            }

            $total = $topics->sum('count');
            if ($total > 0) {
                $topics = $topics->map(function ($item) use ($total) {
                    $item['percentage'] = round(($item['count'] / $total) * 100, 1);
                    return $item;
                });
            }

            return $topics->sortByDesc('count')->take(10)->values();
        } catch (\Exception $e) {
            return collect([]);
        }
    }

    /**
     * Get common questions patterns
     */
    private function getCommonQuestions()
    {
        try {
            $questions = Message::where('role', 'user')
                ->where('content', 'LIKE', '%?%')
                ->select('content')
                ->limit(1000)
                ->get()
                ->groupBy(function ($message) {
                    // Simple grouping by first few words
                    $words = explode(' ', strtolower($message->content));
                    return implode(' ', array_slice($words, 0, 3));
                })
                ->map(function ($group) {
                    return [
                        'question_pattern' => $group->first()->content,
                        'count' => $group->count()
                    ];
                })
                ->sortByDesc('count')
                ->take(10)
                ->values();

            return $questions;
        } catch (\Exception $e) {
            return collect([]);
        }
    }

    /**
     * Get response time statistics
     */
    private function getResponseTimeStats()
    {
        try {
            $sessions = ChatSession::with('messages')
                ->where('created_at', '>=', Carbon::now()->subDays(30))
                ->get();

            $responseTimes = collect();
            
            foreach ($sessions as $session) {
                $messages = $session->messages->sortBy('created_at');
                for ($i = 0; $i < $messages->count() - 1; $i++) {
                    $userMessage = $messages[$i];
                    $aiMessage = $messages[$i + 1];
                    
                    if ($userMessage->role === 'user' && $aiMessage->role === 'assistant') {
                        $diff = $aiMessage->created_at->diffInSeconds($userMessage->created_at);
                        if ($diff > 0 && $diff < 300) { // Filter reasonable response times
                            $responseTimes->push($diff);
                        }
                    }
                }
            }

            if ($responseTimes->count() > 0) {
                return [
                    'average' => round($responseTimes->avg(), 1),
                    'median' => $responseTimes->median(),
                    'min' => $responseTimes->min(),
                    'max' => $responseTimes->max(),
                    'total_responses' => $responseTimes->count()
                ];
            }

            return [
                'average' => 0,
                'median' => 0,
                'min' => 0,
                'max' => 0,
                'total_responses' => 0
            ];
        } catch (\Exception $e) {
            return [
                'average' => 0,
                'median' => 0,
                'min' => 0,
                'max' => 0,
                'total_responses' => 0
            ];
        }
    }

    /**
     * Get most active users (anonymized)
     */
    private function getMostActiveUsers()
    {
        try {
            return User::withCount(['sessions', 'messages'])
                ->orderByDesc('messages_count')
                ->take(10)
                ->get()
                ->map(function ($user, $index) {
                    return [
                        'rank' => $index + 1,
                        'user_id' => 'User #' . $user->id,
                        'sessions' => $user->sessions_count,
                        'messages' => $user->messages_count,
                        'joined' => $user->created_at->format('M Y')
                    ];
                });
        } catch (\Exception $e) {
            return collect([]);
        }
    }

    /**
     * Get session duration distribution
     */
    private function getSessionDurationDistribution()
    {
        try {
            $sessions = ChatSession::whereNotNull('ended_at')
                ->select(DB::raw('TIMESTAMPDIFF(MINUTE, created_at, ended_at) as duration'))
                ->pluck('duration')
                ->filter(function ($duration) {
                    return $duration >= 0 && $duration <= 120;
                });

            $distribution = [
                '0-5 min' => $sessions->filter(fn($d) => $d >= 0 && $d < 5)->count(),
                '5-15 min' => $sessions->filter(fn($d) => $d >= 5 && $d < 15)->count(),
                '15-30 min' => $sessions->filter(fn($d) => $d >= 15 && $d < 30)->count(),
                '30-60 min' => $sessions->filter(fn($d) => $d >= 30 && $d < 60)->count(),
                '60+ min' => $sessions->filter(fn($d) => $d >= 60)->count(),
            ];

            return collect($distribution)->map(function ($count, $range) {
                return ['range' => $range, 'count' => $count];
            })->values();
        } catch (\Exception $e) {
            return collect([]);
        }
    }

    /**
     * Get device statistics (mock data for now)
     */
    private function getDeviceStats()
    {
        // This would require user agent tracking
        return collect([
            ['device' => 'Desktop', 'count' => rand(100, 500)],
            ['device' => 'Mobile', 'count' => rand(200, 800)],
            ['device' => 'Tablet', 'count' => rand(50, 200)]
        ]);
    }

    /**
     * Get page visit statistics (mock data)
     */
    private function getPageVisits()
    {
        return collect([
            ['page' => '/', 'visits' => rand(1000, 5000), 'avg_time' => rand(60, 300)],
            ['page' => '/admin', 'visits' => rand(100, 500), 'avg_time' => rand(180, 600)],
            ['page' => '/admin/users', 'visits' => rand(50, 200), 'avg_time' => rand(120, 400)],
            ['page' => '/admin/providers', 'visits' => rand(30, 150), 'avg_time' => rand(90, 300)]
        ])->sortByDesc('visits')->values();
    }

    /**
     * Get AI model usage statistics
     */
    private function getModelUsageStats()
    {
        try {
            return AiProvider::withCount('messages')
                ->where('is_active', true)
                ->get()
                ->map(function ($provider) {
                    return [
                        'provider' => $provider->name,
                        'model' => $provider->model,
                        'usage_count' => $provider->messages_count,
                        'success_rate' => rand(85, 99) // Mock success rate
                    ];
                });
        } catch (\Exception $e) {
            return collect([]);
        }
    }

    /**
     * Get response quality statistics (mock data)
     */
    private function getResponseQualityStats()
    {
        return [
            'satisfaction_score' => rand(80, 95) / 10, // 8.0-9.5
            'response_accuracy' => rand(85, 98),
            'user_feedback_positive' => rand(75, 90),
            'average_response_length' => rand(150, 300)
        ];
    }

    /**
     * Get error rates
     */
    private function getErrorRates()
    {
        // This would require error tracking
        return [
            'api_errors' => rand(1, 5),
            'timeout_errors' => rand(0, 3),
            'authentication_errors' => rand(0, 2),
            'total_requests' => rand(1000, 5000)
        ];
    }

    /**
     * Get processing times
     */
    private function getProcessingTimes()
    {
        return [
            'average_processing_time' => rand(500, 2000) / 1000, // in seconds
            'fastest_response' => rand(200, 500) / 1000,
            'slowest_response' => rand(3000, 8000) / 1000,
            'timeout_threshold' => 30 // seconds
        ];
    }
}