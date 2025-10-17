import { useState } from 'react';

export default function useConfirmation() {
    const [confirmationState, setConfirmationState] = useState({
        isOpen: false,
        title: '',
        message: '',
        confirmText: 'Bəli',
        cancelText: 'Xeyr',
        type: 'warning',
        onConfirm: () => {}
    });

    const confirm = ({
        title = 'Təsdiqlə',
        message = 'Bu əməliyyatı yerinə yetirmək istədiyinizə əminsiniz?',
        confirmText = 'Bəli',
        cancelText = 'Xeyr', 
        type = 'warning'
    }) => {
        return new Promise((resolve) => {
            setConfirmationState({
                isOpen: true,
                title,
                message,
                confirmText,
                cancelText,
                type,
                onConfirm: () => resolve(true)
            });
        });
    };

    const closeConfirmation = () => {
        setConfirmationState(prev => ({
            ...prev,
            isOpen: false
        }));
    };

    return {
        confirmationState,
        confirm,
        closeConfirmation
    };
}