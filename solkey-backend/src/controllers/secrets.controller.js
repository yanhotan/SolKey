// Import necessary modules and services
const Secret = require('../models/secret.model');
const { encrypt, decrypt } = require('../services/encryption.service');

// Create a new secret
exports.createSecret = async (req, res) => {
    try {
        const { title, content } = req.body;
        const encryptedContent = encrypt(content);
        const newSecret = new Secret({ title, content: encryptedContent });
        await newSecret.save();
        res.status(201).json({ message: 'Secret created successfully', secret: newSecret });
    } catch (error) {
        res.status(500).json({ message: 'Error creating secret', error });
    }
};

// Retrieve a secret by ID
exports.getSecret = async (req, res) => {
    try {
        const secret = await Secret.findById(req.params.id);
        if (!secret) {
            return res.status(404).json({ message: 'Secret not found' });
        }
        const decryptedContent = decrypt(secret.content);
        res.status(200).json({ title: secret.title, content: decryptedContent });
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving secret', error });
    }
};

// Update a secret by ID
exports.updateSecret = async (req, res) => {
    try {
        const { title, content } = req.body;
        const encryptedContent = encrypt(content);
        const updatedSecret = await Secret.findByIdAndUpdate(req.params.id, { title, content: encryptedContent }, { new: true });
        if (!updatedSecret) {
            return res.status(404).json({ message: 'Secret not found' });
        }
        res.status(200).json({ message: 'Secret updated successfully', secret: updatedSecret });
    } catch (error) {
        res.status(500).json({ message: 'Error updating secret', error });
    }
};

// Delete a secret by ID
exports.deleteSecret = async (req, res) => {
    try {
        const deletedSecret = await Secret.findByIdAndDelete(req.params.id);
        if (!deletedSecret) {
            return res.status(404).json({ message: 'Secret not found' });
        }
        res.status(200).json({ message: 'Secret deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting secret', error });
    }
};