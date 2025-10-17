<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover, user-scalable=no">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <style>
            /* Fix Edge responsive issues */
            @media screen and (-ms-high-contrast: active), (-ms-high-contrast: none) {
                .md\:col-span-1 { width: 25% !important; }
                .md\:col-span-3 { width: 75% !important; }
                .md\:grid-cols-4 { display: flex !important; }
            }
            /* Ensure proper mobile viewport */
            @media (max-width: 767px) {
                body { -webkit-text-size-adjust: 100%; }
            }
        </style>

<title inertia>{{ \App\Models\Settings::get('site_name', 'XIV AI Chatbot Platform') }}</title>

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net" crossorigin>
        <link rel="dns-prefetch" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=archivo-narrow:400,500&display=swap" rel="stylesheet" />
        <style>
            body { font-family: 'Archivo Narrow', ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"; font-weight: 500; }
        </style>

        <!-- Meta tags for CSP and PWA -->
        <meta name="csrf-token" content="{{ csrf_token() }}">
        
        <!-- Dynamic Meta Theme Colors -->
        @php
            $primaryColor = \App\Models\Settings::get('primary_color', '#6366F1');
            $secondaryColor = \App\Models\Settings::get('secondary_color', '#8B5CF6');
            $darkModeColor = '#1f2937'; // Dark grayish-blue for dark mode
        @endphp
        
        <!-- Primary theme color for browser UI -->
        <meta name="theme-color" content="{{ $primaryColor }}">
        <meta name="theme-color" media="(prefers-color-scheme: light)" content="{{ $primaryColor }}">
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content="{{ $darkModeColor }}">
        
        <!-- Mobile Safari status bar style -->
        <meta name="apple-mobile-web-app-status-bar-style" content="default">
        <meta name="apple-mobile-web-app-capable" content="yes">
        
        <!-- Favicon and Icons -->
        @php
            $faviconUrl = \App\Models\Settings::get('favicon_url');
        @endphp
        
        @if($faviconUrl)
            <!-- Standard favicon -->
            <link rel="icon" type="image/x-icon" href="{{ $faviconUrl }}">
            <link rel="shortcut icon" href="{{ $faviconUrl }}">
            
            <!-- Apple Touch Icons -->
            <link rel="apple-touch-icon" sizes="57x57" href="{{ $faviconUrl }}">
            <link rel="apple-touch-icon" sizes="60x60" href="{{ $faviconUrl }}">
            <link rel="apple-touch-icon" sizes="72x72" href="{{ $faviconUrl }}">
            <link rel="apple-touch-icon" sizes="76x76" href="{{ $faviconUrl }}">
            <link rel="apple-touch-icon" sizes="114x114" href="{{ $faviconUrl }}">
            <link rel="apple-touch-icon" sizes="120x120" href="{{ $faviconUrl }}">
            <link rel="apple-touch-icon" sizes="144x144" href="{{ $faviconUrl }}">
            <link rel="apple-touch-icon" sizes="152x152" href="{{ $faviconUrl }}">
            <link rel="apple-touch-icon" sizes="180x180" href="{{ $faviconUrl }}">
            
            <!-- Android Chrome Icons -->
            <link rel="icon" type="image/png" sizes="16x16" href="{{ $faviconUrl }}">
            <link rel="icon" type="image/png" sizes="32x32" href="{{ $faviconUrl }}">
            <link rel="icon" type="image/png" sizes="96x96" href="{{ $faviconUrl }}">
            <link rel="icon" type="image/png" sizes="192x192" href="{{ $faviconUrl }}">
            <link rel="icon" type="image/png" sizes="512x512" href="{{ $faviconUrl }}">
            
            <!-- Microsoft tiles -->
            <meta name="msapplication-TileImage" content="{{ $faviconUrl }}">
        @else
            <!-- Default favicon fallback -->
            <link rel="icon" type="image/x-icon" href="/favicon.ico">
            <link rel="shortcut icon" href="/favicon.ico">
            
            <!-- Check for favicon.png as fallback -->
            @if(file_exists(public_path('favicon.png')))
                <link rel="icon" type="image/png" href="/favicon.png">
                <link rel="apple-touch-icon" href="/favicon.png">
            @endif
        @endif
        
        <!-- Microsoft tiles -->
        <meta name="msapplication-TileColor" content="{{ $primaryColor }}">
        <meta name="msapplication-navbutton-color" content="{{ $primaryColor }}">
        
        <!-- PWA Manifest -->
        @if($faviconUrl)
            <link rel="manifest" href="/manifest.json">
        @endif
        
        <!-- Additional mobile optimizations -->
        <meta name="format-detection" content="telephone=no">
        <meta name="mobile-web-app-capable" content="yes">
        
        <!-- Search Engine and Social Media Meta -->
        <meta name="robots" content="index, follow">
        <meta name="googlebot" content="index, follow">
        <link rel="canonical" href="{{ request()->url() }}">
        
        <!-- Open Graph / Facebook -->
        <meta property="og:type" content="website">
        <meta property="og:url" content="{{ request()->url() }}">
        <meta property="og:title" content="{{ \App\Models\Settings::get('site_name', 'XIV AI Chatbot Platform') }}">
        <meta property="og:description" content="AI-powered chatbot platform with advanced conversational capabilities">
        @if($faviconUrl)
            <meta property="og:image" content="{{ $faviconUrl }}">
        @endif
        <meta property="og:site_name" content="{{ \App\Models\Settings::get('site_name', 'XIV AI Chatbot Platform') }}">
        
        <!-- Twitter -->
        <meta property="twitter:card" content="summary_large_image">
        <meta property="twitter:url" content="{{ request()->url() }}">
        <meta property="twitter:title" content="{{ \App\Models\Settings::get('site_name', 'XIV AI Chatbot Platform') }}">
        <meta property="twitter:description" content="AI-powered chatbot platform with advanced conversational capabilities">
        @if($faviconUrl)
            <meta property="twitter:image" content="{{ $faviconUrl }}">
        @endif
        
        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.jsx', 'resources/css/app.css'])
        @inertiaHead
    </head>
    <body class="antialiased">
        @inertia
    </body>
</html>

