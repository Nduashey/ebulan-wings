import express, { Request, Response } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3010;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ADMIN_CORS_ORIGINS?.split(',') || ['http://localhost:3200'],
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Stricter rate limiting for admin
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests per windowMs
  message: 'Too many admin requests, please try again later.',
});

app.use('/api/', limiter);

// Admin authentication middleware
const authenticateAdmin = (req: Request, res: Response, next: any) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Check if user is admin
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    (req as any).user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Health check (no auth required)
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'admin-gateway' });
});

// Service URLs
const services = {
  admin: process.env.ADMIN_SERVICE_URL || 'http://localhost:3007',
  booking: process.env.BOOKING_SERVICE_URL || 'http://localhost:3002',
  driver: process.env.DRIVER_SERVICE_URL || 'http://localhost:3003',
  payment: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3004',
  location: process.env.LOCATION_SERVICE_URL || 'http://localhost:3006',
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
};

// Proxy options
const proxyOptions = {
  changeOrigin: true,
  logLevel: 'debug' as const,
  onError: (err: Error, req: Request, res: Response) => {
    console.error('Proxy error:', err);
    res.status(502).json({ message: 'Bad Gateway - Service unavailable' });
  },
};

// All admin routes require authentication
app.use('/api/*', authenticateAdmin);

// Admin service routes
app.use('/api/admin', createProxyMiddleware({
  ...proxyOptions,
  target: services.admin,
  pathRewrite: { '^/api/admin': '/api/admin' },
}));

// Admin access to bookings (full control)
app.use('/api/bookings', createProxyMiddleware({
  ...proxyOptions,
  target: services.booking,
  pathRewrite: { '^/api/bookings': '/api/bookings' },
}));

// Admin access to drivers
app.use('/api/drivers', createProxyMiddleware({
  ...proxyOptions,
  target: services.driver,
  pathRewrite: { '^/api/drivers': '/api/drivers' },
}));

// Admin access to payments
app.use('/api/payments', createProxyMiddleware({
  ...proxyOptions,
  target: services.payment,
  pathRewrite: { '^/api/payments': '/api/payments' },
}));

// Admin access to locations
app.use('/api/locations', createProxyMiddleware({
  ...proxyOptions,
  target: services.location,
  pathRewrite: { '^/api/locations': '/api/locations' },
}));

// Admin access to user management
app.use('/api/users', createProxyMiddleware({
  ...proxyOptions,
  target: services.auth,
  pathRewrite: { '^/api/users': '/api/auth/users' },
}));

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: 'Admin route not found' });
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
  console.log(`🔐 Admin Gateway running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Admin CORS: ${process.env.ADMIN_CORS_ORIGINS || 'http://localhost:3200'}`);
});
