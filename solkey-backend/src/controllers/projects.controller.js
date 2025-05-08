const Project = require('../models/project.model');

exports.createProject = async (req, res) => {
    try {
        const project = new Project({
            ...req.body,
            owner: req.user.id
        });
        await project.save();
        res.status(201).send(project);
    } catch (error) {
        res.status(400).send({ error: 'Error creating project' });
    }
};

exports.getAllProjects = async (req, res) => {
    try {
        const projects = await Project.find({ owner: req.user.id });
        res.status(200).send(projects);
    } catch (error) {
        res.status(500).send({ error: 'Error fetching projects' });
    }
};

exports.getProjectById = async (req, res) => {
    try {
        const project = await Project.findOne({ 
            _id: req.params.id,
            owner: req.user.id
        });
        if (!project) {
            return res.status(404).send({ error: 'Project not found' });
        }
        res.status(200).send(project);
    } catch (error) {
        res.status(500).send({ error: 'Error fetching project' });
    }
};

exports.updateProject = async (req, res) => {
    try {
        const project = await Project.findOneAndUpdate(
            { _id: req.params.id, owner: req.user.id },
            req.body,
            { new: true }
        );
        if (!project) {
            return res.status(404).send({ error: 'Project not found' });
        }
        res.status(200).send(project);
    } catch (error) {
        res.status(400).send({ error: 'Error updating project' });
    }
};

exports.deleteProject = async (req, res) => {
    try {
        const project = await Project.findOneAndDelete({
            _id: req.params.id,
            owner: req.user.id
        });
        if (!project) {
            return res.status(404).send({ error: 'Project not found' });
        }
        res.status(204).send();
    } catch (error) {
        res.status(500).send({ error: 'Error deleting project' });
    }
};