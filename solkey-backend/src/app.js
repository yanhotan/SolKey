const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const passport = require('passport');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const config = require('./config/env');
const databaseService = require('./config/database.test');
const { 
    securityHeaders, 
    validateContentType, 
    validateOrigin,
    sanitizeRequestBody,
    validateRequestSize 
} = require('./middleware/security.middleware');

const authRoutes = require('./routes/auth.routes');
const paymentsRoutes = require('./routes/payments.routes');
const projectsRoutes = require('./routes/projects.routes');
const secretsRoutes = require('./routes/secrets.routes');
const teamsRoutes = require('./routes/teams.routes');

const { authenticateToken } = require('./middleware/auth.middleware');
const errorHandler = require('./middleware/error.handler');

const app = express();

// Single CORS configuration
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:4000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-wallet-signature'],
    credentials: true,
    maxAge: config.cors.maxAge
}));

// Enhanced security headers with config
app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for development
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false
}));

// Single body parser configuration with consistent limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure content type for POST requests
app.use((req, res, next) => {
    if (req.method === 'POST') {
        res.setHeader('Content-Type', 'application/json');
    }
    next();
});
app.use(sanitizeRequestBody);

// Rate limiting from config
const authLimiter = rateLimit(config.rateLimit.auth);
const apiLimiter = rateLimit(config.rateLimit.api);
const secretsLimiter = rateLimit(config.rateLimit.secrets);

app.use('/api/auth', authLimiter);
app.use('/api/secrets', secretsLimiter);
app.use('/api/', apiLimiter);

// Initialize database connection
databaseService.connect()
    .catch(err => {
        console.error('Failed to connect to database:', err);
        process.exit(1);
    });

// Passport initialization
require('./config/passport');
app.use(passport.initialize());

// Enhanced health check endpoint
app.get('/health', async (req, res) => {
    try {
        const dbHealth = await databaseService.healthCheck();
        res.status(200).json({ 
            status: 'healthy',
            timestamp: new Date().toISOString(),
            database: dbHealth,
            environment: config.nodeEnv,
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage()
        });
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

// API routes - temporarily removed authentication for testing
app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/secrets', secretsRoutes);
app.use('/api/teams', teamsRoutes);

// Error handling middleware should be after all routes
app.use(errorHandler);

// Enhanced error handling for unhandled rejections and exceptions
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err);
    // Graceful shutdown on critical errors
    if (err.critical) {
        process.exit(1);
    }
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    // Graceful shutdown
    process.exit(1);
});

module.exports = app;