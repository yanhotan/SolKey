const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth.routes');
const paymentsRoutes = require('./payments.routes');
const projectsRoutes = require('./projects.routes');
const secretsRoutes = require('./secrets.routes');
const teamsRoutes = require('./teams.routes');

// Define main route handlers
router.use('/auth', authRoutes); // Authentication routes
router.use('/payments', paymentsRoutes); // Payment-related routes
router.use('/projects', projectsRoutes); // Project management routes
router.use('/secrets', secretsRoutes); // Secrets management routes
router.use('/teams', teamsRoutes); // Team management routes

module.exports = router;