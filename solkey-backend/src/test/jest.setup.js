require('dotenv').config({ path: '.env.local' });

// Mock Solana web3 functions
jest.mock('@solana/web3.js', () => ({
    Connection: jest.fn(),
    PublicKey: jest.fn(),
    Keypair: {
        generate: jest.fn()
    }
}));