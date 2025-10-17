<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
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

