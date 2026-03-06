const express = require('express');
const router = express.Router();
const {
    startDiagnosis,
    getCurrentQuestion,
    submitAnswer,
    getUserDiagnoses,
    getDiagnosisById,
    getLatestByCategory,
} = require('../controllers/skillController');
const { protect } = require('../middleware/auth');
const { aiChatLimiter } = require('../middleware/rateLimiter');
const validate = require('../middleware/validate');
const Joi = require('joi');

// Validation schemas
const startDiagnosisSchema = Joi.object({
    category: Joi.string().trim().min(1).max(100).required().messages({
        'any.required': 'Category is required (e.g., "JavaScript", "Python", "Data Structures")',
    }),
});

const submitAnswerSchema = Joi.object({
    answer: Joi.string().trim().min(1).max(10000).required().messages({
        'string.min': 'Answer cannot be empty',
        'string.max': 'Answer must not exceed 10000 characters',
        'any.required': 'Answer is required',
    }),
});

router.use(protect);

// Diagnosis engine endpoints
router.post('/diagnose/start', validate(startDiagnosisSchema), startDiagnosis);
router.get('/diagnose/:id/current', getCurrentQuestion);
router.post('/diagnose/:id/answer', aiChatLimiter, validate(submitAnswerSchema), submitAnswer);

// Standard endpoints
router.get('/', getUserDiagnoses);
router.get('/latest/:category', getLatestByCategory);
router.get('/:id', getDiagnosisById);

module.exports = router;
