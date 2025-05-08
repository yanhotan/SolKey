// Import necessary modules and models
const Project = require('../models/project.model');

// Create a new project
exports.createProject = async (req, res) => {
    try {
        const project = new Project(req.body);
        await project.save();
        res.status(201).send(project);
    } catch (error) {
        res.status(400).send({ error: 'Error creating project' });
    }
};

// Get all projects
exports.getAllProjects = async (req, res) => {
    try {
        const projects = await Project.find();
        res.status(200).send(projects);
    } catch (error) {
        res.status(500).send({ error: 'Error fetching projects' });
    }
};

// Get a project by ID
exports.getProjectById = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).send({ error: 'Project not found' });
        }
        res.status(200).send(project);
    } catch (error) {
        res.status(500).send({ error: 'Error fetching project' });
    }
};

// Update a project by ID
exports.updateProject = async (req, res) => {
    try {
        const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!project) {
            return res.status(404).send({ error: 'Project not found' });
        }
        res.status(200).send(project);
    } catch (error) {
        res.status(400).send({ error: 'Error updating project' });
    }
};

// Delete a project by ID
exports.deleteProject = async (req, res) => {
    try {
        const project = await Project.findByIdAndDelete(req.params.id);
        if (!project) {
            return res.status(404).send({ error: 'Project not found' });
        }
        res.status(204).send();
    } catch (error) {
        res.status(500).send({ error: 'Error deleting project' });
    }
};