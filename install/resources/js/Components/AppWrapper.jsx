import React from 'react';
import { ToastProvider } from './ToastProvider';
import { ThemeProvider } from './ThemeProvider';

export default function AppWrapper({ children }) {
    return (
        <ThemeProvider>
            <ToastProvider position="top-right" maxToasts={5}>
                {children}
            </ToastProvider>
        </ThemeProvider>
    );
}
