const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const userRoutes        = require('./routers/user');
const portfolioRoutes   = require('./routers/portfolioRoutes');
const cryptoRoutes      = require('./routers/cryptoRoutes');
const transactionRoutes = require('./routers/transactionRoutes');
const watchlistRoutes   = require('./routers/watchlistRoutes');
const adminRoutes       = require('./routers/adminRoutes');
const { errorHandler, notFound } = require('./middleware/error');
const { initSocketService } = require('./services/socket.service');

const app    = express();
const server = http.createServer(app);

// ── Socket.IO ──────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// ── Global Middleware ──────────────────────────────────────────────────────
app.use(helmet());
app.use(compression());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiter — 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// ── Routes ─────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    message: 'CryptoVault API',
    version: '1.0.0',
    endpoints: {
      auth:         '/api/users',
      portfolio:    '/api/portfolio',
      crypto:       '/api/crypto',
      transactions: '/api/transactions',
      watchlist:    '/api/watchlist',
      admin:        '/api/admin',
    },
  });
});

app.use('/api/users',        userRoutes);
app.use('/api/portfolio',    portfolioRoutes);
app.use('/api/crypto',       cryptoRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/watchlist',    watchlistRoutes);
app.use('/api/admin',        adminRoutes);

// ── Error Handling ─────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── DB + Server ────────────────────────────────────────────────────────────
const PORT     = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/vault_db';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      initSocketService(io);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

module.exports = app;
