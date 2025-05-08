const config = {
    jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret',
    jwtExpiresIn: '24h',
    oauth: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL
        },
        github: {
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            callbackURL: process.env.GITHUB_CALLBACK_URL
        }
    },
    walletAuth: {
        signatureMessage: 'Welcome to SolKey! Sign this message to secure your secrets.',
        signatureExpiry: '5m'
    }
};

module.exports = config;