export default function ApplicationLogo(props) {
    return (
        <div className="flex items-center space-x-2">
            {/* XIV AI Logo */}
            <svg
                {...props}
                viewBox="0 0 100 100"
                xmlns="http://www.w3.org/2000/svg"
                className="w-8 h-8"
            >
                {/* Circuit Board Style Background */}
                <rect width="100" height="100" rx="20" fill="url(#gradient)" />
                
                {/* XIV Letters */}
                <text 
                    x="50" 
                    y="65" 
                    fontSize="32" 
                    fontWeight="bold" 
                    textAnchor="middle" 
                    fill="white" 
                    fontFamily="monospace"
                >
                    XIV
                </text>
                
                {/* AI Indicator */}
                <circle cx="20" cy="20" r="6" fill="#00ff88" opacity="0.8" />
                <circle cx="80" cy="20" r="6" fill="#0099ff" opacity="0.8" />
                <circle cx="20" cy="80" r="6" fill="#ff4444" opacity="0.8" />
                <circle cx="80" cy="80" r="6" fill="#ffaa00" opacity="0.8" />
                
                {/* Gradient Definition */}
                <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{stopColor:'#667eea', stopOpacity:1}} />
                        <stop offset="100%" style={{stopColor:'#764ba2', stopOpacity:1}} />
                    </linearGradient>
                </defs>
            </svg>
            
            {/* AI Text */}
            <span className="text-lg font-bold text-gray-800 hidden sm:inline">AI</span>
        </div>
    );
}
