import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useToast } from '@/Components/ToastProvider';
import Icon from '@/Components/Icon';
import { useState } from 'react';
import axios from 'axios';

export default function ChatAnalytics({ 
    stats, 
    dailyStats, 
    recentFeedback, 
    chatStats, 
    feedbackRating, 
    topDays,
    dateFrom,
    dateTo 
}) {
    const toast = useToast();
    const [selectedFeedback, setSelectedFeedback] = useState(null);

    // Feedback tipi üçün rəng və simvol
    const getFeedbackDisplay = (type) => {
        switch (type) {
            case 'like':
                return { color: 'text-green-600 bg-green-50', iconName: 'heart', iconColor: '#16a34a', text: 'Bəyəndib' };
            case 'dislike':
                return { color: 'text-red-600 bg-red-50', iconName: 'close', iconColor: '#dc2626', text: 'Bəyənməyib' };
            case 'report':
                return { color: 'text-orange-600 bg-orange-50', iconName: 'warning', iconColor: '#ea580c', text: 'Şikayət' };
            default:
                return { color: 'text-gray-600 bg-gray-50', iconName: 'question', iconColor: '#6b7280', text: type };
        }
    };

    const UserTypeDisplay = ({ userType }) => {
        const isGuest = userType === 'guest';
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                isGuest ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
            }`}>
                {isGuest ? 'Qonaq' : 'İstifadəçi'}
            </span>
        );
    };

    return (
        <AdminLayout>
            <Head title="Çat Analitikaları - Admin Panel" />

            <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-3">
                    <div className="flex items-center gap-3">
                        <Icon name="chart" size={28} color="#3b82f6" />
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
                            Çat Analitikaları
                        </h1>
                    </div>
                    <div className="flex flex-wrap gap-2 md:gap-3 md:self-end">
                        <a
                            href={`/admin/chat-analytics/export?date_from=${dateFrom}&date_to=${dateTo}`}
                            className="px-3 py-1.5 md:px-4 md:py-2 text-sm md:text-base bg-green-600 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600/90 transition-colors flex items-center gap-2"
                            target="_blank"
                            rel="noreferrer"
                        >
                            <Icon name="download" size={16} color="white" />
                            CSV İxrac
                        </a>
                        <button
                            onClick={async () => {
                                if (!confirm('Bütün analitika statistikası sıfırlansın? Bu əməliyyat geri qaytarıla bilməz.')) return;
                                try {
                                    await axios.post('/admin/chat-analytics/reset-all');
                                    toast.success('Statistika sıfırlandı');
                                    setTimeout(() => window.location.reload(), 800);
                                } catch (e) {
                                    toast.error('Sıfırlama alınmadı');
                                }
                            }}
                            className="px-3 py-1.5 md:px-4 md:py-2 text-sm md:text-base bg-red-600 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600/90 transition-colors flex items-center gap-2"
                        >
                            <Icon name="delete" size={16} color="white" />
                            Bütün Statistikaları Sıfırla
                        </button>
                        <a
                            href="/admin/chat-analytics/feedback"
                            className="px-3 py-1.5 md:px-4 md:py-2 text-sm md:text-base bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600/90 transition-colors flex items-center gap-2"
                        >
                            <Icon name="clipboard" size={16} color="white" />
                            Ətraflı Feedback Siyahısı
                        </a>
                    </div>
                </div>

                {/* Ümumi Statistika Kartları */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Bəyənmə Nisbəti */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 dark:text-gray-300 text-sm font-medium">Bəyənmə Nisbəti</p>
                                <p className="text-3xl font-bold text-green-600">
                                    {feedbackRating.positive_percentage}%
                                </p>
                                <p className="text-xs text-gray-400 dark:text-gray-400">
                                    {feedbackRating.total} feedback-dən
                                </p>
                            </div>
                            <Icon name="heart" size={48} color="#16a34a" />
                        </div>
                    </div>

                    {/* Ümumi Feedback */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 dark:text-gray-300 text-sm font-medium">Ümumi Feedback</p>
                                <p className="text-3xl font-bold text-blue-600">{stats.total_feedback}</p>
                                <div className="text-xs text-gray-400 dark:text-gray-400 flex items-center gap-2 mt-1">
                                    <div className="flex items-center gap-1">
                                        <Icon name="heart" size={12} color="#16a34a" />{stats.likes}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Icon name="dislike" size={12} color="#dc2626" />{stats.dislikes}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Icon name="warning" size={12} color="#ea580c" />{stats.reports}
                                    </div>
                                </div>
                            </div>
                            <Icon name="clipboard" size={48} color="#2563eb" />
                        </div>
                    </div>

                    {/* Ümumi Səssiyalar */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 dark:text-gray-300 text-sm font-medium">Ümumi Səssiyalar</p>
                                <p className="text-3xl font-bold text-purple-600">{chatStats.total_sessions}</p>
                                <p className="text-xs text-gray-400">Son həftə: {chatStats.recent_sessions}</p>
                            </div>
                            <Icon name="chat" size={48} color="#9333ea" />
                        </div>
                    </div>

                    {/* Ümumi Mesajlar */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-indigo-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 dark:text-gray-300 text-sm font-medium">Ümumi Mesajlar</p>
                                <p className="text-3xl font-bold text-indigo-600">{chatStats.total_messages}</p>
                                <div className="text-xs text-gray-400 flex items-center gap-2 mt-1">
                                    <div className="flex items-center gap-1">
                                        <Icon name="users" size={12} color="#6b7280" />{chatStats.user_messages}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Icon name="nav_chat" size={12} color="#6b7280" />{chatStats.ai_messages}
                                    </div>
                                </div>
                            </div>
                            <Icon name="send" size={48} color="#4f46e5" />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Son Feedback-lər */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Son Feedback-lər</h2>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4 max-h-96 overflow-y-auto">
                                {recentFeedback.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                        <Icon name="inbox" size={48} color="#9ca3af" className="mx-auto mb-2" />
                                        <p>Helə feedback yoxdur</p>
                                    </div>
                                ) : (
                                    recentFeedback.map((feedback) => {
                                        const display = getFeedbackDisplay(feedback.feedback_type);
                                        return (
                                            <div key={feedback.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${display.color} flex items-center gap-1`}>
                                                            <Icon name={display.iconName} size={12} color={display.iconColor} />
                                                            {display.text}
                                                        </span>
                                                        <UserTypeDisplay userType={feedback.user_type} />
                                                    </div>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">{feedback.created_at}</span>
                                                </div>
                                                <div className="text-sm text-gray-800 dark:text-gray-200 mb-1 flex items-center gap-2">
                                                    <Icon name="users" size={14} color="#6b7280" />
                                                    <strong>{feedback.user_name}</strong>
                                                </div>
                                                <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                                                    "{feedback.message_content}"
                                                </div>
                                                {feedback.user_comment && (
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/40 p-2 rounded flex items-center gap-2">
                                                        <Icon name="edit" size={12} color="#6b7280" />
                                                        {feedback.user_comment}
                                                    </div>
                                                )}
                                                <div className="text-xs text-gray-400 dark:text-gray-400 mt-2">
                                                    IP: {feedback.ip_address}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Ən Aktiv Günlər */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Ən Aktiv Günlər</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-300">Son 30 gündə ən çox feedback alan günlər</p>
                        </div>
                        <div className="p-6">
                            {topDays.length === 0 ? (
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                    <Icon name="calendar" size={48} color="#9ca3af" className="mx-auto mb-2" />
                                    <p>Statistika yoxdur</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {topDays.map((day, index) => (
                                        <div key={day.date} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/40 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <span className="flex items-center justify-center w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full text-sm font-bold">
                                                    {index + 1}
                                                </span>
                                                <span className="font-medium text-gray-900 dark:text-gray-100">{day.date}</span>
                                            </div>
                                            <span className="px-3 py-1 bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 rounded-full text-sm font-medium">
                                                {day.count} feedback
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Statistika Özeti */}
                <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <Icon name="chart" size={24} color="#9ca3af" />
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Ǝtraflı Statistika</h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{stats.likes}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-300">Bəyənmə</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-red-600">{stats.dislikes}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-300">Bəyənməmə</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">{stats.reports}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-300">Şikayət</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                                {stats.user_feedback + stats.guest_feedback}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-300">
                                Ümumi ({stats.user_feedback} user + {stats.guest_feedback} qonaq)
                            </div>
                        </div>
                    </div>
                </div>

                {/* Alt hissə */}
                <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <Icon name="info" size={24} color="#3b82f6" />
                        <div>
                            <h3 className="font-medium text-blue-900 dark:text-blue-300">Analitikalar haqqında</h3>
                            <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                                Bu səhifədə çatbotunuzun performansını izləyə bilərsiniz. Bəyənmə nisbəti yüksək olduqca, 
                                istifadəçilər cavablardan məmnundur. Şikayətlərə diqqət edərək çatbotu təkmiləşdiriə bilərsiniz.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}