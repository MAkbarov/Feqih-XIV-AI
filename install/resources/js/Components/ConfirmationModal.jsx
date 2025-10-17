import { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import Icon from '@/Components/Icon';
import { useTheme } from '@/Components/ThemeProvider';

export default function ConfirmationModal({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title = "Təsdiqlə", 
    message = "Bu əməliyyatı yerinə yetirmək istədiyinizə əminsiniz?", 
    confirmText = "Bəli", 
    cancelText = "Xeyr",
    type = "warning" // warning, danger, info, success
}) {
    const { theme } = useTheme();
    const [processing, setProcessing] = useState(false);

    const handleConfirm = async () => {
        setProcessing(true);
        try {
            await onConfirm();
        } finally {
            setProcessing(false);
            onClose();
        }
    };

    const getIconAndColor = () => {
        switch (type) {
            case 'danger':
                return { icon: 'delete', color: '#ef4444' };
            case 'warning':
                return { icon: 'alert', color: '#f59e0b' };
            case 'info':
                return { icon: 'info', color: '#3b82f6' };
            case 'success':
                return { icon: 'check', color: '#10b981' };
            default:
                return { icon: 'alert', color: '#f59e0b' };
        }
    };

    const { icon, color } = getIconAndColor();

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white/95 backdrop-blur-lg p-6 text-left align-middle shadow-2xl transition-all border border-white/20">
                                <div className="flex items-center gap-4 mb-4">
                                    <div 
                                        className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
                                        style={{ backgroundColor: `${color}15` }}
                                    >
                                        <Icon name={icon} size={24} color={color} />
                                    </div>
                                    <Dialog.Title
                                        as="h3"
                                        className="text-lg font-semibold leading-6 text-gray-900"
                                    >
                                        {title}
                                    </Dialog.Title>
                                </div>
                                
                                <div className="mb-6">
                                    <p className="text-sm text-gray-600 leading-relaxed">
                                        {message}
                                    </p>
                                </div>

                                <div className="flex items-center gap-3 justify-end">
                                    <button
                                        type="button"
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors"
                                        onClick={onClose}
                                        disabled={processing}
                                    >
                                        {cancelText}
                                    </button>
                                    <button
                                        type="button"
                                        className="px-4 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        style={{ 
                                            backgroundColor: color,
                                            focusRingColor: `${color}50`
                                        }}
                                        onClick={handleConfirm}
                                        disabled={processing}
                                    >
                                        {processing ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                Yerinə yetirilir...
                                            </>
                                        ) : (
                                            confirmText
                                        )}
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}