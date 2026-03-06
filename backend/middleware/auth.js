const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../config/env');
const logger = require('../utils/logger');

// Protect routes — verify JWT token
exports.protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            data: null,
            message: 'Not authorized — no token provided',
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = await User.findById(decoded.id);

        if (!req.user) {
            return res.status(401).json({
                success: false,
                data: null,
                message: 'Not authorized — invalid or expired token',
            });
        }

        next();
    } catch (error) {
        logger.warn(`Auth failed: ${error.message} — IP: ${req.ip}`);
        return res.status(401).json({
            success: false,
            data: null,
            message: 'Not authorized — invalid or expired token',
        });
    }
};

// Authorize by role
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            logger.warn(`Unauthorized access attempt by user ${req.user.id} (role: ${req.user.role})`);
            return res.status(403).json({
                success: false,
                data: null,
                message: `Role '${req.user.role}' is not authorized to access this route`,
            });
        }
        next();
    };
};
