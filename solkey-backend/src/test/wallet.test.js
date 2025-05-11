const nacl = require('tweetnacl');
const bs58 = require('bs58');
const { Keypair } = require('@solana/web3.js');
const crypto = require('../utils/crypto');
const walletService = require('../services/wallet.service');
const encryptionService = require('../services/encryption.service');

describe('Wallet Integration Tests', () => {
    let keypair;
    const message = 'Welcome to SolSecure! Sign this message to secure your secrets with your Phantom wallet.';

    beforeEach(() => {
        // Generate a new Solana keypair for each test
        keypair = Keypair.generate();
    });

    describe('Wallet Connection', () => {
        it('should verify wallet signature correctly', async () => {
            // Convert message to bytes and sign
            const messageBytes = new TextEncoder().encode(message);
            const signedBytes = nacl.sign.detached(messageBytes, keypair.secretKey);
            const signature = bs58.encode(signedBytes);
            const walletAddress = keypair.publicKey.toBase58();

            const isValid = await walletService.verifySignature(
                message,
                signature,
                walletAddress
            );

            expect(isValid).toBe(true);
        });

        it('should reject invalid signatures', async () => {
            const messageBytes = new TextEncoder().encode(message);
            const signedBytes = nacl.sign.detached(messageBytes, keypair.secretKey);
            const signature = bs58.encode(signedBytes);
            const wrongKeypair = Keypair.generate();
            const wrongWalletAddress = wrongKeypair.publicKey.toBase58();

            const isValid = await walletService.verifySignature(
                message,
                signature,
                wrongWalletAddress
            );

            expect(isValid).toBe(false);
        });
    });

    describe('Encryption Key Derivation', () => {
        it('should derive consistent encryption keys from wallet signatures', async () => {
            // Sign message with wallet
            const messageBytes = new TextEncoder().encode(message);
            const signedBytes = nacl.sign.detached(messageBytes, keypair.secretKey);
            const signature = bs58.encode(signedBytes);

            // Generate encryption key from signature
            const key1 = await encryptionService.deriveKeyFromSignature(signature);
            const key2 = await encryptionService.deriveKeyFromSignature(signature);

            // Keys derived from the same signature should be identical
            expect(key1).toBe(key2);
        });

        it('should encrypt and decrypt data correctly with derived keys', async () => {
            // Sign message and derive key
            const messageBytes = new TextEncoder().encode(message);
            const signedBytes = nacl.sign.detached(messageBytes, keypair.secretKey);
            const signature = bs58.encode(signedBytes);
            
            const walletHash = crypto.hash(signature);
            const aesKey = await encryptionService.generateAESKey(walletHash);

            // Test encryption/decryption
            const testData = 'Test secret data';
            const encrypted = await encryptionService.encryptWithWallet(testData, aesKey);
            const decrypted = await encryptionService.decryptWithWallet(encrypted, aesKey);

            expect(decrypted).toBe(testData);
        });
    });
});
