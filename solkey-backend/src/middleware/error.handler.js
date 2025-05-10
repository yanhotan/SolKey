const errorHandler = (err, req, res, next) => {
    // Log the error for debugging
    console.error('Error occurred:', err);

    // Check if headers are already sent
    if (res.headersSent) {
        return next(err);
    }

    // Set default error status and message
    let status = err.status || 500;
    let message = err.message || 'Internal server error';

    // Handle specific Mongoose errors
    if (err.name === 'ValidationError') {
        status = 400;
        message = Object.values(err.errors)
            .map(error => error.message)
            .join(', ');
    } else if (err.name === 'CastError') {
        status = 400;
        message = 'Invalid ID format';
    } else if (err.code === 11000) {
        status = 409;
        message = 'Duplicate entry found';
    }

    // Always send JSON response
    res.status(status).json({
        error: message,
        status,
        timestamp: new Date().toISOString()
    });
};

module.exports = errorHandler;
