module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/test/**/*.test.js'],
    setupFilesAfterEnv: ['./test/jest.setup.js'],
    globalTeardown: './test/jest.teardown.js',
    reporters: [
        'default',
        ['jest-junit', {
            outputDirectory: 'test-results',
            outputName: 'junit.xml',
        }]
    ],
    testTimeout: 30000,
    verbose: true
};