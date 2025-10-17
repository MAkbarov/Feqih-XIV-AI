import React from 'react';

export default function RAGStatusBadge({ status, chunksCount, lastIndexedAt, onReindex, itemId }) {
    const getStatusConfig = () => {
        switch (status) {
            case 'completed':
                return {
                    bg: 'bg-green-50 dark:bg-green-900/20',
                    border: 'border-green-200 dark:border-green-800',
                    text: 'text-green-700 dark:text-green-300',
                    icon: '✓',
                    label: 'İndeksləndİ'
                };
            case 'indexing':
                return {
                    bg: 'bg-blue-50 dark:bg-blue-900/20',
                    border: 'border-blue-200 dark:border-blue-800',
                    text: 'text-blue-700 dark:text-blue-300',
                    icon: '⟳',
                    label: 'İndekslənir...'
                };
            case 'failed':
                return {
                    bg: 'bg-red-50 dark:bg-red-900/20',
                    border: 'border-red-200 dark:border-red-800',
                    text: 'text-red-700 dark:text-red-300',
                    icon: '✕',
                    label: 'Xəta'
                };
            case 'pending':
            default:
                return {
                    bg: 'bg-gray-50 dark:bg-gray-900/20',
                    border: 'border-gray-200 dark:border-gray-700',
                    text: 'text-gray-600 dark:text-gray-400',
                    icon: '○',
                    label: 'Gözləyir'
                };
        }
    };

    const config = getStatusConfig();
    
    const handleReindex = (e) => {
        e.stopPropagation();
        if (onReindex) {
            onReindex(itemId);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.border} ${config.text}`}>
                <span className={status === 'indexing' ? 'animate-spin' : ''}>{config.icon}</span>
                {config.label}
            </span>
            
            {status === 'completed' && chunksCount > 0 && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                    {chunksCount} chunk
                </span>
            )}

            {status === 'completed' && onReindex && (
                <button
                    onClick={handleReindex}
                    className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    title="Yenidən indekslə"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </button>
            )}
            
            {lastIndexedAt && status === 'completed' && (
                <span className="text-xs text-gray-400 dark:text-gray-500" title={lastIndexedAt}>
                    {new Date(lastIndexedAt).toLocaleDateString('az-AZ', { 
                        day: '2-digit', 
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </span>
            )}
        </div>
    );
}
