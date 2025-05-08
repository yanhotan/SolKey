const express = require('express');
const router = express.Router();
const projectsController = require('../controllers/projects.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

router.post('/', authenticateToken, projectsController.createProject);
router.get('/', authenticateToken, projectsController.getAllProjects);
router.get('/:id', authenticateToken, projectsController.getProjectById);
router.put('/:id', authenticateToken, projectsController.updateProject);
router.delete('/:id', authenticateToken, projectsController.deleteProject);

module.exports = router;