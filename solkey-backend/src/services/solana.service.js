const { Connection, PublicKey, clusterApiUrl } = require('@solana/web3.js');

class SolanaService {
    constructor() {
        this.connection = new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');
    }

    async getWalletBalance(walletAddress) {
        try {
            const publicKey = new PublicKey(walletAddress);
            const balance = await this.connection.getBalance(publicKey);
            return balance / 1e9;
        } catch (error) {
            throw new Error('Failed to get wallet balance: ' + error.message);
        }
    }

    async sendSol(fromWallet, toWallet, amount, fromWalletKeypair) {
        try {
            const transaction = await this.connection.requestAirdrop(new PublicKey(fromWallet), amount);
            await this.connection.confirmTransaction(transaction);
            return transaction;
        } catch (error) {
            throw new Error('Failed to send SOL: ' + error.message);
        }
    }

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