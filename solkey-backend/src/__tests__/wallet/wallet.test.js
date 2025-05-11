const nacl = require('tweetnacl');
const bs58 = require('bs58');
const { Keypair } = require('@solana/web3.js');
const { TextEncoder, TextDecoder } = require('util');
const crypto = require('../../utils/crypto');
const walletService = require('../../services/wallet.service');
const encryptionService = require('../../services/encryption.service');

describe('Wallet Integration Tests', () => {
    let keypair;
    const TEST_MESSAGE = 'SolSecure Authentication';

    beforeEach(() => {
        // Generate a new Solana keypair for each test
        keypair = Keypair.generate();
    });

    describe('Wallet Connection', () => {
        it('should verify wallet signature correctly', async () => {
            // Convert message to bytes and sign
            const messageBytes = new TextEncoder().encode(TEST_MESSAGE);
            const signedBytes = nacl.sign.detached(messageBytes, keypair.secretKey);
            const signature = bs58.encode(signedBytes);
            const walletAddress = keypair.publicKey.toBase58();

            const isValid = await walletService.verifySignature(
                TEST_MESSAGE,
                signature,
                walletAddress
            );

            expect(isValid).toBe(true);
        });

        it('should reject invalid signatures', async () => {
            const messageBytes = new TextEncoder().encode(TEST_MESSAGE);
            const signedBytes = nacl.sign.detached(messageBytes, keypair.secretKey);
            const signature = bs58.encode(signedBytes);
            const wrongKeypair = Keypair.generate();
            const wrongWalletAddress = wrongKeypair.publicKey.toBase58();

            const isValid = await walletService.verifySignature(
                TEST_MESSAGE,
                signature,
                wrongWalletAddress
            );

            expect(isValid).toBe(false);
        });
    });

    describe('End-to-End Encryption', () => {
        it('should successfully encrypt and decrypt data', async () => {
            const testData = 'Test secret data';
            const messageBytes = new TextEncoder().encode(TEST_MESSAGE);
            const signedBytes = nacl.sign.detached(messageBytes, keypair.secretKey);
            const signature = bs58.encode(signedBytes);

            // Derive encryption key from signature
            const key = await encryptionService.deriveKeyFromSignature(signature);
            expect(key).toBeDefined();

            // Encrypt data
            const encrypted = await encryptionService.encryptWithKey(testData, key);
            expect(encrypted).toBeDefined();
            expect(encrypted.encrypted).toBeDefined();
            expect(encrypted.nonce).toBeDefined();

            // Decrypt data
            const decrypted = await encryptionService.decryptWithKey(encrypted, key);
            expect(decrypted).toBe(testData);
        });

        it('should derive consistent encryption keys', async () => {
            const messageBytes = new TextEncoder().encode(TEST_MESSAGE);
            const signedBytes = nacl.sign.detached(messageBytes, keypair.secretKey);
            const signature = bs58.encode(signedBytes);

            // Generate encryption keys from the same signature
            const key1 = await encryptionService.deriveKeyFromSignature(signature);
            const key2 = await encryptionService.deriveKeyFromSignature(signature);

            // Convert to hex strings for comparison
            const key1Hex = Buffer.from(key1).toString('hex');
            const key2Hex = Buffer.from(key2).toString('hex');
            expect(key1Hex).toBe(key2Hex);
        });
    });
});
