import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, path.resolve(), '');
    
    // Explicitly check process.env.PORT for Cloud Run, fallback to env file, then 8080
    const port = process.env.PORT ? parseInt(process.env.PORT) : (env.PORT ? parseInt(env.PORT) : 8080);

    return {
      server: {
        port: port,
        host: '0.0.0.0',
        strictPort: true, // Fail if port is already in use
      },
      preview: {
        port: port,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve('.'),
        }
      }
    };
});