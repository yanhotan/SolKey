const { AppError } = require('./error.middleware');

const validateRequestBody = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body);
        if (error) {
            throw new AppError(error.details[0].message, 400);
        }
        next();
    };
};

const validateRequestParams = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.params);
        if (error) {
            throw new AppError(error.details[0].message, 400);
        }
        next();
    };
};

const securityHeaders = (req, res, next) => {
    // HSTS
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');
    
    // XSS protection
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Referrer policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Permission policy
    res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');

    next();
};

const validateContentType = (req, res, next) => {
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
        const contentType = req.headers['content-type'];
        if (!contentType || !contentType.includes('application/json')) {
            throw new AppError('Content-Type must be application/json', 415);
        }
    }
    next();
};

const validateOrigin = (allowedOrigins) => {
    return (req, res, next) => {
        const origin = req.headers.origin;
        if (origin && !allowedOrigins.includes(origin)) {
            throw new AppError('Invalid origin', 403);
        }
        next();
    };
};

const sanitizeRequestBody = (req, res, next) => {
    if (req.body) {
        // Remove any potential NoSQL injection characters
        const sanitized = JSON.parse(
            JSON.stringify(req.body).replace(/[${}]/g, '')
        );
        req.body = sanitized;
    }
    next();
};

const validateRequestSize = (maxSize = '1mb') => {
    return (req, res, next) => {
        const contentLength = parseInt(req.headers['content-length'], 10);
        if (contentLength > parseInt(maxSize, 10)) {
            throw new AppError('Request entity too large', 413);
        }
        next();
    };
};

module.exports = {
    validateRequestBody,
    validateRequestParams,
    securityHeaders,
    validateContentType,
    validateOrigin,
    sanitizeRequestBody,
    validateRequestSize
};