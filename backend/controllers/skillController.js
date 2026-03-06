const SkillService = require('../services/skillService');
const DiagnosisEngine = require('../services/diagnosisEngine');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

// ===== Diagnosis Engine Endpoints =====

// @desc    Start a new AI-powered skill diagnosis
// @route   POST /api/v1/skills/diagnose/start
exports.startDiagnosis = asyncHandler(async (req, res) => {
    const { category } = req.body;
    const result = await DiagnosisEngine.startDiagnosis(req.user.id, category);
    ApiResponse.created(res, { data: result, message: 'Diagnosis started — answer the first question' });
});

// @desc    Get current question in an active diagnosis
// @route   GET /api/v1/skills/diagnose/:id/current
exports.getCurrentQuestion = asyncHandler(async (req, res) => {
    const result = await DiagnosisEngine.getCurrentQuestion(req.params.id, req.user.id);
    ApiResponse.success(res, { data: result, message: 'Current question retrieved' });
});

// @desc    Submit an answer to the current question
// @route   POST /api/v1/skills/diagnose/:id/answer
exports.submitAnswer = asyncHandler(async (req, res) => {
    const { answer } = req.body;
    const result = await DiagnosisEngine.submitAnswer(req.params.id, req.user.id, answer);

    const message = result.completed
        ? 'Diagnosis completed — here are your results!'
        : `Answer evaluated — moving to question ${result.progress}`;

    ApiResponse.success(res, { data: result, message });
});

// ===== Standard CRUD Endpoints =====

// @desc    Get all diagnoses for the user
// @route   GET /api/v1/skills
exports.getUserDiagnoses = asyncHandler(async (req, res) => {
    const result = await SkillService.getUserDiagnoses(req.user.id, req.query);
    ApiResponse.success(res, { data: result, message: 'Diagnoses retrieved' });
});

// @desc    Get single diagnosis by ID
// @route   GET /api/v1/skills/:id
exports.getDiagnosisById = asyncHandler(async (req, res) => {
    const diagnosis = await SkillService.getDiagnosisById(req.params.id, req.user.id);
    ApiResponse.success(res, { data: diagnosis, message: 'Diagnosis retrieved' });
});

// @desc    Get latest diagnosis for a category
// @route   GET /api/v1/skills/latest/:category
exports.getLatestByCategory = asyncHandler(async (req, res) => {
    const diagnosis = await SkillService.getLatestByCategory(req.user.id, req.params.category);
    ApiResponse.success(res, { data: diagnosis, message: 'Latest diagnosis retrieved' });
});
