const express = require('express');
const router = express.Router();
const teamsController = require('../controllers/teams.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Route to create a new team
router.post('/', authMiddleware.authenticate, teamsController.createTeam);

// Route to get all teams
router.get('/', authMiddleware.authenticate, teamsController.getAllTeams);

// Route to get a specific team by ID
router.get('/:id', authMiddleware.authenticate, teamsController.getTeamById);

// Route to update a team by ID
router.put('/:id', authMiddleware.authenticate, teamsController.updateTeam);

// Route to delete a team by ID
router.delete('/:id', authMiddleware.authenticate, teamsController.deleteTeam);

// Route to invite a member to a team
router.post('/:id/invite', authMiddleware.authenticate, teamsController.inviteMember);

module.exports = router;