const express = require('express');
const router = express.Router();
const secretsController = require('../controllers/secrets.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Route to create a new secret
router.post('/', authMiddleware.authenticate, secretsController.createSecret);

// Route to retrieve all secrets
router.get('/', authMiddleware.authenticate, secretsController.getAllSecrets);

// Route to retrieve a specific secret by ID
router.get('/:id', authMiddleware.authenticate, secretsController.getSecretById);

// Route to update a specific secret by ID
router.put('/:id', authMiddleware.authenticate, secretsController.updateSecret);

// Route to delete a specific secret by ID
router.delete('/:id', authMiddleware.authenticate, secretsController.deleteSecret);

module.exports = router;