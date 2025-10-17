import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/js/app.jsx', 'resources/css/app.css'],
            refresh: true,
        }),
        react(),
    ],
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom', '@inertiajs/react'],
                    markdown: ['react-markdown', 'remark-gfm', 'rehype-sanitize']
                }
            }
        }
    },
    server: {
        hmr: {
            host: 'localhost',
        },
        host: true,
    },
});
