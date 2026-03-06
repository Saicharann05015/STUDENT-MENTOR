const rateLimit = require('express-rate-limit');

// General API rate limiter
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        data: null,
        message: 'Too many requests, please try again after 15 minutes',
    },
});

// Stricter limiter for auth endpoints (login, register)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 15,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        data: null,
        message: 'Too many auth attempts, please try again after 15 minutes',
    },
});

// Stricter limiter for AI chat
const aiChatLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        data: null,
        message: 'Too many chat messages, please slow down and learn at your own pace! 🐢',
    },
});

// Very strict limiter for expensive AI generative operations (Roadmaps, Recommendations)
const aiRoadmapLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10,                 // 10 roadmaps/recommendations per 5 mins
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        data: null,
        message: 'You are generating too many roadmaps or recommendations. Take some time to study what you have! 📚',
    },
});

module.exports = { apiLimiter, authLimiter, aiChatLimiter, aiRoadmapLimiter };
