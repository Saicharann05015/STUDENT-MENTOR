const Joi = require('joi');
const logger = require('../utils/logger');

// Schema defining required env vars and their types
const envSchema = Joi.object({
    NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
    PORT: Joi.number().default(5000),
    MONGO_URI: Joi.string().required().messages({
        'any.required': 'MONGO_URI is required in .env',
    }),
    JWT_SECRET: Joi.string().min(8).required().messages({
        'string.min': 'JWT_SECRET must be at least 8 characters',
        'any.required': 'JWT_SECRET is required in .env',
    }),
    JWT_EXPIRE: Joi.string().default('7d'),
    AI_API_KEY: Joi.string().allow('').default(''),
    AI_MODEL: Joi.string().default('gemini-pro'),
    CLIENT_URL: Joi.string().uri().default('http://localhost:3000'),
    EMAIL_SERVICE: Joi.string().allow('').default(''),
    EMAIL_USER: Joi.string().allow('').default(''),
    EMAIL_PASS: Joi.string().allow('').default(''),
}).unknown(true); // allow other env vars to pass through

const validateEnv = () => {
    const { error, value } = envSchema.validate(process.env, {
        abortEarly: false,
        stripUnknown: false,
    });

    if (error) {
        const messages = error.details.map((d) => `  ✖ ${d.message}`).join('\n');
        logger.error(`❌ Environment validation failed:\n${messages}`);
        process.exit(1);
    }

    // Warn about missing optional but important vars
    if (!value.EMAIL_USER || !value.EMAIL_PASS) {
        logger.warn('⚠️  EMAIL_USER / EMAIL_PASS not set — password reset emails will fail');
    }

    logger.info('✅ Environment variables validated');
    return value;
};

module.exports = validateEnv;
