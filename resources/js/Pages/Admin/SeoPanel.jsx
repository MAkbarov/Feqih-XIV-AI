import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { motion } from 'framer-motion';
import { useToast } from '@/Components/ToastProvider';
import Icon from '@/Components/Icon';

const SeoPanel = ({ footerSettings, pages, seoSettings: initialSeoSettings }) => {
    const toast = useToast();
    const [selectedPage, setSelectedPage] = useState('home');
    const [seoSettings, setSeoSettings] = useState(initialSeoSettings);
    const [isLoading, setIsLoading] = useState(false);
    const [analysis, setAnalysis] = useState(null);

    const currentSetting = seoSettings[selectedPage] || {};

    // Form state for current page
    const [formData, setFormData] = useState({});

    useEffect(() => {
        if (currentSetting) {
            setFormData({
                title: currentSetting.title || '',
                description: currentSetting.description || '',
                keywords: currentSetting.keywords || '',
                canonical_url: currentSetting.canonical_url || '',
                og_title: currentSetting.og_title || '',
                og_description: currentSetting.og_description || '',
                og_image: currentSetting.og_image || '',
                og_type: currentSetting.og_type || 'website',
                twitter_title: currentSetting.twitter_title || '',
                twitter_description: currentSetting.twitter_description || '',
                twitter_image: currentSetting.twitter_image || '',
                twitter_card: currentSetting.twitter_card || 'summary_large_image',
                noindex: currentSetting.noindex || false,
                nofollow: currentSetting.nofollow || false,
            });
        }
    }, [selectedPage, currentSetting]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch(`/admin/seo/${selectedPage}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                setSeoSettings(prev => ({
                    ...prev,
                    [selectedPage]: data.seoSetting
                }));
                toast.success(data.message);
                // Refresh analysis if it was loaded
                if (analysis) {
                    loadAnalysis();
                }
            } else {
                toast.error(data.message || 'Xəta baş verdi');
            }
        } catch (error) {
            toast.error('Əlaqə xətası: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const loadAnalysis = async () => {
        try {
            const response = await fetch(`/admin/seo/${selectedPage}/analyze`);
            const data = await response.json();
            
            if (data.success) {
                setAnalysis(data.analysis);
            }
        } catch (error) {
            console.error('Analysis yüklənmə xətası:', error);
        }
    };

    const generateSitemap = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/admin/seo/generate/sitemap', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                }
            });

            const data = await response.json();
            if (data.success) {
                toast.success(data.message);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error('Sitemap yaradılma xətası: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const generateRobots = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/admin/seo/generate/robots', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                }
            });

            const data = await response.json();
            if (data.success) {
                toast.success(data.message);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error('Robots.txt yaradılma xətası: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const getScoreColor = (score) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getScoreBg = (score) => {
        if (score >= 80) return 'bg-green-100 border-green-300';
        if (score >= 60) return 'bg-yellow-100 border-yellow-300';
        return 'bg-red-100 border-red-300';
    };

    return (
        <AdminLayout>
            <Head title="SEO Panel" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Header */}
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl shadow-xl p-6 mb-8 border border-gray-200 dark:border-gray-700"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
                                    <Icon name="search" size={32} color="#10b981" />
                                    SEO Panel
                                </h1>
                                <p className="mt-2 text-gray-600 dark:text-gray-300">
                                    Saytın SEO tənzimləmələrini idarə edin və performansı artırın
                                </p>
                            </div>
                            
                            <div className="flex gap-3">
                                <button
                                    onClick={generateSitemap}
                                    disabled={isLoading}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                                >
                                    <Icon name="download" size={16} />
                                    Sitemap Yarat
                                </button>
                                <button
                                    onClick={generateRobots}
                                    disabled={isLoading}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                                >
                                    <Icon name="file-text" size={16} />
                                    Robots.txt Yarat
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        {/* Page Selector */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700"
                        >
                            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                                <Icon name="list" size={20} />
                                Səhifələr
                            </h2>

                            <div className="space-y-2">
                                {Object.entries(pages).map(([pageKey, pageName]) => (
                                    <button
                                        key={pageKey}
                                        onClick={() => setSelectedPage(pageKey)}
                                        className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center justify-between ${
                                            selectedPage === pageKey
                                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-300'
                                                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                                        }`}
                                    >
                                        <span>{pageName}</span>
                                        {selectedPage === pageKey && <Icon name="check" size={16} />}
                                    </button>
                                ))}
                            </div>

                            {/* SEO Analysis Button */}
                            <button
                                onClick={loadAnalysis}
                                className="w-full mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2"
                            >
                                <Icon name="bar-chart" size={16} />
                                SEO Analiz Et
                            </button>

                            {/* Analysis Results */}
                            {analysis && (
                                <div className={`mt-4 p-4 rounded-lg border ${getScoreBg(analysis.score)}`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="font-semibold">SEO Nəticəsi</h3>
                                        <span className={`text-2xl font-bold ${getScoreColor(analysis.score)}`}>
                                            {analysis.score}/100
                                        </span>
                                    </div>
                                    
                                    {analysis.issues.length > 0 && (
                                        <div className="mb-2">
                                            <h4 className="text-sm font-medium text-red-700 dark:text-red-300 mb-1">Problemlər:</h4>
                                            <ul className="text-xs text-red-600 dark:text-red-400 space-y-1">
                                                {analysis.issues.map((issue, index) => (
                                                    <li key={index}>• {issue}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    
                                    {analysis.suggestions.length > 0 && (
                                        <div className="mb-2">
                                            <h4 className="text-sm font-medium text-yellow-700 dark:text-yellow-300 mb-1">Tövsiyələr:</h4>
                                            <ul className="text-xs text-yellow-600 dark:text-yellow-400 space-y-1">
                                                {analysis.suggestions.map((suggestion, index) => (
                                                    <li key={index}>• {suggestion}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    
                                    {analysis.good_points.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">Yaxşı tərəflər:</h4>
                                            <ul className="text-xs text-green-600 dark:text-green-400 space-y-1">
                                                {analysis.good_points.map((point, index) => (
                                                    <li key={index}>• {point}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>

                        {/* SEO Form */}
                        <div className="lg:col-span-3">
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700"
                            >
                                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-6 flex items-center gap-2">
                                    <Icon name="edit" size={20} />
                                    {pages[selectedPage]} - SEO Tənzimləmələri
                                </h2>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Basic SEO */}
                                    <div className="grid grid-cols-1 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Title Tag
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.title || ''}
                                                onChange={(e) => handleInputChange('title', e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                                placeholder="SEO üçün səhifə başlığı..."
                                                maxLength="255"
                                            />
                                            <div className="text-xs text-gray-500 mt-1">
                                                {formData.title ? formData.title.length : 0}/255 simvol
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Meta Description
                                            </label>
                                            <textarea
                                                value={formData.description || ''}
                                                onChange={(e) => handleInputChange('description', e.target.value)}
                                                rows={3}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                                placeholder="Səhifənin qısa təsviri..."
                                                maxLength="1000"
                                            />
                                            <div className="text-xs text-gray-500 mt-1">
                                                {formData.description ? formData.description.length : 0}/1000 simvol
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Keywords (vergüllə ayırın)
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.keywords || ''}
                                                onChange={(e) => handleInputChange('keywords', e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                                placeholder="açar söz 1, açar söz 2, açar söz 3..."
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Canonical URL
                                            </label>
                                            <input
                                                type="url"
                                                value={formData.canonical_url || ''}
                                                onChange={(e) => handleInputChange('canonical_url', e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                                placeholder="https://example.com/page"
                                            />
                                        </div>
                                    </div>

                                    {/* Open Graph */}
                                    <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
                                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Open Graph (Facebook)</h3>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    OG Title
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.og_title || ''}
                                                    onChange={(e) => handleInputChange('og_title', e.target.value)}
                                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    OG Type
                                                </label>
                                                <select
                                                    value={formData.og_type || 'website'}
                                                    onChange={(e) => handleInputChange('og_type', e.target.value)}
                                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                                >
                                                    <option value="website">Website</option>
                                                    <option value="article">Article</option>
                                                    <option value="profile">Profile</option>
                                                </select>
                                            </div>

                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    OG Description
                                                </label>
                                                <textarea
                                                    value={formData.og_description || ''}
                                                    onChange={(e) => handleInputChange('og_description', e.target.value)}
                                                    rows={2}
                                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                                />
                                            </div>

                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    OG Image URL
                                                </label>
                                                <input
                                                    type="url"
                                                    value={formData.og_image || ''}
                                                    onChange={(e) => handleInputChange('og_image', e.target.value)}
                                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                                    placeholder="https://example.com/image.jpg"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Twitter Card */}
                                    <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
                                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Twitter Card</h3>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Twitter Title
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.twitter_title || ''}
                                                    onChange={(e) => handleInputChange('twitter_title', e.target.value)}
                                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Twitter Card Type
                                                </label>
                                                <select
                                                    value={formData.twitter_card || 'summary_large_image'}
                                                    onChange={(e) => handleInputChange('twitter_card', e.target.value)}
                                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                                >
                                                    <option value="summary">Summary</option>
                                                    <option value="summary_large_image">Summary Large Image</option>
                                                </select>
                                            </div>

                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Twitter Description
                                                </label>
                                                <textarea
                                                    value={formData.twitter_description || ''}
                                                    onChange={(e) => handleInputChange('twitter_description', e.target.value)}
                                                    rows={2}
                                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                                />
                                            </div>

                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Twitter Image URL
                                                </label>
                                                <input
                                                    type="url"
                                                    value={formData.twitter_image || ''}
                                                    onChange={(e) => handleInputChange('twitter_image', e.target.value)}
                                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                                    placeholder="https://example.com/image.jpg"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Robot Settings */}
                                    <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
                                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Robot Tənzimləmələri</h3>
                                        
                                        <div className="flex gap-6">
                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    id="noindex"
                                                    checked={formData.noindex || false}
                                                    onChange={(e) => handleInputChange('noindex', e.target.checked)}
                                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                                />
                                                <label htmlFor="noindex" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                                    Noindex (axtarış mühərriklərindən gizlə)
                                                </label>
                                            </div>

                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    id="nofollow"
                                                    checked={formData.nofollow || false}
                                                    onChange={(e) => handleInputChange('nofollow', e.target.checked)}
                                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                                />
                                                <label htmlFor="nofollow" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                                    Nofollow (linkləri izləmə)
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Submit Button */}
                                    <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-600">
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {isLoading ? (
                                                <>
                                                    <Icon name="loader" size={16} className="animate-spin" />
                                                    Saxlanılır...
                                                </>
                                            ) : (
                                                <>
                                                    <Icon name="save" size={16} />
                                                    Saxla
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default SeoPanel;