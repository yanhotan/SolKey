const Secret = require('../models/secret.model');
const { encrypt, decrypt } = require('../services/encryption.service');

exports.createSecret = async (req, res) => {
    try {
        const { title, content } = req.body;
        const encryptedContent = encrypt(content);
        const newSecret = new Secret({
            title,
            content: encryptedContent,
            userId: req.user.id
        });
        await newSecret.save();
        res.status(201).json({ message: 'Secret created', secret: newSecret });
    } catch (error) {
        res.status(500).json({ error: 'Error creating secret' });
    }
};

exports.getAllSecrets = async (req, res) => {
    try {
        const secrets = await Secret.find({ userId: req.user.id });
        res.status(200).json({ secrets });
    } catch (error) {
        res.status(500).json({ error: 'Error retrieving secrets' });
    }
};

exports.getSecretById = async (req, res) => {
    try {
        const secret = await Secret.findOne({ 
            _id: req.params.id,
            userId: req.user.id
        });
        if (!secret) {
            return res.status(404).json({ error: 'Secret not found' });
        }
        const decryptedContent = decrypt(secret.content);
        res.status(200).json({
            id: secret._id,
            title: secret.title,
            content: decryptedContent,
            createdAt: secret.createdAt,
            updatedAt: secret.updatedAt
        });
    } catch (error) {
        res.status(500).json({ error: 'Error retrieving secret' });
    }
};

exports.updateSecret = async (req, res) => {
    try {
        const { title, content } = req.body;
        const encryptedContent = encrypt(content);
        const secret = await Secret.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { title, content: encryptedContent },
            { new: true }
        );
        if (!secret) {
            return res.status(404).json({ error: 'Secret not found' });
        }
        res.status(200).json({ message: 'Secret updated', secret });
    } catch (error) {
        res.status(500).json({ error: 'Error updating secret' });
    }
};

exports.deleteSecret = async (req, res) => {
    try {
        const secret = await Secret.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.id
        });
        if (!secret) {
            return res.status(404).json({ error: 'Secret not found' });
        }
        res.status(200).json({ message: 'Secret deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting secret' });
    }
};