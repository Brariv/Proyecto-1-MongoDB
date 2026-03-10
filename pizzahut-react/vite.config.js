import { defineConfig } from 'vite';
import http from 'node:http';

const forwardGetWithBody = (path, body) =>
  new Promise((resolve, reject) => {
    const request = http.request(
      `http://127.0.0.1:8000${path}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (response) => {
        const chunks = [];

        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => {
          resolve({
            statusCode: response.statusCode || 500,
            body: Buffer.concat(chunks),
            contentType: response.headers['content-type'] || 'application/json',
          });
        });
      },
    );

    request.on('error', reject);
    request.write(body);
    request.end();
  });

export default defineConfig({
  plugins: [
    {
      name: 'fastapi-get-body-bridge',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          try {
            if (req.method === 'GET' && req.url?.startsWith('/api/login')) {
              const parsedUrl = new URL(req.url, 'http://localhost');
              const email = parsedUrl.searchParams.get('email') || '';
              const password = parsedUrl.searchParams.get('password') || '';

              const backendResponse = await forwardGetWithBody(
                '/login',
                JSON.stringify({ email, password }),
              );
              res.statusCode = backendResponse.statusCode;
              res.setHeader('Content-Type', backendResponse.contentType);
              res.end(backendResponse.body);
              return;
            }

            if (req.method === 'POST' && req.url === '/api/login') {
              const chunks = [];
              req.on('data', (chunk) => chunks.push(chunk));
              await new Promise((resolve) => req.on('end', resolve));

              const rawBody = Buffer.concat(chunks).toString('utf-8') || '{}';
              const backendResponse = await forwardGetWithBody('/login', rawBody);
              res.statusCode = backendResponse.statusCode;
              res.setHeader('Content-Type', backendResponse.contentType);
              res.end(backendResponse.body);
              return;
            }

            const reviewMatch =
              req.method === 'GET' && req.url ? req.url.match(/^\/api\/reviews\/([^?]+)(\?.*)?$/) : null;

            if (reviewMatch) {
              const userId = reviewMatch[1];
              const queryParams = new URLSearchParams(reviewMatch[2] || '');
              const restaurantId = queryParams.get('restaurant_id') || '';

              if (restaurantId) {
                const backendResponse = await forwardGetWithBody(
                  `/reviews/${userId}`,
                  JSON.stringify({ restaurant_id: restaurantId }),
                );
                res.statusCode = backendResponse.statusCode;
                res.setHeader('Content-Type', backendResponse.contentType);
                res.end(backendResponse.body);
                return;
              }
            }

            next();
          } catch {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ detail: 'No se pudo conectar con el backend.' }));
          }
        });
      },
    },
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
