import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

export default forwardRef(function GlassSelect(
    { className = '', isFocused = false, variant = 'glass', children, ...props },
    ref,
) {
    const localRef = useRef(null);

    useImperativeHandle(ref, () => ({
        focus: () => localRef.current?.focus(),
    }));

    useEffect(() => {
        if (isFocused) {
            localRef.current?.focus();
        }
    }, [isFocused]);

    const getVariantClasses = () => {
        switch (variant) {
            case 'glass':
                return 'glass-input appearance-none pr-10';
            case 'glass-dark':
                return 'glass-input-dark appearance-none pr-10';
            default:
                return 'rounded-xl bg-white/90 backdrop-blur-lg border border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200 shadow-lg appearance-none pr-10';
        }
    };

    return (
        <div className="relative">
            <select
                {...props}
                className={`${getVariantClasses()} ${className}`}
                ref={localRef}
            >
                {children}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <ChevronDownIcon className="h-5 w-5 text-gray-400" />
            </div>
        </div>
    );
});