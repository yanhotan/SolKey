const mongoose = require('mongoose');
const config = require('./env');

class DatabaseService {
    constructor() {
        this.maxRetries = 5;
        this.retryDelay = 5000; // 5 seconds
        this.isConnected = false;
        this.connectionPromise = null;
    }

    async connect() {
        if (this.isConnected) {
            return;
        }

        // If already trying to connect, return existing promise
        if (this.connectionPromise) {
            return this.connectionPromise;
        }

        this.connectionPromise = this._connectWithRetry();
        return this.connectionPromise;
    }

    async _connectWithRetry(retryCount = 0) {
        try {
            const connection = await mongoose.connect(config.mongodb.uri, {
                ...config.mongodb.options,
                maxPoolSize: 50,
                minPoolSize: 10,
                socketTimeoutMS: 45000,
                connectTimeoutMS: 10000,
                maxIdleTimeMS: 30000
            });

            // Set up connection monitoring
            mongoose.connection.on('connected', () => {
                console.log('MongoDB connected successfully');
                this.isConnected = true;
            });

            mongoose.connection.on('error', (err) => {
                console.error('MongoDB connection error:', err);
                this.isConnected = false;
            });

            mongoose.connection.on('disconnected', () => {
                console.log('MongoDB disconnected');
                this.isConnected = false;
                // Attempt to reconnect
                if (!this.isConnecting) {
                    this.connect();
                }
            });

            // Create indexes
            await this._createIndexes(connection);

            console.log('Database configuration complete');
            this.isConnected = true;
            this.connectionPromise = null;
            return connection;

        } catch (err) {
            console.error(`Database connection attempt ${retryCount + 1} failed:`, err);

            if (retryCount < this.maxRetries) {
                console.log(`Retrying in ${this.retryDelay / 1000} seconds...`);
                await new Promise(resolve => setTimeout(resolve, this.retryDelay));
                return this._connectWithRetry(retryCount + 1);
            }

            this.connectionPromise = null;
            throw new Error('Failed to connect to database after multiple attempts');
        }
    }

    async _createIndexes(connection) {
        const db = connection.connection;
        
        try {
            await Promise.all([
                // User indexes
                db.collection('users').createIndexes([
                    { key: { email: 1 }, unique: true },
                    { key: { walletAddress: 1 }, unique: true, sparse: true },
                    { key: { 'subscription.expiresAt': 1 }, background: true }
                ]),

                // Project indexes
                db.collection('projects').createIndexes([
                    { key: { owner: 1, name: 1 }, unique: true },
                    { key: { name: 'text', description: 'text' } },
                    { key: { 'team.user': 1 }, background: true }
                ]),

                // Environment indexes
                db.collection('environments').createIndexes([
                    { key: { projectId: 1, name: 1 }, unique: true },
                    { key: { type: 1 }, background: true }
                ]),

                // Secret indexes
                db.collection('secrets').createIndexes([
                    { key: { environmentId: 1, key: 1 }, unique: true },
                    { key: { createdBy: 1 }, background: true },
                    { key: { version: 1 }, background: true }
                ]),

                // Payment indexes
                db.collection('payments').createIndexes([
                    { key: { userId: 1, createdAt: -1 } },
                    { key: { status: 1, createdAt: -1 } },
                    { key: { transactionHash: 1 }, unique: true, sparse: true }
                ])
            ]);

            console.log('Database indexes created successfully');
        } catch (err) {
            console.warn('Warning: Index creation error:', err.message);
            // Don't throw error for index creation failures
            // as they might already exist
        }
    }

    async disconnect() {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
            this.isConnected = false;
            console.log('Database connection closed');
        }
    }

    // Health check method
    async healthCheck() {
        if (!this.isConnected) {
            throw new Error('Database not connected');
        }

        try {
            // Perform a simple command to test connection
            await mongoose.connection.db.admin().ping();
            return {
                status: 'healthy',
                latency: await this._checkLatency()
            };
        } catch (err) {
            throw new Error('Database health check failed: ' + err.message);
        }
    }

    async _checkLatency() {
        const start = Date.now();
        await mongoose.connection.db.admin().ping();
        return Date.now() - start;
    }
}

// Create singleton instance
const databaseService = new DatabaseService();

// Handle application termination
process.on('SIGINT', async () => {
    await databaseService.disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await databaseService.disconnect();
    process.exit(0);
});

module.exports = databaseService;