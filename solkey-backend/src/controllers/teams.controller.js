// Teams Controller for managing team-related requests
// This controller handles inviting members and managing roles within teams

const Team = require('../models/team.model'); // Import the Team model
const User = require('../models/user.model'); // Import the User model

// Invite a new member to the team
exports.inviteMember = async (req, res) => {
    try {
        const { teamId, userId } = req.body; // Extract teamId and userId from request body
        const team = await Team.findById(teamId); // Find the team by ID

        if (!team) {
            return res.status(404).json({ message: 'Team not found' }); // Handle team not found
        }

        const user = await User.findById(userId); // Find the user by ID
        if (!user) {
            return res.status(404).json({ message: 'User not found' }); // Handle user not found
        }

        team.members.push(userId); // Add the user to the team members
        await team.save(); // Save the updated team

        return res.status(200).json({ message: 'Member invited successfully', team }); // Respond with success
    } catch (error) {
        return res.status(500).json({ message: 'Error inviting member', error }); // Handle errors
    }
};

// Manage roles within the team
exports.manageRoles = async (req, res) => {
    try {
        const { teamId, userId, role } = req.body; // Extract teamId, userId, and role from request body
        const team = await Team.findById(teamId); // Find the team by ID

        if (!team) {
            return res.status(404).json({ message: 'Team not found' }); // Handle team not found
        }

        if (!team.members.includes(userId)) {
            return res.status(400).json({ message: 'User is not a member of the team' }); // Handle user not in team
        }

        // Update the user's role in the team
        const memberIndex = team.members.indexOf(userId);
        team.roles[memberIndex] = role; // Update the role for the user
        await team.save(); // Save the updated team

        return res.status(200).json({ message: 'Role updated successfully', team }); // Respond with success
    } catch (error) {
        return res.status(500).json({ message: 'Error managing roles', error }); // Handle errors
    }
};