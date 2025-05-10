require('dotenv').config({ path: '.env.local' });

const requiredEnvVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'SOLANA_NETWORK',
    'SOLANA_RPC_URL'
];

// Validate required environment variables
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
    }
}

const config = {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '4000'),  // Always use port 4000 unless explicitly set
    mongodb: {        uri: process.env.MONGODB_URI || 'mongodb://admin:adminpassword@localhost:27017/solkey?authSource=admin',
        options: {
            serverSelectionTimeoutMS: process.env.NODE_ENV === 'test' ? 1000 : 30000,
            retryWrites: true,
            w: 'majority',
            maxPoolSize: 50,
            minPoolSize: 10,
            maxIdleTimeMS: 30000,
            socketTimeoutMS: 45000,
            connectTimeoutMS: 10000,
            authSource: 'admin'
        }
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'your-secret-key',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    },
    cors: {
        allowedOrigins: process.env.ALLOWED_ORIGINS ? 
            process.env.ALLOWED_ORIGINS.split(',') : 
            ['http://localhost:5173', 'http://localhost:3000'],
        maxAge: 86400
    },
    rateLimit: {
        auth: {
            windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'),
            max: parseInt(process.env.RATE_LIMIT_MAX || '100')
        },
        api: {
            windowMs: 900000,
            max: 1000
        },
        secrets: {
            windowMs: 900000,
            max: 50
        }
    },
    solana: {
        rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
        commitment: 'confirmed'
    }
};

// Test environment overrides
if (config.nodeEnv === 'test') {
    config.mongodb.uri = process.env.MONGODB_URI; // Will be set by test setup
    config.rateLimit.auth.max = 60;
    config.rateLimit.auth.windowMs = 1000;
}

module.exports = config;