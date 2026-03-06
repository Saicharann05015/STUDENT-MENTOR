const express = require('express');
const router = express.Router();
const { aiChat, newAiChat } = require('../controllers/aiController');
const { getRecommendations } = require('../controllers/recommendationController');
const { protect } = require('../middleware/auth');
const { aiChatLimiter, aiRoadmapLimiter } = require('../middleware/rateLimiter');
const validate = require('../middleware/validate');
const Joi = require('joi');

const validContexts = ['general', 'skill-diagnosis', 'roadmap', 'doubt-solving'];
const validLevels = ['beginner', 'intermediate', 'advanced', 'expert'];

// Validation schemas
const aiChatSchema = Joi.object({
    message: Joi.string().trim().min(1).max(5000).required().messages({
        'string.min': 'Message cannot be empty',
        'string.max': 'Message must not exceed 5000 characters',
        'any.required': 'Message is required',
    }),
    chatId: Joi.string().optional(),
    context: Joi.string().valid(...validContexts).optional(),
    level: Joi.string().valid(...validLevels).optional(),
});

const newAiChatSchema = Joi.object({
    message: Joi.string().trim().min(1).max(5000).required().messages({
        'any.required': 'Message is required',
    }),
    context: Joi.string().valid(...validContexts).optional(),
    level: Joi.string().valid(...validLevels).optional(),
    title: Joi.string().trim().max(200).optional(),
});

router.use(protect);

router.post('/chat', aiChatLimiter, validate(aiChatSchema), aiChat);
router.post('/chat/new', aiChatLimiter, validate(newAiChatSchema), newAiChat);
router.get('/recommendations', aiRoadmapLimiter, getRecommendations);

module.exports = router;
