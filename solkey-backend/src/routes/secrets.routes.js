const express = require('express');
const router = express.Router();
const secretsController = require('../controllers/secrets.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// Temporarily removed authentication for testing
router.post('/', secretsController.createSecret);
router.get('/', secretsController.getAllSecrets);
router.get('/:id', secretsController.getSecretById);
router.put('/:id', secretsController.updateSecret);
router.delete('/:id', secretsController.deleteSecret);

module.exports = router;