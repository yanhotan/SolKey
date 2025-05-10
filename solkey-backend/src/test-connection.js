const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
    try {
        console.log('Testing MongoDB connection...');
        
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000
        });

        console.log('Successfully connected to MongoDB!');
        console.log('Database:', mongoose.connection.db.databaseName);

        // List collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Available collections:', collections.map(c => c.name));

        // Test creating a new collection
        if (!collections.find(c => c.name === 'test_connection')) {
            await mongoose.connection.db.createCollection('test_connection');
            console.log('Successfully created test collection');
            await mongoose.connection.db.dropCollection('test_connection');
            console.log('Successfully dropped test collection');
        }

        await mongoose.connection.close();
        console.log('Connection closed successfully');
        process.exit(0);
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
}

testConnection();