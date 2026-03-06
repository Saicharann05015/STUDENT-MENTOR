const express = require('express');
const router = express.Router();
const {
    generateRoadmap,
    refineRoadmap,
    getUserRoadmaps,
    getRoadmapById,
    updateRoadmap,
    completeMilestone,
    completeTask,
    completeProject,
    deleteRoadmap,
} = require('../controllers/roadmapController');
const { protect } = require('../middleware/auth');
const { aiRoadmapLimiter } = require('../middleware/rateLimiter');
const validate = require('../middleware/validate');
const Joi = require('joi');

// Validation schemas
const generateRoadmapSchema = Joi.object({
    goal: Joi.string().trim().min(3).max(500).required().messages({
        'any.required': 'Learning goal is required',
    }),
    currentLevel: Joi.string()
        .valid('beginner', 'intermediate', 'advanced', 'expert')
        .required()
        .messages({ 'any.required': 'Current skill level is required' }),
    timeline: Joi.string().trim().min(1).max(100).required().messages({
        'any.required': 'Timeline is required (e.g., "3 months", "8 weeks")',
    }),
    dailyLearningTime: Joi.string().trim().min(1).max(100).required().messages({
        'any.required': 'Daily learning time is required (e.g., "2 hours")',
    }),
    category: Joi.string().trim().min(1).max(100).required().messages({
        'any.required': 'Category is required (e.g., "JavaScript", "Python")',
    }),
});

const refineRoadmapSchema = Joi.object({
    feedback: Joi.string().trim().min(3).max(2000).required().messages({
        'any.required': 'Feedback is required to refine the roadmap',
    }),
});

const updateRoadmapSchema = Joi.object({
    title: Joi.string().trim().min(2).max(200).optional(),
    description: Joi.string().max(1000).optional(),
    isActive: Joi.boolean().optional(),
});

router.use(protect);

// AI generation
router.post('/generate', aiRoadmapLimiter, validate(generateRoadmapSchema), generateRoadmap);
router.put('/:id/refine', aiRoadmapLimiter, validate(refineRoadmapSchema), refineRoadmap);

// Completion endpoints
router.put('/:id/milestones/:milestoneId/complete', completeMilestone);
router.put('/:id/milestones/:milestoneId/tasks/:taskId/complete', completeTask);
router.put('/:id/milestones/:milestoneId/projects/:projectId/complete', completeProject);

// Standard CRUD
router.route('/').get(getUserRoadmaps);
router.route('/:id').get(getRoadmapById).put(validate(updateRoadmapSchema), updateRoadmap).delete(deleteRoadmap);

module.exports = router;
