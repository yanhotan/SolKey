const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Import models
const User = require('./models/user.model');
const Project = require('./models/project.model');
const Environment = require('./models/environment.model');
const Secret = require('./models/secret.model');
const Payment = require('./models/payment.model');

async function testModels() {
  try {
    // Connect to MongoDB with updated options
    console.log('Connecting to MongoDB...');
    mongoose.set('strictQuery', true);
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      autoIndex: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4
    });
    console.log('Connected successfully to MongoDB');

    // Test User Model
    console.log('\nTesting User Model:');
    const user = new User({
      email: 'test@example.com',
      name: 'Test User',
      password: 'password123',
      walletAddress: 'solana123'
    });
    await user.save();
    console.log('Created user:', user._id);

    // Test Project Model
    console.log('\nTesting Project Model:');
    const project = new Project({
      name: 'Test Project',
      description: 'A test project',
      owner: user._id
    });
    await project.save();
    console.log('Created project:', project._id);

    // Test Environment Model
    console.log('\nTesting Environment Model:');
    const environment = new Environment({
      name: 'development',
      projectId: project._id,
      type: 'development',
      description: 'Development environment'
    });
    await environment.save();
    console.log('Created environment:', environment._id);

    // Test Secret Model
    console.log('\nTesting Secret Model:');
    const secret = new Secret({
      key: 'API_KEY',
      encryptedValue: 'encrypted_value_here',
      environmentId: environment._id,
      createdBy: user._id
    });
    await secret.save();
    console.log('Created secret:', secret._id);

    // Test Payment Model
    console.log('\nTesting Payment Model:');
    const payment = new Payment({
      userId: user._id,
      amount: 1.5,
      subscriptionType: 'basic',
      duration: 1,
      transactionHash: 'test_hash_123'
    });
    await payment.save();
    console.log('Created payment:', payment._id);

    // Test Relationships
    console.log('\nTesting Relationships:');
    const populatedProject = await Project.findById(project._id)
      .populate('owner')
      .exec();
    console.log('Project with owner:', populatedProject.owner.name);

    const populatedEnvironment = await Environment.findById(environment._id)
      .populate('projectId')
      .exec();
    console.log('Environment project:', populatedEnvironment.projectId.name);

    // Clean up test data
    console.log('\nCleaning up test data...');
    await Promise.all([
      User.deleteOne({ _id: user._id }),
      Project.deleteOne({ _id: project._id }),
      Environment.deleteOne({ _id: environment._id }),
      Secret.deleteOne({ _id: secret._id }),
      Payment.deleteOne({ _id: payment._id })
    ]);
    console.log('Test data cleaned up successfully');

    await mongoose.connection.close();
    console.log('\nAll tests completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error during testing:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

testModels();