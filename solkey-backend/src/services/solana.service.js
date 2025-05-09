const { Connection, PublicKey, clusterApiUrl } = require('@solana/web3.js');
const config = require('../config/env');
const { AppError } = require('../middleware/error.middleware');

class SolanaService {
    constructor() {
        const rpcUrl = config.solana.network === 'mainnet-beta' ? 
            clusterApiUrl('mainnet-beta') : 
            config.solana.rpcUrl;

        this.connection = new Connection(rpcUrl, {
            commitment: config.solana.commitment,
            confirmTransactionInitialTimeout: config.solana.confirmTransactionInitialTimeout
        });
    }

    async getWalletBalance(walletAddress) {
        try {
            const publicKey = new PublicKey(walletAddress);
            const balance = await this.retryOperation(
                async () => await this.connection.getBalance(publicKey)
            );
            return balance / 1e9;
        } catch (error) {
            if (error.message.includes('Invalid public key')) {
                throw new AppError('Invalid wallet address provided', 400);
            }
            console.error('Failed to get wallet balance:', error);
            throw new AppError('Failed to get wallet balance', 503);
        }
    }

    async sendSol(fromWallet, toWallet, amount) {
        try {
            const transaction = await this.retryOperation(
                async () => await this.connection.requestAirdrop(
                    new PublicKey(fromWallet),
                    amount
                )
            );
            
            const confirmation = await this.connection.confirmTransaction(transaction);
            
            if (confirmation.value.err) {
                throw new AppError('Transaction failed to confirm', 400);
            }

            return {
                signature: transaction,
                confirmationStatus: confirmation.value.confirmationStatus
            };
        } catch (error) {
            console.error('Failed to send SOL:', error);
            throw new AppError(
                error.message || 'Failed to send SOL',
                error.status || 503
            );
        }
    }

    async getTransactionStatus(transactionId) {
        try {
            const transaction = await this.retryOperation(
                async () => await this.connection.getTransaction(transactionId)
            );
            
            if (!transaction) {
                throw new AppError('Transaction not found', 404);
            }
            
            return {
                confirmationStatus: transaction.confirmationStatus,
                slot: transaction.slot,
                timestamp: transaction.blockTime ? new Date(transaction.blockTime * 1000) : null
            };
        } catch (error) {
            if (error.status === 404) throw error;
            console.error('Failed to get transaction status:', error);
            throw new AppError('Failed to get transaction status', 503);
        }
    }

    async retryOperation(operation, maxRetries = 3) {
        let lastError;
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;
                if (error.message.includes('Invalid public key')) {
                    throw error; // Don't retry validation errors
                }
                // Exponential backoff
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
            }
        }
        throw lastError;
    }

    async validateWalletAddress(address) {
        try {
            return PublicKey.isOnCurve(new PublicKey(address));
        } catch {
            return false;
        }
    }
}

module.exports = new SolanaService();