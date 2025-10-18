import { useState, useEffect, useRef } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import Icon from '@/Components/Icon';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { useToast } from '@/Components/ToastProvider';
import { useTheme } from '@/Components/ThemeProvider';
import Footer from '@/Components/Footer';
import DonationDisplay from '@/Components/DonationDisplay';
import GuestTermsModal from '@/Components/GuestTermsModal';
import DeleteChatModal from '@/Components/DeleteChatModal';
import TypingDots from '@/Components/TypingDots';
import UserBackgroundModal from '@/Components/UserBackgroundModal';
import FeedbackModal from '@/Components/FeedbackModal';
import { loadUserBackground } from '@/Utils/BackgroundLoader';
import { createPortal } from 'react-dom';

// Simple Typewriter Effect Component
const TypewriterText = ({ text, speed = 50, onComplete }) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setDisplayText('');
    setCurrentIndex(0);
  }, [text]);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);
      return () => clearTimeout(timer);
    } else if (currentIndex === text.length && currentIndex > 0 && onComplete) {
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete]);

  return <span>{displayText}</span>;
};

// Markdown Renderer Component
const MarkdownRenderer = ({ content }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeSanitize]}
      components={{
        h1: ({node, ...props}) => <h1 className="text-2xl font-bold mb-1 text-gray-800 dark:text-gray-100" {...props} />,
        h2: ({node, ...props}) => <h2 className="text-xl font-semibold mb-1 text-gray-800 dark:text-gray-100" {...props} />,
        h3: ({node, ...props}) => <h3 className="text-lg font-medium mb-1 text-gray-700 dark:text-gray-200" {...props} />,
        h4: ({node, ...props}) => <h4 className="text-base font-medium mb-1 text-gray-700 dark:text-gray-200" {...props} />,
        p: ({node, ...props}) => <p className="mb-1 leading-normal text-gray-800 dark:text-gray-200" {...props} />,
        strong: ({node, ...props}) => <strong className="font-bold text-gray-900 dark:text-gray-100" {...props} />,
        em: ({node, ...props}) => <em className="italic text-gray-800 dark:text-gray-200" {...props} />,
        ul: ({node, ...props}) => <ul className="list-disc list-inside mb-1 space-y-0.5 text-gray-800 dark:text-gray-200" {...props} />,
        ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-1 space-y-0.5 text-gray-800 dark:text-gray-200" {...props} />,
        li: ({node, ...props}) => <li className="text-gray-800 dark:text-gray-200" {...props} />,
        blockquote: ({node, ...props}) => (
          <blockquote className="border-l-4 border-emerald-400 pl-4 py-1 mb-1 bg-emerald-50 dark:bg-emerald-900/30 text-gray-700 dark:text-gray-300" {...props} />
        ),
        code: ({node, inline, ...props}) => 
          inline 
            ? <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-sm font-mono text-gray-800 dark:text-gray-200" {...props} />
            : <code className="block bg-gray-100 dark:bg-gray-700 p-3 rounded-lg text-sm font-mono text-gray-800 dark:text-gray-200 overflow-x-auto" {...props} />,
        a: ({node, ...props}) => <a className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 underline" target="_blank" rel="noopener noreferrer" {...props} />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

export default function ChatIndex({ auth, sessions = [], settings = {}, theme: propTheme = {}, footerSettings = {} }) {
  const toast = useToast();
  const { theme: contextTheme, isDarkMode, toggleDarkMode, refreshTheme } = useTheme();
  
  // Use prop theme as fallback to prevent loading flash
  const theme = contextTheme || propTheme;
  
  // Create full theme object with dark mode functions
  const fullTheme = {
    ...theme,
    isDarkMode,
    toggleDarkMode
  };
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [preparing, setPreparing] = useState(false); // global pre-bubble phase
  const preparingRef = useRef(false); // always-current flag for timers
  const phaseSeqIdRef = useRef(0); // to cancel stale phase timers
  const [statusLine, setStatusLine] = useState('');
  const [guestSessions, setGuestSessions] = useState([]);
  const [localSessions, setLocalSessions] = useState(sessions || []);
  useEffect(() => {
    setLocalSessions(sessions || []);
  }, [JSON.stringify(sessions)]);
  const [localEnterSends, setLocalEnterSends] = useState(true);
  const [typewriterMessages, setTypewriterMessages] = useState(new Set());
  const [isTypewriting, setIsTypewriting] = useState(false); // Track if any message is being typed
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Debug: Log sidebar state
  useEffect(() => {
    console.log('Sidebar state:', isSidebarOpen, 'Window width:', window.innerWidth);
  }, [isSidebarOpen]);
  const [abortController, setAbortController] = useState(null);
  const [messageFeedback, setMessageFeedback] = useState(new Map()); // mesaj ID -> feedback tipi
  const [showLimitInfo, setShowLimitInfo] = useState(false);
  const limitInfoRef = useRef(null);
  const [limitPopoverPos, setLimitPopoverPos] = useState({ top: 0, left: 0, align: 'left' });
  const openLimitPopover = (targetEl) => {
    try {
      const rect = targetEl.getBoundingClientRect();
      const gap = 8;
      const vw = window.innerWidth;
      const preferRight = rect.right + 320 < vw; // enough space on right for ~320px panel
      const left = preferRight ? Math.max(8, rect.left) : Math.max(8, rect.right - 320);
      const top = Math.min(window.innerHeight - 200, rect.bottom + gap);
      setLimitPopoverPos({ top, left, align: preferRight ? 'left' : 'right' });
    } catch {}
  };
  // Permanently hidden feedback for message IDs (persisted in localStorage)
  const [feedbackGiven, setFeedbackGiven] = useState(() => {
    try {
      const raw = localStorage.getItem('feedbackGiven');
      const arr = raw ? JSON.parse(raw) : [];
      return new Set(arr.map(String));
    } catch {
      return new Set();
    }
  });
  const markFeedbackGiven = (id) => {
    try {
      const s = new Set(feedbackGiven);
      s.add(String(id));
      setFeedbackGiven(s);
      localStorage.setItem('feedbackGiven', JSON.stringify([...s]));
    } catch {}
  };
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const [showGuestTerms, setShowGuestTerms] = useState(false);
  const [isGuestTermsAccepted, setIsGuestTermsAccepted] = useState(false);
  const [isChatBlocked, setIsChatBlocked] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  // Message font size customization
  const [messageFontScale, setMessageFontScale] = useState(() => {
    const v = Number(localStorage.getItem('messageFontScale'));
    return v && v >= 0.85 && v <= 1.4 ? v : 1;
  });
  const [showFontPanel, setShowFontPanel] = useState(false);
  // Per-message font scales and open panel state
  const [messageFontScales, setMessageFontScales] = useState(new Map());
const [openFontPanelFor, setOpenFontPanelFor] = useState(null);
  // Feedback modal state
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [reportTarget, setReportTarget] = useState(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  useEffect(() => {
    try { localStorage.setItem('messageFontScale', String(messageFontScale)); } catch (e) {}
  }, [messageFontScale]);
  
  // Handle chat session deletion
  const handleDeleteSession = async () => {
    if (!sessionToDelete) return;
    
    try {
      if (auth?.user) {
        // Authenticated user - delete from server with CSRF header
        const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
        try {
          await axios.delete(`/chat/${sessionToDelete.session_id}`, {
            headers: { 'X-CSRF-TOKEN': token, 'X-Requested-With': 'XMLHttpRequest' }
          });
        } catch (err) {
          // Fallback for hosts blocking DELETE: retry via POST
          await axios.post(`/chat/${sessionToDelete.session_id}/delete`, {}, {
            headers: { 'X-CSRF-TOKEN': token, 'X-Requested-With': 'XMLHttpRequest' }
          });
        }
        // Update local list without full reload
        setLocalSessions(prev => prev.filter(s => s.session_id !== sessionToDelete.session_id));
        if (currentSessionId === sessionToDelete.session_id) {
          setCurrentSessionId(null);
          setMessages([]);
        }
      } else {
        // Guest user - delete from localStorage
        const existingSessions = JSON.parse(localStorage.getItem('guestChatSessions') || '[]');
        const filteredSessions = existingSessions.filter(session => session.session_id !== sessionToDelete.session_id);
        localStorage.setItem('guestChatSessions', JSON.stringify(filteredSessions));
        setGuestSessions(filteredSessions);
        
        // If current session is deleted, clear the chat
        if (currentSessionId === sessionToDelete.session_id) {
          setCurrentSessionId(null);
          setMessages([]);
        }
      }
      toast.success('Söhbət silindi!');
    } catch (error) {
      console.error('Delete session error:', error);
      toast.error('Söhbət silinərkən xəta baş verdi');
    } finally {
      setShowDeleteModal(false);
      setSessionToDelete(null);
    }
  };
  
  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setSessionToDelete(null);
  };
  // Limit tracking
  const [limitInfo, setLimitInfo] = useState({
    allowed: true,
    remaining: 0,
    daily_remaining: 0,
    monthly_remaining: 0,
    reset_time: null,
    monthly_reset_time: null,
    user_type: 'guest'
  });
  const [limitBlocked, setLimitBlocked] = useState(false);
  const [countdownTime, setCountdownTime] = useState(null);

  const chatbotName = settings.chatbot_name || 'AI Assistant';
const siteName = settings.site_name || 'XIV AI Chatbot Platform';
  const disclaimerText = settings.chat_disclaimer_text || 'Çatbotun cavablarını yoxlayın, səhv edə bilər!';
  const inputLimit = Number(settings.message_input_limit || settings.guest_input_limit || 500);
  const enterSendsMessage = true; // Enter toggle removed from settings UI; default to true
  const aiResponseType = settings.ai_response_type || 'typewriter';
  const aiTypingSpeed = Number(settings.ai_typing_speed || 50);
  const aiThinkingTime = Number(settings.ai_thinking_time || 1000);
  
  // Character counter for guests
  const isGuest = !auth?.user;
  const currentLength = input.length;
  const remainingChars = inputLimit - currentLength;
  const isOverLimit = inputLimit > 0 && currentLength > inputLimit;
  
  // Apply theme colors with strong fallback to prevent flash
  const primaryColor = theme?.primary_color || propTheme?.primary_color || '#17cf1a';
  const secondaryColor = theme?.secondary_color || propTheme?.secondary_color || '#179207';
  const accentColor = theme?.accent_color || propTheme?.accent_color || '#b6fb23';
  const bgGradient = theme?.background_gradient || propTheme?.background_gradient || 'linear-gradient(135deg, #04f000 0%, #009e4c 100%)';
  const textColor = theme?.text_color || propTheme?.text_color || '#1f2937';
  
  // Branding logo selector (desktop/mobile + light/dark)
  const getBrandLogoUrl = () => {
    const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
    const dark = fullTheme.isDarkMode;
    const s = settings || {};
    // Prefer variant-specific logos if present
    const dl = s.brand_logo_desktop_light;
    const dd = s.brand_logo_desktop_dark;
    const ml = s.brand_logo_mobile_light;
    const md = s.brand_logo_mobile_dark;
    if (!isMobile) {
      if (dark && dd) return dd;
      if (!dark && dl) return dl;
    } else {
      if (dark && md) return md;
      if (!dark && ml) return ml;
    }
    // Fallback to generic logo
    return s.brand_logo_url || '';
  };
  const brandLogoUrl = getBrandLogoUrl();
  
  // Chat Background Logic - only for chat message area
  const getChatBackground = () => {
    const bgType = theme?.chat_background_type;
    
    // If no background type or null/default, return transparent for standard colors
    if (!bgType || bgType === 'default' || bgType === null) {
      return 'transparent'; // This allows standard bg-white/dark:bg-gray-800 to work
    }
    
    switch (bgType) {
      case 'solid':
        return theme?.chat_background_color || 'transparent';
      case 'gradient':
        return theme?.chat_background_gradient || 'transparent';
      case 'image':
        return theme?.chat_background_image 
          ? `url(${theme.chat_background_image})`
          : 'transparent';
      default:
        return 'transparent';
    }
  };
  
  const chatBackground = getChatBackground();
  
  
  // Format countdown time
  const formatCountdown = (targetTime) => {
    if (!targetTime) return '';
    
    const now = new Date();
    const timeLeft = targetTime - now;
    
    if (timeLeft <= 0) return 'Yenilənir...';
    
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
    
    if (hours > 0) {
      return `${hours} saat ${minutes} dəqiqə ${seconds} saniyə`;
    } else if (minutes > 0) {
      return `${minutes} dəqiqə ${seconds} saniyə`;
    } else {
      return `${seconds} saniyə`;
    }
  };
  
  // Fetch current limits
  const fetchLimits = async () => {
    try {
      const response = await fetch(`/api/chat-limits?t=${Date.now()}`, { cache: 'no-store' });
      const data = await response.json();
      setLimitInfo(data);
      
      if (!data.allowed) {
        setLimitBlocked(true);
        setIsChatBlocked(true);
        if (data.reset_time) {
          setCountdownTime(new Date(data.reset_time));
        }
      } else {
        setLimitBlocked(false);
        // Don't override terms blocking
        if (isGuestTermsAccepted || auth?.user) {
          setIsChatBlocked(false);
        }
      }
    } catch (error) {
      console.error('Failed to fetch limits:', error);
    }
  };

  // Load guest sessions from localStorage on mount
  useEffect(() => {
    if (!auth?.user) {
      const savedSessions = JSON.parse(localStorage.getItem('guestChatSessions') || '[]');
      setGuestSessions(savedSessions);
      
      // Qonaq istifadəçi üçün terms modal yoxla
      const termsAccepted = localStorage.getItem('guest-terms-accepted');
      if (termsAccepted === 'true') {
        setIsGuestTermsAccepted(true);
        setIsChatBlocked(false);
      } else {
        setShowGuestTerms(true);
        setIsChatBlocked(true);
      }
    } else {
      // Qeydiyyatdan keçmiş istifadəçi üçün modal tələb olunmur
      setIsChatBlocked(false);
      setIsGuestTermsAccepted(true);
    }
    
    // Load limits after component mount
    fetchLimits();
  }, [auth?.user]);
  
  // Fetch limits periodically and handle countdown
  useEffect(() => {
    // Initial fetch
    fetchLimits();
    
    // Set up interval to check limits every 30 seconds
    const limitInterval = setInterval(fetchLimits, 30000);
    
    // Set up countdown timer
    const countdownInterval = setInterval(() => {
      if (countdownTime) {
        const now = new Date();
        const timeLeft = countdownTime - now;
        
        if (timeLeft <= 0) {
          // Time's up, refresh limits
          fetchLimits();
          setCountdownTime(null);
        }
      }
    }, 1000);
    
    return () => {
      clearInterval(limitInterval);
      clearInterval(countdownInterval);
    };
  }, [countdownTime]);
  
  // Refresh theme when window gains focus (to sync admin changes)
  useEffect(() => {
    const handleFocus = () => {
      if (refreshTheme) {
        refreshTheme();
      }
      // Refresh limits when user returns to tab (after admin reset, etc.)
      fetchLimits();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refreshTheme]);
  
  // Load user background settings on component mount
  useEffect(() => {
    // Ensure chat container is rendered before loading background
    const timer = setTimeout(() => {
      loadUserBackground(!!auth?.user);
    }, 200);
    
    // Listen for background changes from settings modal
    const handleBackgroundChange = (event) => {
      const chatContainer = document.querySelector('#chat-container, [data-chat-background]');
      if (!chatContainer) return;
      
      // Handle default/reset case (no background or type is 'default')
      if (!event.detail || !event.detail.type || event.detail.type === 'default') {
        console.log('Chat listener: Clearing all background styles for default');
        chatContainer.style.removeProperty('background');
        chatContainer.style.removeProperty('background-image');
        chatContainer.style.removeProperty('background-color');
        chatContainer.style.removeProperty('background-size');
        chatContainer.style.removeProperty('background-position');
        chatContainer.style.removeProperty('background-repeat');
        chatContainer.style.removeProperty('background-attachment');
        chatContainer.style.removeProperty('background-origin');
        chatContainer.style.removeProperty('background-clip');
        return;
      }
      
      // Apply background immediately if data is provided in event
      if (event.detail.background) {
        if (event.detail.type === 'image') {
          chatContainer.style.backgroundImage = event.detail.background;
          chatContainer.style.backgroundSize = event.detail.imageSize || 'cover';
          chatContainer.style.backgroundPosition = event.detail.imagePosition || 'center';
          chatContainer.style.backgroundRepeat = 'no-repeat';
          chatContainer.style.backgroundColor = '';
        } else if (event.detail.type === 'gradient') {
          // For gradients, use background property
          chatContainer.style.backgroundImage = '';
          chatContainer.style.backgroundSize = '';
          chatContainer.style.backgroundPosition = '';
          chatContainer.style.backgroundRepeat = '';
          chatContainer.style.background = event.detail.background;
          chatContainer.style.backgroundColor = '';
        } else if (event.detail.type === 'solid') {
          // For solid colors, completely clear all gradient properties
          chatContainer.style.setProperty('background', 'none', 'important');
          chatContainer.style.setProperty('background-image', 'none', 'important');
          chatContainer.style.setProperty('background-size', 'auto', 'important');
          chatContainer.style.setProperty('background-position', '0% 0%', 'important');
          chatContainer.style.setProperty('background-repeat', 'repeat', 'important');
          chatContainer.style.setProperty('background-attachment', 'scroll', 'important');
          chatContainer.style.setProperty('background-origin', 'padding-box', 'important');
          chatContainer.style.setProperty('background-clip', 'border-box', 'important');
          chatContainer.style.setProperty('background-color', event.detail.background, 'important');
          console.log('Chat listener applied solid color:', event.detail.background);
        }
      }
      
      // Also reload from server as backup
      setTimeout(() => loadUserBackground(!!auth?.user), 200);
    };
    
    window.addEventListener('backgroundChanged', handleBackgroundChange);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('backgroundChanged', handleBackgroundChange);
    };
  }, [auth?.user]);

  // Save guest sessions to localStorage
  const saveGuestSession = (sessionId, title, messages) => {
    if (!auth?.user) {
      const newSession = {
        session_id: sessionId,
        title: title || sessionId.slice(0, 8),
        messages: messages || [],
        created_at: new Date().toISOString()
      };
      
      const existingSessions = JSON.parse(localStorage.getItem('guestChatSessions') || '[]');
      const sessionIndex = existingSessions.findIndex(s => s.session_id === sessionId);
      
      if (sessionIndex >= 0) {
        existingSessions[sessionIndex] = { ...existingSessions[sessionIndex], messages };
      } else {
        existingSessions.unshift(newSession);
      }
      
      // Keep only last 10 sessions for guests
      const limitedSessions = existingSessions.slice(0, 10);
      localStorage.setItem('guestChatSessions', JSON.stringify(limitedSessions));
      setGuestSessions(limitedSessions);
    }
  };

  const loadSession = async (sid) => {
    if (auth?.user) {
      // Authenticated user - load from server
      try {
        const { data } = await axios.get(`/chat/${sid}`);
        setMessages(data.messages);
      } catch (err) {
        toast.error('Söhbət yüklənmədi');
        console.error('loadSession error:', err);
      }
    } else {
      // Guest user - load from localStorage
      const session = guestSessions.find(s => s.session_id === sid);
      if (session) {
        setMessages(session.messages || []);
      }
    }
    setCurrentSessionId(sid);
  };

  // Terms modal funksiyaları
  const handleTermsAccept = () => {
    localStorage.setItem('guest-terms-accepted', 'true');
    setIsGuestTermsAccepted(true);
    // Only enable chat if not blocked by limits
    if (!limitBlocked) {
      setIsChatBlocked(false);
    }
    setShowGuestTerms(false);
    toast.success('İstifadə şərtləri qəbul edildi! İndi çatbotla danışa bilərsiniz.');
  };

  const handleTermsReject = () => {
    setShowGuestTerms(false);
    setIsChatBlocked(true);
    toast.warning('İstifadə şərtlərini qəbul etmədən çatbotla danışa bilməzsiniz.');
    // Optionally redirect to home or show a message
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    // Check if typewriter is currently active
    if (isTypewriting) {
      toast.warning('Çatbot hələ də yazır. Zəhmət olmasa gözləyin.');
      return;
    }
    
    // Çatbotun bloklandığını yoxla
    if (isChatBlocked) {
      toast.warning('İstifadə şərtlərini qəbul etmədən mesaj göndərə bilməzsiniz.');
      return;
    }
    
    // Enforce input limit for everyone
    if (isOverLimit) {
      toast.warning(`Daxiletmə limiti: ${inputLimit}. Cari: ${currentLength} simvol`);
      return;
    }

    const userMsg = { role: 'user', content: input, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, { ...userMsg, id: `local-${Date.now()}` }]);
    setInput('');
    // Reset textarea height to default after send
    try { if (inputRef.current) { inputRef.current.style.height = ''; } } catch {}
    setLoading(true);
    setTyping(true);
    setPreparing(true);
    preparingRef.current = true;
    setStatusLine('Sual göndərildi...');
    // Simulated real-time phases until response arrives (guarded by sequence id & ref)
    const seq = ++phaseSeqIdRef.current;
    try {
      clearTimeout(window.__ragPhaseTimer1);
      clearTimeout(window.__ragPhaseTimer2);
      clearTimeout(window.__ragPhaseTimer3);
      clearTimeout(window.__ragPhaseTimer4);
    } catch {}
    window.__ragPhaseTimer1 = setTimeout(() => { if (phaseSeqIdRef.current===seq && preparingRef.current) setStatusLine('Embeddings hazırlanır...'); }, 300);
    window.__ragPhaseTimer2 = setTimeout(() => { if (phaseSeqIdRef.current===seq && preparingRef.current) setStatusLine('Vektor mağazasında axtarış...'); }, 900);
    window.__ragPhaseTimer3 = setTimeout(() => { if (phaseSeqIdRef.current===seq && preparingRef.current) setStatusLine('Kontekst toplanır...'); }, 1500);
    window.__ragPhaseTimer4 = setTimeout(() => { if (phaseSeqIdRef.current===seq && preparingRef.current) setStatusLine('Cavab formalaşdırılır...'); }, 2100);

    // Create abort controller for request cancellation
    const controller = new AbortController();
    setAbortController(controller);

    try {
      // Heuristic: if last AI msg has a KB and the question looks like follow-up, anchor to that KB
      const lastAssistant = [...messages].reverse().find(x => x.role === 'assistant' && x.ragMeta?.dominant_kb_id != null);
      const looksFollowUp = (() => {
        const q = (userMsg.content || '').trim().toLowerCase();
        const short = q.length <= 60;
        const cues = ['şərt', 'şərtlər', 'qayd', 'necə', 'necədir', 'nədir', 'davam', 'daha', 'izah', 'addım'];
        return short && cues.some(c => q.includes(c));
      })();
      const contextKbId = lastAssistant && looksFollowUp ? lastAssistant.ragMeta.dominant_kb_id : undefined;

      const { data } = await axios.post('/chat/send', {
        message: userMsg.content,
        session_id: currentSessionId,
        ...(contextKbId ? { context_kb_id: contextKbId } : {})
      }, {
        signal: controller.signal
      });

      if (!currentSessionId) {
        setCurrentSessionId(data.session_id);
        // Add session with typewriter title
        const fullTitle = userMsg.content.slice(0, 40);
        const startAt = new Date().toISOString();
        if (auth?.user) {
          setLocalSessions(prev => [{ session_id: data.session_id, title: '', created_at: startAt }, ...prev]);
          // Typewriter animate title
          let i = 0;
          const id = setInterval(() => {
            i++;
            const partial = fullTitle.slice(0, i);
            setLocalSessions(prev => prev.map(s => s.session_id === data.session_id ? { ...s, title: partial } : s));
            if (i >= fullTitle.length) clearInterval(id);
          }, Math.max(20, Math.min(80, 1000 / Math.max(5, fullTitle.length))));
        } else {
          // For guests, also animate title in local storage list
          const temp = { session_id: data.session_id, title: '', created_at: startAt, messages: [userMsg] };
          setGuestSessions(prev => [temp, ...prev]);
          let i = 0;
          const id = setInterval(() => {
            i++;
            const partial = fullTitle.slice(0, i);
            setGuestSessions(prev => prev.map(s => s.session_id === data.session_id ? { ...s, title: partial } : s));
            if (i >= fullTitle.length) clearInterval(id);
          }, Math.max(20, Math.min(80, 1000 / Math.max(5, fullTitle.length))));
        }
        // Note: Guest session saving is handled after message is added to state
      }

      // Handle AI response with typewriter or instant display
      const assistantId = `ai-${Date.now()}`;
      
      let assistantMsg;
      if (aiResponseType === 'instant') {
        // Show full message immediately
        // Switch from global typing to bubble typing: hide global indicators first
        setPreparing(false);
        preparingRef.current = false;
        setTyping(false);
        setStatusLine('');
        phaseSeqIdRef.current++; // cancel any pending phase timers
        assistantMsg = {
          role: 'assistant',
          content: data.message,
          fullContent: data.message,
          id: assistantId,
          created_at: new Date().toISOString(),
          isTyping: false,
          ragMeta: data.rag?.metadata || null,
          isContinuation: !!data.continuation
        };
        
        const newMessages = [...messages, userMsg, assistantMsg];
        setMessages(prev => [...prev, assistantMsg]);
      } else {
        // Typewriter effect - start with empty content and ensure no flicker
        // Switch from global typing to bubble typing: hide global indicators first
        setPreparing(false);
        preparingRef.current = false;
        setTyping(false);
        setStatusLine('');
        phaseSeqIdRef.current++; // cancel any pending phase timers
        assistantMsg = {
          role: 'assistant',
          content: '', // Always start empty for typewriter
          fullContent: data.message,
          id: assistantId,
          created_at: new Date().toISOString(),
          isTyping: true,
          ragMeta: data.rag?.metadata || null,
          isContinuation: !!data.continuation
        };
        
        // Add message with empty content first
        setMessages(prev => [...prev, assistantMsg]);
        
        // Start typewriter effect after thinking time
        setIsTypewriting(true); // Block new messages during typewriter
        setTimeout(() => {
          setTypewriterMessages(prev => new Set([...prev, assistantId]));
        }, aiThinkingTime);
      }
      
      const newMessages = [...messages, userMsg, assistantMsg];
      
      // Update guest session in localStorage (save with current state, not full content)
      if (!auth?.user) {
        const sessionId = currentSessionId || data.session_id;
        saveGuestSession(sessionId, userMsg.content, newMessages);
      }
      
      // Update limit info after successful message
      if (data.limit_info) {
        setLimitInfo({
          allowed: data.limit_info.remaining > 0,
          remaining: data.limit_info.remaining,
          daily_remaining: data.limit_info.daily_remaining,
          monthly_remaining: data.limit_info.monthly_remaining,
          reset_time: data.limit_info.reset_time,
          monthly_reset_time: data.limit_info.monthly_reset_time,
          user_type: auth?.user ? 'user' : 'guest'
        });
      }
    } catch (e) {
      if (e.name === 'CanceledError') {
        toast.info('Mesaj göndərmə dayandırıldı');
      } else if (e.response?.status === 429) {
        // Limit exceeded
        const errorData = e.response.data;
        toast.error(errorData.error || 'Mesaj limiti dolmuşdur!');
        
        // Update limit state
        if (errorData.limit_exceeded) {
          setLimitBlocked(true);
          setIsChatBlocked(true);
          if (errorData.reset_time) {
            setCountdownTime(new Date(errorData.reset_time));
          }
          setLimitInfo({
            allowed: false,
            remaining: errorData.remaining || 0,
            daily_remaining: errorData.daily_remaining || 0,
            monthly_remaining: errorData.monthly_remaining || 0,
            reset_time: errorData.reset_time,
            monthly_reset_time: errorData.monthly_reset_time,
            user_type: auth?.user ? 'user' : 'guest'
          });
        }
      } else {
        toast.error(e.response?.data?.error || 'Xəta baş verdi');
      }
      // Reset typewriting state on any error
      setIsTypewriting(false);
    } finally {
      setLoading(false);
      setAbortController(null);
      // Only reset typing state if not in typewriter mode or if there was an error
      setTimeout(() => {
        setTyping(false);
        setPreparing(false);
        preparingRef.current = false;
        phaseSeqIdRef.current++;
        // If instant mode or error occurred, reset typewriting state
        if (aiResponseType === 'instant') {
          setIsTypewriting(false);
        }
      }, 600);
      setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }), 50);
      setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }), 50);
    }
  };

  const getPrevUserMessageContentFor = (assistantMsg) => {
    const idx = messages.findIndex(x => (x.id || '') === (assistantMsg.id || ''));
    for (let i = idx - 1; i >= 0; i--) {
      if (messages[i]?.role === 'user' && typeof messages[i].content === 'string') return messages[i].content;
    }
    // fallback: last user msg
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i]?.role === 'user') return messages[i].content;
    }
    return 'Davam et';
  };

  const continueFromMessage = async (assistantMsg) => {
    if (!assistantMsg?.ragMeta?.dominant_kb_id) return;
    if (isTypewriting) { toast.warning('Çatbot hələ də yazır. Zəhmət olmasa gözləyin.'); return; }

    const kbId = assistantMsg.ragMeta.dominant_kb_id;
    const startAfter = assistantMsg.ragMeta.max_used_chunk_index_for_dominant ?? -1;
    const baseQuestion = getPrevUserMessageContentFor(assistantMsg);

    setLoading(true);
    setTyping(true);
    setPreparing(true);
    preparingRef.current = true;
    setStatusLine('Davamı hazırlanır...');
    const seq2 = ++phaseSeqIdRef.current;
    try {
      clearTimeout(window.__ragPhaseTimer1);
      clearTimeout(window.__ragPhaseTimer2);
      clearTimeout(window.__ragPhaseTimer3);
      clearTimeout(window.__ragPhaseTimer4);
    } catch {}
    window.__ragPhaseTimer1 = setTimeout(() => { if (phaseSeqIdRef.current===seq2 && preparingRef.current) setStatusLine('Embeddings hazırlanır...'); }, 300);
    window.__ragPhaseTimer2 = setTimeout(() => { if (phaseSeqIdRef.current===seq2 && preparingRef.current) setStatusLine('Vektor mağazasında axtarış...'); }, 900);
    window.__ragPhaseTimer3 = setTimeout(() => { if (phaseSeqIdRef.current===seq2 && preparingRef.current) setStatusLine('Kontekst toplanır...'); }, 1500);
    window.__ragPhaseTimer4 = setTimeout(() => { if (phaseSeqIdRef.current===seq2 && preparingRef.current) setStatusLine('Cavab formalaşdırılır...'); }, 2100);

    try {
      const { data } = await axios.post('/chat/send', {
        message: baseQuestion,
        session_id: currentSessionId,
        continue: true,
        kb_id: kbId,
        start_after_index: startAfter
      });

      const assistantId = `ai-${Date.now()}`;
      // Switch from global typing to bubble typing
      setPreparing(false);
      preparingRef.current = false;
      setTyping(false);
      setStatusLine('');
      phaseSeqIdRef.current++;
      const newAssistant = {
        role: 'assistant',
        content: '',
        fullContent: data.message,
        id: assistantId,
        created_at: new Date().toISOString(),
        isTyping: aiResponseType !== 'instant',
        ragMeta: data.rag?.metadata || null,
        isContinuation: true,
      };

      setMessages(prev => [...prev, newAssistant]);
      if (aiResponseType === 'instant') {
        setMessages(prev => prev.map(x => x.id === assistantId ? { ...x, content: x.fullContent, isTyping: false } : x));
        setStatusLine('Cavab hazırlandı.');
      } else {
        setIsTypewriting(true);
        setTimeout(() => {
          setTypewriterMessages(prev => new Set([...prev, assistantId]));
          setStatusLine('Cavab yazılır...');
        }, aiThinkingTime);
      }

    } catch (e) {
      toast.error(e.response?.data?.error || 'Xəta baş verdi');
    } finally {
      setLoading(false);
      setTimeout(() => { setTyping(false); setPreparing(false); preparingRef.current = false; phaseSeqIdRef.current++; if (aiResponseType === 'instant') setIsTypewriting(false); }, 600);
      setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }), 50);
    }
  };

  const stopGeneration = async () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    
    try {
      await axios.post('/chat/stop');
    } catch (error) {
      // Ignore errors for stop endpoint
      // Stop request failed, but generation was already stopped
    }
    
    setLoading(false);
    setTyping(false);
    setIsTypewriting(false); // Re-enable message sending
    setTypewriterMessages(new Set()); // Clear any active typewriter effects
    toast.info('Cavab yazmaq dayandırıldı');
  };

  // Bəyənmə funksiyaları
  const handleFeedback = async (messageId, messageContent, feedbackType) => {
    // Client-side: immediately mark this message as given feedback (hide buttons permanently)
    markFeedbackGiven(messageId);
    try {
      // Show instant state
      setMessageFeedback(prev => {
        const newMap = new Map(prev);
        newMap.set(messageId, feedbackType);
        return newMap;
      });
      
      // Send to server
      await axios.post('/chat/feedback', {
        message_id: messageId,
        session_id: currentSessionId,
        message_content: messageContent,
        feedback_type: feedbackType
      });
      
      // Success toast
      const message = feedbackType === 'like' 
        ? 'Rəyiniz üçün təşəkkür edirik, bu bizi sevindirir. :)' 
        : 'Rəyiniz üçün təşəkkür edirik, biz çatbotu təkmiləşdirəcəyik, zəif təcrübəmiz üçün üzr istəyirik.';
      toast.success(message);
      
    } catch (error) {
      console.error('Feedback error:', error);
      // Keep hidden permanently even if request fails (as requested)
      const msg = error?.response?.data?.error || 'Bəyən/Bəyənmə göndərilmədi';
      toast.error(msg);
    }
  };

  // Handle keyboard events for textarea
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (localEnterSends && !e.shiftKey) {
        e.preventDefault();
        // If Stop state (loading or typewriting), Enter should stop generation
        if (loading || isTypewriting) {
          stopGeneration();
        } else if (!isChatBlocked && !isTypewriting) {
          // Otherwise send message (only if not blocked)
          sendMessage();
        }
      }
      // If Shift+Enter or localEnterSends is false, allow default (new line)
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Smooth scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  // Keep autoscrolling while typewriter effect is active
  useEffect(() => {
    if (!scrollRef.current) return;
    if (isTypewriting) {
      const id = setInterval(() => {
        try {
          const el = scrollRef.current;
          el.scrollTop = el.scrollHeight;
        } catch {}
      }, 150);
      return () => clearInterval(id);
    }
  }, [isTypewriting, messages]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (limitInfoRef.current && !limitInfoRef.current.contains(e.target)) {
        setShowLimitInfo(false);
      }
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);
  
  // ESC düyməsi ilə mobil sidebar bağlanmasını təmin et
  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape' && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };
    
    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [isSidebarOpen]);
  
  // Mobil versiyada sidebar açıq olduğu zaman body scroll-u blokla
  useEffect(() => {
    if (isSidebarOpen && window.innerWidth < 768) {
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = '0px'; // scrollbar ölçüsünü kompensasiya et
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
    
    // Cleanup function - component unmount zamanı scroll-u bərpa et
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isSidebarOpen]);
  
  // Mobil cihazlarda güclü sidebar bağlama handler-i
  const closeSidebarHandler = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log('Sidebar bağlanır:', isSidebarOpen); // Debug üçün
    setIsSidebarOpen(false);
  };
  
  // Touch start handler mobil cihazlar üçün
  const handleTouchStart = (e) => {
    if (window.innerWidth >= 768) return; // Yalnız mobil versiyada
    console.log('Touch start detected'); // Debug üçün
    closeSidebarHandler(e);
  };
  
  // Window resize handler - desktop-a keçdikdə sidebar-ı bağla
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && isSidebarOpen) {
        console.log('Desktop-a keçildi, sidebar bağlanır');
        setIsSidebarOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isSidebarOpen]);
  
  // Məcburi sidebar bağlanması debug üçün
  const forceCloseSidebar = () => {
    console.log('Force close sidebar executed');
    setIsSidebarOpen(false);
  };

  return (
    <div className={`${fullTheme.isDarkMode ? 'dark' : ''}`}>
      <div
        className="min-h-screen flex flex-col overflow-x-hidden"
        style={{
          background: fullTheme.isDarkMode
            ? (theme?.dark_background_gradient || 'linear-gradient(135deg, #1f2937 0%, #111827 100%)')
            : (theme?.background_gradient || 'linear-gradient(135deg, #f9fafb 0%, #ffffff 100%)'),
          backgroundAttachment: 'fixed',
          minHeight: '100dvh' // Modern dynamic viewport height support with fallback to 100vh
        }}
      >
      <Head title={`Əsas səhifə - ${siteName || 'AI Chatbot Platform'}`} />

      <div className="w-full px-4 md:px-4 lg:px-6 py-4 md:py-4 lg:py-6 flex-1 flex flex-col min-h-0 pb-24">
        
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-4 md:mb-6 flex flex-wrap items-center justify-between bg-gradient-to-r from-white/80 via-white/85 to-white/80 dark:from-gray-800/80 dark:via-gray-800/85 dark:to-gray-800/80 backdrop-blur-2xl rounded-3xl p-4 md:p-6 shadow-2xl shadow-purple-500/10 dark:shadow-purple-500/20 w-full border border-white/30 dark:border-gray-700/50 hover:shadow-3xl transition-all duration-300"
        >
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex items-start md:items-center gap-3"
          >
            {/* Mobile sidebar toggle */}
            <motion.button
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Toggle button clicked:', !isSidebarOpen); // Debug
                setIsSidebarOpen(!isSidebarOpen);
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Toggle touch start'); // Debug
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const newState = !isSidebarOpen;
                console.log('Toggle touch end, changing state from', isSidebarOpen, 'to', newState);
                setIsSidebarOpen(newState);
              }}
              className="md:hidden p-3 rounded-xl bg-gradient-to-br from-purple-500/10 to-indigo-500/10 text-gray-700 dark:text-gray-300 hover:from-purple-500/20 hover:to-indigo-500/20 border border-purple-200/30 dark:border-purple-700/30 backdrop-blur-sm transition-all duration-300 shadow-lg hover:shadow-xl"
              aria-label="Söhbət tarixçəsi"
              type="button"
              style={{
                touchAction: 'manipulation',
                WebkitTouchCallout: 'none',
                WebkitUserSelect: 'none'
              }}
            >
              <Icon name="menu" size={20} />
            </motion.button>
            {/* Desktop site name */}
            <motion.h1 
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="hidden md:flex text-lg md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 dark:from-gray-100 dark:via-gray-200 dark:to-gray-100 bg-clip-text text-transparent items-center gap-3 hover:from-purple-600 hover:via-indigo-600 hover:to-purple-600 transition-all duration-500"
            >
              {settings.brand_mode === 'logo' && (brandLogoUrl || settings.brand_logo_url) ? (
                <motion.img 
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  src={brandLogoUrl || settings.brand_logo_url} 
                  alt="logo" 
                  className="w-8 h-8 md:w-10 md:h-10 object-contain rounded-xl shadow-lg border border-white/20 dark:border-gray-700/50" 
                />
              ) : settings.brand_mode === 'icon' ? (
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="p-2 rounded-xl bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-200/30 dark:border-purple-700/30 shadow-lg"
                >
                  <Icon name={settings.brand_icon_name || 'nav_chat'} size={28} color={primaryColor} />
                </motion.div>
              ) : null}
              <motion.span 
                whileHover={{ scale: 1.02 }}
                className="truncate font-extrabold tracking-wide"
              >
                {siteName}
              </motion.span>
            </motion.h1>
            {/* Mobile limit + mode switch (stacked) */}
            <div className="md:hidden flex flex-col gap-1 ml-1">
              <div className="flex items-center gap-2 text-[12px] font-medium text-gray-700 dark:text-gray-300" ref={limitInfoRef}>
               <Icon name="limit" size={18} />
                <span>{limitInfo.limit_type === 'monthly' ? 'Aylıq' : 'Günlük'} limitiniz</span>
                <span className="text-white px-2 py-0.5 rounded-full" style={{ backgroundColor: primaryColor }}>
                  {limitInfo.remaining}
                </span> sorğu
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); openLimitPopover(e.currentTarget); setShowLimitInfo(v => !v); }}
                  className="ml-1 p-1 rounded-md text-gray-800 hover:text-black hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-110"
                  title="Limit haqqında"
                ><Icon name="limit_info" size={18} />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="sun" size={16} color={!fullTheme.isDarkMode ? '#fbbf24' : '#9ca3af'} />
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={fullTheme.isDarkMode} 
                    onChange={() => fullTheme.toggleDarkMode()}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
                <Icon name="moon" size={16} color={fullTheme.isDarkMode ? '#60a5fa' : '#9ca3af'} />
              </div>
            </div>
          </motion.div>

          {/* Desktop right actions (includes limit + switch) */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="hidden md:flex items-center gap-3 flex-wrap justify-end"
          >
            {/* Limit Badge */}
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`relative px-4 py-2 rounded-xl text-xs font-semibold backdrop-blur-sm border shadow-lg transition-all duration-300 ${
                limitBlocked ? 'bg-gradient-to-r from-red-50 to-red-100 text-red-800 border-red-200 shadow-red-200/50' : 
                limitInfo.remaining <= 5 ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-800 border-yellow-200 shadow-yellow-200/50' :
                'bg-gradient-to-r from-green-50 to-green-100 text-green-800 border-green-200 shadow-green-200/50'
              }`}
            >
              <div className="flex items-center gap-1">
                <Icon name={limitBlocked ? 'warning' : 'limit'} size={12} />
                <span>
                  {limitBlocked ? (
                    <>
                      Məhdudiyyət! - {formatCountdown(countdownTime)}
                    </>
                  ) : (
                    <>
                    {limitInfo.limit_type === 'monthly' ? 'Aylıq' : 'Günlük'} limitiniz {limitInfo.remaining} sorğu(çıxış)
                    </>
                  )}
                </span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); openLimitPopover(e.currentTarget); setShowLimitInfo(v => !v); }}
                  className="ml-1 p-1 rounded-md text-gray-800 hover:text-black hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-110"
                  title="Limit haqqında"
                >
                <Icon name="limit_info" size={18} />
                </button>
              </div>
            </motion.div>
            {/* Dark mode toggle switch */}
            <div className="hidden md:flex items-center gap-2">
              <Icon name="sun" size={16} color={!fullTheme.isDarkMode ? '#fbbf24' : '#9ca3af'} />
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={fullTheme.isDarkMode} 
                  onChange={() => fullTheme.toggleDarkMode()}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
              <Icon name="moon" size={16} color={fullTheme.isDarkMode ? '#60a5fa' : '#9ca3af'} />
            </div>
            
            {auth?.user ? (
              <>
                <span className="hidden md:inline text-sm text-gray-600 dark:text-gray-300">Salam, {auth.user.name}</span>
                {auth.user.role?.name === 'admin' && (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link href="/admin" className="px-4 py-2.5 rounded-xl text-sm bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2 font-medium">
                      <Icon name="settings" size={16} />
                      <span className="hidden md:inline">Admin Panel</span>
                    </Link>
                  </motion.div>
                )}
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link href="/profile" className="px-4 py-2.5 rounded-xl text-sm bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300 dark:from-gray-600 dark:to-gray-700 dark:text-gray-200 dark:hover:from-gray-500 dark:hover:to-gray-600 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2 font-medium">
                    <Icon name="users" size={16} />
                    <span className="hidden md:inline">Profil</span>
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link href="/logout" method="post" as="button" className="px-4 py-2.5 rounded-xl text-sm bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2 font-medium">
                    <Icon name="logout" size={16} />
                    <span className="hidden md:inline">Çıxış</span>
                  </Link>
                </motion.div>
              </>
            ) : (
              <>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link href="/login" className="px-4 py-2.5 rounded-xl text-sm bg-white/80 backdrop-blur-sm border-2 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 dark:bg-gray-800/80 dark:text-emerald-400 dark:hover:bg-gray-700 dark:border-gray-600 dark:hover:border-emerald-500 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2 font-medium" style={{ borderColor: primaryColor }}>
                    <Icon name="users" size={16} />
                    <span className="hidden md:inline">Daxil ol</span>
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link href="/register" className="px-4 py-2.5 rounded-xl text-sm text-white font-medium transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2 bg-gradient-to-r hover:scale-105" style={{ background: `linear-gradient(135deg, ${primaryColor}DD, ${secondaryColor || primaryColor}DD)` }}>
                    <Icon name="user_add" size={16} />
                    <span className="hidden md:inline">Qeydiyyat</span>
                  </Link>
                </motion.div>
              </>
            )}
            <motion.button
              whileHover={{ scale: 1.05, rotate: 2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { setCurrentSessionId(null); setMessages([]); }}
              className="px-4 py-2.5 rounded-xl text-sm text-white font-medium transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2 bg-gradient-to-r hover:brightness-110"
              style={{ background: `linear-gradient(135deg, ${secondaryColor}DD, ${primaryColor || secondaryColor}DD)` }}
            >
              <Icon name="edit" size={16} />
              <span className="hidden md:inline">Yeni söhbət</span>
            </motion.button>
          </motion.div>

          {/* Mobile right actions (icons row only) */}
          <div className="flex md:hidden items-center gap-2 ml-auto overflow-x-auto">
            {auth?.user ? (
              <>
                {auth.user.role?.name === 'admin' && (
                  <Link href="/admin" className="px-2 py-2 rounded-lg text-sm bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-sm flex items-center gap-1">
                    <Icon name="settings" size={16} />
                  </Link>
                )}
                <Link href="/profile" className="px-2 py-2 rounded-lg text-sm bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition-colors shadow-sm flex items-center gap-1">
                  <Icon name="users" size={16} />
                </Link>
                <Link href="/logout" method="post" as="button" className="px-2 py-2 rounded-lg text-sm bg-red-500 text-white hover:bg-red-600 transition-colors shadow-sm flex items-center gap-1">
                  <Icon name="logout" size={16} />
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="px-2 py-2 rounded-lg text-sm bg-white border text-emerald-700 hover:bg-emerald-50 dark:bg-gray-800 dark:text-emerald-400 dark:hover:bg-gray-700 transition-colors shadow-sm flex items-center gap-1" style={{ borderColor: primaryColor }}>
                  <Icon name="users" size={16} />
                </Link>
                <Link href="/register" className="px-2 py-2 rounded-lg text-sm text-white transition-colors shadow-sm flex items-center gap-1" style={{ backgroundColor: primaryColor }}>
                  <Icon name="user_add" size={16} />
                </Link>
              </>
            )}
            <button
              onClick={() => { setCurrentSessionId(null); setMessages([]); }}
              className="px-2 py-2 rounded-lg text-sm text-white transition-colors shadow-sm flex items-center gap-1"
              style={{ backgroundColor: secondaryColor }}
              title="Yeni söhbət"
            >
              <Icon name="edit" size={16} />
            </button>
          </div>
        </motion.header>

        <div className="flex gap-0 md:gap-4 h-full">
          {/* Mobil Overlay - yalnız sidebar açıq olduqda */}
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                onTouchStart={(e) => {
                  e.preventDefault();
                  setIsSidebarOpen(false);
                }}
                onClick={() => setIsSidebarOpen(false)}
              />
            )}
          </AnimatePresence>
          
          {/* Sidebar - Desktop: həmişə, Mobil: AnimatePresence ilə */}
          <AnimatePresence>
            {(isSidebarOpen || window.innerWidth >= 768) && (
              <motion.aside 
                initial={{ x: window.innerWidth < 768 ? -320 : 0, opacity: window.innerWidth < 768 ? 0 : 1 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -320, opacity: 0 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 400, 
                  damping: 25,
                  mass: 0.6,
                  duration: 0.4
                }}
                className="
                  fixed md:relative
                  top-0 left-0
                  h-full
                  w-80 md:w-72 lg:w-80
                  bg-gradient-to-b from-white/85 via-white/90 to-gray-50/85 dark:from-gray-800/85 dark:via-gray-800/90 dark:to-gray-900/85
                  backdrop-blur-2xl
                  border-r border-gray-200/50 dark:border-gray-700/50
                  rounded-r-3xl md:rounded-3xl
                  z-50 md:z-auto
                  flex flex-col
                  shadow-2xl md:shadow-xl
                "
              >
                {/* Sidebar Header */}
                <div className="flex flex-col">
                  {/* Logo və sayt başlığı - yalnız mobil cihazlarda göstərilir */}
                  <motion.div 
                    initial={{ opacity: 0, y: -20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ 
                      delay: 0.15, 
                      duration: 1,
                      type: "spring",
                      stiffness: 200,
                      damping: 20
                    }}
                    className="md:hidden p-4 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-900/20 dark:to-purple-900/20 border-b border-gray-100 dark:border-gray-700/50 rounded-tr-3xl"
                  >
                    <div className="flex items-center gap-3">
                      {settings.brand_mode === 'logo' && (brandLogoUrl || settings.brand_logo_url) ? (
                        <motion.img 
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ delay: 0.3, duration: 0.8, type: "spring", stiffness: 200 }}
                          whileHover={{ scale: 1.1, rotate: 5, transition: { duration: 0.2 } }}
                          whileTap={{ scale: 0.95 }}
                          src={brandLogoUrl || settings.brand_logo_url} 
                          alt="logo" 
                          className="w-7 h-7 object-contain rounded-lg shadow-md border border-white/30 dark:border-gray-600/50" 
                        />
                      ) : settings.brand_mode === 'icon' ? (
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ delay: 0.3, duration: 0.8, type: "spring", stiffness: 200 }}
                          whileHover={{ scale: 1.1, rotate: 5, transition: { duration: 0.2 } }}
                          whileTap={{ scale: 0.95 }}
                          className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500/15 to-indigo-500/15 border border-purple-200/40 dark:border-purple-700/40 shadow-md"
                        >
                          <Icon name={settings.brand_icon_name || 'nav_chat'} size={20} color={primaryColor} />
                        </motion.div>
                      ) : null}
                      <motion.span 
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5, duration: 0.8, type: "spring", stiffness: 150 }}
                        whileHover={{ scale: 1.02, x: 2, transition: { duration: 0.2 } }}
                        className="font-bold text-lg bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 dark:from-gray-100 dark:via-gray-200 dark:to-gray-100 bg-clip-text text-transparent truncate leading-tight"
                      >
                        {siteName}
                      </motion.span>
                    </div>
                  </motion.div>
                  
                  {/* Söhbət Tarixçəsi başlığı */}
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                    className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-purple-50/30 to-indigo-50/30 dark:from-purple-900/10 dark:to-indigo-900/10 md:rounded-t-3xl"
                  >
                    <div className="flex items-center gap-2">
                      <motion.div whileHover={{ scale: 1.1, rotate: 5 }}>
                        <Icon name="chat_history" size={24} color={primaryColor} />
                      </motion.div>
                      <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Söhbət Tarixçəsi</h2>
                    </div>
                    {/* Mobil: Bağla düyməsi */}
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      onTouchStart={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsSidebarOpen(false);
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsSidebarOpen(false);
                      }}
                      className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors active:bg-gray-200 dark:active:bg-gray-600 shadow-sm"
                      type="button"
                      aria-label="Bağla"
                    >
                      <Icon name="close" size={20} />
                    </motion.button>
                  </motion.div>
                </div>

                {/* Söhbətlər Siyahısı */}
                <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
                  {(auth?.user ? localSessions : guestSessions).map((s, idx) => (
                    <motion.button
                      key={s.session_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05, duration: 0.3 }}
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        loadSession(s.session_id);
                        // Mobil: söhbət seçildikdə sidebar bağlanır
                        if (window.innerWidth < 768) {
                          setIsSidebarOpen(false);
                        }
                      }}
                      className={`
                        group w-full text-left px-3 py-2.5 rounded-xl transition-all
                        ${currentSessionId === s.session_id 
                          ? 'bg-gradient-to-r from-emerald-50 to-emerald-100/50 dark:from-gray-700 dark:to-gray-600 border-l-4 shadow-md' 
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:shadow-sm'
                        }
                      `}
                      style={currentSessionId === s.session_id ? { borderLeftColor: primaryColor } : {}}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {s.title || s.session_id.slice(0, 8)}
                          </div>
                          {s.created_at && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {new Date(s.created_at).toLocaleDateString('az')}
                            </div>
                          )}
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSessionToDelete(s);
                            setShowDeleteModal(true);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                          title="Söhbəti sil"
                        >
                          <Icon name="close" size={16} className="text-red-500" />
                        </motion.button>
                      </div>
                    </motion.button>
                  ))}
                  
                  {(auth?.user ? localSessions : guestSessions).length === 0 && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 }}
                      className="text-center py-12"
                    >
                      <Icon name="chat" size={48} color={fullTheme.isDarkMode ? '#6b7280' : '#d1d5db'} className="mx-auto mb-3" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">Heç bir söhbət yoxdur</p>
                    </motion.div>
                  )}
                </div>

                {/* Sidebar Footer with Badge */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50/30 to-indigo-50/30 dark:from-purple-900/10 dark:to-indigo-900/10 rounded-br-3xl md:rounded-b-3xl"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon name="chat" size={18} color={primaryColor} />
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Ümumi söhbətlər</span>
                    </div>
                    <motion.div 
                      whileHover={{ scale: 1.15 }}
                      className="flex items-center justify-center min-w-[28px] h-7 px-2.5 rounded-full text-xs font-bold text-white shadow-lg"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {(auth?.user ? localSessions : guestSessions).length}
                    </motion.div>
                  </div>
                </motion.div>
              </motion.aside>
            )}
          </AnimatePresence>

          <div className="flex-1 min-w-0 w-full">
            <main className="w-full max-w-none">
              <div 
                className={`w-full backdrop-blur-xl border border-emerald-200 dark:border-gray-600 rounded-3xl p-3 md:p-6 flex flex-col shadow-2xl hover:shadow-3xl dark:shadow-purple-500/10 border-white/20 dark:border-gray-700/30 transition-all duration-300 relative ${
                  chatBackground === 'transparent' ? '!bg-white dark:!bg-gray-800' : ''
                }`}
                data-chat-background="true"
                id="chat-container"
                style={chatBackground !== 'transparent' ? { 
                  minHeight: 'calc(100vh - 200px)',
                  background: chatBackground,
                  backgroundSize: theme?.chat_background_type === 'image' ? 'cover' : undefined,
                  backgroundPosition: theme?.chat_background_type === 'image' ? 'center' : undefined,
                  backgroundRepeat: theme?.chat_background_type === 'image' ? 'no-repeat' : undefined
                } : {
                  minHeight: 'calc(100vh - 200px)'
                }}
              >
              {/* Font size control bubble */}
              <div className="absolute top-2 right-2 z-20">
                <button
                  onClick={() => setShowFontPanel(v => !v)}
                  className="p-2 rounded-lg bg-white/80 dark:bg-gray-700/80 border border-gray-200 dark:border-gray-600 shadow hover:shadow-md transition"
                  title="Mətn ölçüsü"
                >
                  <Icon name="type" size={16} />
                </button>
                {showFontPanel && (
                  <div className="absolute right-0 mt-2 w-56 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 shadow-lg p-3">
                    <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Mətn ölçüsü</div>
                    <input
                      type="range"
                      min="0.85"
                      max="1.4"
                      step="0.05"
                      value={messageFontScale}
                      onChange={e => setMessageFontScale(parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex items-center justify-between mt-2">
                      <button onClick={() => setMessageFontScale(0.95)} className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">A-</button>
                      <button onClick={() => setMessageFontScale(1)} className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">A</button>
                      <button onClick={() => setMessageFontScale(1.2)} className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">A+</button>
                    </div>
                  </div>
                )}
              </div>
              <div 
                ref={scrollRef} 
                className="flex-1 overflow-y-auto space-y-3 pr-1 md:pr-2 custom-scrollbar" 
                style={{ maxHeight: 'calc(100vh - 240px)' }}
              >
                <AnimatePresence>
                  {messages.map((m, idx) => (
                    <motion.div key={m.id || idx}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: .2 }}
                                className={`group relative max-w-[90%] md:max-w-[85%] rounded-xl px-3 md:px-4 py-2 md:py-3 ${m.role==='user' ? 'ml-auto bg-emerald-50/60 dark:bg-emerald-900/20' : 'mr-auto bg-gray-100/60 dark:bg-gray-700/50'} shadow-lg hover:shadow-xl dark:shadow-2xl dark:hover:shadow-3xl border border-emerald-100 dark:border-gray-600 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5`}
                                style={{ }}
                    >
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                        <div className="flex items-center gap-2">
                          {m.role === 'user' ? (
                            // İstifadəçi badge-i
                            <div className="flex items-center gap-2">
                              {auth?.user ? (
                                <span className="px-2 py-1 rounded-full text-xs font-medium text-white" style={{ backgroundColor: primaryColor }}>
                                  {auth.user.name}
                                </span>
                              ) : (
                                <span className="px-2 py-1 rounded-full text-xs font-medium text-white" style={{ backgroundColor: primaryColor }}>
                                  Siz - Qonaq
                                </span>
                              )}
                            </div>
                          ) : (
                            // AI badge-i
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-1 rounded-full text-xs font-medium text-white" style={{ backgroundColor: secondaryColor }}>
                                {chatbotName || 'AI Assistant'}
                              </span>
                              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" title="AI Aktiv"></div>
                            </div>
                          )}
                        </div>
                        {m.created_at && (
                          <div className="text-xs text-gray-400 flex flex-col items-end">
                            <span className="hidden md:block">
                              {new Date(m.created_at).toLocaleDateString('az-AZ', { 
                                day: '2-digit', 
                                month: '2-digit',
                                year: 'numeric'
                              })}
                            </span>
                            <span>
                              {new Date(m.created_at).toLocaleTimeString('az-AZ', { 
                                hour: '2-digit', 
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                      {/* Per-message text size bubble */}
                      <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setOpenFontPanelFor(openFontPanelFor === (m.id || idx) ? null : (m.id || idx))}
                          className="p-1.5 rounded-full bg-white/90 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-600 shadow"
                          title="Mesaj mətni ölçüsü"
                        >
                          <Icon name="type" size={12} />
                        </button>
                        {openFontPanelFor === (m.id || idx) && (
                          <div className="absolute right-0 mt-2 w-44 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 shadow-lg p-3 z-10">
                            <div className="text-[11px] font-medium text-gray-700 dark:text-gray-300 mb-1">Bu mesaj üçün ölçü</div>
                            <input
                              type="range"
                              min="0.85"
                              max="1.4"
                              step="0.05"
                              value={messageFontScales.get(m.id) ?? messageFontScale}
                              onChange={e => {
                                const val = parseFloat(e.target.value);
                                setMessageFontScales(prev => {
                                  const map = new Map(prev);
                                  map.set(m.id, val);
                                  return map;
                                });
                              }}
                              className="w-full"
                            />
                            <div className="flex items-center justify-between mt-2">
                              <button onClick={() => setMessageFontScales(prev => { const map = new Map(prev); map.set(m.id, Math.max(0.85, (map.get(m.id) ?? messageFontScale) - 0.05)); return map; })} className="px-2 py-1 text-[11px] rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">A-</button>
                              <button onClick={() => setMessageFontScales(prev => { const map = new Map(prev); map.set(m.id, messageFontScale); return map; })} className="px-2 py-1 text-[11px] rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">Sıfırla</button>
                              <button onClick={() => setMessageFontScales(prev => { const map = new Map(prev); map.set(m.id, Math.min(1.4, (map.get(m.id) ?? messageFontScale) + 0.05)); return map; })} className="px-2 py-1 text-[11px] rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">A+</button>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="whitespace-pre-wrap leading-relaxed text-gray-800 dark:text-gray-200" style={{ fontSize: `${(messageFontScales.get(m.id) ?? messageFontScale)}rem` }}>
                        {m.role === 'assistant' ? (
                          typewriterMessages.has(m.id) ? (
                            <TypewriterText
                              text={m.fullContent} 
                              speed={aiTypingSpeed}
                              onComplete={() => {
                                setMessages(prev => {
                                  const updatedMessages = prev.map(msg => 
                                    msg.id === m.id ? {...msg, content: m.fullContent, isTyping: false} : msg
                                  );
                                  
                                  // Update guest session after typewriter completes
                                  if (!auth?.user && currentSessionId) {
                                    setTimeout(() => {
                                      saveGuestSession(currentSessionId, null, updatedMessages);
                                    }, 100);
                                  }
                                  
                                  return updatedMessages;
                                });
                                setTypewriterMessages(prev => {
                                  const newSet = new Set(prev);
                                  newSet.delete(m.id);
                                  return newSet;
                                });
                                // Re-enable message sending after typewriter completes
                                setIsTypewriting(false);
                              }}
                            />
                          ) : (
                            <MarkdownRenderer content={m.content || ''} />
                          )
                        ) : (
                          <div className="whitespace-pre-wrap" style={{ fontSize: `${(messageFontScales.get(m.id) ?? messageFontScale)}rem` }}>{m.content}</div>
                        )}
                      </div>
                      
                      {/* Action buttons for AI messages */}
                      {m.role === 'assistant' && !m.isTyping && (
                        <div className="flex items-center justify-start md:justify-between mt-2 flex-wrap gap-1 md:gap-2">
                          {/* Bəyənmə butonları */}
                          {(() => { const msgIdStr = String(m.id || ''); const isGiven = feedbackGiven.has(msgIdStr) || messageFeedback.has(m.id); return !isGiven; })() && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleFeedback(String(m.id || ''), m.content || m.fullContent, 'like')}
                              disabled={messageFeedback.has(m.id)}
                              className={`p-1 md:p-1.5 rounded-lg transition-all group/btn ${
                                messageFeedback.get(m.id) === 'like'
                                  ? 'text-green-600 bg-green-50 dark:bg-green-900/30'
                                  : 'text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/30'
                              } disabled:opacity-50`}
                              title="Bəyən"
                            >
                              <div className="flex items-center gap-1">
                                <Icon name="heart" size={14} />
                                <span className="hidden md:inline text-xs opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap">
                                  {messageFeedback.get(m.id) === 'like' ? 'Bəyəndiniz' : 'Bəyən'}
                                </span>
                              </div>
                            </button>
                            <button
                              onClick={() => handleFeedback(String(m.id || ''), m.content || m.fullContent, 'dislike')}
                              disabled={messageFeedback.has(m.id)}
                              className={`p-1 md:p-1.5 rounded-lg transition-all group/btn ${
                                messageFeedback.get(m.id) === 'dislike'
                                  ? 'text-red-600 bg-red-50 dark:bg-red-900/30'
                                  : 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30'
                              } disabled:opacity-50`}
                              title="Bəyənmə"
                            >
                              <div className="flex items-center gap-1">
                                <Icon name="dislike" size={14} />
                                <span className="hidden md:inline text-xs opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap">
                                  {messageFeedback.get(m.id) === 'dislike' ? 'Bəyənmədiniz' : 'Bəyənmə'}
                                </span>
                              </div>
                            </button>
                          </div>
                          )}
                          
                          {/* Diğər əməliyyat butonları */}
                          <div className="flex items-center gap-2 opacity-75 hover:opacity-100 transition-opacity">
                            {m.ragMeta?.dominant_kb_id != null && (
                              <button
                                onClick={() => continueFromMessage(m)}
                                className="px-3 md:px-4 py-1.5 md:py-2 rounded-xl text-xs md:text-sm text-white font-medium transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2 bg-gradient-to-r hover:brightness-110"
                                style={{ background: `linear-gradient(135deg, ${primaryColor}DD, ${secondaryColor || primaryColor}DD)` }}
                                title="Daha çox məlumat ver"
                              >
                                Daha çox məlumat ver
                              </button>
                            )}
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(m.content || m.fullContent);
                                toast.success('Mətn kopyalandı!');
                              }}
                              className="p-1 md:p-1.5 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all group/btn"
                              title="Mətn kopyala"
                            >
                              <div className="flex items-center gap-1">
                                <Icon name="copy" size={14} />
                                <span className="hidden md:inline text-xs opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap">Kopyala</span>
                              </div>
                            </button>
                            <button
onClick={() => {
                                setReportTarget(m);
                                setShowFeedbackModal(true);
                              }}
                              className="p-1 md:p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all group/btn"
                              title="Səhv cavab haqqında bildiş göndər"
                            >
                              <div className="flex items-center gap-1">
                                <Icon name="warning" size={14} />
                                <span className="hidden md:inline text-xs opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap">Bildir</span>
                              </div>
                            </button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
                {preparing && (
                  <TypingDots chatbotName={chatbotName} />
                )}
                {preparing && statusLine && (
                  <div className="mt-1 text-[12px] italic text-gray-500 dark:text-gray-400">
                    {statusLine}
                  </div>
                )}
              </div>

              {/* Message Input Area - Modern Design */}
              <div className="mt-3 md:mt-4">
                <div className="relative bg-white/50 dark:bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-white/30 dark:border-gray-700/30 shadow-2xl hover:shadow-3xl transition-all duration-300 p-1">
                  <div className="relative flex items-end gap-2">
                    {/* Main textarea */}
                    <textarea
                      ref={inputRef}
                      className={`flex-1 bg-transparent border-none outline-none focus:outline-none focus:ring-0 resize-none text-sm md:text-base p-3 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 min-h-[50px] max-h-[150px] ${
                        isGuest && isOverLimit ? 'text-red-600 placeholder-red-400' : ''
                      } ${
                        isChatBlocked || isTypewriting ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      placeholder={limitBlocked ? `Limit doldu - ${formatCountdown(countdownTime)}` : isTypewriting ? 'Çatbot yazır... gözləyin' : (isChatBlocked ? 'İstifadə şərtlərini qəbul edin...' : 'Mesajınızı yazın...')}
                      value={input}
                      onChange={e => {
                        if (!isChatBlocked && !isTypewriting) {
                          const val = e.target.value;
                          setInput(inputLimit > 0 ? val.slice(0, inputLimit) : val);
                        }
                        // Auto-grow height
                        try {
                          const ta = inputRef.current;
                          if (ta) {
                            ta.style.height = 'auto';
                            const maxH = window.innerWidth < 768 ? 150 : 150; // consistent max height
                            ta.style.height = Math.min(ta.scrollHeight, maxH) + 'px';
                          }
                        } catch {}
                      }}
                      onInput={() => {
                        try {
                          const ta = inputRef.current;
                          if (ta) {
                            ta.style.height = 'auto';
                            const maxH = window.innerWidth < 768 ? 150 : 150;
                            ta.style.height = Math.min(ta.scrollHeight, maxH) + 'px';
                          }
                        } catch {}
                      }}
                      onKeyDown={handleKeyDown}
                      disabled={isChatBlocked}
                      rows={2}
                    />
                    
                    {/* Action buttons group */}
                    <div className="flex items-center gap-1 pb-3 pr-1">
                      {/* Enter toggle button - closer to send button */}
                      <button
                        onClick={() => setLocalEnterSends(!localEnterSends)}
                        className={`p-2 rounded-lg transition-all shadow-sm hover:shadow-md border backdrop-blur-sm ${
                          localEnterSends 
                            ? 'bg-emerald-500/90 text-white border-emerald-400/50 shadow-emerald-500/25' 
                            : 'bg-white/70 dark:bg-gray-700/70 text-gray-600 dark:text-gray-300 border-gray-300/50 dark:border-gray-600/50'
                        }`}
                        title={localEnterSends ? 'Enter ilə göndər aktiv' : 'Enter ilə göndər deaktiv'}
                      >
                        <Icon name="enter" size={14} />
                      </button>
                      
                      {/* Send/Stop button */}
                      <button
                        onClick={() => (loading || isTypewriting) ? stopGeneration() : sendMessage()}
                        disabled={(isGuest && isOverLimit) || isChatBlocked}
                        className={`p-3.5 md:p-4 rounded-2xl text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all shadow-lg hover:shadow-xl hover:scale-105 bg-gradient-to-r`}
                        style={{ 
                          background: (loading || isTypewriting) ? '#ef4444' : ((isGuest && isOverLimit) || isChatBlocked ? '#ef4444' : `linear-gradient(135deg, ${primaryColor}DD, ${secondaryColor || primaryColor}DD)`),
                          boxShadow: `0 4px 20px ${(loading || isTypewriting) ? '#ef444420' : `${primaryColor}20`}`
                        }}
                        title={(loading || isTypewriting) ? 'Dayandır' : (isChatBlocked ? 'İstifadə şərtlərini qəbul edin' : 'Göndər')}
                      >
                        <Icon name={(loading || isTypewriting) ? 'stop' : (isChatBlocked ? 'shield_check' : 'send')} size={18} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Static Settings Icon - Right Below Send Button */}
                  <div className="absolute -bottom-12 right-2">
                    <div className="group relative inline-flex items-center justify-center">
                      {/* Animated pulse rings */}
                      <span className="absolute inline-flex h-full w-full rounded-xl bg-gradient-to-r opacity-75 animate-ping" style={{ 
                        backgroundImage: `linear-gradient(135deg, ${primaryColor}40, ${secondaryColor}40)`,
                        animationDuration: '2s'
                      }}></span>
                      <span className="absolute inline-flex h-full w-full rounded-xl bg-gradient-to-r opacity-75 animate-pulse" style={{ 
                        backgroundImage: `linear-gradient(135deg, ${primaryColor}30, ${secondaryColor}30)`,
                        animationDuration: '1.5s'
                      }}></span>
                      
                      {/* Main icon button - matching send button style */}
                      <button
                        type="button"
                        onClick={() => setShowSettingsModal(true)}
                        className="relative p-3 rounded-xl text-white font-medium flex items-center justify-center transition-all shadow-lg hover:shadow-xl hover:scale-105 backdrop-blur-sm cursor-pointer"
                        style={{ 
                          backgroundColor: primaryColor,
                          boxShadow: `0 4px 20px ${primaryColor}20`
                        }}
                        title="Parametrlər"
                      >
                        <Icon name="settings" size={16} className="animate-spin-slow" style={{ animationDuration: '8s' }} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              {/* Input limit display - for both guests and authenticated users */}
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-xs transition-all text-gray-800 ${
                    isGuest && isOverLimit ? 'text-red-600 font-medium' : 
                    isGuest && remainingChars < 50 ? 'text-yellow-600' : 'dark:!text-white dark:drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]'
                  }`}>
                    Daxiletmə limiti:
                  </span>
                  <span 
                    className="inline-flex items-center justify-center min-w-[2.5rem] h-6 px-2 rounded-full text-xs font-bold text-white shadow-sm transition-all"
                    style={{
                      backgroundColor: isGuest && isOverLimit ? '#ef4444' : 
                                     isGuest && remainingChars < 50 ? '#eab308' : secondaryColor || '#06b6d4'
                    }}
                  >
                    {inputLimit}
                  </span>
                  <span className="text-xs text-gray-800 dark:!text-white dark:drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">simvol</span>
                  {currentLength > 0 && (
                    <>
                      <span className="text-xs text-gray-400 dark:text-gray-500">|</span>
                      <span className="text-xs text-gray-800 dark:!text-white dark:drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">istifadə:</span>
                      <span 
                        className="inline-flex items-center justify-center min-w-[2.5rem] h-6 px-2 rounded-full text-xs font-bold text-white shadow-sm transition-all"
                        style={{
                          backgroundColor: isGuest && isOverLimit ? '#ef4444' : primaryColor || '#10b981'
                        }}
                      >
                        {currentLength}
                      </span>
                    </>
                  )}
                </div>
                {isGuest && isOverLimit && (
                  <p className="text-xs text-red-600 font-medium flex items-center gap-1">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/30">⚠️</span>
                    Limit keçildi!
                  </p>
                )}
              </div>
              
              
              <div className="text-center mt-3">
                <p className="text-xs text-gray-600 dark:text-gray-400 px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg inline-block">
                  ⚠️ {disclaimerText}
                </p>
              </div>
              <p className="text-xs mt-1 text-center text-gray-800 dark:!text-white dark:drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                {localEnterSends ? (
                  <span><strong className="text-gray-800 dark:!text-white dark:drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">Enter</strong> - <strong className="text-gray-800 dark:!text-white dark:drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">göndər</strong>, <strong className="text-gray-800 dark:!text-white dark:drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">Shift+Enter</strong> - <strong className="text-gray-800 dark:!text-white dark:drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">yeni sətir</strong></span>
                ) : (
                  <span><strong className="text-gray-800 dark:!text-white dark:drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">Enter</strong> - <strong className="text-gray-800 dark:!text-white dark:drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">yeni sətir</strong></span>
                )}
              </p>
              </div>
            </main>
          </div>
        </div>
        
        {/* Footer - flex layout-da düzgün yerləşdirilmiş */}
        <div className="mt-auto">
          <Footer footerSettings={footerSettings} />
        </div>
      </div>
      
      {/* Donation Modal */}
      <DonationDisplay />
      
      {/* Guest Terms Modal */}
      <GuestTermsModal 
        isOpen={showGuestTerms}
        onAccept={handleTermsAccept}
        onReject={handleTermsReject}
        siteName={siteName}
      />

      {/* Global Limit Info Popover via Portal */}
      {showLimitInfo && createPortal(
        <div className="fixed inset-0 z-[9999]" onClick={() => setShowLimitInfo(false)}>
          {/* click-catcher background (transparent) */}
          <div className="absolute inset-0" />
          <div
            className={`absolute w-[18rem] md:w-[20rem] p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-2xl text-xs text-gray-700 dark:text-gray-200 limit-popover-animate backdrop-blur-lg`}
            style={{ top: limitPopoverPos.top, left: limitPopoverPos.left }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="font-semibold mb-1">Limit qaydası</div>
            {limitInfo.limit_type === 'monthly' ? (
              <div className="space-y-1">
                <p>Aylıq limit 30 gündən bir bərpa olunur. İlk mesaj göndərdiyiniz vaxt başlanğıc nöqtəsidir.</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Nümunə: İlk mesajı bu gün 14:00-da göndərmisinizsə, növbəti bərpa 30 gün sonra eyni tarix və saatda olacaq.</p>
                <p className="mt-1">Növbəti bərpa: {limitInfo.monthly_reset_time ? new Date(limitInfo.monthly_reset_time).toLocaleString('az-AZ') : 'Hələ başlanmayıb'}</p>
              </div>
            ) : (
              <div className="space-y-1">
                <p>Günlük limit yalnız 0-a düşdükdə 24 saatlıq geri sayım başlayır.</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Nümunə: Dünən 14:00-da istifadə etdiniz və hələ {limitInfo.daily_remaining ?? limitInfo.remaining} qalıbsa, sabah 14:00-da yenilənmir. 0 etdiyiniz andan 24 saat sonra bərpa olacaq.</p>
                <p className="mt-1">Növbəti bərpa: {limitInfo.reset_time ? new Date(limitInfo.reset_time).toLocaleString('az-AZ') : 'Limit bitməyib'}</p>
              </div>
            )}
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="font-semibold mb-0.5">“Sorğu” nədir?</div>
              <p>Hər göndərdiyiniz mesaj 1 sorğudur.</p>
            </div>
          </div>
        </div>, document.body)
      }
      
      {/* Delete Chat Modal */}
      <DeleteChatModal 
        isOpen={showDeleteModal}
        onConfirm={handleDeleteSession}
        onCancel={handleCancelDelete}
        chatTitle={sessionToDelete?.title || sessionToDelete?.session_id?.slice(0, 8) || ''}
        siteName={siteName}
      />
      
      {/* User Background Settings Modal */}
  <UserBackgroundModal 
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        isAuthenticated={!!auth?.user}
      />

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        messagePreview={reportTarget?.content || reportTarget?.fullContent || ''}
onSubmit={async ({ tags, comment }) => {
          // Build payload first, then close modal instantly
          const rt = reportTarget;
          const rawId = rt?.id;
          const strId = (rawId !== undefined && rawId !== null) ? String(rawId) : undefined;
          const mergedComment = `${(tags && tags.length ? '[' + tags.join(', ') + '] ' : '')}${comment || ''}`.trim();
          const payload = {
            message_content: rt?.content || rt?.fullContent || '',
            session_id: currentSessionId,
            timestamp: rt?.created_at,
            user_info: auth?.user ? { name: auth.user.name, email: auth.user.email } : 'Qonaq istifadəçi',
            comment: mergedComment || undefined,
          };
          if (strId !== undefined) payload.message_id = strId;
          setShowFeedbackModal(false);
          setReportTarget(null);
          // Fire request in background
          axios.post('/chat/report-feedback', payload)
            .then(() => toast.success('Geribildirişiniz göndərildi!'))
            .catch((error) => {
              console.error('Feedback report error:', error);
              const msg = error?.response?.data?.error || error?.response?.data?.message || 'Xəta baş verdi';
              toast.error('Geribildiriş göndərilmədi: ' + msg);
            });
        }}
      />
    </div>
    </div>
  );
}
