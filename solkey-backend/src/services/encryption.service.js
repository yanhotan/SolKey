const crypto = require('crypto');
const bs58 = require('bs58');
const { webcrypto } = crypto;
const config = require('../config/env');
const { AppError } = require('../middleware/error.middleware');

class EncryptionService {
    static _instance = null;

    static getInstance() {
        if (!EncryptionService._instance) {
            EncryptionService._instance = new EncryptionService();
        }
        return EncryptionService._instance;
    }
    constructor() {
        if (!webcrypto || !webcrypto.subtle) {
            throw new Error('Web Crypto API not supported');
        }
    }

    async generateAESKey(walletHash) {
        try {
            const salt = crypto.randomBytes(32);
            
            const keyMaterial = await webcrypto.subtle.importKey(
                'raw',
                Buffer.from(walletHash, 'hex'),
                { name: 'PBKDF2' },
                false,
                ['deriveKey']
            );

            const key = await webcrypto.subtle.deriveKey(
                {
                    name: 'PBKDF2',
                    salt,
                    iterations: 310000, 
                    hash: 'SHA-512'    
                },
                keyMaterial,
                { name: 'AES-GCM', length: 256 },
                true,
                ['encrypt', 'decrypt']
            );

            return { 
                key,
                salt: Buffer.from(salt).toString('hex')
            };
        } catch (error) {
            console.error('Error generating AES key:', error);
            throw new AppError('Failed to generate encryption key', 500);
        }
    }

    async encryptWithWallet(data, { key }) {
        try {
            // Use CSPRNG for IV generation
            const iv = crypto.randomBytes(12);
            const encodedData = new TextEncoder().encode(data);

            // Add authentication data for additional security
            const authData = new TextEncoder().encode('solkey-encrypted-data');

            const encryptedData = await webcrypto.subtle.encrypt(
                {
                    name: 'AES-GCM',
                    iv,
                    additionalData: authData
                },
                key,
                encodedData
            );

            return {
                encrypted: Buffer.from(encryptedData).toString('hex'),
                iv: Buffer.from(iv).toString('hex'),
                authHash: crypto.createHash('sha256')
                    .update(authData)
                    .digest('hex')
            };
        } catch (error) {
            console.error('Error encrypting data:', error);
            throw new AppError('Failed to encrypt data', 500);
        }
    }

    async decryptWithWallet(encrypted, { key }) {
        try {
            const iv = Buffer.from(encrypted.iv, 'hex');
            const data = Buffer.from(encrypted.encrypted, 'hex');
            const authData = new TextEncoder().encode('solkey-encrypted-data');

            const authHash = crypto.createHash('sha256')
                .update(authData)
                .digest('hex');

            if (encrypted.authHash && encrypted.authHash !== authHash) {
                throw new AppError('Data integrity check failed', 400);
            }

            const decrypted = await webcrypto.subtle.decrypt(
                {
                    name: 'AES-GCM',
                    iv,
                    additionalData: authData
                },
                key,
                data
            );

            return new TextDecoder().decode(decrypted);
        } catch (error) {
            console.error('Error decrypting data:', error);
            if (error.status === 400) throw error;
            throw new AppError('Failed to decrypt data', 500);
        }
    }

    async deriveKeyFromSignature(signature) {
        try {
            const signatureBuffer = bs58.decode(signature);
            
            const keyMaterial = await webcrypto.subtle.importKey(
                'raw',
                signatureBuffer,
                { name: 'HKDF' },
                false,
                ['deriveBits']
            );

            const derivedBits = await webcrypto.subtle.deriveBits(
                {
                    name: 'HKDF',
                    hash: 'SHA-512',
                    salt: crypto.randomBytes(32),
                    info: new TextEncoder().encode('solkey-key-derivation')
                },
                keyMaterial,
                256
            );

            return Buffer.from(derivedBits).toString('hex');
        } catch (error) {
            console.error('Error deriving key from signature:', error);
            throw new AppError('Failed to process wallet signature', 500);
        }
    }

    validateEncryptedData(data) {
        const required = ['encrypted', 'iv'];
        return required.every(prop => prop in data && typeof data[prop] === 'string');
    }
}

// Export a singleton instance
module.exports = EncryptionService.getInstance();