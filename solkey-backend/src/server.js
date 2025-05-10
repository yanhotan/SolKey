const express = require('express');
const app = require('./app');
const databaseService = require('./config/database.test');
const config = require('./config/env');

async function startServer() {
    try {
        // Connect to database first
        await databaseService.connect();

        const server = app.listen(config.port, () => {
            console.log(`Server is running on port ${config.port}`);
            console.log(`Environment: ${config.nodeEnv}`);
        });

        // Implement graceful shutdown
        const gracefulShutdown = async (signal) => {
            console.log(`${signal} received. Starting graceful shutdown...`);
            
            // First stop accepting new requests
            server.close(async () => {
                console.log('Server stopped accepting new connections');
                
                try {
                    // Close database connection
                    await databaseService.disconnect();
                    console.log('Database connections closed');
                    
                    console.log('Graceful shutdown completed');
                    process.exit(0);
                } catch (err) {
                    console.error('Error during graceful shutdown:', err);
                    process.exit(1);
                }
            });

            // Force shutdown after 30 seconds
            setTimeout(() => {
                console.error('Could not close connections in time, forcefully shutting down');
                process.exit(1);
            }, 30000);
        };

        // Handle various shutdown signals
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

        // Handle uncaught errors
        process.on('uncaughtException', (error) => {
            console.error('Uncaught Exception:', error);
            gracefulShutdown('Uncaught Exception');
        });

        process.on('unhandledRejection', (reason, promise) => {
            console.error('Unhandled Rejection at:', promise, 'reason:', reason);
            gracefulShutdown('Unhandled Rejection');
        });

    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Start the server
startServer();