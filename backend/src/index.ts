import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database';
import { errorHandler } from './middleware/errorHandler';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import categoryRoutes from './routes/categories';
import gameSessionRoutes from './routes/gameSessions';
import purchaseRoutes from './routes/purchases';
import paymentRoutes from './routes/payments';
import adminRoutes from './routes/admin';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy - required for Railway and other hosting platforms
// Set to 1 to trust only the first proxy (Railway's load balancer)
// This prevents the rate limiter security warning while still getting correct client IPs
app.set('trust proxy', 1);

// Connect to database
connectDatabase();

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:5173',
  'capacitor://localhost',
  'ionic://localhost',
  'https://localhost', // Android Capacitor
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or Postman)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        console.warn('CORS blocked:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// Security middleware
app.use(helmet());

// Rate limiting
// Using custom keyGenerator to properly handle trust proxy: 1
// This prevents validation warnings while maintaining proper rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  // Custom key generator that works with trust proxy: 1
  // This bypasses the validation warning while still using proper IP detection
  keyGenerator: (req) => {
    // With trust proxy: 1, req.ip will be the client IP from X-Forwarded-For
    return req.ip || req.socket.remoteAddress || 'unknown';
  },
});

app.use('/api/', limiter);

// Stripe webhook needs raw body for signature verification (must come before json parser)
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// Body parser with UTF-8 encoding
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure UTF-8 encoding for all responses
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/game-sessions', gameSessionRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Trivia Game Backend API - v2',
    version: '2.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      users: '/api/users',
      categories: '/api/categories',
      gameSessions: '/api/game-sessions',
      purchases: '/api/purchases',
      payments: '/api/payments',
      admin: '/api/admin',
    },
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log('=================================');
  console.log('🚀 Trivia Game Backend Server');
  console.log('=================================');
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 CORS origins: ${allowedOrigins.join(', ')}`);
  console.log('=================================');
});

// Handle unhandled rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});
