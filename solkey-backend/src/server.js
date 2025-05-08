// filepath: solkey-backend/src/server.js

const express = require('express');
const mongoose = require('mongoose');
const app = require('./app');
const config = require('./config/database');

// Connect to the database
mongoose.connect(config.databaseUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('Database connected successfully');
})
.catch(err => {
    console.error('Database connection error:', err);
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});