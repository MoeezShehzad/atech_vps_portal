import dotenv from 'dotenv';
dotenv.config();

// Global BigInt JSON serialization support for Prisma BigInt IDs (Invoices, Payments, Logs)
BigInt.prototype.toJSON = function () {
  return this.toString();
};

import http from 'http';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import userRoutes from './routes/user.js';
import authRoutes from './routes/authRoutes.js';
import contactRoutes from './routes/contact.js';
import pricingRoutes from './routes/pricing.js';
import vmRoutes from './routes/vmRoutes.js';
import sshKeyRoutes from './routes/sshKeyRoutes.js';
import securityRoutes from './routes/securityRoutes.js';
import billingRoutes from './routes/billingRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import appStoreRoutes from './routes/appStoreRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import geoRoutes from './routes/geoRoutes.js';
import siteRoutes from './routes/siteRoutes.js';
import { setupTerminalWebSocket } from './services/terminalService.js';
import { startTicketAutomationWorker } from './services/ticketAutomationService.js';
import { startTrialAutomationWorker } from './services/trialService.js';

const app = express();
app.set('trust proxy', 1);

// Gzip/Brotli HTTP payload compression for all API endpoints
app.use(compression({
  threshold: 1024, // Only compress responses larger than 1KB
  level: 6,
}));

import { apiCache } from './services/cacheService.js';

// 1. Security Headers Middleware (Helmet) - XSS, MIME sniffing, Clickjacking Protection
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  xContentTypeOptions: true,
  xXssProtection: true,
  hidePoweredBy: true,
}));

// 2. CORS Configuration (Tightened for Production)
const allowedOrigins = [
  'https://www.atechconsult.com',
  'https://atechconsult.com',
  'http://www.atechconsult.com',
  'http://atechconsult.com',
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL,
  'http://localhost:5174',
  'http://localhost:5173',
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()) : []),
].filter(Boolean);

const isProduction = process.env.NODE_ENV === 'production';

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (like mobile apps, curl, or internal microservices)
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = origin.replace(/\/$/, '');
    const isExplicitlyAllowed = allowedOrigins.some((o) => o.replace(/\/$/, '') === normalizedOrigin);

    if (isExplicitlyAllowed) {
      return callback(null, true);
    }

    // In development mode only: allow local development subnets
    if (!isProduction && /^https?:\/\/(localhost|127\.0\.0\.1|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }

    console.warn(`[CORS Blocked] Unauthorized origin rejected: ${origin}`);
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-OTP-Session', 'X-Sudo-Token'],
  maxAge: 86400, // Cache preflight response for 24 hours
}));

// 3. Body & Cookie Parsing Middlewares
app.use(cookieParser());
app.use(
  express.json({
    limit: '10mb',
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 4. Rate Limiting Configurations
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 25, // 25 attempts per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please try again after 15 minutes.' },
});

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 contact submissions per IP per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many contact messages submitted. Please try again in an hour.' },
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000, // High ceiling to support live dashboard telemetry and management
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for high-frequency telemetry polling
    return req.path.includes('/metrics') || req.path.includes('/health');
  },
});

// Apply rate limiting
app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/verify-otp', authLimiter);
app.use('/api/auth/send-otp', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/auth/reset-password-otp', authLimiter);
app.use('/api/auth/sudo/verify-otp', authLimiter);
app.use('/api/contact', contactLimiter);

// 5. Route Mounting
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/user', userRoutes); // Alias for compatibility
app.use('/api/contact', contactRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/vms', vmRoutes);
app.use('/api/ssh-keys', sshKeyRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/logs', securityRoutes); // Alias for convenience
app.use('/api/billing', billingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/apps', appStoreRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/geo', geoRoutes);
app.use('/api/sites', siteRoutes);

// Public announcements route for website navbar ticker (Cached for 5 minutes)
app.get('/api/announcements', async (req, res) => {
  try {
    const cached = apiCache.get('announcements:public');
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json({ success: true, announcements: cached });
    }

    const prismaModule = (await import('./lib/prisma.js')).default;
    const announcements = await prismaModule.systemAnnouncement.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    apiCache.set('announcements:public', announcements, 5 * 60 * 1000);
    res.setHeader('X-Cache', 'MISS');
    res.json({ success: true, announcements });
  } catch (error) {
    console.error('Fetch public announcements error:', error.message);
    res.json({ success: true, announcements: [] });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root route: Redirect browser requests to the frontend portal or return API status
app.get('/', (req, res) => {
  const acceptsHtml = req.accepts(['html', 'json']) === 'html';
  const frontendUrl = process.env.FRONTEND_URL || `http://${req.hostname}:5174`;
  if (acceptsHtml) {
    return res.redirect(frontendUrl);
  }
  res.json({
    status: 'ok',
    message: 'ATC Cloud VPS Portal API is running',
    frontend: frontendUrl,
    version: '1.0.0',
  });
});

// Centralized Production Error Handling Middleware (Disables Production Debugging / Stack Trace Leaks)
app.use((err, req, res, next) => {
  console.error('[Unhandled API Error]:', err.message);
  const isProd = process.env.NODE_ENV === 'production';
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    error: isProd && status === 500 ? 'An internal server error occurred. Please try again later.' : (err.message || 'Internal Server Error'),
    ...(isProd ? {} : { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Attach in-browser Web Terminal WebSocket server
setupTerminalWebSocket(server);

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(`Web Terminal WebSocket server attached to /ws/terminal`);
  startTicketAutomationWorker();
  startTrialAutomationWorker();
});