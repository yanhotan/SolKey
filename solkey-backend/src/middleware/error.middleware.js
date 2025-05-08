// Error handling middleware for the application
// This middleware captures errors from the application and sends a standardized response to the client.

const errorHandler = (err, req, res, next) => {
    // Log the error details for debugging
    console.error(err.stack);

    // Set the response status code
    res.status(err.status || 500);

    // Send the error response
    res.json({
        success: false,
        message: err.message || 'Internal Server Error',
    });
};

// Export the error handling middleware
module.exports = errorHandler;