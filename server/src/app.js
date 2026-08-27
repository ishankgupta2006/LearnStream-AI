require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const videoRoutes = require('./routes/videos');
const quizRoutes = require('./routes/quiz');
const historyRoutes = require('./routes/history');
const statsRoutes = require('./routes/stats');
const folderRoutes = require('./routes/folders');

// Import middleware
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();

// ═══════════════════════════════════════════════════════════
// MIDDLEWARE
// ═══════════════════════════════════════════════════════════

// CORS configuration - support multiple origins
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map(url => url.trim());

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all origins in development
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// ═══════════════════════════════════════════════════════════
// DATABASE CONNECTION (for serverless)
// ═══════════════════════════════════════════════════════════

let isConnected = false;

async function connectToDatabase() {
  if (isConnected) return;
  try {
    await connectDB();
    isConnected = true;
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
}

// Middleware to ensure DB connection for each request
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Database connection failed',
      code: 'DB_ERROR'
    });
  }
});

// Request logging (development)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
    next();
  });
}

// ═══════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'LearnStream API',
    version: '1.0.0',
    status: 'running',
    documentation: '/api'
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API info
app.get('/api', (req, res) => {
  res.json({
    name: 'LearnStream API',
    version: '1.0.0',
    description: 'Backend API for Smart Video Learning Dashboard',
    endpoints: {
      auth: '/api/auth',
      videos: '/api/videos',
      quiz: '/api/quiz',
      history: '/api/history',
      stats: '/api/stats'
    }
  });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/folders', folderRoutes);

// ═══════════════════════════════════════════════════════════
// ERROR HANDLING
// ═══════════════════════════════════════════════════════════

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// ═══════════════════════════════════════════════════════════
// SERVER STARTUP
// ═══════════════════════════════════════════════════════════

const PORT = process.env.PORT || 3001;

// For local development - start the server
if (process.env.NODE_ENV !== 'production' && require.main === module) {
  async function startServer() {
    try {
      // Connect to MongoDB
      await connectDB();
      isConnected = true;
      
      // Start server
      app.listen(PORT, () => {
        console.log(`\n========================================`);
        console.log(`🚀 LearnStream API Server`);
        console.log(`========================================`);
        console.log(`✓ Server running on port ${PORT}`);
        console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`✓ API URL: http://localhost:${PORT}/api`);
        console.log(`========================================\n`);
      });
    } catch (error) {
      console.error('Failed to start server:', error.message);
      process.exit(1);
    }
  }

  startServer();

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
  });
}

// Export for Vercel serverless
module.exports = app;
