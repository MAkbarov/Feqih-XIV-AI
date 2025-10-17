import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { motion } from 'framer-motion';
import Icon from '@/Components/Icon';
import { useToast } from '@/Components/ToastProvider';
import axios from 'axios';
import ConfirmationModal from '@/Components/ConfirmationModal';
import useConfirmation from '@/Hooks/useConfirmation';

// Helper to read cookie value (for XSRF)
const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
};

const AiTraining = ({ knowledgeItems, systemPrompt, pagination, search: initialSearch }) => {
    const toast = useToast();
    const { confirmationState, confirm, closeConfirmation } = useConfirmation();
    const [activeTab, setActiveTab] = useState('instructions');
    const [selectedItem, setSelectedItem] = useState(null);
    const [importUrl, setImportUrl] = useState('');
    const [editingItem, setEditingItem] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    
    const { data, setData, post, put, processing, reset } = useForm({
        title: '',
        content: '',
        source: '',
        source_url: '',
        category: 'fiqh',
        author: '',
        language: 'az',
        is_active: true,
        system_prompt: systemPrompt || '',
        crawlLinks: false,
        maxDepth: 1,
    });

    const [categories, setCategories] = useState([]);

    const loadCategories = async () => {
        try {
            const res = await fetch('/admin/ai-training/categories', { headers: { 'Accept': 'application/json' } });
            const dataJson = await res.json();
            if (dataJson.success && Array.isArray(dataJson.items)) {
                const options = dataJson.items
                    .filter(c => c.is_active)
                    .sort((a,b) => a.sort_order - b.sort_order)
                    .map(c => ({ id: c.id, value: c.key, label: c.name }));
                    
                // Always add the imported category for proper display
                if (!options.find(c => c.value === 'imported')) {
                    options.push({ id: 'imported', value: 'imported', label: 'Baza(İdxal)' });
                }
                
                setCategories(options);
                // If current selected category is empty or not exists, default to first
                if (options.length > 0 && !options.find(o => o.value === data.category)) {
                    setData('category', options[0].value);
                }
            }
        } catch (e) {
            // Fallback to defaults if API fails
            const fallback = [
                { value: 'imported', label: 'Baza(İdxal)' },
                { value: 'fiqh', label: 'Fiqh (İslam hüququ)' },
                { value: 'akhlaq', label: 'Əxlaq' },
                { value: 'aqeedah', label: 'Əqidə' },
                { value: 'quran', label: 'Quran təfsiri' },
                { value: 'hadith', label: 'Hədis' },
                { value: 'dua', label: 'Dua və zikrlər' },
                { value: 'history', label: 'İslam tarixi' },
                { value: 'general', label: 'Ümumi' },
            ];
            setCategories(fallback);
        }
    };

    const [religiousSources, setReligiousSources] = useState([
        { id: 1, name: 'Wikipedia - İslam', url: 'https://az.wikipedia.org/wiki/İslam', category: 'Ensiklopediya' },
        { id: 2, name: 'Wikipedia - Namaz', url: 'https://az.wikipedia.org/wiki/Namaz', category: 'Ensiklopediya' },
        { id: 3, name: 'Wikipedia - Ramazan', url: 'https://az.wikipedia.org/wiki/Ramazan', category: 'Ensiklopediya' },
        { id: 4, name: 'Test Məqaləsi', url: 'https://jsonplaceholder.typicode.com/posts/1', category: 'Test' },
        { id: 5, name: 'Lorem Ipsum', url: 'https://www.lipsum.com/', category: 'Test' },
    ]);
    
    const [editingSource, setEditingSource] = useState(null);
    const [newSource, setNewSource] = useState({ name: '', url: '', category: 'Portal' });
    
    // Advanced Training States
    const [advancedTrainingMode, setAdvancedTrainingMode] = useState('url'); // 'url', 'qa', 'text'

    // Categories manager UI state
    const [catModalOpen, setCatModalOpen] = useState(false);
    const [newCat, setNewCat] = useState({ key: '', name: '', locale: 'az', sort_order: 0, is_active: true });

    const createCategory = async () => {
        try {
            const res = await fetch('/admin/ai-training/categories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                    'X-XSRF-TOKEN': getCookie('XSRF-TOKEN')
                },
                credentials: 'same-origin',
                body: JSON.stringify(newCat)
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Kateqoriya əlavə edildi');
                setNewCat({ key: '', name: '', locale: 'az', sort_order: 0, is_active: true });
                loadCategories();
            } else {
                toast.error('Kateqoriya əlavə olunmadı');
            }
        } catch (e) {
            toast.error('Kateqoriya əlavə xətası');
        }
    };

    const updateCategory = async (catId, payload) => {
        try {
            const res = await fetch(`/admin/ai-training/categories/${catId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                    'X-XSRF-TOKEN': getCookie('XSRF-TOKEN')
                },
                credentials: 'same-origin',
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Kateqoriya yeniləndi');
                loadCategories();
            } else {
                toast.error('Kateqoriya yenilənmədi');
            }
        } catch (e) {
            toast.error('Kateqoriya yeniləmə xətası');
        }
    };

    const deleteCategory = async (catId) => {
        try {
            const res = await fetch(`/admin/ai-training/categories/${catId}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                    'X-XSRF-TOKEN': getCookie('XSRF-TOKEN')
                },
                credentials: 'same-origin'
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Kateqoriya silindi');
                loadCategories();
            } else {
                toast.error('Kateqoriya silinmədi');
            }
        } catch (e) {
            toast.error('Kateqoriya silmə xətası');
        }
    };

    // Training states - moved before useEffect to avoid initialization order issues
    const [urlTrainingData, setUrlTrainingData] = useState({ 
        url: '', 
        single: true, 
        maxDepth: 1, 
        level: 3,  // 🆕 Yeni parametr: xülase səviyyəsi
        crawlSibling: false, // 🆕 Sibling mod - eyni səviyyədəki URL-ləri əzbərlə
        category: 'imported', 
        source: '' 
    });
    const [urlProgress, setUrlProgress] = useState(0);
    const [stopping, setStopping] = useState(false);
    const [progressToken, setProgressToken] = useState(null);
    const [isTrainingInProgress, setIsTrainingInProgress] = useState(false); // URL training status

    // URL training-i dayandırmaq üçün funksiya - moved before useEffect
    const stopTraining = async () => {
        if (progressToken) {
            try {
                const stopKey = 'url_train:stop:' + progressToken;
                await axios.post('/admin/ai-training/import-stop', {
                    progress_token: progressToken,
                    stop_key: stopKey
                });
                console.log('Training dayandırıldı:', progressToken);
            } catch (error) {
                console.error('Training dayandırma xətası:', error);
            }
        }
    };

    // Load categories on mount
    React.useEffect(() => {
        loadCategories();
    }, []);
    
    // Sahifə ayrılma qadağası - URL training zamanı
    React.useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (isTrainingInProgress) {
                const message = 'URL training davam edir. Sahifəni tərk etsəniz training dayandırılacaq. Əminsiniz?';
                e.preventDefault();
                e.returnValue = message; // Chrome üçün
                return message; // Digər browser-lər üçün
            }
        };
        
        const handleUnload = () => {
            if (isTrainingInProgress && progressToken) {
                // Training-i dayandır
                stopTraining();
            }
        };
        
        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('unload', handleUnload);
        
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('unload', handleUnload);
        };
    }, [isTrainingInProgress, progressToken]);
    const [qaTrainingData, setQaTrainingData] = useState({
        question: '',
        answer: '',
        source: 'S&C Təlimat',
        category: 'qa',
        author: ''
    });
    const [textTrainingData, setTextTrainingData] = useState({
        title: '',
        content: '',
        source: 'Əlavə edilmə - Baza',
        category: 'manual',
        author: ''
    });
    const [trainingInProgress, setTrainingInProgress] = useState(false);
    
    // Pagination və search state-ləri
    const [currentPage, setCurrentPage] = useState(pagination?.current_page || 1);
    const [searchTerm, setSearchTerm] = useState(initialSearch || '');
    const [searchInput, setSearchInput] = useState(initialSearch || '');
    
    // Pagination navigate
    const navigateToPage = (page) => {
        if (page < 1 || (pagination && page > pagination.last_page)) return;
        
        const url = new URL(window.location);
        url.searchParams.set('page', page);
        if (searchTerm) {
            url.searchParams.set('search', searchTerm);
        } else {
            url.searchParams.delete('search');
        }
        
        window.location.href = url.toString();
    };
    
    // Search submit
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        const url = new URL(window.location);
        url.searchParams.set('page', 1); // Reset to first page
        if (searchInput.trim()) {
            url.searchParams.set('search', searchInput.trim());
        } else {
            url.searchParams.delete('search');
        }
        window.location.href = url.toString();
    };

    const handleSubmitKnowledge = (e) => {
        e.preventDefault();
        
        if (isEditMode && editingItem) {
            // Update existing item using PUT method
            put(`/admin/ai-training/knowledge/${editingItem.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    setIsEditMode(false);
                    setEditingItem(null);
                    reset('title', 'content', 'source', 'source_url', 'category', 'author');
                    toast.success('Məlumat uğurla yeniləndi!');
                },
                onError: (errors) => {
                    console.error('Update errors:', errors);
                    toast.error('Məlumat yeniləərkən xəta baş verdi!');
                }
            });
        } else {
            // Create new item
            post('/admin/ai-training/knowledge', {
                preserveScroll: true,
                onSuccess: () => {
                    reset('title', 'content', 'source', 'source_url', 'category', 'author');
                    toast.success('Məlumat uğurla əlavə edildi!');
                },
                onError: () => {
                    toast.error('Məlumat əlavə edərkən xəta baş verdi!');
                }
            });
        }
    };
    
    const handleEditKnowledge = async (item) => {
        try {
            // Fetch the full item data
            const response = await axios.get(`/admin/ai-training/knowledge/${item.id}/edit`);
            const itemData = response.data;
            
            // Set form data with item values
            setData({
                ...data,
                title: itemData.title || '',
                content: itemData.content || '',
                source: itemData.source || '',
                source_url: itemData.source_url || '',
                category: itemData.category || 'fiqh',
                author: itemData.author || '',
                language: itemData.language || 'az',
                is_active: itemData.is_active ?? true
            });
            
            setEditingItem(itemData);
            setIsEditMode(true);
            
            // Switch to knowledge tab if not already there
            if (activeTab !== 'knowledge') {
                setActiveTab('knowledge');
            }
            
            // Scroll to form after a short delay to ensure tab switch is complete
            setTimeout(() => {
                const formElement = document.getElementById('knowledge-form');
                if (formElement) {
                    formElement.scrollIntoView({ behavior: 'smooth' });
                }
            }, 100);
            
            toast.info('Redaktə rejimi aktivdir!');
        } catch (error) {
            console.error('Edit error:', error);
            toast.error('Məlumat yükləyərkən xəta baş verdi!');
        }
    };
    
    const handleCancelEdit = () => {
        setIsEditMode(false);
        setEditingItem(null);
        reset('title', 'content', 'source', 'source_url', 'category', 'author');
        toast.info('Redaktə ləğv edildi!');
    };

    const handleUpdateSystemPrompt = () => {
        post('/admin/ai-training/system-prompt', {
            data: { system_prompt: data.system_prompt },
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Sistem təlimatı uğurla yeniləndi!');
            },
            onError: () => {
                toast.error('Sistem təlimatını yeniləyərkən xəta baş verdi!');
            }
        });
    };

    const handleTrainFromUrl = (url, sourceName, options = {}) => {
        if (!url) {
            toast.warning('URL mövcud deyil!');
            return;
        }
        
        const form = new FormData();
        form.append('url', url);
        
        // Add crawling options if provided
        if (options.crawlLinks) {
            form.append('crawl_links', '1');
            form.append('max_depth', options.maxDepth || 1);
        }
        
        const crawlMessage = options.crawlLinks ? ' və əlaqəli səhifələri' : '';
        toast.info(`"${sourceName}" mənbəsindən${crawlMessage} öyrənmə başlandı...`);
        
        axios.post('/admin/ai-training/import-url', form)
            .then((response) => {
                setImportUrl(''); // Clear manual input
                const successMessage = response.data.crawled_links ? 
                    `"${sourceName}" və əlaqəli səhifələr uğurla öyrədildi!` :
                    `"${sourceName}" uğurla öyrədildi və bilik bazasına əlavə edildi!`;
                toast.success(successMessage);
                // Reload page to show new data
                setTimeout(() => window.location.reload(), 2000);
            })
            .catch((error) => {
                console.error('Training error:', error);
                const errorMsg = error.response?.data?.message || 'URL öyrədərkən xəta baş verdi!';
                toast.error(`"${sourceName}" öyrədilmir: ${errorMsg}`);
            });
    };

    const handleDeleteKnowledge = async (id) => {
        const confirmed = await confirm({
            title: 'Məlumatı Sil',
            message: 'Bu məlumatı silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarıla bilməz.',
            confirmText: 'Sil',
            cancelText: 'Ləğv et',
            type: 'danger'
        });
        
        if (confirmed) {
            try {
                await axios.post(`/admin/ai-training/knowledge/${id}/delete`);
                toast.success('Məlumat uğurla silindi!');
                window.location.reload();
            } catch (error) {
                toast.error('Məlumat silinmədi!');
            }
        }
    };

    const handleToggleActive = (id) => {
        axios.post(`/admin/ai-training/knowledge/${id}/toggle`)
            .then(() => {
                toast.success('Məlumat statusu dəyişdi!');
                window.location.reload();
            })
            .catch(() => {
                toast.error('Status dəyişmədi!');
            });
    };
    
    // Bütün məlumatları sil funksiyası
    const handleDeleteAllKnowledge = async () => {
        const confirmed = await confirm({
            title: 'Təhlükəli Əməliyyat: Bütün Bilik Bazasını Sil',
            message: `DIQQET! Bu əməliyyat tamamən geri alına bilməz!\n\nSiləcəklər:\n\n• Bütün məlumatlar\n• Bütün öyrədilmiş URL-lər\n• Bütün Q&A elementləri\n• Bütün manual əlavələr\n• Bütün kateqoriya məlumatları\n\nBu əməliyyat geri QAYTARILA BILMəZ!\n\nRazısınız?`,
            confirmText: 'İnənim! Bütün Məlumatları Sil!',
            cancelText: 'Xeyr, Ləğv Et',
            type: 'danger'
        });
        
        if (confirmed) {
            try {
                console.log('DELETE ALL REQUEST BAŞLAYIR...');
                toast.info('Bütün məlumatlar silinir, gözləyin...');
                
                console.log('Sending DELETE request to: /admin/ai-training/knowledge/all');
                // Inertia router istəfadə edərək CSRF token avtomatik göndəriləcək
                console.log('Inertia router DELETE istifadə edilir...');
                
                // Daha sadə Promise wrapper
                await new Promise((resolve, reject) => {
                    router.post('/admin/ai-training/knowledge/delete-all', {}, {
                        onSuccess: () => {
                            toast.success('Bütün bilik bazası təmizləndi!');
                            setTimeout(() => {
                                window.location.reload();
                            }, 1200);
                            resolve();
                        },
                        onError: () => {
                            toast.error('Bütün məlumatları silərkən xəta baş verdi!');
                            reject(new Error('Request failed'));
                        },
                        onFinish: () => {
                            console.log('ℹ️ Inertia request finished');
                        }
                    });
                });
                
            } catch (error) {
                console.error('Delete all knowledge error:', error);
                if (!error.message.includes('Xəta:')) {
                    toast.error(`Xəta: ${error.message}`);
                }
            }
        }
    };
    
    // Advanced Training Methods
    const handleAdvancedUrlTraining = async () => {
        if (!urlTrainingData.url) {
            toast.warning('URL daxil edin!');
            return;
        }
        
        setTrainingInProgress(true);
        setIsTrainingInProgress(true); // Sahifə ayrılma qadağası aktiv et
        setUrlProgress(0);

        // Unique progress token per request
        const token = Math.random().toString(36).slice(2) + Date.now();
        setProgressToken(token);
        
        const trainingMessage = urlTrainingData.single 
            ? `"${urlTrainingData.url}" əzbərlənmə başlanır...`
            : `"${urlTrainingData.url}" və bütün əlaqəli səhifələr əzbərlənmə başlanır...`;
            
        toast.info(trainingMessage);
        
        // Poll progress while request is being processed - Real-zamanlı sistem
        let poller = null;
        const startPolling = () => {
            // Dərhal ilk dəfə yoxla
            setTimeout(checkProgress, 500);
            
            // Sonra müntəzəm yoxla - daha sürətlə
            poller = setInterval(checkProgress, 1500); // 1.5 saniyə
            
            async function checkProgress() {
                try {
                    const res = await fetch(`/admin/ai-training/import-progress?token=${encodeURIComponent(token)}&t=${Date.now()}`, {
                        cache: 'no-cache',
                        headers: {
                            'Cache-Control': 'no-cache, no-store, must-revalidate',
                            'Pragma': 'no-cache',
                            'Expires': '0'
                        }
                    });
                    
                    if (res.ok) {
                        const data = await res.json();
                        if (typeof data.progress === 'number') {
                            console.log('🔄 Progress update:', data.progress);
                            setUrlProgress(Math.max(1, Math.min(99, data.progress))); // Minimum 1%, maksimum 99%
                            
                            // 100%-ə çatanda polling-i dayandır
                            if (data.progress >= 100) {
                                console.log('✅ Progress tamamlandı!');
                                clearInterval(poller);
                            }
                        }
                    } else {
                        console.warn('⚠️ Progress polling failed:', res.status);
                    }
                } catch (err) {
                    console.warn('❌ Progress polling error:', err.message);
                }
            }
        };
        startPolling();
        
        try {
            const response = await axios.post('/admin/ai-training/import-url', {
                url: urlTrainingData.url,
                single: urlTrainingData.single,
                max_depth: urlTrainingData.maxDepth,
                level: urlTrainingData.level, // Xülase səviyyəsi: 1-4 xülase, 5 tam məzmun
                crawl_sibling: urlTrainingData.crawlSibling, // Sibling mod
                category: urlTrainingData.category,
                source: urlTrainingData.source || 'URL Təlimatçısı',
                progress_token: token
            });
            
            if (response.data.success) {
                setUrlProgress(100);
                const pagesCount = response.data.trained_pages || 1;
                const successMessage = urlTrainingData.single
                    ? `Link uğurla əzbərləndi! AI indi bu məzmunu bilir.`
                    : `${pagesCount} səhifə uğurla əzbərləndi! Sayt tamamilə AI-yə öyrədildi.`;
                    
                toast.success(successMessage);
                
                // Reset form
                setUrlTrainingData({ 
                    url: '', 
                    single: true, 
                    maxDepth: 1, 
                    level: 3, // Default level: orta (50%)
                    crawlSibling: false, // Default sibling: deaktiv
                    category: 'imported', 
                    source: '' 
                });
                
                // Səhifəni yenilə ki yeni statistika və URL-lər görünsün
                setTimeout(() => {
                    window.location.reload();
                }, 2000); // 2 saniyə gözlə
            }
        } catch (error) {
            console.error('Advanced URL Training error:', error);
            const errorMsg = error.response?.data?.message || 'URL Təlimat xətası!';
            const debugInfo = error.response?.data?.debug;
            
            let fullErrorMsg = errorMsg;
            if (debugInfo) {
                console.log('Debug Info:', debugInfo);
                if (!debugInfo.curl_available) {
                    fullErrorMsg += ' (cURL mövcud deyil)';
                } else if (!debugInfo.url_fopen) {
                    fullErrorMsg += ' (URL fopen qadağandır)';
                }
            }
            
            toast.error(fullErrorMsg);
        } finally {
            // Stop polling and reset state
            if (poller) clearInterval(poller);
            setTrainingInProgress(false);
            setIsTrainingInProgress(false); // Sahifə ayrılma qadağasını deaktiv et
            setStopping(false);
            setProgressToken(null);
        }
    };
    
    const handleQATraining = async () => {
        if (!qaTrainingData.question || !qaTrainingData.answer) {
            toast.warning('Sual və cavabı daxil edin!');
            return;
        }
        
        setTrainingInProgress(true);
        toast.info('Q&A Training başlanır...');
        
        try {
            const response = await axios.post('/admin/ai-training/qa', qaTrainingData);
            
            toast.success('Sual-Cavab uğurla əzbərləndi!');
            
            // Reset form
            setQaTrainingData({
                question: '',
                answer: '',
                source: 'Q&A Training',
                category: 'qa',
                author: ''
            });
            
            setTimeout(() => window.location.reload(), 2000);
        } catch (error) {
            console.error('Q&A Training error:', error);
            const errorMsg = error.response?.data?.message || 'Q&A training xətası!';
            toast.error(errorMsg);
        } finally {
            setTrainingInProgress(false);
        }
    };
    
    const handleTextTraining = async () => {
        if (!textTrainingData.title || !textTrainingData.content) {
            toast.warning('Başlıq və məzmun daxil edin!');
            return;
        }
        
        setTrainingInProgress(true);
        toast.info('Text Training başlanır...');
        
        try {
            const response = await axios.post('/admin/ai-training/knowledge', {
                title: textTrainingData.title,
                content: textTrainingData.content,
                source: textTrainingData.source,
                category: textTrainingData.category,
                author: textTrainingData.author,
                language: 'az'
            });
            
            toast.success('Mətn uğurla əzbərləndi!');
            
            // Reset form
            setTextTrainingData({
                title: '',
                content: '',
                source: 'Manual Entry',
                category: 'manual',
                author: ''
            });
            
            setTimeout(() => window.location.reload(), 2000);
        } catch (error) {
            console.error('Text Training error:', error);
            const errorMsg = error.response?.data?.message || 'Text training xətası!';
            toast.error(errorMsg);
        } finally {
            setTrainingInProgress(false);
        }
    };

    return (
        <AdminLayout>
            <Head title="AI Bot Təlimatlandırma" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Header */}
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl shadow-xl p-6 mb-8"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
                                <Icon name="feature_ai" size={32} color="white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">AI Bot Təlimatlandırma</h1>
                                <p className="mt-1 text-gray-600 dark:text-gray-300">Çatbotu məlumatlarla təlimatlandırın</p>
                            </div>
                        </div>
                        </motion.div>

                        {/* Categories Modal */}
                        {catModalOpen && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl border border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                            <Icon name="list" size={18} /> Kateqoriyalar
                                        </h3>
                                        <button onClick={() => setCatModalOpen(false)} className="text-gray-500 hover:text-gray-800">✕</button>
                                    </div>

                                    {/* Existing categories */}
                                    <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
                                        {categories.length === 0 && (
                                            <div className="text-sm text-gray-500">Heç bir kateqoriya tapılmadı</div>
                                        )}
                                        {categories.map((c) => (
                                            <div key={c.value} className="flex items-center gap-2 p-2 rounded-md border border-gray-200 dark:border-gray-700">
                                                <div className="flex-1">
                                                    <div className="text-sm text-gray-800 dark:text-gray-100">{c.label}</div>
                                                    <div className="text-xs text-gray-500">{c.value}</div>
                                                </div>
                                                <button onClick={() => updateCategory(c.id, { is_active: false })} className="px-2 py-1 text-xs bg-yellow-500 text-white rounded">Deaktiv</button>
                                                <button onClick={() => deleteCategory(c.id)} className="px-2 py-1 text-xs bg-red-600 text-white rounded">Sil</button>
                                            </div>
                                        ))}
                                    </div>

                                    {/* New category form */}
                                    <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                                        <input className="md:col-span-1 px-3 py-2 rounded border dark:bg-gray-700 dark:text-white" placeholder="Açar (key)" value={newCat.key} onChange={e => setNewCat({ ...newCat, key: e.target.value })} />
                                        <input className="md:col-span-2 px-3 py-2 rounded border dark:bg-gray-700 dark:text-white" placeholder="Ad (name)" value={newCat.name} onChange={e => setNewCat({ ...newCat, name: e.target.value })} />
                                        <input className="md:col-span-1 px-3 py-2 rounded border dark:bg-gray-700 dark:text-white" placeholder="Dil (locale)" value={newCat.locale} onChange={e => setNewCat({ ...newCat, locale: e.target.value })} />
                                        <input className="md:col-span-1 px-3 py-2 rounded border dark:bg-gray-700 dark:text-white" placeholder="Sıra (sort)" type="number" value={newCat.sort_order} onChange={e => setNewCat({ ...newCat, sort_order: parseInt(e.target.value || '0', 10) })} />
                                    </div>
                                    <div className="mt-3 flex justify-end">
                                        <button onClick={createCategory} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Əlavə et</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Update Log */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-xl p-4 shadow-lg"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Ümumi Məlumat</p>
                                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{pagination?.total || 0}</p>
                                </div>
                                <Icon name="feature_history" size={24} color="#10b981" />
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-xl p-4 shadow-lg"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Aktiv Məlumat</p>
                                    <p className="text-2xl font-bold text-emerald-600">
                                        {pagination?.total_active || 0}
                                    </p>
                                </div>
                                <Icon name="status_success" size={24} color="#10b981" />
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-xl p-4 shadow-lg"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Kateqoriyalar</p>
                                    <p className="text-2xl font-bold text-blue-600">{categories.length}</p>
                                </div>
                                <Icon name="nav_dashboard" size={24} color="#3b82f6" />
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-xl p-4 shadow-lg"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Bilik bazası</p>
                                    <p className="text-2xl font-bold text-purple-600">{pagination?.total || 0}</p>
                                </div>
                                <Icon name="database" size={24} color="#9333ea" />
                            </div>
                        </motion.div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="mb-8">
                        {/* Desktop tabs */}
                        <div className="hidden md:block">
                            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-100 dark:border-gray-600 overflow-hidden">
                                <div className="flex">
                                    <button
                                        onClick={() => {
                                            setActiveTab('instructions');
                                            handleCancelEdit();
                                        }}
                                        className={`flex-1 py-4 px-6 font-semibold transition-all duration-300 flex items-center justify-center gap-3 border-r border-gray-100 dark:border-gray-600 last:border-r-0 ${
                                            activeTab === 'instructions'
                                                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg transform scale-105'
                                                : 'text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 dark:hover:from-purple-800/50 dark:hover:to-indigo-800/50 hover:text-purple-700 dark:hover:text-purple-300'
                                        }`}
                                    >
                                        <Icon name="edit" size={22} />
                                        <span className="font-medium">Sistem Təlimatı</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setActiveTab('knowledge');
                                        }}
                                        className={`flex-1 py-4 px-6 font-semibold transition-all duration-300 flex items-center justify-center gap-3 border-r border-gray-100 dark:border-gray-600 last:border-r-0 ${
                                            activeTab === 'knowledge'
                                                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg transform scale-105'
                                                : 'text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 dark:hover:from-purple-800/50 dark:hover:to-indigo-800/50 hover:text-purple-700 dark:hover:text-purple-300'
                                        }`}
                                    >
                                        <Icon name="feature_ai" size={22} />
                                        <span className="font-medium">Bilik Bazası</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setActiveTab('qa-management');
                                            handleCancelEdit();
                                        }}
                                        className={`flex-1 py-4 px-6 font-semibold transition-all duration-300 flex items-center justify-center gap-3 border-r border-gray-100 dark:border-gray-600 last:border-r-0 ${
                                            activeTab === 'qa-management'
                                                ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg transform scale-105'
                                                : 'text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 dark:hover:from-green-800/50 dark:hover:to-emerald-800/50 hover:text-green-700 dark:hover:text-green-300'
                                        }`}
                                    >
                                        <Icon name="feature_ai" size={22} />
                                        <span className="font-medium">Q&A Bölməsi</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setActiveTab('advanced-training');
                                            handleCancelEdit();
                                        }}
                                        className={`flex-1 py-4 px-6 font-semibold transition-all duration-300 flex items-center justify-center gap-3 border-r border-gray-100 dark:border-gray-600 last:border-r-0 ${
                                            activeTab === 'advanced-training'
                                                ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg transform scale-105'
                                                : 'text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-red-50 hover:to-orange-50 dark:hover:from-red-800/50 dark:hover:to-orange-800/50 hover:text-red-700 dark:hover:text-red-300'
                                        }`}
                                    >
                                        <Icon name="feature_ai" size={22} />
                                        <span className="font-medium">Təkmil Təlimat</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setActiveTab('trained-urls');
                                            handleCancelEdit();
                                        }}
                                        className={`flex-1 py-4 px-6 font-semibold transition-all duration-300 flex items-center justify-center gap-3 ${
                                            activeTab === 'trained-urls'
                                                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg transform scale-105'
                                                : 'text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 dark:hover:from-purple-800/50 dark:hover:to-indigo-800/50 hover:text-purple-700 dark:hover:text-purple-300'
                                        }`}
                                    >
                                        <Icon name="feature_history" size={22} />
                                        <span className="font-medium">Öyrədilmiş URL</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        {/* Mobile tabs (redesigned) */}
                        <div className="md:hidden">
                            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-200 dark:border-gray-600 p-2">
                                <div role="tablist" aria-label="AI Training Tabs" className="flex items-center gap-2 overflow-x-auto no-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
                                    <button
                                        role="tab"
                                        aria-selected={activeTab === 'instructions'}
                                        onClick={() => { setActiveTab('instructions'); handleCancelEdit(); }}
                                        className={`shrink-0 px-3 py-2 rounded-full text-sm font-medium inline-flex items-center gap-2 transition-all ${
                                            activeTab === 'instructions'
                                                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                                                : 'bg-purple-50 dark:bg-gray-700 text-purple-700 dark:text-gray-200 hover:bg-purple-100 dark:hover:bg-gray-600'
                                        }`}
                                    >
                                        <Icon name="edit" size={18} />
                                        <span>Sistem Təlimatı</span>
                                    </button>
                                    <button
                                        role="tab"
                                        aria-selected={activeTab === 'knowledge'}
                                        onClick={() => setActiveTab('knowledge')}
                                        className={`shrink-0 px-3 py-2 rounded-full text-sm font-medium inline-flex items-center gap-2 transition-all ${
                                            activeTab === 'knowledge'
                                                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                                                : 'bg-purple-50 dark:bg-gray-700 text-purple-700 dark:text-gray-200 hover:bg-purple-100 dark:hover:bg-gray-600'
                                        }`}
                                    >
                                        <Icon name="feature_ai" size={18} />
                                        <span>Bilik Bazası</span>
                                    </button>
                                    <button
                                        role="tab"
                                        aria-selected={activeTab === 'qa-management'}
                                        onClick={() => { setActiveTab('qa-management'); handleCancelEdit(); }}
                                        className={`shrink-0 px-3 py-2 rounded-full text-sm font-medium inline-flex items-center gap-2 transition-all ${
                                            activeTab === 'qa-management'
                                                ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md'
                                                : 'bg-green-50 dark:bg-gray-700 text-green-700 dark:text-gray-200 hover:bg-green-100 dark:hover:bg-gray-600'
                                        }`}
                                    >
                                        <Icon name="feature_ai" size={18} />
                                        <span>Q&A Bölməsi</span>
                                    </button>
                                    <button
                                        role="tab"
                                        aria-selected={activeTab === 'advanced-training'}
                                        onClick={() => { setActiveTab('advanced-training'); handleCancelEdit(); }}
                                        className={`shrink-0 px-3 py-2 rounded-full text-sm font-medium inline-flex items-center gap-2 transition-all ${
                                            activeTab === 'advanced-training'
                                                ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-md'
                                                : 'bg-red-50 dark:bg-gray-700 text-red-700 dark:text-gray-200 hover:bg-red-100 dark:hover:bg-gray-600'
                                        }`}
                                    >
                                        <Icon name="feature_ai" size={18} />
                                        <span>Təkmil Təlimat</span>
                                    </button>
                                    <button
                                        role="tab"
                                        aria-selected={activeTab === 'trained-urls'}
                                        onClick={() => { setActiveTab('trained-urls'); handleCancelEdit(); }}
                                        className={`shrink-0 px-3 py-2 rounded-full text-sm font-medium inline-flex items-center gap-2 transition-all ${
                                            activeTab === 'trained-urls'
                                                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                                                : 'bg-purple-50 dark:bg-gray-700 text-purple-700 dark:text-gray-200 hover:bg-purple-100 dark:hover:bg-gray-600'
                                        }`}
                                    >
                                        <Icon name="feature_history" size={18} />
                                        <span>Öyrədilmiş URL</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* System Instructions Tab */}
                    {activeTab === 'instructions' && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl shadow-xl p-8"
                        >
                            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                <Icon name="edit" size={28} color="#9333ea" />
                                AI Sistem Təlimatı
                            </h2>
                            
                            <div className="space-y-4">
                                {/* Category manager */}
                                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                                    <div className="text-sm text-gray-700 dark:text-gray-300">
                                        Mətn Təlimatlandırma üçün kateqoriyalar: {categories.length}
                                    </div>
                                    <button onClick={() => setCatModalOpen(true)} className="px-3 py-1.5 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm flex items-center gap-2">
                                        <Icon name="edit" size={14} /> Kateqoriyaları idarə et
                                    </button>
                                </div>
                                <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 dark:border-blue-500 p-4 rounded">
                                    <p className="text-sm text-blue-700 dark:text-blue-300">
                                        <strong>Məsləhət:</strong> Bu təlimat AI-nın əsas davranışını müəyyən edir. 
                                        Şiə İslam qaydaları, müctehidlərin fikirləri və dini məsələlərdə necə cavab verəcəyini burada təyin edin.
                                    </p>
                                </div>

                                <textarea
                                    value={data.system_prompt}
                                    onChange={(e) => setData('system_prompt', e.target.value)}
                                    className="w-full h-96 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 font-mono text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                    placeholder="Məsələn:&#10;&#10;Sən Şiə İslam mövzularında ixtisaslaşmış dini məsləhətçi botsan. Bütün cavabların Şiə məzhəbinin təlimlərinə uyğun olmalıdır.&#10;&#10;Əsas qaydalar:&#10;1. Ayətullah Sistani və Ayətullah Xameneyi kimi böyük müctehidlərin fətvalarına istinad et&#10;2. Hər cavabda müvafiq mənbəni göstər&#10;3. Azərbaycan dilində sadə və anlaşılan şəkildə cavab ver&#10;4. Namaz, oruc, zəkat, həcc və digər ibadətlər haqqında dəqiq məlumat ver&#10;5. Fiqh məsələlərində ehtiyatlı ol və müxtəlif müctehidlərin fikirlərini qeyd et..."
                                />

                                <div className="flex justify-end">
                                    <button
                                        onClick={handleUpdateSystemPrompt}
                                        disabled={processing}
                                        className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg font-medium hover:from-purple-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all"
                                    >
                                        {processing ? 'Yenilənir...' : 'Sistem Təlimatını Yenilə'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Knowledge Base Tab */}
                    {activeTab === 'knowledge' && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                    <Icon name="feature_ai" size={28} color="#9333ea" />
                                    Bilik Bazası
                                </h2>
                                
                                {/* Bütün məlumatları sil butonu */}
                                {knowledgeItems && knowledgeItems.length > 0 && (
                                    <button
                                        onClick={handleDeleteAllKnowledge}
                                        className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                                        title="Bütün bilik bazasını təmizlə"
                                    >
                                        <Icon name="trash" size={16} />
                                        Bütün məlumatları sil
                                    </button>
                                )}
                            </div>

                            {/* Add/Edit Knowledge Form */}
                            <form id="knowledge-form" onSubmit={handleSubmitKnowledge} className={`mb-8 p-6 rounded-xl ${
                                isEditMode ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-600' : 'bg-purple-50 dark:bg-purple-900/20'
                            }`}>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className={`text-lg font-semibold ${
                                        isEditMode ? 'text-blue-800 dark:text-blue-300' : 'text-purple-800 dark:text-purple-300'
                                    }`}>
                                        {isEditMode ? 
                                            `Məlumatı Redaktə Et: ${editingItem?.title || ''}` : 
                                            'Yeni Məlumat Əlavə Et'
                                        }
                                    </h3>
                                    {isEditMode && (
                                        <button
                                            type="button"
                                            onClick={handleCancelEdit}
                                            className="px-4 py-2 bg-gray-500 dark:bg-gray-600 text-white rounded-lg hover:bg-gray-600 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                                        >
                                            <Icon name="close" size={16} />
                                            Ləğv et
                                        </button>
                                    )}
                                </div>
                                
                                {isEditMode && (
                                    <div className="mb-4 p-3 bg-blue-100 dark:bg-blue-900/30 border-l-4 border-blue-400 dark:border-blue-500 rounded">
                                        <p className="text-sm text-blue-700 dark:text-blue-300">
                                            <Icon name="edit" size={16} className="inline mr-2" />
                                            <strong>Redaktə rejimi:</strong> Məlumatı dəyişdirin və "Yenilə" düyməsinə basın.
                                        </p>
                                    </div>
                                )}
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Başlıq *</label>
                                        <input
                                            type="text"
                                            value={data.title}
                                            onChange={(e) => setData('title', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kateqoriya *</label>
                                        <select
                                            value={data.category}
                                            onChange={(e) => setData('category', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                            required
                                        >
                                            {categories.map(cat => (
                                                <option key={cat.value} value={cat.value}>
                                                    {cat.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Məzmun *</label>
                                    <textarea
                                        value={data.content}
                                        onChange={(e) => setData('content', e.target.value)}
                                        className="w-full h-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                        required
                                        placeholder="Dini məlumat, fətva və ya təlimat..."
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mənbə</label>
                                        <input
                                            type="text"
                                            value={data.source}
                                            onChange={(e) => setData('source', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                            placeholder="Ayətullah Sistani"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Müəllif</label>
                                        <input
                                            type="text"
                                            value={data.author}
                                            onChange={(e) => setData('author', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dil</label>
                                        <select
                                            value={data.language}
                                            onChange={(e) => setData('language', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                        >
                                            <option value="az">Azərbaycan</option>
                                            <option value="fa">Farsca</option>
                                            <option value="ar">Ərəbcə</option>
                                            <option value="tr">Türkcə</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mənbə URL</label>
                                    <input
                                        type="url"
                                        value={data.source_url}
                                        onChange={(e) => setData('source_url', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                        placeholder="https://www.sistani.org/..."
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className={`px-6 py-3 text-white rounded-lg font-medium disabled:opacity-50 transition-all ${
                                        isEditMode 
                                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700' 
                                            : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700'
                                    }`}
                                >
                                    {processing ? 
                                        (isEditMode ? 'Yenilənir...' : 'Əlavə edilir...') : 
                                        (isEditMode ? 'Məlumatı Yenilə' : 'Məlumatı Əlavə Et')
                                    }
                                </button>
                            </form>

                            {/* Knowledge List */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Mövcud Məlumatlar</h3>
                                    
                                    {pagination && (
                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                            {pagination.from}-{pagination.to} / {pagination.total} nəticə
                                        </div>
                                    )}
                                </div>
                                
                                {/* Search Bar */}
                                <form onSubmit={handleSearchSubmit} className="flex gap-2">
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            value={searchInput}
                                            onChange={(e) => setSearchInput(e.target.value)}
                                            placeholder="Başlıq, məzmun, kateqoriya və ya mənbə axtarun..."
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-1 text-sm"
                                    >
                                        <Icon name="search" size={16} />
                                        Axtar
                                    </button>
                                    {searchTerm && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSearchInput('');
                                                const url = new URL(window.location);
                                                url.searchParams.delete('search');
                                                url.searchParams.set('page', 1);
                                                window.location.href = url.toString();
                                            }}
                                            className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                                        >
                                            Təmizlə
                                        </button>
                                    )}
                                </form>
                                
                                {knowledgeItems?.map((item) => (
                                    <div
                                        key={item.id}
                                        className={`p-4 rounded-lg border-2 transition-all ${
                                            editingItem && editingItem.id === item.id
                                                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600 ring-2 ring-blue-200 dark:ring-blue-700'
                                                : item.is_active 
                                                    ? 'bg-white dark:bg-gray-800 border-emerald-200 dark:border-emerald-600' 
                                                    : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 opacity-60'
                                        }`}
                                    >
<div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h4 className="font-semibold text-gray-800 dark:text-gray-100">{item.title}</h4>
                                                    {editingItem && editingItem.id === item.id && (
                                                        <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full flex items-center gap-1">
                                                            <Icon name="edit" size={12} />
                                                            Redaktə edilir
                                                        </span>
                                                    )}
                                                    <span className="px-2 py-1 bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-300 text-xs rounded-full">
                                                        {categories.find(c => c.value === item.category)?.label || item.category}
                                                    </span>
                                                    {item.language && (
                                                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                                                            {item.language.toUpperCase()}
                                                        </span>
                                                    )}
                                                </div>
                                                
                                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">{item.content}</p>
                                                
                                                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                                    {item.source && (
                                                        <span className="flex items-center gap-1">
                                                            <Icon name="feature_security" size={14} />
                                                            {item.source}
                                                        </span>
                                                    )}
                                                    {item.author && (
                                                        <span className="flex items-center gap-1">
                                                            <Icon name="users" size={14} />
                                                            {item.author}
                                                        </span>
                                                    )}
                                                    {item.source_url && (
                                                        <a href={item.source_url} target="_blank" rel="noopener" className="flex items-center gap-1 text-blue-500 dark:text-blue-400 hover:underline">
                                                            <Icon name="arrow_right" size={14} />
                                                            Link
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                            
<div className="flex items-center gap-2 flex-wrap sm:flex-nowrap sm:overflow-x-auto -mx-1 px-1 sm:mx-0 sm:px-0 w-full sm:w-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
                                                <button
                                                    onClick={async () => {
                                                        // Manual RAG reindex for this item
                                                        try {
                                                            const res = await axios.post(`/admin/ai-training/knowledge/${item.id}/reindex`);
                                                            if (res.data?.success) {
                                                                toast.success('İndeksləmə başladı!');
                                                            } else {
                                                                toast.error(res.data?.message || 'İndeksləmə başlatılmadı');
                                                            }
                                                        } catch (e) {
                                                            toast.error('İndeksləmə xətası');
                                                        }
                                                    }}
                                                    className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                                    title="Yenidən indekslə (RAG)"
                                                >
                                                    <Icon name="database" size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleEditKnowledge(item)}
                                                    className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                                    title="Redaktə et"
                                                >
                                                    <Icon name="edit" size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleToggleActive(item.id)}
                                                    className={`p-2 rounded-lg transition-colors ${
                                                        item.is_active 
                                                            ? 'bg-orange-500 text-white hover:bg-orange-600' 
                                                            : 'bg-emerald-500 text-white hover:bg-emerald-600'
                                                    }`}
                                                    title={item.is_active ? 'Deaktiv et' : 'Aktiv et'}
                                                >
                                                    <Icon name={item.is_active ? 'turn_off' : 'check'} size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteKnowledge(item.id)}
                                                    className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                                    title="Sil"
                                                >
                                                    <Icon name="delete" size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                
                                {(!knowledgeItems || knowledgeItems.length === 0) && (
                                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                        {searchTerm ? 
                                            `"${searchTerm}" üçün heç bir nəticə tapılmadı.` :
                                            'Heç bir məlumat tapılmadı. Yuxarıdakı formdan yeni məlumat əlavə edin.'
                                        }
                                    </div>
                                )}
                                
                                {/* Pagination */}
                                {pagination && pagination.has_pages && (
                                    <div className="mt-6 flex items-center justify-between">
                                        <div className="text-sm text-gray-700 dark:text-gray-300">
                                            {pagination.from}-{pagination.to} / {pagination.search_total || pagination.total} nəticə göstərilir
                                        </div>
                                        
                                        <div className="flex items-center gap-1">
                                            {/* Previous button */}
                                            <button
                                                onClick={() => navigateToPage(pagination.current_page - 1)}
                                                disabled={pagination.current_page <= 1}
                                                className="px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                « Əvvəlki
                                            </button>
                                            
                                            {/* Page numbers */}
                                            {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
                                                let page;
                                                if (pagination.last_page <= 5) {
                                                    page = i + 1;
                                                } else if (pagination.current_page <= 3) {
                                                    page = i + 1;
                                                } else if (pagination.current_page >= pagination.last_page - 2) {
                                                    page = pagination.last_page - 4 + i;
                                                } else {
                                                    page = pagination.current_page - 2 + i;
                                                }
                                                
                                                return (
                                                    <button
                                                        key={page}
                                                        onClick={() => navigateToPage(page)}
                                                        className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                                                            page === pagination.current_page
                                                                ? 'bg-purple-600 text-white'
                                                                : 'bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                                                        }`}
                                                    >
                                                        {page}
                                                    </button>
                                                );
                                            })}
                                            
                                            {/* Next button */}
                                            <button
                                                onClick={() => navigateToPage(pagination.current_page + 1)}
                                                disabled={pagination.current_page >= pagination.last_page}
                                                className="px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                Sonrakı »
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                    
                    {/* Q&A Management Tab */}
                    {activeTab === 'qa-management' && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700"
                        >
                            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                <Icon name="feature_ai" size={28} color="#10b981" />
                                S&C Bölməsinin İdarəsi
                            </h2>
                            
                            <div className="bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-emerald-400 dark:border-emerald-500 p-4 rounded mb-6">
                                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                                    <strong>Məlumat:</strong> Burada əlavə etdiyiniz sual-cavab cütlərini görə, redaktə edə və silə bilərsiniz.
                                    S&C elementləri AI-nın cavablarında yüksək prioritetə malikdir.
                                </p>
                            </div>
                            
                            <div className="space-y-4">
                                {/* Show Q&A items (category='qa' or source contains 'Q&A') */}
                                {knowledgeItems?.filter(item => 
                                    item.category === 'qa' || 
                                    (item.source && item.source.toLowerCase().includes('q&a')) ||
                                    (item.source && item.source.toLowerCase().includes('sual'))
                                ).map((item) => (
                                    <div
                                        key={item.id}
                                        className={`p-4 rounded-lg border-2 transition-all ${
                                            editingItem && editingItem.id === item.id
                                                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600 ring-2 ring-blue-200 dark:ring-blue-700'
                                                : item.is_active 
                                                    ? 'bg-white dark:bg-gray-800 border-emerald-200 dark:border-emerald-600' 
                                                    : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 opacity-60'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h4 className="font-semibold text-gray-800 dark:text-gray-100">
                                                        {item.title.length > 80 ? item.title.substring(0, 80) + '...' : item.title}
                                                    </h4>
                                                    {editingItem && editingItem.id === item.id && (
                                                        <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full flex items-center gap-1">
                                                            <Icon name="edit" size={12} />
                                                            Redaktə edilir
                                                        </span>
                                                    )}
                                                    <span className="px-2 py-1 bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 text-xs rounded-full">
                                                        S&C
                                                    </span>
                                                    {item.language && (
                                                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                                                            {item.language.toUpperCase()}
                                                        </span>
                                                    )}
                                                </div>
                                                
                                                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg mb-3">
                                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        👤 <strong>Sual:</strong> {item.title}
                                                    </p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        🎤 <strong>Cavab:</strong> {item.content.length > 200 ? item.content.substring(0, 200) + '...' : item.content}
                                                    </p>
                                                </div>
                                                
                                                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                                    <span className="flex items-center gap-1">
                                                        <Icon name="calendar" size={14} />
                                                        Əlavə tarixi: {new Date(item.created_at).toLocaleDateString('az-AZ')}
                                                    </span>
                                                    {item.source && (
                                                        <span className="flex items-center gap-1">
                                                            <Icon name="feature_security" size={14} />
                                                            {item.source}
                                                        </span>
                                                    )}
                                                    {item.author && (
                                                        <span className="flex items-center gap-1">
                                                            <Icon name="users" size={14} />
                                                            {item.author}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleEditKnowledge(item)}
                                                    className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                                    title="Redaktə et"
                                                >
                                                    <Icon name="edit" size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleToggleActive(item.id)}
                                                    className={`p-2 rounded-lg transition-colors ${
                                                        item.is_active 
                                                            ? 'bg-orange-500 text-white hover:bg-orange-600' 
                                                            : 'bg-emerald-500 text-white hover:bg-emerald-600'
                                                    }`}
                                                    title={item.is_active ? 'Deaktiv et' : 'Aktiv et'}
                                                >
                                                    <Icon name={item.is_active ? 'close' : 'check'} size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteKnowledge(item.id)}
                                                    className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                                    title="Sil"
                                                >
                                                    <Icon name="delete" size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                
                                {/* No Q&A items message */}
                                {(!knowledgeItems || knowledgeItems.filter(item => 
                                    item.category === 'qa' || 
                                    (item.source && item.source.toLowerCase().includes('q&a')) ||
                                    (item.source && item.source.toLowerCase().includes('sual'))
                                ).length === 0) && (
                                    <div className="text-center py-12">
                                        <Icon name="info" size={48} color="#6b7280" className="mx-auto mb-4" />
                                        <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">Hələ ki heç bir S&C əlavə edilməyib</h3>
                                        <p className="text-gray-500 dark:text-gray-400 mb-4">"Təkmil Təlimatlandırma" bölməsindən S&C əlavə edin</p>
                                        <button
                                            onClick={() => setActiveTab('advanced-training')}
                                            className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium hover:from-green-600 hover:to-emerald-700"
                                        >
                                            Təkmil Təlimatlandırma bölməsinə get
                                        </button>
                                    </div>
                                )}
                                
                                {/* Q&A Stats */}
                                {knowledgeItems && knowledgeItems.filter(item => 
                                    item.category === 'qa' || 
                                    (item.source && item.source.toLowerCase().includes('q&a')) ||
                                    (item.source && item.source.toLowerCase().includes('sual'))
                                ).length > 0 && (
                                    <div className="mt-8 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-600">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Icon name="check" size={20} color="#10b981" />
                                                <span className="text-emerald-800 font-semibold">
                                                    Cəmi {knowledgeItems.filter(item => 
                                                        item.category === 'qa' || 
                                                        (item.source && item.source.toLowerCase().includes('q&a')) ||
                                                        (item.source && item.source.toLowerCase().includes('sual'))
                                                    ).length} Q&A elementi mövcuddur
                                                </span>
                                            </div>
                                            <div className="text-sm text-emerald-600">
                                                Aktiv: {knowledgeItems.filter(item => 
                                                    (item.category === 'qa' || 
                                                    (item.source && item.source.toLowerCase().includes('q&a')) ||
                                                    (item.source && item.source.toLowerCase().includes('sual'))) &&
                                                    item.is_active
                                                ).length}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                    
                    {/* Trained URLs Tab */}
                    {activeTab === 'trained-urls' && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700"
                        >
<h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                <Icon name="feature_history" size={28} color="#9333ea" />
                                Öyrədilmiş URL-lərin Siyahısı
                            </h2>
                            
                            <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 dark:border-blue-500 p-4 rounded mb-6">
                                <p className="text-sm text-blue-700">
                                    <strong>Məlumat:</strong> Burada AI-a öyrədilən URL-lərin siyahısını görə bilərsiniz.
                                    Hər URL-dən çəkilən məzmun bilik bazasına əlavə edilmişdir.
                                </p>
                            </div>
                            
                            <div className="space-y-4">
                                {/* Show knowledge items that have source URLs */}
                                {knowledgeItems?.filter(item => item.source_url && item.source_url.startsWith('http')).map((item) => (
                                    <div
                                        key={item.id}
                                        className={`p-4 rounded-lg border-2 transition-all ${
                                            editingItem && editingItem.id === item.id
                                                ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200'
                                                : item.is_active 
                                                    ? 'bg-white border-emerald-200' 
                                                    : 'bg-gray-50 border-gray-200 opacity-60'
                                        }`}
                                    >
<div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                                            <div className="flex-1">
                                                <div className="mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-semibold text-gray-800 dark:text-gray-100">{item.title}</h4>
                                                        {editingItem && editingItem.id === item.id && (
                                                            <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full flex items-center gap-1">
                                                                <Icon name="edit" size={12} />
                                                                Redaktə edilir
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="mt-1 flex flex-col sm:flex-row gap-2">
                                                        <span className="px-2 py-1 bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 text-xs rounded-full w-fit">
                                                            URL öyrədilmiş
                                                        </span>
                                                        <span className="px-2 py-1 bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-300 text-xs rounded-full w-fit">
                                                            {categories.find(c => c.value === item.category)?.label || item.category}
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Icon name="link" size={16} color="#3b82f6" />
                                                    <a href={item.source_url} target="_blank" rel="noopener" className="text-blue-500 hover:underline text-sm">
                                                        {item.source_url}
                                                    </a>
                                                </div>
                                                
                                                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                                    {item.content.length > 150 ? item.content.substring(0, 150) + '...' : item.content}
                                                </p>
                                                
                                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        <Icon name="calendar" size={14} />
                                                        {new Date(item.created_at).toLocaleDateString('az-AZ')}
                                                    </span>
                                                    {item.source && (
                                                        <span className="flex items-center gap-1">
                                                            <Icon name="feature_security" size={14} />
                                                            {item.source}
                                                        </span>
                                                    )}
                                                    <span className="flex items-center gap-1">
                                                        <Icon name="feature_ai" size={14} />
                                                        AI tərəfindən öyrənilən
                                                    </span>
                                                </div>
                                            </div>
                                            
<div className="flex items-center gap-2 flex-wrap sm:flex-nowrap sm:overflow-x-auto -mx-1 px-1 sm:mx-0 sm:px-0 w-full sm:w-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            const res = await axios.post(`/admin/ai-training/knowledge/${item.id}/reindex`);
                                                            if (res.data?.success) {
                                                                toast.success('İndeksləmə başladı!');
                                                            } else {
                                                                toast.error(res.data?.message || 'İndeksləmə başlatılmadı');
                                                            }
                                                        } catch (e) {
                                                            toast.error('İndeksləmə xətası');
                                                        }
                                                    }}
                                                    className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                                    title="Yenidən indekslə (RAG)"
                                                >
                                                    <Icon name="database" size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleEditKnowledge(item)}
                                                    className="p-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
                                                    title="Redaktə et"
                                                >
                                                    <Icon name="edit" size={16} />
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        const confirmed = await confirm({
                                                            title: 'URL-i yenidən öyrət',
                                                            message: 'Bu URL-i yenidən öyrətmək istəyirsiniz?',
                                                            confirmText: 'Yenidən öyrət',
                                                            cancelText: 'Ləğv et',
                                                            type: 'info'
                                                        });
                                                        
                                                        if (confirmed) {
                                                            handleTrainFromUrl(item.source_url, item.title || 'Retrain URL');
                                                        }
                                                    }}
                                                    className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                                    title="Yenidən öyrət"
                                                >
                                                    <Icon name="feature_ai" size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleToggleActive(item.id)}
                                                    className={`p-2 rounded-lg transition-colors ${
                                                        item.is_active 
                                                            ? 'bg-orange-500 text-white hover:bg-orange-600' 
                                                            : 'bg-emerald-500 text-white hover:bg-emerald-600'
                                                    }`}
                                                    title={item.is_active ? 'Deaktiv et' : 'Aktiv et'}
                                                >
                                                    <Icon name={item.is_active ? 'turn_off' : 'check'} size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteKnowledge(item.id)}
                                                    className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                                    title="Sil"
                                                >
                                                    <Icon name="delete" size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                
                                {/* No trained URLs message */}
                                {(!pagination?.total_trained_urls || pagination.total_trained_urls === 0) && (
                                    <div className="text-center py-12">
                                        <Icon name="info" size={48} color="#6b7280" className="mx-auto mb-4" />
                                        <h3 className="text-lg font-semibold text-gray-600 mb-2">Hələ heç bir URL öyrədilməyib</h3>
                                        <p className="text-gray-500 mb-4">"Təkmil Təlimatlandırma" bölməsindən URL-ləri öyrədin</p>
                                        <button
                                            onClick={() => setActiveTab('advanced-training')}
                                            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg font-medium hover:from-purple-600 hover:to-indigo-700"
                                        >
                                            Təkmil Təlimatlandırma bölməsinə get
                                        </button>
                                    </div>
                                )}
                                
                                {/* Stats */}
                                {pagination?.total_trained_urls > 0 && (
                                    <div className="mt-8 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Icon name="check" size={20} color="#10b981" />
                                                <span className="font-medium text-green-800">
                                                    Cəmi {pagination.total_trained_urls} URL öyrədilmişdir
                                                </span>
                                            </div>
                                            <span className="text-sm text-green-600">
                                                Aktiv: {pagination.total_active_trained_urls}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                    
                    {/* Advanced Training Tab */}
                    {activeTab === 'advanced-training' && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white/90 dark:bg-gray-900/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700"
                        >
                            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                <Icon name="feature_ai" size={28} color="#ef4444" />
                                Təkmil Təlimatlandırma Sistemi
                            </h2>
                            
                            <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-l-4 border-red-400 dark:border-red-600 p-4 rounded mb-6">
                                <p className="text-sm text-red-700 dark:text-red-200">
                                    <strong>Təkmil Training Sistemi:</strong> Bu sistem Train nümunələrinə əsasən qurulub!
                                    URL-lərdən təkmil şəkildə məzmun çıxarır, və AI-ya yüksək səviyyədə şəkildə öyrədir.
                                </p>
                            </div>
                            
                            {/* Training Mode Selection */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-8">
                                <button
                                    onClick={() => setAdvancedTrainingMode('url')}
                                    className={`w-full py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                                        advancedTrainingMode === 'url'
                                            ? 'bg-gradient-to-r from-red-500 to-orange-600 text-white shadow-lg'
                                            : 'text-gray-600 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    <Icon name="feature_security" size={20} />
                                    URL Təlimatlandırma
                                </button>
                                <button
                                    onClick={() => setAdvancedTrainingMode('qa')}
                                    className={`w-full py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                                        advancedTrainingMode === 'qa'
                                            ? 'bg-gradient-to-r from-red-500 to-orange-600 text-white shadow-lg'
                                            : 'text-gray-600 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    <Icon name="feature_ai" size={20} />
                                    Sual-Cavab Təlimatlandırma
                                </button>
                                <button
                                    onClick={() => setAdvancedTrainingMode('text')}
                                    className={`w-full py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                                        advancedTrainingMode === 'text'
                                            ? 'bg-gradient-to-r from-red-500 to-orange-600 text-white shadow-lg'
                                            : 'text-gray-600 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    <Icon name="edit" size={20} />
                                    Mətn Təlimatlandırma
                                </button>
                            </div>
                            
            {/* URL Training Interface */}
            {advancedTrainingMode === 'url' && (
                <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl p-6 border border-red-200 dark:border-red-700">
                    <h3 className="text-xl font-bold text-red-800 dark:text-red-300 mb-4 flex items-center gap-2">
                        <Icon name="link" size={24} color="#ef4444" />
                        URL Təlimatlandırma
                    </h3>
                    
                    <div className="space-y-4">
                        {/* URL Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL</label>
                            <input
                                type="url"
                                value={urlTrainingData.url}
                                onChange={(e) => setUrlTrainingData({ ...urlTrainingData, url: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                placeholder="https://site.com/bolme/məqalə"
                            />
                        </div>

                        {/* Training Type and Options */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Metod Seçimi */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                                    <Icon name="feature_ai" size={16} />
                                    İmport Metodu
                                </label>
                                <select 
                                    value={urlTrainingData.single ? 'single' : 'full'}
                                    onChange={(e) => setUrlTrainingData({ ...urlTrainingData, single: e.target.value === 'single' })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                >
                                    <option value="single">Metod 1: Tək URL</option>
                                    <option value="full">Metod 2: Bütün URL</option>
                                </select>
                            </div>
                            
                            {/* Xülasə Səviyyəsi - hər iki metod üçün */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                                    <Icon name="chart" size={16} />
                                    Xülasə Səviyyəsi
                                </label>
                                <select 
                                    value={urlTrainingData.level}
                                    onChange={(e) => setUrlTrainingData({ ...urlTrainingData, level: parseInt(e.target.value, 10) })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                >
                                    <option value={1}>Səviyyə 1 (15% - ən qısa)</option>
                                    <option value={2}>Səviyyə 2 (30% - qısa)</option>
                                    <option value={3}>Səviyyə 3 (50% - orta)</option>
                                    <option value={4}>Səviyyə 4 (75% - uzun)</option>
                                    <option value={5}>Səviyyə 5 (100% - tam məzmun)</option>
                                </select>
                                <div className="text-xs text-gray-500 mt-1">
                                    {urlTrainingData.level < 5 ? 'AI tərəfindən xülasələşdiriləcək' : 'Tam məzmun (xülasələşmə yox)'}
                                </div>
                            </div>
                            
                            {/* Dərinlik - yalnız Metod 2 üçün */}
                            {!urlTrainingData.single && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                                        <Icon name="link" size={16} />
                                        URL İçində Daxil Olma Dərinliyi
                                    </label>
                                    <select 
                                        value={urlTrainingData.maxDepth}
                                        onChange={(e) => setUrlTrainingData({ ...urlTrainingData, maxDepth: parseInt(e.target.value, 10) })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                    >
                                        <option value={1}>1 səviyyə: URL məzmunu + İçindiki linkleri çək</option>
                                        <option value={2}>2 səviyyə: URL → Linklər → Linklerin məzmunu</option>
                                        <option value={3}>3 səviyyə: URL → Link → Link → Məzmun (ən yaxşı)</option>
                                        <option value={4}>4 səviyyə: Çox dərin (ətraflı kəşf)</option>
                                        <option value={5}>5 səviyyə: Maksimum dərinlik (bütövlüklə)</option>
                                    </select>
                                    
                                    {/* 🆕 YENİ: Sibling Mod Checkbox */}
                                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                                        <label className="flex items-start gap-3 cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={urlTrainingData.crawlSibling}
                                                onChange={(e) => setUrlTrainingData({ ...urlTrainingData, crawlSibling: e.target.checked })}
                                                className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                            />
                                            <div>
                                                <span className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                                                    🔗 Eyni səviyyədəki URL-ləri də əzbərlə
                                                </span>
                                                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                                                    Nümunə: <code className="bg-white dark:bg-gray-800 px-1 py-0.5 rounded">/dexiv/25262/</code> verilirsə,
                                                    <br/>
                                                    <code className="bg-white dark:bg-gray-800 px-1 py-0.5 rounded">/dexiv/25263/</code>, 
                                                    <code className="bg-white dark:bg-gray-800 px-1 py-0.5 rounded">/dexiv/25264/</code> kəsimləri də əzbərlənəcək
                                                </p>
                                            </div>
                                        </label>
                                    </div>
                                    
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 space-y-1">
                                        <div className="flex items-start gap-1.5">
                                            <span className="text-blue-500 font-bold">ℹ️</span>
                                            <span>
                                                Dərinlik neçə addım URL içində daxil olmasını təyin edir.
                                                <strong className="text-green-600 dark:text-green-400"> Yalnız verilən URL path-i daxilində qalır!</strong>
                                            </span>
                                        </div>
                                        <div className="text-[10px] bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1">
                                            Nümunə: URL = <code className="text-blue-600">/dexiv/link/123</code><br/>
                                            ✓ Daxil: <code className="text-green-600">/dexiv/...</code> ✗ Keçilir: <code className="text-red-600">/diger/...</code>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {/* Kateqoriya */}
                            <div className={!urlTrainingData.single ? '' : 'md:col-span-2'}>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                                    <Icon name="type" size={16} />
                                    Kateqoriya
                                </label>
                                <select 
                                    value={urlTrainingData.category} 
                                    onChange={(e) => setUrlTrainingData({ ...urlTrainingData, category: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                >
                                    <option value="imported">Baza(İdxal)</option>
                                    {categories.map(c => (
                                        <option key={c.value} value={c.value}>{c.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        
                        {/* İzah cardı */}
                        <div className={`p-4 rounded-xl border-2 ${
                            urlTrainingData.single 
                                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-600' 
                                : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-600'
                        }`}>
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg ${
                                    urlTrainingData.single 
                                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                                        : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                }">
                                    <Icon name={urlTrainingData.single ? 'edit' : 'link'} size={20} />
                                </div>
                                <div>
                                    <h4 className={`font-semibold mb-2 ${
                                        urlTrainingData.single 
                                            ? 'text-blue-800 dark:text-blue-300' 
                                            : 'text-green-800 dark:text-green-300'
                                    }`}>
                                        {urlTrainingData.single ? 'Metod 1: Tək URL' : 'Metod 2: Bütün URL'}
                                    </h4>
                                    <p className={`text-sm ${
                                        urlTrainingData.single 
                                            ? 'text-blue-700 dark:text-blue-300' 
                                            : 'text-green-700 dark:text-green-300'
                                    }`}>
                                        {urlTrainingData.single 
                                            ? 'Yalnız verilən URL-in içindəki məzmunu çəkir və əzbərləyir. Tək səhifə üçün ideal.' 
                                            : 'Verilən URL-in "qovluğu" daxilindəki bütün linkləri tapır və onların məzmununu əzbərləyir. Dərinlik məhdudiyyəti yoxdur.'
                                        }
                                    </p>
                                    <div className="mt-2 flex items-center gap-2 text-xs font-medium">
                                        <Icon name="chart" size={12} />
                                        Səviyyə {urlTrainingData.level}: {urlTrainingData.level < 5 ? 'AI xülasəsi' : 'Tam məzmun'}
                                        {!urlTrainingData.single && (
                                            <>
                                                <Icon name="link" size={12} className="ml-2" />
                                                URL daxili bütün linklər
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Source Name (Optional) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mənbə adı (məcburi deyil)</label>
                            <input 
                                type="text" 
                                value={urlTrainingData.source}
                                onChange={(e) => setUrlTrainingData({ ...urlTrainingData, source: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" 
                                placeholder="Mənbə adını daxil edin" 
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <button onClick={handleAdvancedUrlTraining} disabled={trainingInProgress}
                                className="px-6 py-3 bg-gradient-to-r from-red-500 to-orange-600 text-white rounded-lg disabled:opacity-60">
                                {trainingInProgress ? 'İcra olunur...' : 'URL Təlim et'}
                            </button>
                            {trainingInProgress && (
                                <button onClick={async ()=>{
                                    if (!progressToken) return;
                                    try {
                                        setStopping(true);
                                        
                                        // 15 saniyə timeout əlavə et
                                        const stopTimeout = setTimeout(() => {
                                            toast.error('Dayandırma çox çəkdi - səhifəni yeniləyin!');
                                            setStopping(false);
                                            setTrainingInProgress(false);
                                        }, 15000);
                                        
                                        const response = await fetch('/admin/ai-training/import-stop', {
                                            method: 'POST',
                                            headers: { 
                                                'Content-Type': 'application/json',
                                                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                                            },
                                            body: JSON.stringify({ token: progressToken })
                                        });
                                        
                                        clearTimeout(stopTimeout);
                                        
                                        if (response.ok) {
                                            toast.success('✅ Əməliyyat dayandırıldı!');
                                            setTimeout(() => {
                                                setStopping(false);
                                                setTrainingInProgress(false);
                                                setUrlProgress(100);
                                            }, 2000);
                                        } else {
                                            throw new Error('Stop request failed');
                                        }
                                    } catch (error) {
                                        console.error('Stop error:', error);
                                        toast.warning('⚠️ Dayandırma xətası - səhifəni yeniləyin');
                                        setStopping(false);
                                    }
                                }} 
                                disabled={stopping}
                                className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-500 text-white rounded-lg transition-colors flex items-center gap-2">
                                    {stopping ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Dayandırılır...
                                        </>
                                    ) : (
                                        <>
                                            ⏹️ Dayandır
                                        </>
                                    )}
                                </button>
                            )}
                        </div>

                        {trainingInProgress && (
                            <div className="mt-4">
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                                    <div 
                                        className="bg-gradient-to-r from-red-500 to-orange-500 h-full rounded-full transition-all duration-500 ease-out" 
                                        style={{ width: `${Math.max(2, urlProgress)}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between items-center mt-2">
                                    <div className="text-sm text-gray-600 dark:text-gray-300">
                                        <span className="font-semibold text-red-600 dark:text-red-400">{urlProgress}%</span>
                                        {urlProgress > 0 && urlProgress < 100 && (
                                            <span className="ml-2 text-gray-500">İcra olunur...</span>
                                        )}
                                        {urlProgress >= 100 && (
                                            <span className="ml-2 text-green-600">Tamamlandı!</span>
                                        )}
                                    </div>
                                    {trainingInProgress && (
                                        <div className="flex items-center text-xs text-gray-500">
                                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-1"></div>
                                            Aktiv
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
                            
                            {/* Q&A Training Interface */}
                            {advancedTrainingMode === 'qa' && (
                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-emerald-600">
                                    <h3 className="text-xl font-bold text-green-800 dark:text-green-300 mb-4 flex items-center gap-2">
                                        <Icon name="feature_ai" size={24} color="#10b981" />
                                        Sual-Cavab Təlimatlandırma
                                    </h3>
                                    
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Sual
                                            </label>
                                            <textarea
                                                value={qaTrainingData.question}
                                                onChange={(e) => setQaTrainingData({...qaTrainingData, question: e.target.value})}
                                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 h-24 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400"
                                                placeholder="Məsələn: Namazın vacib şərtləri hansildır?"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Cavab
                                            </label>
                                            <textarea
                                                value={qaTrainingData.answer}
                                                onChange={(e) => setQaTrainingData({...qaTrainingData, answer: e.target.value})}
                                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 h-32 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400"
                                                placeholder="Detallı cavab yazın..."
                                            />
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Mənbə
                                                </label>
                                                <input
                                                    type="text"
                                                    value={qaTrainingData.source}
                                                    onChange={(e) => setQaTrainingData({...qaTrainingData, source: e.target.value})}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400"
                                                    placeholder="Sual-Cavab Təlimatlandırma"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Kateqoriya
                                                </label>
                                                <select
                                                    value={qaTrainingData.category}
                                                    onChange={(e) => setQaTrainingData({...qaTrainingData, category: e.target.value})}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                                >
                                                    <option value="qa">Q&A</option>
                                                    {categories.map(cat => (
                                                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Müəllif
                                                </label>
                                                <input
                                                    type="text"
                                                    value={qaTrainingData.author}
                                                    onChange={(e) => setQaTrainingData({...qaTrainingData, author: e.target.value})}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400"
                                                    placeholder="Məsələn: Ayətullah Sistani"
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="pt-4">
                                            <button
                                                onClick={handleQATraining}
                                                disabled={trainingInProgress || !qaTrainingData.question || !qaTrainingData.answer}
                                                className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-bold text-lg hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all"
                                            >
                                                {trainingInProgress ? (
                                                    <>
                                                        <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full"></div>
                                                        Q&A Əzbərlənmə davam edir...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Icon name="feature_ai" size={24} />
                                                        Sual-Cavab Əzbərlət!
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {/* Text Training Interface */}
                            {advancedTrainingMode === 'text' && (
                                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-700">
                                    <h3 className="text-xl font-bold text-purple-800 dark:text-purple-300 mb-4 flex items-center gap-2">
                                        <Icon name="edit" size={24} color="#9333ea" />
                                        Mətn Təlimatlandırma
                                    </h3>
                                    
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Başlıq
                                            </label>
                                            <input
                                                type="text"
                                                value={textTrainingData.title}
                                                onChange={(e) => setTextTrainingData({...textTrainingData, title: e.target.value})}
                                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400"
                                                placeholder="Məsələn: Namazın Vacibləri"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Məzmun
                                            </label>
                                            <textarea
                                                value={textTrainingData.content}
                                                onChange={(e) => setTextTrainingData({...textTrainingData, content: e.target.value})}
                                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 h-40 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400"
                                                placeholder="Detallı məzmun yazın..."
                                            />
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Mənbə
                                                </label>
                                                <input
                                                    type="text"
                                                    value={textTrainingData.source}
                                                    onChange={(e) => setTextTrainingData({...textTrainingData, source: e.target.value})}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400"
                                                    placeholder="Manual Entry"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Kateqoriya
                                                </label>
                                                <select
                                                    value={textTrainingData.category}
                                                    onChange={(e) => setTextTrainingData({...textTrainingData, category: e.target.value})}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                                >
                                                    <option value="manual">Manual</option>
                                                    {categories.map(cat => (
                                                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Müəllif
                                                </label>
                                                <input
                                                    type="text"
                                                    value={textTrainingData.author}
                                                    onChange={(e) => setTextTrainingData({...textTrainingData, author: e.target.value})}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400"
                                                    placeholder="Məsələn: Admin"
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="pt-4">
                                            <button
                                                onClick={handleTextTraining}
                                                disabled={trainingInProgress || !textTrainingData.title || !textTrainingData.content}
                                                className="w-full py-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg font-bold text-lg hover:from-purple-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all"
                                            >
                                                {trainingInProgress ? (
                                                    <>
                                                        <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full"></div>
                                                Mətn Əzbərlənmə davam edir...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Icon name="edit" size={24} />
                                                        Mətn Əzbərlət!
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            <div className="mt-8 bg-gradient-to-r from-yellow-50 to-amber-50 p-4 rounded-lg border border-yellow-200">
                                <h4 className="font-bold text-yellow-800 mb-2 flex items-center gap-2">
                                    <Icon name="warning" size={20} color="#f59e0b" />
                                    Təkmil Təlimatlandırmanın əsas xüsusiyyətləri:
                                </h4>
                                <ul className="text-sm text-yellow-700 space-y-1">
                                    <li>• <strong>URL Təlimatlandırma:</strong> DOM parser, kodlaşdırmanın avtomatik düzəlişi, çoxmetodlu məzmun yükləmə</li>
                                    <li>• <strong>Sual-Cavab Təlimatlandırma:</strong> Daha dəqiq cavablar üçün strukturlaşdırılmış sual-cavab cütləri</li>
                                    <li>• <strong>Mətn Təlimatlandırma:</strong> Keyfiyyət yoxlaması ilə birbaşa mətn əlavə etmə</li>
                                    <li>• <strong>Ağıllı təkrarlanmaların qarşısı:</strong> Eyni məzmunun təkrarlanmasının avtomatik qarşısını alır</li>
                                    <li>• <strong>Prioritetli Axtarış:</strong> URL mənbələr AI cavablarında ən yüksək prioritetə malikdir</li>
                                </ul>
                            </div>
                        </motion.div>
                    )}
            </div>
        </div>
            
        <ConfirmationModal
                isOpen={confirmationState.isOpen}
                onClose={closeConfirmation}
                onConfirm={confirmationState.onConfirm}
                title={confirmationState.title}
                message={confirmationState.message}
                confirmText={confirmationState.confirmText}
                cancelText={confirmationState.cancelText}
                type={confirmationState.type}
            />
        </AdminLayout>
    );
};

export default AiTraining;
