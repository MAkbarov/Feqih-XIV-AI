import { useEffect, useState } from 'react';
import { useTheme } from '@/Components/ThemeProvider';
import Icon from '@/Components/Icon';
import { usePage } from '@inertiajs/react';

export default function Footer({ className = '', footerSettings: propFooterSettings = null }) {
    const { theme } = useTheme();
    const { props } = usePage();
    const [appVersion, setAppVersion] = useState('1.0.0');
    const [footerSettings, setFooterSettings] = useState(propFooterSettings || {
        footer_enabled: true,
        footer_text: '© 2024 AI Chatbot. Bütün hüquqlar qorunur.',
        footer_text_color: '#6B7280', // Sol tərəf rəngi
        footer_author_text: 'Developed by Your Company',
        footer_author_color: '#6B7280', // Sağ tərəf rəngi
        site_name: 'AI Chatbot Platform'
    });

    useEffect(() => {
        // Fetch version info
        fetch('/api/app-version')
            .then(response => response.json())
            .then(data => {
                if (data.version) {
                    setAppVersion(data.version);
                }
            })
            .catch(() => {
                // Fallback to default version
                setAppVersion('1.0.0');
            });

        // Only fetch from API if no props provided
        if (!propFooterSettings) {
            fetch('/api/footer-settings')
                .then(response => response.json())
                .then(data => {
                    if (data.footer_enabled !== undefined) {
                        setFooterSettings(data);
                    }
                })
                .catch(error => {
                    console.error('Footer settings could not be loaded:', error);
                });
        } else {
            // Use prop data immediately
            setFooterSettings(propFooterSettings);
        }
    }, [propFooterSettings]);

    // Don't render footer if disabled
    if (!footerSettings.footer_enabled) {
        return null;
    }

    return (
        <footer 
            className={`mt-auto py-6 px-4 backdrop-blur bg-white/80 border-t border-gray-200 ${className}`}
            style={{
                background: `linear-gradient(135deg, ${theme?.primary_color || '#10b981'}15, ${theme?.secondary_color || '#97a5a1'}15)`,
                borderRadius: '6px 6px 0 0'
            }}
        >
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="text-center md:text-left flex flex-col md:flex-row items-center gap-4">
                        <p className="text-sm" style={{ color: footerSettings.footer_text_color || '#6B7280' }}>
                            {footerSettings.footer_text}
                        </p>
                        <div className="flex items-center gap-2 text-xs">
                            <a href="/contact" className="underline hover:no-underline" style={{ color: footerSettings.footer_text_color || '#6B7280' }}>
                                <b>Bizimlə Əlaqə</b>
                            </a>
                            <span style={{ color: footerSettings.footer_text_color || '#6B7280' }}>|</span>
                            <Icon name="settings" size={14} color={footerSettings.footer_text_color || theme?.primary_color || '#10b981'} />
                            <span className="font-medium" style={{ color: footerSettings.footer_text_color || '#6B7280' }}>XIV AI Fəqih v{appVersion}</span>
                        </div>
                    </div>
                    
                    <div className="text-center md:text-right">
                        <div 
                            className="footer-content text-sm flex items-center flex-wrap justify-center md:justify-end gap-1" 
                            style={{ 
                                color: footerSettings.footer_author_color || '#6B7280',
                                lineHeight: '1.5rem',
                                alignItems: 'center',
                                wordBreak: 'break-word'
                            }}
                            dangerouslySetInnerHTML={{ __html: footerSettings.footer_author_text }}
                        />
                    </div>
                </div>
            </div>
        </footer>
    );
}
