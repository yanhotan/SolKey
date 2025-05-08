const express = require('express');
const router = express.Router();
const teamsController = require('../controllers/teams.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

router.post('/', authenticateToken, teamsController.createTeam);
router.get('/', authenticateToken, teamsController.getAllTeams);
router.get('/:id', authenticateToken, teamsController.getTeamById);
router.put('/:id', authenticateToken, teamsController.updateTeam);
router.delete('/:id', authenticateToken, teamsController.deleteTeam);
router.post('/:id/invite', authenticateToken, teamsController.inviteMember);

module.exports = router;