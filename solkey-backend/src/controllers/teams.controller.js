const Team = require('../models/team.model');
const User = require('../models/user.model');

exports.createTeam = async (req, res) => {
    try {
        const { name } = req.body;
        const team = new Team({
            name,
            members: [req.user.id]
        });
        await team.save();
        res.status(201).json({ message: 'Team created successfully', team });
    } catch (error) {
        res.status(500).json({ message: 'Error creating team', error: error.message });
    }
};

exports.getAllTeams = async (req, res) => {
    try {
        const teams = await Team.find({ members: req.user.id });
        res.status(200).json({ teams });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching teams', error: error.message });
    }
};

exports.getTeamById = async (req, res) => {
    try {
        const team = await Team.findById(req.params.id);
        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }
        if (!team.members.includes(req.user.id)) {
            return res.status(403).json({ message: 'Not authorized to view this team' });
        }
        res.status(200).json({ team });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching team', error: error.message });
    }
};

exports.updateTeam = async (req, res) => {
    try {
        const team = await Team.findById(req.params.id);
        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }
        if (!team.members.includes(req.user.id)) {
            return res.status(403).json({ message: 'Not authorized to update this team' });
        }
        team.name = req.body.name;
        await team.save();
        res.status(200).json({ message: 'Team updated successfully', team });
    } catch (error) {
        res.status(500).json({ message: 'Error updating team', error: error.message });
    }
};

exports.deleteTeam = async (req, res) => {
    try {
        const team = await Team.findById(req.params.id);
        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }
        if (!team.members.includes(req.user.id)) {
            return res.status(403).json({ message: 'Not authorized to delete this team' });
        }
        await team.remove();
        res.status(200).json({ message: 'Team deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting team', error: error.message });
    }
};

exports.inviteMember = async (req, res) => {
    try {
        const { userId } = req.body;
        const team = await Team.findById(req.params.id);
        
        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }
        
        if (team.members.includes(userId)) {
            return res.status(400).json({ message: 'User is already a member' });
        }
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        team.members.push(userId);
        await team.save();
        
        res.status(200).json({ message: 'Member invited successfully', team });
    } catch (error) {
        res.status(500).json({ message: 'Error inviting member', error: error.message });
    }
};

exports.manageRoles = async (req, res) => {
    try {
        const { teamId, userId, role } = req.body;
        const team = await Team.findById(teamId);

        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }

        if (!team.members.includes(userId)) {
            return res.status(400).json({ message: 'User is not a member of the team' });
        }

        const memberIndex = team.members.indexOf(userId);
        team.roles[memberIndex] = role;
        await team.save();

        return res.status(200).json({ message: 'Role updated successfully', team });
    } catch (error) {
        return res.status(500).json({ message: 'Error managing roles', error });
    }
};