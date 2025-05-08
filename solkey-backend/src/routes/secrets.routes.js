const express = require('express');
const router = express.Router();
const secretsController = require('../controllers/secrets.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

router.post('/', authenticateToken, secretsController.createSecret);
router.get('/', authenticateToken, secretsController.getAllSecrets);
router.get('/:id', authenticateToken, secretsController.getSecretById);
router.put('/:id', authenticateToken, secretsController.updateSecret);
router.delete('/:id', authenticateToken, secretsController.deleteSecret);

module.exports = router;