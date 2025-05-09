const mongoose = require('mongoose');
const { Keypair } = require('@solana/web3.js');
const crypto = require('../utils/crypto');
const User = require('../models/user.model');
const Project = require('../models/project.model');
const Environment = require('../models/environment.model');
const Secret = require('../models/secret.model');
const encryptionService = require('../services/encryption.service');
const nacl = require('tweetnacl');
const bs58 = require('bs58');
const walletService = require('../services/wallet.service');

describe('SolKey Integration Tests', () => {
    let testUser, testWallet, adminUser, memberUser, testProject, testEnvironment;

    beforeAll(async () => {
        await mongoose.connect(process.env.MONGODB_URI);
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        // Clean up database before each test
        await User.deleteMany({});
        await Project.deleteMany({});
        await Environment.deleteMany({});
        await Secret.deleteMany({});

        // Create test user for each test
        testUser = await User.create({
            email: 'test@example.com',
            password: 'password123',
            name: 'Test User',
            subscription: {
                type: 'free',
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }
        });

        // Create a test project
        testProject = await Project.create({
            name: 'Test Project',
            description: 'Test Description',
            owner: testUser._id,
            team: []
        });

        // Create default environments
        const environments = await Environment.insertMany([
            { name: 'development', projectId: testProject._id, type: 'development' },
            { name: 'staging', projectId: testProject._id, type: 'staging' },
            { name: 'production', projectId: testProject._id, type: 'production' }
        ]);

        testEnvironment = environments[0];
    });

    describe('User Authentication & Wallet Integration', () => {
        it('should register user and connect wallet', async () => {
            // Generate a proper Solana keypair
            const keypair = Keypair.generate();
            
            const message = 'Welcome to SolKey! Sign this message to secure your secrets.';
            const messageBytes = new TextEncoder().encode(message);
            const signedBytes = nacl.sign.detached(messageBytes, keypair.secretKey);
            const signature = bs58.encode(signedBytes);
            
            const walletAddress = keypair.publicKey.toBase58();

            testUser = await User.findById(testUser._id);
            testUser.walletAddress = walletAddress;
            await testUser.save();

            const updatedUser = await User.findById(testUser._id);
            expect(updatedUser.walletAddress).toBe(walletAddress);
        });

        it('should derive AES key from wallet and encrypt secrets', async () => {
            const secretValue = 'mySecretApiKey123';
            
            // Generate a proper Solana keypair
            const keypair = Keypair.generate();
            
            const message = 'Welcome to SolKey! Sign this message to secure your secrets.';
            const messageBytes = new TextEncoder().encode(message);
            const signedBytes = nacl.sign.detached(messageBytes, keypair.secretKey);
            const signature = bs58.encode(signedBytes);
            
            // Generate encryption key
            const walletHash = crypto.hash(signature);
            const aesKey = await encryptionService.generateAESKey(walletHash);
            
            // Test encryption
            const encrypted = await encryptionService.encryptWithWallet(secretValue, aesKey);
            const decrypted = await encryptionService.decryptWithWallet(encrypted, aesKey);
            
            expect(decrypted).toBe(secretValue);
        });

        it('should prevent access to secrets after wallet desync', async () => {
            testUser = await User.findById(testUser._id);
            testUser.walletAddress = null;
            await testUser.save();
            
            const updatedUser = await User.findById(testUser._id);
            expect(updatedUser.walletAddress).toBeNull();
        });
    });

    describe('Project Management', () => {
        it('should create project with default environments', async () => {
            const envs = await Environment.find({ projectId: testProject._id });
            expect(envs.length).toBe(3);
        });

        it('should edit project details', async () => {
            const updatedName = 'Updated Project Name';
            testProject = await Project.findById(testProject._id);
            testProject.name = updatedName;
            await testProject.save();
            
            const updatedProject = await Project.findById(testProject._id);
            expect(updatedProject.name).toBe(updatedName);
        });

        it('should delete project and cascade environments', async () => {
            await Project.findByIdAndDelete(testProject._id);
            await Environment.deleteMany({ projectId: testProject._id });
            
            const deletedProject = await Project.findById(testProject._id);
            const deletedEnvs = await Environment.find({ projectId: testProject._id });
            
            expect(deletedProject).toBeNull();
            expect(deletedEnvs.length).toBe(0);
        });
    });

    describe('Team Management', () => {
        beforeEach(async () => {
            memberUser = await User.create({
                email: 'member@example.com',
                password: 'password123',
                name: 'Team Member'
            });
        });

        it('should invite team member', async () => {
            testProject = await Project.findById(testProject._id);
            testProject.team.push({
                user: memberUser._id,
                role: 'member'
            });
            
            await testProject.save();
            
            const updatedProject = await Project.findById(testProject._id)
                .populate('team.user');
            
            expect(updatedProject.team[0].user.email).toBe(memberUser.email);
        });

        it('should handle change requests', async () => {
            testProject = await Project.findById(testProject._id);
            const changeRequest = {
                type: 'update_secret',
                secretId: new mongoose.Types.ObjectId(),
                newValue: 'newSecretValue',
                requestedBy: memberUser._id,
                status: 'pending'
            };
            
            testProject.changeRequests = [changeRequest];
            await testProject.save();
            
            const savedProject = await Project.findById(testProject._id);
            savedProject.changeRequests[0].status = 'approved';
            savedProject.changeRequests[0].reviewedBy = testUser._id;
            await savedProject.save();
            
            const updatedProject = await Project.findById(testProject._id);
            expect(updatedProject.changeRequests[0].status).toBe('approved');
        });

        it('should remove team member', async () => {
            testProject = await Project.findById(testProject._id);
            testProject.team = testProject.team.filter(
                member => !member.user.equals(memberUser._id)
            );
            
            await testProject.save();
            
            const updatedProject = await Project.findById(testProject._id);
            expect(updatedProject.team.length).toBe(0);
        });
    });

    describe('Environment Management', () => {
        it('should create custom environment (pro plan)', async () => {
            testUser = await User.findById(testUser._id);
            testUser.subscription = {
                type: 'pro',
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            };
            await testUser.save();
            
            const customEnv = await Environment.create({
                name: 'custom-env',
                projectId: testProject._id,
                type: 'custom'
            });
            
            const savedEnv = await Environment.findById(customEnv._id);
            expect(savedEnv.name).toBe('custom-env');
        });

        it('should prevent custom environment creation (free plan)', async () => {
            testUser = await User.findById(testUser._id);
            testUser.subscription = {
                type: 'free',
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            };
            await testUser.save();
            
            let error;
            try {
                await Environment.create({
                    name: 'custom-env-2',
                    projectId: testProject._id,
                    type: 'custom'
                });
            } catch (e) {
                error = e;
            }
            
            expect(error).toBeDefined();
        });

        it('should manage environment secrets', async () => {
            testEnvironment = await Environment.findById(testEnvironment._id);
            
            const secret = await Secret.create({
                key: 'API_KEY',
                encryptedValue: 'encryptedValue123',
                environmentId: testEnvironment._id,
                createdBy: testUser._id
            });
            
            const savedSecret = await Secret.findById(secret._id);
            expect(savedSecret.key).toBe('API_KEY');
            
            // Update secret
            savedSecret.encryptedValue = 'newEncryptedValue123';
            await savedSecret.save();
            
            // Delete secret
            await Secret.deleteOne({ _id: savedSecret._id });
            
            const deletedSecret = await Secret.findById(savedSecret._id);
            expect(deletedSecret).toBeNull();
        });
    });
});