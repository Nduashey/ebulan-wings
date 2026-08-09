import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createProxyMiddleware } from 'http-proxy-middleware';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || '*',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.',
});

app.use('/api/', limiter);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'api-gateway' });
});

// Service routes with proxy
const services = {
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  booking: process.env.BOOKING_SERVICE_URL || 'http://localhost:3002',
  driver: process.env.DRIVER_SERVICE_URL || 'http://localhost:3003',
  payment: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3004',
  notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005',
  location: process.env.LOCATION_SERVICE_URL || 'http://localhost:3006',
  admin: process.env.ADMIN_SERVICE_URL || 'http://localhost:3007',
};

// Common proxy options
const proxyOptions = {
  changeOrigin: true,
  logLevel: 'debug' as const,
  timeout: 30000, // 30 second timeout
  proxyTimeout: 30000,
  onError: (err: Error, req: Request, res: Response) => {
    console.error('Proxy error:', err);
    res.status(502).json({
      success: false,
      error: 'Service temporarily unavailable',
    });
  },
  onProxyReq: (proxyReq: any, req: Request, res: Response) => {
    // Ensure body is sent for POST/PUT/PATCH
    if (req.body && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  },
};

// Auth Service Proxies (includes SSI)
app.use('/api/auth', createProxyMiddleware({
  ...proxyOptions,
  target: services.auth,
  pathRewrite: { '^/api/auth': '/api/auth' },
}));

app.use('/api/ssi', createProxyMiddleware({
  ...proxyOptions,
  target: services.auth,
  pathRewrite: { '^/api/ssi': '/api/ssi' },
}));

app.use('/api/otp', createProxyMiddleware({
  ...proxyOptions,
  target: services.auth,
  pathRewrite: { '^/api/otp': '/api/otp' },
}));

// Other Service Proxies
app.use('/api/bookings', createProxyMiddleware({
  ...proxyOptions,
  target: services.booking,
  pathRewrite: { '^/api/bookings': '/api/bookings' },
}));

app.use('/api/drivers', createProxyMiddleware({
  ...proxyOptions,
  target: services.driver,
  pathRewrite: { '^/api/drivers': '/api/drivers' },
}));

app.use('/api/payments', createProxyMiddleware({
  ...proxyOptions,
  target: services.payment,
  pathRewrite: { '^/api/payments': '/api/payments' },
}));

app.use('/api/notifications', createProxyMiddleware({
  ...proxyOptions,
  target: services.notification,
  pathRewrite: { '^/api/notifications': '/api/notifications' },
}));

app.use('/api/locations', createProxyMiddleware({
  ...proxyOptions,
  target: services.location,
  pathRewrite: { '^/api/locations': '/api/locations' },
}));


// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});
