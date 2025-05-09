class AppError extends Error {
    constructor(message, status) {
        super(message);
        this.status = status;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

const handleSolanaError = (err) => {
    if (err.message.includes('Invalid public key')) {
        return new AppError('Invalid wallet address provided', 400);
    }
    if (err.message.includes('Transaction failed')) {
        return new AppError('Solana transaction failed. Please try again', 400);
    }
    return new AppError('Solana network error. Please try again later', 503);
};

const handleMongoError = (err) => {
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        return new AppError(`${field} already exists`, 400);
    }
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(val => val.message);
        return new AppError(`Invalid input: ${errors.join(', ')}`, 400);
    }
    return new AppError('Database error. Please try again later', 503);
};

const handleJWTError = (err) => {
    if (err.name === 'JsonWebTokenError') {
        return new AppError('Invalid token. Please log in again', 401);
    }
    if (err.name === 'TokenExpiredError') {
        return new AppError('Token expired. Please log in again', 401);
    }
    return new AppError('Authentication error', 401);
};

const errorHandler = (err, req, res, next) => {
    err.status = err.status || 500;

    // Log error for debugging in development
    if (process.env.NODE_ENV === 'development') {
        console.error('Error Stack:', err.stack);
    } else {
        // Log to monitoring service in production
        console.error('Error:', {
            message: err.message,
            path: req.path,
            timestamp: new Date().toISOString(),
            status: err.status
        });
    }

    // Handle specific error types
    let error = err;
    if (err.name && err.name.includes('Web3')) {
        error = handleSolanaError(err);
    } else if (err.name && (err.name.includes('Mongo') || err.name === 'ValidationError')) {
        error = handleMongoError(err);
    } else if (err.name && err.name.includes('JWT')) {
        error = handleJWTError(err);
    }

    // Send error response
    res.status(error.status).json({
        success: false,
        message: error.message,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
};

module.exports = {
    AppError,
    errorHandler
};