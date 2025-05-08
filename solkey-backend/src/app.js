// filepath: solkey-backend/src/app.js

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth.routes');
const paymentsRoutes = require('./routes/payments.routes');
const projectsRoutes = require('./routes/projects.routes');
const secretsRoutes = require('./routes/secrets.routes');
const teamsRoutes = require('./routes/teams.routes');
const errorMiddleware = require('./middleware/error.middleware');

const app = express();

// Middleware for parsing JSON bodies
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/secrets', secretsRoutes);
app.use('/api/teams', teamsRoutes);

// Error handling middleware
app.use(errorMiddleware);

// Export the app for use in the server file
module.exports = app;