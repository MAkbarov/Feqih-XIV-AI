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
  const [guestSessions, setGuestSessions] = useState([]);
  const [localSessions, setLocalSessions] = useState(sessions || []);
  useEffect(() => {
    setLocalSessions(sessions || []);
  }, [JSON.stringify(sessions)]);
  const [localEnterSends, setLocalEnterSends] = useState(true);
  const [typewriterMessages, setTypewriterMessages] = useState(new Set());
  const [isTypewriting, setIsTypewriting] = useState(false); // Track if any message is being typed
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
  
  // Apply theme colors (no fallback defaults to prevent flash)
  const primaryColor = theme?.primary_color;
  const secondaryColor = theme?.secondary_color;
  const accentColor = theme?.accent_color;
  const bgGradient = theme?.background_gradient;
  
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

    // Create abort controller for request cancellation
    const controller = new AbortController();
    setAbortController(controller);

    try {
      const { data } = await axios.post('/chat/send', {
        message: userMsg.content,
        session_id: currentSessionId,
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
        assistantMsg = {
          role: 'assistant',
          content: data.message,
          fullContent: data.message,
          id: assistantId,
          created_at: new Date().toISOString(),
          isTyping: false
        };
        
        const newMessages = [...messages, userMsg, assistantMsg];
        setMessages(prev => [...prev, assistantMsg]);
      } else {
        // Typewriter effect - start with empty content and ensure no flicker
        assistantMsg = {
          role: 'assistant',
          content: '', // Always start empty for typewriter
          fullContent: data.message,
          id: assistantId,
          created_at: new Date().toISOString(),
          isTyping: true
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
        // If instant mode or error occurred, reset typewriting state
        if (aiResponseType === 'instant') {
          setIsTypewriting(false);
        }
      }, 600);
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

  return (
    <div className={`${fullTheme.isDarkMode ? 'dark' : ''}`}>
      <div
        className="min-h-screen flex flex-col overflow-x-hidden"
        style={{
          background: fullTheme.isDarkMode
            ? 'linear-gradient(135deg, #1f2937 0%, #111827 100%)'
            : (theme?.background_gradient || 'linear-gradient(135deg, #f9fafb 0%, #ffffff 100%)'),
          backgroundAttachment: 'fixed'
        }}
      >
      <Head title={`Əsas səhifə - ${siteName || 'AI Chatbot Platform'}`} />

      <div className="w-full px-4 md:px-4 lg:px-6 py-4 md:py-4 lg:py-6 flex-1 pb-0">
        
        <header className="mb-4 md:mb-6 flex flex-wrap items-center justify-between bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl p-3 md:p-4 shadow-xl w-full">
          <div className="flex items-start md:items-center gap-2">
            {/* Mobile sidebar toggle */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Söhbət tarixçəsi"
            >
              <Icon name="menu" size={20} />
            </button>
            {/* Desktop site name */}
            <h1 className="hidden md:flex text-lg md:text-2xl lg:text-3xl font-semibold text-gray-800 dark:text-gray-100 items-center gap-2">
{settings.brand_mode === 'logo' && (brandLogoUrl || settings.brand_logo_url) ? (
                <img src={brandLogoUrl || settings.brand_logo_url} alt="logo" className="w-6 h-6 md:w-8 md:h-8 object-contain rounded" />
              ) : settings.brand_mode === 'icon' ? (
                <Icon name={settings.brand_icon_name || 'nav_chat'} size={24} className="md:w-8 md:h-8" color={primaryColor} />
              ) : null}
              <span className="truncate">{siteName}</span>
            </h1>
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
                  className="ml-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
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
          </div>

          {/* Desktop right actions (includes limit + switch) */}
          <div className="hidden md:flex items-center gap-2 flex-wrap justify-end">
            {/* Limit Badge */}
            <div className={`relative px-2 py-1 rounded-lg text-xs font-medium ${
              limitBlocked ? 'bg-red-100 text-red-800 border border-red-200' : 
              limitInfo.remaining <= 5 ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
              'bg-green-100 text-green-800 border border-green-200'
            }`}>
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
                  className="ml-1 text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100"
                  title="Limit haqqında"
                >
                <Icon name="limit_info" size={18} />
                </button>
              </div>
            </div>
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
                  <Link href="/admin" className="px-2 md:px-3 py-2 rounded-lg text-sm bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-sm flex items-center gap-1">
                    <Icon name="settings" size={16} />
                    <span className="hidden md:inline">Admin Panel</span>
                  </Link>
                )}
                <Link href="/profile" className="px-2 md:px-3 py-2 rounded-lg text-sm bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition-colors shadow-sm flex items-center gap-1">
                  <Icon name="users" size={16} />
                  <span className="hidden md:inline">Profil</span>
                </Link>
                <Link href="/logout" method="post" as="button" className="px-2 md:px-3 py-2 rounded-lg text-sm bg-red-500 text-white hover:bg-red-600 transition-colors shadow-sm flex items-center gap-1">
                  <Icon name="logout" size={16} />
                  <span className="hidden md:inline">Çıxış</span>
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="px-2 md:px-4 py-2 rounded-lg text-sm bg-white border text-emerald-700 hover:bg-emerald-50 dark:bg-gray-800 dark:text-emerald-400 dark:hover:bg-gray-700 transition-colors shadow-sm flex items-center gap-1" style={{ borderColor: primaryColor }}>
                  <Icon name="users" size={16} />
                  <span className="hidden md:inline">Daxil ol</span>
                </Link>
                <Link href="/register" className="px-2 md:px-4 py-2 rounded-lg text-sm text-white transition-colors shadow-sm flex items-center gap-1" style={{ backgroundColor: primaryColor }}>
                  <Icon name="user_add" size={16} />
                  <span className="hidden md:inline">Qeydiyyat</span>
                </Link>
              </>
            )}
            <button
              onClick={() => { setCurrentSessionId(null); setMessages([]); }}
              className="px-2 md:px-3 py-2 rounded-lg text-sm text-white transition-colors shadow-sm flex items-center gap-1"
              style={{ backgroundColor: secondaryColor }}
            >
              <Icon name="edit" size={16} />
              <span className="hidden md:inline">Yeni söhbət</span>
            </button>
          </div>

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
        </header>

        <div className="flex gap-0 md:gap-2 lg:gap-3">
          {/* Mobile sidebar overlay */}
          {isSidebarOpen && (
            <div 
              className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}
          
          {/* Sidebar */}
          <aside className={`${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } md:translate-x-0 fixed md:relative top-0 left-0 z-50 md:z-auto w-80 md:w-[280px] lg:w-[300px] xl:w-[320px] h-full md:h-auto transform transition-transform duration-300 ease-in-out md:block md:flex-shrink-0`}>
            <div className="h-[80vh] md:h-[70vh] lg:h-[65vh] backdrop-blur bg-white/95 dark:bg-gray-800/95 md:bg-white/80 md:dark:bg-gray-800/80 border-r md:border border-emerald-200 dark:border-gray-600 rounded-2xl overflow-hidden p-4 md:p-3 lg:p-3 shadow-xl md:shadow-none flex flex-col" style={{ minWidth: '250px' }}>
              {/* Mobile site name */}
              <div className="md:hidden flex items-center gap-2 mb-4 p-3 bg-white/50 dark:bg-gray-700/50 rounded-lg">
{settings.brand_mode === 'logo' && (brandLogoUrl || settings.brand_logo_url) ? (
                  <img src={brandLogoUrl || settings.brand_logo_url} alt="logo" className="w-5 h-5 object-contain rounded" />
                ) : settings.brand_mode === 'icon' ? (
                  <Icon name={settings.brand_icon_name || 'nav_chat'} size={20} color={primaryColor} />
                ) : null}
                <span className="font-semibold text-gray-800 dark:text-gray-100 truncate">{siteName}</span>
              </div>
              
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg md:text-xs lg:text-sm font-semibold md:font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300 md:text-gray-600 md:dark:text-gray-400">Söhbət Tarixçəsi</h2>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="md:hidden p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Icon name="close" size={20} />
                </button>
              </div>
              <div className="space-y-2 max-h-[calc(80vh-8rem)] md:max-h-[calc(70vh-8rem)] lg:max-h-[calc(65vh-8rem)] overflow-auto pr-1 custom-scrollbar">
                {/* Show authenticated user sessions or guest sessions */}
                {(auth?.user ? localSessions : guestSessions).map(s => (
                  <div key={s.session_id} className={`group relative flex items-center w-full rounded-lg text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-gray-600 transition-colors ${currentSessionId===s.session_id?'bg-emerald-100 dark:bg-gray-700 border-l-2':''}`}
                       style={currentSessionId===s.session_id ? { borderLeftColor: primaryColor } : {}}>
                    <button
                      onClick={() => {
                        loadSession(s.session_id);
                        setIsSidebarOpen(false); // Close sidebar on mobile after selection
                      }}
                      className="flex-1 text-left px-2 py-2 md:py-2 text-xs md:text-sm"
                    >
                      <div className="truncate font-medium max-w-[180px] md:max-w-[200px]">{s.title || s.session_id.slice(0,8)}</div>
                      {!auth?.user && s.created_at && (
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(s.created_at).toLocaleDateString('az')}
                        </div>
                      )}
                    </button>
                    
                    {/* Delete button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSessionToDelete(s);
                        setShowDeleteModal(true);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity px-2 py-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg mr-1"
                      title="Söhbəti sil"
                    >
                      <Icon name="close" size={14} />
                    </button>
                  </div>
                ))}
                {(auth?.user ? localSessions : guestSessions).length === 0 && (
                  <div className="text-center py-8">
                    <Icon name="chat" size={48} color={fullTheme.isDarkMode ? '#9ca3af' : '#d1d5db'} className="mx-auto mb-3" />
                    <p className="text-sm text-gray-600 dark:text-gray-300">Siz hələ söhbət etməmisiniz</p>
                  </div>
                )}
              </div>
              

              
            </div>
          </aside>

          <div className="flex-1 min-w-0 w-full">
            <main className="w-full max-w-none">
              <div 
                className={`w-full backdrop-blur border border-emerald-200 dark:border-gray-600 rounded-2xl p-3 md:p-6 flex flex-col shadow-lg relative ${
                  chatBackground === 'transparent' ? 'bg-white/90 dark:bg-gray-800/90' : ''
                }`}
                style={{ 
                  minHeight: 'calc(100vh - 200px)',
                  background: chatBackground !== 'transparent' ? chatBackground : undefined,
                  backgroundSize: theme?.chat_background_type === 'image' ? 'cover' : undefined,
                  backgroundPosition: theme?.chat_background_type === 'image' ? 'center' : undefined,
                  backgroundRepeat: theme?.chat_background_type === 'image' ? 'no-repeat' : undefined
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
                                className={`group relative max-w-[90%] md:max-w-[85%] rounded-xl px-3 md:px-4 py-2 md:py-3 ${m.role==='user' ? 'ml-auto bg-emerald-50 dark:bg-emerald-900/30' : 'mr-auto bg-gray-100 dark:bg-gray-700/80'} shadow-md border border-emerald-100 dark:border-gray-600`}
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
                                // Show immediate feedback to user
                                toast.success('Geribildirişiniz göndərilir...');
                                
                                // Send the request asynchronously without blocking UI
                                const sendFeedback = async () => {
                                  try {
                                    // Ensure message_id is a string if available; backend expects string for report-feedback
                                    const rawId = m.id;
                                    const strId = (rawId !== undefined && rawId !== null) ? String(rawId) : undefined;
                                    const payload = {
                                      message_content: m.content || m.fullContent,
                                      session_id: currentSessionId,
                                      timestamp: m.created_at,
                                      user_info: auth?.user ? { name: auth.user.name, email: auth.user.email } : 'Qonaq istifadəçi'
                                    };
                                    if (strId !== undefined) payload.message_id = strId;
                                    
                                    const response = await axios.post('/chat/report-feedback', payload);
                                    
                                    // Show success after 1 second instead of waiting for server
                                    setTimeout(() => {
                                      toast.success('Geribildirişiniz göndərildi!');
                                    }, 1000);
                                  } catch (error) {
                                    console.error('Feedback report error:', error);
                                    const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Xəta baş verdi';
                                    setTimeout(() => {
                                      toast.error('Geribildiriş göndərilmədi: ' + errorMessage);
                                    }, 1000);
                                  }
                                };
                                
                                // Execute asynchronously
                                sendFeedback();
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
                {typing && (
                  <TypingDots chatbotName={chatbotName} />
                )}
              </div>

              <div className="mt-3 md:mt-4 flex flex-col gap-2">
                <div className="relative">
                  <textarea
                    ref={inputRef}
                    className={`w-full ${fullTheme.isDarkMode ? 'glass-input-dark' : 'glass-input'} resize-none transition-all text-sm md:text-base pr-24 md:pr-28 min-h-[60px] md:min-h-[70px] ${
                      isGuest && isOverLimit ? 'border-red-400 focus:ring-red-400/50 bg-red-50/50 dark:bg-red-900/50' : ''
                    } ${
                      isChatBlocked || isTypewriting ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-700' : ''
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
                          const maxH = window.innerWidth < 768 ? 160 : 220; // limit max height
                          ta.style.height = Math.min(ta.scrollHeight, maxH) + 'px';
                        }
                      } catch {}
                    }}
                    onInput={() => {
                      try {
                        const ta = inputRef.current;
                        if (ta) {
                          ta.style.height = 'auto';
                          const maxH = window.innerWidth < 768 ? 160 : 220;
                          ta.style.height = Math.min(ta.scrollHeight, maxH) + 'px';
                        }
                      } catch {}
                    }}
                    onKeyDown={handleKeyDown}
                    disabled={isChatBlocked}
                    rows={2}
                  />
                  
                  {/* Enter toggle button */}
                  <button
                    onClick={() => setLocalEnterSends(!localEnterSends)}
                    className={`absolute right-14 md:right-20 top-1/2 transform -translate-y-1/2 p-2 md:p-2.5 rounded-lg font-medium transition-all shadow-sm hover:shadow-md border ${
                      localEnterSends ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                    }`}
                    title={localEnterSends ? 'Enter ilə göndər aktiv' : 'Enter ilə göndər deaktiv'}
                  >
                    <Icon name="enter" size={16} />
                  </button>
                  
                  {/* Send/Stop button inside textarea */}
                  <button
                    onClick={() => (loading || isTypewriting) ? stopGeneration() : sendMessage()}
                    disabled={(isGuest && isOverLimit) || isChatBlocked}
                    className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-3 md:p-4 rounded-lg text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all shadow-lg hover:shadow-xl`}
                    style={{ 
                      backgroundColor: (loading || isTypewriting) ? '#ef4444' : ((isGuest && isOverLimit) || isChatBlocked ? '#ef4444' : primaryColor) 
                    }}
                    title={(loading || isTypewriting) ? 'Dayandır' : (isChatBlocked ? 'İstifadə şərtlərini qəbul edin' : 'Göndər')}
                  >
                    <Icon name={(loading || isTypewriting) ? 'stop' : (isChatBlocked ? 'shield_check' : 'send')} size={18} />
                  </button>
                </div>
              </div>
              {isGuest && (
                <div className="mt-2 flex items-center justify-between">
                  <p className={`text-xs transition-all ${
                    isOverLimit ? 'text-red-600 font-medium' : 
                    remainingChars < 50 ? 'text-yellow-600' : 'text-gray-500'
                  }`}>
                    Daxiletmə limiti {inputLimit} simvol 
                    {currentLength > 0 && (
                      <span className={isOverLimit ? 'text-red-600' : 'text-gray-400'}>
                        (istifadə edilib: {currentLength})
                      </span>
                    )}
                  </p>
                  {isOverLimit && (
                    <p className="text-xs text-red-600 font-medium">
                      ⚠️ Limit keçildi!
                    </p>
                  )}
                </div>
              )}
              
              
              <div className="text-center mt-3">
                <p className="text-xs text-gray-600 dark:text-gray-400 px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg inline-block">
                  ⚠️ {disclaimerText}
                </p>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 text-center">
                {localEnterSends ? (
                  <span><strong className="text-gray-600 dark:text-gray-300">Enter</strong> - göndər, <strong className="text-gray-600 dark:text-gray-300">Shift+Enter</strong> - yeni sətir</span>
                ) : (
                  <span><strong className="text-gray-600 dark:text-gray-300">Enter</strong> - yeni sətir</span>
                )}
              </p>
              </div>
            </main>
          </div>
        </div>
      </div>
      
      
      <Footer footerSettings={footerSettings} />
      
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
            className={`absolute w-[18rem] md:w-[20rem] p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-2xl text-xs text-gray-700 dark:text-gray-200`}
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
    </div>
    </div>
  );
}
