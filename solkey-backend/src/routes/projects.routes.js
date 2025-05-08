const express = require('express');
const router = express.Router();
const projectsController = require('../controllers/projects.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Route to create a new project
router.post('/', authMiddleware.authenticate, projectsController.createProject);

// Route to get all projects
router.get('/', authMiddleware.authenticate, projectsController.getAllProjects);

// Route to get a specific project by ID
router.get('/:id', authMiddleware.authenticate, projectsController.getProjectById);

// Route to update a project by ID
router.put('/:id', authMiddleware.authenticate, projectsController.updateProject);

// Route to delete a project by ID
router.delete('/:id', authMiddleware.authenticate, projectsController.deleteProject);

module.exports = router;