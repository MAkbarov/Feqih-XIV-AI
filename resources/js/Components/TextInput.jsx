import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

export default forwardRef(function TextInput(
    { type = 'text', className = '', isFocused = false, variant = 'default', ...props },
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
                return 'glass-input';
            case 'glass-dark':
                return 'glass-input-dark';
            default:
                return 'rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500';
        }
    };

    return (
        <input
            {...props}
            type={type}
            className={`${getVariantClasses()} ${className}`}
            ref={localRef}
        />
    );
});
