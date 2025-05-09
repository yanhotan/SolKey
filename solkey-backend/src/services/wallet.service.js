const nacl = require('tweetnacl');
const bs58 = require('bs58');
const crypto = require('../utils/crypto');
const encryptionService = require('./encryption.service');
const { PublicKey } = require('@solana/web3.js');
const User = require('../models/user.model');

const WELCOME_MESSAGE = 'Welcome to SolKey! Sign this message to secure your secrets with your Phantom wallet.';

const verifySignature = async (message, signature, publicKey) => {
    try {
        const messageBytes = new TextEncoder().encode(message);
        const signatureBytes = bs58.decode(signature);
        const publicKeyBytes = new PublicKey(publicKey).toBytes();
        
        return nacl.sign.detached.verify(
            messageBytes,
            signatureBytes,
            publicKeyBytes
        );
    } catch (error) {
        console.error('Signature verification failed:', error);
        return false;
    }
};

const connectWallet = async (walletAddress, signedMessage, message = WELCOME_MESSAGE) => {
    try {
        const isValid = await verifySignature(
            message,
            signedMessage,
            walletAddress
        );

        if (!isValid) {
            throw new Error('Invalid wallet signature');
        }

        // Generate encryption key from wallet signature
        const walletHash = crypto.hash(signedMessage);
        const aesKey = await encryptionService.generateAESKey(walletHash);
        
        return {
            walletAddress,
            encryptionKey: aesKey,
            message: WELCOME_MESSAGE,
            success: true
        };
    } catch (error) {
        console.error('Wallet connection failed:', error);
        throw error;
    }
};

const disconnectWallet = async (userId) => {
    try {
        // Clear wallet address and encryption keys
        const result = await User.findByIdAndUpdate(userId, {
            $unset: { walletAddress: 1 }
        }, { new: true });
        return result !== null;
    } catch (error) {
        console.error('Wallet disconnection failed:', error);
        throw error;
    }
};

const reauthorizeWallet = async (walletAddress, signedMessage, message = WELCOME_MESSAGE) => {
    try {
        // Verify the signature again and generate new encryption keys
        const result = await connectWallet(walletAddress, signedMessage, message);
        return result;
    } catch (error) {
        console.error('Wallet reauthorization failed:', error);
        throw error;
    }
};

module.exports = {
    verifySignature,
    connectWallet,
    disconnectWallet,
    reauthorizeWallet,
    WELCOME_MESSAGE
};