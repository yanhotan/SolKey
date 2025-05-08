// Configuration settings for authentication
const config = {
    jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret', // Secret key for JWT signing
    oauth: {
        provider: 'your_oauth_provider', // OAuth provider (e.g., Google, GitHub)
        clientId: process.env.OAUTH_CLIENT_ID || 'your_client_id', // Client ID for OAuth
        clientSecret: process.env.OAUTH_CLIENT_SECRET || 'your_client_secret', // Client secret for OAuth
        callbackUrl: process.env.OAUTH_CALLBACK_URL || 'http://localhost:3000/auth/callback' // Callback URL after authentication
    }
};

module.exports = config;