import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
// AGREGADO: Importamos el plugin de PWA
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        // CONFIGURACIÓN PWA CON TU LOGO MANUFY
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
          manifest: {
            name: 'Manufy Music',
            short_name: 'Manufy',
            description: 'Tu Hub Musical Global con IA',
            theme_color: '#000000',
            background_color: '#000000',
            display: 'standalone',
            orientation: 'portrait',
            start_url: '/',
            icons: [
              {
                // NOTA: El navegador buscará este archivo en tu carpeta 'public'
                src: 'logo.jpg', 
                sizes: '192x192', 
                type: 'image/jpeg'
              },
              {
                src: 'logo.jpg', // Usamos el mismo para alta resolución
                sizes: '512x512',
                type: 'image/jpeg'
              }
            ]
          }
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});