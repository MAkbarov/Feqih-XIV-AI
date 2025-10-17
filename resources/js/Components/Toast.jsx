import React, { useEffect, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';

const Toast = ({ 
    id, 
    message, 
    type = 'info', 
    duration = 5000, 
    onClose,
    position = 'top-right' 
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isRemoving, setIsRemoving] = useState(false);

    useEffect(() => {
        // Show animation
        const showTimer = setTimeout(() => setIsVisible(true), 10);
        
        // Auto remove after duration
        const removeTimer = setTimeout(() => {
            setIsRemoving(true);
            setTimeout(() => onClose(id), 300);
        }, duration);

        return () => {
            clearTimeout(showTimer);
            clearTimeout(removeTimer);
        };
    }, [id, duration, onClose]);

    const typeConfig = {
        success: {
            bgColor: 'bg-gradient-to-r from-green-500/90 to-green-600/90',
            borderColor: 'border-green-400/50',
            textColor: 'text-white',
            icon: CheckCircleIcon,
            iconColor: 'text-green-200'
        },
        error: {
            bgColor: 'bg-gradient-to-r from-red-500/90 to-red-600/90',
            borderColor: 'border-red-400/50',
            textColor: 'text-white',
            icon: ExclamationCircleIcon,
            iconColor: 'text-red-200'
        },
        warning: {
            bgColor: 'bg-gradient-to-r from-yellow-500/90 to-yellow-600/90',
            borderColor: 'border-yellow-400/50',
            textColor: 'text-white',
            icon: ExclamationTriangleIcon,
            iconColor: 'text-yellow-200'
        },
        info: {
            bgColor: 'bg-gradient-to-r from-blue-500/90 to-blue-600/90',
            borderColor: 'border-blue-400/50',
            textColor: 'text-white',
            icon: InformationCircleIcon,
            iconColor: 'text-blue-200'
        }
    };

    const config = typeConfig[type] || typeConfig.info;
    const IconComponent = config.icon;

    // We no longer position here (wrapper handles fixed position);
    // keep only direction info for enter/exit animation.
    const isRight = position.includes('right');
    const isLeft = position.includes('left');
    const isCenter = position.includes('center');

    return (
        <div
            className={`
                z-50
                transform transition-all duration-300 ease-in-out
                ${isVisible && !isRemoving ? 'translate-x-0 opacity-100 scale-100' : 
                  isRight ? 'translate-x-full opacity-0 scale-95' : 
                  isLeft ? '-translate-x-full opacity-0 scale-95' : 
                  'translate-y-2 opacity-0 scale-95'
                }
            `}
        >
            <div className={`
                ${config.bgColor}
                border ${config.borderColor}
                backdrop-blur-lg
                rounded-xl shadow-2xl
                p-3 pr-10 sm:p-4 sm:pr-12
                w-[calc(100vw-2rem)] sm:w-auto max-w-[calc(100vw-2rem)] sm:max-w-md
                relative overflow-hidden
                glassmorphism-border
            `}>
                {/* Progress bar */}
                <div className="absolute top-0 left-0 h-1 bg-white/30 rounded-t-xl overflow-hidden">
                    <div 
                        className="h-full bg-white/60 rounded-t-xl animate-toast-progress"
                        style={{ animationDuration: `${duration}ms` }}
                    />
                </div>

                <div className="flex items-start space-x-3">
                    <div className={`flex-shrink-0 ${config.iconColor}`}>
                        <IconComponent className="h-6 w-6" />
                    </div>
                    
                    <div className={`flex-1 ${config.textColor}`}>
                        <p className="text-sm sm:text-[0.95rem] font-medium leading-5 break-words whitespace-pre-line">
                            {message}
                        </p>
                    </div>
                    
                    <button
                        onClick={() => {
                            setIsRemoving(true);
                            setTimeout(() => onClose(id), 300);
                        }}
                        className={`
                            flex-shrink-0 ${config.textColor} hover:text-white/80
                            transition-colors duration-200 ml-4
                            focus:outline-none focus:ring-2 focus:ring-white/50 rounded
                        `}
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Toast;