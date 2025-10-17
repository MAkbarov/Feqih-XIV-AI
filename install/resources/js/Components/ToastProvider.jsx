import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast from './Toast';

const ToastContext = createContext();

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

let toastId = 0;

export const ToastProvider = ({ children, position = 'top-right', maxToasts = 5 }) => {
    const [toasts, setToasts] = useState([]);
    const [isMobile, setIsMobile] = useState(false);

    // Detect mobile viewport to tweak stacking offsets and paddings
    React.useEffect(() => {
        const mq = window.matchMedia('(max-width: 640px)');
        const handler = (e) => setIsMobile(e.matches);
        handler(mq);
        mq.addEventListener ? mq.addEventListener('change', handler) : mq.addListener(handler);
        return () => {
            mq.removeEventListener ? mq.removeEventListener('change', handler) : mq.removeListener(handler);
        };
    }, []);

    const addToast = useCallback((message, type = 'info', duration = 5000) => {
        const id = `toast-${++toastId}`;
        const newToast = { id, message, type, duration };
        
        setToasts(prev => {
            const newToasts = [newToast, ...prev];
            // Limit number of toasts
            return newToasts.slice(0, maxToasts);
        });

        return id;
    }, [maxToasts]);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const toast = {
        success: (message, duration) => addToast(message, 'success', duration),
        error: (message, duration) => addToast(message, 'error', duration),
        warning: (message, duration) => addToast(message, 'warning', duration),
        info: (message, duration) => addToast(message, 'info', duration),
        custom: addToast,
        remove: removeToast,
        clear: () => setToasts([])
    };

    // Calculate position for stacked toasts
    const getToastPosition = (index, position) => {
        const baseGap = isMobile ? 12 : 16;
        const step = isMobile ? 64 : 80; // tighter stacking on mobile
        const offset = index * step;
        
        const positions = {
            'top-right': { top: baseGap + offset, right: baseGap },
            'top-left': { top: baseGap + offset, left: baseGap },
            'bottom-right': { bottom: baseGap + offset, right: baseGap },
            'bottom-left': { bottom: baseGap + offset, left: baseGap },
            'top-center': { top: baseGap + offset, left: '50%', transform: 'translateX(-50%)' },
            'bottom-center': { bottom: baseGap + offset, left: '50%', transform: 'translateX(-50%)' }
        };

        return positions[position] || positions['top-right'];
    };

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <div className="toast-container">
                {toasts.map((toast, index) => (
                    <div
                        key={toast.id}
                        style={{
                            position: 'fixed',
                            zIndex: 9999,
                            maxWidth: 'calc(100vw - 1rem)', // ensure container never overflows viewport width on mobile
                            ...getToastPosition(index, position)
                        }}
                    >
                        <Toast
                            id={toast.id}
                            message={toast.message}
                            type={toast.type}
                            duration={toast.duration}
                            onClose={removeToast}
                            position={position}
                        />
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};