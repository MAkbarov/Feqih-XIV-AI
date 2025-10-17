import { useState } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function Theme({ settings }) {
    const { theme } = usePage().props;
    const [activeTab, setActiveTab] = useState('brand');
    
    const { data, setData, post, processing } = useForm({
        // Brand
        site_title: settings.site_title || '',
        site_tagline: settings.site_tagline || '',
        site_logo: settings.site_logo || '',
        site_favicon: settings.site_favicon || '',
        footer_text: settings.footer_text || '',
        
        // Colors
        color_primary: settings.color_primary || '#10B981',
        color_secondary: settings.color_secondary || '#059669',
        color_accent: settings.color_accent || '#8B5CF6',
        color_success: settings.color_success || '#10B981',
        color_warning: settings.color_warning || '#F59E0B',
        color_danger: settings.color_danger || '#EF4444',
        color_info: settings.color_info || '#3B82F6',
        
        // Backgrounds
        bg_gradient_start: settings.bg_gradient_start || '#ffffff',
        bg_gradient_mid: settings.bg_gradient_mid || '#f3f4f6',
        bg_gradient_end: settings.bg_gradient_end || '#e5e7eb',
        bg_pattern: settings.bg_pattern || 'none',
        
        // Borders
        border_radius: settings.border_radius || '12',
        border_color: settings.border_color || '#e5e7eb',
        border_width: settings.border_width || '1',
        
        // Shadows
        shadow_small: settings.shadow_small || '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        shadow_medium: settings.shadow_medium || '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        shadow_large: settings.shadow_large || '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        shadow_xl: settings.shadow_xl || '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        
        // Typography
        font_primary: settings.font_primary || 'Inter, system-ui, sans-serif',
        font_heading: settings.font_heading || 'Inter, system-ui, sans-serif',
        font_size_base: settings.font_size_base || '16',
        
        // Effects
        glassmorphism_enabled: settings.glassmorphism_enabled || 'true',
        glassmorphism_blur: settings.glassmorphism_blur || '10',
        glassmorphism_opacity: settings.glassmorphism_opacity || '80',
        animations_enabled: settings.animations_enabled || 'true',
        animation_speed: settings.animation_speed || 'normal',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/admin/theme');
    };


    return (
        <AdminLayout>
            <Head title="Mövzu Parametrləri" />

            <div className="p-6 max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold mb-8" style={{ color: theme.colors.primary }}>
                    Mövzu və İnterfeys Parametrləri
                </h1>

                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap transition-all ${
                                activeTab === tab.id ? 'shadow-lg' : ''
                            }`}
                            style={{
                                backgroundColor: activeTab === tab.id ? theme.colors.primary : 'white',
                                color: activeTab === tab.id ? 'white' : theme.colors.primary,
                                borderRadius: theme.borders.radius + 'px',
                                boxShadow: activeTab === tab.id ? theme.shadows.medium : theme.shadows.small,
                            }}
                        >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="rounded-2xl p-6 shadow-lg bg-white" 
                         style={{ 
                             borderRadius: theme.borders.radius + 'px',
                             boxShadow: theme.shadows.large,
                             border: `${theme.borders.width}px solid ${theme.borders.color}`
                         }}>
                        
                        {/* Brand Tab */}
                        {activeTab === 'brand' && (
                            <div className="space-y-6">
                                <h3 className="text-xl font-semibold mb-4" style={{ color: theme.colors.primary }}>
                                    Brand Parametrlərı
                                </h3>
                                
                                <div>
                                    <label className="block text-sm font-medium mb-2">Sayt Başlığı</label>
                                    <input
                                        type="text"
                                        value={data.site_title}
                                        onChange={e => setData('site_title', e.target.value)}
                                        className="w-full px-4 py-2 border rounded-lg"
                                        style={{ borderRadius: theme.borders.radius + 'px' }}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Sayt Sloqanı</label>
                                    <input
                                        type="text"
                                        value={data.site_tagline}
                                        onChange={e => setData('site_tagline', e.target.value)}
                                        className="w-full px-4 py-2 border rounded-lg"
                                        style={{ borderRadius: theme.borders.radius + 'px' }}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Logo URL</label>
                                    <input
                                        type="text"
                                        value={data.site_logo}
                                        onChange={e => setData('site_logo', e.target.value)}
                                        className="w-full px-4 py-2 border rounded-lg"
                                        style={{ borderRadius: theme.borders.radius + 'px' }}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Favicon URL</label>
                                    <input
                                        type="text"
                                        value={data.site_favicon}
                                        onChange={e => setData('site_favicon', e.target.value)}
                                        className="w-full px-4 py-2 border rounded-lg"
                                        style={{ borderRadius: theme.borders.radius + 'px' }}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Footer Mətni</label>
                                    <input
                                        type="text"
                                        value={data.footer_text}
                                        onChange={e => setData('footer_text', e.target.value)}
                                        className="w-full px-4 py-2 border rounded-lg"
                                        style={{ borderRadius: theme.borders.radius + 'px' }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Colors Tab */}
                        {activeTab === 'colors' && (
                            <div className="space-y-6">
                                <h3 className="text-xl font-semibold mb-4" style={{ color: theme.colors.primary }}>
                                    Rəng Parametrlərı
                                </h3>
                                
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {Object.entries({
                                        'color_primary': 'Əsas Rəng',
                                        'color_secondary': 'İkinci Rəng',
                                        'color_accent': 'Vurğu Rəngi',
                                        'color_success': 'Uğur',
                                        'color_warning': 'Xəbərdarlıq',
                                        'color_danger': 'Təhlükə',
                                        'color_info': 'Məlumat',
                                    }).map(([key, label]) => (
                                        <div key={key}>
                                            <label className="block text-sm font-medium mb-2">{label}</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="color"
                                                    value={data[key]}
                                                    onChange={e => setData(key, e.target.value)}
                                                    className="h-10 w-20"
                                                />
                                                <input
                                                    type="text"
                                                    value={data[key]}
                                                    onChange={e => setData(key, e.target.value)}
                                                    className="flex-1 px-3 py-1 border rounded"
                                                    style={{ borderRadius: theme.borders.radius + 'px' }}
                                                />
                                            </div>
                                            <div 
                                                className="mt-2 h-10 rounded"
                                                style={{ 
                                                    backgroundColor: data[key],
                                                    borderRadius: theme.borders.radius + 'px'
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Backgrounds Tab */}
                        {activeTab === 'backgrounds' && (
                            <div className="space-y-6">
                                <h3 className="text-xl font-semibold mb-4" style={{ color: theme.colors.primary }}>
                                    Arxa Fon Parametrlərı
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Gradient Başlanğıc</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="color"
                                                value={data.bg_gradient_start}
                                                onChange={e => setData('bg_gradient_start', e.target.value)}
                                                className="h-10 w-20"
                                            />
                                            <input
                                                type="text"
                                                value={data.bg_gradient_start}
                                                onChange={e => setData('bg_gradient_start', e.target.value)}
                                                className="flex-1 px-3 py-1 border rounded"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Gradient Orta</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="color"
                                                value={data.bg_gradient_mid}
                                                onChange={e => setData('bg_gradient_mid', e.target.value)}
                                                className="h-10 w-20"
                                            />
                                            <input
                                                type="text"
                                                value={data.bg_gradient_mid}
                                                onChange={e => setData('bg_gradient_mid', e.target.value)}
                                                className="flex-1 px-3 py-1 border rounded"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Gradient Son</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="color"
                                                value={data.bg_gradient_end}
                                                onChange={e => setData('bg_gradient_end', e.target.value)}
                                                className="h-10 w-20"
                                            />
                                            <input
                                                type="text"
                                                value={data.bg_gradient_end}
                                                onChange={e => setData('bg_gradient_end', e.target.value)}
                                                className="flex-1 px-3 py-1 border rounded"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 h-32 rounded-xl"
                                     style={{
                                         background: `linear-gradient(135deg, ${data.bg_gradient_start}, ${data.bg_gradient_mid}, ${data.bg_gradient_end})`,
                                         borderRadius: theme.borders.radius + 'px'
                                     }}
                                />
                            </div>
                        )}

                        {/* Borders Tab */}
                        {activeTab === 'borders' && (
                            <div className="space-y-6">
                                <h3 className="text-xl font-semibold mb-4" style={{ color: theme.colors.primary }}>
                                    Sərhəd Parametrlərı
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Border Radius (px)</label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="50"
                                            value={data.border_radius}
                                            onChange={e => setData('border_radius', e.target.value)}
                                            className="w-full"
                                        />
                                        <div className="text-center mt-2">{data.border_radius}px</div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Border Rəngi</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="color"
                                                value={data.border_color}
                                                onChange={e => setData('border_color', e.target.value)}
                                                className="h-10 w-20"
                                            />
                                            <input
                                                type="text"
                                                value={data.border_color}
                                                onChange={e => setData('border_color', e.target.value)}
                                                className="flex-1 px-3 py-1 border rounded"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Border Qalınlığı (px)</label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="10"
                                            value={data.border_width}
                                            onChange={e => setData('border_width', e.target.value)}
                                            className="w-full"
                                        />
                                        <div className="text-center mt-2">{data.border_width}px</div>
                                    </div>
                                </div>

                                <div className="mt-4 p-8 bg-gray-50">
                                    <div className="bg-white p-4 text-center"
                                         style={{
                                             border: `${data.border_width}px solid ${data.border_color}`,
                                             borderRadius: data.border_radius + 'px'
                                         }}>
                                        Nümunə
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Shadows Tab */}
                        {activeTab === 'shadows' && (
                            <div className="space-y-6">
                                <h3 className="text-xl font-semibold mb-4" style={{ color: theme.colors.primary }}>
                                    Kölgə Parametrlərı
                                </h3>

                                <div className="space-y-4">
                                    {Object.entries({
                                        'shadow_small': 'Kiçik Kölgə',
                                        'shadow_medium': 'Orta Kölgə',
                                        'shadow_large': 'Böyük Kölgə',
                                        'shadow_xl': 'Çox Böyük Kölgə',
                                    }).map(([key, label]) => (
                                        <div key={key}>
                                            <label className="block text-sm font-medium mb-2">{label}</label>
                                            <input
                                                type="text"
                                                value={data[key]}
                                                onChange={e => setData(key, e.target.value)}
                                                className="w-full px-3 py-2 border rounded"
                                            />
                                            <div className="mt-2 p-8 bg-gray-50">
                                                <div className="bg-white p-4 text-center"
                                                     style={{
                                                         boxShadow: data[key],
                                                         borderRadius: theme.borders.radius + 'px'
                                                     }}>
                                                    {label} Nümunəsi
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Typography Tab */}
                        {activeTab === 'typography' && (
                            <div className="space-y-6">
                                <h3 className="text-xl font-semibold mb-4" style={{ color: theme.colors.primary }}>
                                    Yazı Parametrlərı
                                </h3>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Əsas Font</label>
                                    <select
                                        value={data.font_primary}
                                        onChange={e => setData('font_primary', e.target.value)}
                                        className="w-full px-3 py-2 border rounded"
                                    >
                                        <option value="Inter, system-ui, sans-serif">Inter</option>
                                        <option value="Roboto, sans-serif">Roboto</option>
                                        <option value="'Open Sans', sans-serif">Open Sans</option>
                                        <option value="Lato, sans-serif">Lato</option>
                                        <option value="Montserrat, sans-serif">Montserrat</option>
                                        <option value="Poppins, sans-serif">Poppins</option>
                                        <option value="system-ui, sans-serif">System UI</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Başlıq Fontu</label>
                                    <select
                                        value={data.font_heading}
                                        onChange={e => setData('font_heading', e.target.value)}
                                        className="w-full px-3 py-2 border rounded"
                                    >
                                        <option value="Inter, system-ui, sans-serif">Inter</option>
                                        <option value="Roboto, sans-serif">Roboto</option>
                                        <option value="'Open Sans', sans-serif">Open Sans</option>
                                        <option value="Lato, sans-serif">Lato</option>
                                        <option value="Montserrat, sans-serif">Montserrat</option>
                                        <option value="Poppins, sans-serif">Poppins</option>
                                        <option value="Playfair Display, serif">Playfair Display</option>
                                        <option value="system-ui, sans-serif">System UI</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Əsas Font Ölçüsü (px)</label>
                                    <input
                                        type="range"
                                        min="12"
                                        max="20"
                                        value={data.font_size_base}
                                        onChange={e => setData('font_size_base', e.target.value)}
                                        className="w-full"
                                    />
                                    <div className="text-center mt-2">{data.font_size_base}px</div>
                                </div>

                                <div className="mt-4 p-4 bg-gray-50">
                                    <h1 style={{ fontFamily: data.font_heading, fontSize: '2rem' }}>Başlıq Nümunəsi</h1>
                                    <p style={{ fontFamily: data.font_primary, fontSize: data.font_size_base + 'px' }}>
                                        Bu mətn nümunəsidir. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Effects Tab */}
                        {activeTab === 'effects' && (
                            <div className="space-y-6">
                                <h3 className="text-xl font-semibold mb-4" style={{ color: theme.colors.primary }}>
                                    Effekt Parametrlərı
                                </h3>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            id="glassmorphism"
                                            checked={data.glassmorphism_enabled === 'true'}
                                            onChange={e => setData('glassmorphism_enabled', e.target.checked ? 'true' : 'false')}
                                        />
                                        <label htmlFor="glassmorphism" className="font-medium">Glassmorphism Effekti</label>
                                    </div>

                                    {data.glassmorphism_enabled === 'true' && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium mb-2">Blur Dərəcəsi</label>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="20"
                                                    value={data.glassmorphism_blur}
                                                    onChange={e => setData('glassmorphism_blur', e.target.value)}
                                                    className="w-full"
                                                />
                                                <div className="text-center mt-2">{data.glassmorphism_blur}px</div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium mb-2">Şəffaflıq</label>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="100"
                                                    value={data.glassmorphism_opacity}
                                                    onChange={e => setData('glassmorphism_opacity', e.target.value)}
                                                    className="w-full"
                                                />
                                                <div className="text-center mt-2">{data.glassmorphism_opacity}%</div>
                                            </div>
                                        </>
                                    )}

                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            id="animations"
                                            checked={data.animations_enabled === 'true'}
                                            onChange={e => setData('animations_enabled', e.target.checked ? 'true' : 'false')}
                                        />
                                        <label htmlFor="animations" className="font-medium">Animasiyalar</label>
                                    </div>

                                    {data.animations_enabled === 'true' && (
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Animasiya Sürəti</label>
                                            <select
                                                value={data.animation_speed}
                                                onChange={e => setData('animation_speed', e.target.value)}
                                                className="w-full px-3 py-2 border rounded"
                                            >
                                                <option value="slow">Yavaş</option>
                                                <option value="normal">Normal</option>
                                                <option value="fast">Sürətli</option>
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end mt-6">
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-6 py-3 text-white font-medium rounded-lg transition-all"
                            style={{
                                backgroundColor: theme.colors.primary,
                                borderRadius: theme.borders.radius + 'px',
                                boxShadow: theme.shadows.medium,
                            }}
                        >
                            Yadda Saxla
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}