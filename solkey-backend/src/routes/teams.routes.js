const express = require('express');
const router = express.Router();
const teamsController = require('../controllers/teams.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// Temporarily removed authentication for testing
router.post('/', teamsController.createTeam);
router.get('/', teamsController.getAllTeams);
router.get('/:id', teamsController.getTeamById);
router.put('/:id', teamsController.updateTeam);
router.delete('/:id', teamsController.deleteTeam);
router.post('/:id/invite', teamsController.inviteMember);

module.exports = router;