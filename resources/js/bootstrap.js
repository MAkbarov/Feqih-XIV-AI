import axios from 'axios';
window.axios = axios;

// Set base URL for axios to match current origin
window.axios.defaults.baseURL = window.location.origin;
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Remove meta-based CSRF header to avoid stale tokens; rely on cookie-based CSRF
delete window.axios.defaults.headers.common['X-CSRF-TOKEN'];

// Use cookie-based CSRF (XSRF-TOKEN) to avoid stale meta token issues
window.axios.defaults.withCredentials = true;
window.axios.defaults.xsrfCookieName = 'XSRF-TOKEN';
window.axios.defaults.xsrfHeaderName = 'X-XSRF-TOKEN';

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

window.axios.interceptors.request.use((config) => {
    // Prefer XSRF-TOKEN cookie set by Laravel on each response
    const xsrf = getCookie('XSRF-TOKEN');
    if (xsrf) {
        config.headers['X-XSRF-TOKEN'] = decodeURIComponent(xsrf);
        // Ensure we do not send potentially stale X-CSRF-TOKEN header
        if (config.headers['X-CSRF-TOKEN']) delete config.headers['X-CSRF-TOKEN'];
    }
    return config;
});

// WebSocket Broadcasting deaktiv edildi
// import Echo from 'laravel-echo';
// import Pusher from 'pusher-js';

// window.Pusher = Pusher;

// WebSocket bağlantısı deaktiv edildi - real-time xüsusiyyət istifadə edilmir
// const pusherKey = import.meta.env.VITE_PUSHER_APP_KEY;
// const pusherHost = import.meta.env.VITE_PUSHER_HOST ?? '127.0.0.1';
// const pusherPort = Number(import.meta.env.VITE_PUSHER_PORT ?? 6001);
// const pusherUseTLS = (import.meta.env.VITE_PUSHER_USE_TLS ?? 'false') === 'true';

// if (pusherKey) {
//     window.Echo = new Echo({
//         broadcaster: 'pusher',
//         key: pusherKey,
//         cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER ?? 'mt1',
//         wsHost: pusherHost,
//         wsPort: pusherPort,
//         forceTLS: pusherUseTLS,
//         disableStats: true,
//         enabledTransports: ['ws', 'wss'],
//     });
// }
