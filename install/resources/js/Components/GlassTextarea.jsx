import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

export default forwardRef(function GlassTextarea(
    { className = '', isFocused = false, variant = 'glass', rows = 4, ...props },
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
                return 'glass-input resize-none';
            case 'glass-dark':
                return 'glass-input-dark resize-none';
            default:
                return 'rounded-xl bg-white/90 backdrop-blur-lg border border-gray-200 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200 shadow-lg resize-none';
        }
    };

    return (
        <textarea
            {...props}
            rows={rows}
            className={`${getVariantClasses()} ${className}`}
            ref={localRef}
        />
    );
});