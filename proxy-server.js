import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';

const app = express();
const PORT = 3000;

// Enable CORS for all routes
app.use(cors());

// Proxy endpoint for Home Assistant
app.use('/api/ha-proxy', createProxyMiddleware({
  target: 'http://placeholder.local:8123', // This will be replaced dynamically
  changeOrigin: true,
  pathRewrite: {
    '^/api/ha-proxy': '', // Remove the proxy prefix
  },
  router: (req) => {
    // Get the target URL from the custom header
    const targetUrl = req.headers['x-ha-url'];
    if (targetUrl) {
      console.log(`Proxying request to: ${targetUrl}`);
      return targetUrl;
    }
    return 'http://placeholder.local:8123';
  },
  onProxyReq: (proxyReq, req, res) => {
    // Forward the authorization header
    if (req.headers.authorization) {
      proxyReq.setHeader('Authorization', req.headers.authorization);
    }
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err.message);
    res.status(500).json({
      error: 'Proxy error',
      message: err.message
    });
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Proxy server is running' });
});

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
  console.log(`Use http://localhost:${PORT}/api/ha-proxy as your Home Assistant proxy`);
});