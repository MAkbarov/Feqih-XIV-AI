import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '@/Components/Icon';
import UserBackgroundModal from '@/Components/UserBackgroundModal';

// Detect mobile device for performance optimization
const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
};

const FloatingSettingsBubble = ({ isAuthenticated = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const bubbleRef = useRef(null);
    const dragStartTime = useRef(null);
    const BUBBLE_SIZE = 64; // 16 * 4 = 64px (w-16 h-16)
    const mobileDevice = isMobile();
    
    // Mobile-optimized animation settings
    const animationConfig = mobileDevice ? {
        // Reduced animation complexity for mobile
        dragTransition: { bounceStiffness: 300, bounceDamping: 30 },
        springConfig: { type: "spring", stiffness: 200, damping: 25 },
        hoverScale: 1.05, // Reduced from 1.1
        tapScale: 0.95,   // Reduced from 0.9
        dragScale: 1.02   // Reduced from 1.05
    } : {
        // Full animation for desktop
        dragTransition: { bounceStiffness: 600, bounceDamping: 20 },
        springConfig: { type: "spring", stiffness: 260, damping: 20 },
        hoverScale: 1.1,
        tapScale: 0.9,
        dragScale: 1.05
    };
    
    // Initialize position to middle right of screen
    useEffect(() => {
        const updatePosition = () => {
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
            const padding = 20; // Minimum distance from edges
            
            setPosition({
                x: Math.min(windowWidth - BUBBLE_SIZE - padding, windowWidth - 100), // Keep away from right edge
                y: Math.min(windowHeight / 2 - BUBBLE_SIZE / 2, windowHeight - BUBBLE_SIZE - padding) // Center vertically but within bounds
            });
        };
        
        updatePosition();
        window.addEventListener('resize', updatePosition);
        return () => window.removeEventListener('resize', updatePosition);
    }, []);

    const constrainPosition = (x, y) => {
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const padding = 10;
        
        return {
            x: Math.max(padding, Math.min(x, windowWidth - BUBBLE_SIZE - padding)),
            y: Math.max(padding, Math.min(y, windowHeight - BUBBLE_SIZE - padding))
        };
    };

    const handleDragStart = () => {
        dragStartTime.current = Date.now();
        setIsDragging(true);
    };

    const handleDrag = (event, info) => {
        const constrainedPos = constrainPosition(info.point.x - BUBBLE_SIZE / 2, info.point.y - BUBBLE_SIZE / 2);
        setPosition(constrainedPos);
    };

    const handleDragEnd = () => {
        const dragDuration = Date.now() - dragStartTime.current;
        // Only consider it a drag if it lasted more than 150ms
        setTimeout(() => {
            setIsDragging(dragDuration > 150);
        }, 50);
    };

    const handleClick = () => {
        if (!isDragging) {
            setIsOpen(true);
        }
    };

    return (
        <>
            {/* Bubble */}
            <motion.div
                ref={bubbleRef}
                drag={!mobileDevice || "true"} // Disable drag on mobile for better performance
                dragMomentum={false}
                dragTransition={animationConfig.dragTransition}
                dragElastic={mobileDevice ? 0.05 : 0.1} // Reduced elasticity on mobile
                onDragStart={handleDragStart}
                onDrag={handleDrag}
                onDragEnd={handleDragEnd}
                onClick={handleClick}
                className="fixed z-50 cursor-pointer select-none"
                style={{
                    left: position.x,
                    top: position.y,
                    // Hardware acceleration for mobile
                    willChange: 'transform',
                    transform: 'translateZ(0)', // Force hardware acceleration
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={animationConfig.springConfig}
                whileHover={{ scale: animationConfig.hoverScale }}
                whileTap={{ scale: animationConfig.tapScale }}
                whileDrag={{ scale: animationConfig.dragScale, cursor: "grabbing" }}
            >
                <div className={`w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full shadow-lg flex items-center justify-center backdrop-blur border border-white/20 ${
                    mobileDevice ? 'transition-none' : 'hover:shadow-xl transition-all duration-300'
                }`} style={{
                    // Hardware acceleration
                    willChange: 'transform, box-shadow',
                    transform: 'translateZ(0)'
                }}>
                    <Icon name="settings" size={24} color="#ffffff" />
                </div>
                
                {/* Pulse animation - disabled on mobile for performance */}
                {!mobileDevice && (
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 animate-ping opacity-20"></div>
                )}
            </motion.div>

            {/* Background Settings Modal */}
            <UserBackgroundModal 
                isOpen={isOpen} 
                onClose={() => setIsOpen(false)}
                isAuthenticated={isAuthenticated}
            />
        </>
    );
};

export default FloatingSettingsBubble;