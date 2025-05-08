// Import necessary libraries
const { Connection, PublicKey, clusterApiUrl } = require('@solana/web3.js');

// Define the SolanaService class
class SolanaService {
    constructor() {
        // Initialize connection to the Solana cluster
        this.connection = new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');
    }

    // Method to get the balance of a wallet
    async getWalletBalance(walletAddress) {
        try {
            const publicKey = new PublicKey(walletAddress);
            const balance = await this.connection.getBalance(publicKey);
            return balance / 1e9; // Convert lamports to SOL
        } catch (error) {
            throw new Error('Failed to get wallet balance: ' + error.message);
        }
    }

    // Method to send SOL from one wallet to another
    async sendSol(fromWallet, toWallet, amount, fromWalletKeypair) {
        try {
            const transaction = await this.connection.requestAirdrop(new PublicKey(fromWallet), amount);
            await this.connection.confirmTransaction(transaction);
            return transaction;
        } catch (error) {
            throw new Error('Failed to send SOL: ' + error.message);
        }
    }

    // Method to check transaction status
    async getTransactionStatus(transactionId) {
        try {
            const transaction = await this.connection.getTransaction(transactionId);
            return transaction ? transaction.confirmationStatus : 'Transaction not found';
        } catch (error) {
            throw new Error('Failed to get transaction status: ' + error.message);
        }
    }
}

module.exports = new SolanaService();