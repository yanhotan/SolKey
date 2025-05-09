const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod;

module.exports = async () => {
    // Create an in-memory MongoDB instance
    mongod = await MongoMemoryServer.create();
    const uri = await mongod.getUri();

    // Set test database configuration
    process.env.MONGODB_URI = uri;
    process.env.JWT_SECRET = 'test-secret';
    process.env.NODE_ENV = 'test';
    process.env.RATE_LIMIT_WINDOW = '1';
    process.env.RATE_LIMIT_MAX = '60';

    // Connect to the in-memory database
    await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

    // Clean up function
    global.__MONGOD__ = mongod;
};