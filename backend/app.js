const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const { NODE_ENV } = require('./config/env');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter, authLimiter, aiChatLimiter, aiRoadmapLimiter } = require('./middleware/rateLimiter');
const logger = require('./utils/logger');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');
const skillRoutes = require('./routes/skillRoutes');
const roadmapRoutes = require('./routes/roadmapRoutes');
const progressRoutes = require('./routes/progressRoutes');
const aiRoutes = require('./routes/aiRoutes');

const app = express();

// --------------- Security Middleware ---------------
app.use(helmet());                                    // Security headers
// Build CORS origins from environment
const corsOrigins = [process.env.CLIENT_URL || 'http://localhost:3000'];
if (process.env.CORS_ORIGINS) {
    corsOrigins.push(...process.env.CORS_ORIGINS.split(',').map(o => o.trim()));
}

app.use(cors({                                        // CORS
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(mongoSanitize());                             // Prevent NoSQL injection
app.use(hpp());                                       // Prevent HTTP parameter pollution
app.use(express.json({ limit: '1mb' }));              // Body parser with 1mb limit
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// --------------- Logging ---------------
if (NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined', { stream: logger.stream }));
}

// --------------- Rate Limiting ---------------
app.use('/api/', apiLimiter);                         // Global API rate limit
app.use('/api/v1/auth', authLimiter);                 // Stricter auth rate limit

// --------------- API Routes ---------------
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/skills', skillRoutes);
app.use('/api/v1/roadmaps', roadmapRoutes);
app.use('/api/v1/progress', progressRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/api/v1/health', (req, res) => {
    res.status(200).json({
        success: true,
        data: { status: 'ok', timestamp: new Date().toISOString() },
        message: 'Server is healthy',
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        data: null,
        message: `Route ${req.originalUrl} not found`,
    });
});

// --------------- Error Handling ---------------
app.use(errorHandler);

module.exports = app;
