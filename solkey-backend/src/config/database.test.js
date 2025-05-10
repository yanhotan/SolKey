const mongoose = require('mongoose');

class TestDatabaseService {
    constructor() {
        this.maxRetries = 5;
        this.retryDelay = 5000;
        this.isConnected = false;
        this.connectionPromise = null;
    }

    async connect() {
        if (this.isConnected) {
            return;
        }

        try {            const connection = await mongoose.connect('mongodb://localhost:27017/test', {
                serverSelectionTimeoutMS: 5000,
                family: 4
            });

            console.log('Connected to test database');
            this.isConnected = true;
            await this._createIndexes(connection);
            return connection;
        } catch (err) {
            console.error('Failed to connect to test database:', err);
            throw err;
        }
    }

    async _createIndexes(connection) {
        const db = connection.connection;
        
        try {
            await Promise.all([
                db.collection('projects').createIndexes([
                    { key: { name: 'text', description: 'text' } }
                ]),
                db.collection('environments').createIndexes([
                    { key: { projectId: 1, name: 1 }, unique: true }
                ]),
                db.collection('secrets').createIndexes([
                    { key: { environmentId: 1, key: 1 }, unique: true }
                ])
            ]);

            console.log('Database indexes created successfully');
        } catch (err) {
            console.warn('Warning: Index creation error:', err.message);
        }
    }

    async disconnect() {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
            this.isConnected = false;
            console.log('Database connection closed');
        }
    }

    async healthCheck() {
        if (!this.isConnected) {
            throw new Error('Database not connected');
        }

        try {
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

const testDatabaseService = new TestDatabaseService();
module.exports = testDatabaseService;
