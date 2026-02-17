/**
 * Main Server File - server.js
 * 
 * Entry point for the cBioPortal Data Contribution Dashboard Backend
 * 
 * Features:
 * - LevelDB for simple key-value storage
 * - Role-based access control (super users vs common users)
 * - JWT authentication
 * - RESTful API endpoints
 */

// Load environment variables FIRST before any other imports
import dotenv from 'dotenv';
dotenv.config();

// Now import everything else
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import passport, { configurePassport } from './config/passport.js';

// Configure passport AFTER dotenv is loaded
configurePassport();

// Import database initialization
import { initializeDatabases, closeDatabases } from './db/index.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import trackerRoutes from './routes/trackerRoutes.js';
import userRoutes from './routes/userRoutes.js';

// Initialize Express application
const app = express();

// ======================
// MIDDLEWARE SETUP
// ======================

/**
 * 1. HELMET - Security headers
 */
app.use(helmet());

/**
 * 2. CORS - Cross-Origin Resource Sharing
 */
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

/**
 * 3. MORGAN - HTTP request logger
 */
app.use(morgan('dev'));

/**
 * 4. BODY PARSERS
 */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * 5. RATE LIMITER
 */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// ======================
// ROUTES
// ======================

/**
 * Root Route
 */
app.get('/', (req, res) => {
  res.json({
    message: 'cBioPortal Data Contribution Dashboard API',
    version: '2.0.0',
    database: 'LevelDB',
    features: [
      'Role-based access control',
      'JWT authentication',
      'Data submission tracking'
    ],
    endpoints: {
      health: 'GET /api/health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        profile: 'GET /api/auth/profile'
      },
      tracker: {
        getAll: 'GET /api/tracker',
        getMy: 'GET /api/tracker/my',
        getOne: 'GET /api/tracker/:id',
        create: 'POST /api/tracker',
        update: 'PUT /api/tracker/:id',
        updateStatus: 'PATCH /api/tracker/:id/status',
        delete: 'DELETE /api/tracker/:id',
        stats: 'GET /api/tracker/stats'
      },
      users: {
        getAll: 'GET /api/users',
        getOne: 'GET /api/users/:id',
        changeRole: 'PUT /api/users/:id/role',
        delete: 'DELETE /api/users/:id'
      }
    },
    roles: {
      super: 'Full access to all data and user management',
      user: 'Limited access - can only see public fields in tracker'
    }
  });
});

/**
 * Health Check Route
 */
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: 'LevelDB'
  });
});

/**
 * Mount Routes
 */
app.use('/api/auth', authRoutes);
app.use('/api/tracker', trackerRoutes);
app.use('/api/users', userRoutes);

// ======================
// SWAGGER DOCS
// ======================
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url); // Re-declaring since it might be local to scope in some modules, but safe to assume module scope
// Wait, __filename might be used elsewhere. Let's just use relative path safely or rely on cwd.
// backend is cwd usually.
const swaggerDocument = YAML.load('./swagger.yaml');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// ======================
// ERROR HANDLING
// ======================

/**
 * 404 Handler - Route Not Found
 */
app.use((req, res, next) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`
  });
});

/**
 * Global Error Handler
 */
app.use((err, req, res, next) => {
  console.error('Error:', err);

  const message = process.env.NODE_ENV === 'production'
    ? 'Something went wrong!'
    : err.message;

  res.status(err.statusCode || 500).json({
    status: 'error',
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ======================
// START SERVER
// ======================

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Initialize databases
    await initializeDatabases();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`
    🚀 cBioPortal Dashboard Backend
    ================================
    📡 Port: ${PORT}
    🌍 Environment: ${process.env.NODE_ENV || 'development'}
    🗄️  Database: LevelDB
    🔗 URL: http://localhost:${PORT}
    
    🔐 Role-Based Access:
    - Super Users: Full access to all data
    - Common Users: Limited column access
    
    📚 Available endpoints:
    - GET  http://localhost:${PORT}/
    - GET  http://localhost:${PORT}/api/health
    - POST http://localhost:${PORT}/api/auth/register
    - POST http://localhost:${PORT}/api/auth/login
    - GET  http://localhost:${PORT}/api/tracker
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
async function shutdown() {
  console.log('\n🛑 Shutting down gracefully...');
  try {
    await closeDatabases();
    console.log('✅ Databases closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  shutdown();
});

// Start the server
startServer();

export default app;
