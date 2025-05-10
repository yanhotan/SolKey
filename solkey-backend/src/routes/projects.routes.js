const express = require('express');
const router = express.Router();
const projectsController = require('../controllers/projects.controller');
// Temporarily removing authentication for testing
// const { authenticateToken } = require('../middleware/auth.middleware');

router.post('/', projectsController.createProject);
router.get('/', projectsController.getAllProjects);
router.get('/:id', projectsController.getProjectById);
router.put('/:id', projectsController.updateProject);
router.delete('/:id', projectsController.deleteProject);

module.exports = router;