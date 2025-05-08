// Import necessary modules
const jwt = require('jsonwebtoken');
const config = require('../config/auth');

// Middleware function to authenticate requests using JWT
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1]; // Get token from Authorization header
    if (!token) return res.sendStatus(401); // If no token, return Unauthorized

    jwt.verify(token, config.secret, (err, user) => {
        if (err) return res.sendStatus(403); // If token is invalid, return Forbidden
        req.user = user; // Attach user to request object
        next(); // Proceed to the next middleware or route handler
    });
};

// Export the middleware function
module.exports = {
    authenticateToken,
};