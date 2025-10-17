export default function ToggleSwitch({ enabled, onToggle, size = 'md', disabled = false }) {
    const sizes = {
        sm: {
            container: 'w-8 h-4',
            toggle: 'w-3 h-3',
            translate: enabled ? 'translate-x-4' : 'translate-x-0.5'
        },
        md: {
            container: 'w-11 h-6',
            toggle: 'w-5 h-5',
            translate: enabled ? 'translate-x-5' : 'translate-x-0.5'
        },
        lg: {
            container: 'w-14 h-7',
            toggle: 'w-6 h-6',
            translate: enabled ? 'translate-x-7' : 'translate-x-0.5'
        }
    };

    const sizeClasses = sizes[size];

    return (
        <button
            type="button"
            onClick={onToggle}
            disabled={disabled}
            className={`
                relative inline-flex ${sizeClasses.container} flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                ${enabled ? 'bg-indigo-600' : 'bg-gray-200'}
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            aria-pressed={enabled}
        >
            <span className="sr-only">{enabled ? 'Disable' : 'Enable'}</span>
            <span
                aria-hidden="true"
                className={`
                    ${sizeClasses.toggle} ${sizeClasses.translate} pointer-events-none inline-block rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out
                `}
            />
        </button>
    );
}