const Project = require('../models/project.model');
const Environment = require('../models/environment.model'); 

exports.createProject = async (req, res) => {
    try {
        // Debug logging for request
        console.log('Create Project Request:', {
            headers: {
                contentType: req.headers['content-type'],
                walletSignature: req.headers['x-wallet-signature'] ? 
                    `${req.headers['x-wallet-signature'].slice(0, 10)}...` : 
                    'missing',
            },
            body: {
                name: req.body.name,
                hasDescription: !!req.body.description,
                environments: req.body.environments
            }
        });
        
        // Set response content type
        res.setHeader('Content-Type', 'application/json');
        
        // Validate required fields
        if (!req.body.name) {
            return res.status(400).json({ error: 'Project name is required' });
        }

        // Validate name length
        if (req.body.name.length > 100) {
            return res.status(400).json({ error: 'Project name must be 100 characters or less' });
        }

        // Validate description length if provided
        if (req.body.description && req.body.description.length > 500) {
            return res.status(400).json({ error: 'Project description must be 500 characters or less' });
        }

        // Check for duplicate project name
        const existingProject = await Project.findOne({ name: req.body.name });
        if (existingProject) {
            return res.status(409).json({ error: 'A project with this name already exists' });
        }

        // Get wallet signature from header
        const walletSignature = req.headers['x-wallet-signature'];
        console.log('Received wallet signature:', walletSignature ? 
            `${walletSignature.slice(0, 10)}...` : 
            'missing');

        // Clean and validate wallet signature
        let cleanWalletSignature = walletSignature;
        if (walletSignature) {
            cleanWalletSignature = walletSignature.replace('0x', '');
            if (cleanWalletSignature.length < 32) {
                console.warn('Wallet signature too short:', cleanWalletSignature.length);
                return res.status(400).json({ 
                    error: 'Invalid wallet signature',
                    details: 'Wallet signature must be at least 32 characters long'
                });
            }
        } else {
            console.warn('No wallet signature provided');
        }

        // Create and save the project 
        const project = new Project({
            name: req.body.name,
            description: req.body.description || '',
            owner: null, // Auth is disabled for testing
            walletSignature: cleanWalletSignature,
            environments: []
        });

        try {
            await project.save();
            console.log('Project saved successfully:', {
                id: project._id,
                name: project.name,
                hasWalletSig: !!project.walletSignature
            });
        } catch (saveError) {
            console.error('Project save error:', {
                error: saveError.message,
                validationErrors: saveError.errors,
                project: {
                    name: project.name,
                    hasWalletSig: !!project.walletSignature
                }
            });
            throw saveError;
        }

        // Create requested environments
        const environments = [];
        const requestedEnvs = req.body.environments || ['development'];
        const validEnvTypes = ['development', 'staging', 'production', 'custom'];

        for (const envName of requestedEnvs) {
            // Validate environment name
            if (!validEnvTypes.includes(envName.toLowerCase())) {
                return res.status(400).json({ 
                    error: `Invalid environment type: ${envName}. Must be one of: ${validEnvTypes.join(', ')}` 
                });
            }

            const environment = new Environment({
                name: envName.toLowerCase(),
                projectId: project._id,
                type: envName.toLowerCase(),
                description: `${envName} environment`
            });

            await environment.save();
            environments.push(environment);
        }

        // Link environments to project
        project.environments = environments.map(env => env._id);
        await project.save();

        console.log('Project creation completed:', {
            projectId: project._id,
            environments: environments.length,
            hasWalletSig: !!project.walletSignature
        });

        // Return success with project and environments
        res.status(201).json({
            message: 'Project created successfully',
            project: project,
            environments: environments
        });
    } catch (error) {
        // Enhanced error logging
        console.error('Error creating project:', {
            message: error.message,
            stack: error.stack,
            name: error.name,
            code: error.code,
            body: {
                name: req.body?.name,
                hasDescription: !!req.body?.description,
                environments: req.body?.environments
            },
            headers: {
                contentType: req.headers['content-type'],
                hasWalletSignature: !!req.headers['x-wallet-signature']
            },
            mongooseError: error instanceof mongoose.Error,
            validationError: error.errors ? Object.keys(error.errors) : null
        });

        // Handle specific MongoDB errors
        if (error.code === 11000) {
            return res.status(409).json({ 
                error: 'A project with this name already exists',
                details: error.message,
                type: 'DuplicateKey'
            });
        }

        // Handle Mongoose validation errors
        if (error instanceof mongoose.Error.ValidationError) {
            return res.status(400).json({ 
                error: 'Invalid project data',
                details: Object.values(error.errors).map(err => err.message),
                type: 'ValidationError',
                fields: Object.keys(error.errors)
            });
        }

        // Handle environment creation errors
        if (error.message?.includes('Environment')) {
            return res.status(400).json({ 
                error: 'Failed to create environment',
                details: error.message,
                type: 'EnvironmentError'
            });
        }

        // Return detailed error for debugging
        res.status(500).json({ 
            error: 'An error occurred while creating the project',
            details: error.message,
            type: error.name || 'UnknownError',
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

exports.getAllProjects = async (req, res) => {
    try {
        const projects = await Project.find();
        res.status(200).json(projects);
    } catch (error) {
        res.status(500).json({ 
            error: 'Error fetching projects',
            details: error.message  
        });
    }
};

exports.getProjectById = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.status(200).json(project);
    } catch (error) {
        res.status(500).json({
            error: 'Error fetching project',
            details: error.message
        });
    }
};

exports.updateProject = async (req, res) => {
    try {
        const project = await Project.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.status(200).json(project);
    } catch (error) {
        res.status(500).json({
            error: 'Error updating project',
            details: error.message
        });
    }
};

exports.deleteProject = async (req, res) => {
    try {
        const project = await Project.findByIdAndDelete(req.params.id);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Also delete associated environments
        await Environment.deleteMany({ projectId: project._id });

        res.status(204).send();
    } catch (error) {
        res.status(500).json({
            error: 'Error deleting project',
            details: error.message
        });
    }
};