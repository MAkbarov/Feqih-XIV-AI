import axios from 'axios';
window.axios = axios;

// Set base URL for axios to match current origin
window.axios.defaults.baseURL = window.location.origin;
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

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
