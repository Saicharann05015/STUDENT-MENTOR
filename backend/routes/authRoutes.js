const express = require('express');
const router = express.Router();
const {
    register,
    login,
    getMe,
    forgotPassword,
    resetPassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
    registerSchema,
    loginSchema,
} = require('../middleware/validators');
const Joi = require('joi');

// Validation schemas for new routes
const forgotPasswordSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'any.required': 'Email is required',
        'string.email': 'Please enter a valid email',
    }),
});

const resetPasswordSchema = Joi.object({
    password: Joi.string().min(8).required().messages({
        'any.required': 'New password is required',
        'string.min': 'Password must be at least 8 characters',
    }),
});

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/me', protect, getMe);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.put('/reset-password/:token', validate(resetPasswordSchema), resetPassword);

module.exports = router;
