import dotenv from 'dotenv';
dotenv.config();

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
import { setupTerminalWebSocket } from './services/terminalService.js';

const app = express();
app.set('trust proxy', 1);

// Gzip/Brotli HTTP payload compression for all API endpoints
app.use(compression({
  threshold: 1024, // Only compress responses larger than 1KB
  level: 6,
}));

// 1. Security Headers Middleware (Helmet)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// 2. CORS Configuration
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL,
  'http://localhost:5174',
  'http://localhost:5173',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or server-to-server)
    if (!origin) {
      return callback(null, true);
    }

    const isAllowed =
      allowedOrigins.includes(origin) ||
      allowedOrigins.includes(origin.replace(/\/$/, '')) ||
      /^https?:\/\/(localhost|127\.0\.0\.1|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/.test(origin);

    if (isAllowed) {
      return callback(null, true);
    }

    console.warn(`[CORS Blocked] Origin not allowed: ${origin}`);
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// 3. Body & Cookie Parsing Middlewares
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 4. Rate Limiting Configurations
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts per IP
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
    // Skip rate limiting for high-frequency telemetry polling and console tickets
    return req.path.includes('/metrics') || req.path.includes('/health') || req.path.includes('/console-session');
  },
});

// Apply rate limiting
app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Attach in-browser Web Terminal WebSocket server
setupTerminalWebSocket(server);

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(`Web Terminal WebSocket server attached to /ws/terminal`);
});