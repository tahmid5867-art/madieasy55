import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import { handleAIAssistant, handleScanInvoice, handleStockForecast } from './api/aiHandler';

function apiServerPlugin(): Plugin {
  return {
    name: 'api-server-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        // Helper to read JSON request body
        const readBody = (): Promise<any> => {
          return new Promise((resolve, reject) => {
            let data = '';
            req.on('data', (chunk) => {
              data += chunk;
            });
            req.on('end', () => {
              try {
                resolve(data ? JSON.parse(data) : {});
              } catch (e) {
                reject(e);
              }
            });
            req.on('error', reject);
          });
        };

        res.setHeader('Content-Type', 'application/json');

        try {
          if (req.url === '/api/ai/assistant' && req.method === 'POST') {
            const body = await readBody();
            const result = await handleAIAssistant(body.prompt, body.context, body.language);
            res.statusCode = 200;
            return res.end(JSON.stringify(result));
          }

          if (req.url === '/api/ai/scan-invoice' && req.method === 'POST') {
            const body = await readBody();
            const result = await handleScanInvoice(body.image, body.mimeType);
            res.statusCode = 200;
            return res.end(JSON.stringify(result));
          }

          if (req.url === '/api/ai/forecast' && req.method === 'POST') {
            const body = await readBody();
            const result = await handleStockForecast(body.inventory, body.sales, body.language);
            res.statusCode = 200;
            return res.end(JSON.stringify(result));
          }

          res.statusCode = 404;
          return res.end(JSON.stringify({ error: 'Endpoint not found' }));
        } catch (err: any) {
          console.error('API Error:', err);
          res.statusCode = 500;
          return res.end(JSON.stringify({ error: err.message || 'Server error' }));
        }
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiServerPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
