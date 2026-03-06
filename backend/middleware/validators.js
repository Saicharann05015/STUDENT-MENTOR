const Joi = require('joi');

// ---------- Auth Schemas ----------
const registerSchema = Joi.object({
    name: Joi.string().trim().min(2).max(100).required().messages({
        'string.min': 'Name must be at least 2 characters',
        'string.max': 'Name must not exceed 100 characters',
        'any.required': 'Name is required',
    }),
    email: Joi.string().email().lowercase().required().messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required',
    }),
    password: Joi.string().min(8).max(128).required().messages({
        'string.min': 'Password must be at least 8 characters',
        'any.required': 'Password is required',
    }),
});

const loginSchema = Joi.object({
    email: Joi.string().email().lowercase().required().messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required',
    }),
    password: Joi.string().required().messages({
        'any.required': 'Password is required',
    }),
});

// ---------- User Schemas ----------
const updateProfileSchema = Joi.object({
    name: Joi.string().trim().min(2).max(100).messages({
        'string.min': 'Name must be at least 2 characters',
    }),
    avatar: Joi.string().uri().allow('').messages({
        'string.uri': 'Avatar must be a valid URL',
    }),
});

// ---------- Chat Schemas ----------
const createChatSchema = Joi.object({
    title: Joi.string().trim().max(200).optional(),
    context: Joi.string()
        .valid('general', 'skill-diagnosis', 'roadmap', 'doubt-solving')
        .optional(),
});

const sendMessageSchema = Joi.object({
    content: Joi.string().trim().min(1).max(5000).required().messages({
        'string.min': 'Message cannot be empty',
        'string.max': 'Message must not exceed 5000 characters',
        'any.required': 'Message content is required',
    }),
});

// ---------- Skill Schemas ----------
const createDiagnosisSchema = Joi.object({
    category: Joi.string().trim().required().messages({
        'any.required': 'Category is required',
    }),
    results: Joi.array()
        .items(
            Joi.object({
                skill: Joi.string().required(),
                score: Joi.number().min(0).max(100).required(),
                level: Joi.string()
                    .valid('beginner', 'intermediate', 'advanced', 'expert')
                    .required(),
                feedback: Joi.string().allow('').optional(),
            })
        )
        .min(1)
        .required()
        .messages({
            'array.min': 'At least one skill result is required',
            'any.required': 'Results are required',
        }),
});

// ---------- Roadmap Schemas ----------
const createRoadmapSchema = Joi.object({
    title: Joi.string().trim().min(2).max(200).required().messages({
        'any.required': 'Roadmap title is required',
    }),
    description: Joi.string().max(1000).optional(),
    category: Joi.string().trim().required().messages({
        'any.required': 'Category is required',
    }),
    targetLevel: Joi.string()
        .valid('beginner', 'intermediate', 'advanced', 'expert')
        .optional(),
    milestones: Joi.array()
        .items(
            Joi.object({
                title: Joi.string().required(),
                description: Joi.string().optional(),
                resources: Joi.array()
                    .items(
                        Joi.object({
                            title: Joi.string().required(),
                            url: Joi.string().uri().required(),
                            type: Joi.string()
                                .valid('video', 'article', 'course', 'project', 'other')
                                .optional(),
                        })
                    )
                    .optional(),
                estimatedDuration: Joi.string().optional(),
                order: Joi.number().required(),
            })
        )
        .optional(),
    estimatedCompletion: Joi.string().optional(),
});

const updateRoadmapSchema = Joi.object({
    title: Joi.string().trim().min(2).max(200).optional(),
    description: Joi.string().max(1000).optional(),
    targetLevel: Joi.string()
        .valid('beginner', 'intermediate', 'advanced', 'expert')
        .optional(),
    isActive: Joi.boolean().optional(),
});

// ---------- Progress Schemas ----------
const logActivitySchema = Joi.object({
    type: Joi.string()
        .valid('chat', 'diagnosis', 'milestone', 'roadmap', 'login')
        .required()
        .messages({ 'any.required': 'Activity type is required' }),
    description: Joi.string().max(500).optional(),
    metadata: Joi.object().optional(),
});

const addStudyTimeSchema = Joi.object({
    minutes: Joi.number().min(1).max(1440).required().messages({
        'number.min': 'Study time must be at least 1 minute',
        'number.max': 'Study time cannot exceed 24 hours',
        'any.required': 'Minutes is required',
    }),
});

module.exports = {
    registerSchema,
    loginSchema,
    updateProfileSchema,
    createChatSchema,
    sendMessageSchema,
    createDiagnosisSchema,
    createRoadmapSchema,
    updateRoadmapSchema,
    logActivitySchema,
    addStudyTimeSchema,
};
