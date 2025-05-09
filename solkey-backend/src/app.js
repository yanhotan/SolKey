const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const passport = require('passport');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const config = require('./config/env');
const databaseService = require('./config/database');
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

const { errorHandler } = require('./middleware/error.middleware');
const { authenticateToken } = require('./middleware/auth.middleware');

const app = express();

// Enhanced security headers with config
app.use(helmet({
    contentSecurityPolicy: {
        useDefaults: true,
        directives: {
            'default-src': ["'self'"],
            'connect-src': ["'self'", config.solana.rpcUrl],
            'script-src': ["'self'"],
            'style-src': ["'self'", "'unsafe-inline'"],
            'img-src': ["'self'", "data:", "https:"],
            'upgrade-insecure-requests': null
        }
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: { policy: "same-site" }
}));

// Custom security middleware
app.use(securityHeaders);
app.use(validateContentType);
app.use(validateOrigin(config.cors.allowedOrigins));
app.use(validateRequestSize('2mb'));

// CORS configuration from config
app.use(cors({
    origin: config.cors.allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: config.cors.maxAge
}));

// Request body parsing with sanitization
app.use(bodyParser.json({ limit: '2mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '2mb' }));
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

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/payments', authenticateToken, paymentsRoutes);
app.use('/api/projects', authenticateToken, projectsRoutes);
app.use('/api/secrets', authenticateToken, secretsRoutes);
app.use('/api/teams', authenticateToken, teamsRoutes);

// Error handling
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