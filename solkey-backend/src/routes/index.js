const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const paymentsRoutes = require('./payments.routes');
const projectsRoutes = require('./projects.routes');
const secretsRoutes = require('./secrets.routes');
const teamsRoutes = require('./teams.routes');

router.use('/auth', authRoutes);
router.use('/payments', paymentsRoutes);
router.use('/projects', projectsRoutes);
router.use('/secrets', secretsRoutes);
router.use('/teams', teamsRoutes);

module.exports = router;